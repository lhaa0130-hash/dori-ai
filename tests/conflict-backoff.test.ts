// 트랜잭션 충돌 재시도 백오프 (05-09 감사 P2 수정) 계약 테스트.
// 감사 계량: 백오프 없이 즉시 재시도 → 동시 3건 중 1건만 성공(2건 409).
//   데이터는 안전했지만(원장↔잔액 정합) 정당한 작업이 함께 실패했다.
import test from "node:test";
import assert from "node:assert/strict";
import { conflictBackoffMs, waitBeforeRetry } from "../functions/_shared/firestoreRest.ts";

test("attempt 가 커질수록 기본 대기가 늘어난다(지수)", () => {
  // rand 를 고정해 지터를 제거하고 기저값만 본다
  const a0 = conflictBackoffMs(0, 0.5);
  const a1 = conflictBackoffMs(1, 0.5);
  const a2 = conflictBackoffMs(2, 0.5);
  assert.ok(a0 < a1, `${a0} < ${a1}`);
  assert.ok(a1 < a2, `${a1} < ${a2}`);
});

test("상한이 있다 — 어떤 attempt 도 300ms 를 넘지 않는다", () => {
  // ⚠️ Cloudflare Pages Function 응답 지연 예산을 지키기 위한 계약.
  for (let i = 0; i < 20; i++) {
    for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
      assert.ok(conflictBackoffMs(i, r) <= 300, `attempt=${i} rand=${r} → ${conflictBackoffMs(i, r)}`);
    }
  }
});

test("항상 0 이상이고 정수다", () => {
  for (let i = 0; i < 5; i++) {
    for (const r of [0, 0.5, 1]) {
      const v = conflictBackoffMs(i, r);
      assert.ok(Number.isInteger(v) && v >= 0, `${v}`);
    }
  }
});

test("지터가 실제로 값을 흩는다(같은 attempt 라도 rand 에 따라 다름)", () => {
  // 지터가 없으면 동시 요청들이 같은 시점에 재시도해 서로를 계속 밀어낸다(livelock).
  const lo = conflictBackoffMs(1, 0);
  const hi = conflictBackoffMs(1, 1);
  assert.ok(hi > lo, `지터 폭 없음: ${lo} == ${hi}`);
  assert.ok(hi >= lo * 2, `지터 폭이 너무 좁다: ${lo}~${hi}`);
});

test("waitBeforeRetry 는 주입한 sleep 을 정확히 1회 호출한다", async () => {
  const calls: number[] = [];
  await waitBeforeRetry(0, async (ms) => { calls.push(ms); });
  assert.equal(calls.length, 1);
  assert.ok(calls[0] >= 0 && calls[0] <= 300);
});

test("여러 attempt 를 이어 붙여도 총 대기가 1초를 넘지 않는다", async () => {
  // 재시도 3회 루프 전체가 사용자 체감 지연을 크게 늘리면 안 된다.
  let total = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    await waitBeforeRetry(attempt, async (ms) => { total += ms; });
  }
  assert.ok(total <= 1000, `총 대기 ${total}ms`);
});
