// 공통 클라이언트 보상 API (05-06G). 분산된 addExp(email, amount) 를 대체한다.
//  · 클라이언트는 최종 EXP·amount·uid·email 을 결정/전송하지 않는다. rewardType + operationId + kind 만.
//  · Identity Gate 가 ready 이고 currentUser.uid 가 일치할 때만 청구한다.
//  · 오프라인/네트워크 실패 → outbox 적재(operationId 재사용). 401/403/4xx → 영구 실패(재적재 금지).
//  · 서버 응답으로만 캐시를 갱신하고 dori-gamedata-synced 를 발행한다.
//  · 의존성 주입(transport/getIdToken/storage/now) → 엣지 없이 동작을 검증할 수 있다.
// 값 import 는 상대경로 .ts (node:test 로 직접 로드 가능하게). webpack 도 동일하게 해석.
import type { MyWorldIdentity } from "./myWorld/identity.ts";
import { createAuthenticatedScope } from "./myWorld/storageScope.ts";
import type { KeyValueStorage } from "./myWorld/interaction/storage.ts";
import {
  classifyClaimFailure, dueRewards, enqueueReward, readOutbox, recordFailure, removeReward,
  type AllowedRewardType, type RewardOutboxItem,
} from "./myWorld/rewardOutbox.ts";

export interface ClaimServerResult {
  ok: boolean; duplicate?: boolean; awardedExp?: number; doriExp?: number; level?: number; tier?: number; error?: string;
  /** 05-07: 서버가 결정한 이번 지급 솜사탕과 지급 후 잔액. 클라이언트는 이 값만 표시한다. */
  awardedCandy?: number; cottonCandy?: number;
}
/** HTTP 전송 포트. status + json 을 돌려준다. 네트워크 실패는 throw 로 표현. */
export type ClaimTransport = (body: Record<string, unknown>, idToken: string) => Promise<{ status: number; json: ClaimServerResult }>;

export interface ClaimDeps {
  identity: MyWorldIdentity;
  currentUser: { uid: string; email: string | null } | null;
  getIdToken: () => Promise<string | null>;
  transport: ClaimTransport;
  storage: KeyValueStorage | null;
  online: boolean;
  now: number;
  /** 서버 결과 반영(캐시 갱신 + dori-gamedata-synced). 선택. */
  onApplied?: (result: ClaimServerResult) => void;
}

export interface ClaimIntent { rewardType: AllowedRewardType; operationId: string; kind?: string; sourceId?: string }

/** interaction event.id 로부터 안정적인 operationId(mwi_) 파생 — retry/reload/offline 동일. */
export function deriveOperationId(eventId: string): string {
  const safe = String(eventId).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 110);
  return `mwi_${safe}`;
}

// 확장 타입 operationId 파생. 서버 operationIdFor 와 동일 규약({prefix}_{sourceId}) — 서버가 재검증.
const REWARD_TYPE_PREFIX: Record<Exclude<AllowedRewardType, "my_world_interaction" | "game_activity">, string> = {
  community_post: "post", community_comment: "comment", mission_complete: "mission", minigame_play: "minigame",
  achievement_claim: "ach", level_reward: "lv",
};
/** source 기반 타입(글/댓글/미션/게임)의 안정 operationId — 같은 source 는 항상 동일(자연 멱등). */
export function sourceOperationId(
  rewardType: Exclude<AllowedRewardType, "my_world_interaction" | "game_activity">, sourceId: string,
): string {
  const safe = String(sourceId).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  return `${REWARD_TYPE_PREFIX[rewardType]}_${safe}`;
}
/** source 가 없는 game_activity 용 operationId(act_). 안정 seed 를 넘겨 재시도 시 동일하게 유지. */
export function activityOperationId(seed: string): string {
  const safe = String(seed).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 110) || "x";
  return `act_${safe}`;
}

export type ClaimOutcome =
  | { status: "applied"; result: ClaimServerResult }
  | { status: "duplicate"; result: ClaimServerResult }
  | { status: "queued" }         // 오프라인/네트워크 실패 → outbox
  | { status: "rejected"; reason: string }   // 영구 실패(인증/정책)
  | { status: "skipped"; reason: string };   // ready 아님/uid 불일치

/** 청구 대상 계정을 확정(ready + currentUser.uid 일치). */
function scopeOf(deps: ClaimDeps): { uid: string } | null {
  const scope = createAuthenticatedScope(deps.identity, deps.currentUser);
  return scope ? { uid: scope.uid } : null;
}

/** 단일 청구 전송(내부). 성공/중복/영구실패/네트워크실패 분기. */
async function sendClaim(deps: ClaimDeps, uid: string, intent: ClaimIntent): Promise<ClaimOutcome> {
  const idToken = await deps.getIdToken().catch(() => null);
  if (!idToken) return { status: "queued" }; // 토큰 일시 불가 → 재시도 대상
  let res: { status: number; json: ClaimServerResult };
  try {
    // ⚠️ candyOwner: "server" — "이 클라이언트는 솜사탕을 **스스로 쓰지 않는다**"는 선언(05-09).
    //   구버전 client 는 grantPlaytimeReward 에서 로컬 +50 을 직접 쓰고 서버에도 minigame_play 를
    //   청구했다. 신규 Functions 가 그 타입에 재화를 붙이면서 **이중 지급(+100)** 이 생겼다.
    //   서버는 요청만 보고 클라 버전을 알 수 없으므로, 재화를 포기한 클라만 이 표식을 보낸다.
    //   표식이 없으면 서버는 "클라가 스스로 쓴다"고 보고 재화를 0 으로 둔다(fail-safe).
    //   ⚠️ 보안 경계가 아니다 — Rules 배포 후에는 클라 직접 쓰기가 막혀 어느 쪽이든 서버 값만 남는다.
    res = await deps.transport({ rewardType: intent.rewardType, operationId: intent.operationId, candyOwner: "server", ...(intent.kind ? { kind: intent.kind } : {}), ...(intent.sourceId ? { sourceId: intent.sourceId } : {}) }, idToken);
  } catch {
    return { status: "queued" }; // 네트워크 실패
  }
  // 응답 도착 후 계정이 바뀌었으면 반영하지 않는다.
  if (scopeOf(deps)?.uid !== uid) return { status: "skipped", reason: "identity_changed" };
  if (res.status >= 200 && res.status < 300 && res.json.ok) {
    deps.onApplied?.(res.json);
    return res.json.duplicate ? { status: "duplicate", result: res.json } : { status: "applied", result: res.json };
  }
  if (classifyClaimFailure(res.status) === "permanent") return { status: "rejected", reason: res.json.error || `http_${res.status}` };
  return { status: "queued" }; // 5xx/429 등
}

/**
 * 보상 청구. ready 아니면 skip. 오프라인이면 즉시 outbox 적재.
 * 온라인이면 전송 시도 → 성공/중복 반영, 네트워크/5xx 는 outbox, 영구 실패는 버림.
 */
export async function claimReward(deps: ClaimDeps, intent: ClaimIntent): Promise<ClaimOutcome> {
  const scope = scopeOf(deps);
  if (!scope) return { status: "skipped", reason: deps.identity.status };

  if (!deps.online) {
    enqueueReward(deps.storage, scope.uid, { operationId: intent.operationId, rewardType: intent.rewardType, kind: intent.kind, sourceId: intent.sourceId, createdAt: deps.now });
    return { status: "queued" };
  }
  const outcome = await sendClaim(deps, scope.uid, intent);
  if (outcome.status === "queued") {
    enqueueReward(deps.storage, scope.uid, { operationId: intent.operationId, rewardType: intent.rewardType, kind: intent.kind, sourceId: intent.sourceId, createdAt: deps.now });
  }
  return outcome;
}

/**
 * outbox flush. ready 인 본인 큐만, due 항목을 FIFO 로. 성공/중복 → 제거, 영구 실패 → 제거,
 * 네트워크/5xx → attempts++·backoff. 계정이 바뀌면 즉시 중단. single-flight 는 호출부 책임.
 */
export async function flushRewardOutbox(deps: ClaimDeps): Promise<{ sent: number; queued: number }> {
  const scope = scopeOf(deps);
  if (!scope || !deps.online) return { sent: 0, queued: readOutbox(deps.storage, scope?.uid ?? "").length };
  const uid = scope.uid;
  const items = dueRewards(readOutbox(deps.storage, uid), deps.now);
  let sent = 0;
  for (const item of items) {
    if (scopeOf(deps)?.uid !== uid) break; // 계정 전환 → 중단
    const outcome = await sendClaim(deps, uid, { rewardType: item.rewardType, operationId: item.operationId, kind: item.kind, sourceId: item.sourceId });
    if (outcome.status === "applied" || outcome.status === "duplicate") { removeReward(deps.storage, uid, item.operationId); sent += 1; }
    else if (outcome.status === "rejected") { recordFailure(deps.storage, uid, item.operationId, "permanent", deps.now); }
    else if (outcome.status === "queued") { recordFailure(deps.storage, uid, item.operationId, "retryable", deps.now); }
    // skipped(identity_changed) → 그대로 두고 다음 기회에
  }
  return { sent, queued: readOutbox(deps.storage, uid).length };
}

/** 실제 앱 transport — POST /api/claim-reward. (엣지 엔드포인트, EDGE RUNTIME E2E: NOT VERIFIED) */
export function createFetchTransport(path = "/api/claim-reward"): ClaimTransport {
  return async (body, idToken) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    let json: ClaimServerResult = { ok: false };
    try { json = (await res.json()) as ClaimServerResult; } catch { /* 비 JSON */ }
    return { status: res.status, json };
  };
}

export type { RewardOutboxItem };
