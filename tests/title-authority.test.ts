// 칭호 권위 — resolver·정규화·카탈로그 매핑 단위 테스트 (05-09).
//
// 닫는 결함: 유료 칭호 39종(30~800 솜사탕)의 효과가 `text` 문자열 하나뿐이라
//   자유 입력창에 같은 글자를 치면 구매 결과와 **바이트 단위로 동일**했다.
//   → 여기서 "같은 문구를 입력해도 rarity·배지를 얻지 못한다"를 계약으로 고정한다.
import test from "node:test";
import assert from "node:assert/strict";
import { SHOP_ITEMS, itemKey } from "../lib/shopItems.ts";
import {
  resolveProfileTitle, normalizeCustomTitle, isValidCustomTitle,
  isTitleItemKey, titleCatalogText, titleCatalogRarity, titleCatalogSize,
  CUSTOM_TITLE_MAX, TITLE_TONE_ICON,
} from "../lib/titleAuthority.ts";

const TITLES = SHOP_ITEMS.filter((i) => i.slot === "title");
const K = (i: (typeof TITLES)[number]) => itemKey(i.slot, i.id);
const cheapest = [...TITLES].sort((a, b) => a.price - b.price)[0];
const priciest = [...TITLES].sort((a, b) => b.price - a.price)[0];
const rareOne = TITLES.find((i) => i.rarity === "rare")!;
const epicOne = TITLES.find((i) => i.rarity === "epic")!;
const legendOne = TITLES.find((i) => i.rarity === "legend")!;

// ═══ 1. 카탈로그 매핑 ═══════════════════════════════════════════════
test("카탈로그 크기가 상점 title 상품 수와 같다", () => {
  assert.equal(titleCatalogSize(), TITLES.length);
  assert.ok(TITLES.length >= 39);
});

test("모든 title 상품의 itemKey 가 인식된다", () => {
  for (const i of TITLES) assert.equal(isTitleItemKey(K(i)), true, i.id);
});

test("다른 카테고리 itemKey 는 title 로 인식되지 않는다", () => {
  for (const slot of ["bg", "frame", "pet", "sticker", "nameEffect", "bannerEffect"]) {
    const other = SHOP_ITEMS.find((i) => i.slot === slot)!;
    assert.equal(isTitleItemKey(itemKey(other.slot, other.id)), false, `${slot} 이 title 로 통과`);
  }
});

test("존재하지 않는 itemKey·형식 위반은 거부", () => {
  for (const bad of ["title::nope", "title::", "::x", "../../etc", "", null, 123, {}, [], "TITLE::" + cheapest.id]) {
    assert.equal(isTitleItemKey(bad), false, String(bad));
  }
});

test("카탈로그 rarity·text 는 아이템 정의와 일치한다", () => {
  for (const i of TITLES) {
    assert.equal(titleCatalogRarity(K(i)), i.rarity);
    assert.equal(titleCatalogText(K(i)), i.text);
    if (i.textEn) assert.equal(titleCatalogText(K(i), true), i.textEn);
  }
});

// ═══ 2. 정규화 ═════════════════════════════════════════════════════
test("NFC 정규화 — 분해형이 합성형으로 통일된다", () => {
  assert.equal(normalizeCustomTitle("é"), "é".normalize("NFC"));
  assert.equal([...normalizeCustomTitle("é")].length, 1);
});

test("제어문자·zero-width·bidi·BOM·줄바꿈이 제거된다", () => {
  const cases: Array<[string, string]> = [
    ["a\u0000b", "ab"], ["a\u0001\u001fb", "ab"], ["ab", "ab"], ["ab", "ab"],
    ["a​b", "ab"], ["a‎b", "ab"], ["a‮b", "ab"], ["a⁦b", "ab"], ["a﻿b", "ab"],
  ];
  for (const [input, want] of cases) assert.equal(normalizeCustomTitle(input), want, JSON.stringify(input));
  // 줄바꿈·탭은 공백으로 축약된 뒤 trim 된다
  assert.equal(normalizeCustomTitle("a\nb"), "a b");
  assert.equal(normalizeCustomTitle("a\tb"), "a b");
});

test("앞뒤 공백 제거 · 연속 공백 1칸 축약", () => {
  assert.equal(normalizeCustomTitle("  칭호  "), "칭호");
  assert.equal(normalizeCustomTitle("칭호    둘"), "칭호 둘");
  assert.equal(normalizeCustomTitle(" 칭호 "), "칭호");   // NBSP 도 \s 에 포함
});

test("★길이는 **코드포인트** 기준 24 다 (Rules 의 바이트 size() 로는 불가능한 계약)", () => {
  assert.equal(CUSTOM_TITLE_MAX, 24);
  assert.equal([...normalizeCustomTitle("가".repeat(25))].length, 24, "한글 25자 → 24");
  assert.equal([...normalizeCustomTitle("a".repeat(30))].length, 24, "영문 30자 → 24");
  assert.equal([...normalizeCustomTitle("🌱".repeat(30))].length, 24, "이모지 30개 → 24");
  // 참고: 같은 문자열의 UTF-8 바이트는 24 를 훨씬 넘는다 → Rules 로는 이 계약을 못 만든다.
  assert.ok(new TextEncoder().encode("가".repeat(24)).length > 24);
});

test("조합형 한글·긴 grapheme 도 안전하게 절단된다(깨진 서러게이트 없음)", () => {
  const out = normalizeCustomTitle("👨‍👩‍👧‍👦".repeat(10));
  assert.ok([...out].length <= 24);
  assert.equal(out, out.normalize("NFC"));
  // ⚠️ `/[\uD800-\uDFFF](?![\uDC00-\uDFFF])/` 같은 정규식은 **저위 서러게이트도 매치**해
  //    정상 이모지를 오탐한다. 코드포인트 왕복으로 검사하는 편이 정확하다.
  assert.equal([...out].join(""), out, "코드포인트 왕복 불일치(고아 서러게이트)");
  // ZWJ 는 제거 대상이므로 가족 이모지는 개별 이모지로 분해된다(의도된 계약).
  assert.ok(!out.includes("‍"), "ZWJ 가 남았다");
});

test("빈값·공백만·비문자열은 유효하지 않다", () => {
  for (const bad of ["", "   ", "​​", null, undefined, 123, {}, []]) {
    assert.equal(isValidCustomTitle(bad), false, String(bad));
    assert.equal(normalizeCustomTitle(bad), "");
  }
});

// ═══ 3. resolver 규칙 ①~⑦ ══════════════════════════════════════════
test("① catalog + 소유 → 카탈로그 text + rarity", () => {
  for (const i of [rareOne, epicOne, legendOne]) {
    const r = resolveProfileTitle({ titleMode: "catalog", titleId: K(i), ownedItems: [K(i)] });
    assert.equal(r.mode, "catalog");
    assert.equal(r.text, i.text);
    assert.equal(r.rarity, i.rarity);
    assert.equal(r.isVerifiedCatalog, true);
    assert.equal(r.itemId, K(i));
  }
});

test("①' catalog 인데 **미소유** → 중립(fail-safe), rarity 없음", () => {
  const r = resolveProfileTitle({ titleMode: "catalog", titleId: K(priciest), ownedItems: [], title: priciest.text });
  assert.equal(r.isVerifiedCatalog, false);
  assert.equal(r.rarity, null);
  assert.equal(r.tone, "neutral");
});

test("①' catalog 인데 **불명 id** → 중립", () => {
  const r = resolveProfileTitle({ titleMode: "catalog", titleId: "title::not_real", ownedItems: ["title::not_real"] });
  assert.equal(r.isVerifiedCatalog, false);
  assert.equal(r.rarity, null);
});

test("①' catalog 인데 **다른 카테고리 id** → 중립", () => {
  const bg = SHOP_ITEMS.find((i) => i.slot === "bg" && i.price > 0)!;
  const key = itemKey(bg.slot, bg.id);
  const r = resolveProfileTitle({ titleMode: "catalog", titleId: key, ownedItems: [key] });
  assert.equal(r.isVerifiedCatalog, false);
  assert.equal(r.rarity, null);
});

test("★② custom 에 **유료 칭호와 똑같은 문구**를 넣어도 rarity·배지를 얻지 못한다", () => {
  for (const i of [cheapest, priciest, legendOne]) {
    const r = resolveProfileTitle({ titleMode: "custom", customTitle: i.text, ownedItems: [] });
    assert.equal(r.text, normalizeCustomTitle(i.text), "표시 문자열 자체는 허용된다(제품 결정)");
    assert.equal(r.mode, "custom");
    assert.equal(r.rarity, null, `${i.id}: rarity 를 얻었다`);
    assert.equal(r.isVerifiedCatalog, false);
    assert.equal(r.tone, "neutral");
    assert.equal(TITLE_TONE_ICON[r.tone], "", "배지 아이콘이 붙었다");
  }
});

test("★② 해당 아이템을 **보유하고 있어도** custom 모드면 중립이다", () => {
  const r = resolveProfileTitle({ titleMode: "custom", customTitle: legendOne.text, ownedItems: [K(legendOne)] });
  assert.equal(r.rarity, null);
  assert.equal(r.isVerifiedCatalog, false);
});

test("③ legacy(신규필드 없음) + 카탈로그 문자열 + 소유 → catalog 로 안전 해석", () => {
  const r = resolveProfileTitle({ title: epicOne.text, ownedItems: [K(epicOne)] });
  assert.equal(r.mode, "catalog");
  assert.equal(r.rarity, epicOne.rarity);
  assert.equal(r.isVerifiedCatalog, true);
});

test("★④ legacy + 카탈로그 문자열이지만 **미소유** → 중립만(유료 효과 금지)", () => {
  for (const i of TITLES.slice(0, 12)) {
    const r = resolveProfileTitle({ title: i.text, ownedItems: [] });
    assert.equal(r.rarity, null, `${i.id}: 미소유인데 rarity 획득`);
    assert.equal(r.isVerifiedCatalog, false);
    // 표시는 유지하되 위생 처리는 거친다(ZWJ 제거 등) — 지우지 않는다는 계약은 그대로다.
    assert.equal(r.text, normalizeCustomTitle(i.text), "표시가 사라졌다");
    assert.ok(r.text.length > 0);
  }
});

test("④ 영어 표기로 저장된 legacy 도 동일하게 판정된다", () => {
  const withEn = TITLES.find((i) => i.textEn)!;
  assert.equal(resolveProfileTitle({ title: withEn.textEn, ownedItems: [] }).rarity, null);
  assert.equal(resolveProfileTitle({ title: withEn.textEn, ownedItems: [K(withEn)] }).isVerifiedCatalog, true);
});

test("⑤ legacy 일반 커스텀 문자열 → 중립", () => {
  const r = resolveProfileTitle({ title: "내가 직접 쓴 칭호", ownedItems: [] });
  assert.equal(r.mode, "custom");
  assert.equal(r.rarity, null);
  assert.equal(r.text, "내가 직접 쓴 칭호");
});

test("⑥ none → 아무것도 표시하지 않는다(보유 중이어도)", () => {
  const r = resolveProfileTitle({ titleMode: "none", title: legendOne.text, titleId: K(legendOne), ownedItems: [K(legendOne)] });
  assert.equal(r.text, "");
  assert.equal(r.mode, "none");
  assert.equal(r.rarity, null);
});

test("⑦ 손상 데이터 → 안전한 기본값", () => {
  const bad = [
    { title: 12345 }, { title: null }, { title: {} }, { title: [] },
    { titleMode: 7, title: "x" }, { titleMode: "catalog", titleId: 9, ownedItems: "nope" },
    { ownedItems: { a: 1 }, title: legendOne.text },
    null, undefined, "string", 42,
  ];
  for (const src of bad) {
    const r = resolveProfileTitle(src as never);
    assert.ok(typeof r.text === "string");
    assert.equal(r.rarity, null, JSON.stringify(src));
    assert.equal(r.isVerifiedCatalog, false);
  }
});

test("⑦ 과도한 길이·제어문자가 섞인 legacy 도 절단·정화된다", () => {
  const r = resolveProfileTitle({ title: "가".repeat(100) + "\u0000‮" });
  assert.ok([...r.text].length <= CUSTOM_TITLE_MAX);
  assert.ok(!/[\u0000-\u001f‪-‮]/.test(r.text));
});

test("ownedItems 에 비문자열이 섞여도 판정이 무너지지 않는다", () => {
  const r = resolveProfileTitle({ titleMode: "catalog", titleId: K(rareOne), ownedItems: [null, 1, {}, K(rareOne)] as never });
  assert.equal(r.isVerifiedCatalog, true, "정상 항목은 인식돼야 한다");
  const r2 = resolveProfileTitle({ titleMode: "catalog", titleId: K(rareOne), ownedItems: [null, 1, {}] as never });
  assert.equal(r2.isVerifiedCatalog, false);
});

// ═══ 4. 스타일 토큰 안전성 ══════════════════════════════════════════
test("tone 은 고정 4종뿐이고 사용자 문자열이 섞이지 않는다", () => {
  const tones = new Set<string>();
  for (const src of [
    { titleMode: "catalog", titleId: K(legendOne), ownedItems: [K(legendOne)] },
    { titleMode: "custom", customTitle: "<script>alert(1)</script>" },
    { title: "bg-red-500 ring-4" },
    { titleMode: "none" },
  ]) tones.add(resolveProfileTitle(src as never).tone);
  for (const t of tones) assert.ok(["neutral", "rare", "epic", "legend"].includes(t), t);
});

test("★HTML·클래스 문자열을 넣어도 그대로 '텍스트'로만 남는다", () => {
  const r = resolveProfileTitle({ titleMode: "custom", customTitle: "<b onclick=x>hi</b>" });
  assert.equal(r.tone, "neutral");
  assert.equal(r.rarity, null);
  // 값은 보존되지만(렌더러가 텍스트 노드로 출력) 스타일 판단에는 전혀 쓰이지 않는다
  assert.ok(r.text.includes("<b"));
});

test("rarity 별 아이콘이 서로 다르다(색만으로 구분하지 않는다)", () => {
  const icons = [TITLE_TONE_ICON.rare, TITLE_TONE_ICON.epic, TITLE_TONE_ICON.legend];
  assert.equal(new Set(icons).size, 3);
  assert.equal(TITLE_TONE_ICON.neutral, "", "중립에는 배지 아이콘이 없어야 한다");
});

// ═══ 5. N+1 방지 ═══════════════════════════════════════════════════
test("resolver 는 순수 함수다 — 비동기·네트워크 호출이 없다", () => {
  const out = resolveProfileTitle({ titleMode: "catalog", titleId: K(rareOne), ownedItems: [K(rareOne)] });
  assert.ok(!(out instanceof Promise));
  assert.equal(typeof resolveProfileTitle, "function");
  assert.equal(resolveProfileTitle.constructor.name, "Function", "async 함수가 아니어야 한다");
});
