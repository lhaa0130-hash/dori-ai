"use client";

// 워크플로우 실행 화면 (BYOK).
// 목적 두 가지:
//  1) 사용자: 주제만 넣으면 여러 AI가 협업해 결과물이 나온다
//  2) 우리: 노드마다 토큰·시간·원가가 남는다 → 가격을 '실측'으로 정할 수 있다

import { useRef, useState } from "react";
import {
  Play, Square, Loader2, Check, AlertTriangle, ChevronDown, ChevronRight, Copy, Clock, Coins,
} from "lucide-react";
import { runWorkflow } from "@/lib/illo/workflow/engine";
import { BLOG_WORKFLOW } from "@/lib/illo/workflow/blog";
import { MODEL_PRICES, fmtKrw, modelLabel } from "@/lib/illo/workflow/cost";
import type { ModelCaller, RunState, WorkflowDef } from "@/lib/illo/workflow/types";

const STATUS_STYLE: Record<string, string> = {
  wait: "text-muted-foreground",
  run: "text-primary",
  done: "text-emerald-600 dark:text-emerald-400",
  error: "text-rose-600 dark:text-rose-400",
  skip: "text-muted-foreground",
};

export default function WorkflowRunner({
  call, def = BLOG_WORKFLOW, hasOwnKey,
}: {
  /** 모델 호출 통로 — BYOK(본인 키)면 usage가 실려 원가가 측정된다 */
  call: ModelCaller;
  def?: WorkflowDef;
  /** 본인 키로 도는 중인지 (아니면 원가 측정 불가) */
  hasOwnKey?: boolean;
}) {
  const [input, setInput] = useState("");
  const [model, setModel] = useState(def.defaultModel);
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
    // 이번 실행에 쓸 모델을 기본값으로 덮어쓴다(노드가 개별 지정한 건 그대로)
    const runDef: WorkflowDef = { ...def, defaultModel: model };
    try {
      await runWorkflow({
        def: runDef, input: topic, call, signal: ac.signal,
        onUpdate: (s) => setState(s),
      });
    } catch (e) {
      setErr((e as Error)?.message || "실행에 실패했어요.");
    } finally {
      abortRef.current = null;
    }
  }
  function stop() { abortRef.current?.abort(); }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); } catch { /* 무시 */ }
  }

  const measured = !!state && state.totalInputTokens + state.totalOutputTokens > 0;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground">
      {/* 상단 — 주제 + 모델 + 실행 */}
      <div className="shrink-0 border-b border-border bg-card/40 px-4 py-3">
        <div className="flex items-baseline gap-2 mb-2">
          <h1 className="text-[15px] font-bold">{def.label}</h1>
          <span className="text-[12px] text-muted-foreground">{def.description}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-muted-foreground shrink-0">{def.inputLabel}</span>
          <input value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !running) void start(); }}
            placeholder={def.inputPlaceholder} disabled={running}
            className="flex-1 min-w-[240px] text-[13px] rounded-md border border-border bg-background px-2.5 py-1.5 outline-none focus:border-primary disabled:opacity-60 placeholder:text-muted-foreground/50" />
          <select value={model} onChange={(e) => setModel(e.target.value)} disabled={running}
            title="이 워크플로우 전체가 쓸 기본 모델 — 바꿔가며 원가·품질을 비교해 보세요"
            className="text-[12px] rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary cursor-pointer disabled:opacity-60">
            {MODEL_PRICES.map((m) => (
              <option key={m.id} value={m.id}>{m.label} (${m.inUsd}/${m.outUsd})</option>
            ))}
          </select>
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
            본인 API 키로 실행해야 토큰·원가가 측정됩니다. (공용 경로는 사용량을 돌려주지 않아요)
          </div>
        )}
      </div>

      {/* 노드 진행 + 실측 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <ol className="space-y-2">
          {def.nodes.map((n, i) => {
            const r = state?.runs[i];
            const st = r?.status || "wait";
            const isOpen = !!open[n.id];
            return (
              <li key={n.id} className="rounded-xl border border-border bg-card">
                <button onClick={() => setOpen((p) => ({ ...p, [n.id]: !p[n.id] }))}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                  <span className="text-[13px] shrink-0">{n.emoji}</span>
                  <span className="text-[13px] font-semibold shrink-0">{i + 1}. {n.label}</span>
                  <span className={`text-[11.5px] shrink-0 inline-flex items-center gap-1 ${STATUS_STYLE[st]}`}>
                    {st === "run" && <><Loader2 className="w-3 h-3 animate-spin" /> 작업 중</>}
                    {st === "done" && <><Check className="w-3 h-3" /> 완료</>}
                    {st === "error" && <><AlertTriangle className="w-3 h-3" /> 실패</>}
                    {st === "wait" && "대기"}
                  </span>
                  <span className="ml-auto flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0">
                    {r?.model && <span className="hidden sm:inline">{modelLabel(r.model)}</span>}
                    {r?.ms != null && <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" />{(r.ms / 1000).toFixed(1)}초</span>}
                    {r?.costKrw != null && r.costKrw > 0 && (
                      <span className="inline-flex items-center gap-0.5 tabular-nums"><Coins className="w-3 h-3" />{fmtKrw(r.costKrw)}</span>
                    )}
                    {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-border px-3 py-2.5">
                    {r?.error && <p className="text-[12.5px] text-rose-600 dark:text-rose-400 mb-2">{r.error}</p>}
                    {(r?.inputTokens != null || r?.outputTokens != null) && (
                      <p className="text-[11px] text-muted-foreground mb-2 tabular-nums">
                        입력 {(r.inputTokens || 0).toLocaleString()} · 출력 {(r.outputTokens || 0).toLocaleString()} 토큰
                        {!!r.cacheReadTokens && ` · 캐시읽기 ${r.cacheReadTokens.toLocaleString()}`}
                      </p>
                    )}
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
                        {st === "wait" ? "아직 실행 전이에요." : st === "run" ? "작업 중…" : "결과가 없어요."}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* 실측 요약 — 가격 정책의 근거가 되는 숫자 */}
        {state && state.status !== "idle" && (
          <div className="mt-3 rounded-xl border border-border bg-card px-3.5 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] font-bold">이번 실행 실측</span>
              {state.status === "running" && <span className="text-[11px] text-primary">진행 중…</span>}
              {state.status === "canceled" && <span className="text-[11px] text-muted-foreground">중지됨</span>}
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
                이 숫자가 가격의 근거입니다 — 한 달에 이 글을 N번 쓰면 원가는 {fmtKrw(state.totalCostKrw)} × N.
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
