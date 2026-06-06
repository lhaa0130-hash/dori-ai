"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ILLO_TOOLS, ILLO_TOOL_BY_ID } from "@/lib/illo/tools";
import { callClaude, ILLO_MODELS, ILLO_DEFAULT_MODEL } from "@/lib/illo/claude";
import { getLocalKey, setLocalKey, getModel, setModel, pullCloudKey } from "@/lib/illo/key";
import { ArrowLeft, KeyRound, Loader2, Copy, Check, Sparkles, Download } from "lucide-react";

export default function IlloWebClient() {
  const { status } = useAuth();

  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [model, setModelState] = useState(ILLO_DEFAULT_MODEL);
  const [keyLoading, setKeyLoading] = useState(true);
  const [pulling, setPulling] = useState(false);

  const [toolId, setToolId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  // 키 로드: 로컬 → 없으면 클라우드(데스크톱 동기화) 시도
  useEffect(() => {
    if (status !== "authenticated") return;
    setModelState(getModel() || ILLO_DEFAULT_MODEL);
    const lk = getLocalKey();
    if (lk) { setKey(lk); setKeyLoading(false); return; }
    setPulling(true);
    pullCloudKey()
      .then((k) => { if (k) { setKey(k); setLocalKey(k); } })
      .finally(() => { setPulling(false); setKeyLoading(false); });
  }, [status]);

  const tool = toolId ? ILLO_TOOL_BY_ID[toolId] : null;

  function openTool(id: string) {
    setToolId(id);
    setInput("");
    setResult("");
    setErr("");
    setPicked(ILLO_TOOL_BY_ID[id]?.defaultAspects || []);
  }
  function togglePick(a: string) {
    setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));
  }
  function saveKey() {
    const k = keyInput.trim();
    if (!k) return;
    setLocalKey(k);
    setKey(k);
    setKeyInput("");
  }
  async function tryPull() {
    setPulling(true);
    const k = await pullCloudKey();
    setPulling(false);
    if (k) { setLocalKey(k); setKey(k); }
    else setErr("동기화된 키를 찾지 못했어요. 데스크톱 일로에서 키를 저장했는지 확인하거나, 아래에 직접 입력해 주세요.");
  }
  async function run() {
    if (!tool || !input.trim() || busy) return;
    setBusy(true); setErr(""); setResult("");
    try {
      const text = await callClaude({ apiKey: key, prompt: tool.buildPrompt(input, picked), model });
      setResult(text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function copyResult() {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  }

  // ── 로그인 게이트 ──
  if (status === "loading") {
    return <Centered><Loader2 className="w-6 h-6 animate-spin text-[#F9954E]" /></Centered>;
  }
  if (status === "unauthenticated") {
    return (
      <Centered>
        <div className="text-center max-w-sm">
          <img src="/illo-logo.png" alt="일로" className="w-16 h-16 rounded-2xl mx-auto mb-5 shadow-lg" />
          <h1 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2">일로 웹</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 break-keep">로그인하면 내 API 키로 AI 도구를 바로 쓸 수 있어요.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold transition-colors">로그인 / 회원가입</Link>
        </div>
      </Centered>
    );
  }

  // ── 키 설정 ──
  if (!keyLoading && !key) {
    return (
      <Shell>
        <div className="max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 grid place-items-center mx-auto mb-5">
            <KeyRound className="w-7 h-7 text-[#F9954E]" />
          </div>
          <h1 className="text-xl font-extrabold text-center text-neutral-900 dark:text-white mb-2">내 Claude API 키를 넣어주세요</h1>
          <p className="text-sm text-center text-neutral-500 dark:text-neutral-400 mb-6 break-keep">
            AI 기능은 회원님의 API 키로 동작해요. 키는 회원님 브라우저에만 저장됩니다.
          </p>
          <button
            onClick={tryPull}
            disabled={pulling}
            className="w-full mb-3 py-3 rounded-2xl border border-[#F9954E]/40 text-[#E8832E] dark:text-[#FBAA60] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            데스크톱에서 저장한 키 불러오기
          </button>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveKey()}
            placeholder="sk-ant-..."
            className="w-full mb-2 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-sm font-mono focus:outline-none focus:border-[#F9954E]"
          />
          <button onClick={saveKey} className="w-full py-3 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold text-sm transition-colors">저장하고 시작</button>
          {err && <p className="text-xs text-rose-500 mt-3 text-center leading-relaxed">{err}</p>}
          <p className="text-[11px] text-neutral-400 dark:text-zinc-600 mt-4 text-center">
            키 발급: console.anthropic.com/settings/keys
          </p>
        </div>
      </Shell>
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
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tool.placeholder}
          rows={5}
          className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-[#F9954E] resize-y mb-4"
        />

        {tool.aspects && (
          <div className="flex flex-wrap gap-2 mb-5">
            {tool.aspects.map((a) => (
              <button
                key={a}
                onClick={() => togglePick(a)}
                className={
                  "px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-colors " +
                  (picked.includes(a)
                    ? "bg-[#F9954E] border-[#F9954E] text-white"
                    : "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-neutral-400")
                }
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={run}
          disabled={busy || !input.trim()}
          className="w-full py-3.5 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> 생성 중…</> : <><Sparkles className="w-5 h-5" /> {tool.cta}</>}
        </button>

        {err && <p className="text-sm text-rose-500 mt-4 leading-relaxed break-keep">{err}</p>}

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
      </Shell>
    );
  }

  // ── 도구 그리드 (홈) ──
  return (
    <Shell>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">일로 <span className="text-[#F9954E]">웹</span></h1>
        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={(e) => { setModelState(e.target.value); setModel(e.target.value); }}
            className="text-xs font-semibold bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            {ILLO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <button onClick={() => { setLocalKey(""); setKey(""); }} title="키 변경" className="text-xs font-semibold text-neutral-400 hover:text-[#F9954E] border border-neutral-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5" /> 키
          </button>
        </div>
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-7">필요한 도구를 골라 바로 쓰세요. 결과는 내 키로 생성돼요.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ILLO_TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => openTool(t.id)}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-left hover:border-[#F9954E] dark:hover:border-[#F9954E] hover:-translate-y-0.5 transition-all"
          >
            <span className="w-11 h-11 rounded-2xl bg-[#FFF5EB] dark:bg-orange-950/30 grid place-items-center text-xl shrink-0">{t.icon}</span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-neutral-900 dark:text-white">{t.title}</span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400 truncate">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-neutral-400 dark:text-zinc-600 mt-8 text-center break-keep">
        파일·자동화·컴퓨터 제어 등 고급 기능은 <Link href="/illo" className="text-[#F9954E] font-semibold">데스크톱 일로</Link>에서 쓸 수 있어요.
      </p>
    </Shell>
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
