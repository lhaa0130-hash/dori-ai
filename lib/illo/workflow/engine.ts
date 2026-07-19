// Workflow 실행기 — "AI 회사"를 돌린다.
// 직선 파이프라인이 아니다: Judge가 점수를 매기고, 기준 미달이면 앞 Agent로 되돌아가 다시 일한다.
//
// 설계 원칙
//  1) 모델 호출은 ModelCaller 하나로만 → 브라우저(BYOK)든 서버(Worker)든 이 함수만 교체
//  2) Agent는 모델을 '우선순위'로만 선언 → 엔진이 연결된 것 중 첫 번째를 고름(기획서 Fallback)
//  3) 연결 안 된 능력(검색·발행·전송)은 건너뛰되 '왜 건너뛰었는지'를 남긴다 — 조용히 빠지면 거짓말이 된다
//  4) Agent마다 토큰·시간·원가를 누적 기록 → 재작업이 원가를 얼마나 밀어올리는지 그대로 보인다

import type { ModelCaller, NodeRun, RunState, WorkflowDef } from "./types";
import { costKrw } from "./cost";
import { isConnected, resolveModel, PROVIDER_LABEL, type Provider } from "./providers";

function emptyRun(def: WorkflowDef, input: string): RunState {
  return {
    workflowId: def.id,
    input,
    status: "idle",
    runs: def.agents.map((a) => ({ nodeId: a.id, status: "wait" as const })),
    totalMs: 0,
    totalCostKrw: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    rewrites: 0,
  };
}

function buildContext(def: WorkflowDef, runs: NodeRun[], inputs: string[] | undefined): string {
  if (!inputs?.length) return "";
  const parts: string[] = [];
  inputs.forEach((id) => {
    const idx = def.agents.findIndex((a) => a.id === id);
    if (idx < 0) return;
    const r = runs[idx];
    if (!r?.output) return;
    parts.push(`--- ${def.agents[idx].label} ---\n${r.output}`);
  });
  return parts.join("\n\n");
}

/** Judge 응답에서 점수를 뽑는다. 못 뽑으면 null(=통과 처리, 무한루프 방지). */
export function parseScore(text: string): number | null {
  const m = text.match(/점수\s*[:：]?\s*(\d{1,3})/) || text.match(/^\s*(\d{1,3})\s*(?:점|\/\s*100)/m);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export type RunOptions = {
  def: WorkflowDef;
  input: string;
  call: ModelCaller;
  onUpdate?: (state: RunState) => void;
  signal?: AbortSignal;
};

export async function runWorkflow(opts: RunOptions): Promise<RunState> {
  const { def, input, call, onUpdate, signal } = opts;
  const state = emptyRun(def, input);
  state.status = "running";
  const t0 = Date.now();
  const emit = () => onUpdate?.({ ...state, runs: state.runs.map((r) => ({ ...r })) });
  emit();

  let i = 0;
  let guard = 0;                        // 어떤 경우에도 무한루프를 막는 최후 방어선
  const maxSteps = def.agents.length * 6 + 20;

  while (i < def.agents.length) {
    if (signal?.aborted) { state.status = "canceled"; break; }
    if (++guard > maxSteps) { state.status = "error"; state.error = "재작업이 너무 많이 반복돼 중단했어요."; break; }

    const a = def.agents[i];
    const prev = state.runs[i];

    // ── 1) 이 Agent가 돌 수 있는가 ──
    if (a.capability !== "llm" && !isConnected(a.capability as Provider)) {
      state.runs[i] = {
        nodeId: a.id, status: "skip",
        skipReason: `${PROVIDER_LABEL[a.capability as Provider]} 연동 전이라 건너뜀`,
      };
      emit(); i++; continue;
    }
    const pick = resolveModel(a.models);
    if (!pick) {
      state.runs[i] = { nodeId: a.id, status: "skip", skipReason: "쓸 수 있는 모델이 아직 연결되지 않음" };
      emit(); i++; continue;
    }

    state.runs[i] = { ...prev, nodeId: a.id, status: "run", provider: pick.provider, model: pick.model };
    emit();

    // ── 2) 프롬프트: [공용 재료] → [이 Agent 지시] (앞부분은 나중에 캐싱 대상) ──
    const context = buildContext(def, state.runs, a.inputs);
    const prompt = [
      context ? `아래는 앞 단계 담당자들이 넘긴 자료입니다.\n\n${context}` : "",
      `[의뢰 내용]\n${input}`,
      `[당신의 역할]\n${a.role}`,
      `[할 일]\n${a.instruction}`,
      a.judge
        ? `반드시 첫 줄에 "점수: NN" (0~100)을 쓰고, 그 아래에 감점 사유와 고칠 점을 구체적으로 쓰세요.`
        : "설명·인사말 없이 결과물만 작성하세요.",
    ].filter(Boolean).join("\n\n");

    const start = Date.now();
    try {
      const r = await call({ prompt, model: pick.model, maxTokens: a.maxTokens ?? 2000 });
      const u = r.usage;
      const cost = u ? costKrw(pick.model, u) : 0;
      const score = a.judge ? parseScore(r.text) : null;

      // 재작업이면 누적한다 (원가가 실제로 얼마나 늘었는지 보이도록)
      state.runs[i] = {
        nodeId: a.id, status: "done",
        provider: pick.provider, model: pick.model,
        output: r.text,
        attempts: (prev?.attempts || 0) + 1,
        score: score ?? undefined,
        ms: (prev?.ms || 0) + (Date.now() - start),
        inputTokens: (prev?.inputTokens || 0) + (u?.inputTokens || 0),
        outputTokens: (prev?.outputTokens || 0) + (u?.outputTokens || 0),
        cacheReadTokens: (prev?.cacheReadTokens || 0) + (u?.cacheReadTokens || 0),
        cacheWriteTokens: (prev?.cacheWriteTokens || 0) + (u?.cacheWriteTokens || 0),
        costKrw: (prev?.costKrw || 0) + cost,
      };
      state.totalCostKrw += cost;
      state.totalInputTokens += u?.inputTokens || 0;
      state.totalOutputTokens += u?.outputTokens || 0;
      if (!a.judge) state.finalOutput = r.text;
      emit();

      // ── 3) Judge 판정 — 미달이면 되돌아가 다시 일한다 ──
      if (a.judge && score != null && score < a.judge.min && state.rewrites < a.judge.maxRetry) {
        const back = def.agents.findIndex((x) => x.id === a.judge!.retryFrom);
        if (back >= 0) {
          state.rewrites++;
          i = back;
          emit();
          continue;
        }
      }
    } catch (e) {
      state.runs[i] = {
        ...state.runs[i], nodeId: a.id, status: "error",
        ms: (prev?.ms || 0) + (Date.now() - start),
        error: (e as Error)?.message || "실행 실패",
      };
      state.status = "error";
      state.error = (e as Error)?.message || "실행 실패";
      state.totalMs = Date.now() - t0;
      emit();
      return state;
    }
    i++;
  }

  if (state.status === "running") state.status = "done";
  // 최종 결과물 = 마지막으로 성공한 non-judge Agent의 출력
  if (!state.finalOutput) {
    for (let k = state.runs.length - 1; k >= 0; k--) {
      if (state.runs[k].status === "done" && state.runs[k].output && !def.agents[k].judge) {
        state.finalOutput = state.runs[k].output; break;
      }
    }
  }
  state.totalMs = Date.now() - t0;
  emit();
  return state;
}
