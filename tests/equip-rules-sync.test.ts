// 장착 소유권 Rules 블록 ↔ 상점 카탈로그 동기화 가드.
//
// ⚠️ Firestore Rules 에는 반복문이 없어 카탈로그 일부(슬롯별 무료 id, 유료 스티커 이모지 맵)를
//    생성해 박아 넣는다. 상점에 아이템을 추가하고 Rules 를 재생성하지 않으면
//    "새 유료 아이템이 무료처럼 통과" 하거나 "새 무료 아이템이 장착 불가" 가 된다.
//    이 테스트가 그 실수를 배포 전에 잡는다.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SHOP_ITEMS, FREE_STICKERS, itemKey } from "../lib/shopItems.ts";
import { buildRulesBlock, extractBlock, ID_SLOTS } from "../scripts/gen-equip-rules.mjs";

const RULES = readFileSync(fileURLToPath(new URL("../firestore.rules", import.meta.url)), "utf8");
const norm = (s: string) => s.replace(/\r\n/g, "\n").trimEnd();

test("firestore.rules 의 생성 블록이 현재 카탈로그와 일치한다", () => {
  const cur = extractBlock(RULES);
  assert.ok(cur, "생성 블록(BEGIN/END 마커)이 firestore.rules 에 없다");
  assert.equal(
    norm(cur as string), norm(buildRulesBlock()),
    "카탈로그가 바뀌었는데 Rules 를 재생성하지 않았다 → `npm run gen:equip-rules` 실행",
  );
});

test("id 기반 5개 슬롯이 전부 Rules 에서 검사된다", () => {
  for (const slot of ID_SLOTS) {
    assert.ok(RULES.includes(`freeIds_${slot}()`), `freeIds_${slot} 없음`);
    assert.ok(RULES.includes(`equipFieldOk('${slot}'`), `${slot} 검사 호출 없음`);
  }
});

test("장착 검사가 users create·update 양쪽에 걸려 있다", () => {
  assert.ok(/allow create:[\s\S]{0,400}?equipSafeOnCreate\(\)/.test(RULES), "create 에 equipSafeOnCreate 없음");
  assert.ok(/allow update:[\s\S]{0,400}?equipOwnedOnUpdate\(\)/.test(RULES), "update 에 equipOwnedOnUpdate 없음");
});

test("★request.resource.data.ownedItems 를 신뢰하지 않는다(기존 값 기준 판정)", () => {
  // ownedNow() 는 반드시 resource.data(=기존 문서)에서 읽어야 한다.
  assert.ok(/function ownedNow\(\)\s*\{\s*return resource\.data\.get\('ownedItems', \[\]\);/.test(RULES),
    "ownedNow() 가 resource.data 기준이 아니다");
  const bad = /ownedNow[\s\S]{0,120}request\.resource\.data\.get\('ownedItems'/.test(RULES);
  assert.equal(bad, false, "요청 본문의 ownedItems 를 소유 판정에 썼다");
});

test("무료 아이템이 전부 Rules 의 무료 목록에 들어 있다", () => {
  for (const slot of ID_SLOTS) {
    const free = SHOP_ITEMS.filter((i) => i.slot === slot && !(i.price > 0)).map((i) => i.id);
    const m = RULES.match(new RegExp(`function freeIds_${slot}\\(\\) \\{ return \\[([^\\]]*)\\]`));
    assert.ok(m, `freeIds_${slot} 파싱 실패`);
    const listed = (m![1].match(/'([^']*)'/g) || []).map((s) => s.slice(1, -1));
    for (const id of free) assert.ok(listed.includes(id), `${slot}::${id}(무료)가 Rules 목록에 없다`);
  }
});

test("★유료 아이템 id 는 무료 목록에 절대 없어야 한다", () => {
  for (const slot of ID_SLOTS) {
    const paid = SHOP_ITEMS.filter((i) => i.slot === slot && i.price > 0).map((i) => i.id);
    const m = RULES.match(new RegExp(`function freeIds_${slot}\\(\\) \\{ return \\[([^\\]]*)\\]`));
    const listed = (m![1].match(/'([^']*)'/g) || []).map((s) => s.slice(1, -1));
    for (const id of paid) assert.ok(!listed.includes(id), `${slot}::${id} 는 유료인데 무료 목록에 있다`);
  }
});

test("유료 스티커 이모지가 전부 매핑돼 있다(무료와 겹치는 것 제외)", () => {
  const paid = SHOP_ITEMS.filter((i) => i.slot === "sticker" && i.price > 0 && i.emoji && !FREE_STICKERS.includes(i.emoji));
  for (const it of paid) {
    assert.ok(RULES.includes(`'${it.emoji}': '${itemKey(it.slot, it.id)}'`), `스티커 ${it.emoji}(${it.id}) 매핑 없음`);
  }
});

test("스티커 이모지는 카탈로그 전체에서 유일하다(역매핑 전제)", () => {
  const e = SHOP_ITEMS.filter((i) => i.slot === "sticker").map((i) => i.emoji);
  const dup = [...new Set(e.filter((x, i) => e.indexOf(x) !== i))];
  assert.deepEqual(dup, [], "이모지가 중복되면 emoji→itemKey 역매핑이 성립하지 않는다");
});

test("스티커 개수 상한(6)이 Rules 에도 있다", () => {
  assert.ok(RULES.includes("size() <= 6"), "스티커 개수 상한이 Rules 에 없다");
});

test("title 은 이번 범위에서 잠그지 않는다(의도 고정)", () => {
  // 자유 입력창이 있어 Rules 로 막으면 제품 기능이 사라진다 — docs/equipment-authority-decision.md §5.
  assert.equal(/equipFieldOk\('title'/.test(RULES), false,
    "title 을 잠갔다면 자유 입력 기능이 깨진다 — 의도적 변경이라면 설계 문서를 먼저 갱신할 것");
});
