import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  areOrdersComplete,
  calculateStars,
  canMove,
  generateLevel,
  hasAvailableMove,
  moveItem,
  undoMove,
  validateLevel,
  type MartLevel,
  type MartState,
  type ProductId,
} from "../lib/minigames/mart-engine.ts";

const levels = JSON.parse(
  readFileSync(new URL("../data/minigames/mart-levels.json", import.meta.url), "utf8"),
) as MartLevel[];

function stateWith(shelves: ProductId[][]): MartState {
  return {
    shelves: shelves.map((items, id) => ({ id, items, locked: false })),
    completed: {},
    completedProducts: [],
    completedSequence: [],
    moves: 0,
    flowIntact: true,
    status: "playing",
    basketAdded: false,
  };
}

const simpleLevel: MartLevel = {
  id: 1,
  title: "test",
  products: ["juice", "chips", "milk"],
  shelfCount: 4,
  seed: 1,
  scrambleMoves: 3,
  moveLimit: null,
  par: 4,
  orders: [
    { category: "beverage", count: 1 },
    { category: "snack", count: 1 },
    { category: "chilled", count: 1 },
  ],
};

test("allows only an exposed item to move onto an empty or matching shelf", () => {
  const state = stateWith([["chips", "juice"], ["juice"], [], ["milk"]]);
  assert.equal(canMove(state, 0, 1), true);
  assert.equal(canMove(state, 0, 2), true);
  assert.equal(canMove(state, 0, 3), false);
  assert.equal(canMove(state, 2, 1), false);

  const invalid = moveItem(state, simpleLevel, 0, 3);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error, "type-mismatch");
  assert.deepEqual(state.shelves[0].items, ["chips", "juice"]);
});

test("completes a set and advances its order card", () => {
  const state = stateWith([["juice"], ["juice", "juice"], ["chips"], ["milk"]]);
  const result = moveItem(state, simpleLevel, 0, 1);
  assert.equal(result.ok, true);
  assert.equal(result.setCompleted, "juice");
  assert.equal(result.orderCompleted, "beverage");
  assert.deepEqual(result.state.shelves[1].items, []);
  assert.equal(result.state.completed.beverage, 1);
});

test("detects completed orders, no-move boards, and stars", () => {
  const completed = stateWith([[], [], [], []]);
  completed.completed = { beverage: 1, snack: 1, chilled: 1 };
  completed.completedProducts = ["juice", "chips", "milk"];
  completed.status = "won";
  completed.moves = 4;
  assert.equal(areOrdersComplete(completed, simpleLevel), true);
  assert.equal(calculateStars(completed, simpleLevel), 3);

  const stuck = stateWith([
    ["juice", "chips", "milk"],
    ["chips", "milk", "juice"],
    ["milk", "juice", "chips"],
    ["juice", "chips", "milk"],
  ]);
  assert.equal(hasAvailableMove(stuck), false);
});

test("undo restores the exact previous snapshot", () => {
  const before = stateWith([["juice"], [], ["chips"], ["milk"]]);
  const after = moveItem(before, simpleLevel, 0, 1).state;
  const restored = undoMove(after, before);
  assert.ok(restored);
  assert.deepEqual(restored, before);
  assert.notEqual(restored, before);
});

test("all 30 external levels are valid and their generated solution wins", () => {
  assert.equal(levels.length, 30);
  assert.deepEqual(levels.map((level) => level.id), Array.from({ length: 30 }, (_, index) => index + 1));

  for (const level of levels) {
    assert.deepEqual(validateLevel(level), [], `level ${level.id} metadata`);
    const generated = generateLevel(level);
    let state = stateWith(generated.shelves);
    state.shelves = state.shelves.map((shelf, index) => ({
      ...shelf,
      locked: index === level.lockedShelf,
    }));

    for (const move of generated.solution) {
      const result = moveItem(state, level, move.from, move.to);
      assert.equal(result.ok, true, `level ${level.id}: ${move.from} -> ${move.to}`);
      state = result.state;
    }
    assert.equal(state.status, "won", `level ${level.id} should be solved`);
    assert.equal(areOrdersComplete(state, level), true, `level ${level.id} orders`);
    if (level.moveLimit !== null) assert.ok(state.moves <= level.moveLimit, `level ${level.id} move limit`);
  }
});

