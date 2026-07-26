// 표시용 가용성 계산 회귀 — 정책(수치·cooldown)을 재정의하지 않고 engine 과 같은 결론을 내는지 본다.
import assert from "node:assert/strict";
import test from "node:test";
import {
  availabilityHint,
  dailyRewardProgress,
  resolveActionAvailability,
} from "../lib/myWorld/interaction/availability.ts";
import { defaultInteractionState, localDateKey, processInteraction } from "../lib/myWorld/interaction/engine.ts";
import {
  INTERACTION_AFFINITY_DAILY_MAX,
  INTERACTION_COOLDOWN_MS,
  INTERACTION_EXP_DAILY_MAX,
} from "../lib/myWorld/interaction/constants.ts";

const NOW = 1_800_000_000_000;

test("갓 시작한 상태에서는 모든 행동이 가능하다", () => {
  const state = defaultInteractionState(NOW);
  for (const type of ["pet", "greet", "gift", "sleep"] as const) {
    const a = resolveActionAvailability(state, type, NOW);
    assert.equal(a.available, true);
    assert.equal(a.retryAfterMs, 0);
    assert.equal(availabilityHint(a), null);
  }
});

test("cooldown 예측이 engine 의 거절 판정과 일치한다", () => {
  const state = defaultInteractionState(NOW);
  const after = processInteraction(state, { type: "gift", source: "pointer", characterId: "dori", at: NOW });
  assert.equal(after.accepted, true);

  // gift cooldown 중간 시점 — 표시도 불가, engine 도 거절.
  const mid = NOW + INTERACTION_COOLDOWN_MS.gift - 1_000;
  const a = resolveActionAvailability(after.state, "gift", mid);
  assert.equal(a.available, false);
  assert.equal(a.retryAfterSeconds, 1);
  assert.equal(availabilityHint(a), "1초 후");
  const rejected = processInteraction(after.state, { type: "gift", source: "pointer", characterId: "dori", at: mid });
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reason, "cooldown");

  // cooldown 종료 후 — 표시도 가능, engine 도 수락.
  const done = NOW + INTERACTION_COOLDOWN_MS.gift;
  assert.equal(resolveActionAvailability(after.state, "gift", done).available, true);
  assert.equal(processInteraction(after.state, { type: "gift", source: "pointer", characterId: "dori", at: done }).accepted, true);
});

test("다른 행동의 cooldown 은 서로 영향을 주지 않는다", () => {
  const state = defaultInteractionState(NOW);
  const after = processInteraction(state, { type: "gift", source: "pointer", characterId: "dori", at: NOW });
  assert.equal(resolveActionAvailability(after.state, "gift", NOW + 100).available, false);
  assert.equal(resolveActionAvailability(after.state, "pet", NOW + 100).available, true);
});

test("남은 초는 올림한다 — 0초로 표시되면서 눌리지 않는 구간이 없어야 한다", () => {
  const state = defaultInteractionState(NOW);
  const after = processInteraction(state, { type: "pet", source: "pointer", characterId: "dori", at: NOW });
  const almost = NOW + INTERACTION_COOLDOWN_MS.pet - 1; // 1ms 남음
  const a = resolveActionAvailability(after.state, "pet", almost);
  assert.equal(a.available, false);
  assert.equal(a.retryAfterSeconds, 1);
});

test("오늘의 보상 현황은 상한을 넘겨 표시하지 않는다", () => {
  const state = defaultInteractionState(NOW);
  const p = dailyRewardProgress(state, NOW);
  assert.equal(p.affinityGained, 0);
  assert.equal(p.affinityMax, INTERACTION_AFFINITY_DAILY_MAX);
  assert.equal(p.expMax, INTERACTION_EXP_DAILY_MAX);
  assert.equal(p.exhausted, false);
});

test("상한 도달은 exhausted 로 알리며, 행동 자체는 계속 가능하다", () => {
  const state = defaultInteractionState(NOW);
  const exhausted = {
    ...state,
    daily: {
      date: localDateKey(NOW),
      count: 30,
      affinityGained: INTERACTION_AFFINITY_DAILY_MAX,
      expGained: INTERACTION_EXP_DAILY_MAX,
      notableTypes: [],
    },
  };
  const p = dailyRewardProgress(exhausted, NOW);
  assert.equal(p.exhausted, true);
  // cooldown 이 없으면 여전히 누를 수 있다(보상만 0).
  assert.equal(resolveActionAvailability(exhausted, "pet", NOW).available, true);
  const r = processInteraction(exhausted, { type: "pet", source: "pointer", characterId: "dori", at: NOW });
  assert.equal(r.accepted, true);
  assert.equal(r.event?.affinityDelta, 0);
  assert.equal(r.event?.expDelta, 0);
});

test("날짜가 바뀌면 어제 적립분은 0 으로 본다", () => {
  const state = defaultInteractionState(NOW);
  const yesterday = {
    ...state,
    daily: { date: "2000-01-01", count: 9, affinityGained: 20, expGained: 40, notableTypes: [] },
  };
  const p = dailyRewardProgress(yesterday, NOW);
  assert.equal(p.affinityGained, 0);
  assert.equal(p.expGained, 0);
  assert.equal(p.exhausted, false);
});
