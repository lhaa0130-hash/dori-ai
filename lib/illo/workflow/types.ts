// Workflow = 여러 역할 노드 + 여러 모델 + 외부 API + 조건 분기 + 반복.
// 이 타입들은 블로그 전용이 아니다 — 어떤 워크플로우든 같은 엔진으로 돈다.

import type { ModelClass, ModelRef, ProviderId } from "./models";
import type { SearchResult } from "./search";

export type NodeKind = "llm" | "search" | "code";

/** 노드가 프롬프트/질의/코드를 만들 때 받는 것 */
export type NodeCtx = {
  /** 사용자가 넣은 원본 입력 */
  userInput: Record<string, unknown>;
  /** 지금까지의 노드 결과 (id → 파싱된 값 또는 문자열) */
  out: Record<string, unknown>;
  /** 실행 설정 */
  settings: RunSettings;
};

export type NodeDef = {
  id: string;
  /** 관리자용 실제 노드명 */
  label: string;
  /** 일반 사용자에게 보여줄 이름 (모델·내부구조 숨김) */
  userLabel: string;
  emoji?: string;
  kind: NodeKind;
  /** llm 노드 — 역할만 선언한다. 실제 모델은 프리셋이 정한다 */
  modelClass?: ModelClass;
  temperature?: number;
  maxTokens?: number;
  /** JSON 출력을 기대 → 파싱 실패 시 같은 모델 1회 재시도 후 폴백 */
  json?: boolean;
  /** 이 노드가 쓴 provider는 피한다 (Writer≠Judge 원칙) */
  avoidProviderOf?: string;
  prompt?: (ctx: NodeCtx) => string;
  /** search 노드가 던질 질의들 */
  queries?: (ctx: NodeCtx) => string[];
  /** code 노드 — LLM 없이 조합만 */
  run?: (ctx: NodeCtx) => unknown;
  /** 심사 노드 — 기준 미달이면 rewriteNode로 보냈다가 다시 돌아온다.
   *  contentNodes: 심사 대상 본문이 담긴 노드들(뒤쪽 우선). 최고 점수 본문을 보존하는 데 쓴다. */
  judge?: { passScore: number; rewriteNode: string; maxRewrite: number; contentNodes?: string[] };
  /** 재작성 노드 — 평상시엔 건너뛰고, 심사 탈락 때만 실행 */
  onlyWhenRewrite?: boolean;
};

export type RunSettings = {
  tone: string;
  targetLength: number;
  outputFormat: "markdown" | "html" | "text";
  articleType: string;
  passScore: number;
  maxRewriteCount: number;
  language: string;
};

export const DEFAULT_SETTINGS: RunSettings = {
  tone: "친근하지만 전문적인 문체",
  targetLength: 2500,
  outputFormat: "markdown",
  articleType: "information",
  passScore: 90,
  maxRewriteCount: 2,
  language: "ko",
};

export type WorkflowDef = {
  id: string;
  label: string;
  description: string;
  /** 사용자 입력 폼 정의 */
  fields: InputField[];
  nodes: NodeDef[];
  defaultSettings: RunSettings;
};

export type InputField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type: "text" | "textarea" | "number" | "select";
  options?: { value: string; label: string }[];
};

export type NodeStatus = "pending" | "running" | "completed" | "failed" | "skipped";

/** 노드 1회 실행 기록 — 저장·재실행·원가 분석의 단위 */
export type NodeExecution = {
  id: string;
  executionId: string;
  nodeId: string;
  status: NodeStatus;
  provider?: ProviderId;
  modelId?: string;
  fallbackUsed?: boolean;
  input?: unknown;
  output?: unknown;
  error?: string;
  skipReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCost?: number;   // KRW
  latencyMs?: number;
  retryCount?: number;
  attempts?: number;        // 재작성 등으로 여러 번 돈 횟수
  startedAt?: string;
  completedAt?: string;
};

export type JudgeIssue = {
  category: string;
  targetSectionId?: string;
  severity?: "low" | "medium" | "high";
  message: string;
  recommendedAction?: string;
};
export type JudgeResult = {
  totalScore: number;
  passed?: boolean;
  scores?: Record<string, number>;
  issues?: JudgeIssue[];
};

export type FinalOutput = {
  title: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  tags: string[];
  imagePrompt: string;
  qualityScore: number;
  qualityDetails: Record<string, unknown>;
  sources: SearchResult[];
  executionSummary: {
    totalNodes: number;
    completedNodes: number;
    rewriteCount: number;
    totalTokens: number;
    estimatedCost: number;
    durationMs: number;
  };
};

export type ExecutionStatus = "idle" | "running" | "completed" | "failed" | "canceled";

export type ExecutionState = {
  id: string;
  workflowId: string;
  presetId: string;
  input: Record<string, unknown>;
  settings: RunSettings;
  status: ExecutionStatus;
  nodes: NodeExecution[];
  rewriteCount: number;
  bestScore?: number;
  qualityWarning?: string;
  totalTokens: number;
  estimatedCost: number;   // KRW
  durationMs: number;
  error?: string;
  final?: FinalOutput;
  startedAt: string;
};
