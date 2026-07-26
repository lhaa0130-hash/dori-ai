// Phase 7 — 서버 카탈로그 ↔ 클라 상점 정합성 (감사 브랜치 신규)
//
// 기존 tests/shop-catalog.test.ts 는 "서버가 클라 품목을 담는가 / 가격 위조 거부"를 본다.
// 이 파일은 **카탈로그 자체의 건전성**을 본다 — 중복 키, orphan, 비정상 가격, 렌더 필드 누락 등
// "배포 후에야 드러나는" 데이터 결함을 배포 전에 잡는다.
//
// ⚠️ 가격 값 자체는 **변경하지 않는다**. 여기서는 검증만 한다.
import test from "node:test";
import assert from "node:assert/strict";
import { SHOP_ITEMS, itemKey, RARITY_META, type ShopItem } from "../lib/shopItems.ts";
import {
  getCatalogEntry, isPurchasable, catalogSize, purchaseOperationId, isValidItemKey,
} from "../functions/_shared/shopCatalog.ts";

const KEYS = SHOP_ITEMS.map((i) => itemKey(i.slot, i.id));
const PAID = SHOP_ITEMS.filter((i) => i.price > 0);
const FREE = SHOP_ITEMS.filter((i) => !i.price);

// ── 1. 키 무결성 ────────────────────────────────────────────────────────
test("itemKey 중복이 없다", () => {
  const dup = KEYS.filter((k, i) => KEYS.indexOf(k) !== i);
  assert.deepEqual([...new Set(dup)], [], `중복 itemKey: ${[...new Set(dup)].join(", ")}`);
});

test("모든 itemKey 가 서버 형식 검증을 통과한다", () => {
  const bad = KEYS.filter((k) => !isValidItemKey(k));
  assert.deepEqual(bad, [], `형식 위반: ${bad.join(", ")}`);
});

test("id 에 구분자(::)나 경로 문자가 섞이지 않는다", () => {
  const bad = SHOP_ITEMS.filter((i) => /[:/\\.\s]/.test(i.id));
  assert.deepEqual(bad.map((i) => i.id), [], "id 에 위험 문자");
});

test("클라 카탈로그와 서버 카탈로그의 크기가 같다(orphan 없음)", () => {
  assert.equal(catalogSize(), SHOP_ITEMS.length);
});

test("클라에만 있는 아이템 0건 · 서버에만 있는 아이템 0건", () => {
  const missingOnServer = KEYS.filter((k) => getCatalogEntry(k) === null);
  assert.deepEqual(missingOnServer, [], "서버 카탈로그 누락");
  // 서버 카탈로그는 클라 배열에서만 만들어지므로 역방향은 크기 비교로 충분하다.
  assert.equal(catalogSize(), new Set(KEYS).size);
});

// ── 2. 가격 건전성 ──────────────────────────────────────────────────────
test("가격은 전부 유한한 0 이상 정수다", () => {
  const bad = SHOP_ITEMS.filter((i) => !Number.isFinite(i.price) || !Number.isInteger(i.price) || i.price < 0);
  assert.deepEqual(bad.map((i) => `${i.id}=${i.price}`), [], "비정상 가격");
});

test("서버가 읽는 가격이 클라 카탈로그 가격과 정확히 같다", () => {
  const mismatch: string[] = [];
  for (const it of SHOP_ITEMS) {
    const e = getCatalogEntry(itemKey(it.slot, it.id));
    if (!e) { mismatch.push(`${it.id}: 서버에 없음`); continue; }
    if (e.price !== Math.max(0, Math.floor(Number(it.price) || 0))) {
      mismatch.push(`${it.id}: 클라 ${it.price} vs 서버 ${e.price}`);
    }
  }
  assert.deepEqual(mismatch, []);
});

test("가격이 비상식적으로 크지 않다(오타 방어)", () => {
  // 전역 일일 상한 600 · 출석 250 을 감안하면 상한 100,000 은 충분히 여유롭다.
  const MAX = 100_000;
  const bad = PAID.filter((i) => i.price > MAX);
  assert.deepEqual(bad.map((i) => `${i.id}=${i.price}`), [], `가격 ${MAX} 초과`);
});

test("무료(0) 아이템은 구매 대상이 아니고, 유료는 전부 구매 대상이다", () => {
  for (const it of FREE) {
    const e = getCatalogEntry(itemKey(it.slot, it.id))!;
    assert.equal(isPurchasable(e), false, `${it.id} 무료인데 구매 가능`);
  }
  for (const it of PAID) {
    const e = getCatalogEntry(itemKey(it.slot, it.id))!;
    assert.equal(isPurchasable(e), true, `${it.id} 유료인데 구매 불가`);
  }
});

// ── 3. operationId 충돌 ─────────────────────────────────────────────────
test("유료 아이템의 구매 operationId 가 서로 충돌하지 않는다", () => {
  const ops = PAID.map((i) => purchaseOperationId(getCatalogEntry(itemKey(i.slot, i.id))!));
  assert.equal(new Set(ops).size, ops.length, "operationId 충돌 — 서로 다른 아이템이 같은 멱등 키를 쓴다");
});

test("구매 operationId 는 Firestore 문서 id 로 안전하다", () => {
  // 슬래시·마침표·과길이는 문서 경로를 깨뜨린다.
  for (const i of PAID) {
    const op = purchaseOperationId(getCatalogEntry(itemKey(i.slot, i.id))!);
    assert.ok(/^[A-Za-z0-9_-]{1,120}$/.test(op), `${i.id} → ${op}`);
    assert.notEqual(op, ".");
    assert.notEqual(op, "..");
  }
});

// ── 4. 렌더 필드 정합 (배포 후 깨져 보이는 결함) ────────────────────────
test("모든 아이템의 rarity 가 RARITY_META 에 존재한다", () => {
  const bad = SHOP_ITEMS.filter((i) => !RARITY_META[i.rarity]);
  assert.deepEqual(bad.map((i) => `${i.id}=${i.rarity}`), []);
});

const REQUIRED_FIELD: Partial<Record<ShopItem["slot"], keyof ShopItem>> = {
  bg: "grad", frame: "ring", nameEffect: "nameClass", bannerEffect: "fx", title: "text", sticker: "emoji",
};

test("★유료 아이템은 반드시 렌더 필드가 채워져 있다(돈 내고 안 보이는 일 금지)", () => {
  const missing: string[] = [];
  for (const it of PAID) {
    const need = REQUIRED_FIELD[it.slot];
    if (!need) continue;                                  // pet 등은 필수 필드 없음
    const v = it[need];
    if (typeof v !== "string" || v.trim() === "") missing.push(`${it.slot}::${it.id}(${it.price}) → ${String(need)} 없음`);
  }
  assert.deepEqual(missing, [], "유료인데 화면에 아무것도 렌더되지 않는 아이템");
});

test("무료 아이템의 렌더 필드는 정의돼 있어야 한다(빈 문자열은 '효과 없음'으로 허용)", () => {
  // nameEffect::none 은 nameClass: "" 가 **의도된 기본값**이다(기본 이름 색 = 클래스 없음).
  // 따라서 "빈 문자열"은 허용하되, **필드 자체가 undefined 인 것**은 실수로 본다.
  const undef: string[] = [];
  for (const it of FREE) {
    const need = REQUIRED_FIELD[it.slot];
    if (!need) continue;
    if (typeof it[need] !== "string") undef.push(`${it.slot}::${it.id} → ${String(need)} 미정의`);
  }
  assert.deepEqual(undef, [], "무료 아이템의 렌더 필드가 아예 없다");
});

test("의도적으로 빈 렌더 필드를 가진 아이템은 무료 기본값뿐이다", () => {
  const empties = SHOP_ITEMS.filter((it) => {
    const need = REQUIRED_FIELD[it.slot];
    return need && it[need] === "";
  });
  // 목록을 고정해 둔다 — 새 항목이 여기 끼면 테스트가 알려준다.
  assert.deepEqual(
    empties.map((i) => `${i.slot}::${i.id}`).sort(),
    ["nameEffect::none"],
    "빈 렌더 필드를 가진 아이템이 늘었다 — 의도인지 확인 필요",
  );
  assert.ok(empties.every((i) => i.price === 0), "빈 렌더 필드인데 유료인 아이템이 있다");
});

test("이름·설명이 비어 있지 않다", () => {
  const bad = SHOP_ITEMS.filter((i) => !i.name?.trim() || !i.desc?.trim());
  assert.deepEqual(bad.map((i) => i.id), []);
});

test("영어판 표기가 있으면 빈 문자열이 아니다", () => {
  const bad = SHOP_ITEMS.filter((i) => (i.nameEn !== undefined && !i.nameEn.trim()) || (i.descEn !== undefined && !i.descEn.trim()));
  assert.deepEqual(bad.map((i) => i.id), []);
});

// ── 5. 소유 판정 계약 ───────────────────────────────────────────────────
test("무료 아이템은 ownedItems 없이도 보유로 취급된다(UI 계약)", () => {
  // app/shop/page.tsx:301 · app/profile/page.tsx:918 이 `it.price === 0 || ownedSet.has(key)` 로 판정한다.
  // 즉 무료 아이템이 서버 구매 대상이 아니어도 UI 는 보유로 보여준다 → 계약 일치 확인.
  assert.ok(FREE.length >= 0);
  for (const it of FREE) {
    assert.equal(isPurchasable(getCatalogEntry(itemKey(it.slot, it.id))!), false);
  }
});

test("숨김·판매중단 개념이 카탈로그에 없다(있다면 서버도 알아야 한다)", () => {
  // 현재 스키마에는 hidden/retired 필드가 없다. 나중에 추가하면 서버 카탈로그도 반영해야 하므로
  // 이 테스트가 실패해서 알려준다.
  const withFlags = SHOP_ITEMS.filter((i) => "hidden" in i || "retired" in i || "disabled" in i);
  assert.deepEqual(withFlags.map((i) => i.id), [],
    "숨김/판매중단 플래그가 생겼다 — functions/_shared/shopCatalog.ts 의 isPurchasable 에도 반영해야 한다");
});

// ── 6. 규모 요약(회귀 감지) ─────────────────────────────────────────────
test("카탈로그 규모 요약", () => {
  console.log(`     총 ${SHOP_ITEMS.length}개 (유료 ${PAID.length} · 무료 ${FREE.length})`);
  const bySlot: Record<string, number> = {};
  for (const i of SHOP_ITEMS) bySlot[i.slot] = (bySlot[i.slot] || 0) + 1;
  console.log(`     슬롯별: ${Object.entries(bySlot).map(([k, v]) => `${k}=${v}`).join(" · ")}`);
  const prices = PAID.map((i) => i.price).sort((a, b) => a - b);
  console.log(`     가격 범위: ${prices[0]} ~ ${prices[prices.length - 1]}`);
  assert.ok(SHOP_ITEMS.length > 0);
});
