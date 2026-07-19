"use client";

// Workflow 실행 화면.
// 기획서 원칙: 사용자는 모델을 고르지 않는다. '블로그 작성'만 누르면
// 내부의 Agent들이 각자 자기 모델로 협업하고, 심사에서 떨어지면 되돌아가 다시 일한다.
// 다만 우리(운영자)는 원가를 알아야 하므로 Agent별 토큰·시간·원가를 그대로 노출한다.

import { useRef, useState } from "react";
import {
  Play, Square, Loader2, Check, AlertTriangle, ChevronDown, ChevronRight, Copy,
  Clock, Coins, RotateCcw, MinusCircle,
} from "lucide-react";
import { runWorkflow } from "@/lib/illo/workflow/engine";
import { BLOG_WORKFLOW } from "@/lib/illo/workflow/blog";
import { fmtKrw } from "@/lib/illo/workflow/cost";
import { PROVIDER_LABEL, resolveModel } from "@/lib/illo/workflow/providers";
import type { ModelCaller, RunState, WorkflowDef } from "@/lib/illo/workflow/types";

const STATUS_STYLE: Record<string, string> = {
  wait: "text-muted-foreground",
  run: "text-primary",
  done: "text-emerald-600 dark:text-emerald-400",
  error: "text-rose-600 dark:text-rose-400",
  skip: "text-amber-600 dark:text-amber-400",
};

export default function WorkflowRunner({
  call, def = BLOG_WORKFLOW, hasOwnKey,
}: {
  call: ModelCaller;
  def?: WorkflowDef;
  hasOwnKey?: boolean;
}) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<RunState | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const running = state?.status === "running";

  async function start() {
    if (running) return;
    const topic = input.trim();
    if (!topic) { setErr("먼저 주제를 적어주세요."); return; }
    setErr("");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await runWorkflow({ def, input: topic, call, signal: ac.signal, onUpdate: (s) => setState(s) });
    } catch (e) {
      setErr((e as Error)?.message || "실행에 실패했어요.");
    } finally { abortRef.current = null; }
  }
  function stop() { abortRef.current?.abort(); }
  async function copy(text: string) { try { await navigator.clipboard.writeText(text); } catch { /* 무시 */ } }

  const measured = !!state && state.totalInputTokens + state.totalOutputTokens > 0;
  const liveCount = def.agents.filter((a) => a.capability === "llm").length;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground">
      {/* 상단 */}
      <div className="shrink-0 border-b border-border bg-card/40 px-4 py-3">
        <div className="flex items-baseline gap-2 mb-1">
          <h1 className="text-[15px] font-bold">{def.label}</h1>
          <span className="text-[12px] text-muted-foreground">{def.description}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          내부에서 <b className="text-foreground">{def.agents.length}명의 AI 담당자</b>가 협업합니다
          (지금 실행 가능: {liveCount}명) · 심사 80점 미만이면 작성부터 다시 일합니다
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-muted-foreground shrink-0">{def.inputLabel}</span>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !running) void start(); }}
            placeholder={def.inputPlaceholder} disabled={running}
            className="flex-1 min-w-[240px] text-[13px] rounded-md border border-border bg-background px-2.5 py-1.5 outline-none focus:border-primary disabled:opacity-60 placeholder:text-muted-foreground/50" />
          {running ? (
            <button onClick={stop}
              className="h-8 px-3 rounded-md border border-border text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:border-rose-400 hover:text-rose-500 transition">
              <Square className="w-3.5 h-3.5" /> 중지
            </button>
          ) : (
            <button onClick={() => void start()}
              className="h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition">
              <Play className="w-3.5 h-3.5" /> 실행
            </button>
          )}
        </div>
        {err && (
          <div className="mt-2 flex items-start gap-1.5 text-[12px] text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {err}
          </div>
        )}
        {!hasOwnKey && (
          <div className="mt-2 text-[11.5px] text-amber-600 dark:text-amber-400">
            본인 API 키로 실행해야 토큰·원가가 측정됩니다.
          </div>
        )}
      </div>

      {/* Agent 진행 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <ol className="space-y-2">
          {def.agents.map((a, i) => {
            const r = state?.runs[i];
            const st = r?.status || "wait";
            const isOpen = !!open[a.id];
            const planned = resolveModel(a.models);          // 이번에 쓰일 예정 모델
            const declared = a.models[0];                     // 기획서가 원한 1순위
            const downgraded = planned && declared && planned.provider !== declared.provider;
            return (
              <li key={a.id} className={`rounded-xl border bg-card ${st === "skip" ? "border-dashed border-border" : "border-border"}`}>
                <button onClick={() => setOpen((p) => ({ ...p, [a.id]: !p[a.id] }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                  <span className="text-[13px] shrink-0">{a.emoji}</span>
                  <span className="text-[13px] font-semibold shrink-0">{i + 1}. {a.label}</span>
                  <span className={`text-[11.5px] shrink-0 inline-flex items-center gap-1 ${STATUS_STYLE[st]}`}>
                    {st === "run" && <><Loader2 className="w-3 h-3 animate-spin" /> 작업 중</>}
                    {st === "done" && <><Check className="w-3 h-3" /> 완료</>}
                    {st === "error" && <><AlertTriangle className="w-3 h-3" /> 실패</>}
                    {st === "skip" && <><MinusCircle className="w-3 h-3" /> 건너뜀</>}
                    {st === "wait" && "대기"}
                  </span>
                  {r?.score != null && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${r.score >= 80 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"}`}>
                      {r.score}점
                    </span>
                  )}
                  {!!r?.attempts && r.attempts > 1 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5 shrink-0">
                      <RotateCcw className="w-3 h-3" />{r.attempts}회
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0">
                    <span className="hidden sm:inline">
                      {r?.provider ? `${PROVIDER_LABEL[r.provider]} · ${r.model}` : planned ? `${PROVIDER_LABEL[planned.provider]} 예정` : "미연동"}
                    </span>
                    {r?.ms != null && <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" />{(r.ms / 1000).toFixed(1)}초</span>}
                    {!!r?.costKrw && <span className="inline-flex items-center gap-0.5 tabular-nums"><Coins className="w-3 h-3" />{fmtKrw(r.costKrw)}</span>}
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-border px-3 py-2.5">
                    <p className="text-[11px] text-muted-foreground mb-1.5">{a.role}</p>
                    {/* 기획서가 원한 모델 vs 실제로 쓰는 모델 — 미연동이면 정직하게 보여준다 */}
                    <p className="text-[11px] text-muted-foreground mb-2">
                      우선순위: {a.models.map((m, k) => (
                        <span key={k} className={m === planned ? "text-primary font-medium" : "opacity-60"}>
                          {k > 0 && " → "}{PROVIDER_LABEL[m.provider]}{m.why ? `(${m.why})` : ""}
                        </span>
                      ))}
                      {downgraded && <span className="text-amber-600 dark:text-amber-400"> · 1순위 미연동이라 대체 사용</span>}
                    </p>
                    {r?.skipReason && <p className="text-[12px] text-amber-600 dark:text-amber-400 mb-2">{r.skipReason}</p>}
                    {r?.error && <p className="text-[12.5px] text-rose-600 dark:text-rose-400 mb-2">{r.error}</p>}
                    {(r?.inputTokens || r?.outputTokens) ? (
                      <p className="text-[11px] text-muted-foreground mb-2 tabular-nums">
                        입력 {(r.inputTokens || 0).toLocaleString()} · 출력 {(r.outputTokens || 0).toLocaleString()} 토큰
                        {!!r.attempts && r.attempts > 1 && ` (${r.attempts}회 누적)`}
                      </p>
                    ) : null}
                    {r?.output ? (
                      <>
                        <button onClick={() => void copy(r.output as string)}
                          className="mb-1.5 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                          <Copy className="w-3 h-3" /> 복사
                        </button>
                        <pre className="whitespace-pre-wrap break-words font-sans text-[12.5px] leading-relaxed max-h-[320px] overflow-y-auto">{r.output}</pre>
                      </>
                    ) : (
                      <p className="text-[12px] text-muted-foreground">
                        {st === "wait" ? "아직 실행 전이에요." : st === "run" ? "작업 중…" : st === "skip" ? "이 담당자는 연동 후 동작합니다." : "결과가 없어요."}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* 실측 */}
        {state && state.status !== "idle" && (
          <div className="mt-3 rounded-xl border border-border bg-card px-3.5 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] font-bold">이번 실행 실측</span>
              {state.status === "running" && <span className="text-[11px] text-primary">진행 중…</span>}
              {state.status === "canceled" && <span className="text-[11px] text-muted-foreground">중지됨</span>}
              {state.rewrites > 0 && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5">
                  <RotateCcw className="w-3 h-3" /> 심사 탈락 {state.rewrites}회 → 재작업
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
              <span>걸린 시간 <b className="tabular-nums">{(state.totalMs / 1000).toFixed(1)}초</b></span>
              <span>토큰 <b className="tabular-nums">{(state.totalInputTokens + state.totalOutputTokens).toLocaleString()}</b>
                <span className="text-muted-foreground"> (입력 {state.totalInputTokens.toLocaleString()} / 출력 {state.totalOutputTokens.toLocaleString()})</span>
              </span>
              <span>원가 <b className="tabular-nums text-primary">{measured ? fmtKrw(state.totalCostKrw) : "측정 안 됨"}</b></span>
            </div>
            {measured && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                이 숫자가 가격의 근거입니다. {state.rewrites > 0 && "재작업이 원가를 밀어올린 것도 포함돼 있습니다."}
              </p>
            )}
          </div>
        )}

        {/* 최종 결과물 */}
        {state?.status === "done" && state.finalOutput && (
          <div className="mt-3 rounded-xl border border-primary/40 bg-card">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border">
              <span className="text-[13px] font-bold">✅ 최종 결과물</span>
              <button onClick={() => void copy(state.finalOutput as string)}
                className="ml-auto text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <Copy className="w-3 h-3" /> 복사
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed px-3.5 py-3">{state.finalOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
