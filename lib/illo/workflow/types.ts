// Workflow = 하나의 AI가 아니라 "AI 회사".
// 여러 Agent가 각자 역할·모델을 갖고 협업하며, Judge 판정에 따라 되돌아가 다시 일한다.
// ⚠️ 절대 "Workflow = 모델 호출 한 번"으로 구현하지 말 것 (기획서 핵심 원칙).

import type { ModelPick, Provider } from "./providers";

/** 이 Agent가 하려면 무엇이 연결돼 있어야 하는가 */
export type Capability = "llm" | "search" | "publish" | "deliver";

export type AgentDef = {
  id: string;
  label: string;         // 화면 표시 (기획 / 조사 / 작성 …)
  emoji?: string;
  capability: Capability;
  /** 이 Agent의 정체성 */
  role: string;
  /** 실제로 할 일 */
  instruction: string;
  /** 참조할 앞 Agent들의 결과 */
  inputs?: string[];
  /** 기획서의 Priority 1/2/3 — 연결된 첫 번째가 선택된다 */
  models: ModelPick[];
  maxTokens?: number;
  /** Judge Agent — 점수가 min 미만이면 retryFrom부터 다시 실행 */
  judge?: {
    min: number;         // 통과 기준 점수(100점 만점)
    retryFrom: string;   // 다시 시작할 Agent id
    maxRetry: number;    // 최대 재작업 횟수 (비용 폭주 방지)
  };
};

export type WorkflowDef = {
  id: string;
  label: string;
  /** 사용자에게 보이는 한 줄 — 내부 Agent 구성은 보여주지 않는다 */
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  agents: AgentDef[];
};

export type NodeStatus = "wait" | "run" | "done" | "error" | "skip";

/** Agent 1개의 실행 기록 — 원가·시간 실측의 단위 */
export type NodeRun = {
  nodeId: string;
  status: NodeStatus;
  provider?: Provider;
  model?: string;
  output?: string;
  error?: string;
  /** 미연동이라 건너뛴 이유 */
  skipReason?: string;
  /** Judge 재작업으로 여러 번 돌았을 수 있다 */
  attempts?: number;
  score?: number;        // Judge만
  ms?: number;           // 누적
  inputTokens?: number;  // 누적
  outputTokens?: number; // 누적
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  costKrw?: number;      // 누적
};

export type RunStatus = "idle" | "running" | "done" | "error" | "canceled";

export type RunState = {
  workflowId: string;
  input: string;
  status: RunStatus;
  runs: NodeRun[];          // agents와 같은 순서
  totalMs: number;
  totalCostKrw: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  /** Judge가 되돌린 횟수 — 원가가 뛰는 주된 원인이라 따로 센다 */
  rewrites: number;
  error?: string;
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
