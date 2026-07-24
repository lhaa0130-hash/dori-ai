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
