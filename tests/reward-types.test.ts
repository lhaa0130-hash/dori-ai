import assert from "node:assert/strict";
import test from "node:test";
import {
  EXTENDED_REWARD_POLICIES, computeExtendedExp, isExtendedRewardType, isValidExtendedOperationId,
  operationIdFor, sanitizeExtendedRewardRequest,
} from "../functions/_shared/rewardTypes.ts";

test("extended reward types are allowlisted", () => {
  for (const t of ["community_post", "community_comment", "mission_complete", "minigame_play", "game_activity"]) {
    assert.equal(isExtendedRewardType(t), true);
  }
  assert.equal(isExtendedRewardType("free_money"), false);
  assert.equal(isExtendedRewardType("my_world_interaction"), false); // 별도 처리
});

test("operationId for source-required types binds to the sourceId (no forgery)", () => {
  const post = EXTENDED_REWARD_POLICIES.community_post;
  assert.equal(operationIdFor(post, "abc123"), "post_abc123");
  // 올바른 operationId
  assert.equal(isValidExtendedOperationId(post, "post_abc123", "abc123"), true);
  // operationId 만 바꿔 같은 source 를 재청구 시도 → 거부(operationId != prefix+sourceId)
  assert.equal(isValidExtendedOperationId(post, "post_DIFFERENT", "abc123"), false);
  // sourceId 없이 → 거부
  assert.equal(isValidExtendedOperationId(post, "post_abc123", undefined), false);
  // 잘못된 prefix → 거부
  assert.equal(isValidExtendedOperationId(post, "comment_abc123", "abc123"), false);
});

test("game_activity has no required source and validates by prefix only", () => {
  const act = EXTENDED_REWARD_POLICIES.game_activity;
  assert.equal(act.requiresSource, false);
  assert.equal(isValidExtendedOperationId(act, "act_random123abc"), true);
  assert.equal(isValidExtendedOperationId(act, "post_random"), false);
});

test("sanitize rejects client-supplied authority values", () => {
  const ok = sanitizeExtendedRewardRequest({ rewardType: "community_comment", operationId: "comment_c1", sourceId: "c1" });
  assert.equal(ok.ok, true);
  if (ok.ok) { assert.equal(ok.policy.rewardType, "community_comment"); assert.equal(ok.sourceId, "c1"); }

  for (const bad of ["amount", "exp", "doriExp", "uid", "email", "level", "tier", "finalExp"]) {
    assert.equal(sanitizeExtendedRewardRequest({ rewardType: "community_comment", operationId: "comment_c1", sourceId: "c1", [bad]: 9 }).ok, false);
  }
  // gameId/missionId 별칭 허용
  assert.equal(sanitizeExtendedRewardRequest({ rewardType: "minigame_play", operationId: "minigame_snake", gameId: "snake" }).ok, true);
  assert.equal(sanitizeExtendedRewardRequest({ rewardType: "mission_complete", operationId: "mission_m1", missionId: "m1" }).ok, true);
  // source 필요 타입인데 source 없음 → 거부
  assert.equal(sanitizeExtendedRewardRequest({ rewardType: "community_post", operationId: "post_p1" }).ok, false);
  // operationId 가 source 와 불일치 → 거부(위조)
  assert.equal(sanitizeExtendedRewardRequest({ rewardType: "community_post", operationId: "post_OTHER", sourceId: "p1" }).ok, false);
  // 알 수 없는 필드
  assert.equal(sanitizeExtendedRewardRequest({ rewardType: "community_post", operationId: "post_p1", sourceId: "p1", weird: 1 }).ok, false);
});

test("server owns amounts and enforces per-type daily caps", () => {
  const comment = EXTENDED_REWARD_POLICIES.community_comment;
  assert.equal(computeExtendedExp(comment, 0), 5);
  assert.equal(computeExtendedExp(comment, comment.dailyExpCap - 3), 3);
  assert.equal(computeExtendedExp(comment, comment.dailyExpCap), 0);
  assert.equal(computeExtendedExp(comment, 9999), 0);
  assert.equal(computeExtendedExp(comment, -5 as number), 5); // 손상 방어

  // 서로 다른 sourceId(무한 operationId)라도 타입 일일 상한에서 멈춘다
  let earned = 0, grants = 0;
  for (let i = 0; i < 100; i += 1) {
    const g = computeExtendedExp(comment, earned);
    if (g === 0) break;
    earned += g; grants += 1;
  }
  assert.equal(earned, comment.dailyExpCap);
  assert.ok(grants <= comment.dailyExpCap / comment.exp);
});
