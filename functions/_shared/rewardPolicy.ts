// 신뢰 서버 보상 정책 — 순수 로직(04-17 검증분 + level/tier 공식 포팅). (04-18)
// ⚠️ 서버 전용. 클라이언트는 rewardType 만 보낸다. 금액/xp/날짜/uid 는 서버가 결정.
//   functions/ 아래 _ 접두 폴더라 CF Pages 가 라우트로 노출하지 않음(비라우트 모듈).

export type RewardCurrency = "cottonCandy";
export type RewardType = "daily_attendance";

export interface RewardPolicy {
  type: RewardType; currency: RewardCurrency;
  baseAmount: number; xp: number;
  streakBonusEvery: number | null; streakBonusAmount: number;
  cooldown: "daily"; idempotencyScope: "user-day"; timezone: "Asia/Seoul";
}

export const REWARD_POLICIES: Record<RewardType, RewardPolicy> = {
  daily_attendance: {
    type: "daily_attendance", currency: "cottonCandy",
    baseAmount: 50, xp: 5, streakBonusEvery: 7, streakBonusAmount: 200,
    cooldown: "daily", idempotencyScope: "user-day", timezone: "Asia/Seoul",
  },
};

export function isKnownRewardType(v: unknown): v is RewardType {
  return v === "daily_attendance";
}

/** 서버 시간(now)에서 KST 'YYYY-MM-DD'. now 주입으로 자정 경계 테스트 가능. */
export function todayKST(now: Date): string {
  return new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
export function claimIdFor(rewardType: RewardType, dateStr: string): string {
  return `${rewardType}_${dateStr}`;
}

/** 요청 정제 — rewardType 만 허용. amount/xp/uid/email/date/streak 등 '있으면 거부'(오용 신호). */
export function sanitizeRewardRequest(
  body: unknown
): { ok: true; rewardType: RewardType } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_request" };
  const b = body as Record<string, unknown>;
  const forbidden = ["amount", "cottonCandy", "xp", "doriExp", "uid", "email", "date", "rewardDate", "streak", "level", "tier", "balance", "claimId", "attendance"];
  for (const k of forbidden) if (k in b) return { ok: false, error: `forbidden_field:${k}` };
  const allowed = new Set(["rewardType", "idToken"]);
  for (const k of Object.keys(b)) if (!allowed.has(k)) return { ok: false, error: `unexpected_field:${k}` };
  if (!isKnownRewardType(b.rewardType)) return { ok: false, error: "unknown_reward_type" };
  return { ok: true, rewardType: b.rewardType };
}

export interface StoredAttendance { lastChecked?: unknown; streak?: unknown; weekDays?: unknown; totalDays?: unknown; }

/** 서버가 출석 보상을 계산(순수). 저장 attendance + 오늘(KST)만 사용. 쓰기 없음. */
export function computeAttendanceReward(prev: StoredAttendance | null | undefined, todayStr: string): {
  alreadyToday: boolean; amount: number; xp: number; newStreak: number; bonus: boolean;
  newAttendance: { lastChecked: string; streak: number; weekDays: string[]; totalDays: number };
} {
  const policy = REWARD_POLICIES.daily_attendance;
  const p = prev && typeof prev === "object" ? prev : {};
  const lastChecked = typeof p.lastChecked === "string" ? p.lastChecked : "";
  const prevStreak = typeof p.streak === "number" && Number.isFinite(p.streak) && p.streak >= 0 ? Math.floor(p.streak) : 0;
  const prevTotal = typeof p.totalDays === "number" && Number.isFinite(p.totalDays) && p.totalDays >= 0 ? Math.floor(p.totalDays) : 0;
  const prevWeek = Array.isArray(p.weekDays) ? (p.weekDays as unknown[]).filter((x): x is string => typeof x === "string") : [];

  if (lastChecked === todayStr) {
    return { alreadyToday: true, amount: 0, xp: 0, newStreak: prevStreak, bonus: false,
      newAttendance: { lastChecked: todayStr, streak: prevStreak, weekDays: prevWeek, totalDays: prevTotal } };
  }
  let newStreak = 1;
  if (lastChecked && /^\d{4}-\d{2}-\d{2}$/.test(lastChecked)) {
    const diffDays = Math.round((Date.parse(todayStr) - Date.parse(lastChecked)) / (24 * 3600 * 1000));
    newStreak = diffDays === 1 ? prevStreak + 1 : 1;
  }
  const bonus = policy.streakBonusEvery !== null && newStreak > 0 && newStreak % policy.streakBonusEvery === 0;
  const amount = policy.baseAmount + (bonus ? policy.streakBonusAmount : 0);

  const today = new Date(todayStr + "T00:00:00Z");
  const dow = today.getUTCDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today.getTime() + mondayOffset * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const weekDays = prevWeek.filter((d) => d >= monday);
  if (!weekDays.includes(todayStr)) weekDays.push(todayStr);

  return { alreadyToday: false, amount, xp: policy.xp, newStreak, bonus,
    newAttendance: { lastChecked: todayStr, streak: newStreak, weekDays, totalDays: prevTotal + 1 } };
}

// ── level/tier 공식 — lib/userProfile.ts 에서 '정확히 그대로' 포팅(추측 아님). ──
//   기존 출석 경로(cottonCandy.addExp→fsSetExp)가 doriExp·tier·level 을 함께 저장하므로 동일 적용.
const TIER_THRESHOLDS: Record<number, number> = { 1: 0, 2: 50, 3: 150, 4: 350, 5: 700, 6: 1500, 7: 3000, 8: 5000, 9: 8000, 10: 12000 };
export function calculateTier(exp: number): number {
  for (let t = 10; t >= 2; t--) if (exp >= TIER_THRESHOLDS[t]) return t;
  return 1;
}
function getExpForLevel(level: number): number {
  if (level <= 1) return 50;
  if (level <= 5) return 50 + (level - 1) * 20;
  if (level <= 10) return 100 + (level - 5) * 30;
  if (level <= 20) return 200 + (level - 10) * 50;
  if (level <= 50) return 600 + (level - 20) * 100;
  return level * level * 20;
}
export function calculateLevel(exp: number): number {
  let level = 1, requiredExp = 0;
  while (level < 100 && exp >= requiredExp) {
    requiredExp += getExpForLevel(level);
    if (exp >= requiredExp) level++; else break;
  }
  return Math.min(level, 100);
}
export function levelTierFromExp(exp: number): { level: number; tier: number } {
  const e = Number.isFinite(exp) && exp >= 0 ? Math.floor(exp) : 0;
  return { level: calculateLevel(e), tier: calculateTier(e) };
}

// ── allowlist 파싱 — REWARD_TEST_UIDS(쉼표구분). trim·빈값제거·Set. ──
export function parseAllowlist(raw: string | undefined | null): Set<string> {
  if (!raw || typeof raw !== "string") return new Set();
  return new Set(raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0));
}
