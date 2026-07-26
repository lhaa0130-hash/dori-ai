// 서버 권위 보상 타입 확장 (05-06H) — community/mission/minigame/activity.
// ⚠️ 서버가 금액·상한·operationId 형식·source 관계를 소유한다. 클라이언트는 rewardType +
//    operationId (+ sourceId/kind) 만 보낸다. amount/exp/uid/email 은 '있으면 거부'.
//    functions/_shared 는 CF Pages 라우트로 노출되지 않는 비라우트 모듈이며 client bundle 에 포함되지 않는다.

export type ExtendedRewardType =
  | "community_post"
  | "community_comment"
  | "mission_complete"
  | "minigame_play"
  | "game_activity" // 명시적 source 가 없는 일반 활동(백필 등) — 상한만으로 제한
  | "achievement_claim" // 업적 1회 수령(평생 1회 — 원장이 보장)
  | "level_reward";     // 레벨 도달 보상(서버가 users.doriExp 로 레벨을 재계산해 검증)

export interface ExtendedRewardPolicy {
  rewardType: ExtendedRewardType;
  exp: number;                 // 서버 소유 고정 xp
  dailyExpCap: number;         // 이 타입의 일일 EXP 상한(서버 집계 기준)
  requiresSource: boolean;     // sourceId(post/comment/mission/game) 필요 여부
  opPrefix: string;            // operationId 접두(형식 검증)
  /** 서버 소유 솜사탕 지급량(05-07). 0 이면 재화 지급 없음. 클라이언트는 절대 금액을 못 보낸다. */
  candy: number;
  /** 이 타입의 일일 솜사탕 상한. exp 상한과 독립. */
  dailyCandyCap: number;
}

// ⚠️ 05-07: 재화(솜사탕)도 서버가 소유한다. 예전엔 completeMission 이 클라 인자 reward 로
//   Firestore cottonCandy 를 직접 increment 해서 무한 지급이 가능했다.
export const EXTENDED_REWARD_POLICIES: Record<ExtendedRewardType, ExtendedRewardPolicy> = {
  community_post:    { rewardType: "community_post",    exp: 15, dailyExpCap: 60,  requiresSource: true,  opPrefix: "post",     candy: 0,  dailyCandyCap: 0 },
  community_comment: { rewardType: "community_comment", exp: 5,  dailyExpCap: 40,  requiresSource: true,  opPrefix: "comment",  candy: 0,  dailyCandyCap: 0 },
  // 미션: 미션별 금액은 MISSION_CANDY 가 결정하고, 여기 candy 는 목록에 없는 미션의 기본값.
  mission_complete:  { rewardType: "mission_complete",  exp: 10, dailyExpCap: 100, requiresSource: true,  opPrefix: "mission",  candy: 0,  dailyCandyCap: 300 },
  minigame_play:     { rewardType: "minigame_play",     exp: 5,  dailyExpCap: 40,  requiresSource: true,  opPrefix: "minigame", candy: 50, dailyCandyCap: 50 },
  game_activity:     { rewardType: "game_activity",     exp: 5,  dailyExpCap: 40,  requiresSource: false, opPrefix: "act",      candy: 0,  dailyCandyCap: 0 },
  // 업적/레벨 보상: EXP 는 주지 않고 재화만. 금액은 아래 표가 소유하며 상한은 사실상 표의 합.
  achievement_claim: { rewardType: "achievement_claim", exp: 0,  dailyExpCap: 0,   requiresSource: true,  opPrefix: "ach",      candy: 0,  dailyCandyCap: 3000 },
  level_reward:      { rewardType: "level_reward",      exp: 0,  dailyExpCap: 0,   requiresSource: true,  opPrefix: "lv",       candy: 0,  dailyCandyCap: 3100 },
};

/**
 * 서버 소유 업적 보상표 (lib/cottonCandy.ts ACHIEVEMENTS 와 금액 동일).
 * ⚠️ BOUNDED CLIENT-ASSERTED: 달성 조건(글 수·좋아요 수 등)은 서버가 재검증하지 않는다.
 *    다만 ① 업적별 고정 금액 ② 업적당 **평생 1회**(원장 users/{uid}/rewardOperations/ach_{id})
 *    로 총액이 표의 합(2,660)으로 상한된다. 조건 서버검증은 후속 과제.
 */
export const ACHIEVEMENT_CANDY: Record<string, number> = {
  first_visit: 10, first_post: 50, comment_king: 100, streak_3: 100, streak_7: 300,
  streak_30: 1000, popular: 150, game_king: 200, quiz_master: 250, level_10: 500,
};
/** 서버 소유 레벨 보상표 — 도달 레벨은 users.doriExp 로 서버가 재계산해 검증한다. */
export const LEVEL_REWARD_CANDY: Record<number, number> = {
  5: 100, 10: 300, 15: 200, 20: 500, 30: 400, 40: 600, 50: 1000,
};
/**
 * level_reward 의 sourceId 는 `{level}` 숫자 문자열. 표에 없는 레벨은 null(거부).
 * ⚠️ 05-07B: 앞자리 0 을 금지한다. `lv_010` 과 `lv_10` 은 **서로 다른 operationId** 인데 둘 다
 *   레벨 10 으로 해석돼 같은 마일스톤을 두 번 받을 수 있었다(원장 멱등 우회).
 *   정규 표기(앞자리 0 없음) 하나만 허용해 레벨↔operationId 를 1:1 로 만든다.
 */
export function levelFromSource(sourceId: string | undefined): number | null {
  if (!sourceId || !/^[1-9]\d{0,2}$/.test(sourceId)) return null;
  const n = Number(sourceId);
  return Object.prototype.hasOwnProperty.call(LEVEL_REWARD_CANDY, n) ? n : null;
}

/**
 * 서버 소유 미션 보상표 (05-07). 클라이언트가 보낸 reward 금액은 무시하고 이 표만 쓴다.
 * BOUNDED CLIENT-ASSERTED: 활동 자체를 서버가 완전히 증명하지는 못하지만
 *  ① 미션별 고정 금액 ② 미션당 1일 1회(operationId={missionId}_{date}) ③ 타입 일일 상한
 * 으로 악용량을 상한선까지만 허용한다. localStorage 를 지워도 원장이 남아 재수령되지 않는다.
 */
export const MISSION_CANDY: Record<string, number> = {
  attendance:     50,
  read_trend:     30,
  write_post:     80,
  write_comment:  30,
  play_minigame:  40,
  quiz_correct:   50,
};

/**
 * 재화는 주지 않지만 **EXP 는 계속 주는** 레거시 미션 id (lib/missionProgress.ts 가 발행).
 * ⚠️ 05-07B: allowlist 를 도입하면서 이 id 들이 400 으로 막혀 기존 EXP 적립이 회귀했다.
 *   기존 동작을 보존하려면 '알려진 미션'에는 포함시키되 재화 금액만 0 으로 둔다.
 */
export const MISSION_EXP_ONLY = new Set(["checkin", "postset", "commentset", "likeset", "share"]);
/** 미션 sourceId 는 `{missionId}_{YYYY-MM-DD}` 형태다. missionId 와 날짜를 분리한다. */
export function parseMissionSource(sourceId: string | undefined): { missionId: string; date: string } | null {
  if (!sourceId) return null;
  const m = /^([a-z_]{1,32})_(\d{4}-\d{2}-\d{2})$/.exec(sourceId);
  return m ? { missionId: m[1], date: m[2] } : null;
}
export function missionIdFromSource(sourceId: string | undefined): string | null {
  return parseMissionSource(sourceId)?.missionId ?? null;
}
/** 알려진 미션만 지급한다(임의 missionId 거부). */
export function missionCandyFor(sourceId: string | undefined): number {
  const id = missionIdFromSource(sourceId);
  if (!id) return 0;
  return Object.prototype.hasOwnProperty.call(MISSION_CANDY, id) ? MISSION_CANDY[id] : 0;
}

/**
 * ⚠️ 05-07B 보안 수정: sourceId 안의 **날짜는 클라이언트가 정한다**.
 *   operationId = `{prefix}_{sourceId}` 이므로, 날짜만 바꾸면 매번 새 operationId 가 만들어져
 *   '미션당 1일 1회' 원장이 무력화됐다(예: `write_post_2099-01-01`).
 *   → 서버가 계산한 오늘 날짜와 일치할 때만 통과시킨다. 서버는 요청받은 날짜를 신뢰하지 않는다.
 *
 * playtime(minigame_play) sourceId 도 `playtime_{YYYY-MM-DD}` 라 같은 규칙을 적용한다.
 */
const DATED_SOURCE_RE = /^([a-z_]{1,32})_(\d{4}-\d{2}-\d{2})$/;
export function sourceDateMatchesServerDay(
  rewardType: ExtendedRewardType, sourceId: string | undefined, serverToday: string,
): boolean {
  if (rewardType !== "mission_complete" && rewardType !== "minigame_play") return true; // 날짜를 안 쓰는 타입
  const m = DATED_SOURCE_RE.exec(String(sourceId ?? ""));
  if (!m) return false;          // 날짜 없는 sourceId 로 우회 금지
  return m[2] === serverToday;   // 어제·내일·임의 날짜 전부 거부
}

/** 이 타입이 서버 allowlist 에 있는 sourceId 인지(모르는 미션/업적/레벨은 아예 거부). */
export function isKnownSource(rewardType: ExtendedRewardType, sourceId: string | undefined): boolean {
  if (rewardType === "mission_complete") {
    const id = missionIdFromSource(sourceId);
    if (!id) return false;
    // 재화 미션 표 + EXP 전용 레거시 미션(재화 0) 둘 다 '알려진' 미션이다.
    return Object.prototype.hasOwnProperty.call(MISSION_CANDY, id) || MISSION_EXP_ONLY.has(id);
  }
  if (rewardType === "achievement_claim") {
    return !!sourceId && Object.prototype.hasOwnProperty.call(ACHIEVEMENT_CANDY, sourceId);
  }
  if (rewardType === "level_reward") return levelFromSource(sourceId) !== null;
  return true;
}

/**
 * 전체 일일 솜사탕 상한(타입 무관). 타입별 상한의 합(6,450)만으로는 총액이 너무 크다.
 * 업적·레벨은 원장이 평생 1회를 보장하지만, 하루에 몰아서 받는 총량은 이 값으로 묶는다.
 */
export const DAILY_CANDY_TOTAL_CAP = 600;

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

/**
 * 이 타입의 이번 지급 솜사탕(순수) — 타입별 일일 상한 초과분은 0.
 * mission_complete 는 sourceId 의 missionId 로 금액이 결정된다(알 수 없는 미션 = 0).
 */
export function computeExtendedCandy(
  policy: ExtendedRewardPolicy, typeDailyCandy: number, sourceId?: string,
): number {
  const base =
    policy.rewardType === "mission_complete" ? missionCandyFor(sourceId)
    : policy.rewardType === "achievement_claim"
      ? (sourceId && Object.prototype.hasOwnProperty.call(ACHIEVEMENT_CANDY, sourceId) ? ACHIEVEMENT_CANDY[sourceId] : 0)
    : policy.rewardType === "level_reward"
      ? (levelFromSource(sourceId) !== null ? LEVEL_REWARD_CANDY[levelFromSource(sourceId) as number] : 0)
    : policy.candy;
  if (base <= 0) return 0;
  const earned = Number.isFinite(typeDailyCandy) && typeDailyCandy >= 0 ? Math.floor(typeDailyCandy) : 0;
  return Math.max(0, Math.min(base, policy.dailyCandyCap - earned));
}
