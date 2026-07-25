import assert from "node:assert/strict";
import test from "node:test";
import { claimReward, deriveOperationId, flushRewardOutbox, type ClaimDeps, type ClaimTransport } from "../lib/rewardClient.ts";
import { resolveMyWorldIdentity } from "../lib/myWorld/identity.ts";
import { enqueueReward, readOutbox } from "../lib/myWorld/rewardOutbox.ts";
import { createMemoryStorage } from "../lib/myWorld/interaction/storage.ts";

const UID_A = "uid-a", UID_B = "uid-b";
const ready = (uid: string) => resolveMyWorldIdentity({ authStatus: "authenticated", firebaseUid: uid });
const op = (n: number) => `mwi_op${String(n).padStart(6, "0")}`;

function deps(over: Partial<ClaimDeps> = {}): ClaimDeps {
  return {
    identity: ready(UID_A),
    currentUser: { uid: UID_A, email: "a@x.com" },
    getIdToken: async () => "tok",
    transport: async () => ({ status: 200, json: { ok: true, awardedExp: 2, doriExp: 12, level: 2, tier: 2 } }),
    storage: createMemoryStorage(),
    online: true,
    now: 1000,
    ...over,
  };
}
const intent = (n: number, kind = "pet") => ({ rewardType: "my_world_interaction" as const, operationId: op(n), kind });

test("operationId derived from an event id is stable and mwi_ formatted", () => {
  const id = deriveOperationId("ix_abc123_5_xyz");
  assert.match(id, /^mwi_[A-Za-z0-9_-]{8,120}$/);
  assert.equal(deriveOperationId("ix_abc123_5_xyz"), id, "동일 event → 동일 operationId");
});

test("a successful claim applies and does not touch the outbox", async () => {
  const applied: unknown[] = [];
  const d = deps({ onApplied: (r) => applied.push(r) });
  const out = await claimReward(d, intent(1));
  assert.equal(out.status, "applied");
  assert.equal(applied.length, 1);
  assert.equal(readOutbox(d.storage, UID_A).length, 0);
});

test("a duplicate response is reported and not re-queued", async () => {
  const d = deps({ transport: async () => ({ status: 200, json: { ok: true, duplicate: true, awardedExp: 0, doriExp: 12 } }) });
  const out = await claimReward(d, intent(1));
  assert.equal(out.status, "duplicate");
  assert.equal(readOutbox(d.storage, UID_A).length, 0);
});

test("offline claims are queued with the same operationId", async () => {
  const d = deps({ online: false });
  const out = await claimReward(d, intent(1));
  assert.equal(out.status, "queued");
  assert.deepEqual(readOutbox(d.storage, UID_A).map((i) => i.operationId), [op(1)]);
});

test("a network failure queues the claim for retry", async () => {
  const d = deps({ transport: async () => { throw new Error("network"); } });
  const out = await claimReward(d, intent(1));
  assert.equal(out.status, "queued");
  assert.equal(readOutbox(d.storage, UID_A).length, 1);
});

test("a 403/permanent failure is rejected and NOT queued", async () => {
  const d = deps({ transport: async () => ({ status: 403, json: { ok: false, error: "forbidden" } }) });
  const out = await claimReward(d, intent(1));
  assert.equal(out.status, "rejected");
  assert.equal(readOutbox(d.storage, UID_A).length, 0, "인증/정책 실패는 무한 재시도하지 않는다");
});

test("a 5xx failure is queued for retry", async () => {
  const d = deps({ transport: async () => ({ status: 503, json: { ok: false, error: "unavailable" } }) });
  assert.equal((await claimReward(d, intent(1))).status, "queued");
  assert.equal(readOutbox(d.storage, UID_A).length, 1);
});

test("a 404 (endpoint not deployed) is queued, NOT silently dropped (§12)", async () => {
  const d = deps({ transport: async () => ({ status: 404, json: { ok: false } }) });
  const out = await claimReward(d, intent(1));
  assert.equal(out.status, "queued", "미배포 엔드포인트 404 는 재시도 대상이어야 한다");
  assert.deepEqual(readOutbox(d.storage, UID_A).map((i) => i.operationId), [op(1)]);
});

test("claims are skipped when identity is not ready or uid mismatches", async () => {
  assert.equal((await claimReward(deps({ identity: resolveMyWorldIdentity({ authStatus: "loading", firebaseUid: UID_A }) }), intent(1))).status, "skipped");
  assert.equal((await claimReward(deps({ identity: resolveMyWorldIdentity({ authStatus: "unauthenticated", firebaseUid: null }), currentUser: null }), intent(1))).status, "skipped");
  // currentUser 가 B 인데 identity 가 A → 스코프 없음 → skip
  assert.equal((await claimReward(deps({ currentUser: { uid: UID_B, email: "b@x.com" } }), intent(1))).status, "skipped");
});

test("a response arriving after an account switch is not applied", async () => {
  const applied: unknown[] = [];
  // 전송 도중 currentUser 가 B 로 바뀌는 상황(getter 로 실시간 반영). 응답 후 scope 가 B → 반영 안 함.
  let cu: { uid: string; email: string | null } = { uid: UID_A, email: "a@x.com" };
  const d: ClaimDeps = {
    identity: ready(UID_A),
    get currentUser() { return cu; },
    getIdToken: async () => "tok",
    transport: async () => { cu = { uid: UID_B, email: "b@x.com" }; return { status: 200, json: { ok: true, awardedExp: 2, doriExp: 12 } }; },
    storage: createMemoryStorage(),
    online: true,
    now: 1000,
    onApplied: (r) => applied.push(r),
  };
  const out = await claimReward(d, intent(1));
  assert.equal(out.status, "skipped");
  assert.equal(applied.length, 0, "A 요청 응답이 B 상태에 반영되면 안 된다");
});

test("flush sends due items, removes them on success, and stops on account switch", async () => {
  const storage = createMemoryStorage();
  enqueueReward(storage, UID_A, { operationId: op(1), rewardType: "my_world_interaction", kind: "pet", createdAt: 1 });
  enqueueReward(storage, UID_A, { operationId: op(2), rewardType: "my_world_interaction", kind: "gift", createdAt: 2 });

  const sentOps: string[] = [];
  const d = deps({
    storage,
    transport: async (body) => { sentOps.push(String(body.operationId)); return { status: 200, json: { ok: true, awardedExp: 2, doriExp: 12 } }; },
  });
  const r = await flushRewardOutbox(d);
  assert.equal(r.sent, 2);
  assert.equal(readOutbox(storage, UID_A).length, 0, "성공한 항목은 제거");
  assert.deepEqual(sentOps.sort(), [op(1), op(2)]);
});

test("flush never sends user A's queue while user B is active", async () => {
  const storage = createMemoryStorage();
  enqueueReward(storage, UID_A, { operationId: op(1), rewardType: "my_world_interaction", kind: "pet", createdAt: 1 });
  let sent = 0;
  // 현재 활성 사용자 = B. A 의 큐를 flush 시도해도 scope(B) != A → 아무것도 전송 안 함.
  const d = deps({ storage, identity: ready(UID_B), currentUser: { uid: UID_B, email: "b@x.com" }, transport: async () => { sent += 1; return { status: 200, json: { ok: true } }; } });
  const r = await flushRewardOutbox(d);
  assert.equal(sent, 0);
  assert.equal(r.sent, 0);
  assert.equal(readOutbox(storage, UID_A).length, 1, "A 큐는 그대로 유지");
});

test("flush drops permanently-rejected items but keeps retryable ones", async () => {
  const storage = createMemoryStorage();
  enqueueReward(storage, UID_A, { operationId: op(1), rewardType: "my_world_interaction", kind: "pet", createdAt: 1 });
  enqueueReward(storage, UID_A, { operationId: op(2), rewardType: "my_world_interaction", kind: "gift", createdAt: 2 });
  const d = deps({
    storage,
    transport: async (body) => body.operationId === op(1)
      ? { status: 403, json: { ok: false, error: "forbidden" } }
      : { status: 503, json: { ok: false, error: "unavailable" } },
  });
  await flushRewardOutbox(d);
  const remaining = readOutbox(storage, UID_A).map((i) => i.operationId);
  assert.deepEqual(remaining, [op(2)], "op1(영구) 제거, op2(재시도) 유지");
  assert.ok((readOutbox(storage, UID_A)[0].attempts ?? 0) >= 1);
});
