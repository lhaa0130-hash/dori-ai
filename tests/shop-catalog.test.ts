import assert from "node:assert/strict";
import test from "node:test";
import {
  getCatalogEntry, isPurchasable, isValidItemKey, purchaseOperationId,
  sanitizePurchaseRequest, catalogSize,
} from "../functions/_shared/shopCatalog.ts";
import { SHOP_ITEMS, itemKey } from "../lib/shopItems.ts";

const paid = SHOP_ITEMS.find((i) => i.price > 0)!;
const free = SHOP_ITEMS.find((i) => i.price === 0)!;
const paidKey = itemKey(paid.slot, paid.id);
const freeKey = itemKey(free.slot, free.id);

test("서버 카탈로그가 클라 카탈로그 전 품목을 담는다", () => {
  assert.equal(catalogSize(), SHOP_ITEMS.length);
  assert.ok(SHOP_ITEMS.length > 100);
});

test("가격은 서버 카탈로그가 소유한다(클라 값과 무관)", () => {
  const e = getCatalogEntry(paidKey)!;
  assert.equal(e.price, paid.price);
  assert.ok(e.price > 0);
});

test("itemKey 형식 검증 — 위조·경로주입 차단", () => {
  assert.equal(isValidItemKey(paidKey), true);
  for (const bad of ["", "nope", "bg::", "::x", "bg::../../x", "bg::a b", "a".repeat(80) + "::x", 123, null, {}]) {
    assert.equal(isValidItemKey(bad), false, String(bad));
  }
});

test("존재하지 않는 아이템은 거부", () => {
  assert.equal(getCatalogEntry("bg::__nope__"), null);
  assert.equal(sanitizePurchaseRequest({ itemKey: "bg::__nope__" }).ok, false);
});

test("무료(price 0) 아이템은 구매 대상이 아니다", () => {
  const e = getCatalogEntry(freeKey)!;
  assert.equal(isPurchasable(e), false);
  const r = sanitizePurchaseRequest({ itemKey: freeKey });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error, "item_not_purchasable");
});

test("클라이언트가 권위값을 보내면 전부 거부", () => {
  const ok = sanitizePurchaseRequest({ itemKey: paidKey });
  assert.equal(ok.ok, true);
  for (const bad of ["price", "amount", "balance", "cottonCandy", "cottonCandyTotal",
                     "uid", "email", "reward", "item", "ownedItems", "isPremium", "quantity"]) {
    const r = sanitizePurchaseRequest({ itemKey: paidKey, [bad]: 0 });
    assert.equal(r.ok, false, bad + " 는 거부돼야 한다");
    if (!r.ok) assert.equal(r.error, "forbidden_field:" + bad);
  }
  // 알 수 없는 필드도 거부
  assert.equal(sanitizePurchaseRequest({ itemKey: paidKey, weird: 1 }).ok, false);
});

test("⭐ price=0 위조 시도해도 서버 가격이 쓰인다", () => {
  // 클라가 price 를 실어 보내면 아예 요청이 거부되고,
  const r = sanitizePurchaseRequest({ itemKey: paidKey, price: 0 });
  assert.equal(r.ok, false);
  // 정상 요청에서는 서버 카탈로그 가격만 노출된다.
  const ok = sanitizePurchaseRequest({ itemKey: paidKey });
  assert.ok(ok.ok && ok.entry.price === paid.price && ok.entry.price > 0);
});

test("operationId 는 아이템에 고정 — 같은 아이템 재요청은 자연 멱등", () => {
  const e = getCatalogEntry(paidKey)!;
  const a = purchaseOperationId(e);
  const b = purchaseOperationId(getCatalogEntry(paidKey)!);
  assert.equal(a, b);
  assert.match(a, /^buy_[a-zA-Z]+__[A-Za-z0-9_-]+$/);
  // 다른 아이템은 다른 키
  const other = SHOP_ITEMS.find((i) => i.price > 0 && itemKey(i.slot, i.id) !== paidKey)!;
  assert.notEqual(a, purchaseOperationId(getCatalogEntry(itemKey(other.slot, other.id))!));
});

test("모든 유료 아이템이 유효한 operationId 를 만든다(충돌 없음)", () => {
  const keys = new Set<string>();
  let paidCount = 0;
  for (const it of SHOP_ITEMS) {
    const e = getCatalogEntry(itemKey(it.slot, it.id))!;
    assert.ok(e, itemKey(it.slot, it.id));
    if (!isPurchasable(e)) continue;
    paidCount += 1;
    const op = purchaseOperationId(e);
    assert.equal(keys.has(op), false, "operationId 충돌: " + op);
    keys.add(op);
  }
  assert.ok(paidCount > 100, "유료 아이템 수: " + paidCount);
});
