import assert from "node:assert/strict";
import test from "node:test";
import {
  REWARD_OUTBOX_MAX, REWARD_OUTBOX_MAX_ATTEMPTS,
  backoffDelay, classifyClaimFailure, dueRewards, enqueueReward, readOutbox,
  recordFailure, removeReward, rewardOutboxKey,
} from "../lib/myWorld/rewardOutbox.ts";
import { createMemoryStorage } from "../lib/myWorld/interaction/storage.ts";

const UID_A = "uid-a", UID_B = "uid-b";
const op = (n: number) => `mwi_op${String(n).padStart(6, "0")}`;
const intent = (n: number, kind = "pet") => ({ operationId: op(n), rewardType: "my_world_interaction" as const, kind, createdAt: n });

test("enqueue stores intent under a UID namespace with no PII", () => {
  const s = createMemoryStorage();
  enqueueReward(s, UID_A, intent(1));
  const key = rewardOutboxKey(UID_A);
  assert.match(key, /^myworld_reward_outbox_uid_uid-a$/);
  assert.equal(key.includes("@"), false);
  const raw = s.getItem(key)!;
  for (const bad of ["amount", "exp", "email", "token", "level", "tier"]) assert.equal(raw.includes(`"${bad}"`), false);
});

test("enqueue is idempotent by operationId", () => {
  const s = createMemoryStorage();
  enqueueReward(s, UID_A, intent(1));
  enqueueReward(s, UID_A, intent(1));
  enqueueReward(s, UID_A, intent(1));
  assert.equal(readOutbox(s, UID_A).length, 1);
});

test("outbox items are isolated per uid", () => {
  const s = createMemoryStorage();
  enqueueReward(s, UID_A, intent(1));
  enqueueReward(s, UID_B, intent(2));
  assert.deepEqual(readOutbox(s, UID_A).map((i) => i.operationId), [op(1)]);
  assert.deepEqual(readOutbox(s, UID_B).map((i) => i.operationId), [op(2)]);
});

test("read normalizes away malformed and forbidden-field items", () => {
  const s = createMemoryStorage();
  s.setItem(rewardOutboxKey(UID_A), JSON.stringify([
    intent(1),
    { operationId: "bad id", rewardType: "my_world_interaction" },       // 잘못된 opId
    { operationId: op(2), rewardType: "free_money" },                    // 잘못된 타입
    { operationId: op(3), rewardType: "my_world_interaction", amount: 999 }, // 금지 필드
    { operationId: op(4), rewardType: "my_world_interaction", doriExp: 5 },  // 금지 필드
    "garbage",
    intent(1), // 중복
  ]));
  const items = readOutbox(s, UID_A);
  assert.deepEqual(items.map((i) => i.operationId), [op(1)]);
});

test("read enforces FIFO order and a max size", () => {
  const s = createMemoryStorage();
  for (let i = 60; i >= 1; i -= 1) enqueueReward(s, UID_A, intent(i));
  const items = readOutbox(s, UID_A);
  assert.equal(items.length, REWARD_OUTBOX_MAX);
  for (let i = 1; i < items.length; i += 1) assert.ok(items[i - 1].createdAt <= items[i].createdAt, "FIFO");
});

test("removeReward deletes only the given operation (compare-and-delete)", () => {
  const s = createMemoryStorage();
  enqueueReward(s, UID_A, intent(1));
  enqueueReward(s, UID_A, intent(2));
  removeReward(s, UID_A, op(1));
  assert.deepEqual(readOutbox(s, UID_A).map((i) => i.operationId), [op(2)]);
});

test("permanent failures are dropped; retryable failures back off then drop after the cap", () => {
  const s = createMemoryStorage();
  enqueueReward(s, UID_A, intent(1));

  // 401/403/400 = 영구 실패 → 즉시 제거(무한 재시도 금지)
  recordFailure(s, UID_A, op(1), classifyClaimFailure(403), 1000);
  assert.equal(readOutbox(s, UID_A).length, 0);

  // 재시도 가능(네트워크/5xx): attempts 증가 + backoff, 상한 초과 시 폐기
  enqueueReward(s, UID_A, intent(2));
  let now = 1000;
  for (let i = 0; i < REWARD_OUTBOX_MAX_ATTEMPTS; i += 1) {
    recordFailure(s, UID_A, op(2), classifyClaimFailure(503), now);
    now += 10 * 60_000;
  }
  assert.equal(readOutbox(s, UID_A).length, 0, "재시도 상한 초과 후 폐기");
});

test("failure classification: only policy/validation is permanent; 404/401 stay retryable (§12)", () => {
  for (const s of [400, 403, 422]) assert.equal(classifyClaimFailure(s), "permanent");
  // 404(endpoint 미배포/라우팅) 를 영구로 처리하면 보상이 조용히 사라진다 → retryable.
  for (const s of [0, 401, 404, 409, 429, 500, 502, 503]) assert.equal(classifyClaimFailure(s), "retryable");
});

test("backoff grows exponentially and is capped", () => {
  assert.ok(backoffDelay(0) < backoffDelay(1));
  assert.ok(backoffDelay(1) < backoffDelay(3));
  assert.equal(backoffDelay(100), backoffDelay(50)); // cap
  assert.ok(backoffDelay(100) <= 5 * 60_000);
});

test("dueRewards respects nextAttemptAt", () => {
  const s = createMemoryStorage();
  enqueueReward(s, UID_A, intent(1));
  enqueueReward(s, UID_A, intent(2));
  recordFailure(s, UID_A, op(2), "retryable", 1000); // op2 는 backoff 걸림
  const items = readOutbox(s, UID_A);
  assert.deepEqual(dueRewards(items, 1000).map((i) => i.operationId), [op(1)], "backoff 안 지난 op2 는 제외");
  assert.equal(dueRewards(items, 1000 + 10 * 60_000).length, 2);
});

test("storage-less environments are safe no-ops", () => {
  assert.deepEqual(readOutbox(null, UID_A), []);
  assert.deepEqual(enqueueReward(null, UID_A, intent(1)), []);
  assert.deepEqual(removeReward(null, UID_A, op(1)), []);
});
