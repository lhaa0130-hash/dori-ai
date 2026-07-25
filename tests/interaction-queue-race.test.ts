import assert from "node:assert/strict";
import test from "node:test";
import { createMemoryStorage, flushQueuedState, readQueuedState, writeQueuedState, hasQueuedState, queueKey } from "../lib/myWorld/interaction/storage.ts";
import { defaultInteractionState } from "../lib/myWorld/interaction/engine.ts";
import type { InteractionState } from "../lib/myWorld/interaction/types.ts";

const AT = new Date(2026, 6, 25, 10).getTime();
const UID = "uid-1";
const stateWith = (affinity: number, at = AT): InteractionState => ({ ...defaultInteractionState(AT), affinity, lastInteraction: at });

test("flush clears the queue when nothing changed during persist", async () => {
  const storage = createMemoryStorage();
  writeQueuedState(storage, UID, stateWith(3));
  const sent: number[] = [];
  const r = await flushQueuedState(storage, UID, async (s) => { sent.push(s.affinity); });
  assert.equal(r.flushed?.affinity, 3);
  assert.equal(r.superseded, false);
  assert.equal(hasQueuedState(storage, UID), false, "변화 없으면 큐 삭제");
  assert.deepEqual(sent, [3]);
});

test("flush KEEPS a queue that a new interaction wrote during persist (§12 compare-and-delete)", async () => {
  const storage = createMemoryStorage();
  writeQueuedState(storage, UID, stateWith(3, AT));

  // persist 진행 중(=서버 전송 중)에 새 interaction B 가 큐에 기록되는 상황을 재현.
  const r = await flushQueuedState(storage, UID, async () => {
    writeQueuedState(storage, UID, stateWith(4, AT + 1000)); // B 도착
  });

  assert.equal(r.flushed?.affinity, 3, "A 는 전송됨");
  assert.equal(r.superseded, true, "지문 불일치 → superseded");
  assert.equal(hasQueuedState(storage, UID), true, "B 가 유실되지 않아야 한다");
  assert.equal(readQueuedState(storage, UID)?.affinity, 4, "B 가 큐에 그대로 남음");
});

test("failed persist keeps the queue for retry", async () => {
  const storage = createMemoryStorage();
  writeQueuedState(storage, UID, stateWith(5));
  const r = await flushQueuedState(storage, UID, async () => { throw new Error("offline"); });
  assert.equal(r.flushed, null);
  assert.equal(r.kept, true);
  assert.equal(readQueuedState(storage, UID)?.affinity, 5);
});

test("an empty queue is a no-op", async () => {
  const storage = createMemoryStorage();
  let called = 0;
  const r = await flushQueuedState(storage, UID, async () => { called += 1; });
  assert.equal(r.flushed, null);
  assert.equal(r.superseded, false);
  assert.equal(called, 0);
});

test("repeated flush eventually drains a queue that keeps being superseded, then stops", async () => {
  // flushInteractionQueue 의 루프 시맨틱을 storage 계층에서 재현: superseded 이면 이어서 flush.
  const storage = createMemoryStorage();
  writeQueuedState(storage, UID, stateWith(1, AT));
  const arrivals = [2, 3]; // 전송 중 매번 새 interaction 도착 → 2회 후 멈춤
  const sent: number[] = [];
  for (let i = 0; i < 5; i += 1) {
    const r = await flushQueuedState(storage, UID, async (s) => {
      sent.push(s.affinity);
      const next = arrivals.shift();
      if (next !== undefined) writeQueuedState(storage, UID, stateWith(next, AT + next * 1000));
    });
    if (!r.superseded) break;
  }
  assert.deepEqual(sent, [1, 2, 3], "1→2→3 순서로 최신까지 전송");
  assert.equal(hasQueuedState(storage, UID), false, "최종적으로 큐가 비워짐");
});

test("a corrupted queue value does not crash flush", async () => {
  const storage = createMemoryStorage({ [queueKey(UID)]: "{not json" });
  const r = await flushQueuedState(storage, UID, async () => { throw new Error("must not be called"); });
  assert.equal(r.flushed, null);
  assert.equal(r.superseded, false);
});
