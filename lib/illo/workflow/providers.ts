// Agent가 쓸 수 있는 공급자(provider)와 '지금 실제로 연결됐는지'.
// 기획서 원칙: Workflow는 모델에 종속되지 않는다. Agent는 우선순위(Priority 1/2/3)만 선언하고,
// 엔진이 그중 '연결된' 첫 번째를 고른다. 새 모델을 연결하면 워크플로우 정의는 그대로 두고
// 여기 CONNECTED에만 추가하면 전체 워크플로우가 그 모델을 쓰기 시작한다.

export type Provider = "claude" | "openai" | "gemini" | "groq" | "search" | "publish" | "deliver";

/** ⚠️ 지금 실제로 호출 가능한 것만. 연동을 끝낼 때마다 하나씩 추가한다. */
export const CONNECTED: Provider[] = ["claude"];

export function isConnected(p: Provider): boolean {
  return CONNECTED.includes(p);
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  claude: "Claude",
  openai: "GPT",
  gemini: "Gemini",
  groq: "Groq",
  search: "웹 검색",
  publish: "발행",
  deliver: "전송",
};

/** Agent가 선언하는 모델 후보 (기획서의 Priority 1 / 2 / 3) */
export type ModelPick = {
  provider: Provider;
  /** 그 공급자의 모델 id. claude 외에는 아직 미연동이라 호출되지 않는다. */
  model: string;
  /** 이 후보를 고른 이유 — 품질/속도/비용 */
  why?: string;
};

/** 우선순위 목록에서 '연결된' 첫 번째를 고른다. 없으면 null(=이 노드는 못 돈다). */
export function resolveModel(picks: ModelPick[]): ModelPick | null {
  for (const p of picks) if (isConnected(p.provider)) return p;
  return null;
}
