// Phase 6 — KST 날짜·상한·sourceId 감사 (감사 브랜치 신규)
//
// 목적: "날짜 문자열만 바꿔 매일 보상 반복" / "미래 날짜 선점" / "타입을 섞어 상한 우회" 같은
//       시간 축 공격을 계약으로 고정한다. 서버 시간 계약이 흔들리면 1일 1회 게이트가 통째로 무너진다.
import test from "node:test";
import assert from "node:assert/strict";
import { todayKST } from "../functions/_shared/rewardPolicy.ts";
import {
  sourceDateMatchesServerDay, isKnownSource, levelFromSource, computeExtendedCandy,
  operationIdFor, isValidExtendedOperationId, EXTENDED_REWARD_POLICIES,
  MISSION_CANDY, MISSION_EXP_ONLY, ACHIEVEMENT_CANDY, DAILY_CANDY_TOTAL_CAP,
} from "../functions/_shared/rewardTypes.ts";

const P = EXTENDED_REWARD_POLICIES;
/** UTC 시각을 만들어 KST 경계를 정확히 겨눈다. */
const utc = (s: string) => new Date(s);

// ── 1. KST 경계 ─────────────────────────────────────────────────────────
test("KST 자정 직전/직후에 날짜가 정확히 넘어간다", () => {
  // KST = UTC+9. KST 2026-07-27 00:00:00 == UTC 2026-07-26 15:00:00
  assert.equal(todayKST(utc("2026-07-26T14:59:59.999Z")), "2026-07-26");
  assert.equal(todayKST(utc("2026-07-26T15:00:00.000Z")), "2026-07-27");
});

test("UTC 자정에는 날짜가 넘어가지 않는다(KST 오전 9시)", () => {
  assert.equal(todayKST(utc("2026-07-26T23:59:59Z")), "2026-07-27");
  assert.equal(todayKST(utc("2026-07-27T00:00:00Z")), "2026-07-27");
  assert.equal(todayKST(utc("2026-07-27T00:00:01Z")), "2026-07-27");
});

test("KST 23:59:59 와 00:00:00 이 서로 다른 날이다", () => {
  const late = todayKST(utc("2026-07-26T14:59:59Z"));   // KST 23:59:59
  const early = todayKST(utc("2026-07-26T15:00:00Z"));  // KST 00:00:00 (다음날)
  assert.notEqual(late, early);
});

test("월말·연말·윤년 경계", () => {
  assert.equal(todayKST(utc("2026-07-31T15:00:00Z")), "2026-08-01");  // 월말
  assert.equal(todayKST(utc("2026-12-31T15:00:00Z")), "2027-01-01");  // 연말
  assert.equal(todayKST(utc("2028-02-28T15:00:00Z")), "2028-02-29");  // 윤년 2/29 존재
  assert.equal(todayKST(utc("2028-02-29T15:00:00Z")), "2028-03-01");
  assert.equal(todayKST(utc("2026-02-28T15:00:00Z")), "2026-03-01");  // 평년엔 2/29 없음
});

test("KST 는 DST 가 없다 — 여름/겨울 오프셋이 동일하다", () => {
  // 같은 UTC 시각(15:00)이 계절과 무관하게 항상 다음날 00:00 KST 여야 한다.
  for (const d of ["2026-01-15", "2026-04-15", "2026-07-15", "2026-10-15"]) {
    const before = todayKST(utc(`${d}T14:59:59Z`));
    const after = todayKST(utc(`${d}T15:00:00Z`));
    assert.notEqual(before, after, `${d} 경계가 흔들림`);
  }
});

// ── 2. sourceId 날짜는 클라이언트 값이다 ────────────────────────────────
test("서버 오늘과 다른 날짜의 sourceId 는 전부 거부", () => {
  const today = "2026-07-26";
  for (const rt of ["mission_complete", "minigame_play"] as const) {
    assert.equal(sourceDateMatchesServerDay(rt, `write_post_${today}`, today), true);
    assert.equal(sourceDateMatchesServerDay(rt, "write_post_2026-07-25", today), false, "어제");
    assert.equal(sourceDateMatchesServerDay(rt, "write_post_2026-07-27", today), false, "내일");
    assert.equal(sourceDateMatchesServerDay(rt, "write_post_2099-01-01", today), false, "먼 미래 선점");
    assert.equal(sourceDateMatchesServerDay(rt, "write_post_2020-01-01", today), false, "과거 재청구");
  }
});

test("날짜 없는 sourceId 로 우회할 수 없다", () => {
  const today = "2026-07-26";
  for (const bad of [undefined, "", "write_post", "write_post_", "writepost20260726", "write_post_今日"]) {
    assert.equal(sourceDateMatchesServerDay("mission_complete", bad, today), false, String(bad));
  }
});

test("같은 날짜의 다른 표기는 통과하지 못한다(정규형 하나만)", () => {
  const today = "2026-07-26";
  for (const bad of [
    "write_post_2026-7-26",      // 0 패딩 없음
    "write_post_2026/07/26",     // 구분자 다름
    "write_post_20260726",       // 구분자 없음
    "write_post_2026-07-26T00",  // 시간 포함
    "write_post_2026-07-26 ",    // 후행 공백
    " write_post_2026-07-26",    // 선행 공백
  ]) {
    assert.equal(sourceDateMatchesServerDay("mission_complete", bad, today), false, bad);
  }
});

test("존재하지 않는 날짜 문자열도 '오늘'이 아니면 거부된다", () => {
  const today = "2026-07-26";
  assert.equal(sourceDateMatchesServerDay("mission_complete", "write_post_2026-02-30", today), false);
  assert.equal(sourceDateMatchesServerDay("mission_complete", "write_post_2026-13-01", today), false);
  assert.equal(sourceDateMatchesServerDay("mission_complete", "write_post_9999-99-99", today), false);
});

test("날짜를 쓰지 않는 타입은 날짜 검사를 통과시킨다(계약 확인)", () => {
  const today = "2026-07-26";
  for (const rt of ["community_post", "community_comment", "achievement_claim", "level_reward", "game_activity"] as const) {
    assert.equal(sourceDateMatchesServerDay(rt, "anything", today), true);
  }
});

// ── 3. allowlist 우회 시도 ──────────────────────────────────────────────
test("대소문자·공백·유사문자로 미션 allowlist 를 우회할 수 없다", () => {
  const T = "2026-07-26";
  assert.equal(isKnownSource("mission_complete", `write_post_${T}`), true, "정상은 통과");
  for (const bad of [
    `WRITE_POST_${T}`, `Write_Post_${T}`, `write_post _${T}`,
    `wrіte_post_${T}`,        // 키릴 і (U+0456)
    `write​post_${T}`,        // zero-width space
    `write_post _${T}`,       // non-breaking space
  ]) {
    assert.equal(isKnownSource("mission_complete", bad), false, bad);
  }
});

test("모르는 업적·미션·레벨 id 는 전부 거부", () => {
  assert.equal(isKnownSource("achievement_claim", "first_visit"), true);
  assert.equal(isKnownSource("achievement_claim", "not_a_real_achievement"), false);
  assert.equal(isKnownSource("achievement_claim", "__proto__"), false, "프로토타입 오염 키");
  assert.equal(isKnownSource("achievement_claim", "constructor"), false);
  assert.equal(isKnownSource("achievement_claim", "toString"), false);
  assert.equal(isKnownSource("mission_complete", `hack_2026-07-26`), false);
});

test("level_reward 는 앞자리 0·지수표기·음수를 거부한다", () => {
  assert.equal(levelFromSource("5"), 5);
  for (const bad of ["05", "010", "-1", "1e3", "5.0", "+5", " 5", "5 ", "０５", ""]) {
    assert.equal(levelFromSource(bad), null, bad);
  }
});

test("EXP 전용 레거시 미션은 '알려진' 미션이지만 재화는 0", () => {
  // 구버전 client 가 보내던 postset/commentset/likeset. 400 이 되면 기존 EXP 가 끊긴다.
  for (const id of MISSION_EXP_ONLY) {
    const src = `${id}_2026-07-26`;
    assert.equal(isKnownSource("mission_complete", src), true, `${id} 는 통과해야 한다`);
    assert.equal(computeExtendedCandy(P.mission_complete, 0, src), 0, `${id} 재화는 0`);
  }
});

// ── 4. 상한 계약 ────────────────────────────────────────────────────────
test("전역 일일 상한은 600 이고, 출석(최대 250)은 그 밖이다 → 하루 최대 850", () => {
  assert.equal(DAILY_CANDY_TOTAL_CAP, 600);
  const ATTENDANCE_MAX = 50 + 200;   // 기본 50 + 7일 보너스 200
  assert.equal(ATTENDANCE_MAX, 250);
  assert.equal(DAILY_CANDY_TOTAL_CAP + ATTENDANCE_MAX, 850);
});

test("타입별 일일 상한을 넘겨 청구해도 상한까지만 지급된다", () => {
  for (const [name, policy] of Object.entries(P)) {
    if (!policy.dailyCandyCap) continue;
    // 이미 상한만큼 받은 상태
    const src = name === "mission_complete" ? "write_post_2026-07-26"
      : name === "achievement_claim" ? "first_visit"
      : name === "level_reward" ? "5" : "playtime_2026-07-26";
    const at = computeExtendedCandy(policy, policy.dailyCandyCap, src);
    assert.equal(at, 0, `${name}: 상한 소진 후에도 지급됨`);
    const over = computeExtendedCandy(policy, policy.dailyCandyCap + 9999, src);
    assert.equal(over, 0, `${name}: 초과 상태에서 지급됨`);
  }
});

test("음수·NaN·Infinity 집계값이 상한 계산을 뚫지 못한다", () => {
  const src = "write_post_2026-07-26";
  const base = computeExtendedCandy(P.mission_complete, 0, src);
  for (const bad of [-1, -99999, NaN, Infinity, -Infinity]) {
    const v = computeExtendedCandy(P.mission_complete, bad as number, src);
    assert.ok(v >= 0 && v <= base, `earned=${bad} → ${v} (base ${base})`);
  }
});

test("여러 rewardType 을 섞어도 타입별 상한 합이 전역 상한을 대체하지 않는다", () => {
  // 타입별 상한 합은 전역 상한보다 훨씬 크다 → 전역 상한이 반드시 필요하다는 근거.
  const perTypeSum = Object.values(P).reduce((s, p) => s + (p.dailyCandyCap || 0), 0);
  assert.ok(perTypeSum > DAILY_CANDY_TOTAL_CAP,
    `타입별 합(${perTypeSum}) 이 전역(${DAILY_CANDY_TOTAL_CAP}) 이하라면 전역 상한이 무의미하다`);
});

// ── 5. operationId 파생 계약 (시간 축 재사용 차단의 핵심) ───────────────
test("source 필요 타입은 operationId 가 sourceId 에서 완전히 파생된다", () => {
  const T = "2026-07-26";
  const cases: Array<[keyof typeof P, string]> = [
    ["mission_complete", `write_post_${T}`],
    ["minigame_play", `playtime_${T}`],
    ["achievement_claim", "first_visit"],
    ["level_reward", "5"],
    ["community_post", "somepost"],
  ];
  for (const [rt, src] of cases) {
    const expected = operationIdFor(P[rt], src);
    assert.ok(expected, `${rt}: operationIdFor 가 null`);
    assert.equal(isValidExtendedOperationId(P[rt], expected, src), true);
    // 임의로 만든 operationId 는 거부된다 → "같은 source 를 여러 op 로" 가 불가능
    assert.equal(isValidExtendedOperationId(P[rt], `${expected}_extra`, src), false, `${rt}: 접미사 우회`);
    assert.equal(isValidExtendedOperationId(P[rt], `${expected}`.toUpperCase(), src), false, `${rt}: 대문자 우회`);
  }
});

test("다른 날짜의 operationId 를 오늘 sourceId 에 붙일 수 없다", () => {
  const today = "2026-07-26";
  const opYesterday = operationIdFor(P.mission_complete, "write_post_2026-07-25");
  assert.equal(isValidExtendedOperationId(P.mission_complete, opYesterday, `write_post_${today}`), false);
});

test("MISSION_CANDY 표의 금액 합이 전역 상한을 넘는다(상한이 실제로 동작해야 하는 이유)", () => {
  const sum = Object.values(MISSION_CANDY).reduce((a, b) => a + b, 0);
  assert.ok(sum > 0);
  const achSum = Object.values(ACHIEVEMENT_CANDY).reduce((a, b) => a + b, 0);
  assert.ok(sum + achSum > DAILY_CANDY_TOTAL_CAP,
    `미션+업적 합(${sum + achSum}) 이 전역 상한 이하면 상한 테스트가 공허해진다`);
});
