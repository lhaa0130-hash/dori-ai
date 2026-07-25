import assert from "node:assert/strict";
import test from "node:test";
import {
  MY_WORLD_DAILY_EXP_CAP,
  applyRewardOperation,
  computeInteractionExp,
  isInteractionKind,
  isKnownRewardType,
  isValidOperationId,
  sanitizeInteractionRewardRequest,
} from "../functions/_shared/rewardPolicy.ts";

test("operationId format is strictly validated", () => {
  assert.equal(isValidOperationId("mwi_abcdefgh"), true);
  assert.equal(isValidOperationId("mwi_" + "a".repeat(120)), true);
  assert.equal(isValidOperationId("mwi_short"), false);       // < 8 tail? "short"=5 → invalid
  assert.equal(isValidOperationId("nope_abcdefgh"), false);   // 잘못된 접두
  assert.equal(isValidOperationId("mwi_bad space!!"), false);
  assert.equal(isValidOperationId(""), false);
  assert.equal(isValidOperationId(123 as unknown), false);
});

test("interaction kind allowlist", () => {
  for (const k of ["touch", "pet", "gift", "greet", "sleep", "room_item", "double_tap", "long_press"]) {
    assert.equal(isInteractionKind(k), true);
  }
  assert.equal(isInteractionKind("hack"), false);
  assert.equal(isInteractionKind("idle"), false); // idle 은 보상 대상 아님
  assert.equal(isKnownRewardType("my_world_interaction"), true);
  assert.equal(isKnownRewardType("daily_attendance"), true);
  assert.equal(isKnownRewardType("free_money"), false);
});

test("server owns the xp table and enforces the daily cap", () => {
  assert.equal(computeInteractionExp("gift", 0), 5);
  assert.equal(computeInteractionExp("pet", 0), 2);
  assert.equal(computeInteractionExp("gift", MY_WORLD_DAILY_EXP_CAP - 3), 3, "상한 근처면 남은 만큼만");
  assert.equal(computeInteractionExp("gift", MY_WORLD_DAILY_EXP_CAP), 0, "상한 도달 시 0");
  assert.equal(computeInteractionExp("gift", 9999), 0);
  assert.equal(computeInteractionExp("gift", -5 as number), 5, "손상된 dailyEarned 방어");
});

test("request sanitizer rejects any client-supplied authority value", () => {
  const ok = sanitizeInteractionRewardRequest({ rewardType: "my_world_interaction", operationId: "mwi_abcdefgh", kind: "pet" });
  assert.deepEqual(ok, { ok: true, operationId: "mwi_abcdefgh", kind: "pet" });

  for (const bad of ["amount", "xp", "doriExp", "exp", "uid", "email", "level", "tier", "cottonCandy", "affinity"]) {
    const r = sanitizeInteractionRewardRequest({ rewardType: "my_world_interaction", operationId: "mwi_abcdefgh", kind: "pet", [bad]: 999 });
    assert.equal(r.ok, false, `${bad} 필드는 거부되어야 한다`);
  }
  assert.equal(sanitizeInteractionRewardRequest({ rewardType: "my_world_interaction", operationId: "mwi_abcdefgh", kind: "hack" }).ok, false);
  assert.equal(sanitizeInteractionRewardRequest({ rewardType: "my_world_interaction", operationId: "bad", kind: "pet" }).ok, false);
  assert.equal(sanitizeInteractionRewardRequest({ rewardType: "daily_attendance", operationId: "mwi_abcdefgh", kind: "pet" }).ok, false);
  assert.equal(sanitizeInteractionRewardRequest({ rewardType: "my_world_interaction", operationId: "mwi_abcdefgh", kind: "pet", weird: 1 }).ok, false);
});

test("applyRewardOperation is server-exp based and ignores any client cache value", () => {
  // 서버 exp=10. 클라이언트가 무엇을 캐시에 넣든 여기 입력에는 서버 값만 온다.
  const r = applyRewardOperation({ operationId: "mwi_abcdefgh", kind: "gift", serverExp: 10, dailyExpEarned: 0, ledgerRecord: null });
  assert.equal(r.alreadyProcessed, false);
  assert.equal(r.awardedExp, 5);
  assert.equal(r.resultingExp, 15, "서버 exp(10) + 지급(5)");
  assert.equal(r.newDailyExpEarned, 5);
  assert.ok(r.level >= 1 && r.tier >= 1);
});

test("applyRewardOperation is idempotent when the operation is already in the ledger", () => {
  const first = applyRewardOperation({ operationId: "mwi_abcdefgh", kind: "gift", serverExp: 10, dailyExpEarned: 0, ledgerRecord: null });
  // 같은 operationId 재요청 — ledger 에 이미 기록됨 → 추가 지급 없음, 저장된 결과 반환.
  const replay = applyRewardOperation({
    operationId: "mwi_abcdefgh", kind: "gift", serverExp: 15, dailyExpEarned: 5,
    ledgerRecord: { awardedExp: first.awardedExp, resultingExp: first.resultingExp },
  });
  assert.equal(replay.alreadyProcessed, true);
  assert.equal(replay.awardedExp, 5);
  assert.equal(replay.resultingExp, 15, "재지급 없이 원래 결과");
});

test("daily cap prevents unlimited operationIds from farming EXP", () => {
  let daily = 0, exp = 0, ops = 0;
  // 서로 다른 operationId 를 무한히 만들어도 서버 일일 상한에서 멈춘다.
  for (let i = 0; i < 100; i += 1) {
    const r = applyRewardOperation({ operationId: `mwi_op${String(i).padStart(6, "0")}`, kind: "gift", serverExp: exp, dailyExpEarned: daily, ledgerRecord: null });
    exp = r.resultingExp; daily = r.newDailyExpEarned; if (r.awardedExp > 0) ops += 1; else break;
  }
  assert.equal(daily, MY_WORLD_DAILY_EXP_CAP, "일일 상한에서 정확히 멈춤");
  assert.equal(exp, MY_WORLD_DAILY_EXP_CAP);
  assert.ok(ops <= 8);
});
