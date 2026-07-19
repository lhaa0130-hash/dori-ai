// 모델 단가표 — 워크플로우 원가 '실측'의 기준.
// 출처: Anthropic 공식 단가(2026-06-24 기준 캐시). 값은 1M 토큰당 USD.
// ⚠️ 여기 값이 틀리면 가격 정책 전체가 틀어진다. 모델 추가 시 반드시 공식 단가 확인.

export const USD_TO_KRW = 1400;   // 환율 가정 — 바뀌면 여기만 고친다

export type ModelPrice = {
  id: string;
  label: string;
  inUsd: number;    // 입력 1M 토큰당 USD
  outUsd: number;   // 출력 1M 토큰당 USD
  note?: string;
};

/** 실제로 호출 가능한 Claude 모델만. (다른 provider는 연동 후 추가) */
export const MODEL_PRICES: ModelPrice[] = [
  { id: "claude-haiku-4-5", label: "Haiku 4.5", inUsd: 1, outUsd: 5, note: "가장 싸고 빠름 — 워크플로우 기본" },
  // Sonnet 5는 2026-08-31까지 도입가($2/$10). 그 뒤 $3/$15로 오른다.
  { id: "claude-sonnet-5", label: "Sonnet 5", inUsd: 2, outUsd: 10, note: "도입가 — 2026-08-31 이후 $3/$15로 인상" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6", inUsd: 3, outUsd: 15 },
  { id: "claude-opus-4-8", label: "Opus 4.8", inUsd: 5, outUsd: 25, note: "가장 똑똑함 — 비쌈" },
  { id: "claude-fable-5", label: "Fable 5", inUsd: 10, outUsd: 50, note: "최상위 — 매우 비쌈" },
];

const BY_ID = new Map(MODEL_PRICES.map((m) => [m.id, m]));

export function modelPrice(id: string): ModelPrice | null {
  return BY_ID.get(id) || null;
}
export function modelLabel(id: string): string {
  return BY_ID.get(id)?.label || id;
}

export type TokenUse = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;   // 캐시 읽기 = 입력가의 약 1/10
  cacheWriteTokens?: number;  // 캐시 쓰기 = 입력가의 약 1.25배
};

/** 실제 토큰 사용량 → 원(KRW). 캐시 할인/할증까지 반영한다. */
export function costKrw(modelId: string, u: TokenUse): number {
  const p = modelPrice(modelId);
  if (!p) return 0;
  const perInTok = p.inUsd / 1_000_000;
  const perOutTok = p.outUsd / 1_000_000;
  const usd =
    u.inputTokens * perInTok +
    u.outputTokens * perOutTok +
    (u.cacheReadTokens || 0) * perInTok * 0.1 +
    (u.cacheWriteTokens || 0) * perInTok * 1.25;
  return usd * USD_TO_KRW;
}

/** 화면 표시용 — 소수점 원까지 (건당 수백 원 단위라 반올림하면 오차가 커진다). */
export function fmtKrw(v: number): string {
  if (v < 1) return `${v.toFixed(2)}원`;
  if (v < 100) return `${v.toFixed(1)}원`;
  return `${Math.round(v).toLocaleString()}원`;
}
