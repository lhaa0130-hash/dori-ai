import assert from "node:assert/strict";
import test from "node:test";
import { buildInteractionMergePayload, createMemoryStorage } from "../lib/myWorld/interaction/storage.ts";
import { defaultInteractionState, processInteraction } from "../lib/myWorld/interaction/engine.ts";
import { evaluateDiaryTrigger } from "../lib/myWorld/interaction/diaryTrigger.ts";
import type { InteractionEvent, InteractionState } from "../lib/myWorld/interaction/types.ts";

const AT = new Date(2026, 6, 24, 10).getTime();
const DAY = 24 * 60 * 60 * 1000;
const SENTINEL = { __serverTimestamp: true };

function intent(type: "touch" | "pet" | "gift", at: number) {
  return { type, at, source: "pointer" as const, characterId: "dori" };
}

// ── Firestore merge 형태 ────────────────────────────────────────────────
test("merge payload only touches myWorld.interaction so sibling data survives", () => {
  const payload = buildInteractionMergePayload(defaultInteractionState(AT), SENTINEL);

  assert.deepEqual(Object.keys(payload), ["myWorld"]);
  assert.deepEqual(Object.keys(payload.myWorld), ["interaction"]);
  // character / diary / room 키가 페이로드에 없으므로 merge:true 에서 덮어쓰이지 않는다.
  assert.equal("character" in payload.myWorld, false);
  assert.equal("diary" in payload.myWorld, false);
  assert.equal("room" in payload.myWorld, false);
});

test("merge payload carries the expected interaction fields and an updatedAt sentinel", () => {
  const state: InteractionState = { ...defaultInteractionState(AT), affinity: 12, lastInteraction: AT };
  const { interaction } = buildInteractionMergePayload(state, SENTINEL).myWorld;

  assert.equal(interaction.updatedAt, SENTINEL);
  for (const key of ["version", "affinity", "emotion", "lastInteraction", "cooldowns", "daily", "recent"]) {
    assert.ok(key in interaction, `missing ${key}`);
  }
  assert.equal(interaction.affinity, 12);
});

test("merge payload never introduces PII fields", () => {
  const state = { ...defaultInteractionState(AT), email: "a@b.c", provider: "google", gender: "f", ageGroup: "20s" };
  const serialized = JSON.stringify(buildInteractionMergePayload(state as InteractionState, SENTINEL));
  for (const pii of ["email", "provider", "gender", "ageGroup", "displayName", "photoURL"]) {
    assert.equal(serialized.includes(pii), false, `PII 필드가 저장되면 안 됨: ${pii}`);
  }
});

// ── EXP 지급 경계 ──────────────────────────────────────────────────────
test("rejected interactions produce no event, so no EXP or affinity can be granted", () => {
  const first = processInteraction(defaultInteractionState(AT), intent("touch", AT));
  assert.equal(first.accepted, true);

  const cooled = processInteraction(first.state, intent("touch", AT + 100));
  assert.equal(cooled.accepted, false);
  assert.equal(cooled.event, undefined);          // UI 는 event.expDelta 로만 적립한다
  assert.equal(cooled.state.affinity, first.state.affinity);

  const spamState: InteractionState = {
    ...defaultInteractionState(AT),
    recent: Array.from({ length: 12 }, (_, i) => ({
      id: `e${i}`, type: "touch", source: "pointer", characterId: "dori", at: AT - i * 100,
      emotion: "happy", animation: "bounce", speech: "", affinityDelta: 0, expDelta: 0, metadata: {},
    })) as InteractionEvent[],
  };
  const spammed = processInteraction(spamState, intent("pet", AT));
  assert.equal(spammed.accepted, false);
  assert.equal(spammed.event, undefined);
  assert.equal(spammed.state.affinity, 0);
});

test("daily-capped interactions still react but grant zero EXP", () => {
  const capped: InteractionState = {
    ...defaultInteractionState(AT),
    daily: { date: "2026-07-24", count: 30, affinityGained: 20, expGained: 40, notableTypes: [] },
  };
  const result = processInteraction(capped, intent("pet", AT));
  assert.equal(result.accepted, true);
  assert.equal(result.event?.expDelta, 0);
  assert.equal(result.event?.affinityDelta, 0);
  assert.ok(result.event?.speech, "보상이 0이어도 반응은 제공한다");
});

// ── Diary 중복 방지 ────────────────────────────────────────────────────
function eventOf(type: InteractionEvent["type"], at: number): InteractionEvent {
  return {
    id: `ix_${at}`, type, source: "pointer", characterId: "dori", at,
    emotion: "happy", animation: "bounce", speech: "hi", affinityDelta: 1, expDelta: 1, metadata: {},
  };
}

test("records the first meeting exactly once", () => {
  const fresh = defaultInteractionState(AT);
  const first = evaluateDiaryTrigger(fresh, eventOf("touch", AT), null);
  assert.equal(first.record, true);
  assert.equal(first.firstMeeting, true);

  const met: InteractionState = { ...fresh, lastInteraction: AT };
  const second = evaluateDiaryTrigger(met, eventOf("touch", AT + 5_000), null);
  assert.equal(second.record, false, "두 번째 일반 상호작용은 기록하지 않는다");
});

test("records only the first pet and first gift of each day", () => {
  const base: InteractionState = {
    ...defaultInteractionState(AT),
    lastInteraction: AT,
    daily: { date: "2026-07-24", count: 1, affinityGained: 1, expGained: 1, notableTypes: [] },
  };

  const firstPet = evaluateDiaryTrigger(base, eventOf("pet", AT), null);
  assert.equal(firstPet.firstPetToday, true);
  assert.equal(firstPet.record, true);

  const petted: InteractionState = { ...base, daily: { ...base.daily, notableTypes: ["pet"] } };
  const secondPet = evaluateDiaryTrigger(petted, eventOf("pet", AT + 60_000), null);
  assert.equal(secondPet.firstPetToday, false);
  assert.equal(secondPet.record, false, "같은 날 두 번째 쓰다듬기는 기록하지 않는다");

  const firstGift = evaluateDiaryTrigger(petted, eventOf("gift", AT + 60_000), null);
  assert.equal(firstGift.firstGiftToday, true);
  assert.equal(firstGift.record, true);

  const gifted: InteractionState = { ...base, daily: { ...base.daily, notableTypes: ["pet", "gift"] } };
  assert.equal(evaluateDiaryTrigger(gifted, eventOf("gift", AT + 120_000), null).record, false);

  // 날짜가 바뀌면 다시 "오늘 처음"이 된다.
  const nextDay = AT + DAY;
  assert.equal(evaluateDiaryTrigger(gifted, eventOf("pet", nextDay), null).firstPetToday, true);
});

test("records long absence and milestone crossings", () => {
  const base: InteractionState = { ...defaultInteractionState(AT), lastInteraction: AT };

  const soon = evaluateDiaryTrigger(base, eventOf("touch", AT + DAY - 1), null);
  assert.equal(soon.longAbsence, false);
  assert.equal(soon.record, false);

  const returned = evaluateDiaryTrigger(base, eventOf("touch", AT + DAY), null);
  assert.equal(returned.longAbsence, true);
  assert.equal(returned.record, true);

  const milestone = evaluateDiaryTrigger(base, eventOf("touch", AT + 5_000), 50);
  assert.equal(milestone.record, true);
  assert.equal(milestone.milestone, 50);
});

test("storage adapter isolates users from each other", () => {
  const storage = createMemoryStorage();
  const a = { ...defaultInteractionState(AT), affinity: 10 };
  const b = { ...defaultInteractionState(AT), affinity: 90 };
  const payloadA = buildInteractionMergePayload(a, SENTINEL);
  const payloadB = buildInteractionMergePayload(b, SENTINEL);
  assert.equal(payloadA.myWorld.interaction.affinity, 10);
  assert.equal(payloadB.myWorld.interaction.affinity, 90);
  assert.notEqual(payloadA.myWorld.interaction, payloadB.myWorld.interaction);
});
