"use client";

import { useEffect, useRef, useState, Fragment, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase";
import { ILLO_TOOL_BY_ID } from "@/lib/illo/tools";
import { callClaude, callGateway, callMedia } from "@/lib/illo/claude";
import { modelForFeature } from "@/lib/illo/modelMatrix";
import { getLocalKey, setLocalKey, pullCloudKey } from "@/lib/illo/key";
import {
  ILLO_FEATURES, ILLO_FEATURE_BY_ID, ILLO_GROUP_ORDER, ILLO_DEFAULT_ENABLED,
  loadIlloEnabled, saveIlloEnabled, initialConsonant, toInitials, type IlloFeature,
} from "@/lib/illo/features";
import {
  flowDetailForTool, STEP_PALETTE, loadCustomFlow, saveCustomFlow, clearCustomFlow, hasCustomFlow,
  type FlowStepDetail,
} from "@/lib/illo/automations";
import { listResults, saveResult, deleteResult, clearResults, downloadText, type IlloResult } from "@/lib/illo/history";
import {
  listUserFlows, saveUserFlow, deleteUserFlow, blankFlow, newId,
  listUserTemplates, saveUserTemplate, deleteUserTemplate, instantiateTemplate,
  type UserFlow, type FlowNode, type Side, type SavedTemplate,
} from "@/lib/illo/flows";
import { FLOW_TEMPLATES, templateToFlow } from "@/lib/illo/flowTemplates";
import { API_CATALOG, COST_TIPS, ROUTER_TIP, ROLE_LABEL, type ApiEntry } from "@/lib/illo/apiCatalog";
import { SLOT_LABEL, slotForNode, optionsForNode, defaultModelFor, modelLabel } from "@/lib/illo/nodeModels";
import { listDocs, saveDoc, deleteDoc, listDepts, saveDept, deleteDept, DEPT_EMOJIS, type SavedDoc, type Dept } from "@/lib/illo/workspace";
import { PLANS } from "@/lib/illo/plan";
import { getTone, saveTone } from "@/lib/illo/tone";
import ProjectTopBar from "@/components/layout/ProjectTopBar";
import OrgControlTower from "@/components/illo/OrgControlTower";
import Automation from "@/components/illo/Automation";
import {
  ArrowLeft, KeyRound, Loader2, Copy, Check, Sparkles, Download,
  Menu, X, Pencil, Plus, LogOut, Sun, Moon, Send, Lock, GripVertical, ChevronUp, ChevronDown, Search, ExternalLink,
} from "lucide-react";

const FREE_LIMIT = 30; // 무료 하루 호출 수

export default function IlloWebClient() {
  const { status, session, logout } = useAuth();
  const { setTheme } = useTheme();

  // EXE처럼 라이트가 기본 — 첫 방문 시 라이트로 맞춤(이후 사용자가 바꾸면 그 선택 유지)
  useEffect(() => {
    try {
      if (!localStorage.getItem("illo.themeInit")) {
        setTheme("light");
        localStorage.setItem("illo.themeInit", "1");
      }
    } catch { /* */ }
  }, [setTheme]);

  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [pulling, setPulling] = useState(false);
  const [savingKey, setSavingKey] = useState(false); // 키 저장 전 실제 호출로 검증하는 동안

  const [enabled, setEnabled] = useState<string[]>(ILLO_DEFAULT_ENABLED);
  const [view, setView] = useState<string>("builder"); // 메인 = AI 비서 관제탑
  const [mobileNav, setMobileNav] = useState(false);

  const [quota, setQuota] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyErr, setKeyErr] = useState("");
  const [devPreview, setDevPreview] = useState(false); // localhost 전용: 로그인 없이 화면 확인

  const isLocalhost = typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(window.location.hostname);

  const free = !key; // 본인 키 없으면 무료(공용 키) 모드

  // 키 + 켠 기능 로드
  useEffect(() => {
    setEnabled(loadIlloEnabled());
    if (status !== "authenticated") return;
    const lk = getLocalKey();
    if (lk) { setKey(lk); return; }
    pullCloudKey().then((k) => { if (k) { setKey(k); setLocalKey(k); } }).catch(() => {});
  }, [status]);

  // ── 공용 Claude 호출 (무료/내키 자동 + 횟수 갱신) ──
  // 기능(featureId)별로 미리 매칭된 모델을 사용 — 소비자에겐 노출하지 않음.
  // 무료 사용자는 서버 프록시가 Haiku로 고정(비용 관리). 내 키/유료는 매트릭스대로.
  // 모든 실행은 게이트웨이 경유 — 패키지는 여러 AI(리서치→작성→검토→이미지/영상)를 연쇄.
  async function runAI(prompt: string, featureId: string, rawInput?: string) {
    const isAssistant = featureId === "assistant";
    const maxTokens = isAssistant ? 2000 : 4096;

    // ── ① 본인 키가 있으면: 게이트웨이를 우회해 Claude 직접 호출 ──
    // 게이트웨이는 운영자 공용 키로 돌아 (a) 하루 한도에 묶이고 (b) 그 키가 막히면 전 기능이 함께 죽는다.
    // 본인 키는 사용자가 비용을 직접 부담하므로 한도가 없다 → UI의 "내 키로 무제한"이 실제로 성립.
    // 모델은 modelForFeature가 기능별로 고른다(대부분 Haiku=저렴). 비-Claude 기능은 Haiku로 폴백.
    // ⚠️ 직접 경로는 텍스트만 — 게이트웨이의 '패키지'(리서치→작성→검토→이미지) 연쇄는 타지 않는다.
    if (key) {
      const r = await callClaude({
        apiKey: key,
        prompt: rawInput ? `${prompt}\n\n--- 입력 ---\n${rawInput}` : prompt,
        model: modelForFeature(featureId),
        maxTokens,
      });
      return { text: r.text, image: null, video: null };
    }

    // ── ② 키가 없으면: 무료 공용 게이트웨이(운영자 키) — 로그인 토큰으로 하루 한도 내 ──
    const u = getFirebaseAuth().currentUser;
    const idToken = u ? await u.getIdToken() : undefined;
    if (!idToken) throw new Error("LOGIN_REQUIRED");
    const r = await callGateway({
      idToken, featureId, prompt,
      kind: isAssistant ? "text" : "package",
      input: rawInput || "",
      maxTokens,
    });
    if (typeof r.quotaRemaining === "number") setQuota(r.quotaRemaining);
    return r;
  }

  // ── 자동화 전용 실행 ──
  // 게이트웨이(runAI)는 기능(featureId)별로 모델이 고정돼 있어서, 직원마다 모델이 다른 자동화엔 맞지 않는다.
  // 여기선 직원에게 배정된 모델을 그대로 지정해 호출: 본인 키가 있으면 브라우저에서 Claude 직접 호출(무제한),
  // 키가 없으면 로그인 토큰으로 무료 프록시(하루 한도).
  async function callModel(prompt: string, model: string, maxTokens = 2000): Promise<string> {
    const u = getFirebaseAuth().currentUser;
    const idToken = u ? await u.getIdToken() : undefined;
    if (!key && !idToken) throw new Error("LOGIN_REQUIRED");
    const r = await callClaude({ apiKey: key || undefined, idToken, prompt, model, maxTokens });
    if (typeof r.quotaRemaining === "number") setQuota(r.quotaRemaining);
    return r.text;
  }

  function goView(id: string) { setView(id); setMobileNav(false); }

  function toggleFeature(id: string) {
    const f = ILLO_FEATURE_BY_ID[id];
    if (!f || f.core) return;
    setEnabled((prev) => {
      const has = prev.includes(id);
      const next = has ? prev.filter((x) => x !== id) : [...prev, id];
      saveIlloEnabled(next);
      if (has && view === id) setView("home");
      return next;
    });
  }
  function reorder(from: number, to: number) {
    setEnabled((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      saveIlloEnabled(next);
      return next;
    });
  }

  // 키는 이제 실제 실행 경로다(runAI가 본인 키로 직접 호출) — 틀린 키를 저장하면 도구 전부가
  // 조용히 죽고 사용자는 원인을 모른다. 그래서 저장 전에 최소 호출로 실제 동작을 확인한다.
  async function saveKey() {
    const k = keyInput.trim();
    if (!k || savingKey) return;
    setSavingKey(true); setKeyErr("");
    try {
      await callClaude({ apiKey: k, prompt: "hi", model: "claude-haiku-4-5", maxTokens: 1 });
      setLocalKey(k); setKey(k); setKeyInput(""); setShowKey(false); setKeyErr("");
    } catch (e) {
      setKeyErr((e as Error).message || "이 키로 호출하지 못했어요. 키를 다시 확인해 주세요.");
    } finally {
      setSavingKey(false);
    }
  }
  function removeKey() { setLocalKey(""); setKey(""); }
  async function tryPull() {
    setPulling(true); setKeyErr("");
    const k = await pullCloudKey();
    setPulling(false);
    if (k) { setLocalKey(k); setKey(k); setShowKey(false); }
    else setKeyErr("동기화된 키를 찾지 못했어요. 다른 기기에서 저장한 적이 없다면 아래에 직접 입력해 주세요.");
  }

  // ── 오버레이 (가이드 / 키 넣기) ──
  const overlays = (
    <>
      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
      {showKey && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowKey(false)}>
          <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-orange-950/30 grid place-items-center mx-auto mb-4"><KeyRound className="w-6 h-6 text-primary" /></div>
            <h2 className="text-lg font-extrabold text-center text-foreground mb-1.5">내 Claude 키 넣기 (무제한)</h2>
            <p className="text-[13px] text-center text-muted-foreground mb-5 break-keep">키를 넣으면 무료 한도 없이 쓸 수 있어요. 키는 회원님 브라우저에만 저장됩니다.</p>
            <button onClick={() => { setShowKey(false); setShowGuide(true); }} className="w-full mb-3 py-2.5 rounded-xl text-sm font-bold text-primary dark:text-[#FBAA60] border border-primary/40">🔰 키 만드는 법 모르겠어요 (가이드)</button>
            <button onClick={tryPull} disabled={pulling} className="w-full mb-2.5 py-2.5 rounded-xl border border-border text-muted-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 다른 기기에서 저장한 키 불러오기
            </button>
            <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveKey()} placeholder="sk-ant-... (키 붙여넣기)" className="w-full mb-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-border text-sm font-mono focus:outline-none focus:border-primary" />
            <button onClick={saveKey} disabled={savingKey || !keyInput.trim()}
              className="w-full py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {savingKey ? <><Loader2 className="w-4 h-4 animate-spin" /> 키 확인 중…</> : "저장"}
            </button>
            {keyErr && <p className="text-xs text-rose-500 mt-3 text-center leading-relaxed">{keyErr}</p>}
          </div>
        </div>
      )}
    </>
  );

  // ── 로그인 게이트 ──
  if (status === "loading") {
    return <Centered><Loader2 className="w-6 h-6 animate-spin text-primary" /></Centered>;
  }
  if (status === "unauthenticated" && !devPreview) {
    return (
      <Centered>
        <IlloLogin onShowGuide={() => setShowGuide(true)} onDevPreview={isLocalhost ? () => setDevPreview(true) : undefined} />
        {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
      </Centered>
    );
  }

  const tool = ILLO_FEATURE_BY_ID[view]?.kind === "tool" ? ILLO_TOOL_BY_ID[view] : null;
  const userName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0] : "사장님");

  // ── 메인 셸 (EXE와 동일 구조: 사이드바 + 뷰) ──
  return (
    <>
    <ProjectTopBar name="대리인 : AI비서" emoji="🟧" />
    <div className="flex h-[calc(100vh-3rem)] mt-12 w-full bg-background font-sans overflow-hidden">
      {/* 데스크톱 사이드바 */}
      <div className="hidden md:flex">
        <IlloSidebar
          enabled={enabled} view={view}
          onView={goView}
          onReorder={reorder} onRemove={toggleFeature}
          onLogout={logout} userName={userName} userEmail={session?.user?.email || ""}
        />
      </div>

      {/* 모바일 드로어 */}
      {mobileNav && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNav(false)} />
          <div className="relative">
            <IlloSidebar
              enabled={enabled} view={view}
              onView={goView}
              onReorder={reorder} onRemove={toggleFeature}
              onLogout={logout} userName={userName} userEmail={session?.user?.email || ""}
            />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* 모바일 상단바 */}
        <header className="md:hidden flex items-center gap-2 px-4 h-14 border-b border-border bg-card shrink-0">
          <button onClick={() => setMobileNav(true)} className="p-1.5 -ml-1.5 text-muted-foreground"><Menu className="w-5 h-5" /></button>
          <img src="/illo-logo.png" alt="대리인 : AI비서" className="w-7 h-7 rounded-lg" />
          <span className="font-extrabold text-[15px] truncate min-w-0"><span className="text-primary">대리인</span><span className="text-muted-foreground"> : AI비서</span></span>
          {free && <span className="ml-auto text-[11px] font-semibold text-muted-foreground">남은 <b className="text-primary">{quota ?? FREE_LIMIT}</b>/{FREE_LIMIT}</span>}
        </header>

        {view === "home" && <Home userName={userName} enabled={enabled} onView={goView} free={free} quota={quota} onShowKey={() => setShowKey(true)} />}
        {view === "assistant" && <Assistant runAI={runAI} free={free} quota={quota} onShowKey={() => setShowKey(true)} userName={userName} />}
        {view === "features" && <FeatureManager enabled={enabled} onToggle={toggleFeature} onView={goView} />}
        {view === "image" && <BasicGen kind="image" free={free} quota={quota} setQuota={setQuota} />}
        {view === "video" && <BasicGen kind="video" free={free} quota={quota} setQuota={setQuota} />}
        {view === "builder" && <OrgControlTower embedded />}
        {view === "automation" && (
          <Automation
            userKey={session?.user?.email || "local"}
            callModel={callModel}
            free={free} quota={quota}
            onShowKey={() => setShowKey(true)}
            onView={goView}
          />
        )}
        {view === "catalog" && <ApiCatalog />}
        {view === "docs" && <Workspace userKey={session?.user?.email || "local"} />}
        {view === "history" && <HistoryView onBack={() => goView("home")} />}
        {view === "settings" && <Settings keyVal={key} free={free} onShowKey={() => setShowKey(true)} onRemoveKey={removeKey} onLogout={logout} userName={userName} userEmail={session?.user?.email || ""} />}
        {tool && <ToolView key={view} tool={tool} runAI={runAI} free={free} quota={quota} onShowKey={() => setShowKey(true)} onBack={() => goView("home")} />}
      </main>

      {overlays}
    </div>
    </>
  );
}

/* ─────────────────────────── 사이드바 ─────────────────────────── */
function IlloSidebar({
  enabled, view, onView, onReorder, onRemove, onLogout, userName, userEmail,
}: {
  enabled: string[]; view: string;
  onView: (id: string) => void;
  onReorder: (from: number, to: number) => void; onRemove: (id: string) => void;
  onLogout: () => void; userName: string; userEmail: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dragIdx = useRef<number | null>(null);
  // 사이드바 메뉴 행 — 보관함(features)은 아래 "기능 추가·관리" 버튼으로 진입하므로 행에선 제외
  const items = enabled.map((id) => ILLO_FEATURE_BY_ID[id]).filter((f) => f && f.id !== "features") as IlloFeature[];

  return (
    <aside className="w-60 shrink-0 h-full bg-card border-r border-border flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <img src="/illo-logo.png" alt="대리인 : AI비서" className="w-9 h-9 rounded-xl shadow-sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-extrabold leading-none truncate"><span className="text-primary">대리인</span><span className="text-muted-foreground"> : AI비서</span></div>
            <Link href="/" className="text-[10px] text-muted-foreground mt-1 tracking-wide hover:text-primary transition-colors inline-block">← illo 홈</Link>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {items.map((item, idx) => {
            const active = view === item.id;
            const canEdit = !item.core; // 편집 모드 없이 항상 이동·제거 가능 (핵심 제외)
            return (
              <div
                key={item.id}
                draggable={canEdit}
                onDragStart={() => { dragIdx.current = idx; }}
                onDragOver={(e) => { if (canEdit) e.preventDefault(); }}
                onDrop={() => { const f = dragIdx.current; if (f != null && f !== idx) onReorder(f, idx); dragIdx.current = null; }}
                className="group/item relative"
              >
                <button
                  onClick={() => onView(item.id)}
                  className={"w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all " + (canEdit ? "pr-7 cursor-pointer " : "") + (
                    active
                      ? "bg-primary/[0.13] text-primary font-semibold"
                      : "text-muted-foreground hover:bg-accent cursor-pointer"
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                </button>
                {canEdit && (
                  <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} title="메뉴에서 빼기"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 opacity-0 group-hover/item:opacity-100 hover:text-rose-500 active:scale-90 transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => onView("features")}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-orange-950/20 transition-colors border border-dashed border-border">
          <Plus className="w-4 h-4" /> 기능 추가 · 관리
        </button>
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
          {(["light", "dark"] as const).map((t) => {
            const on = mounted && resolvedTheme === t;
            return (
              <button key={t} onClick={() => setTheme(t)}
                className={"flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all " + (on ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {t === "light" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {t === "light" ? "화이트" : "다크"}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="text-[12px] text-foreground font-semibold truncate">{userName}</div>
            <div className="text-[10px] text-muted-foreground truncate">{userEmail}</div>
          </div>
          <button onClick={onLogout} title="로그아웃" className="shrink-0 text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-accent transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="px-1 text-[10px] text-muted-foreground/60">대리인 : AI비서 · by illo</div>
      </div>
    </aside>
  );
}

/* ─────────────────────────── 공통 레이아웃 ─────────────────────────── */
function ViewScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-10">{children}</div>
    </div>
  );
}
function QuotaLine({ free, quota, onShowKey }: { free: boolean; quota: number | null; onShowKey: () => void }) {
  if (!free) return <p className="text-sm text-muted-foreground">✓ 내 키로 무제한 사용 중</p>;
  const left = quota ?? FREE_LIMIT;
  return (
    <p className="text-sm text-muted-foreground">
      🆓 무료로 쓰는 중 · 오늘 남은 <b className={left <= 5 ? "text-rose-500" : "text-primary"}>{left}</b>/{FREE_LIMIT}회
    </p>
  );
}

/* ─────────────────────────── 홈 (위젯 대시보드 — EXE와 동일) ─────────────────────────── */
const HOME_WIDGETS: { id: string; label: string; icon: string; desc: string }[] = [
  // 일리(AI 비서)는 사이드바 + '메뉴 바로가기' 위젯으로 진입.
  { id: "results", label: "내 결과", icon: "📚", desc: "생성한 결과 모아보기" },
  { id: "quicktools", label: "빠른 도구", icon: "⚡", desc: "켜둔 AI 도구 모음" },
  { id: "shortcuts", label: "메뉴 바로가기", icon: "🔗", desc: "켜둔 기능 바로가기" },
];
const HOME_WIDGET_BY_ID = Object.fromEntries(HOME_WIDGETS.map((w) => [w.id, w]));
const DEFAULT_HOME = ["quicktools", "results"];
const LS_HOME = "illo.web.homeWidgets";
function loadHome(): string[] {
  try { const r = localStorage.getItem(LS_HOME); if (r) { const a = JSON.parse(r); if (Array.isArray(a)) return a.filter((id: string) => HOME_WIDGET_BY_ID[id]); } } catch { /* */ }
  return DEFAULT_HOME;
}
function saveHome(ids: string[]) { try { localStorage.setItem(LS_HOME, JSON.stringify(ids)); } catch { /* */ } }
function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "늦은 시간까지 고생 많으십니다";
  if (h < 12) return "좋은 아침입니다, 사장님";
  if (h < 18) return "오후도 힘내세요, 사장님";
  return "오늘도 수고하셨습니다, 사장님";
}

function Home({ enabled, onView, free, quota }: {
  userName: string; enabled: string[]; onView: (id: string) => void; free: boolean; quota: number | null; onShowKey: () => void;
}) {
  const [widgets, setWidgets] = useState<string[]>(DEFAULT_HOME);
  const [editing, setEditing] = useState(false);
  const dragIdx = useRef<number | null>(null);
  useEffect(() => { setWidgets(loadHome()); }, []);

  function update(next: string[]) { setWidgets(next); saveHome(next); }
  function remove(id: string) { update(widgets.filter((x) => x !== id)); }
  function add(id: string) { update([...widgets, id]); }
  function reorder(from: number, to: number) { const n = [...widgets]; const [m] = n.splice(from, 1); n.splice(to, 0, m); update(n); }
  const available = HOME_WIDGETS.filter((w) => !widgets.includes(w.id));

  function renderWidget(id: string) {
    switch (id) {
      case "assistant":
        return (
          <button onClick={() => onView("assistant")} className="w-full bg-gradient-to-r from-primary to-[#FB8C3E] text-white rounded-3xl px-5 py-4 flex items-center gap-3.5 shadow-lg shadow-primary/25 hover:brightness-95 transition">
            <span className="w-11 h-11 rounded-2xl bg-white/20 grid place-items-center text-2xl shrink-0">💬</span>
            <span className="text-left flex-1 min-w-0">
              <span className="block font-extrabold text-[15px]">비서에게 일 시키기</span>
              <span className="block text-[12px] text-white/85 mt-0.5">현황 질문 · 작업 지시 · 웹 조사</span>
            </span>
            <span className="text-white/80 text-xl">→</span>
          </button>
        );
      case "results": {
        const n = listResults().length;
        return (
          <button onClick={() => onView("history")} className="w-full bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-3.5 hover:border-primary transition-colors">
            <span className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-orange-950/30 grid place-items-center text-2xl shrink-0">📚</span>
            <span className="text-left flex-1 min-w-0">
              <span className="block font-extrabold text-[15px] text-foreground">내 결과 보관함</span>
              <span className="block text-[12px] text-muted-foreground mt-0.5">{n > 0 ? `저장된 결과 ${n}개 · 다시 보기/복사/내보내기` : "생성한 결과가 여기에 모여요"}</span>
            </span>
            <span className="text-muted-foreground/50 text-xl">→</span>
          </button>
        );
      }
      case "stats":
        return (
          <div className="grid grid-cols-3 gap-2.5">
            {[{ e: "📋", l: "결재대기" }, { e: "⚙️", l: "진행중" }, { e: "🧑‍💼", l: "직원" }].map((c) => (
              <button key={c.l} onClick={() => onView("features")} className="rounded-2xl border border-border bg-card p-3 flex flex-col items-center gap-0.5 active:scale-95 transition">
                <span className="text-lg leading-none mb-0.5">{c.e}</span>
                <span className="text-xl font-extrabold leading-none text-foreground">0</span>
                <span className="text-[10.5px] text-muted-foreground">{c.l}</span>
              </button>
            ))}
          </div>
        );
      case "finance":
        return (
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold text-foreground">이번 달</span>
              <button onClick={() => onView("settings")} className="text-[11px] text-primary font-semibold">자세히 →</button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{ l: "수익", v: "₩0", c: "text-emerald-500" }, { l: "비용", v: "₩0", c: "text-foreground" }, { l: "이익", v: "₩0", c: "text-primary" }].map((f) => (
                <div key={f.l}>
                  <div className="text-[10.5px] text-muted-foreground mb-0.5">{f.l}</div>
                  <div className={"text-[13px] font-extrabold leading-tight " + f.c}>{f.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">{free ? "오늘 남은 무료" : "내 키"}</span>
              <span className="font-bold text-blue-500">{free ? `${quota ?? FREE_LIMIT} / ${FREE_LIMIT}회` : "무제한"}</span>
            </div>
          </div>
        );
      case "recent":
        return (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border">
              <span className="text-[13px] font-bold text-foreground">최근 작업</span>
              <button onClick={() => onView("history")} className="text-[11px] text-primary font-semibold">전체 →</button>
            </div>
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">아직 작업이 없어요.</div>
          </div>
        );
      case "quicktools": {
        const tools = enabled.map((id) => ILLO_FEATURE_BY_ID[id]).filter((f) => f && f.kind === "tool").slice(0, 18) as IlloFeature[];
        return (
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="text-[13px] font-bold text-foreground mb-2.5">빠른 도구</div>
            {tools.length === 0 ? (
              <button onClick={() => onView("features")} className="text-[12px] text-primary font-semibold">🧩 보관함에서 도구 꺼내오기 →</button>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                {tools.map((t) => (
                  <button key={t.id} onClick={() => onView(t.id)} title={t.label} className="flex flex-col items-center gap-1 active:scale-95 transition">
                    <span className="w-full aspect-square rounded-xl bg-primary/10 dark:bg-orange-950/30 border border-border grid place-items-center text-base">{t.icon}</span>
                    <span className="text-[9px] text-muted-foreground text-center leading-tight truncate w-full">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
      case "shortcuts": {
        const items = enabled.map((id) => ILLO_FEATURE_BY_ID[id]).filter((f) => f && !["home", "features"].includes(f.id)).slice(0, 8) as IlloFeature[];
        return (
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="text-[13px] font-bold text-foreground mb-2.5">메뉴 바로가기</div>
            <div className="grid grid-cols-4 gap-2.5">
              {items.map((f) => (
                <button key={f.id} onClick={() => onView(f.id)} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
                  <span className="w-full aspect-square rounded-2xl bg-primary/10 dark:bg-orange-950/30 border border-border grid place-items-center text-xl">{f.icon}</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight truncate w-full">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      }
      default: return null;
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
    <div className="px-4 py-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-muted-foreground text-[13px]">{greeting()}</div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight mt-0.5">오늘의 사무실</h1>
        </div>
        <button onClick={() => setEditing((e) => !e)}
          className={"px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors shrink-0 " + (editing ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground")}>
          {editing ? "✓ 완료" : "⠿ 편집"}
        </button>
      </div>

      {editing && (
        <div className="text-[12px] text-primary mb-3 bg-primary/10 dark:bg-orange-950/20 rounded-xl px-3 py-2.5 leading-relaxed">
          위젯을 <b>드래그</b>해 순서를 바꾸고, <b>✕</b>로 제거하세요. 아래 "위젯 추가"에서 카드를 꺼내올 수 있어요.
        </div>
      )}

      <div className="space-y-3.5">
        {widgets.map((id, idx) => (
          <div
            key={id}
            draggable={editing}
            onDragStart={() => { dragIdx.current = idx; }}
            onDragOver={(e) => { if (editing) e.preventDefault(); }}
            onDrop={() => { const f = dragIdx.current; if (f != null && f !== idx) reorder(f, idx); dragIdx.current = null; }}
            className={"relative " + (editing ? "cursor-grab active:cursor-grabbing" : "")}
          >
            {editing && (
              <button onClick={() => remove(id)} className="absolute -top-2 -right-2 z-30 w-7 h-7 rounded-full bg-rose-500 text-white text-sm font-bold shadow-md grid place-items-center active:scale-90">✕</button>
            )}
            <div className={editing ? "pointer-events-none select-none ring-2 ring-dashed ring-[#F9954E]/40 rounded-3xl" : ""}>
              {renderWidget(id)}
            </div>
          </div>
        ))}
      </div>

      {editing && available.length > 0 && (
        <div className="mt-5">
          <div className="text-[12px] font-semibold text-muted-foreground mb-2 px-1">＋ 위젯 추가</div>
          <div className="grid grid-cols-1 gap-2.5">
            {available.map((w) => (
              <button key={w.id} onClick={() => add(w.id)}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-border bg-card text-left active:scale-[0.98] transition">
                <span className="text-xl w-9 h-9 rounded-xl bg-primary/10 dark:bg-orange-950/30 grid place-items-center shrink-0">{w.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold text-foreground">{w.label}</span>
                  <span className="block text-[11.5px] text-muted-foreground truncate">{w.desc}</span>
                </span>
                <span className="text-primary font-bold text-lg">＋</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {widgets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-[13px]">
          홈이 비어 있어요. <button onClick={() => setEditing(true)} className="text-primary font-semibold">＋ 위젯 추가</button>
        </div>
      )}
    </div>
    </div>
  );
}

/* ─────────────────────────── 비서실 (채팅) ─────────────────────────── */
type ChatMsg = { role: "user" | "assistant"; content: string };
function Assistant({ runAI, free, quota, onShowKey, userName }: {
  runAI: (p: string, featureId: string) => Promise<{ text: string }>; free: boolean; quota: number | null; onShowKey: () => void; userName: string;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const SUGGEST = ["블로그 글 쓰려면 어떤 AI 조합이 좋아?", "API 키는 어디서 받아?", "내 작업에 맞는 워크플로우 추천해줘", "이 글 더 매끄럽게 다듬어줘"];

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput(""); setErr("");
    const next: ChatMsg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next); setBusy(true);
    try {
      const history = next.slice(-8).map((m) => `${m.role === "user" ? "사용자" : "일리"}: ${m.content}`).join("\n");
      const prompt =
        `당신은 워크일로의 AI 비서 '일리(Illi)'예요. 굴 밖으로 고개를 내밀어 길을 알려주는 친근한 프레리독 캐릭터입니다. ` +
        `항상 정중한 존댓말로, 핵심을 먼저 말하고 필요하면 단계로 정리해 답하세요. 너무 길지 않게, 따뜻하고 다정하게. ` +
        `당신은 두 가지를 합니다 — (1) 글쓰기·요약·아이디어 등 무엇이든 돕는 챗봇, (2) "이 작업엔 이 API/조합이 좋아요"라고 짚어주는 가이드. ` +
        `가이드가 필요할 땐 이렇게 추천하세요 — 검색=Tavily, 글=GPT·Claude·Gemini, 이미지=DALL·E·Flux, 영상=Kling·힉스필드, 음성=ElevenLabs, 전송=이메일·카카오톡·텔레그램. ` +
        `키 발급 방법은 왼쪽 '가이드' 메뉴에, 자동 실행은 '워크플로우' 메뉴의 완성 템플릿(블로그·SNS·상품 등)에 있다고 안내하세요. 모르면 모른다고 솔직하게. ` +
        `사용자 이름은 '${userName}'입니다.\n\n[대화]\n${history}\n일리:`;
      const r = await runAI(prompt, "assistant");
      setMsgs((m) => [...m, { role: "assistant", content: r.text }]);
      saveResult({ toolId: "assistant", toolLabel: "일리", input: q, output: r.text });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "오류가 발생했습니다.";
      if (/FREE_QUOTA_EXCEEDED/.test(raw)) setErr("오늘 무료 한도(하루 50회)를 다 쓰셨어요. 🌙 내일 다시 쓰거나, 내 Claude 키를 넣으면 무제한이에요.");
      else if (/LOGIN_REQUIRED/.test(raw)) setErr("로그인이 필요합니다.");
      else setErr(raw);
    } finally { setBusy(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-border px-5 sm:px-8 py-3.5 flex items-center gap-2 shrink-0">
        <span className="text-xl">🐿️</span>
        <h1 className="font-extrabold text-foreground">일리 <span className="text-[12px] font-normal text-muted-foreground">· AI 비서 &amp; 가이드</span></h1>
        {free && <span className="ml-auto text-[12px] text-muted-foreground">오늘 남은 <b className={(quota ?? FREE_LIMIT) <= 5 ? "text-rose-500" : "text-primary"}>{quota ?? FREE_LIMIT}</b>/{FREE_LIMIT}회</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {msgs.length === 0 ? (
            <div className="text-center pt-10">
              <div className="text-5xl mb-3">🐿️</div>
              <p className="font-bold text-foreground mb-1">안녕하세요, 저는 일리예요!</p>
              <p className="text-sm text-muted-foreground mb-6 break-keep">무엇이든 물어보세요. “어떤 AI를 어떻게 조합할지”도 제가 안내해드려요.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGEST.map((s) => (
                  <button key={s} onClick={() => send(s)} className="px-3.5 py-2 rounded-full text-[13px] font-semibold bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {msgs.map((m, i) => (
                <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={"max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words " + (
                    m.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md"
                  )}>{m.content}</div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-card border border-border"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
                </div>
              )}
              {err && (
                <p className="text-sm text-rose-500 text-center leading-relaxed break-keep">{err}</p>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border p-3 sm:p-4 shrink-0 bg-background">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="일리에게 물어보세요… (Shift+Enter 줄바꿈)" rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:border-primary max-h-32" />
          <button onClick={() => send()} disabled={busy || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white grid place-items-center disabled:opacity-40 transition-colors">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── 내 워크플로우 (n8n 노드 캔버스) ─────────────────── */
const NODE_W = 196;
const NODE_H = 176;
function nodeTint(_kind: string): string {
  // 미니멀 — 모든 노드 동일한 중립 카드. 종류는 아이콘·역할로 구분, 강조는 주황 하나로.
  return "border-border bg-card";
}
// 노드의 한 면(side)의 연결점 좌표.
function sideAnchor(n: { x: number; y: number }, side: Side) {
  switch (side) {
    case "top": return { x: n.x + NODE_W / 2, y: n.y };
    case "bottom": return { x: n.x + NODE_W / 2, y: n.y + NODE_H };
    case "left": return { x: n.x, y: n.y + NODE_H / 2 };
    default: return { x: n.x + NODE_W, y: n.y + NODE_H / 2 }; // right
  }
}
// 면 방향으로 뻗는 베지어 제어점.
function ctrlPoint(p: { x: number; y: number }, side: Side, k = 64) {
  switch (side) {
    case "top": return { x: p.x, y: p.y - k };
    case "bottom": return { x: p.x, y: p.y + k };
    case "left": return { x: p.x - k, y: p.y };
    default: return { x: p.x + k, y: p.y }; // right
  }
}
const SIDES: Side[] = ["top", "right", "bottom", "left"];

function FlowBuilder({ runAI, userKey }: {
  runAI: (p: string, featureId: string, rawInput?: string) => Promise<{ text: string }>;
  userKey: string;
}) {
  const [flows, setFlows] = useState<UserFlow[]>([]);
  const [cur, setCur] = useState<UserFlow | null>(null);
  const [connectFrom, setConnectFrom] = useState<{ id: string; side: Side } | null>(null);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [pickModelFor, setPickModelFor] = useState<FlowNode | null>(null);
  const [naming, setNaming] = useState<UserFlow | null>(null);   // 이름 입력 단계
  const [showGuide, setShowGuide] = useState(true);              // 우측 하단 가이드
  const [command, setCommand] = useState("");                    // 최상단 명령
  const [running, setRunning] = useState(false);
  const [runNodeId, setRunNodeId] = useState<string | null>(null);
  const [runErr, setRunErr] = useState("");
  const [runResult, setRunResult] = useState<{ final: string; steps: { title: string; icon: string; out: string }[]; deliver?: { channel: string; content: string } } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => { setFlows(listUserFlows()); setTemplates(listUserTemplates()); }, []);

  const openFlow = (f: UserFlow) => { setCur(JSON.parse(JSON.stringify(f))); setConnectFrom(null); };
  const createNew = () => setNaming(blankFlow());   // 먼저 이름 입력 화면으로
  const startNamed = () => { if (!naming) return; openFlow({ ...naming, name: naming.name.trim() }); setNaming(null); };
  const startFromTemplate = (t: (typeof FLOW_TEMPLATES)[number]) => openFlow(templateToFlow(t));
  const startFromSaved = (t: SavedTemplate) => openFlow(instantiateTemplate(t));
  const save = () => { if (cur) { saveUserFlow(cur); setFlows(listUserFlows()); } };
  const removeFlow = (id: string) => { deleteUserFlow(id); setFlows(listUserFlows()); if (cur?.id === id) setCur(null); };
  const removeTemplate = (id: string) => { deleteUserTemplate(id); setTemplates(listUserTemplates()); };
  const saveAsTemplate = () => {
    if (!cur) return;
    if (!cur.name.trim()) { alert("먼저 위에서 워크플로우 이름을 입력하세요 — 보관 틀 이름이 됩니다."); return; }
    if (cur.nodes.length === 0) { alert("노드를 먼저 추가하세요."); return; }
    saveUserTemplate(cur);
    setTemplates(listUserTemplates());
    alert(`'${cur.name.trim()}' 을(를) 재사용 틀로 결합 보관했어요. (목록의 '내가 만든 워크플로우'에서 다시 꺼내 쓸 수 있어요)`);
  };
  function updateNode(id: string, patch: Partial<FlowNode>) {
    setCur((c) => (c ? { ...c, nodes: c.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) } : c));
  }

  // ── 워크플로우 실행 — 최상단 명령 → 노드 순서대로 AI 처리 → 결과 ──
  async function runFlow() {
    if (!cur || running) return;
    const nodes = cur.nodes, links = cur.links;
    if (nodes.length === 0) { setRunErr("노드를 먼저 추가하세요."); return; }
    if (!command.trim()) { setRunErr("맨 위에 요청(명령)을 입력하세요."); return; }
    setRunErr(""); setRunning(true); setRunResult(null);
    try {
      // 위상정렬(Kahn) — 연결 순서대로. 링크 없으면 배열 순서.
      const indeg = new Map(nodes.map((n) => [n.id, 0] as [string, number]));
      links.forEach((l) => indeg.set(l.to, (indeg.get(l.to) || 0) + 1));
      const outAdj = new Map(nodes.map((n) => [n.id, [] as string[]]));
      const inAdj = new Map(nodes.map((n) => [n.id, [] as string[]]));
      links.forEach((l) => { outAdj.get(l.from)?.push(l.to); inAdj.get(l.to)?.push(l.from); });
      const q = nodes.filter((n) => (indeg.get(n.id) || 0) === 0).map((n) => n.id);
      const order: string[] = [];
      while (q.length) {
        const id = q.shift() as string;
        order.push(id);
        (outAdj.get(id) || []).forEach((t) => { indeg.set(t, (indeg.get(t) || 0) - 1); if ((indeg.get(t) || 0) === 0) q.push(t); });
      }
      nodes.forEach((n) => { if (!order.includes(n.id)) order.push(n.id); }); // 사이클 누락분 보충

      const byId = new Map(nodes.map((n) => [n.id, n]));
      const outputs = new Map<string, string>();
      const steps: { title: string; icon: string; out: string }[] = [];
      let deliver: { channel: string; content: string } | undefined;

      for (const id of order) {
        const node = byId.get(id);
        if (!node) continue;
        setRunNodeId(id);
        const incoming = (inAdj.get(id) || []).map((f) => outputs.get(f)).filter(Boolean) as string[];
        const inputText = incoming.length ? incoming.join("\n\n---\n\n") : command.trim();
        if (node.kind === "input") { outputs.set(id, inputText); continue; }
        if (node.kind === "deliver") {
          // 전송 채널 = 선택한 전송 옵션(이메일/카카오톡/텔레그램). 자동/미선택은 이메일로.
          const ch = modelLabel(node, node.model, node.variant);
          const channel = !ch || ch === "—" || /자동/.test(ch) ? "이메일" : ch;
          outputs.set(id, inputText);
          deliver = { channel, content: inputText };
          steps.push({ title: node.title, icon: node.icon, out: `📤 전송 준비 완료 → ${channel}` });
          continue;
        }
        const task = (node.instruction || node.detail || node.title).trim();
        const hint = node.variant ? ` (선호 모델: ${node.variant})` : "";
        const prompt =
          `당신은 워크플로우의 '${node.title}' 단계입니다(역할: ${node.role})${hint}.\n` +
          `[이 단계에서 할 일]\n${task}\n\n[이전 단계에서 받은 내용]\n${inputText}\n\n` +
          `받은 내용을 바탕으로 이 단계의 결과만 깔끔하게 작성하세요.`;
        const r = await runAI(prompt, "assistant");
        const out = (r?.text || "").trim();
        outputs.set(id, out);
        steps.push({ title: node.title, icon: node.icon, out });
      }
      setRunNodeId(null);
      const lastId = order[order.length - 1];
      const final = deliver?.content || outputs.get(lastId) || steps[steps.length - 1]?.out || "";
      setRunResult({ final, steps, deliver });
      // 좌측 📁 자료함에 자동 저장
      const isHtml = /<html|<!doctype|<body|<div|<p[ >]|<section/i.test(final);
      const html = isHtml ? final
        : `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;padding:20px;line-height:1.7;color:#222">${final.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
      saveDoc(userKey, { id: "", name: `${cur.name || "워크플로우"} 결과 · ${new Date().toLocaleString("ko-KR")}`, dept: "", html });
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      if (/FREE_QUOTA_EXCEEDED/.test(raw)) setRunErr("오늘 무료 한도(하루 50회)를 다 썼어요. 설정에서 내 키를 넣으면 무제한이에요.");
      else if (/LOGIN_REQUIRED/.test(raw)) setRunErr("로그인이 필요합니다.");
      else setRunErr(raw.slice(0, 180));
    } finally { setRunning(false); setRunNodeId(null); }
  }

  function addNode(opt: FlowStepDetail) {
    if (!cur) return;
    const i = cur.nodes.length;
    const n: FlowNode = {
      id: newId(), kind: opt.kind, icon: opt.icon, title: opt.title, role: opt.role, detail: opt.detail,
      x: 60 + (i % 4) * (NODE_W + 40), y: 70 + Math.floor(i / 4) * (NODE_H + 50),
    };
    setCur({ ...cur, nodes: [...cur.nodes, n] });
  }
  function delNode(id: string) {
    if (!cur) return;
    setCur({ ...cur, nodes: cur.nodes.filter((n) => n.id !== id), links: cur.links.filter((l) => l.from !== id && l.to !== id) });
    if (connectFrom?.id === id) setConnectFrom(null);
  }
  function onHandle(id: string, side: Side) {
    if (!cur) return;
    if (!connectFrom) { setConnectFrom({ id, side }); return; }
    if (connectFrom.id === id) { setConnectFrom(null); return; }   // 같은 노드 → 취소
    const from = connectFrom;
    if (!cur.links.some((l) => l.from === from.id && l.to === id))   // 같은 두 노드 사이 중복 방지
      setCur({ ...cur, links: [...cur.links, { from: from.id, to: id, fromSide: from.side, toSide: side }] });
    setConnectFrom(null);
  }
  function delLink(from: string, to: string) {
    if (cur) setCur({ ...cur, links: cur.links.filter((l) => !(l.from === from && l.to === to)) });
  }
  function onNodeDown(e: ReactMouseEvent, n: FlowNode) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = { id: n.id, dx: e.clientX - rect.left - n.x, dy: e.clientY - rect.top - n.y };
  }
  function onMove(e: React.MouseEvent) {
    if (!drag.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, e.clientX - rect.left - drag.current.dx);
    const y = Math.max(0, e.clientY - rect.top - drag.current.dy);
    const id = drag.current.id;
    setCur((c) => (c ? { ...c, nodes: c.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) } : c));
  }
  const endDrag = () => { drag.current = null; };

  // ── 이름 입력 화면 (새로 만들기 → 여기서 이름 먼저 정하고 캔버스로) ──
  if (naming) {
    return (
      <ViewScroll>
        <button onClick={() => setNaming(null)} className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="w-4 h-4" /> 목록으로</button>
        <div className="max-w-md">
          <h1 className="text-xl font-extrabold text-foreground mb-1">새 워크플로우</h1>
          <p className="text-[13px] text-muted-foreground dark:text-muted-foreground mb-6 break-keep">이름을 먼저 정해주세요. 나중에 바꿀 수 있어요.</p>
          <label className="block text-[12px] font-bold text-muted-foreground mb-1.5">워크플로우 이름</label>
          <input autoFocus value={naming.name}
            onChange={(e) => setNaming({ ...naming, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter" && naming.name.trim()) startNamed(); }}
            placeholder="예: 블로그 글 자동 발행"
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-primary mb-4" />
          <button onClick={startNamed} disabled={!naming.name.trim()}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            만들기 → 노드 연결하기
          </button>
        </div>
      </ViewScroll>
    );
  }

  // ── 목록 화면 ──
  if (!cur) {
    return (
      <ViewScroll>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl font-extrabold text-foreground">🛠️ 내 워크플로우</h1>
          <button onClick={createNew} className="shrink-0 flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" />새로 만들기</button>
        </div>
        <p className="text-muted-foreground mb-2.5 break-keep">AI 단계를 노드로 연결해 <b>나만의 자동화</b>를 직접 설계하세요. (입력 → 조사 → 작성 → 검토 → 전송처럼)</p>
        <div className="mb-7 rounded-2xl border border-primary/25 dark:border-[#B35E15] bg-primary/5 dark:bg-orange-950/10 px-4 py-3 text-[12.5px] text-muted-foreground break-keep leading-relaxed">
          <b className="text-primary">n8n 자동화의 쉬운 고급 버전이에요.</b> 복잡한 설정 없이 — <b>AI의 API 키만 넣으면 연결</b>되고, <b>노드끼리 선만 이으면</b> 내용이 자동으로 흘러갑니다. 각 노드는 <b>받은 내용 + 자기 역할</b>대로 처리해 다음 노드로 넘기기만 하면 돼요. 노드는 <b>4면 어디로든</b> 받고, <b>한 면에서 여러 갈래</b>로 보낼 수 있어요.</div>

        {/* 완성된 워크플로우 템플릿 — 빈 캔버스 대신 바로 시작 */}
        <div className="mb-9">
          <h2 className="text-sm font-bold text-foreground mb-1">✨ 완성된 워크플로우로 바로 시작</h2>
          <p className="text-[12.5px] text-muted-foreground mb-3.5 break-keep">템플릿을 고르면 노드가 연결된 채로 열려요. 그대로 쓰거나 자유롭게 고치세요.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FLOW_TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => startFromTemplate(t)}
                className="text-left rounded-2xl border border-border bg-card p-4 hover:border-primary hover:shadow-sm transition-all group">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-sm font-bold text-foreground">{t.name}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{t.steps.length}단계</span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1.5 break-keep leading-relaxed">{t.desc}</p>
                <div className="flex flex-wrap items-center gap-y-1 mt-3">
                  {t.steps.map((st, i) => (
                    <span key={i} className="inline-flex items-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground whitespace-nowrap">{st.icon} {st.title}</span>
                      {i < t.steps.length - 1 && <span className="mx-0.5 text-muted-foreground/60 text-[10px]">→</span>}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-[12px] font-bold text-primary dark:text-[#FBAA60] opacity-0 group-hover:opacity-100 transition-opacity">이 템플릿으로 시작 →</div>
              </button>
            ))}
          </div>
        </div>

        {/* 내가 만든 워크플로우 (결합 보관한 재사용 틀) */}
        {templates.length > 0 && (
          <div className="mb-9">
            <h2 className="text-sm font-bold text-foreground mb-1">📦 내가 만든 워크플로우</h2>
            <p className="text-[12.5px] text-muted-foreground mb-3.5 break-keep">결합 보관해둔 틀이에요. 누르면 새 사본으로 열려 그대로 다시 씁니다.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((t) => (
                <div key={t.id} className="rounded-2xl border border-primary/25 dark:border-[#B35E15] bg-primary/5 dark:bg-orange-950/10 p-4 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => startFromSaved(t)} className="min-w-0 flex-1 text-left">
                      <div className="text-sm font-bold text-foreground truncate">📦 {t.name}</div>
                      <div className="text-[12px] text-muted-foreground mt-0.5">노드 {t.nodes.length}개 · 연결 {t.links.length}개</div>
                    </button>
                    <button onClick={() => removeTemplate(t.id)} className="shrink-0 text-muted-foreground/50 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="mt-2.5 text-[12px] font-bold text-primary dark:text-[#FBAA60]">이 틀로 시작 →</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 내 워크플로우 */}
        <h2 className="text-sm font-bold text-foreground mb-3">🛠️ 내 워크플로우</h2>
        {flows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border text-center py-10 text-muted-foreground">
            <p className="text-[13px] break-keep">아직 저장한 워크플로우가 없어요. 위 템플릿으로 시작하거나 <button onClick={createNew} className="font-bold text-primary hover:underline">빈 캔버스로 만들기</button>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {flows.map((f) => (
              <div key={f.id} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between gap-2">
                  <button onClick={() => openFlow(f)} className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-bold text-foreground truncate">{f.name || "(이름 없음)"}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">노드 {f.nodes.length}개 · 연결 {f.links.length}개</div>
                  </button>
                  <button onClick={() => removeFlow(f.id)} className="shrink-0 text-muted-foreground/50 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {f.nodes.slice(0, 6).map((n) => (
                    <span key={n.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{n.icon} {n.title}</span>
                  ))}
                  {f.nodes.length > 6 && <span className="text-[10px] text-muted-foreground">+{f.nodes.length - 6}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </ViewScroll>
    );
  }

  // ── 편집 캔버스 화면 ──
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 실행 결과 모달 */}
      {runResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRunResult(null)}>
          <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-xl p-5 max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">✅ 실행 결과</h3>
              <button onClick={() => setRunResult(null)} className="text-muted-foreground hover:text-rose-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {runResult.steps.map((s, i) => (
                <details key={i} className="rounded-lg border border-border">
                  <summary className="cursor-pointer px-3 py-2 text-[12.5px] font-bold text-foreground">{i + 1}. {s.icon} {s.title}</summary>
                  <div className="px-3 pb-2.5 text-[12px] text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">{s.out}</div>
                </details>
              ))}
              <div className="rounded-xl border border-primary bg-primary/5 dark:bg-orange-950/10 p-3 mt-1">
                <div className="text-[11px] font-bold text-primary mb-1">최종 결과</div>
                <div className="text-[13px] text-foreground whitespace-pre-wrap break-words leading-relaxed max-h-[40vh] overflow-y-auto">{runResult.final}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[11px] text-muted-foreground mr-auto">📁 자료함에 자동 저장됨</span>
              <button onClick={() => { try { navigator.clipboard?.writeText(runResult.final); } catch {} }} className="text-[12px] font-bold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:border-primary">복사</button>
              {runResult.deliver && (
                <button onClick={() => {
                  const d = runResult.deliver;
                  if (!d) return;
                  if (/이메일|email/i.test(d.channel)) { window.location.href = `mailto:?subject=${encodeURIComponent((cur?.name || "대리인") + " 결과")}&body=${encodeURIComponent(d.content)}`; }
                  else { alert(`${d.channel} 전송은 채널 연결 후 자동 발송됩니다. 지금은 복사/자료함으로 보내주세요.`); }
                }} className="text-[12px] font-bold px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 flex items-center gap-1"><Send className="w-3.5 h-3.5" /> {runResult.deliver.channel}(으)로 전송</button>
              )}
              <button onClick={() => setRunResult(null)} className="text-[12px] px-3 py-2 text-muted-foreground">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 노드 AI·모델 선택 모달 — 종류에 맞는 AI + 실제 모델 버전, 설명과 함께 */}
      {pickModelFor && (() => {
        const slot = slotForNode(pickModelFor);
        const curModel = pickModelFor.model || defaultModelFor(pickModelFor);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPickModelFor(null)}>
            <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl p-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-foreground truncate">{pickModelFor.icon} {pickModelFor.title}</h3>
                <button onClick={() => setPickModelFor(null)} className="text-muted-foreground hover:text-rose-500"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[11.5px] text-muted-foreground mb-3 break-keep">이 노드를 어떤 AI·모델로 처리할지 골라요 — <b className="text-primary">{slot ? SLOT_LABEL[slot] : ""}</b></p>
              <div className="space-y-2">
                {optionsForNode(pickModelFor).map((opt) => {
                  const selProvider = curModel === opt.id;
                  const curVariant = pickModelFor.variant || opt.models[0] || "";
                  return (
                    <div key={opt.id}
                      className={"rounded-xl border p-3 transition-colors " + (selProvider ? "border-primary bg-primary/10 dark:bg-orange-950/20" : "border-border")}>
                      <button onClick={() => { updateNode(pickModelFor.id, { model: opt.id, variant: opt.models[0] || "" }); setPickModelFor(null); }} className="w-full text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-foreground">{opt.name}</span>
                          {selProvider && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                        </div>
                        <div className="text-[12px] text-muted-foreground mt-0.5 break-keep leading-relaxed">{opt.desc}</div>
                      </button>
                      {opt.models.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {opt.models.map((m) => {
                            const selV = selProvider && curVariant === m;
                            return (
                              <button key={m} onClick={() => { updateNode(pickModelFor.id, { model: opt.id, variant: m }); setPickModelFor(null); }}
                                className={"text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors " + (selV ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:border-primary")}>
                                {m}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
      {/* 툴바 */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card shrink-0">
        <button onClick={() => { setCur(null); setFlows(listUserFlows()); }} className="p-1.5 -ml-1 text-muted-foreground hover:text-primary"><ArrowLeft className="w-5 h-5" /></button>
        <input value={cur.name} onChange={(e) => setCur({ ...cur, name: e.target.value })}
          className="min-w-0 flex-1 max-w-xs bg-transparent text-sm font-bold text-foreground focus:outline-none border-b border-transparent focus:border-primary py-1" placeholder="워크플로우 이름" />
        <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline">노드 {cur.nodes.length} · 연결 {cur.links.length}</span>
        <button onClick={() => removeFlow(cur.id)} className="text-[12px] text-muted-foreground hover:text-rose-500 px-2 py-1.5">삭제</button>
        <button onClick={saveAsTemplate} title="완성한 노드들을 재사용 틀로 결합 보관" className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 dark:hover:bg-orange-950/30">📦 결합 보관</button>
        <button onClick={save} className="text-[12px] font-bold px-3.5 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90">저장</button>
      </div>

      {/* 최상단 명령 바 — 요청 입력하고 실행 */}
      <div className="shrink-0 px-4 py-2.5 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <input value={command} onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !running) runFlow(); }}
            placeholder="이 워크플로우에 요청을 입력하세요… (예: 6월 신제품으로 블로그 글 써줘)"
            className="flex-1 min-w-0 px-3.5 py-2 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:border-primary" />
          <button onClick={runFlow} disabled={running}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-[13px] font-extrabold transition-colors disabled:opacity-50">
            {running ? <><Loader2 className="w-4 h-4 animate-spin" /> 실행 중…</> : <>▶ 실행</>}
          </button>
        </div>
        {runErr && <p className="text-[12px] text-rose-500 mt-1.5">{runErr}</p>}
      </div>

      <div className="relative flex flex-1 min-h-0">
        {/* 노드 팔레트 */}
        <div className="w-[150px] shrink-0 border-r border-border bg-muted/40 overflow-y-auto p-2.5">
          <div className="text-[10px] font-bold text-muted-foreground mb-2 px-0.5">＋ 노드 추가</div>
          <div className="flex flex-col gap-1.5">
            {STEP_PALETTE.map((opt, k) => (
              <button key={k} onClick={() => addNode(opt)}
                className="text-left text-[11px] px-2 py-1.5 rounded-lg border border-border bg-card hover:border-primary hover:text-primary text-muted-foreground transition-colors break-keep">
                {opt.icon} {opt.title}
              </button>
            ))}
          </div>
        </div>

        {/* 캔버스 */}
        <div className="relative flex-1 min-w-0 overflow-auto bg-muted" onMouseMove={onMove} onMouseUp={endDrag} onMouseLeave={endDrag}>
          {connectFrom && (
            <div className="sticky top-2 left-2 z-30 inline-block ml-2 mt-2 text-[11px] font-semibold text-primary bg-primary/10 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg shadow-sm">
연결할 <b>다음 노드의 점(아무 면이나)</b>을 클릭하세요 · <button onClick={() => setConnectFrom(null)} className="underline">취소</button>
            </div>
          )}
          <div ref={canvasRef} className="relative" style={{ width: 1600, height: 1000, backgroundImage: "radial-gradient(circle, rgba(120,120,120,0.18) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
            {/* 연결선 */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: "visible" }}>
              {cur.links.map((l, i) => {
                const a = cur.nodes.find((n) => n.id === l.from);
                const b = cur.nodes.find((n) => n.id === l.to);
                if (!a || !b) return null;
                const fs = l.fromSide || "right", ts = l.toSide || "left";
                const p1 = sideAnchor(a, fs), p2 = sideAnchor(b, ts);
                const c1 = ctrlPoint(p1, fs), c2 = ctrlPoint(p2, ts);
                const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
                return (
                  <g key={i}>
                    <path d={`M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`} fill="none" stroke="#F9954E" strokeWidth={2} />
                    <circle cx={p2.x} cy={p2.y} r={3.5} fill="#F9954E" />
                    <circle cx={mx} cy={my} r={8} fill="white" stroke="#F9954E" strokeWidth={1}
                      className="pointer-events-auto cursor-pointer" onClick={() => delLink(l.from, l.to)} />
                    <text x={mx} y={my + 3} textAnchor="middle" fontSize={10} fill="#E8832E" className="pointer-events-none select-none">✕</text>
                  </g>
                );
              })}
            </svg>

            {/* 노드 */}
            {cur.nodes.map((n) => (
              <div key={n.id} onMouseDown={(e) => onNodeDown(e, n)}
                className={"absolute rounded-xl border-2 shadow-sm select-none cursor-grab active:cursor-grabbing flex flex-col overflow-hidden " + nodeTint(n.kind) + (connectFrom?.id === n.id ? " ring-2 ring-[#F9954E]" : "") + (runNodeId === n.id ? " ring-2 ring-[#F9954E] animate-pulse" : "")}
                style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}>
                {/* 4면 연결 핸들 — 받기·내보내기 공용. 한 면에서 여러 갈래로 연결 가능 */}
                {SIDES.map((sd) => {
                  const pos = sd === "top" ? "left-1/2 -top-2 -translate-x-1/2"
                    : sd === "bottom" ? "left-1/2 -bottom-2 -translate-x-1/2"
                    : sd === "left" ? "-left-2 top-1/2 -translate-y-1/2"
                    : "-right-2 top-1/2 -translate-y-1/2";
                  const lit = connectFrom?.id === n.id && connectFrom?.side === sd;
                  return (
                    <button key={sd} onMouseDown={(e) => e.stopPropagation()} onClick={() => onHandle(n.id, sd)}
                      title="점을 클릭해 연결 시작 → 다음 노드의 점 클릭"
                      className={"absolute " + pos + " w-4 h-4 rounded-full border-2 border-primary hover:scale-125 transition-transform z-20 " + (lit ? "bg-primary" : "bg-white")} />
                  );
                })}
                {/* 헤더 (노드 전체가 드래그 가능 — 아무 데나 잡고 이동) */}
                <div className="flex items-center justify-between gap-1 px-2.5 pt-2 shrink-0">
                  <span className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-[12px] shrink-0">{n.icon}</span>
                    <input value={n.title} onChange={(e) => updateNode(n.id, { title: e.target.value })} onMouseDown={(e) => e.stopPropagation()} placeholder="이름" title="노드 이름 (클릭해서 수정)"
                      className="min-w-0 flex-1 bg-transparent text-[12px] font-bold text-foreground focus:outline-none border-b border-transparent focus:border-primary cursor-text" />
                  </span>
                  <button onMouseDown={(e) => e.stopPropagation()} onClick={() => delNode(n.id)} className="shrink-0 text-muted-foreground/50 hover:text-rose-500"><X className="w-3.5 h-3.5" /></button>
                </div>
                {n.role && <div className="px-2.5 text-[9px] text-primary font-semibold shrink-0">{n.role}</div>}
                {/* 이 노드를 처리할 AI·모델 — 클릭해 바꾸기 */}
                {slotForNode(n) && (
                  <button onMouseDown={(e) => e.stopPropagation()} onClick={() => setPickModelFor(n)}
                    title="이 노드를 처리할 AI·모델 바꾸기"
                    className="mx-2 mt-1 shrink-0 flex items-center gap-1 w-fit max-w-[calc(100%-16px)] text-[9px] font-bold text-muted-foreground bg-muted border border-border rounded-md px-1.5 py-0.5 hover:border-primary hover:text-primary cursor-pointer">
                    <span className="truncate">🤖 {modelLabel(n, n.model, n.variant)}</span>
                    <ChevronDown className="w-2.5 h-2.5 shrink-0" />
                  </button>
                )}
                {/* 노드별 명령 — 받은 내용 + 이 명령대로 처리해 다음 노드로 */}
                <div className="px-2 pb-2 pt-1 flex-1 min-h-0">
                  <textarea value={n.instruction ?? ""}
                    onChange={(e) => updateNode(n.id, { instruction: e.target.value })}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder={n.detail || "이 노드가 할 일(명령)을 적어요"}
                    className="w-full h-full resize-none bg-card/60 border border-border rounded-md px-1.5 py-1 text-[9.5px] leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary cursor-text" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* 플로팅 가이드 — 우측 하단 */}
        <div className="absolute bottom-4 right-4 z-30 max-w-[290px]">
          {showGuide ? (
            <div className="rounded-xl border border-border bg-card/95 backdrop-blur shadow-lg p-3 text-[11px] text-muted-foreground leading-relaxed break-keep">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-foreground">💡 사용법</span>
                <button onClick={() => setShowGuide(false)} className="text-muted-foreground hover:text-rose-500"><X className="w-3.5 h-3.5" /></button>
              </div>
              노드를 <b>아무 데나 잡고 드래그</b>해 옮기고, 가장자리 <b>4면 점</b>을 클릭 → 다음 노드의 점을 클릭하면 <b>연결</b>(한 면에서 여러 갈래 OK). 노드의 <b>🤖 AI</b>로 모델을 고르고, <b>명령</b> 칸에 할 일을 적어요. 다 만들면 <b>저장</b>, 재사용은 <b>📦 결합 보관</b>.
            </div>
          ) : (
            <button onClick={() => setShowGuide(true)} title="사용법 보기"
              className="w-9 h-9 rounded-full border border-border bg-card shadow-lg flex items-center justify-center text-[15px] hover:border-primary transition-colors">💡</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── 자료함 (HTML 문서 + 커스텀 부서, 회원별) ─────────────────── */
function Workspace({ userKey }: { userKey: string }) {
  const [docs, setDocs] = useState<SavedDoc[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [sel, setSel] = useState<string>("all");
  const [editing, setEditing] = useState<SavedDoc | null>(null);
  const [viewing, setViewing] = useState<SavedDoc | null>(null);
  const [addDept, setAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptEmoji, setNewDeptEmoji] = useState(DEPT_EMOJIS[0]);

  useEffect(() => { setDocs(listDocs(userKey)); setDepts(listDepts(userKey)); }, [userKey]);
  const refresh = () => { setDocs(listDocs(userKey)); setDepts(listDepts(userKey)); };

  const deptName = (id: string) => (id === "" ? "미분류" : depts.find((d) => d.id === id)?.name || "미분류");
  const deptEmoji = (id: string) => (id === "" ? "🗂️" : depts.find((d) => d.id === id)?.emoji || "🏢");
  const shown = sel === "all" ? docs : docs.filter((d) => d.dept === sel);

  const newDoc = () => setEditing({ id: "", name: "", dept: sel === "all" ? "" : sel, html: "", updatedAt: "" });
  const saveEditing = () => {
    if (!editing) return;
    if (!editing.name.trim()) { alert("문서 이름을 입력하세요."); return; }
    saveDoc(userKey, { id: editing.id, name: editing.name.trim(), dept: editing.dept, html: editing.html });
    setEditing(null); refresh();
  };
  const removeDoc = (id: string) => { deleteDoc(userKey, id); setViewing(null); setEditing(null); refresh(); };
  const addDeptDo = () => {
    if (!newDeptName.trim()) return;
    saveDept(userKey, { emoji: newDeptEmoji, name: newDeptName.trim() });
    setNewDeptName(""); setNewDeptEmoji(DEPT_EMOJIS[0]); setAddDept(false); refresh();
  };
  const removeDept = (id: string) => {
    if (!confirm("이 부서를 삭제할까요? 안의 문서는 '미분류'로 옮겨져요.")) return;
    deleteDept(userKey, id); if (sel === id) setSel("all"); refresh();
  };

  const chip = (active: boolean) =>
    "px-3 py-1.5 rounded-lg text-[13px] font-bold border transition-colors " +
    (active ? "border-primary bg-primary/10 text-primary dark:bg-orange-950/20" : "border-border text-muted-foreground hover:border-primary");

  return (
    <ViewScroll>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl font-extrabold text-foreground">📁 자료함</h1>
        <button onClick={newDoc} className="shrink-0 flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"><Plus className="w-4 h-4" />새 문서</button>
      </div>
      <p className="text-[13px] text-muted-foreground dark:text-muted-foreground mb-6 break-keep">HTML을 저장해두고 언제든 열어봐요. <b>부서</b>를 만들어 사업체처럼 정리할 수 있어요. <span className="text-muted-foreground">(이 계정 전용)</span></p>

      {/* 부서 폴더 */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button onClick={() => setSel("all")} className={chip(sel === "all")}>전체 {docs.length}</button>
        <button onClick={() => setSel("")} className={chip(sel === "")}>🗂️ 미분류</button>
        {depts.map((d) => (
          <span key={d.id} className={"group inline-flex items-center gap-1 " + chip(sel === d.id)}>
            <button onClick={() => setSel(d.id)}>{d.emoji} {d.name}</button>
            <button onClick={() => removeDept(d.id)} title="부서 삭제" className="text-muted-foreground/50 hover:text-rose-500"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {addDept ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-primary bg-card">
            <select value={newDeptEmoji} onChange={(e) => setNewDeptEmoji(e.target.value)} className="bg-transparent text-[13px] focus:outline-none">
              {DEPT_EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <input autoFocus value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addDeptDo(); if (e.key === "Escape") setAddDept(false); }}
              placeholder="부서 이름" className="w-24 bg-transparent text-[13px] focus:outline-none text-foreground" />
            <button onClick={addDeptDo} className="text-[12px] font-bold text-primary">추가</button>
          </span>
        ) : (
          <button onClick={() => setAddDept(true)} className="px-3 py-1.5 rounded-lg text-[13px] font-bold border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary">+ 부서 만들기</button>
        )}
      </div>

      {/* 문서 목록 */}
      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border text-center py-14 text-muted-foreground">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-[13px] break-keep">저장된 문서가 없어요. <button onClick={newDoc} className="font-bold text-primary hover:underline">새 문서</button>로 HTML을 저장해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {shown.map((d) => (
            <div key={d.id} className="rounded-2xl border border-border bg-card p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <button onClick={() => setViewing(d)} className="min-w-0 flex-1 text-left">
                  <div className="text-sm font-bold text-foreground truncate">{d.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{deptEmoji(d.dept)} {deptName(d.dept)} · {(d.html.length / 1024).toFixed(1)}KB</div>
                </button>
                <button onClick={() => { deleteDoc(userKey, d.id); refresh(); }} className="shrink-0 text-muted-foreground/50 hover:text-rose-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={() => setViewing(d)} className="text-[12px] font-bold text-primary hover:underline">열어보기 →</button>
                <button onClick={() => setEditing(d)} className="text-[12px] text-muted-foreground hover:text-primary">편집</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 편집/작성 모달 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-xl p-5 max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">{editing.id ? "문서 편집" : "새 HTML 문서"}</h3>
              <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-rose-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-2 mb-3">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="문서 이름 (예: 이벤트 랜딩)" className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:border-primary" />
              <select value={editing.dept} onChange={(e) => setEditing({ ...editing, dept: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none">
                <option value="">미분류</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>)}
              </select>
            </div>
            <textarea value={editing.html} onChange={(e) => setEditing({ ...editing, html: e.target.value })} placeholder="<!DOCTYPE html> … HTML을 붙여넣으세요" spellCheck={false}
              className="flex-1 min-h-[240px] w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-[12px] font-mono text-foreground focus:outline-none focus:border-primary resize-none" />
            <div className="flex items-center justify-end gap-2 mt-3">
              {editing.id && <button onClick={() => removeDoc(editing.id)} className="mr-auto text-[13px] text-muted-foreground hover:text-rose-500">삭제</button>}
              <button onClick={() => setEditing(null)} className="text-[13px] px-3 py-2 text-muted-foreground">취소</button>
              <button onClick={saveEditing} className="text-[13px] font-bold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 모달 */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="w-full max-w-4xl h-[86vh] bg-card rounded-2xl border border-border shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
              <span className="text-sm font-bold text-foreground truncate">{viewing.name}</span>
              <span className="text-[11px] text-muted-foreground shrink-0">{deptEmoji(viewing.dept)} {deptName(viewing.dept)}</span>
              <button onClick={() => downloadText(viewing.name + ".html", viewing.html)} className="ml-auto shrink-0 text-[12px] font-bold text-primary flex items-center gap-1"><Download className="w-3.5 h-3.5" />다운로드</button>
              <button onClick={() => { const d = viewing; setViewing(null); setEditing(d); }} className="shrink-0 text-[12px] text-muted-foreground hover:text-primary">편집</button>
              <button onClick={() => setViewing(null)} className="shrink-0 text-muted-foreground hover:text-rose-500"><X className="w-4 h-4" /></button>
            </div>
            <iframe srcDoc={viewing.html} sandbox="allow-scripts allow-popups allow-forms" title={viewing.name} className="flex-1 w-full bg-white" />
          </div>
        </div>
      )}
    </ViewScroll>
  );
}

/* ─────────────────── API 카탈로그 (키 발급 가이드) ─────────────────── */
function roleBadgeClass(role: ApiEntry["role"]): string {
  if (role === "pick") return "bg-primary/10 text-primary border-primary/25 dark:bg-orange-950/30 dark:border-[#B35E15]";
  if (role === "warn") return "bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900";
  return "bg-muted text-muted-foreground border-border";
}
function ApiCatalog() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (k: string) => setOpen((p) => (p === k ? null : k));
  const hasDetail = (e: ApiEntry) => !!(e.keySteps || e.keyUrl || e.free || e.topup || e.note);
  return (
    <ViewScroll>
      <h1 className="text-2xl font-extrabold text-foreground mb-1">📖 가이드</h1>
      <p className="text-muted-foreground mb-2 break-keep">
        “어떤 API가 있고, 뭐가 다르고, 키는 어디서 받는지” — 목적별로 정리했어요. 카드를 누르면 <b>키 발급 단계</b>와 무료 크레딧·최소 충전을 볼 수 있어요.
      </p>
      <p className="text-[12px] text-muted-foreground mb-6 break-keep">※ 가격·정책은 제공사 사정으로 자주 바뀌어요. 정확한 최신 정보는 각 발급 페이지에서 확인하세요.</p>

      <div className="flex flex-wrap gap-2 mb-6 text-[11.5px]">
        <span className="px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/25 dark:bg-orange-950/30 dark:border-[#B35E15]">★ 지정 — 직접 고른 핵심</span>
        <span className="px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">추천 — 함께 제안</span>
        <span className="px-2 py-0.5 rounded-full border bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900">⚠ 주의</span>
      </div>

      {/* 초기 비용 줄이는 법 */}
      <div className="rounded-2xl border border-primary/25 dark:border-[#B35E15] bg-primary/5 dark:bg-orange-950/10 p-5 mb-8">
        <div className="text-sm font-bold text-foreground mb-1">💡 초기 비용, 이렇게 줄여요</div>
        <p className="text-[12.5px] text-muted-foreground mb-3 break-keep">API마다 최소 충전($5~10)이 있어요. 한 번에 다 넣을 필요 없습니다.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {COST_TIPS.map((t) => (
            <div key={t.tag} className="rounded-xl bg-card border border-border p-3">
              <div className="text-[10px] font-bold text-primary font-mono mb-1">{t.tag}</div>
              <div className="text-[13px] font-bold text-foreground mb-0.5">{t.title}</div>
              <div className="text-[12px] text-muted-foreground break-keep leading-relaxed">{t.body}</div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[13px] font-bold text-foreground">🔗 {ROUTER_TIP.name}로 글 모델 묶기</span>
            <a href={ROUTER_TIP.keyUrl} target="_blank" rel="noopener noreferrer" className="sm:ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline">키 발급 <ExternalLink className="w-3 h-3" /></a>
          </div>
          <div className="text-[12px] text-muted-foreground break-keep">{ROUTER_TIP.desc}</div>
        </div>
      </div>

      <div className="space-y-7">
        {API_CATALOG.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-lg">{cat.icon}</span>
              <h2 className="text-base font-bold text-foreground">{cat.name}</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{cat.en}</span>
            </div>
            <p className="text-[12.5px] text-muted-foreground mb-3 break-keep">{cat.desc}</p>
            <div className="space-y-2">
              {cat.entries.map((e) => {
                const k = cat.id + ":" + e.name;
                const detail = hasDetail(e);
                const isOpen = open === k;
                return (
                  <div key={k} className="rounded-xl border border-border bg-card overflow-hidden">
                    <button disabled={!detail} onClick={() => detail && toggle(k)}
                      className={"w-full flex items-center gap-2.5 px-4 py-3 text-left " + (detail ? "hover:bg-accent transition-colors" : "cursor-default")}>
                      <span className={"shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md border " + roleBadgeClass(e.role)}>{ROLE_LABEL[e.role]}</span>
                      <span className="shrink-0 text-[13.5px] font-bold text-foreground">{e.name}</span>
                      <span className="min-w-0 flex-1 text-[12px] text-muted-foreground break-keep">{e.use}</span>
                      {detail && <ChevronDown className={"ml-1 shrink-0 w-4 h-4 text-muted-foreground transition-transform " + (isOpen ? "rotate-180" : "")} />}
                    </button>
                    {detail && isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-border text-[12.5px] space-y-2">
                        {e.free && <div className="flex gap-2"><span className="shrink-0 font-bold text-[#149074] dark:text-emerald-400">무료</span><span className="text-muted-foreground break-keep">{e.free}</span></div>}
                        {e.topup && <div className="flex gap-2"><span className="shrink-0 font-bold text-primary">충전</span><span className="text-muted-foreground break-keep">{e.topup}</span></div>}
                        {e.note && <div className="flex gap-2"><span className="shrink-0 font-bold text-muted-foreground">참고</span><span className="text-muted-foreground break-keep">{e.note}</span></div>}
                        {e.keySteps && (
                          <div className="pt-1">
                            <div className="flex items-center gap-1.5 font-bold text-foreground mb-1.5"><KeyRound className="w-3.5 h-3.5 text-primary" /> 키 발급 방법</div>
                            <ol className="space-y-1">
                              {e.keySteps.map((s, i) => (
                                <li key={i} className="flex gap-2 text-muted-foreground break-keep">
                                  <span className="shrink-0 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {e.keyUrl && (
                          <a href={e.keyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-1.5 text-[12px] font-bold text-white bg-primary hover:bg-primary/90 rounded-lg px-3 py-1.5 transition-colors">
                            키 발급 페이지 열기 <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {cat.catNote && <p className="text-[12px] text-muted-foreground mt-2.5 break-keep bg-muted/40 rounded-lg px-3 py-2">{cat.catNote}</p>}
          </div>
        ))}
      </div>

      <p className="text-[12px] text-muted-foreground mt-8 break-keep text-center">발급한 키는 <b className="text-primary">설정 → AI 키</b>에 넣으면 워크플로우·도구가 바로 그 키로 동작해요.</p>
    </ViewScroll>
  );
}

/* ─────────────────────────── 기능 보관함 ─────────────────────────── */
function FeatureManager({ enabled, onToggle, onView }: {
  enabled: string[]; onToggle: (id: string) => void; onView: (id: string) => void;
}) {
  const [openFlows, setOpenFlows] = useState<string[]>([]);
  const toggleFlow = (id: string) => setOpenFlows((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const [q, setQ] = useState("");

  // 검색 매칭: 이름·설명 부분일치 + 초성검색(ㄱㄴㄷ…)
  const query = q.trim();
  const qLower = query.toLowerCase();
  const qIsJamo = /^[ㄱ-ㅎ]+$/.test(query);
  const matchFeat = (f: IlloFeature) => {
    if (!query) return true;
    if (qIsJamo) return toInitials(f.label).includes(query);
    return (f.label + " " + f.desc).toLowerCase().includes(qLower);
  };
  const allTools = ILLO_FEATURES.filter((f) => f.released && f.kind === "tool");
  const matchCount = allTools.filter(matchFeat).length;

  return (
    <ViewScroll>
      <h1 className="text-2xl font-extrabold text-foreground mb-1">🧩 기능 보관함</h1>
      <p className="text-muted-foreground mb-4 break-keep">필요한 기능만 켜서 왼쪽 메뉴에 추가하세요. 안 쓰는 건 꺼두면 깔끔해요.</p>

      {/* 검색 */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="기능 검색… (이름·설명, 초성 ㄱㄴㄷ 가능)"
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:border-primary" />
        {q && (
          <button onClick={() => setQ("")} title="지우기"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center rounded-full text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-accent">✕</button>
        )}
      </div>
      {query && <p className="-mt-3 mb-5 text-[12px] text-muted-foreground">검색 결과 <b className="text-primary">{matchCount}</b>개</p>}
      {query && matchCount === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">'{query}'에 맞는 기능이 없어요.</p>
        </div>
      )}

      {ILLO_GROUP_ORDER.map((group) => {
        // 공개(released)된 "도구"만 보여준다(핵심/보관함 제외). 완성 전 기능은 숨김.
        const feats = ILLO_FEATURES.filter((f) => f.group === group && f.released && f.kind === "tool" && matchFeat(f));
        if (!feats.length) return null;
        return (
          <section key={group} className="mb-8">
            <h2 className="text-sm font-bold text-muted-foreground mb-3">{group}</h2>
            <div className="flex flex-col gap-2">
              {feats.map((f, idx) => {
                const on = enabled.includes(f.id);
                const open = openFlows.includes(f.id);
                const steps = loadCustomFlow(f.id) || flowDetailForTool(f.id);
                const ini = initialConsonant(f.label);
                const showHeader = idx === 0 || initialConsonant(feats[idx - 1].label) !== ini;
                return (
                  <Fragment key={f.id}>
                  {showHeader && (
                    <div className="flex items-center gap-2 mt-3 first:mt-0 mb-0.5 px-0.5">
                      <span className="w-6 h-6 rounded-lg bg-primary/12 text-primary text-[12px] font-extrabold grid place-items-center">{ini}</span>
                      <span className="h-px flex-1 bg-muted" />
                    </div>
                  )}
                  <div className={"rounded-2xl border bg-card transition-all hover:shadow-sm " + (on ? "border-primary/60" : "border-border hover:border-primary/40")}>
                    <div className="flex items-center gap-3 p-3.5">
                      <span className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-orange-950/30 grid place-items-center text-lg shrink-0">{f.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">{f.label}{on && hasCustomFlow(f.id) && <span className="text-[9.5px] text-muted-foreground font-normal">수정됨</span>}</div>
                        <div className="text-[12px] text-muted-foreground truncate">{f.desc}</div>
                      </div>
                      <button onClick={() => toggleFlow(f.id)} title="어떤 AI들이 연결됐는지 보기"
                        className={"shrink-0 text-[11px] font-semibold px-2 py-1.5 rounded-lg whitespace-nowrap transition-colors " + (open ? "text-primary bg-primary/10 dark:bg-orange-950/30" : "text-muted-foreground hover:text-primary")}>
                        {open ? "접기 ▴" : "AI 보기 ▾"}
                      </button>
                      <button onClick={() => onToggle(f.id)}
                        className={"shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors " + (on ? "bg-muted text-muted-foreground hover:text-rose-500" : "bg-primary text-white hover:bg-primary/90")}>
                        {on ? "끄기" : "추가"}
                      </button>
                    </div>
                    <div className={"overflow-hidden transition-all duration-300 ease-out " + (open ? "max-h-[40rem]" : "max-h-0")}>
                      <div className="px-3.5 pb-3.5 pt-3 border-t border-border">
                        <div className="text-[10.5px] font-semibold text-muted-foreground mb-2.5">⚙️ 워크플로우 · {steps.length}단계 — 이 AI들이 협업해요</div>
                        <div className="relative">
                          {steps.map((s, i) => (
                            <div key={i} className="flex gap-3 pb-3 last:pb-0 relative">
                              {i < steps.length - 1 && <span className="absolute left-[9px] top-[18px] bottom-0 w-px bg-border" />}
                              <span className="shrink-0 w-[18px] h-[18px] rounded-full bg-primary/15 text-primary text-[10px] font-bold grid place-items-center z-10 mt-0.5">{i + 1}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[12.5px] font-semibold text-foreground">{s.icon} {s.title}</span>
                                  {s.role && <span className="text-[9.5px] text-muted-foreground">{s.role}</span>}
                                </div>
                                <div className="text-[11px] text-muted-foreground dark:text-muted-foreground leading-snug break-keep mt-0.5">{s.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="mt-2.5 text-[10.5px] text-muted-foreground break-keep">＊ 편집(단계 추가·삭제)은 <b>추가</b> 후 왼쪽 메뉴에서 이 도구를 열면 가능해요.</p>
                      </div>
                    </div>
                  </div>
                  </Fragment>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="text-[11px] text-muted-foreground mt-4 text-center break-keep">
        <b>AI 보기</b>로 어떤 AI들이 연계됐는지 확인하세요. 편집(단계 추가·삭제)은 추가한 뒤 도구 안에서.<br />더 많은 기능(이미지·영상·음성·자동화)은 완성되는 대로 하나씩 열려요. 🔜
      </p>
    </ViewScroll>
  );
}

/* ─────────────────────────── 결과 보관함 ─────────────────────────── */
function HistoryView({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<IlloResult[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  useEffect(() => { setItems(listResults()); }, []);
  const refresh = () => setItems(listResults());
  // IlloResult.createdAt은 ISO 문자열 — 숫자 타임스탬프도 함께 받는다(과거 데이터 호환).
  function fmt(ts: string | number) {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "";
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  async function copy(t: string, id: string) { try { await navigator.clipboard.writeText(t); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500); } catch { /* */ } }
  return (
    <ViewScroll>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="w-4 h-4" /> 홈</button>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold text-foreground">📚 내 결과 보관함</h1>
        {items.length > 0 && <button onClick={() => { clearResults(); refresh(); }} className="text-[12px] text-muted-foreground hover:text-rose-500">전체 삭제</button>}
      </div>
      <p className="text-muted-foreground mb-6 text-sm break-keep">도구·일리에서 만든 결과가 자동 저장돼요 (이 브라우저, 최근 100개).</p>
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm break-keep">아직 저장된 결과가 없어요.<br />도구나 일리에게 무언가 만들어보세요.</div>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => {
            const open = openId === it.id;
            return (
              <div key={it.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                <button onClick={() => setOpenId(open ? null : it.id)} className="w-full flex items-center gap-2 p-3.5 text-left">
                  <span className="text-[11px] font-bold text-primary bg-primary/10 dark:bg-orange-950/30 px-2 py-0.5 rounded shrink-0">{it.toolLabel}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{fmt(it.createdAt)}</span>
                  <span className="text-[12.5px] text-muted-foreground truncate flex-1 min-w-0">{it.output.replace(/\s+/g, " ").slice(0, 70)}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{open ? "▴" : "▾"}</span>
                </button>
                {open && (
                  <div className="px-3.5 pb-3.5">
                    <pre className="text-[13px] text-foreground whitespace-pre-wrap break-words font-sans leading-relaxed bg-muted/50 rounded-xl p-3">{it.output}</pre>
                    <div className="flex items-center gap-3 mt-2.5">
                      <button onClick={() => copy(it.output, it.id)} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">{copiedId === it.id ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}</button>
                      <button onClick={() => downloadText(`${it.toolLabel}.txt`, it.output)} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary"><Download className="w-3.5 h-3.5" /> 다운로드</button>
                      <button onClick={() => { deleteResult(it.id); refresh(); }} className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-rose-500"><X className="w-3.5 h-3.5" /> 삭제</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ViewScroll>
  );
}

/* ─────────────────────────── 설정 ─────────────────────────── */
function Settings({ keyVal, free, onShowKey, onRemoveKey, onLogout, userName, userEmail }: {
  keyVal: string; free: boolean;
  onShowKey: () => void; onRemoveKey: () => void; onLogout: () => void; userName: string; userEmail: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const masked = keyVal ? keyVal.slice(0, 7) + "•••••••" + keyVal.slice(-4) : "";

  return (
    <ViewScroll>
      <h1 className="text-2xl font-extrabold text-foreground mb-7">⚙️ 설정</h1>

      <Section title="계정">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-foreground">{userName}</div>
            <div className="text-[13px] text-muted-foreground">{userEmail}</div>
          </div>
          <button onClick={onLogout} className="text-[13px] font-bold text-rose-500 border border-rose-200 dark:border-rose-900/50 rounded-lg px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30">로그아웃</button>
        </div>
      </Section>

      <Section title="요금제">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLANS.map((p) => {
            const current = (free ? "free" : "pro") === p.id;
            return (
              <div key={p.id} className={"rounded-2xl border p-4 " + (current ? "border-primary bg-primary/5 dark:bg-orange-950/10" : "border-border")}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-extrabold text-foreground">{p.label}</span>
                  {current ? <span className="text-[10px] font-bold text-white bg-primary rounded-full px-2 py-0.5">사용 중</span>
                    : p.highlight ? <span className="text-[10px] font-bold text-primary">추천</span> : null}
                </div>
                <div className="text-[13px] font-bold text-foreground">{p.price}</div>
                <div className="text-[11px] text-muted-foreground mb-2.5">{p.limit} · {p.model}</div>
                <ul className="space-y-1">
                  {p.perks.map((perk, i) => (
                    <li key={i} className="text-[11.5px] text-muted-foreground flex gap-1.5 break-keep"><span className="text-primary">✓</span>{perk}</li>
                  ))}
                </ul>
                {p.id === "pro" && !current && (
                  <button onClick={onShowKey} className="w-full mt-3 text-[12px] font-bold py-2 rounded-xl bg-primary text-white hover:bg-primary/90">프로로 업그레이드</button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 break-keep">
          🤖 AI는 작업에 가장 잘 맞는 모델로 <b>자동 연결</b>돼요(설정 불필요). 결제(카드)는 준비 중이라, 지금은 <b>본인 API 키</b>를 넣으면 프로처럼 무제한·고급 모델로 쓸 수 있어요.
        </p>
      </Section>

      <Section title="테마">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted max-w-xs">
          {(["light", "dark"] as const).map((t) => {
            const on = mounted && resolvedTheme === t;
            return (
              <button key={t} onClick={() => setTheme(t)}
                className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all " + (on ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm" : "text-muted-foreground")}>
                {t === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{t === "light" ? "화이트" : "다크"}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="앞으로">
        <p className="text-[13px] text-muted-foreground break-keep">
          지금은 일리(AI 비서)·워크플로우·가이드·글쓰기 도구부터 시작해요. 이미지·영상·음성·자동화 같은 기능은 <b>완성되는 대로 하나씩</b> 열립니다. 🔜
        </p>
        <Link href="/illo" className="inline-block mt-3 text-[13px] font-bold text-primary dark:text-[#FBAA60] hover:underline">대리인 소개 보기 →</Link>
      </Section>
    </ViewScroll>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="text-sm font-bold text-muted-foreground mb-2.5">{title}</h2>
      <div className="rounded-2xl bg-card border border-border p-4">{children}</div>
    </section>
  );
}

/* ─────────────────── 기본 생성 (이미지·영상) — 패키지 아님 ─────────────────── */
function BasicGen({ kind, free, quota, setQuota }: {
  kind: "image" | "video"; free: boolean; quota: number | null; setQuota: (n: number) => void;
}) {
  const isImg = kind === "image";
  const [input, setInput] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function run() {
    if (!input.trim() || busy) return;
    setBusy(true); setErr(""); setOut(null);
    try {
      const u = getFirebaseAuth().currentUser;
      const idToken = u ? await u.getIdToken() : undefined;
      if (!idToken) throw new Error("LOGIN_REQUIRED");
      const r = await callMedia({ idToken, kind, prompt: input.trim() });
      setOut(isImg ? r.image || null : r.video || null);
      if (typeof r.quotaRemaining === "number") setQuota(r.quotaRemaining);
      if (!(isImg ? r.image : r.video)) setErr("생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "오류가 발생했습니다.";
      if (/FREE_QUOTA_EXCEEDED/.test(raw)) setErr("오늘 무료 한도(하루 30회)를 다 쓰셨어요. 🌙 내일 다시 이용해 주세요.");
      else if (/LOGIN_REQUIRED/.test(raw)) setErr("로그인이 필요합니다.");
      else setErr(raw);
    } finally { setBusy(false); }
  }
  return (
    <ViewScroll>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-orange-950/30 grid place-items-center text-xl">{isImg ? "🎨" : "🎬"}</span>
        <div>
          <h1 className="text-lg font-extrabold text-foreground leading-tight">{isImg ? "이미지 생성" : "영상 생성"}</h1>
          <p className="text-xs text-muted-foreground">글로 설명하면 {isImg ? "이미지를" : "짧은 영상을"} 만들어드려요</p>
        </div>
      </div>
      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground/50 mb-2">{isImg ? "어떤 이미지를 원하세요?" : "어떤 영상을 원하세요?"}</label>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4}
        placeholder={isImg ? "예) 따뜻한 감성의 홈카페 디저트 사진, 부드러운 자연광" : "예) 빵이 오븐에서 부풀어 오르는 클로즈업, 따뜻한 조명"}
        className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:border-primary resize-y mb-4" />
      {free && <p className="text-[12px] text-muted-foreground mb-2 text-center">🆓 무료 · 오늘 남은 <b className={(quota ?? FREE_LIMIT) <= 5 ? "text-rose-500" : "text-primary"}>{quota ?? FREE_LIMIT}</b> / {FREE_LIMIT}회</p>}
      <button onClick={run} disabled={busy || !input.trim()}
        className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
        {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> 생성 중…{!isImg && " (영상은 1~2분)"}</> : <><Sparkles className="w-5 h-5" /> {isImg ? "이미지 생성" : "영상 생성"}</>}
      </button>
      {err && <p className="text-sm text-rose-500 mt-4 break-keep">{err}</p>}
      {out && (
        <div className="mt-6">
          {isImg
            ? <img src={out} alt="생성 이미지" className="w-full max-w-lg rounded-2xl border border-border" />
            : <video src={out} controls className="w-full max-w-lg rounded-2xl border border-border" />}
          <a href={out} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[12px] font-bold text-primary hover:underline">원본 다운로드/열기 ↗</a>
        </div>
      )}
    </ViewScroll>
  );
}

/* ─────────────────────────── AI 도구 실행 ─────────────────────────── */
function ToolView({ tool, runAI, free, quota, onShowKey, onBack }: {
  tool: typeof ILLO_TOOL_BY_ID[string];
  runAI: (p: string, featureId: string, rawInput?: string) => Promise<{ text: string; image?: string | null; video?: string | null; steps?: string[] }>;
  free: boolean; quota: number | null; onShowKey: () => void; onBack: () => void;
}) {
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string[]>(tool.defaultAspects || []);
  const [result, setResult] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [tone, setToneText] = useState("");      // 내 고정 말투/스타일
  const [toneOpen, setToneOpen] = useState(false);
  const [length, setLength] = useState(tool.defaultLength || "");  // 길이(단일 선택)
  const [flow, setFlow] = useState<FlowStepDetail[]>([]);          // 이 도구의 워크플로우
  const [wfEdit, setWfEdit] = useState(false);
  const wfDrag = useRef<number | null>(null);
  useEffect(() => {
    const t = getTone(tool.id); if (t) { setToneText(t); setToneOpen(true); }
    setFlow(loadCustomFlow(tool.id) || flowDetailForTool(tool.id));
  }, []);

  function writeWf(steps: FlowStepDetail[]) { setFlow(steps); saveCustomFlow(tool.id, steps); }
  function moveWf(i: number, dir: number) { const s = [...flow]; const j = i + dir; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; writeWf(s); }
  function removeWf(i: number) { writeWf(flow.filter((_, k) => k !== i)); }
  function addWf(opt: FlowStepDetail) { writeWf([...flow, { ...opt }]); }
  function resetWf() { clearCustomFlow(tool.id); setFlow(flowDetailForTool(tool.id)); }

  function togglePick(a: string) { setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a])); }
  async function run() {
    if (!input.trim() || busy) return;
    setBusy(true); setErr(""); setResult(""); setImage(null); setVideo(null); setSteps([]);
    try {
      const picked2 = length ? [...picked, length] : picked;
      const prompt = tool.buildPrompt(input, picked2) + (tone.trim() ? `\n\n[항상 지킬 말투·스타일 — 반드시 반영]\n${tone.trim()}` : "");
      const r = await runAI(prompt, tool.id, input);
      setResult(r.text);
      setImage(r.image || null); setVideo(r.video || null); setSteps(r.steps || []);
      saveResult({ toolId: tool.id, toolLabel: tool.title, input, output: r.text });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "오류가 발생했습니다.";
      if (/FREE_QUOTA_EXCEEDED/.test(raw)) setErr("오늘 무료 한도(하루 30회)를 다 쓰셨어요. 🌙 내일 다시 이용해 주세요.");
      else if (/LOGIN_REQUIRED/.test(raw)) setErr("로그인이 필요합니다.");
      else setErr(raw);
    } finally { setBusy(false); }
  }
  async function copyResult() {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  }

  return (
    <ViewScroll>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary mb-5">
        <ArrowLeft className="w-4 h-4" /> 홈
      </button>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-orange-950/30 grid place-items-center text-xl">{tool.icon}</span>
        <div>
          <h1 className="text-lg font-extrabold text-foreground leading-tight">{tool.title}</h1>
          <p className="text-xs text-muted-foreground">{tool.desc}</p>
        </div>
      </div>

      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground/50 mb-2">{tool.inputLabel}</label>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={tool.placeholder} rows={5}
        className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:border-primary resize-y mb-4" />

      {tool.aspects && (
        <div className="flex flex-wrap gap-2 mb-5">
          {tool.aspects.map((a) => (
            <button key={a} onClick={() => togglePick(a)}
              className={"px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors " + (picked.includes(a) ? "bg-primary border-primary text-white" : "bg-card border-border text-muted-foreground dark:text-muted-foreground")}>
              {a}
            </button>
          ))}
        </div>
      )}

      {tool.lengthOptions && (
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-muted-foreground mb-1.5">길이 <span className="font-normal">(하나만 선택)</span></div>
          <div className="flex flex-wrap gap-2">
            {tool.lengthOptions.map((l) => (
              <button key={l} onClick={() => setLength(length === l ? "" : l)}
                className={"px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors " + (length === l ? "bg-primary border-primary text-white" : "bg-card border-border text-muted-foreground dark:text-muted-foreground")}>
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 내 고정 말투/스타일 — "추가"했을 때만 입력칸 표시, 저장되면 매번 자동 적용 */}
      {toneOpen ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[12px] font-bold text-muted-foreground">✍️ 내 고정 말투·스타일 <span className="font-normal text-muted-foreground">— 매번 자동 적용</span></label>
            <button onClick={() => { setToneText(""); saveTone(tool.id, ""); setToneOpen(false); }} className="text-[11px] text-muted-foreground hover:text-rose-500">제거</button>
          </div>
          <textarea value={tone} onChange={(e) => { setToneText(e.target.value); saveTone(tool.id, e.target.value); }} rows={2}
            placeholder="예) 항상 정중한 존댓말, 이모지 적게, 브랜드명 '워크일로' 사용, 너무 길지 않게"
            className="w-full px-3.5 py-2.5 rounded-xl bg-primary/10 dark:bg-orange-950/10 border border-primary/40 text-[13px] focus:outline-none focus:border-primary resize-y" />
        </div>
      ) : (
        <button onClick={() => setToneOpen(true)} className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-primary border border-dashed border-border rounded-lg px-3 py-1.5">
          <Plus className="w-3.5 h-3.5" /> 내 고정 말투·스타일 추가
        </button>
      )}

      {free && <p className="text-[12px] text-muted-foreground mb-2 text-center">🆓 무료 · 오늘 남은 <b className={(quota ?? FREE_LIMIT) <= 5 ? "text-rose-500" : "text-primary"}>{quota ?? FREE_LIMIT}</b> / {FREE_LIMIT}회</p>}
      {busy && <p className="text-[11px] text-muted-foreground mt-2 text-center break-keep">여러 AI가 순서대로 작업 중이에요 — 리서치 → 작성 → 검토 → 이미지/영상. 잠시만요…</p>}
      <button onClick={run} disabled={busy || !input.trim()}
        className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
        {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> 생성 중…</> : <><Sparkles className="w-5 h-5" /> {tool.cta}</>}
      </button>

      {err && <p className="text-sm text-rose-500 mt-4 leading-relaxed break-keep">{err}</p>}

      {result && (
        <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <span className="text-xs font-bold text-muted-foreground">결과 · 보관함에 저장됨</span>
            <span className="flex items-center gap-3">
              <button onClick={() => downloadText(`${tool.title}.txt`, result)} className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary">
                <Download className="w-3.5 h-3.5" /> 다운로드
              </button>
              <button onClick={copyResult} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}
              </button>
            </span>
          </div>
          {steps.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pt-3">
              {steps.map((s, i) => (
                <span key={i} className="text-[10.5px] font-semibold text-primary bg-primary/10 dark:bg-orange-950/30 rounded-full px-2 py-0.5">{s}</span>
              ))}
            </div>
          )}
          <pre className="px-4 py-4 text-sm text-foreground whitespace-pre-wrap break-words font-sans leading-relaxed">{result}</pre>
          {image && (
            <div className="px-4 pb-4">
              <div className="text-[11px] font-bold text-muted-foreground mb-1.5">🎨 생성된 이미지 (fal.ai)</div>
              <img src={image} alt="생성 이미지" className="w-full max-w-md rounded-xl border border-border" />
              <a href={image} target="_blank" rel="noreferrer" className="inline-block mt-1.5 text-[11px] text-primary hover:underline">원본 열기 ↗</a>
            </div>
          )}
          {video && (
            <div className="px-4 pb-4">
              <div className="text-[11px] font-bold text-muted-foreground mb-1.5">🎬 생성된 영상 (fal.ai)</div>
              <video src={video} controls className="w-full max-w-md rounded-xl border border-border" />
              <a href={video} target="_blank" rel="noreferrer" className="inline-block mt-1.5 text-[11px] text-primary hover:underline">원본 열기 ↗</a>
            </div>
          )}
        </div>
      )}

      {/* 이 도구의 AI 워크플로우 — 보기 + 편집 (등록한 도구에서만) */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-bold text-muted-foreground dark:text-muted-foreground/50">⚙️ 이 작업의 AI 워크플로우 · {flow.length}단계</span>
          <span className="flex items-center gap-3 shrink-0">
            {hasCustomFlow(tool.id) && <button onClick={resetWf} className="text-[11px] text-muted-foreground hover:text-rose-500">기본값</button>}
            <button onClick={() => setWfEdit((v) => !v)} className={"text-[11px] font-semibold " + (wfEdit ? "text-primary" : "text-muted-foreground hover:text-primary")}>{wfEdit ? "완료" : "편집"}</button>
          </span>
        </div>
        <div className="relative">
          {flow.map((s, i) => (
            <div key={i}
              draggable={wfEdit}
              onDragStart={() => { wfDrag.current = i; }}
              onDragOver={(e) => { if (wfEdit) e.preventDefault(); }}
              onDrop={() => { const f = wfDrag.current; if (f != null && f !== i) { const s2 = [...flow]; const [m] = s2.splice(f, 1); s2.splice(i, 0, m); writeWf(s2); } wfDrag.current = null; }}
              className={"flex gap-3 pb-3 last:pb-0 relative " + (wfEdit ? "cursor-grab active:cursor-grabbing" : "")}>
              {!wfEdit && i < flow.length - 1 && <span className="absolute left-[9px] top-[18px] bottom-0 w-px bg-border" />}
              <span className="shrink-0 w-[18px] h-[18px] rounded-full bg-primary/15 text-primary text-[10px] font-bold grid place-items-center z-10 mt-0.5">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12.5px] font-semibold text-foreground">{s.icon} {s.title}</span>
                  {s.role && <span className="text-[9.5px] text-muted-foreground">{s.role}</span>}
                </div>
                <div className="text-[11px] text-muted-foreground dark:text-muted-foreground leading-snug break-keep mt-0.5">{s.detail}</div>
              </div>
              {wfEdit && (
                <span className="shrink-0 flex items-start gap-1.5 text-muted-foreground/60 pt-0.5">
                  <button onClick={() => moveWf(i, -1)} disabled={i === 0} className="hover:text-primary disabled:opacity-25 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveWf(i, 1)} disabled={i === flow.length - 1} className="hover:text-primary disabled:opacity-25 transition-colors"><ChevronDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeWf(i)} className="hover:text-rose-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </span>
              )}
            </div>
          ))}
        </div>
        {wfEdit && (
          <div className="mt-2 pt-3 border-t border-dashed border-border">
            <div className="text-[10px] text-muted-foreground mb-2">＋ 단계 추가</div>
            <div className="flex flex-wrap gap-1.5">
              {STEP_PALETTE.map((opt, k) => (
                <button key={k} onClick={() => addWf(opt)} className="text-[11px] text-muted-foreground px-2 py-1 rounded-md border border-border hover:border-primary hover:text-primary transition-colors">+ {opt.icon} {opt.title}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ViewScroll>
  );
}

/* ─────────────────────────── 로그인 (EXE와 동일 디자인) ─────────────────────────── */
function IlloLogin({ onShowGuide, onDevPreview }: { onShowGuide: () => void; onDevPreview?: () => void }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const isSignup = mode === "signup";

  useEffect(() => {
    try { const e = localStorage.getItem("illo.web.email"); if (e) { setEmail(e); setRemember(true); } } catch { /* */ }
  }, []);

  function switchMode(m: "login" | "signup") { setMode(m); setErr(""); setPw2(""); }

  async function submit() {
    if (busy) return;
    if (!email.trim() || !pw) { setErr("이메일과 비밀번호를 입력하세요."); return; }
    if (isSignup) {
      if (pw.length < 6) { setErr("비밀번호는 6자 이상으로 설정하세요."); return; }
      if (pw !== pw2) { setErr("비밀번호가 일치하지 않습니다. 다시 확인해 주세요."); return; }
    }
    setBusy(true); setErr("");
    const r = isSignup
      ? await signup({ email: email.trim(), password: pw, name: email.trim().split("@")[0] })
      : await login(email.trim(), pw);
    if (!r.success) { setErr(r.error || "오류가 발생했습니다."); setBusy(false); return; }
    try {
      if (remember) localStorage.setItem("illo.web.email", email.trim());
      else localStorage.removeItem("illo.web.email");
    } catch { /* */ }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary";

  return (
    <div className="w-full max-w-sm bg-card rounded-3xl border border-border shadow-xl p-8">
      <div className="flex flex-col items-center mb-6">
        <img src="/illo-logo.png" alt="대리인 : AI비서" className="w-14 h-14 rounded-2xl shadow-md mb-3" />
        <div className="text-xl font-extrabold leading-none"><span className="text-primary">대리인</span><span className="text-muted-foreground"> : AI비서</span></div>
        <div className="text-[13px] text-muted-foreground mt-2">
          {isSignup ? "계정을 만들고 바로 시작하세요" : "혼자서도 일이 되는 곳"}
        </div>
      </div>

      <div className="flex gap-1 p-1 mb-4 rounded-xl bg-muted border border-border">
        {(["login", "signup"] as const).map((m) => (
          <button key={m} onClick={() => switchMode(m)}
            className={"flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all " + (mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="이메일" autoFocus autoCapitalize="off" autoCorrect="off" className={inputCls + " mb-2.5"} />
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={isSignup ? "비밀번호 (6자 이상)" : "비밀번호"} className={inputCls + (isSignup ? " mb-2.5" : " mb-3")} />
      {isSignup && (
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="비밀번호 확인 (한 번 더 입력)"
          className={"w-full mb-3 px-4 py-3 rounded-xl bg-muted border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none " + (pw2 && pw !== pw2 ? "border-rose-400 focus:border-rose-500" : "border-border focus:border-primary")} />
      )}

      {!isSignup && (
        <label className="flex items-center gap-2 mb-3.5 px-1 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-[#F9954E] cursor-pointer" />
          <span className="text-[12.5px] text-muted-foreground">아이디 저장</span>
        </label>
      )}

      <button onClick={submit} disabled={busy} className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {isSignup ? "가입 중…" : "로그인 중…"}</> : isSignup ? "회원가입하고 시작" : "로그인"}
      </button>

      {err && <div className="text-[12px] text-rose-500 text-center mt-3 leading-relaxed">{err}</div>}

      <div className="text-[12px] text-muted-foreground text-center mt-5">
        {isSignup ? (
          <>이미 계정이 있으신가요?{" "}<button onClick={() => switchMode("login")} className="text-primary dark:text-[#FBAA60] font-semibold hover:underline">로그인</button></>
        ) : (
          <>계정이 없으신가요?{" "}<button onClick={() => switchMode("signup")} className="text-primary dark:text-[#FBAA60] font-semibold hover:underline">회원가입</button>{" · "}<Link href="/" className="text-muted-foreground hover:underline">사이트</Link></>
        )}
      </div>
      <button onClick={onShowGuide} className="block mx-auto mt-4 text-[12.5px] font-bold text-primary dark:text-[#FBAA60]">🔰 대리인이 처음이신가요? 시작 가이드</button>
      <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">로그인하면 AI 도구를 하루 50회 무료로 쓸 수 있어요.</p>
      {onDevPreview && (
        <button onClick={onDevPreview} className="block w-full mt-4 py-2 rounded-xl border border-dashed border-border text-[12px] font-semibold text-muted-foreground hover:text-primary hover:border-primary transition-colors">
          🔧 로그인 없이 미리보기 (개발용 · localhost)
        </button>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="w-full min-h-screen grid place-items-center bg-background px-5 font-sans">{children}</main>;
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary text-white text-[13px] font-extrabold grid place-items-center shrink-0">{n}</div>
      <div className="min-w-0">
        <div className="font-bold text-foreground mb-1">{title}</div>
        <div className="text-[13.5px] text-muted-foreground dark:text-muted-foreground leading-relaxed break-keep space-y-1">{children}</div>
      </div>
    </div>
  );
}

function GuideSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg leading-none">{icon}</span>
        <h3 className="font-extrabold text-foreground text-[15px]">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function GuideRow({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-orange-950/30 grid place-items-center text-base shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold text-foreground">{title}</div>
        <div className="text-[12.5px] text-muted-foreground leading-relaxed break-keep">{children}</div>
      </div>
    </div>
  );
}

function GuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <span className="font-extrabold text-foreground">🔰 대리인 : AI비서 시작 가이드</span>
          <button onClick={onClose} aria-label="닫기" className="w-8 h-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white text-lg">✕</button>
        </div>

        <div className="overflow-y-auto px-5 py-6 space-y-8">
          {/* 소개 */}
          <div className="rounded-2xl bg-primary/10 dark:bg-orange-950/20 p-4">
            <p className="text-[13.5px] text-foreground dark:text-muted-foreground/50 leading-relaxed break-keep">
              <b className="text-primary dark:text-[#FBAA60]">대리인</b>은 AI에게 글쓰기·SNS·카피·상품설명·답변·요약을 맡기고, 비서에게 무엇이든 물어보는 <b>1인용 AI 사무실</b>이에요. <b>로그인만 하면 하루 50회까지 무료</b>로 바로 쓸 수 있어요!
            </p>
          </div>

          {/* 1분 시작 */}
          <GuideSection icon="🚀" title="1분 만에 시작 (무료)">
            <Step n="1" title="로그인 / 회원가입">
              <p>이메일로 가입하거나 로그인하면 끝. 결제·카드 필요 없어요.</p>
            </Step>
            <Step n="2" title="일리에게 묻거나 도구 고르기">
              <p>왼쪽 메뉴에서 <b>일리</b>(🐿️ AI 비서)에게 물어보거나, 원하는 <b>도구</b>·<b>워크플로우 템플릿</b>을 고르세요.</p>
            </Step>
            <Step n="3" title="입력하고 생성 → 복사">
              <p>내용만 적고 <b>생성</b> 버튼을 누르면 AI가 결과를 만들어줘요. <b>복사</b>해서 바로 쓰면 됩니다.</p>
            </Step>
          </GuideSection>

          {/* 화면 둘러보기 */}
          <GuideSection icon="🧭" title="화면 둘러보기">
            <GuideRow icon="🏠" title="오늘의 사무실 (홈)">인사·바로가기·현황 위젯을 한눈에. 편집으로 위젯을 바꿀 수 있어요.</GuideRow>
            <GuideRow icon="🐿️" title="일리 (AI 비서)">무엇이든 묻고, “이 작업엔 이 AI 조합”까지 안내받는 곳.</GuideRow>
            <GuideRow icon="🛠️" title="워크플로우">완성된 템플릿을 고르거나, AI 단계를 노드로 이어 자동화를 설계.</GuideRow>
            <GuideRow icon="📖" title="가이드">어떤 API가 있고 키는 어디서 받는지, 목적별로 안내.</GuideRow>
            <GuideRow icon="🛠️" title="AI 도구">블로그·메일·요약·카피 등 목적별 전문 도구.</GuideRow>
            <GuideRow icon="🧩" title="기능 보관함">필요한 기능만 꺼내 내 메뉴에 추가하는 곳.</GuideRow>
            <GuideRow icon="⚙️" title="설정">키·테마(화이트/다크)·계정 관리.</GuideRow>
          </GuideSection>

          {/* 일리 */}
          <GuideSection icon="🐿️" title="일리 — 뭐든 물어보기">
            <p className="text-[12.5px] text-muted-foreground leading-relaxed break-keep">
              채팅처럼 자유롭게 대화해요. 예) <b>“블로그 글엔 어떤 AI 조합이 좋아?”</b>, <b>“API 키는 어디서 받아?”</b>, <b>“이 글 더 매끄럽게 다듬어줘”</b>.<br />
              <span className="text-muted-foreground">일리(🐿️)는 답도 해주고, 필요하면 알맞은 API·워크플로우 템플릿도 짚어줘요. <b>Enter</b> 전송, <b>Shift+Enter</b> 줄바꿈.</span>
            </p>
          </GuideSection>

          {/* 도구 사용법 */}
          <GuideSection icon="🛠️" title="AI 도구 쓰는 법">
            <Step n="1" title="도구 선택">
              <p>예) 블로그 글쓰기, 상품 상세, 리뷰 답변 등.</p>
            </Step>
            <Step n="2" title="내용 입력 + 옵션 고르기">
              <p>주제/내용을 적고, <b>말투·길이·플랫폼</b> 같은 옵션 칩을 눌러 원하는 스타일을 정해요.</p>
            </Step>
            <Step n="3" title="생성 → 복사">
              <p>결과가 마음에 안 들면 옵션을 바꿔 다시 생성하면 돼요.</p>
            </Step>
          </GuideSection>

          {/* 커스터마이징 */}
          <GuideSection icon="🧩" title="내 메뉴 꾸미기 (커스터마이징)">
            <GuideRow icon="➕" title="기능 보관함에서 추가/끄기">안 쓰는 기능은 끄고, 필요한 것만 켜서 깔끔하게.</GuideRow>
            <GuideRow icon="⠿" title="사이드바 편집">로고 옆 <b>편집</b> → 드래그로 순서 변경, <b>✕</b>로 메뉴에서 빼기.</GuideRow>
            <GuideRow icon="🧱" title="홈 위젯 편집">홈의 <b>편집</b> → 위젯을 드래그·추가·제거해 나만의 홈으로.</GuideRow>
            <GuideRow icon="✍️" title="블로그·SNS는 숨김 상태">필요하면 <b>기능 보관함</b>에서 “추가”를 눌러 꺼내 쓰세요.</GuideRow>
          </GuideSection>

          {/* 무료 vs 내 키 */}
          <GuideSection icon="🔑" title="무료 50회 vs 내 키(무제한)">
            <div className="rounded-2xl border border-border p-3.5 text-[12.5px] text-muted-foreground leading-relaxed break-keep">
              <b className="text-primary">🆓 무료</b> — 로그인만 하면 하루 50회. 키·결제 불필요.<br />
              <b className="text-primary">🔑 내 키</b> — 하루 50회로 부족하면 내 Claude 키를 넣어 <b>무제한</b>. 키는 <b>내 브라우저에만</b> 저장돼요(서버에 안 보냄).
            </div>
            <Step n="1" title="Claude 콘솔 가입 + 소액 충전">
              <p><b>console.anthropic.com</b> 가입 → <b>Billing</b>에서 카드 등록 + <b>$5 충전</b>(크레딧 있어야 작동).</p>
            </Step>
            <Step n="2" title="키 만들기 → 복사 → 붙여넣기">
              <p><b>API Keys → Create Key</b> → 생긴 <b>sk-ant-…</b> 복사 → 설정의 <b>“키 넣기”</b>에 붙여넣기.</p>
              <p className="text-rose-500">⚠️ 키는 만들 때 딱 한 번만 보여요. 꼭 바로 복사!</p>
            </Step>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-primary/40 text-primary dark:text-[#FBAA60] font-bold text-sm">
              🔗 Claude 콘솔 열기 (키 만들러 가기)
            </a>
          </GuideSection>

          {/* 앞으로 */}
          <GuideSection icon="🔜" title="곧 추가될 기능">
            <p className="text-[12.5px] text-muted-foreground leading-relaxed break-keep">
              지금은 <b>일리 + 가이드 + 워크플로우 템플릿 + 글쓰기 도구</b>부터 시작해요. <b>이미지·영상·음성·작곡·자동화 실행</b> 같은 기능은 완성되는 대로 하나씩 열립니다. 설치 없이 브라우저에서 어디서나 쓰세요.
            </p>
          </GuideSection>

          {/* 팁 */}
          <div className="rounded-2xl bg-muted/50 border border-border p-4">
            <div className="text-[13px] font-bold text-foreground mb-1.5">💡 알아두면 좋은 팁</div>
            <ul className="text-[12.5px] text-muted-foreground leading-relaxed break-keep list-disc pl-4 space-y-1">
              <li>결과가 아쉬우면 비서에게 <b>“더 짧게/격식 있게/친근하게”</b> 라고 이어서 말하면 돼요.</li>
              <li>화면이 눈부시면 <b>설정 → 테마</b>에서 다크로 바꿀 수 있어요.</li>
              <li>한 번 넣은 키와 메뉴 구성은 <b>다음에 와도 그대로</b> 유지돼요.</li>
            </ul>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm">무료로 바로 시작 →</button>
        </div>
      </div>
    </div>
  );
}
