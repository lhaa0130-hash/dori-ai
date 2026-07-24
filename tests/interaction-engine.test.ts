import assert from "node:assert/strict";
import test from "node:test";
import { affinityMilestoneCrossed, defaultInteractionState, processInteraction } from "../lib/myWorld/interaction/engine.ts";
import type { InteractionEvent, InteractionState } from "../lib/myWorld/interaction/types.ts";

function intent(type: "touch" | "pet" | "gift" | "room_item", at: number) {
  return { type, at, source: "pointer" as const, characterId: "dori" };
}

test("accepts interaction, applies rewards, then enforces per-action cooldown", () => {
  const initial = defaultInteractionState(new Date(2026, 6, 24, 10).getTime());
  const at = new Date(2026, 6, 24, 10).getTime();
  const accepted = processInteraction(initial, intent("touch", at));
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.state.affinity, 1);
  assert.equal(accepted.event?.expDelta, 1);

  const blocked = processInteraction(accepted.state, intent("touch", at + 200));
  assert.equal(blocked.accepted, false);
  assert.equal(blocked.reason, "cooldown");
  assert.equal(blocked.retryAfterMs, 1_000);

  const ready = processInteraction(accepted.state, intent("touch", at + 1_200));
  assert.equal(ready.accepted, true);
});

test("blocks burst spam independently of individual cooldowns", () => {
  const at = new Date(2026, 6, 24, 12).getTime();
  const initial = defaultInteractionState(at);
  const recent: InteractionEvent[] = Array.from({ length: 12 }, (_, index) => ({
    id: `event_${index}`,
    type: "touch",
    source: "pointer",
    characterId: "dori",
    at: at - index * 500,
    emotion: "happy",
    animation: "bounce",
    speech: "hello",
    affinityDelta: 0,
    expDelta: 0,
    metadata: {},
  }));
  const state: InteractionState = { ...initial, recent, cooldowns: {} };
  const result = processInteraction(state, intent("pet", at));
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "spam");
});

test("caps daily affinity and EXP without disabling character reactions", () => {
  const at = new Date(2026, 6, 24, 14).getTime();
  const state: InteractionState = {
    ...defaultInteractionState(at),
    affinity: 40,
    daily: { date: "2026-07-24", count: 5, affinityGained: 19, expGained: 39, notableTypes: [] },
  };
  const capped = processInteraction(state, intent("gift", at));
  assert.equal(capped.accepted, true);
  assert.equal(capped.event?.affinityDelta, 1);
  assert.equal(capped.event?.expDelta, 1);
  assert.equal(capped.state.daily.affinityGained, 20);
  assert.equal(capped.state.daily.expGained, 40);

  const stillReactive = processInteraction({ ...capped.state, cooldowns: {} }, intent("pet", at + 10_000));
  assert.equal(stillReactive.accepted, true);
  assert.equal(stillReactive.event?.affinityDelta, 0);
  assert.equal(stillReactive.event?.expDelta, 0);
  assert.equal(stillReactive.reason, "daily_limit");
  assert.ok(stillReactive.event?.speech);
});

test("rolls daily limits at the local date boundary and clamps affinity at 100", () => {
  const previous = new Date(2026, 6, 24, 23, 59).getTime();
  const nextDay = new Date(2026, 6, 25, 0, 1).getTime();
  const state: InteractionState = {
    ...defaultInteractionState(previous),
    affinity: 99,
    daily: { date: "2026-07-24", count: 99, affinityGained: 20, expGained: 40, notableTypes: ["gift"] },
  };
  const result = processInteraction(state, intent("gift", nextDay));
  assert.equal(result.accepted, true);
  assert.equal(result.state.daily.date, "2026-07-25");
  assert.equal(result.state.daily.count, 1);
  assert.equal(result.event?.affinityDelta, 1);
  assert.equal(result.state.affinity, 100);
});

test("emits room-aware speech and detects friendship milestones", () => {
  const at = new Date(2026, 6, 24, 16).getTime();
  const result = processInteraction(defaultInteractionState(at), {
    ...intent("room_item", at),
    source: "room",
    roomItemId: "bed-basic",
    roomItemName: "침대",
  });
  assert.equal(result.accepted, true);
  assert.match(result.event?.speech || "", /침대/);
  assert.equal(affinityMilestoneCrossed(24, 25), 25);
  assert.equal(affinityMilestoneCrossed(51, 55), null);
});

test("derives emotion from the interaction type", () => {
  const at = new Date(2026, 6, 24, 15).getTime();
  const emotionOf = (type: "pet" | "sleep" | "greet" | "gift") =>
    processInteraction(defaultInteractionState(at), { type, at, source: "pointer", characterId: "dori" }).event?.emotion;
  assert.equal(emotionOf("pet"), "love");
  assert.equal(emotionOf("sleep"), "sleepy");
  assert.equal(emotionOf("greet"), "happy");
  assert.equal(emotionOf("gift"), "excited");
});

test("maps each room item to its own reaction and falls back safely", () => {
  const at = new Date(2026, 6, 24, 15).getTime();
  const useItem = (roomItemId: string, roomItemName: string) =>
    processInteraction(defaultInteractionState(at), {
      type: "room_item", at, source: "room", characterId: "dori", roomItemId, roomItemName,
    }).event;

  const bed = useItem("bed-basic", "침대");
  assert.equal(bed?.emotion, "sleepy");
  assert.equal(bed?.animation, "sleep");

  const desk = useItem("desk-basic", "책상");
  assert.equal(desk?.emotion, "thinking");
  assert.equal(desk?.animation, "think");

  const plant = useItem("plant-basic", "화분");
  assert.equal(plant?.emotion, "happy");
  assert.equal(plant?.animation, "look");

  const doll = useItem("doll-basic", "인형");
  assert.equal(doll?.emotion, "love");
  assert.equal(doll?.animation, "love");

  const chair = useItem("chair-basic", "의자");
  assert.equal(chair?.animation, "sit");

  // 등록되지 않은 가구도 오류 없이 기본 반응 + 가구 이름이 담긴 대사를 낸다.
  const unknown = useItem("mystery-item", "수수께끼 상자");
  assert.equal(unknown?.emotion, "thinking");
  assert.equal(unknown?.animation, "look");
  assert.match(unknown?.speech || "", /수수께끼 상자/);
});

test("detects every friendship milestone exactly once", () => {
  assert.equal(affinityMilestoneCrossed(0, 25), 25);
  assert.equal(affinityMilestoneCrossed(49, 50), 50);
  assert.equal(affinityMilestoneCrossed(74, 75), 75);
  assert.equal(affinityMilestoneCrossed(99, 100), 100);
  // 이미 넘은 구간에서는 다시 보고하지 않는다.
  assert.equal(affinityMilestoneCrossed(25, 26), null);
  assert.equal(affinityMilestoneCrossed(50, 60), null);
  assert.equal(affinityMilestoneCrossed(100, 100), null);
  // 한 번에 여러 구간을 넘으면 가장 낮은 구간을 보고한다.
  assert.equal(affinityMilestoneCrossed(20, 80), 25);
});
