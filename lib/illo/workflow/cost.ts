// 원가 계산 — 단가는 models.ts 카탈로그가 단일 출처다(모델 추가 시 거기만 고친다).

import { modelByRef, type ModelRef } from "./models";
import type { TokenUse } from "./llm";

export const USD_TO_KRW = 1400;   // 환율 가정 — 바뀌면 여기만 고친다

/** 실제 토큰 사용량 → 원(KRW). 캐시 읽기(1/10)·쓰기(1.25배)까지 반영. */
export function costKrw(ref: ModelRef, u: TokenUse): number {
  const m = modelByRef(ref);
  if (!m || m.inputCost == null || m.outputCost == null) return 0;
  const perIn = m.inputCost / 1_000_000;
  const perOut = m.outputCost / 1_000_000;
  const usd =
    u.inputTokens * perIn +
    u.outputTokens * perOut +
    (u.cacheReadTokens || 0) * perIn * 0.1 +
    (u.cacheWriteTokens || 0) * perIn * 1.25;
  return usd * USD_TO_KRW;
}

export function fmtKrw(v: number): string {
  if (!v) return "0원";
  if (v < 1) return `${v.toFixed(2)}원`;
  if (v < 100) return `${v.toFixed(1)}원`;
  return `${Math.round(v).toLocaleString()}원`;
}
