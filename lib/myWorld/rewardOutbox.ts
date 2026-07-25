// My World — 오프라인 보상 아웃박스 (05-06G). 순수 로직(브라우저 비의존, node:test 검증).
//
// 원칙: 아웃박스는 "보상 결과"가 아니라 "보상 의도(operationId)"만 저장한다.
//  · 최종 EXP·amount·email·token 을 저장하지 않는다.
//  · UID namespace(myworld_reward_outbox_uid_{uid}), guest 와 분리.
//  · operationId 멱등(중복 적재 없음), 성공 후에만 compare-and-delete 로 해당 op 만 제거.
//  · 401/403/invalid = 영구 실패(무한 재시도 금지), network/5xx = 제한적 재시도(backoff).
//  · localStorage 를 임의 변경해도 서버 cap/정책을 우회하지 못한다(서버가 최종 권위).
import type { KeyValueStorage } from "@/lib/myWorld/interaction/storage";

export const REWARD_OUTBOX_VERSION = 1;
export const REWARD_OUTBOX_MAX = 50;
export const REWARD_OUTBOX_MAX_ATTEMPTS = 8;
const BACKOFF_BASE_MS = 2_000;
const BACKOFF_CAP_MS = 5 * 60_000;

export type AllowedRewardType =
  | "my_world_interaction"
  | "community_post" | "community_comment" | "mission_complete" | "minigame_play" | "game_activity";
const REWARD_TYPES = new Set<AllowedRewardType>([
  "my_world_interaction", "community_post", "community_comment", "mission_complete", "minigame_play", "game_activity",
]);
// operationId 접두: mwi(interaction)·post·comment·mission·minigame·act(activity). 서버가 최종 재검증.
const OP_ID_RE = /^(mwi|post|comment|mission|minigame|act)_[A-Za-z0-9_-]{1,120}$/;
const KIND_RE = /^[a-z_]{1,24}$/;
const SOURCE_RE = /^[A-Za-z0-9_-]{1,64}$/;

export interface RewardOutboxItem {
  version: 1;
  uid: string;
  operationId: string;
  rewardType: AllowedRewardType;
  sourceId?: string;
  kind?: string;
  createdAt: number;
  attempts: number;
  nextAttemptAt?: number;
}

export function rewardOutboxKey(uid: string): string { return `myworld_reward_outbox_uid_${uid}`; }
export function rewardOutboxGuestKey(): string { return "myworld_reward_outbox_guest"; }

// ── 정규화(손상·조작 방어) ──────────────────────────────────────────
function normalizeItem(raw: unknown, uid: string): RewardOutboxItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.operationId !== "string" || !OP_ID_RE.test(r.operationId)) return null;
  if (!REWARD_TYPES.has(r.rewardType as AllowedRewardType)) return null;
  // ⚠️ 권위·PII 필드가 섞여 있으면 통째로 폐기(조작 신호).
  for (const forbidden of ["amount", "exp", "doriExp", "finalExp", "email", "token", "idToken", "level", "tier"]) {
    if (forbidden in r) return null;
  }
  const kind = typeof r.kind === "string" && KIND_RE.test(r.kind) ? r.kind : undefined;
  const sourceId = typeof r.sourceId === "string" && SOURCE_RE.test(r.sourceId) ? r.sourceId : undefined;
  return {
    version: REWARD_OUTBOX_VERSION,
    uid,                                   // 항상 현재 uid 로 고정(다른 uid 항목 혼입 차단)
    operationId: r.operationId,
    rewardType: r.rewardType as AllowedRewardType,
    ...(kind ? { kind } : {}),
    ...(sourceId ? { sourceId } : {}),
    createdAt: typeof r.createdAt === "number" && Number.isFinite(r.createdAt) ? r.createdAt : 0,
    attempts: typeof r.attempts === "number" && r.attempts >= 0 ? Math.floor(r.attempts) : 0,
    ...(typeof r.nextAttemptAt === "number" ? { nextAttemptAt: r.nextAttemptAt } : {}),
  };
}

export function readOutbox(storage: KeyValueStorage | null, uid: string): RewardOutboxItem[] {
  if (!storage || !uid) return [];
  let arr: unknown;
  try { arr = JSON.parse(storage.getItem(rewardOutboxKey(uid)) || "[]"); } catch { return []; }
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: RewardOutboxItem[] = [];
  for (const raw of arr) {
    const item = normalizeItem(raw, uid);
    if (!item || seen.has(item.operationId)) continue; // 손상·중복 제거
    seen.add(item.operationId);
    out.push(item);
    if (out.length >= REWARD_OUTBOX_MAX) break;         // 최대 크기 제한
  }
  return out.sort((a, b) => a.createdAt - b.createdAt); // FIFO
}

function writeOutbox(storage: KeyValueStorage | null, uid: string, items: RewardOutboxItem[]): void {
  if (!storage || !uid) return;
  try { storage.setItem(rewardOutboxKey(uid), JSON.stringify(items.slice(0, REWARD_OUTBOX_MAX))); } catch { /* noop */ }
}

/** operationId 멱등 적재(이미 있으면 갱신 없이 유지). */
export function enqueueReward(storage: KeyValueStorage | null, uid: string, item: Omit<RewardOutboxItem, "version" | "uid" | "attempts">): RewardOutboxItem[] {
  if (!storage || !uid) return [];
  const items = readOutbox(storage, uid);
  if (items.some((i) => i.operationId === item.operationId)) return items; // 멱등
  const normalized = normalizeItem({ ...item, uid, version: REWARD_OUTBOX_VERSION, attempts: 0 }, uid);
  if (!normalized) return items;
  const next = [...items, normalized].slice(0, REWARD_OUTBOX_MAX);
  writeOutbox(storage, uid, next);
  return next;
}

/** 성공한 operation 만 제거(compare-and-delete). 다른 op·더 최신 항목은 유지. */
export function removeReward(storage: KeyValueStorage | null, uid: string, operationId: string): RewardOutboxItem[] {
  if (!storage || !uid) return [];
  const items = readOutbox(storage, uid).filter((i) => i.operationId !== operationId);
  writeOutbox(storage, uid, items);
  return items;
}

/** 재시도 실패 기록: 영구 실패면 제거, 재시도 가능이면 attempts++ 와 backoff 시각 갱신. */
export type ClaimFailure = "permanent" | "retryable";
/**
 * 실패 분류(§12). 정책/검증 실패만 영구, 나머지는 재시도(무한 삭제 금지).
 *  · permanent: 400(malformed)·403(정책 거부)·422(invalid state) — 재시도해도 실패.
 *  · retryable: 0(network)·401(token refresh 후)·404(엔드포인트 미배포/라우팅/일시)·409(conflict)·429·5xx.
 * ⚠️ 404 를 영구 실패로 취급하면 endpoint 미배포 시 보상 요청이 조용히 사라진다(silent loss).
 */
export function classifyClaimFailure(status: number): ClaimFailure {
  if (status === 400 || status === 403 || status === 422) return "permanent";
  return "retryable"; // 0·401·404·409·429·5xx
}
export function backoffDelay(attempts: number): number {
  return Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, attempts));
}

export function recordFailure(
  storage: KeyValueStorage | null, uid: string, operationId: string, failure: ClaimFailure, now: number,
): RewardOutboxItem[] {
  if (!storage || !uid) return [];
  const items = readOutbox(storage, uid);
  const next: RewardOutboxItem[] = [];
  for (const it of items) {
    if (it.operationId !== operationId) { next.push(it); continue; }
    if (failure === "permanent") continue; // 영구 실패 → 제거(무한 재시도 금지)
    const attempts = it.attempts + 1;
    if (attempts >= REWARD_OUTBOX_MAX_ATTEMPTS) continue; // 재시도 상한 초과 → 폐기
    next.push({ ...it, attempts, nextAttemptAt: now + backoffDelay(attempts) });
  }
  writeOutbox(storage, uid, next);
  return next;
}

/** 지금 전송 가능한 항목(backoff 지난 것, FIFO). */
export function dueRewards(items: RewardOutboxItem[], now: number): RewardOutboxItem[] {
  return items.filter((i) => (i.nextAttemptAt ?? 0) <= now);
}
