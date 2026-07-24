import assert from "node:assert/strict";
import test from "node:test";
import { ANIMATION_QUEUE_MAX, enqueueAnimationCommand } from "../lib/myWorld/interaction/animation.ts";
import type { AnimationCommand, AnimationType } from "../lib/myWorld/interaction/types.ts";

function cmd(type: AnimationType, priority = 1): AnimationCommand {
  return { id: `${type}_${priority}`, type, durationMs: 1_000, priority };
}

test("normal commands queue in order", () => {
  let queue: AnimationCommand[] = [];
  queue = enqueueAnimationCommand(queue, cmd("blink"));
  queue = enqueueAnimationCommand(queue, cmd("look"));
  queue = enqueueAnimationCommand(queue, cmd("walk"));
  assert.deepEqual(queue.map((c) => c.type), ["blink", "look", "walk"]);
});

test("high priority commands jump ahead of queued normal commands", () => {
  let queue: AnimationCommand[] = [];
  queue = enqueueAnimationCommand(queue, cmd("blink"));
  queue = enqueueAnimationCommand(queue, cmd("look"));
  queue = enqueueAnimationCommand(queue, cmd("love", 2)); // gift/long_press 급
  assert.equal(queue[0].type, "love");
  assert.deepEqual(queue.slice(1).map((c) => c.type), ["blink", "look"]);
});

test("queue never grows past the maximum", () => {
  let queue: AnimationCommand[] = [];
  for (let i = 0; i < 20; i += 1) queue = enqueueAnimationCommand(queue, cmd("blink"));
  assert.equal(queue.length, ANIMATION_QUEUE_MAX);

  // 넘칠 때 일반 명령은 오래된 것부터 버린다(최신 유지).
  let ordered: AnimationCommand[] = [];
  const types: AnimationType[] = ["blink", "look", "walk", "sit", "wave", "bounce", "spin"];
  for (const type of types) ordered = enqueueAnimationCommand(ordered, cmd(type));
  assert.equal(ordered.length, ANIMATION_QUEUE_MAX);
  assert.deepEqual(ordered.map((c) => c.type), ["walk", "sit", "wave", "bounce", "spin"]);
});

test("high priority command survives overflow and keeps the front slot", () => {
  let queue: AnimationCommand[] = [];
  for (const type of ["blink", "look", "walk", "sit", "wave"] as AnimationType[]) {
    queue = enqueueAnimationCommand(queue, cmd(type));
  }
  assert.equal(queue.length, ANIMATION_QUEUE_MAX);
  queue = enqueueAnimationCommand(queue, cmd("love", 3));
  assert.equal(queue.length, ANIMATION_QUEUE_MAX);
  assert.equal(queue[0].type, "love");
});

test("respects a custom max and is pure (input queue is not mutated)", () => {
  const original: AnimationCommand[] = [cmd("blink"), cmd("look")];
  const next = enqueueAnimationCommand(original, cmd("walk"), 2);
  assert.equal(next.length, 2);
  assert.deepEqual(original.map((c) => c.type), ["blink", "look"], "원본 배열은 변경되지 않아야 한다");
});
