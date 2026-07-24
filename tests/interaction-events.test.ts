import assert from "node:assert/strict";
import test from "node:test";
import { MY_WORLD_INTERACTION_EVENT, publishInteraction, subscribeToInteraction } from "../lib/myWorld/interaction/events.ts";
import type { AIInteractionContext, InteractionEvent } from "../lib/myWorld/interaction/types.ts";

const AT = new Date(2026, 6, 24, 15).getTime();

function event(overrides: Partial<InteractionEvent> = {}): InteractionEvent {
  return {
    id: "ix_1",
    type: "room_item",
    source: "room",
    characterId: "dori",
    roomItemId: "bed-basic",
    at: AT,
    emotion: "sleepy",
    animation: "sleep",
    speech: "침대는 언제나 포근해.",
    affinityDelta: 1,
    expDelta: 2,
    metadata: { note: "test" },
    ...overrides,
  };
}

test("publishes a complete AI context payload including the room item", () => {
  const seen: AIInteractionContext[] = [];
  const off = subscribeToInteraction((ctx) => seen.push(ctx));
  const returned = publishInteraction(event(), 55);
  off();

  assert.equal(seen.length, 1);
  const ctx = seen[0];
  assert.equal(ctx, returned);
  assert.equal(ctx.event.characterId, "dori");
  assert.equal(ctx.event.type, "room_item");
  assert.equal(ctx.event.roomItemId, "bed-basic");
  assert.equal(ctx.event.at, AT);
  assert.equal(ctx.emotion, "sleepy");
  assert.equal(ctx.affinity, 55);
  assert.deepEqual(ctx.event.metadata, { note: "test" });
});

test("maps affinity to the relationship stage", () => {
  const stage = (affinity: number) => publishInteraction(event(), affinity).relationship;
  assert.equal(stage(0), "new");
  assert.equal(stage(24), "new");
  assert.equal(stage(25), "familiar");
  assert.equal(stage(49), "familiar");
  assert.equal(stage(50), "close");
  assert.equal(stage(74), "close");
  assert.equal(stage(75), "best_friend");
  assert.equal(stage(100), "best_friend");
});

test("stops delivering to a subscriber after unsubscribe", () => {
  let count = 0;
  const off = subscribeToInteraction(() => { count += 1; });
  publishInteraction(event(), 10);
  assert.equal(count, 1);
  off();
  publishInteraction(event(), 10);
  assert.equal(count, 1, "구독 해제 후에는 전달되지 않아야 한다");
});

test("does not throw when there are no subscribers", () => {
  assert.doesNotThrow(() => publishInteraction(event(), 42));
});

test("DOM CustomEvent listeners receive the same payload as internal subscribers", () => {
  // events.ts 는 window 가 있을 때만 DOM 으로 발행한다. 최소한의 window 를 주입해 검증.
  const target = new EventTarget();
  (globalThis as { window?: unknown }).window = target;
  try {
    const fromDom: AIInteractionContext[] = [];
    const fromBus: AIInteractionContext[] = [];
    const listener = (e: Event) => fromDom.push((e as CustomEvent<AIInteractionContext>).detail);
    target.addEventListener(MY_WORLD_INTERACTION_EVENT, listener);
    const off = subscribeToInteraction((ctx) => fromBus.push(ctx));

    const published = publishInteraction(event(), 60);

    off();
    target.removeEventListener(MY_WORLD_INTERACTION_EVENT, listener);

    assert.equal(fromDom.length, 1);
    assert.equal(fromBus.length, 1);
    assert.equal(fromDom[0], published);
    assert.equal(fromBus[0], published);
    assert.equal(fromDom[0].relationship, "close");
  } finally {
    delete (globalThis as { window?: unknown }).window;
  }
});
