export const PRODUCT_CATALOG = {
  milk: { label: "우유", short: "MILK", category: "chilled", categoryLabel: "냉장", color: "#5E78D6", shape: "carton" },
  juice: { label: "주스", short: "JUICE", category: "beverage", categoryLabel: "음료", color: "#F27A3F", shape: "bottle" },
  soda: { label: "소다", short: "SODA", category: "beverage", categoryLabel: "음료", color: "#4EA89C", shape: "can" },
  chips: { label: "칩", short: "CHIPS", category: "snack", categoryLabel: "과자", color: "#E9A63A", shape: "bag" },
  cookies: { label: "쿠키", short: "COOKIE", category: "snack", categoryLabel: "과자", color: "#C77B56", shape: "box" },
  yogurt: { label: "요거트", short: "YOGURT", category: "chilled", categoryLabel: "냉장", color: "#B86B8B", shape: "cup" },
  soap: { label: "솝", short: "SOAP", category: "home", categoryLabel: "생활", color: "#6E9D7D", shape: "pump" },
} as const;

export type ProductId = keyof typeof PRODUCT_CATALOG;
export type ProductCategory = (typeof PRODUCT_CATALOG)[ProductId]["category"];

export interface MartOrder {
  category: ProductCategory;
  count: number;
}

export interface MartLevel {
  id: number;
  title: string;
  products: ProductId[];
  shelfCount: number;
  seed: number;
  scrambleMoves: number;
  moveLimit: number | null;
  par: number;
  orders: MartOrder[];
  lockedShelf?: number;
  unlockAfterSets?: number;
}

export interface MartShelf {
  id: number;
  items: ProductId[];
  locked: boolean;
  basket?: boolean;
}

export interface MartMove {
  from: number;
  to: number;
}

export interface MartState {
  shelves: MartShelf[];
  completed: Partial<Record<ProductCategory, number>>;
  completedProducts: ProductId[];
  completedSequence: ProductCategory[];
  moves: number;
  flowIntact: boolean;
  status: "playing" | "won" | "lost";
  lastCompleted?: ProductId;
  lastError?: MoveError;
  basketAdded: boolean;
}

export type MoveError = "same-shelf" | "source-empty" | "source-locked" | "target-locked" | "target-full" | "type-mismatch";

export interface MoveResult {
  ok: boolean;
  state: MartState;
  error?: MoveError;
  setCompleted?: ProductId;
  orderCompleted?: ProductCategory;
}

export interface GeneratedLevel {
  shelves: ProductId[][];
  solution: MartMove[];
}

function cloneState(state: MartState): MartState {
  return {
    ...state,
    shelves: state.shelves.map((shelf) => ({ ...shelf, items: [...shelf.items] })),
    completed: { ...state.completed },
    completedProducts: [...state.completedProducts],
    completedSequence: [...state.completedSequence],
  };
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function isUniformSet(items: ProductId[]) {
  return items.length === 3 && items.every((item) => item === items[0]);
}

/**
 * Builds every board by making reversible moves away from a solved board.
 * Reversing the recorded moves is therefore a concrete solution, not a guess.
 */
export function generateLevel(level: MartLevel): GeneratedLevel {
  const activeShelfCount = level.products.length + 1;
  if (level.shelfCount < activeShelfCount) throw new Error(`Level ${level.id}: not enough shelves`);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const shelves: ProductId[][] = level.products.map((product) => [product, product, product]);
    while (shelves.length < level.shelfCount) shelves.push([]);
    const scramble: MartMove[] = [];

    // Touch every product shelf once so no completed set remains on the opening board.
    level.products.forEach((_, index) => {
      const to = index === 0 ? activeShelfCount - 1 : index - 1;
      const item = shelves[index].pop();
      if (!item) throw new Error(`Level ${level.id}: invalid product shelf`);
      shelves[to].push(item);
      scramble.push({ from: index, to });
    });

    const random = seededRandom(level.seed + attempt * 7919);
    let guard = 0;
    while (scramble.length < level.scrambleMoves && guard < level.scrambleMoves * 160) {
      guard += 1;
      const from = Math.floor(random() * activeShelfCount);
      const to = Math.floor(random() * activeShelfCount);
      if (from === to || shelves[from].length === 0 || shelves[to].length >= 3) continue;

      const source = shelves[from];
      const item = source[source.length - 1];
      const underneath = source[source.length - 2];
      // The inverse move must be legal later: its target will be empty or have the same top item.
      if (underneath !== undefined && underneath !== item) continue;
      const nextTarget = [...shelves[to], item];
      if (isUniformSet(nextTarget)) continue;

      source.pop();
      shelves[to].push(item);
      scramble.push({ from, to });
    }

    if (scramble.length === level.scrambleMoves) {
      return {
        shelves,
        solution: scramble.reverse().map((move) => ({ from: move.to, to: move.from })),
      };
    }
  }

  throw new Error(`Level ${level.id}: could not create requested scramble`);
}

export function createInitialState(level: MartLevel): MartState {
  const generated = generateLevel(level);
  return {
    shelves: generated.shelves.map((items, id) => ({
      id,
      items: [...items],
      locked: id === level.lockedShelf,
    })),
    completed: {},
    completedProducts: [],
    completedSequence: [],
    moves: 0,
    flowIntact: true,
    status: "playing",
    basketAdded: false,
  };
}

export function getMoveError(state: MartState, from: number, to: number): MoveError | null {
  if (from === to) return "same-shelf";
  const source = state.shelves[from];
  const target = state.shelves[to];
  if (!source || source.items.length === 0) return "source-empty";
  if (source.locked) return "source-locked";
  if (!target || target.locked) return "target-locked";
  if (target.items.length >= 3) return "target-full";
  const item = source.items[source.items.length - 1];
  const targetTop = target.items[target.items.length - 1];
  if (targetTop !== undefined && targetTop !== item) return "type-mismatch";
  return null;
}

export function canMove(state: MartState, from: number, to: number) {
  return getMoveError(state, from, to) === null;
}

function expectedCategoryAt(sequenceIndex: number, orders: MartOrder[]): ProductCategory | undefined {
  const expanded = orders.flatMap((order) => Array.from({ length: order.count }, () => order.category));
  return expanded[sequenceIndex];
}

export function areOrdersComplete(state: MartState, level: MartLevel) {
  return level.orders.every((order) => (state.completed[order.category] || 0) >= order.count);
}

export function hasAvailableMove(state: MartState) {
  if (state.status !== "playing") return false;
  for (let from = 0; from < state.shelves.length; from += 1) {
    for (let to = 0; to < state.shelves.length; to += 1) {
      if (canMove(state, from, to)) return true;
    }
  }
  return false;
}

export function moveItem(state: MartState, level: MartLevel, from: number, to: number): MoveResult {
  if (state.status !== "playing") return { ok: false, state };
  const error = getMoveError(state, from, to);
  if (error) return { ok: false, error, state: { ...state, lastError: error } };

  const next = cloneState(state);
  const item = next.shelves[from].items.pop() as ProductId;
  next.shelves[to].items.push(item);
  next.moves += 1;
  next.lastError = undefined;
  next.lastCompleted = undefined;

  let setCompleted: ProductId | undefined;
  let orderCompleted: ProductCategory | undefined;
  if (isUniformSet(next.shelves[to].items)) {
    setCompleted = item;
    next.shelves[to].items = [];
    const category = PRODUCT_CATALOG[item].category;
    const previousCategoryCount = next.completed[category] || 0;
    next.completed[category] = previousCategoryCount + 1;
    next.completedProducts.push(item);
    next.completedSequence.push(category);
    next.lastCompleted = item;
    if (expectedCategoryAt(next.completedSequence.length - 1, level.orders) !== category) next.flowIntact = false;

    const matchingOrder = level.orders.find((order) => order.category === category);
    if (matchingOrder && previousCategoryCount < matchingOrder.count && next.completed[category] === matchingOrder.count) {
      orderCompleted = category;
    }

    const unlockAt = level.unlockAfterSets || 0;
    if (unlockAt > 0 && next.completedProducts.length >= unlockAt) {
      next.shelves = next.shelves.map((shelf) => ({ ...shelf, locked: false }));
    }
  }

  if (next.completedProducts.length === level.products.length && areOrdersComplete(next, level)) {
    next.status = "won";
  } else if ((level.moveLimit !== null && next.moves >= level.moveLimit) || !hasAvailableMove(next)) {
    next.status = "lost";
  }

  return { ok: true, state: next, setCompleted, orderCompleted };
}

export function addBasketShelf(state: MartState): MartState {
  if (state.basketAdded || state.status !== "playing") return state;
  const next = cloneState(state);
  next.shelves.push({ id: next.shelves.length, items: [], locked: false, basket: true });
  next.basketAdded = true;
  return next;
}

export function undoMove(_current: MartState, previous: MartState | undefined): MartState | null {
  return previous ? cloneState(previous) : null;
}

export function calculateStars(state: MartState, level: MartLevel) {
  if (state.status !== "won") return 0;
  return 1 + (state.moves <= level.par ? 1 : 0) + (state.flowIntact ? 1 : 0);
}

export function validateLevel(level: MartLevel): string[] {
  const errors: string[] = [];
  if (level.id < 1 || level.id > 30) errors.push("id");
  if (level.shelfCount < 4 || level.shelfCount > 8) errors.push("shelfCount");
  if (level.products.length < 3 || level.products.length > 7) errors.push("products");
  if (new Set(level.products).size !== level.products.length) errors.push("duplicateProducts");
  if (level.orders.reduce((sum, order) => sum + order.count, 0) !== level.products.length) errors.push("orders");
  if (level.moveLimit !== null && level.moveLimit < level.scrambleMoves) errors.push("moveLimit");
  try {
    generateLevel(level);
  } catch {
    errors.push("generation");
  }
  return errors;
}
