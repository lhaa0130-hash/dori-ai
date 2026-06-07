"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase";
import { ILLO_TOOLS, ILLO_TOOL_BY_ID } from "@/lib/illo/tools";
import { callClaude, ILLO_MODELS, ILLO_DEFAULT_MODEL } from "@/lib/illo/claude";
import { getLocalKey, setLocalKey, getModel, setModel, pullCloudKey } from "@/lib/illo/key";
import { ArrowLeft, KeyRound, Loader2, Copy, Check, Sparkles, Download } from "lucide-react";

const FREE_LIMIT = 50; // 무료(공용 키) 하루 호출 수

export default function IlloWebClient() {
  const { status } = useAuth();

  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [model, setModelState] = useState(ILLO_DEFAULT_MODEL);
  const [pulling, setPulling] = useState(false);

  const [toolId, setToolId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [quota, setQuota] = useState<number | null>(null); // 무료 모드 오늘 남은 횟수

  // 키 로드: 로컬 → 없으면 클라우드(데스크톱 동기화) 시도. 없어도 무료로 사용 가능.
  useEffect(() => {
    if (status !== "authenticated") return;
    setModelState(getModel() || ILLO_DEFAULT_MODEL);
    const lk = getLocalKey();
    if (lk) { setKey(lk); return; }
    pullCloudKey().then((k) => { if (k) { setKey(k); setLocalKey(k); } }).catch(() => {});
  }, [status]);

  const tool = toolId ? ILLO_TOOL_BY_ID[toolId] : null;
  const free = !key; // 본인 키 없으면 무료(공용 키) 모드

  function openTool(id: string) {
    setToolId(id); setInput(""); setResult(""); setErr("");
    setPicked(ILLO_TOOL_BY_ID[id]?.defaultAspects || []);
  }
  function togglePick(a: string) {
    setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));
  }
  function saveKey() {
    const k = keyInput.trim();
    if (!k) return;
    setLocalKey(k); setKey(k); setKeyInput(""); setShowKey(false);
  }
  async function tryPull() {
    setPulling(true);
    const k = await pullCloudKey();
    setPulling(false);
    if (k) { setLocalKey(k); setKey(k); setShowKey(false); }
    else setErr("동기화된 키를 찾지 못했어요. 데스크톱 일로에서 키를 저장했는지 확인하거나, 아래에 직접 입력해 주세요.");
  }
  async function run() {
    if (!tool || !input.trim() || busy) return;
    setBusy(true); setErr(""); setResult("");
    try {
      let idToken: string | undefined;
      if (free) {
        const u = getFirebaseAuth().currentUser;
        idToken = u ? await u.getIdToken() : undefined;
      }
      const r = await callClaude({ apiKey: key || undefined, idToken, prompt: tool.buildPrompt(input, picked), model });
      setResult(r.text);
      if (typeof r.quotaRemaining === "number") setQuota(r.quotaRemaining);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "오류가 발생했습니다.";
      if (/FREE_QUOTA_EXCEEDED/.test(raw)) {
        setQuota(0);
        setErr("오늘 무료 한도(하루 50회)를 다 쓰셨어요. 🌙 내일 다시 쓰거나, 내 Claude 키를 넣으면 무제한으로 쓸 수 있어요.");
      } else if (/LOGIN_REQUIRED/.test(raw)) setErr("로그인이 필요합니다.");
      else setErr(raw);
    } finally { setBusy(false); }
  }
  async function copyResult() {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  }

  // 오버레이(가이드 / 키 넣기) — 어느 화면 위에도 뜨도록 공통으로 렌더
  const overlays = (
    <>
      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}
      {showKey && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowKey(false)}>
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
            {err && <p className="text-xs text-rose-500 mt-3 text-center leading-relaxed">{err}</p>}
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

  // ── 도구 실행 화면 ──
  if (tool) {
    return (
      <Shell>
        <button onClick={() => setToolId(null)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] mb-5">
          <ArrowLeft className="w-4 h-4" /> 도구 목록
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

        {err && <p className="text-sm text-rose-500 mt-4 leading-relaxed break-keep">{err}{/FREE/.test(err) || err.includes("한도") ? <> <button onClick={() => setShowKey(true)} className="underline font-bold">키 넣기</button></> : null}</p>}

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
        {overlays}
      </Shell>
    );
  }

  // ── 도구 그리드 (홈) ──
  return (
    <Shell>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">일로 <span className="text-[#F9954E]">웹</span></h1>
        <div className="flex items-center gap-2">
          {!free && (
            <select value={model} onChange={(e) => { setModelState(e.target.value); setModel(e.target.value); }}
              className="text-xs font-semibold bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 focus:outline-none">
              {ILLO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          )}
          <button onClick={() => setShowKey(true)} title="내 키 넣기" className="text-xs font-semibold text-neutral-400 hover:text-[#F9954E] border border-neutral-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5" /> {free ? "키 넣기" : "키 변경"}
          </button>
        </div>
      </div>
      {free ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-7">
          🆓 무료로 쓰는 중 · 오늘 남은 <b className={(quota ?? FREE_LIMIT) <= 5 ? "text-rose-500" : "text-[#E8832E]"}>{quota ?? FREE_LIMIT}</b>/{FREE_LIMIT}회 — 더 쓰려면 <button onClick={() => setShowKey(true)} className="underline font-semibold text-[#E8832E] dark:text-[#FBAA60]">내 키 넣기</button>(무제한)
        </p>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-7">✓ 내 키로 무제한 사용 중. 필요한 도구를 골라 바로 쓰세요.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ILLO_TOOLS.map((t) => (
          <button key={t.id} onClick={() => openTool(t.id)}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-left hover:border-[#F9954E] dark:hover:border-[#F9954E] hover:-translate-y-0.5 transition-all">
            <span className="w-11 h-11 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 grid place-items-center text-xl shrink-0">{t.icon}</span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-neutral-900 dark:text-white">{t.title}</span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400 truncate">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-neutral-400 dark:text-zinc-600 mt-8 text-center break-keep">
        파일·자동화·컴퓨터 제어 등 고급 기능은 데스크톱 일로(PC)에서 쓸 수 있어요.
      </p>
      {overlays}
    </Shell>
  );
}

// 일로 전용 로그인 카드 (데스크톱 EXE와 동일 디자인) — 사이트 AuthContext 사용
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
    // 성공하면 AuthContext가 status=authenticated 로 바꿔 자동으로 도구 화면 전환 (busy 유지)
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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full min-h-screen bg-neutral-50 dark:bg-black font-sans">
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">{children}</div>
    </main>
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

// 초보자용 완전 가이드 — 무료로 시작 + (원하면) 내 키 발급까지
function GuideOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
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
