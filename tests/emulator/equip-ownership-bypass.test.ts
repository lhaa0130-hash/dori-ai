// 🔴 재현 테스트 — 유료 꾸미기 아이템을 **구매하지 않고 장착·전시**할 수 있는가?
//
// 배경: 05-07 릴리스는 `ownedItems`(보유 목록)와 `cottonCandy`(잔액)를 Rules 로 잠갔다.
//       그러나 **장착 상태**(bg/frame/title/nameEffect/bannerEffect/pet/stickers)는
//       `saveMyProfile()` 이 users/{uid} 에 직접 쓰고, Rules 의 rewardFieldNames() 에 없다.
//       그리고 /profile 의 소유 판정은 `Firestore ownedItems ∪ localStorage 캐시` 합집합이다.
//
// 이 테스트는 "잔액·보유 목록은 잠겼는데 **효과는 공짜로 쓸 수 있는가**" 를 실측한다.
// ⚠️ 감사 목적의 재현이며 Production 에는 어떤 요청도 보내지 않는다.
import test from "node:test";
import assert from "node:assert/strict";
import { prepareEmulatorEnv, clearFirestore, signInTestUser, DEMO_PROJECT_ID } from "./harness.ts";
import { SHOP_ITEMS, itemKey } from "../../lib/shopItems.ts";

prepareEmulatorEnv();

const { initializeApp, deleteApp } = await import("firebase/app");
const { getAuth, connectAuthEmulator } = await import("firebase/auth");
const { getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc, getDoc } = await import("firebase/firestore");

const app = initializeApp({ projectId: DEMO_PROJECT_ID, apiKey: "demo-key" }, "equip-bypass");
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);

async function attempt(fn: () => Promise<unknown>) {
  try { await fn(); return "allowed" as const; } catch { return "denied" as const; }
}

// 가장 비싼 유료 아이템들을 슬롯별로 하나씩 고른다(공격 가치가 가장 큰 대상).
const priciest = (slot: string) =>
  SHOP_ITEMS.filter((i) => i.slot === slot && i.price > 0).sort((a, b) => b.price - a.price)[0];

let uid = "";

test("setup", async () => {
  await clearFirestore();
  const me = await signInTestUser(auth, "equip-bypass");
  uid = me.uid;
  await setDoc(doc(db, "users", uid), {
    uid, name: "tester", tier: 1, level: 1, doriExp: 0,
    cottonCandy: 0, cottonCandyTotal: 0,          // ← 잔액 0. 아무것도 살 수 없다.
  });
  const snap = await getDoc(doc(db, "users", uid));
  assert.equal((snap.data() as Record<string, unknown>).cottonCandy, 0);
});

test("전제 1 — 잔액은 잠겨 있다(직접 증가 불가)", async () => {
  assert.equal(await attempt(() => updateDoc(doc(db, "users", uid), { cottonCandy: 99999 })), "denied");
});

test("전제 2 — 보유 목록은 잠겨 있다(직접 추가 불가)", async () => {
  const bg = priciest("bg");
  assert.equal(
    await attempt(() => updateDoc(doc(db, "users", uid), { ownedItems: [itemKey(bg.slot, bg.id)] })),
    "denied",
  );
});

test("🔴 그런데 — 장착 필드는 소유 검증 없이 저장된다", async () => {
  // saveMyProfile() 이 쓰는 필드 그대로. 값 검증도, 소유 검증도 없다.
  const bg = priciest("bg"), frame = priciest("frame"), title = priciest("title");
  const nameEffect = priciest("nameEffect"), bannerEffect = priciest("bannerEffect"), pet = priciest("pet");

  const r = await attempt(() => setDoc(doc(db, "users", uid), {
    bg: bg.id, frame: frame.id, title: title.text ?? title.id,
    nameEffect: nameEffect.id, bannerEffect: bannerEffect.id, pet: pet.id,
    stickers: [priciest("sticker")?.emoji ?? "💎"],
    updatedAt: new Date().toISOString(),
  }, { merge: true }));

  assert.equal(r, "allowed", "장착 필드 저장이 거부됐다면 이 결함은 없는 것이다");

  const saved = (await getDoc(doc(db, "users", uid))).data() as Record<string, unknown>;
  assert.equal(saved.bg, bg.id);
  assert.equal(saved.frame, frame.id);
  assert.equal(saved.nameEffect, nameEffect.id);

  const totalPrice = [bg, frame, title, nameEffect, bannerEffect, pet].reduce((s, i) => s + (i?.price || 0), 0);
  console.log(`\n     🔴 잔액 0 · ownedItems 비어 있음 상태에서`);
  console.log(`        유료 아이템 6종(정가 합 ${totalPrice} 솜사탕)을 장착 상태로 저장 성공`);
  console.log(`        ownedItems=${JSON.stringify(saved.ownedItems ?? null)}  cottonCandy=${saved.cottonCandy}`);
});

test("🔴 공개 문서라 다른 사용자에게도 그대로 보인다", async () => {
  // users/{uid} 는 `allow read: if true` — 비로그인 포함 누구나 읽는다.
  // 따라서 장착 값은 타인의 화면에도 렌더된다(코지홈·프로필·게시물 작성자 표시 등).
  const snap = await getDoc(doc(db, "users", uid));
  const d = snap.data() as Record<string, unknown>;
  assert.ok(d.bg && d.frame, "장착 값이 공개 문서에 남아 있다");
});

test("소유 판정이 로컬 캐시 합집합이라 UI 도 '보유'로 표시한다(코드 계약 확인)", () => {
  // app/profile/page.tsx:914-918
  //   ownedSet = new Set([...(profile?.ownedItems || []), ...getOwnedShopItems(myEmail)])
  //   isItemOwned = it.price === 0 || ownedSet.has(itemKey(...))
  // → localStorage 캐시에 넣기만 하면 선택 UI 가 열린다.
  const firestoreOwned: string[] = [];                       // 서버는 비어 있다
  const localCache = [itemKey(priciest("bg").slot, priciest("bg").id)];  // 조작된 로컬 캐시
  const ownedSet = new Set<string>([...firestoreOwned, ...localCache]);
  assert.equal(ownedSet.has(localCache[0]), true, "로컬 캐시만으로 '보유' 판정이 성립한다");
});

test("hydrateGameData 가 서버 값으로 덮지 않고 합집합을 유지한다(코드 계약 확인)", () => {
  // lib/cottonCandy.ts hydrateGameData:
  //   const merged = Array.from(new Set([...(d.ownedItems as string[]), ...local]));
  // → 새로고침해도 조작된 로컬 항목이 살아남는다. (cottonCandy 는 반대로 서버 값을 무조건 채택)
  const server: string[] = [];
  const local = ["bg::forged"];
  const merged = Array.from(new Set([...server, ...local]));
  assert.deepEqual(merged, ["bg::forged"], "새로고침 후에도 조작 항목이 남는다");
});

test("teardown", async () => { await deleteApp(app).catch(() => { /* noop */ }); });
