// 워크플로우 = 여러 AI가 순서대로 협업해 결과물 하나를 만드는 절차.
// 기획서의 "Workflow Engine" — Store(우리 키)와 Studio(BYOK)가 같은 엔진을 공유한다.
// v1은 LLM 노드만. 검색·이미지·전송 노드는 연동 후 추가.

export type NodeDef = {
  id: string;
  label: string;        // 화면에 보이는 이름 (기획 / 작성 / 검토 …)
  emoji?: string;
  /** 이 노드의 역할 — 프롬프트 앞부분에 들어간다 */
  role: string;
  /** 이 노드가 실제로 할 일 */
  instruction: string;
  /** 앞 노드들의 결과 중 무엇을 참조할지 (노드 id). 비면 사용자 입력만 본다 */
  inputs?: string[];
  /** 이 노드만 다른 모델을 쓰고 싶을 때 */
  model?: string;
  maxTokens?: number;
};

export type WorkflowDef = {
  id: string;
  label: string;
  description: string;
  /** 사용자에게 받을 입력 설명 (예: "글 주제") */
  inputLabel: string;
  inputPlaceholder: string;
  defaultModel: string;
  /** 실행 순서대로 저장한다(v1은 직선 파이프라인) */
  nodes: NodeDef[];
};

export type NodeStatus = "wait" | "run" | "done" | "error" | "skip";

/** 노드 1회 실행 기록 — 원가·시간 실측의 단위 */
export type NodeRun = {
  nodeId: string;
  status: NodeStatus;
  model?: string;
  output?: string;
  error?: string;
  ms?: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  costKrw?: number;
};

export type RunStatus = "idle" | "running" | "done" | "error" | "canceled";

export type RunState = {
  workflowId: string;
  input: string;
  status: RunStatus;
  runs: NodeRun[];          // nodes와 같은 순서
  totalMs: number;
  totalCostKrw: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  error?: string;
  /** 마지막 노드의 결과 = 최종 결과물 */
  finalOutput?: string;
};

/** 엔진이 모델을 부르는 유일한 통로 — 나중에 서버(Worker)에서도 같은 시그니처로 갈아끼운다 */
export type ModelCaller = (args: {
  prompt: string;
  model: string;
  maxTokens: number;
}) => Promise<{
  text: string;
  usage?: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number };
}>;
