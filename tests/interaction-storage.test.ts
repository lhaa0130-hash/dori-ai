import assert from "node:assert/strict";
import test from "node:test";
import {
  clearQueuedState,
  createMemoryStorage,
  flushQueuedState,
  hasQueuedState,
  normalizeInteractionState,
  readCachedState,
  readQueuedState,
  resolveSyncState,
  writeCachedState,
  writeQueuedState,
  queueKey,
} from "../lib/myWorld/interaction/storage.ts";
import { defaultInteractionState } from "../lib/myWorld/interaction/engine.ts";
import type { InteractionState } from "../lib/myWorld/interaction/types.ts";

const AT = new Date(2026, 6, 24, 10).getTime();
const UID = "uid-1";

function stateAt(overrides: Partial<InteractionState> = {}): InteractionState {
  return { ...defaultInteractionState(AT), ...overrides };
}

test("normalizes missing, null and undefined payloads to a safe default", () => {
  for (const raw of [null, undefined, "nope", 42, true]) {
    const normalized = normalizeInteractionState(raw, AT);
    assert.equal(normalized.affinity, 0);
    assert.equal(normalized.emotion, "normal");
    assert.deepEqual(normalized.recent, []);
    assert.equal(normalized.lastInteraction, null);
  }
});

test("clamps out-of-range affinity and rejects invalid emotion/cooldown values", () => {
  const normalized = normalizeInteractionState({
    affinity: 9_999,
    emotion: "ecstatic",
    cooldowns: { pet: "soon", gift: Number.NaN, touch: AT + 5_000 },
    lastInteraction: "yesterday",
  }, AT);
  assert.equal(normalized.affinity, 100);
  assert.equal(normalized.emotion, "normal");
  assert.equal(normalized.lastInteraction, null);
  assert.equal(normalized.cooldowns.pet, undefined);
  assert.equal(normalized.cooldowns.gift, undefined);
  assert.equal(normalized.cooldowns.touch, AT + 5_000);

  assert.equal(normalizeInteractionState({ affinity: -50 }, AT).affinity, 0);
});

test("drops corrupt recent events, de-duplicates ids and enforces the recent cap", () => {
  const valid = (id: string, at: number) => ({
    id, type: "touch", source: "pointer", characterId: "dori", at,
    emotion: "happy", animation: "bounce", speech: "hi", affinityDelta: 1, expDelta: 1, metadata: {},
  });
  const raw = {
    recent: [
      null,
      "garbage",
      { id: "no-type", characterId: "dori" },
      { ...valid("dup", AT), type: "not-a-type" },
      valid("dup", AT),
      valid("dup", AT - 10),          // 중복 id → 1개만
      ...Array.from({ length: 40 }, (_, i) => valid(`e${i}`, AT - i * 10)),
    ],
  };
  const normalized = normalizeInteractionState(raw, AT);
  assert.equal(normalized.recent.length, 24);                       // INTERACTION_RECENT_LIMIT
  assert.equal(new Set(normalized.recent.map((e) => e.id)).size, 24); // 중복 없음
  for (let i = 1; i < normalized.recent.length; i += 1) {
    assert.ok(normalized.recent[i - 1].at >= normalized.recent[i].at); // 최신순
  }
});

test("lazy-migrates older payloads to the current version and resets a stale daily bucket", () => {
  const normalized = normalizeInteractionState({
    version: 0,
    affinity: 30,
    daily: { date: "2020-01-01", count: 9, affinityGained: 20, expGained: 40, notableTypes: ["pet"] },
  }, AT);
  assert.equal(normalized.version, 1);
  assert.equal(normalized.affinity, 30);
  assert.equal(normalized.daily.date, "2026-07-24");
  assert.equal(normalized.daily.count, 0);
  assert.equal(normalized.daily.affinityGained, 0);
  assert.equal(normalized.daily.expGained, 0);
});

test("writes and reads cache and queue through the storage adapter", () => {
  const storage = createMemoryStorage();
  const state = stateAt({ affinity: 12, lastInteraction: AT });
  writeCachedState(storage, UID, state);
  writeQueuedState(storage, UID, state);

  assert.equal(readCachedState(storage, UID)?.affinity, 12);
  assert.equal(readQueuedState(storage, UID)?.affinity, 12);
  assert.equal(hasQueuedState(storage, UID), true);

  clearQueuedState(storage, UID);
  assert.equal(hasQueuedState(storage, UID), false);
  assert.equal(readQueuedState(storage, UID), null);
  assert.equal(readCachedState(storage, UID)?.affinity, 12); // 캐시는 유지
});

test("queue keeps only the latest offline state across repeated interactions", () => {
  const storage = createMemoryStorage();
  writeQueuedState(storage, UID, stateAt({ affinity: 3, lastInteraction: AT }));
  writeQueuedState(storage, UID, stateAt({ affinity: 7, lastInteraction: AT + 1_000 }));
  writeQueuedState(storage, UID, stateAt({ affinity: 9, lastInteraction: AT + 2_000 }));

  const queued = readQueuedState(storage, UID);
  assert.equal(queued?.affinity, 9);
  assert.equal(queued?.lastInteraction, AT + 2_000);
});

test("flush clears the queue on success and keeps it on failure", async () => {
  const storage = createMemoryStorage();
  writeQueuedState(storage, UID, stateAt({ affinity: 5, lastInteraction: AT }));

  const failure = await flushQueuedState(storage, UID, async () => { throw new Error("offline"); });
  assert.equal(failure.flushed, null);
  assert.equal(failure.kept, true);
  assert.equal(hasQueuedState(storage, UID), true); // 재시도 가능하도록 유지

  const sent: InteractionState[] = [];
  const success = await flushQueuedState(storage, UID, async (s) => { sent.push(s); });
  assert.equal(success.flushed?.affinity, 5);
  assert.equal(success.kept, false);
  assert.equal(sent.length, 1);
  assert.equal(hasQueuedState(storage, UID), false); // 성공 후 큐 삭제

  const empty = await flushQueuedState(storage, UID, async () => { throw new Error("must not run"); });
  assert.equal(empty.flushed, null);
  assert.equal(empty.kept, false);
});

test("defends against corrupted queue/cache payloads", () => {
  const storage = createMemoryStorage({ [queueKey(UID)]: "{not json" });
  assert.equal(readQueuedState(storage, UID), null);
  assert.equal(hasQueuedState(storage, UID), true); // 값은 존재하지만 파싱 실패 시 안전하게 null

  const partial = createMemoryStorage({ [queueKey(UID)]: JSON.stringify({ affinity: 500, recent: "x" }) });
  const recovered = readQueuedState(partial, UID);
  assert.equal(recovered?.affinity, 100);
  assert.deepEqual(recovered?.recent, []);
});

test("serialized state contains no undefined values (Firestore rejects them)", () => {
  // 회귀 방지: roomItemId 가 없는 상호작용(터치/쓰다듬기 등)에서 undefined 키가 남으면
  // setDoc 이 invalid-argument 로 실패하고, 저장이 조용히 오프라인 큐로 밀린다.
  const withoutRoomItem = {
    id: "e1", type: "pet", source: "pointer", characterId: "dori", at: AT,
    emotion: "love", animation: "pet", speech: "hi", affinityDelta: 2, expDelta: 2, metadata: {},
  };
  const withRoomItem = { ...withoutRoomItem, id: "e2", type: "room_item", roomItemId: "bed-basic" };
  const state = normalizeInteractionState({ recent: [withoutRoomItem, withRoomItem] }, AT);

  const plain = state.recent.find((e) => e.id === "e1")!;
  assert.equal("roomItemId" in plain, false, "roomItemId 키 자체가 없어야 한다");
  assert.equal(state.recent.find((e) => e.id === "e2")!.roomItemId, "bed-basic");

  const walk = (value: unknown, path = "$"): void => {
    assert.notEqual(value, undefined, `undefined 발견: ${path}`);
    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(v, `${path}.${k}`);
    }
  };
  walk(JSON.parse(JSON.stringify(state)));
  for (const event of state.recent) {
    for (const [k, v] of Object.entries(event)) assert.notEqual(v, undefined, `recent.${k} 가 undefined`);
  }
});

test("keeps local state when it is newer and adopts the server state otherwise", () => {
  const local = stateAt({ affinity: 20, lastInteraction: AT + 5_000 });
  const remote = stateAt({ affinity: 8, lastInteraction: AT });

  const localWins = resolveSyncState(local, remote);
  assert.equal(localWins.localIsNewer, true);
  assert.equal(localWins.chosen.affinity, 20);

  const serverWins = resolveSyncState(stateAt({ affinity: 2, lastInteraction: AT }), stateAt({ affinity: 40, lastInteraction: AT + 9_000 }));
  assert.equal(serverWins.localIsNewer, false);
  assert.equal(serverWins.chosen.affinity, 40);

  const noLocal = resolveSyncState(null, remote);
  assert.equal(noLocal.localIsNewer, false);
  assert.equal(noLocal.chosen.affinity, 8);

  // 동점이면 서버를 채택한다(로컬이 "더" 최신일 때만 보호).
  const tie = resolveSyncState(stateAt({ affinity: 1, lastInteraction: AT }), stateAt({ affinity: 2, lastInteraction: AT }));
  assert.equal(tie.chosen.affinity, 2);
});

test("storage helpers no-op safely when storage is unavailable", () => {
  assert.equal(readCachedState(null, UID), null);
  assert.equal(readQueuedState(null, UID), null);
  assert.equal(hasQueuedState(null, UID), false);
  writeCachedState(null, UID, stateAt());   // throw 하지 않아야 한다
  writeQueuedState(null, UID, stateAt());
  clearQueuedState(null, UID);
});
