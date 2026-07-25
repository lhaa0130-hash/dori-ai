// 서버 권위 보상 타입 확장 (05-06H) — community/mission/minigame/activity.
// ⚠️ 서버가 금액·상한·operationId 형식·source 관계를 소유한다. 클라이언트는 rewardType +
//    operationId (+ sourceId/kind) 만 보낸다. amount/exp/uid/email 은 '있으면 거부'.
//    functions/_shared 는 CF Pages 라우트로 노출되지 않는 비라우트 모듈이며 client bundle 에 포함되지 않는다.

export type ExtendedRewardType =
  | "community_post"
  | "community_comment"
  | "mission_complete"
  | "minigame_play"
  | "game_activity"; // 명시적 source 가 없는 일반 활동(백필 등) — 상한만으로 제한

export interface ExtendedRewardPolicy {
  rewardType: ExtendedRewardType;
  exp: number;                 // 서버 소유 고정 xp
  dailyExpCap: number;         // 이 타입의 일일 EXP 상한(서버 집계 기준)
  requiresSource: boolean;     // sourceId(post/comment/mission/game) 필요 여부
  opPrefix: string;            // operationId 접두(형식 검증)
}

export const EXTENDED_REWARD_POLICIES: Record<ExtendedRewardType, ExtendedRewardPolicy> = {
  community_post:    { rewardType: "community_post",    exp: 15, dailyExpCap: 60,  requiresSource: true,  opPrefix: "post" },
  community_comment: { rewardType: "community_comment", exp: 5,  dailyExpCap: 40,  requiresSource: true,  opPrefix: "comment" },
  mission_complete:  { rewardType: "mission_complete",  exp: 10, dailyExpCap: 100, requiresSource: true,  opPrefix: "mission" },
  minigame_play:     { rewardType: "minigame_play",     exp: 5,  dailyExpCap: 40,  requiresSource: true,  opPrefix: "minigame" },
  game_activity:     { rewardType: "game_activity",     exp: 5,  dailyExpCap: 40,  requiresSource: false, opPrefix: "act" },
};

export function isExtendedRewardType(v: unknown): v is ExtendedRewardType {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(EXTENDED_REWARD_POLICIES, v);
}

// operationId: {prefix}_{안전문자 8~120}. source 필요 타입은 sourceId 가 operationId 에 반영돼야 한다
// (operationId 만 바꿔 같은 source 를 재청구하지 못하게 — 의미상 unique = prefix+sourceId).
const SOURCE_RE = /^[A-Za-z0-9_-]{1,80}$/;
export function operationIdFor(policy: ExtendedRewardPolicy, sourceId: string | undefined): string | null {
  if (policy.requiresSource) {
    if (!sourceId || !SOURCE_RE.test(sourceId)) return null;
    return `${policy.opPrefix}_${sourceId}`;
  }
  return null; // source 없는 타입은 호출부가 무작위 operationId 를 만든다(형식만 검증).
}

export function isValidExtendedOperationId(policy: ExtendedRewardPolicy, operationId: unknown, sourceId?: string): boolean {
  if (typeof operationId !== "string") return false;
  if (!new RegExp(`^${policy.opPrefix}_[A-Za-z0-9_-]{1,120}$`).test(operationId)) return false;
  // source 필요 타입: operationId 가 sourceId 와 일치해야 한다(operationId 위조로 중복 청구 차단).
  if (policy.requiresSource) {
    const expected = operationIdFor(policy, sourceId);
    return expected !== null && operationId === expected;
  }
  return true;
}

/**
 * 확장 타입 요청 정제 — rewardType + operationId (+sourceId/gameId/missionId) 만.
 * amount/exp/uid/email/level/tier 등 권위 값은 거부.
 */
export function sanitizeExtendedRewardRequest(
  body: unknown,
): { ok: true; policy: ExtendedRewardPolicy; operationId: string; sourceId?: string }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_request" };
  const b = body as Record<string, unknown>;
  const forbidden = ["amount", "exp", "doriExp", "xp", "uid", "email", "level", "tier", "dailyExp", "currentExp", "finalExp"];
  for (const k of forbidden) if (k in b) return { ok: false, error: `forbidden_field:${k}` };
  const allowed = new Set(["rewardType", "idToken", "operationId", "sourceId", "gameId", "missionId", "kind"]);
  for (const k of Object.keys(b)) if (!allowed.has(k)) return { ok: false, error: `unexpected_field:${k}` };
  if (!isExtendedRewardType(b.rewardType)) return { ok: false, error: "unknown_reward_type" };
  const policy = EXTENDED_REWARD_POLICIES[b.rewardType];
  // sourceId 는 타입별 별칭(gameId/missionId)도 허용.
  const sourceId = typeof b.sourceId === "string" ? b.sourceId
    : typeof b.gameId === "string" ? b.gameId
    : typeof b.missionId === "string" ? b.missionId : undefined;
  if (policy.requiresSource && (!sourceId || !SOURCE_RE.test(sourceId))) return { ok: false, error: "missing_source" };
  if (!isValidExtendedOperationId(policy, b.operationId, sourceId)) return { ok: false, error: "invalid_operation_id" };
  return { ok: true, policy, operationId: b.operationId as string, ...(sourceId ? { sourceId } : {}) };
}

/** 이 타입의 이번 지급 EXP(순수) — 타입별 일일 상한 초과분은 0. */
export function computeExtendedExp(policy: ExtendedRewardPolicy, typeDailyEarned: number): number {
  const earned = Number.isFinite(typeDailyEarned) && typeDailyEarned >= 0 ? Math.floor(typeDailyEarned) : 0;
  return Math.max(0, Math.min(policy.exp, policy.dailyExpCap - earned));
}
