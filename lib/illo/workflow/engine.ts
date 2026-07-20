// 범용 Workflow 실행기 — 블로그 전용이 아니다.
// 노드는 역할(ModelClass)만 선언하고, 실제 모델은 프리셋이 정하며, 실패하면 폴백한다.
// 심사 노드가 기준 미달이면 '부분 재작성' 노드로 보냈다가 다시 심사로 돌아온다.

import type {
  ExecutionState, JudgeResult, NodeCtx, NodeDef, NodeExecution, RunSettings, WorkflowDef,
} from "./types";
import { presetById, resolveChain, type ModelRef, type ProviderId } from "./models";
import { costKrw } from "./cost";
import type { AdapterRegistry } from "./llm";
import type { SearchProvider } from "./search";

let seq = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/** 코드펜스/잡담이 섞여도 JSON을 건져낸다 */
export function parseJson<T = unknown>(text: string): T | null {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const tryParse = (s: string): T | null => { try { return JSON.parse(s) as T; } catch { return null; } };
  const direct = tryParse(cleaned);
  if (direct) return direct;
  const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
  if (s >= 0 && e > s) return tryParse(cleaned.slice(s, e + 1));
  const as = cleaned.indexOf("["), ae = cleaned.lastIndexOf("]");
  if (as >= 0 && ae > as) return tryParse(cleaned.slice(as, ae + 1));
  return null;
}

export type RunOptions = {
  def: WorkflowDef;
  input: Record<string, unknown>;
  settings?: Partial<RunSettings>;
  presetId?: string;
  adapters: AdapterRegistry;
  search: SearchProvider;
  onUpdate?: (s: ExecutionState) => void;
  signal?: AbortSignal;
};

export async function runWorkflow(opts: RunOptions): Promise<ExecutionState> {
  const { def, input, adapters, search, onUpdate, signal } = opts;
  const settings: RunSettings = { ...def.defaultSettings, ...(opts.settings || {}) };
  const preset = presetById(opts.presetId || "standard");
  const execId = uid("exec");
  const t0 = Date.now();

  const state: ExecutionState = {
    id: execId, workflowId: def.id, presetId: preset.id, input, settings,
    status: "running",
    nodes: def.nodes.map((n) => ({ id: uid("ne"), executionId: execId, nodeId: n.id, status: "pending" })),
    rewriteCount: 0, totalTokens: 0, estimatedCost: 0, durationMs: 0,
    startedAt: new Date().toISOString(),
  };
  const out: Record<string, unknown> = {};
  const emit = () => onUpdate?.({ ...state, nodes: state.nodes.map((n) => ({ ...n })) });
  emit();

  const idx = (id: string) => def.nodes.findIndex((n) => n.id === id);
  const ctx = (): NodeCtx => ({ userInput: input, out, settings });
  const providerOf = (nodeId: string): ProviderId | null =>
    state.nodes.find((n) => n.nodeId === nodeId)?.provider ?? null;

  let i = 0;
  let pendingReturn: number | null = null;   // 재작성 후 돌아갈 심사 노드 index
  let best: { score: number; content: unknown; details: JudgeResult } | null = null;
  let guard = 0;
  const maxSteps = def.nodes.length + settings.maxRewriteCount * 4 + 20;

  while (i < def.nodes.length) {
    if (signal?.aborted) { state.status = "canceled"; break; }
    if (++guard > maxSteps) { state.error = "반복이 너무 많아 중단했습니다."; state.status = "failed"; break; }

    const node = def.nodes[i];
    const rec = state.nodes[i];

    // 재작성 전용 노드는 평소엔 건너뛴다
    if (node.onlyWhenRewrite && pendingReturn === null) {
      if (rec.status === "pending") { rec.status = "skipped"; rec.skipReason = "심사를 통과해 재작성 불필요"; }
      emit(); i++; continue;
    }

    rec.status = "running";
    rec.startedAt = new Date().toISOString();
    emit();
    const start = Date.now();

    try {
      // ── code 노드 ──
      if (node.kind === "code") {
        const v = node.run ? node.run(ctx()) : null;
        out[node.id] = v;
        Object.assign(rec, {
          status: "completed", output: v, latencyMs: Date.now() - start,
          completedAt: new Date().toISOString(), attempts: (rec.attempts || 0) + 1,
        });
        emit(); i++; continue;
      }

      // ── search 노드 ──
      if (node.kind === "search") {
        const qs = node.queries ? node.queries(ctx()) : [];
        const results = (await Promise.all(
          qs.slice(0, 4).map((q) => search.search(q, { maxResults: 3, signal }).catch(() => [])),
        )).flat();
        out[node.id] = results;
        Object.assign(rec, {
          status: "completed", provider: undefined, modelId: search.id,
          input: qs, output: results, latencyMs: Date.now() - start,
          completedAt: new Date().toISOString(), attempts: (rec.attempts || 0) + 1,
          skipReason: search.live ? undefined : "실제 검색 API 미연결 — 모의 결과",
        });
        emit(); i++; continue;
      }

      // ── llm 노드: 역할 → 후보 모델 목록 → 순서대로 시도 ──
      const avoid = node.avoidProviderOf ? providerOf(node.avoidProviderOf) : null;
      const chain: ModelRef[] = resolveChain(node.modelClass || "balanced", preset, avoid)
        .filter((r) => !!adapters[r.providerId]);

      if (!chain.length) {
        Object.assign(rec, {
          status: "skipped", skipReason: "이 역할에 쓸 수 있는 모델이 연결되지 않음",
          latencyMs: Date.now() - start, completedAt: new Date().toISOString(),
        });
        emit(); i++; continue;
      }

      const prompt = node.prompt ? node.prompt(ctx()) : "";
      let done = false;
      let lastErr = "";
      let retries = 0;

      for (let c = 0; c < chain.length && !done; c++) {
        const ref = chain[c];
        const adapter = adapters[ref.providerId]!;
        // JSON 기대 노드는 파싱 실패 시 같은 모델로 1회 더 시도한 뒤 폴백
        const attempts = node.json ? 2 : 1;
        for (let a = 0; a < attempts && !done; a++) {
          try {
            const r = await adapter.complete({
              modelId: ref.modelId, prompt, temperature: node.temperature,
              maxTokens: node.maxTokens ?? 2000, signal,
            });
            let value: unknown = r.text;
            if (node.json) {
              const parsed = parseJson(r.text);
              if (!parsed) { retries++; lastErr = "JSON 파싱 실패"; continue; }
              value = parsed;
            } else if (!r.text.trim()) {
              retries++; lastErr = "빈 응답"; continue;
            }
            const usage = r.usage || { inputTokens: 0, outputTokens: 0 };
            const cost = costKrw(ref, usage);
            out[node.id] = value;
            state.totalTokens += usage.inputTokens + usage.outputTokens;
            state.estimatedCost += cost;
            Object.assign(rec, {
              status: "completed", provider: ref.providerId, modelId: ref.modelId,
              fallbackUsed: c > 0, input: prompt, output: value,
              promptTokens: (rec.promptTokens || 0) + usage.inputTokens,
              completionTokens: (rec.completionTokens || 0) + usage.outputTokens,
              estimatedCost: (rec.estimatedCost || 0) + cost,
              latencyMs: (rec.latencyMs || 0) + (Date.now() - start),
              retryCount: retries, attempts: (rec.attempts || 0) + 1,
              completedAt: new Date().toISOString(), error: undefined,
            });
            done = true;
          } catch (e) {
            lastErr = (e as Error)?.message || "호출 실패";
            retries++;
            break;   // API 오류/타임아웃 → 같은 모델 재시도 없이 다음 후보로
          }
        }
      }

      if (!done) {
        Object.assign(rec, {
          status: "failed", error: lastErr || "모든 폴백 실패",
          latencyMs: (rec.latencyMs || 0) + (Date.now() - start),
          retryCount: retries, completedAt: new Date().toISOString(),
        });
        state.status = "failed"; state.error = `${node.label}: ${lastErr}`;
        state.durationMs = Date.now() - t0;
        emit();
        return state;
      }
      emit();

      // ── 심사 판정 ──
      if (node.judge) {
        const jr = (out[node.id] || {}) as JudgeResult;
        const score = Number(jr.totalScore) || 0;
        // 이번 라운드의 본문(재작성본이 있으면 그것). 최고 점수 본문을 따로 보존한다.
        const cur = (node.judge.contentNodes || [])
          .map((id) => out[id])
          .filter((v): v is string => typeof v === "string" && !!v.trim())
          .pop() ?? null;
        if (!best || score > best.score) {
          best = { score, content: cur, details: jr };
          out.__best__ = cur;
          out.__bestScore__ = score;
          out.__bestDetails__ = jr;
        }
        state.bestScore = best.score;
        const pass = score >= (node.judge.passScore ?? settings.passScore);
        if (!pass && state.rewriteCount < (node.judge.maxRewrite ?? settings.maxRewriteCount)) {
          state.rewriteCount++;
          pendingReturn = i;                 // 재작성 후 이 심사로 복귀
          i = idx(node.judge.rewriteNode);
          emit();
          continue;
        }
        if (!pass) {
          state.qualityWarning =
            `품질 기준(${node.judge.passScore}점)에 도달하지 못했습니다. 최고 점수 ${best.score}점 결과를 사용합니다.`;
        }
      }

      // 재작성 노드를 막 끝냈으면 심사로 복귀
      if (node.onlyWhenRewrite && pendingReturn !== null) {
        i = pendingReturn; pendingReturn = null; emit(); continue;
      }
    } catch (e) {
      Object.assign(rec, {
        status: "failed", error: (e as Error)?.message || "실패",
        latencyMs: Date.now() - start, completedAt: new Date().toISOString(),
      });
      state.status = "failed"; state.error = (e as Error)?.message || "실패";
      state.durationMs = Date.now() - t0;
      emit();
      return state;
    }
    i++;
  }

  if (state.status === "running") state.status = "completed";
  state.durationMs = Date.now() - t0;
  // 마지막 code 노드(Final Output)의 결과를 최종 산출물로 본다
  for (let k = def.nodes.length - 1; k >= 0; k--) {
    if (def.nodes[k].kind === "code" && out[def.nodes[k].id]) {
      const f = out[def.nodes[k].id] as NonNullable<ExecutionState["final"]>;
      f.executionSummary = {
        totalNodes: def.nodes.length,
        completedNodes: state.nodes.filter((n) => n.status === "completed").length,
        rewriteCount: state.rewriteCount,
        totalTokens: state.totalTokens,
        estimatedCost: Math.round(state.estimatedCost * 100) / 100,
        durationMs: state.durationMs,
      };
      state.final = f;
      break;
    }
  }
  emit();
  return state;
}
