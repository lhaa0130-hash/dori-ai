// 워크플로우 실행기. 노드를 순서대로 돌리며 앞 결과를 다음 노드에 넘긴다.
// 설계 원칙:
//  1) 모델 호출은 ModelCaller 하나로만 — 브라우저(BYOK)든 서버(Worker)든 이 함수만 갈아끼우면 된다.
//  2) 노드마다 토큰·시간·원가를 반드시 기록한다 — '실측' 없이는 가격을 정할 수 없다.
//  3) 프롬프트는 [공용 재료] → [이 노드 지시] 순서. 나중에 prompt caching을 붙이면
//     앞부분(재료)이 캐시되어 뒤 노드들의 입력 비용이 크게 준다.

import type { ModelCaller, NodeRun, RunState, WorkflowDef } from "./types";
import { costKrw } from "./cost";

function emptyRun(def: WorkflowDef, input: string): RunState {
  return {
    workflowId: def.id,
    input,
    status: "idle",
    runs: def.nodes.map((n) => ({ nodeId: n.id, status: "wait" as const })),
    totalMs: 0,
    totalCostKrw: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
  };
}

/** 앞 노드 결과를 모아 이 노드가 볼 '재료'를 만든다 */
function buildContext(def: WorkflowDef, runs: NodeRun[], inputs: string[] | undefined): string {
  if (!inputs || !inputs.length) return "";
  const parts: string[] = [];
  inputs.forEach((id) => {
    const idx = def.nodes.findIndex((n) => n.id === id);
    if (idx < 0) return;
    const r = runs[idx];
    if (!r?.output) return;
    parts.push(`--- ${def.nodes[idx].label} 결과 ---\n${r.output}`);
  });
  return parts.join("\n\n");
}

export type RunOptions = {
  def: WorkflowDef;
  input: string;
  call: ModelCaller;
  /** 노드가 끝날 때마다 호출 — 화면 실시간 갱신용 */
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

  for (let i = 0; i < def.nodes.length; i++) {
    if (signal?.aborted) {
      state.status = "canceled";
      state.totalMs = Date.now() - t0;
      emit();
      return state;
    }
    const node = def.nodes[i];
    const model = node.model || def.defaultModel;
    const maxTokens = node.maxTokens ?? 2000;
    state.runs[i] = { ...state.runs[i], status: "run", model };
    emit();

    const context = buildContext(def, state.runs, node.inputs);
    // 공용 재료를 앞에, 이 노드 지시를 뒤에 (캐싱 최적화 시 유리한 순서)
    const prompt = [
      context ? `아래는 앞 단계 결과물입니다.\n\n${context}` : "",
      "",
      `[요청 주제]\n${input}`,
      "",
      `[당신의 역할]\n${node.role}`,
      "",
      `[할 일]\n${node.instruction}`,
      "",
      "설명·인사말 없이 결과물만 작성하세요.",
    ].filter((s) => s !== "").join("\n");

    const nodeStart = Date.now();
    try {
      const r = await call({ prompt, model, maxTokens });
      const ms = Date.now() - nodeStart;
      const u = r.usage;
      const cost = u ? costKrw(model, u) : 0;
      state.runs[i] = {
        nodeId: node.id,
        status: "done",
        model,
        output: r.text,
        ms,
        inputTokens: u?.inputTokens,
        outputTokens: u?.outputTokens,
        cacheReadTokens: u?.cacheReadTokens,
        cacheWriteTokens: u?.cacheWriteTokens,
        costKrw: cost,
      };
      state.totalCostKrw += cost;
      state.totalInputTokens += u?.inputTokens || 0;
      state.totalOutputTokens += u?.outputTokens || 0;
      state.finalOutput = r.text;
      emit();
    } catch (e) {
      state.runs[i] = {
        ...state.runs[i],
        status: "error",
        ms: Date.now() - nodeStart,
        error: (e as Error)?.message || "실행 실패",
      };
      state.status = "error";
      state.error = (e as Error)?.message || "실행 실패";
      state.totalMs = Date.now() - t0;
      emit();
      return state;
    }
  }

  state.status = "done";
  state.totalMs = Date.now() - t0;
  emit();
  return state;
}
