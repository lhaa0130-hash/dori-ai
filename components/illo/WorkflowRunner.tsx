"use client";

// Workflow 실행 화면.
// 일반 사용자에게는 진행 단계만 보여주고, 관리자/BYOK 사용자에게는
// Provider·Model·Token·Cost·Latency·Retry·Fallback을 전부 보여준다.

import { useMemo, useRef, useState } from "react";
import {
  Play, Square, Loader2, Check, AlertTriangle, ChevronDown, ChevronRight, Copy,
  Clock, Coins, RotateCcw, MinusCircle, SlidersHorizontal, ShieldAlert,
} from "lucide-react";
import { runWorkflow } from "@/lib/illo/workflow/engine";
import { SEO_BLOG_WORKFLOW } from "@/lib/illo/workflow/seoBlog";
import { fmtKrw } from "@/lib/illo/workflow/cost";
import { SELECTABLE_PRESETS, providerLabel } from "@/lib/illo/workflow/models";
import { buildRegistry, mockAdapter, type ClaudeCaller } from "@/lib/illo/workflow/llm";
import { mockSearchProvider } from "@/lib/illo/workflow/search";
import type { ExecutionState, WorkflowDef } from "@/lib/illo/workflow/types";

const ST: Record<string, string> = {
  pending: "text-muted-foreground",
  running: "text-primary",
  completed: "text-emerald-600 dark:text-emerald-400",
  failed: "text-rose-600 dark:text-rose-400",
  skipped: "text-amber-600 dark:text-amber-400",
};

export default function WorkflowRunner({
  call, def = SEO_BLOG_WORKFLOW, hasOwnKey,
}: {
  call?: ClaudeCaller;
  def?: WorkflowDef;
  hasOwnKey?: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>({ articleType: "information" });
  const [presetId, setPresetId] = useState("standard");
  const [mock, setMock] = useState(!hasOwnKey);       // 키 없으면 모의 실행이 기본
  const [advanced, setAdvanced] = useState(!!hasOwnKey); // BYOK면 상세 표시
  const [showOpts, setShowOpts] = useState(false);
  const [state, setState] = useState<ExecutionState | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const running = state?.status === "running";

  const search = useMemo(() => mockSearchProvider(), []);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function start() {
    if (running) return;
    const required = def.fields.filter((f) => f.required);
    const missing = required.find((f) => !form[f.key]?.trim());
    if (missing) { setErr(`${missing.label}을(를) 입력해 주세요.`); return; }
    if (!mock && !call) { setErr("실제 실행하려면 API 키가 필요합니다. 모의 실행으로 흐름만 볼 수 있어요."); return; }
    setErr("");
    const ac = new AbortController();
    abortRef.current = ac;
    const adapters = buildRegistry({
      claude: mock ? undefined : call,
      mock: mock ? mockAdapter() : undefined,
    });
    try {
      await runWorkflow({
        def, input: form, presetId: mock ? "mock" : presetId,
        adapters, search, signal: ac.signal,
        settings: form.targetLength ? { targetLength: Number(form.targetLength) || undefined as never } : undefined,
        onUpdate: (s) => setState(s),
      });
    } catch (e) {
      setErr((e as Error)?.message || "실행에 실패했어요.");
    } finally { abortRef.current = null; }
  }
  function stop() { abortRef.current?.abort(); }
  async function copy(t: string) { try { await navigator.clipboard.writeText(t); } catch { /* 무시 */ } }

  const fin = state?.final;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background text-foreground">
      {/* 헤더 + 입력 */}
      <div className="shrink-0 border-b border-border bg-card/40 px-4 py-3">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <h1 className="text-[15px] font-bold">{def.label}</h1>
          <span className="text-[12px] text-muted-foreground">{def.description}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          {def.nodes.length}단계 · 품질 {def.defaultSettings.passScore}점 미만이면 지적된 부분만 최대 {def.defaultSettings.maxRewriteCount}회 보완합니다
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {def.fields.filter((f) => f.required).map((f) => (
            <input key={f.key} value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !running) void start(); }}
              placeholder={f.placeholder} disabled={running}
              className="flex-1 min-w-[220px] text-[13px] rounded-md border border-border bg-background px-2.5 py-1.5 outline-none focus:border-primary disabled:opacity-60 placeholder:text-muted-foreground/50" />
          ))}
          <button onClick={() => setShowOpts((v) => !v)} disabled={running}
            className="h-8 px-2.5 rounded-md border border-border text-[12px] text-muted-foreground hover:border-primary hover:text-primary inline-flex items-center gap-1 transition disabled:opacity-60">
            <SlidersHorizontal className="w-3.5 h-3.5" /> 선택 항목
          </button>
          {running ? (
            <button onClick={stop} className="h-8 px-3 rounded-md border border-border text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:border-rose-400 hover:text-rose-500 transition">
              <Square className="w-3.5 h-3.5" /> 중지
            </button>
          ) : (
            <button onClick={() => void start()} className="h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[12.5px] font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition">
              <Play className="w-3.5 h-3.5" /> 실행
            </button>
          )}
        </div>

        {showOpts && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {def.fields.filter((f) => !f.required).map((f) => (
              <label key={f.key} className="text-[11px] text-muted-foreground">
                {f.label}
                {f.type === "select" ? (
                  <select value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} disabled={running}
                    className="mt-0.5 w-full text-[12.5px] rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary">
                    {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea value={form[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} disabled={running}
                    placeholder={f.placeholder} rows={2}
                    className="mt-0.5 w-full text-[12.5px] rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary resize-y" />
                ) : (
                  <input type={f.type === "number" ? "number" : "text"} value={form[f.key] || ""}
                    onChange={(e) => set(f.key, e.target.value)} disabled={running} placeholder={f.placeholder}
                    className="mt-0.5 w-full text-[12.5px] rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:border-primary" />
                )}
              </label>
            ))}
          </div>
        )}

        {/* 실행 옵션 — 관리자/BYOK용 */}
        <div className="mt-2 flex items-center gap-3 flex-wrap text-[11.5px]">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} disabled={running} />
            모의 실행(키 없이 흐름만)
          </label>
          {!mock && (
            <label className="inline-flex items-center gap-1.5">
              <span className="text-muted-foreground">품질 프리셋</span>
              <select value={presetId} onChange={(e) => setPresetId(e.target.value)} disabled={running}
                className="text-[12px] rounded-md border border-border bg-background px-2 py-1 outline-none focus:border-primary cursor-pointer">
                {SELECTABLE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.desc}</option>)}
              </select>
            </label>
          )}
          <label className="inline-flex items-center gap-1.5 cursor-pointer ml-auto">
            <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
            상세 보기(모델·비용)
          </label>
        </div>

        {err && (
          <div className="mt-2 flex items-start gap-1.5 text-[12px] text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {err}
          </div>
        )}
      </div>

      {/* 노드 진행 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <ol className="space-y-1.5">
          {def.nodes.map((n, i) => {
            const r = state?.nodes[i];
            const st = r?.status || "pending";
            const isOpen = !!open[n.id];
            return (
              <li key={n.id} className={`rounded-xl border bg-card ${st === "skipped" ? "border-dashed border-border" : "border-border"}`}>
                <button onClick={() => setOpen((p) => ({ ...p, [n.id]: !p[n.id] }))}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left">
                  <span className="text-[13px] shrink-0">{n.emoji || "•"}</span>
                  <span className="text-[13px] font-semibold shrink-0">
                    {i + 1}. {advanced ? n.label : n.userLabel}
                  </span>
                  <span className={`text-[11.5px] shrink-0 inline-flex items-center gap-1 ${ST[st]}`}>
                    {st === "running" && <><Loader2 className="w-3 h-3 animate-spin" /> 진행 중</>}
                    {st === "completed" && <><Check className="w-3 h-3" /> 완료</>}
                    {st === "failed" && <><AlertTriangle className="w-3 h-3" /> 실패</>}
                    {st === "skipped" && <><MinusCircle className="w-3 h-3" /> 건너뜀</>}
                  </span>
                  {!!r?.attempts && r.attempts > 1 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5 shrink-0">
                      <RotateCcw className="w-3 h-3" />{r.attempts}회
                    </span>
                  )}
                  {advanced && (
                    <span className="ml-auto flex items-center gap-2.5 text-[11px] text-muted-foreground shrink-0">
                      {r?.provider && <span className="hidden md:inline">{providerLabel(r.provider)} · {r.modelId}</span>}
                      {r?.fallbackUsed && <span className="text-amber-600 dark:text-amber-400">폴백</span>}
                      {!!r?.latencyMs && <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" />{(r.latencyMs / 1000).toFixed(1)}s</span>}
                      {!!r?.estimatedCost && <span className="inline-flex items-center gap-0.5 tabular-nums"><Coins className="w-3 h-3" />{fmtKrw(r.estimatedCost)}</span>}
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  )}
                  {!advanced && <span className="ml-auto">{isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}</span>}
                </button>
                {isOpen && (
                  <div className="border-t border-border px-3 py-2.5">
                    {r?.skipReason && <p className="text-[12px] text-amber-600 dark:text-amber-400 mb-1.5">{r.skipReason}</p>}
                    {r?.error && <p className="text-[12.5px] text-rose-600 dark:text-rose-400 mb-1.5">{r.error}</p>}
                    {advanced && (r?.promptTokens || r?.completionTokens) ? (
                      <p className="text-[11px] text-muted-foreground mb-1.5 tabular-nums">
                        입력 {(r.promptTokens || 0).toLocaleString()} · 출력 {(r.completionTokens || 0).toLocaleString()} 토큰
                        {!!r.retryCount && ` · 재시도 ${r.retryCount}`}
                      </p>
                    ) : null}
                    {r?.output != null ? (
                      <>
                        <button onClick={() => void copy(typeof r.output === "string" ? r.output : JSON.stringify(r.output, null, 2))}
                          className="mb-1.5 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                          <Copy className="w-3 h-3" /> 복사
                        </button>
                        <pre className="whitespace-pre-wrap break-words font-sans text-[12px] leading-relaxed max-h-[300px] overflow-y-auto">
                          {typeof r.output === "string" ? r.output : JSON.stringify(r.output, null, 2)}
                        </pre>
                      </>
                    ) : (
                      <p className="text-[12px] text-muted-foreground">
                        {st === "pending" ? "대기 중" : st === "running" ? "진행 중…" : "결과 없음"}
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* 요약 */}
        {state && state.status !== "idle" && (
          <div className="mt-3 rounded-xl border border-border bg-card px-3.5 py-3">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[12px] font-bold">실행 요약</span>
              {state.status === "running" && <span className="text-[11px] text-primary">진행 중…</span>}
              {state.status === "canceled" && <span className="text-[11px] text-muted-foreground">중지됨</span>}
              {state.rewriteCount > 0 && (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5">
                  <RotateCcw className="w-3 h-3" /> 부분 보완 {state.rewriteCount}회
                </span>
              )}
              {state.bestScore != null && <span className="text-[11px] text-muted-foreground">최고 {state.bestScore}점</span>}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
              <span>시간 <b className="tabular-nums">{(state.durationMs / 1000).toFixed(1)}초</b></span>
              {advanced && <span>토큰 <b className="tabular-nums">{state.totalTokens.toLocaleString()}</b></span>}
              {advanced && <span>원가 <b className="tabular-nums text-primary">{fmtKrw(state.estimatedCost)}</b></span>}
            </div>
            {state.qualityWarning && (
              <p className="mt-2 flex items-start gap-1.5 text-[12px] text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {state.qualityWarning}
              </p>
            )}
            {mock && <p className="mt-1.5 text-[11px] text-muted-foreground">모의 실행이라 원가는 0원입니다.</p>}
          </div>
        )}

        {/* 최종 결과 */}
        {fin && (
          <div className="mt-3 rounded-xl border border-primary/40 bg-card">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border flex-wrap">
              <span className="text-[13px] font-bold">✅ {fin.title || "최종 결과물"}</span>
              <span className="text-[11px] text-muted-foreground">품질 {fin.qualityScore}점</span>
              <button onClick={() => void copy(fin.content)}
                className="ml-auto text-[11.5px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <Copy className="w-3 h-3" /> 본문 복사
              </button>
            </div>
            <div className="px-3.5 py-3">
              {(fin.metaDescription || fin.slug || fin.tags.length > 0) && (
                <div className="mb-2.5 text-[11.5px] text-muted-foreground space-y-0.5">
                  {fin.metaDescription && <div>메타 설명: {fin.metaDescription}</div>}
                  {fin.slug && <div>URL: /{fin.slug}</div>}
                  {fin.tags.length > 0 && <div>태그: {fin.tags.join(", ")}</div>}
                </div>
              )}
              <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed">{fin.content}</pre>
              {advanced && fin.sources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-border">
                  <p className="text-[11px] font-bold text-muted-foreground mb-1">사용 출처 {fin.sources.length}건</p>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5">
                    {fin.sources.slice(0, 8).map((s, k) => <li key={k}>· {s.title || s.url}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
