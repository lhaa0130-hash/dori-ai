// 브라우저 게임 보상 브리지 (05-06H). 흩어져 있던 클라이언트 EXP 쓰기를 대체한다.
//  · 어느 컴포넌트/lib 에서든 fire-and-forget 로 서버 청구를 발행한다.
//  · 클라이언트는 rewardType + operationId(+sourceId) 만 보낸다 — 금액·EXP·uid·email 전송 금지.
//  · 온라인이면 POST /api/claim-reward, 오프라인/실패면 UID-namespaced outbox 적재(operationId 멱등).
//  · 서버 응답으로만 캐시를 재동기화(hydrateGameData) → Hero/헤더의 EXP·레벨·티어 갱신.
//  · localStorage 를 조작해도 서버 EXP 에 영향이 없다(서버가 최종 권위, 금액·상한·멱등 모두 서버 소유).
// ⚠️ cottonCandy 와의 정적 순환 import 를 피하려 hydrateGameData 는 동적 import 로 부른다.
import { getFirebaseAuth } from "@/lib/firebase";
import {
  activityOperationId, claimReward, createFetchTransport, sourceOperationId,
  type ClaimDeps, type ClaimIntent,
} from "@/lib/rewardClient";
import { resolveMyWorldIdentity } from "@/lib/myWorld/identity";
import type { AllowedRewardType } from "@/lib/myWorld/rewardOutbox";

/** my_world_interaction 을 제외한, 이 브리지가 발행하는 게임 보상 타입. */
export type GameRewardType = Exclude<AllowedRewardType, "my_world_interaction">;

type ClaimTransportRef = ReturnType<typeof createFetchTransport>;
let sharedTransport: ClaimTransportRef | null = null;
function transport(): ClaimTransportRef {
  if (!sharedTransport) sharedTransport = createFetchTransport();
  return sharedTransport;
}

function currentUser(): { uid: string; email: string | null } | null {
  try { const c = getFirebaseAuth().currentUser; return c ? { uid: c.uid, email: c.email } : null; } catch { return null; }
}

function buildDeps(): ClaimDeps {
  const cu = currentUser();
  return {
    // Identity Gate: currentUser 가 있으면 authenticated. Firestore 문서 ID 기준은 Firebase UID.
    identity: resolveMyWorldIdentity({ authStatus: cu ? "authenticated" : "unauthenticated", firebaseUid: cu?.uid ?? null }),
    currentUser: cu,
    getIdToken: async () => { try { return (await getFirebaseAuth().currentUser?.getIdToken()) ?? null; } catch { return null; } },
    transport: transport(),
    storage: typeof window !== "undefined" ? window.localStorage : null,
    online: typeof navigator === "undefined" || navigator.onLine,
    now: Date.now(),
    // 서버 결과로만 캐시 갱신: ①응답 값을 즉시 반영(권위) ②이어서 hydrate 로 나머지 필드 동기화.
    //  동적 import 로 cottonCandy 와의 순환 방지.
    //  ⚠️ 순서 주의: hydrate(Firestore 재조회)는 방금 커밋과 경합해 옛 EXP 를 읽을 수 있다.
    //     따라서 hydrate 를 먼저 돌리고(솜사탕 등 갱신), '마지막에' 응답 값으로 EXP 를 확정한다.
    onApplied: (result) => {
      void import("@/lib/cottonCandy").then(async (m) => {
        try { await m.hydrateGameData(); } catch { /* 무시 */ }
        m.applyServerRewardResult(result);      // doriExp/level/tier = 서버 응답(권위)로 확정
      }).catch(() => {});
    },
  };
}

/**
 * 게임 보상 청구(fire-and-forget). 비로그인/ready 아님 → 조용히 스킵.
 *  · source 필요 타입(community_post/community_comment/mission_complete/minigame_play): sourceId 필수 →
 *    operationId = {prefix}_{sourceId} 라 같은 글/댓글/미션/게임은 하루 안에서 자연 멱등.
 *  · game_activity: seed 로 안정 operationId(act_).
 * 어떤 경우에도 UI 흐름을 막지 않는다(throw 없음).
 */
export function submitGameReward(
  rewardType: GameRewardType,
  opts: { sourceId?: string; seed?: string; kind?: string } = {},
): void {
  try {
    let operationId: string;
    let sourceId: string | undefined;
    if (rewardType === "game_activity") {
      operationId = activityOperationId(opts.seed || opts.sourceId || "activity");
    } else {
      if (!opts.sourceId) return; // source 필수 타입인데 없음 → 서버도 거부하므로 발행하지 않음
      sourceId = opts.sourceId;
      operationId = sourceOperationId(rewardType, opts.sourceId);
    }
    const intent: ClaimIntent = {
      rewardType, operationId,
      ...(sourceId ? { sourceId } : {}),
      ...(opts.kind ? { kind: opts.kind } : {}),
    };
    void claimReward(buildDeps(), intent).catch(() => {});
  } catch { /* fire-and-forget */ }
}
