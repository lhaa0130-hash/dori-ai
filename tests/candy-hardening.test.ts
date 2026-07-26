// 05-07B 적대적 감사 — 2차 하드닝 단위 테스트.
//  1차 구현에서 실제로 뚫렸던 경로를 계약 수준에서 고정한다.
import assert from "node:assert/strict";
import test from "node:test";
import {
  sourceDateMatchesServerDay, isKnownSource, computeExtendedCandy, DAILY_CANDY_TOTAL_CAP,
  EXTENDED_REWARD_POLICIES, MISSION_CANDY, ACHIEVEMENT_CANDY, LEVEL_REWARD_CANDY,
  parseMissionSource, levelFromSource,
} from "../functions/_shared/rewardTypes.ts";
import { parseCandyRollout, resolveCandyGate } from "../functions/_shared/candyEnv.ts";

const TODAY = "2026-07-26";

// ── ⭐ 취약점 1: sourceId 안의 날짜가 클라이언트 값이라 '1일 1회'를 우회할 수 있었다 ──
test("⭐ 미션 sourceId 의 날짜가 서버 오늘과 다르면 거부(1일 1회 우회 차단)", () => {
  assert.equal(sourceDateMatchesServerDay("mission_complete", `write_post_${TODAY}`, TODAY), true);
  for (const bad of [
    "write_post_2099-01-01",   // 미래 날짜로 새 operationId 무한 생성
    "write_post_2020-01-01",   // 과거 날짜
    "write_post_2026-07-25",   // 어제
    "write_post",              // 날짜 없음
    "write_post_20260726",     // 형식 우회
    "",
    undefined,
  ]) {
    assert.equal(sourceDateMatchesServerDay("mission_complete", bad as any, TODAY), false, String(bad));
  }
});

test("⭐ playtime(minigame_play) 도 같은 날짜 규칙을 적용받는다", () => {
  assert.equal(sourceDateMatchesServerDay("minigame_play", `playtime_${TODAY}`, TODAY), true);
  assert.equal(sourceDateMatchesServerDay("minigame_play", "playtime_2099-12-31", TODAY), false);
  assert.equal(sourceDateMatchesServerDay("minigame_play", "playtime", TODAY), false);
});

test("날짜를 안 쓰는 타입은 날짜 검사 대상이 아니다(회귀 방지)", () => {
  for (const rt of ["community_post", "community_comment", "game_activity", "achievement_claim", "level_reward"] as const) {
    assert.equal(sourceDateMatchesServerDay(rt, "anything", TODAY), true, rt);
  }
});

// ── ⭐ 취약점 2: 모르는 missionId/achievementId 가 200 으로 통과하며 원장을 남겼다 ──
test("⭐ 서버 allowlist 밖 미션·업적·레벨 id 는 거부", () => {
  assert.equal(isKnownSource("mission_complete", `write_post_${TODAY}`), true);
  assert.equal(isKnownSource("mission_complete", `hack_${TODAY}`), false);
  assert.equal(isKnownSource("mission_complete", `__proto___${TODAY}`), false);

  assert.equal(isKnownSource("achievement_claim", "first_post"), true);
  assert.equal(isKnownSource("achievement_claim", "made_up"), false);
  assert.equal(isKnownSource("achievement_claim", "constructor"), false);   // prototype 오염 방어

  assert.equal(isKnownSource("level_reward", "10"), true);
  assert.equal(isKnownSource("level_reward", "7"), false);   // 보상표에 없는 레벨
  assert.equal(isKnownSource("level_reward", "999"), false);
});

test("prototype 체인 키로 금액을 얻을 수 없다", () => {
  for (const k of ["toString", "constructor", "hasOwnProperty", "__proto__"]) {
    assert.equal(isKnownSource("achievement_claim", k), false, k);
    assert.equal(computeExtendedCandy(EXTENDED_REWARD_POLICIES.achievement_claim, 0, k), 0, k);
  }
});

// ── ⭐ 취약점 3: 전역 일일 상한이 없어 타입별 상한 합(6,450)까지 받을 수 있었다 ──
test("⭐ 전역 일일 솜사탕 상한이 타입별 상한 합보다 작다", () => {
  const perTypeSum = Object.values(EXTENDED_REWARD_POLICIES).reduce((s, p) => s + p.dailyCandyCap, 0);
  assert.ok(DAILY_CANDY_TOTAL_CAP > 0);
  assert.ok(DAILY_CANDY_TOTAL_CAP < perTypeSum,
    `전역 상한(${DAILY_CANDY_TOTAL_CAP})이 타입별 합(${perTypeSum})보다 작아야 의미가 있다`);
});

test("전역 상한이 하루 정상 획득량(미션 전부 + 플레이)보다는 크다", () => {
  const missionsAll = Object.values(MISSION_CANDY).reduce((a, b) => a + b, 0);
  const playtime = EXTENDED_REWARD_POLICIES.minigame_play.candy;
  assert.ok(DAILY_CANDY_TOTAL_CAP >= missionsAll + playtime,
    `정상 사용자가 상한에 걸리면 안 된다: 미션합 ${missionsAll} + 플레이 ${playtime}`);
});

// ── 금액 소유권 ──
test("미션 금액은 서버 표만 사용한다", () => {
  const p = EXTENDED_REWARD_POLICIES.mission_complete;
  assert.equal(computeExtendedCandy(p, 0, `write_post_${TODAY}`), MISSION_CANDY.write_post);
  assert.equal(computeExtendedCandy(p, 0, `read_trend_${TODAY}`), MISSION_CANDY.read_trend);
  // 타입 일일 상한에 도달하면 0
  assert.equal(computeExtendedCandy(p, p.dailyCandyCap, `write_post_${TODAY}`), 0);
});

test("업적·레벨 금액도 서버 표만 사용한다", () => {
  assert.equal(computeExtendedCandy(EXTENDED_REWARD_POLICIES.achievement_claim, 0, "streak_30"), ACHIEVEMENT_CANDY.streak_30);
  assert.equal(computeExtendedCandy(EXTENDED_REWARD_POLICIES.level_reward, 0, "50"), LEVEL_REWARD_CANDY[50]);
});

test("sourceId 파서가 missionId 와 날짜를 정확히 분리", () => {
  assert.deepEqual(parseMissionSource(`play_minigame_${TODAY}`), { missionId: "play_minigame", date: TODAY });
  assert.equal(parseMissionSource("no_date_here"), null);
  assert.equal(levelFromSource("10"), 10);
  assert.equal(levelFromSource("010"), null);   // 앞자리 0 으로 다른 문자열 만들기 차단
  assert.equal(levelFromSource("1e1"), null);
});

// ── ⭐ 취약점 4: EXP 롤아웃(all)을 재화에 재사용해 카나리 구간이 없었다 ──
test("⭐ CANDY_ROLLOUT_MODE 는 미설정·오타면 운영에서 fail-closed", () => {
  assert.equal(parseCandyRollout(undefined), null);
  assert.equal(parseCandyRollout(""), null);
  assert.equal(parseCandyRollout("ALL "), "all");
  assert.equal(parseCandyRollout("allx"), null);
  assert.equal(parseCandyRollout("true"), null);

  const empty = new Set<string>();
  const denied = resolveCandyGate({}, "production", "u1", empty);
  assert.equal(denied.ok, false);
  if (!denied.ok) { assert.equal(denied.status, 503); assert.equal(denied.error, "candy_rollout_mode_invalid"); }

  const typo = resolveCandyGate({ CANDY_ROLLOUT_MODE: "everyone" }, "production", "u1", empty);
  assert.equal(typo.ok, false);
});

test("off 는 전면 거부, all 은 전체 허용", () => {
  const empty = new Set<string>();
  const off = resolveCandyGate({ CANDY_ROLLOUT_MODE: "off" }, "production", "u1", empty);
  assert.equal(off.ok, false);
  if (!off.ok) { assert.equal(off.status, 403); assert.equal(off.error, "candy_rollout_disabled"); }

  assert.equal(resolveCandyGate({ CANDY_ROLLOUT_MODE: "all" }, "production", "u1", empty).ok, true);
});

test("canary 는 allowlist 필수 + 목록 밖 UID 거부", () => {
  const noList = resolveCandyGate({ CANDY_ROLLOUT_MODE: "canary" }, "production", "u1", new Set());
  assert.equal(noList.ok, false);
  if (!noList.ok) assert.equal(noList.error, "candy_canary_requires_allowlist");

  const list = new Set(["u-allowed"]);
  assert.equal(resolveCandyGate({ CANDY_ROLLOUT_MODE: "canary" }, "production", "u-allowed", list).ok, true);
  const out = resolveCandyGate({ CANDY_ROLLOUT_MODE: "canary" }, "production", "u-other", list);
  assert.equal(out.ok, false);
  if (!out.ok) { assert.equal(out.status, 403); assert.equal(out.error, "candy_rollout_disabled"); }
});

test("EXP 롤아웃과 재화 롤아웃은 서로 독립이다", () => {
  // REWARD_ROLLOUT_MODE=all 이어도 재화는 CANDY_ROLLOUT_MODE 가 없으면 닫힌다.
  const r = resolveCandyGate({ REWARD_ROLLOUT_MODE: "all" }, "production", "u1", new Set());
  assert.equal(r.ok, false, "EXP 롤아웃 값이 재화를 열어주면 안 된다");
});

test("로컬 에뮬레이터는 미설정 시 all(개발 편의) — 운영만 fail-closed", () => {
  assert.equal(resolveCandyGate({}, "emulator", "u1", new Set()).ok, true);
  // 명시하면 에뮬레이터에서도 게이트 테스트가 가능하다
  assert.equal(resolveCandyGate({ CANDY_ROLLOUT_MODE: "off" }, "emulator", "u1", new Set()).ok, false);
});
