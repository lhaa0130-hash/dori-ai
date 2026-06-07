"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase";
import { ILLO_TOOL_BY_ID } from "@/lib/illo/tools";
import { callClaude, ILLO_MODELS, ILLO_DEFAULT_MODEL } from "@/lib/illo/claude";
import { getLocalKey, setLocalKey, getModel, setModel, pullCloudKey } from "@/lib/illo/key";
import {
  ILLO_FEATURES, ILLO_FEATURE_BY_ID, ILLO_GROUP_ORDER, ILLO_DEFAULT_ENABLED,
  loadIlloEnabled, saveIlloEnabled, type IlloFeature,
} from "@/lib/illo/features";
import {
  ArrowLeft, KeyRound, Loader2, Copy, Check, Sparkles, Download,
  Menu, X, Pencil, Plus, LogOut, Sun, Moon, Send, Lock, GripVertical,
} from "lucide-react";

const FREE_LIMIT = 50; // 무료(공용 키) 하루 호출 수

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
  const [model, setModelState] = useState(ILLO_DEFAULT_MODEL);
  const [pulling, setPulling] = useState(false);

  const [enabled, setEnabled] = useState<string[]>(ILLO_DEFAULT_ENABLED);
  const [view, setView] = useState<string>("home");
  const [editing, setEditing] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const [quota, setQuota] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyErr, setKeyErr] = useState("");

  const free = !key; // 본인 키 없으면 무료(공용 키) 모드

  // 키 + 켠 기능 로드
  useEffect(() => {
    setEnabled(loadIlloEnabled());
    if (status !== "authenticated") return;
    setModelState(getModel() || ILLO_DEFAULT_MODEL);
    const lk = getLocalKey();
    if (lk) { setKey(lk); return; }
    pullCloudKey().then((k) => { if (k) { setKey(k); setLocalKey(k); } }).catch(() => {});
  }, [status]);

  // ── 공용 Claude 호출 (무료/내키 자동 + 횟수 갱신) ──
  async function runAI(prompt: string, modelOverride?: string) {
    let idToken: string | undefined;
    if (free) {
      const u = getFirebaseAuth().currentUser;
      idToken = u ? await u.getIdToken() : undefined;
    }
    const r = await callClaude({ apiKey: key || undefined, idToken, prompt, model: modelOverride || model });
    if (typeof r.quotaRemaining === "number") setQuota(r.quotaRemaining);
    return r;
  }

  function goView(id: string) { setView(id); setMobileNav(false); }

  function toggleFeature(id: string) {
    const f = ILLO_FEATURE_BY_ID[id];
    if (!f || f.core || f.kind === "pc") return;
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

  function saveKey() {
    const k = keyInput.trim();
    if (!k) return;
    setLocalKey(k); setKey(k); setKeyInput(""); setShowKey(false); setKeyErr("");
  }
  function removeKey() { setLocalKey(""); setKey(""); }
  async function tryPull() {
    setPulling(true); setKeyErr("");
    const k = await pullCloudKey();
    setPulling(false);
    if (k) { setLocalKey(k); setKey(k); setShowKey(false); }
    else setKeyErr("동기화된 키를 찾지 못했어요. 데스크톱 일로에서 키를 저장했는지 확인하거나, 아래에 직접 입력해 주세요.");
  }

  // ── 오버레이 (가이드 / 키 넣기) ──
  const overlays = (
    <>
      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
      {showKey && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowKey(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 grid place-items-center mx-auto mb-4"><KeyRound className="w-6 h-6 text-[#F9954E]" /></div>
            <h2 className="text-lg font-extrabold text-center text-neutral-900 dark:text-white mb-1.5">내 Claude 키 넣기 (무제한)</h2>
            <p className="text-[13px] text-center text-neutral-500 dark:text-neutral-400 mb-5 break-keep">키를 넣으면 무료 한도 없이 쓸 수 있어요. 키는 회원님 브라우저에만 저장됩니다.</p>
            <button onClick={() => { setShowKey(false); setShowGuide(true); }} className="w-full mb-3 py-2.5 rounded-xl text-sm font-bold text-[#E8832E] dark:text-[#FBAA60] border border-[#F9954E]/40">🔰 키 만드는 법 모르겠어요 (가이드)</button>
            <button onClick={tryPull} disabled={pulling} className="w-full mb-2.5 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-neutral-300 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 데스크톱에서 저장한 키 불러오기
            </button>
            <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveKey()} placeholder="sk-ant-... (키 붙여넣기)" className="w-full mb-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-sm font-mono focus:outline-none focus:border-[#F9954E]" />
            <button onClick={saveKey} className="w-full py-3 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-sm">저장</button>
            {keyErr && <p className="text-xs text-rose-500 mt-3 text-center leading-relaxed">{keyErr}</p>}
          </div>
        </div>
      )}
    </>
  );

  // ── 로그인 게이트 ──
  if (status === "loading") {
    return <Centered><Loader2 className="w-6 h-6 animate-spin text-[#F9954E]" /></Centered>;
  }
  if (status === "unauthenticated") {
    return (
      <Centered>
        <IlloLogin onShowGuide={() => setShowGuide(true)} />
        {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
      </Centered>
    );
  }

  const tool = ILLO_FEATURE_BY_ID[view]?.kind === "tool" ? ILLO_TOOL_BY_ID[view] : null;
  const userName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0] : "사장님");

  // ── 메인 셸 (EXE와 동일 구조: 사이드바 + 뷰) ──
  return (
    <div className="flex h-screen w-full bg-neutral-50 dark:bg-black font-sans overflow-hidden">
      {/* 데스크톱 사이드바 */}
      <div className="hidden md:flex">
        <IlloSidebar
          enabled={enabled} view={view} editing={editing}
          onView={goView} onToggleEdit={() => setEditing((e) => !e)}
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
              enabled={enabled} view={view} editing={editing}
              onView={goView} onToggleEdit={() => setEditing((e) => !e)}
              onReorder={reorder} onRemove={toggleFeature}
              onLogout={logout} userName={userName} userEmail={session?.user?.email || ""}
            />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* 모바일 상단바 */}
        <header className="md:hidden flex items-center gap-2 px-4 h-14 border-b border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <button onClick={() => setMobileNav(true)} className="p-1.5 -ml-1.5 text-neutral-600 dark:text-neutral-300"><Menu className="w-5 h-5" /></button>
          <img src="/illo-logo.png" alt="일로" className="w-7 h-7 rounded-lg" />
          <span className="font-extrabold text-[#F9954E]">일로</span>
          {free && <span className="ml-auto text-[11px] font-semibold text-neutral-400">남은 <b className="text-[#E8832E]">{quota ?? FREE_LIMIT}</b>/{FREE_LIMIT}</span>}
        </header>

        {view === "home" && <Home userName={userName} enabled={enabled} onView={goView} free={free} quota={quota} onShowKey={() => setShowKey(true)} />}
        {view === "assistant" && <Assistant runAI={runAI} free={free} quota={quota} onShowKey={() => setShowKey(true)} userName={userName} />}
        {view === "features" && <FeatureManager enabled={enabled} onToggle={toggleFeature} onView={goView} />}
        {view === "settings" && <Settings keyVal={key} free={free} model={model} onModel={(m) => { setModelState(m); setModel(m); }} onShowKey={() => setShowKey(true)} onRemoveKey={removeKey} onLogout={logout} userName={userName} userEmail={session?.user?.email || ""} />}
        {tool && <ToolView key={view} tool={tool} runAI={runAI} free={free} quota={quota} onShowKey={() => setShowKey(true)} onBack={() => goView("home")} />}
      </main>

      {overlays}
    </div>
  );
}

/* ─────────────────────────── 사이드바 ─────────────────────────── */
function IlloSidebar({
  enabled, view, editing, onView, onToggleEdit, onReorder, onRemove, onLogout, userName, userEmail,
}: {
  enabled: string[]; view: string; editing: boolean;
  onView: (id: string) => void; onToggleEdit: () => void;
  onReorder: (from: number, to: number) => void; onRemove: (id: string) => void;
  onLogout: () => void; userName: string; userEmail: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dragIdx = useRef<number | null>(null);
  const items = enabled.map((id) => ILLO_FEATURE_BY_ID[id]).filter(Boolean) as IlloFeature[];

  return (
    <aside className="w-60 shrink-0 h-full bg-white dark:bg-zinc-950 border-r border-neutral-200 dark:border-zinc-800 flex flex-col">
      <div className="px-5 py-5 border-b border-neutral-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <img src="/illo-logo.png" alt="일로" className="w-9 h-9 rounded-xl shadow-sm" />
          <div className="flex-1 min-w-0">
            <div className="text-base font-extrabold leading-none text-[#F9954E]">일로</div>
            <div className="text-[10px] text-neutral-400 mt-1 tracking-wide">by DORI-AI</div>
          </div>
          <button onClick={onToggleEdit} title="메뉴 편집"
            className={"shrink-0 text-[11px] px-2 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 " + (editing ? "bg-[#F9954E] text-white" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-800")}>
            <Pencil className="w-3 h-3" /> {editing ? "완료" : "편집"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="mx-3 mt-3 text-[11px] text-[#E8832E] bg-[#FFF5EB] dark:bg-orange-950/20 rounded-lg px-2.5 py-2 leading-relaxed">
          ⠿ 드래그로 순서 변경, ✕로 메뉴에서 빼기. 아래 ＋로 더 추가.
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {items.map((item, idx) => {
            const active = view === item.id;
            const canEdit = editing && !item.core;
            return (
              <div
                key={item.id}
                draggable={canEdit}
                onDragStart={() => { dragIdx.current = idx; }}
                onDragOver={(e) => { if (editing) e.preventDefault(); }}
                onDrop={() => { const f = dragIdx.current; if (f != null && f !== idx) onReorder(f, idx); dragIdx.current = null; }}
                className="relative"
              >
                <button
                  onClick={() => !editing && onView(item.id)}
                  className={"group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all " + (
                    editing
                      ? "border border-dashed border-[#F9954E]/30 bg-[#F9954E]/[0.04] " + (canEdit ? "cursor-grab active:cursor-grabbing pr-9" : "opacity-80")
                      : active
                        ? "bg-[#F9954E]/[0.13] text-[#E8832E] font-semibold cursor-pointer"
                        : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-800 cursor-pointer"
                  )}
                >
                  {canEdit && <GripVertical className="w-3.5 h-3.5 text-neutral-300 shrink-0" />}
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                </button>
                {canEdit && (
                  <button onClick={() => onRemove(item.id)} title="메뉴에서 빼기"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-500/90 text-white text-xs font-bold grid place-items-center active:scale-90">
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={() => onView("features")}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-[#E8832E] hover:bg-[#FFF5EB] dark:hover:bg-orange-950/20 transition-colors border border-dashed border-neutral-300 dark:border-zinc-700">
          <Plus className="w-4 h-4" /> 기능 추가 · 관리
        </button>
      </nav>

      <div className="p-3 border-t border-neutral-100 dark:border-zinc-800 space-y-2">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-zinc-900">
          {(["light", "dark"] as const).map((t) => {
            const on = mounted && resolvedTheme === t;
            return (
              <button key={t} onClick={() => setTheme(t)}
                className={"flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all " + (on ? "bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300")}>
                {t === "light" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {t === "light" ? "화이트" : "다크"}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="text-[12px] text-neutral-700 dark:text-neutral-200 font-semibold truncate">{userName}</div>
            <div className="text-[10px] text-neutral-400 truncate">{userEmail}</div>
          </div>
          <button onClick={onLogout} title="로그아웃" className="shrink-0 text-neutral-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="px-1 text-[10px] text-neutral-300 dark:text-zinc-600">일로 웹 · by DORI-AI</div>
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
  if (!free) return <p className="text-sm text-neutral-500 dark:text-neutral-400">✓ 내 키로 무제한 사용 중</p>;
  const left = quota ?? FREE_LIMIT;
  return (
    <p className="text-sm text-neutral-500 dark:text-neutral-400">
      🆓 무료로 쓰는 중 · 오늘 남은 <b className={left <= 5 ? "text-rose-500" : "text-[#E8832E]"}>{left}</b>/{FREE_LIMIT}회 — 더 쓰려면{" "}
      <button onClick={onShowKey} className="underline font-semibold text-[#E8832E] dark:text-[#FBAA60]">내 키 넣기</button>(무제한)
    </p>
  );
}

/* ─────────────────────────── 홈 (위젯 대시보드 — EXE와 동일) ─────────────────────────── */
const HOME_WIDGETS: { id: string; label: string; icon: string; desc: string }[] = [
  { id: "assistant", label: "비서 바로가기", icon: "💬", desc: "비서에게 일 시키기" },
  { id: "stats", label: "현황 요약", icon: "📊", desc: "결재대기 · 진행중 · 직원" },
  { id: "finance", label: "이번 달 수지", icon: "💰", desc: "수익 · 비용 · 이익" },
  { id: "recent", label: "최근 작업", icon: "🕑", desc: "최근 작업 목록" },
  { id: "quicktools", label: "빠른 도구", icon: "⚡", desc: "켜둔 AI 도구 모음" },
  { id: "shortcuts", label: "메뉴 바로가기", icon: "🔗", desc: "켜둔 기능 바로가기" },
];
const HOME_WIDGET_BY_ID = Object.fromEntries(HOME_WIDGETS.map((w) => [w.id, w]));
const DEFAULT_HOME = ["assistant", "stats", "finance", "recent", "quicktools"];
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
          <button onClick={() => onView("assistant")} className="w-full bg-gradient-to-r from-[#F9954E] to-[#FB8C3E] text-white rounded-3xl px-5 py-4 flex items-center gap-3.5 shadow-lg shadow-[#F9954E]/25 hover:brightness-95 transition">
            <span className="w-11 h-11 rounded-2xl bg-white/20 grid place-items-center text-2xl shrink-0">💬</span>
            <span className="text-left flex-1 min-w-0">
              <span className="block font-extrabold text-[15px]">비서에게 일 시키기</span>
              <span className="block text-[12px] text-white/85 mt-0.5">현황 질문 · 작업 지시 · 웹 조사</span>
            </span>
            <span className="text-white/80 text-xl">→</span>
          </button>
        );
      case "stats":
        return (
          <div className="grid grid-cols-3 gap-2.5">
            {[{ e: "📋", l: "결재대기" }, { e: "⚙️", l: "진행중" }, { e: "🧑‍💼", l: "직원" }].map((c) => (
              <button key={c.l} onClick={() => onView("features")} className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 flex flex-col items-center gap-0.5 active:scale-95 transition">
                <span className="text-lg leading-none mb-0.5">{c.e}</span>
                <span className="text-xl font-extrabold leading-none text-neutral-900 dark:text-white">0</span>
                <span className="text-[10.5px] text-neutral-400">{c.l}</span>
              </button>
            ))}
          </div>
        );
      case "finance":
        return (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold text-neutral-900 dark:text-white">이번 달</span>
              <button onClick={() => onView("settings")} className="text-[11px] text-[#E8832E] font-semibold">자세히 →</button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{ l: "수익", v: "₩0", c: "text-emerald-500" }, { l: "비용", v: "₩0", c: "text-neutral-700 dark:text-neutral-200" }, { l: "이익", v: "₩0", c: "text-[#E8832E]" }].map((f) => (
                <div key={f.l}>
                  <div className="text-[10.5px] text-neutral-400 mb-0.5">{f.l}</div>
                  <div className={"text-[13px] font-extrabold leading-tight " + f.c}>{f.v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-zinc-800 flex items-center justify-between text-[12px]">
              <span className="text-neutral-400">{free ? "오늘 남은 무료" : "내 키"}</span>
              <span className="font-bold text-blue-500">{free ? `${quota ?? FREE_LIMIT} / ${FREE_LIMIT}회` : "무제한"}</span>
            </div>
          </div>
        );
      case "recent":
        return (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800">
              <span className="text-[13px] font-bold text-neutral-900 dark:text-white">최근 작업</span>
              <button onClick={() => onView("assistant")} className="text-[11px] text-[#E8832E] font-semibold">전체 →</button>
            </div>
            <div className="px-4 py-8 text-center text-[13px] text-neutral-400">아직 작업이 없어요.</div>
          </div>
        );
      case "quicktools": {
        const tools = enabled.map((id) => ILLO_FEATURE_BY_ID[id]).filter((f) => f && f.kind === "tool").slice(0, 8) as IlloFeature[];
        return (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4">
            <div className="text-[13px] font-bold text-neutral-900 dark:text-white mb-2.5">빠른 도구</div>
            {tools.length === 0 ? (
              <button onClick={() => onView("features")} className="text-[12px] text-[#E8832E] font-semibold">🧩 보관함에서 도구 꺼내오기 →</button>
            ) : (
              <div className="grid grid-cols-4 gap-2.5">
                {tools.map((t) => (
                  <button key={t.id} onClick={() => onView(t.id)} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
                    <span className="w-full aspect-square rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 border border-neutral-100 dark:border-zinc-800 grid place-items-center text-xl">{t.icon}</span>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center leading-tight truncate w-full">{t.label}</span>
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
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4">
            <div className="text-[13px] font-bold text-neutral-900 dark:text-white mb-2.5">메뉴 바로가기</div>
            <div className="grid grid-cols-4 gap-2.5">
              {items.map((f) => (
                <button key={f.id} onClick={() => onView(f.id)} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
                  <span className="w-full aspect-square rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 border border-neutral-100 dark:border-zinc-800 grid place-items-center text-xl">{f.icon}</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 text-center leading-tight truncate w-full">{f.label}</span>
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
          <div className="text-neutral-400 text-[13px]">{greeting()}</div>
          <h1 className="text-[22px] font-extrabold text-neutral-900 dark:text-white tracking-tight mt-0.5">오늘의 사무실</h1>
        </div>
        <button onClick={() => setEditing((e) => !e)}
          className={"px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors shrink-0 " + (editing ? "bg-[#F9954E] text-white" : "bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400")}>
          {editing ? "✓ 완료" : "⠿ 편집"}
        </button>
      </div>

      {editing && (
        <div className="text-[12px] text-[#E8832E] mb-3 bg-[#FFF5EB] dark:bg-orange-950/20 rounded-xl px-3 py-2.5 leading-relaxed">
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
          <div className="text-[12px] font-semibold text-neutral-400 mb-2 px-1">＋ 위젯 추가</div>
          <div className="grid grid-cols-1 gap-2.5">
            {available.map((w) => (
              <button key={w.id} onClick={() => add(w.id)}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-dashed border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-left active:scale-[0.98] transition">
                <span className="text-xl w-9 h-9 rounded-xl bg-[#FFF5EB] dark:bg-orange-950/30 grid place-items-center shrink-0">{w.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold text-neutral-900 dark:text-white">{w.label}</span>
                  <span className="block text-[11.5px] text-neutral-400 truncate">{w.desc}</span>
                </span>
                <span className="text-[#F9954E] font-bold text-lg">＋</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {widgets.length === 0 && (
        <div className="text-center py-12 text-neutral-400 text-[13px]">
          홈이 비어 있어요. <button onClick={() => setEditing(true)} className="text-[#E8832E] font-semibold">＋ 위젯 추가</button>
        </div>
      )}
    </div>
    </div>
  );
}

/* ─────────────────────────── 비서실 (채팅) ─────────────────────────── */
type ChatMsg = { role: "user" | "assistant"; content: string };
function Assistant({ runAI, free, quota, onShowKey, userName }: {
  runAI: (p: string) => Promise<{ text: string }>; free: boolean; quota: number | null; onShowKey: () => void; userName: string;
}) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const SUGGEST = ["이번 주 할 일 정리해줘", "사업 아이디어 3개 제안해줘", "이 글 더 매끄럽게 다듬어줘", "마케팅 문구 추천해줘"];

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput(""); setErr("");
    const next: ChatMsg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next); setBusy(true);
    try {
      const history = next.slice(-8).map((m) => `${m.role === "user" ? "사용자" : "비서"}: ${m.content}`).join("\n");
      const prompt =
        `당신은 '일로'의 유능하고 친절한 AI 비서입니다. 항상 정중한 존댓말로, 핵심을 먼저 말하고 필요하면 단계로 정리해 답하세요. ` +
        `사용자 이름은 '${userName}'입니다.\n\n[대화]\n${history}\n비서:`;
      const r = await runAI(prompt);
      setMsgs((m) => [...m, { role: "assistant", content: r.text }]);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "오류가 발생했습니다.";
      if (/FREE_QUOTA_EXCEEDED/.test(raw)) setErr("오늘 무료 한도(하루 50회)를 다 쓰셨어요. 🌙 내일 다시 쓰거나, 내 Claude 키를 넣으면 무제한이에요.");
      else if (/LOGIN_REQUIRED/.test(raw)) setErr("로그인이 필요합니다.");
      else setErr(raw);
    } finally { setBusy(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-neutral-200 dark:border-zinc-800 px-5 sm:px-8 py-3.5 flex items-center gap-2 shrink-0">
        <span className="text-xl">💬</span>
        <h1 className="font-extrabold text-neutral-900 dark:text-white">비서실</h1>
        {free && <span className="ml-auto text-[12px] text-neutral-400">오늘 남은 <b className={(quota ?? FREE_LIMIT) <= 5 ? "text-rose-500" : "text-[#E8832E]"}>{quota ?? FREE_LIMIT}</b>/{FREE_LIMIT}회</span>}
      </div>

      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          {msgs.length === 0 ? (
            <div className="text-center pt-10">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-bold text-neutral-900 dark:text-white mb-1">무엇을 도와드릴까요?</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 break-keep">아래를 눌러보거나, 자유롭게 입력하세요.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGEST.map((s) => (
                  <button key={s} onClick={() => send(s)} className="px-3.5 py-2 rounded-full text-[13px] font-semibold bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-neutral-300 hover:border-[#F9954E] hover:text-[#E8832E] transition-colors">
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
                      ? "bg-[#F9954E] text-white rounded-br-md"
                      : "bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-800 dark:text-neutral-100 rounded-bl-md"
                  )}>{m.content}</div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800"><Loader2 className="w-4 h-4 animate-spin text-[#F9954E]" /></div>
                </div>
              )}
              {err && (
                <p className="text-sm text-rose-500 text-center leading-relaxed break-keep">{err}{(/한도/.test(err)) && <> <button onClick={onShowKey} className="underline font-bold">키 넣기</button></>}</p>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-zinc-800 p-3 sm:p-4 shrink-0 bg-neutral-50 dark:bg-black">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="비서에게 물어보세요… (Shift+Enter 줄바꿈)" rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-[#F9954E] max-h-32" />
          <button onClick={() => send()} disabled={busy || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white grid place-items-center disabled:opacity-40 transition-colors">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 기능 보관함 ─────────────────────────── */
function FeatureManager({ enabled, onToggle, onView }: {
  enabled: string[]; onToggle: (id: string) => void; onView: (id: string) => void;
}) {
  return (
    <ViewScroll>
      <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-1">🧩 기능 보관함</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-7 break-keep">필요한 기능만 켜서 왼쪽 메뉴에 추가하세요. 안 쓰는 건 꺼두면 깔끔해요.</p>

      {ILLO_GROUP_ORDER.map((group) => {
        const feats = ILLO_FEATURES.filter((f) => f.group === group);
        if (!feats.length) return null;
        const isPc = group === "PC 전용";
        return (
          <section key={group} className="mb-8">
            <h2 className="text-sm font-bold text-neutral-400 mb-3">{group}{isPc && <span className="ml-2 text-[11px] font-medium text-neutral-300">데스크톱(PC)에서 사용</span>}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {feats.map((f) => {
                const on = enabled.includes(f.id);
                return (
                  <div key={f.id} className={"flex items-center gap-3 p-3.5 rounded-2xl border transition-colors " + (isPc ? "bg-neutral-100/60 dark:bg-zinc-900/40 border-neutral-200 dark:border-zinc-800 opacity-80" : on ? "bg-white dark:bg-zinc-900 border-[#F9954E]/50" : "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800")}>
                    <span className="w-10 h-10 rounded-xl bg-[#FFF5EB] dark:bg-orange-950/30 grid place-items-center text-lg shrink-0">{f.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">{f.label}{f.id === "blog" || f.id === "sns" ? <span className="text-[10px] font-semibold text-[#E8832E] bg-[#FFF5EB] dark:bg-orange-950/30 px-1.5 py-0.5 rounded">선택</span> : null}</div>
                      <div className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate">{f.desc}</div>
                    </div>
                    {isPc ? (
                      <span className="shrink-0 text-neutral-300 dark:text-zinc-600"><Lock className="w-4 h-4" /></span>
                    ) : f.core ? (
                      <span className="shrink-0 text-[11px] text-neutral-400 font-semibold">고정</span>
                    ) : (
                      <button onClick={() => onToggle(f.id)}
                        className={"shrink-0 text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors " + (on ? "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400 hover:text-rose-500" : "bg-[#F9954E] text-white hover:bg-[#E8832E]")}>
                        {on ? "끄기" : "추가"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </ViewScroll>
  );
}

/* ─────────────────────────── 설정 ─────────────────────────── */
function Settings({ keyVal, free, model, onModel, onShowKey, onRemoveKey, onLogout, userName, userEmail }: {
  keyVal: string; free: boolean; model: string; onModel: (m: string) => void;
  onShowKey: () => void; onRemoveKey: () => void; onLogout: () => void; userName: string; userEmail: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const masked = keyVal ? keyVal.slice(0, 7) + "•••••••" + keyVal.slice(-4) : "";

  return (
    <ViewScroll>
      <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-7">⚙️ 설정</h1>

      <Section title="계정">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-neutral-900 dark:text-white">{userName}</div>
            <div className="text-[13px] text-neutral-500 dark:text-neutral-400">{userEmail}</div>
          </div>
          <button onClick={onLogout} className="text-[13px] font-bold text-rose-500 border border-rose-200 dark:border-rose-900/50 rounded-lg px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30">로그아웃</button>
        </div>
      </Section>

      <Section title="AI 키">
        {free ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] text-neutral-600 dark:text-neutral-300 break-keep">🆓 무료로 사용 중 — 하루 50회. 더 쓰려면 내 키를 넣으면 무제한이에요.</p>
            <button onClick={onShowKey} className="shrink-0 text-[13px] font-bold text-white bg-[#F9954E] hover:bg-[#E8832E] rounded-lg px-3 py-1.5">키 넣기</button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-[13px] font-semibold text-neutral-900 dark:text-white">✓ 내 키로 무제한 사용 중</div>
                <div className="text-[12px] font-mono text-neutral-400 mt-0.5">{masked}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={onShowKey} className="text-[13px] font-bold text-[#E8832E] border border-[#F9954E]/40 rounded-lg px-3 py-1.5">변경</button>
                <button onClick={onRemoveKey} className="text-[13px] font-bold text-neutral-500 border border-neutral-200 dark:border-zinc-700 rounded-lg px-3 py-1.5">삭제</button>
              </div>
            </div>
            <label className="block text-[12px] font-bold text-neutral-400 mb-1.5">모델</label>
            <select value={model} onChange={(e) => onModel(e.target.value)}
              className="w-full text-sm font-semibold bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus:outline-none">
              {ILLO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        )}
      </Section>

      <Section title="테마">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-zinc-900 max-w-xs">
          {(["light", "dark"] as const).map((t) => {
            const on = mounted && resolvedTheme === t;
            return (
              <button key={t} onClick={() => setTheme(t)}
                className={"flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium transition-all " + (on ? "bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-400")}>
                {t === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{t === "light" ? "화이트" : "다크"}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="데스크톱 일로">
        <p className="text-[13px] text-neutral-600 dark:text-neutral-300 break-keep">
          AI 직원 채용, 이미지·영상 스튜디오, 사이트 자동 배포, 자동화 스케줄 등 풀 기능은 데스크톱(PC) 일로에서 쓸 수 있어요.
        </p>
        <Link href="/illo" className="inline-block mt-3 text-[13px] font-bold text-[#E8832E] dark:text-[#FBAA60] hover:underline">일로 소개 보기 →</Link>
      </Section>
    </ViewScroll>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="text-sm font-bold text-neutral-400 mb-2.5">{title}</h2>
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 p-4">{children}</div>
    </section>
  );
}

/* ─────────────────────────── AI 도구 실행 ─────────────────────────── */
function ToolView({ tool, runAI, free, quota, onShowKey, onBack }: {
  tool: typeof ILLO_TOOL_BY_ID[string]; runAI: (p: string) => Promise<{ text: string }>;
  free: boolean; quota: number | null; onShowKey: () => void; onBack: () => void;
}) {
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string[]>(tool.defaultAspects || []);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  function togglePick(a: string) { setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a])); }
  async function run() {
    if (!input.trim() || busy) return;
    setBusy(true); setErr(""); setResult("");
    try {
      const r = await runAI(tool.buildPrompt(input, picked));
      setResult(r.text);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "오류가 발생했습니다.";
      if (/FREE_QUOTA_EXCEEDED/.test(raw)) setErr("오늘 무료 한도(하루 50회)를 다 쓰셨어요. 🌙 내일 다시 쓰거나, 내 Claude 키를 넣으면 무제한이에요.");
      else if (/LOGIN_REQUIRED/.test(raw)) setErr("로그인이 필요합니다.");
      else setErr(raw);
    } finally { setBusy(false); }
  }
  async function copyResult() {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  }

  return (
    <ViewScroll>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] mb-5">
        <ArrowLeft className="w-4 h-4" /> 홈
      </button>
      <div className="flex items-center gap-3 mb-5">
        <span className="w-11 h-11 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 grid place-items-center text-xl">{tool.icon}</span>
        <div>
          <h1 className="text-lg font-extrabold text-neutral-900 dark:text-white leading-tight">{tool.title}</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{tool.desc}</p>
        </div>
      </div>

      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">{tool.inputLabel}</label>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={tool.placeholder} rows={5}
        className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-[#F9954E] resize-y mb-4" />

      {tool.aspects && (
        <div className="flex flex-wrap gap-2 mb-5">
          {tool.aspects.map((a) => (
            <button key={a} onClick={() => togglePick(a)}
              className={"px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors " + (picked.includes(a) ? "bg-[#F9954E] border-[#F9954E] text-white" : "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-neutral-400")}>
              {a}
            </button>
          ))}
        </div>
      )}

      {free && <p className="text-[12px] text-neutral-400 dark:text-zinc-500 mb-2 text-center">🆓 무료 · 오늘 남은 <b className={(quota ?? FREE_LIMIT) <= 5 ? "text-rose-500" : "text-[#E8832E]"}>{quota ?? FREE_LIMIT}</b> / {FREE_LIMIT}회</p>}
      <button onClick={run} disabled={busy || !input.trim()}
        className="w-full py-3.5 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
        {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> 생성 중…</> : <><Sparkles className="w-5 h-5" /> {tool.cta}</>}
      </button>

      {err && <p className="text-sm text-rose-500 mt-4 leading-relaxed break-keep">{err}{(/한도/.test(err)) && <> <button onClick={onShowKey} className="underline font-bold">키 넣기</button></>}</p>}

      {result && (
        <div className="mt-6 rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-neutral-400">결과</span>
            <button onClick={copyResult} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F9954E]">
              {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}
            </button>
          </div>
          <pre className="px-4 py-4 text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap break-words font-sans leading-relaxed">{result}</pre>
        </div>
      )}
    </ViewScroll>
  );
}

/* ─────────────────────────── 로그인 (EXE와 동일 디자인) ─────────────────────────── */
function IlloLogin({ onShowGuide }: { onShowGuide: () => void }) {
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

  const inputCls = "w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-[#F9954E]";

  return (
    <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-neutral-200 dark:border-zinc-800 shadow-xl p-8">
      <div className="flex flex-col items-center mb-6">
        <img src="/illo-logo.png" alt="일로" className="w-14 h-14 rounded-2xl shadow-md mb-3" />
        <div className="text-xl font-extrabold text-[#F9954E] leading-none">일로</div>
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-2">
          {isSignup ? "계정을 만들고 바로 시작하세요" : "혼자서도 일이 되는 곳"}
        </div>
      </div>

      <div className="flex gap-1 p-1 mb-4 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700">
        {(["login", "signup"] as const).map((m) => (
          <button key={m} onClick={() => switchMode(m)}
            className={"flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all " + (mode === m ? "bg-white dark:bg-zinc-900 text-[#E8832E] shadow-sm" : "text-neutral-500 dark:text-neutral-400")}>
            {m === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="이메일" autoFocus autoCapitalize="off" autoCorrect="off" className={inputCls + " mb-2.5"} />
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={isSignup ? "비밀번호 (6자 이상)" : "비밀번호"} className={inputCls + (isSignup ? " mb-2.5" : " mb-3")} />
      {isSignup && (
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="비밀번호 확인 (한 번 더 입력)"
          className={"w-full mb-3 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-zinc-800 border text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none " + (pw2 && pw !== pw2 ? "border-rose-400 focus:border-rose-500" : "border-neutral-200 dark:border-zinc-700 focus:border-[#F9954E]")} />
      )}

      {!isSignup && (
        <label className="flex items-center gap-2 mb-3.5 px-1 cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-[#F9954E] cursor-pointer" />
          <span className="text-[12.5px] text-neutral-600 dark:text-neutral-300">아이디 저장</span>
        </label>
      )}

      <button onClick={submit} disabled={busy} className="w-full py-3 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
        {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {isSignup ? "가입 중…" : "로그인 중…"}</> : isSignup ? "회원가입하고 시작" : "로그인"}
      </button>

      {err && <div className="text-[12px] text-rose-500 text-center mt-3 leading-relaxed">{err}</div>}

      <div className="text-[12px] text-neutral-500 dark:text-neutral-400 text-center mt-5">
        {isSignup ? (
          <>이미 계정이 있으신가요?{" "}<button onClick={() => switchMode("login")} className="text-[#E8832E] dark:text-[#FBAA60] font-semibold hover:underline">로그인</button></>
        ) : (
          <>계정이 없으신가요?{" "}<button onClick={() => switchMode("signup")} className="text-[#E8832E] dark:text-[#FBAA60] font-semibold hover:underline">회원가입</button>{" · "}<Link href="/" className="text-neutral-400 hover:underline">사이트</Link></>
        )}
      </div>
      <button onClick={onShowGuide} className="block mx-auto mt-4 text-[12.5px] font-bold text-[#E8832E] dark:text-[#FBAA60]">🔰 일로가 처음이신가요? 시작 가이드</button>
      <p className="text-[11px] text-neutral-400 dark:text-zinc-600 text-center mt-3 leading-relaxed">로그인하면 AI 도구를 하루 50회 무료로 쓸 수 있어요.</p>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="w-full min-h-screen grid place-items-center bg-neutral-50 dark:bg-black px-5 font-sans">{children}</main>;
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-[#F9954E] text-white text-[13px] font-extrabold grid place-items-center shrink-0">{n}</div>
      <div className="min-w-0">
        <div className="font-bold text-neutral-900 dark:text-white mb-1">{title}</div>
        <div className="text-[13.5px] text-neutral-600 dark:text-neutral-400 leading-relaxed break-keep space-y-1">{children}</div>
      </div>
    </div>
  );
}

function GuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-zinc-800 shrink-0">
          <span className="font-extrabold text-neutral-900 dark:text-white">🔰 일로 시작 가이드</span>
          <button onClick={onClose} aria-label="닫기" className="w-8 h-8 grid place-items-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-lg">✕</button>
        </div>

        <div className="overflow-y-auto px-5 py-6 space-y-7">
          <div className="rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/20 p-4">
            <p className="text-[13.5px] text-neutral-700 dark:text-neutral-300 leading-relaxed break-keep">
              <b className="text-[#E8832E] dark:text-[#FBAA60]">일로</b>는 AI에게 글쓰기·SNS·카피·상품설명·답변·요약을 맡기는 도구예요. <b>로그인만 하면 하루 50회까지 무료</b>로 바로 쓸 수 있어요! 더 많이 쓰고 싶을 때만 내 키를 넣으면 됩니다.
            </p>
          </div>

          <Step n="1" title="그냥 무료로 시작하기">
            <p>로그인하고 도구를 고른 뒤 내용만 입력하면 끝! <b>하루 50회까지 무료</b>예요. 키도 결제도 필요 없어요.</p>
          </Step>
          <Step n="2" title="더 많이 쓰고 싶다면 — 내 키(선택)">
            <p>하루 50회로 부족하면 <b>내 Claude 키</b>를 넣어 무제한으로 쓸 수 있어요. 아래는 키 만드는 법이에요.</p>
          </Step>
          <Step n="3" title="Claude 콘솔 가입 + 소액 충전">
            <p><b>console.anthropic.com</b> 가입 → <b>Billing</b>에서 카드 등록 + <b>$5 충전</b>(크레딧 있어야 작동).</p>
          </Step>
          <Step n="4" title="키 만들기 → 복사 → 붙여넣기">
            <p><b>API Keys → Create Key</b> → 생긴 <b>sk-ant-…</b> 복사 → 일로의 "키 넣기"에 붙여넣기.</p>
            <p className="text-rose-500">⚠️ 키는 만들 때 딱 한 번만 보여요. 꼭 바로 복사!</p>
          </Step>

          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-[#F9954E]/40 text-[#E8832E] dark:text-[#FBAA60] font-bold text-sm">
            🔗 Claude 콘솔 열기 (키 만들러 가기)
          </a>
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 dark:border-zinc-800 shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-sm">무료로 바로 시작 →</button>
        </div>
      </div>
    </div>
  );
}
