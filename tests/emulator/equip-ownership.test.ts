// 결함 A — 장착(전시) 소유권 계약 테스트.
//
// 수정 전(main 의 firestore.rules): 아래 "거부" 케이스가 전부 통과해 버린다 → 테스트 실패.
// 수정 후(이 브랜치): 거부는 거부되고 정상 동작은 그대로 통과한다.
//   before/after 증명 방법은 scripts/verify-equip-fix.mjs 참고.
//
// ⚠️ Production 요청 0건. 로컬 Firebase 에뮬레이터에서만 실행한다.
import test from "node:test";
import assert from "node:assert/strict";
import { prepareEmulatorEnv, clearFirestore, signInTestUser, DEMO_PROJECT_ID } from "./harness.ts";
import { SHOP_ITEMS, FREE_STICKERS, itemKey } from "../../lib/shopItems.ts";

prepareEmulatorEnv();

const { initializeApp, deleteApp } = await import("firebase/app");
const { getAuth, connectAuthEmulator } = await import("firebase/auth");
const { getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc, getDoc } = await import("firebase/firestore");

const app = initializeApp({ projectId: DEMO_PROJECT_ID, apiKey: "demo-key" }, "equip-own");
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);

const try_ = async (fn: () => Promise<unknown>) => {
  try { await fn(); return "allowed" as const; } catch { return "denied" as const; }
};

const paid = (slot: string) => SHOP_ITEMS.filter((i) => i.slot === slot && i.price > 0).sort((a, b) => b.price - a.price)[0];
const free = (slot: string) => SHOP_ITEMS.filter((i) => i.slot === slot && !(i.price > 0))[0];
const paidSticker = SHOP_ITEMS.filter((i) => i.slot === "sticker" && i.price > 0 && i.emoji && !FREE_STICKERS.includes(i.emoji))[0];

let uid = "";
const BASE = () => ({ uid, name: "equip", tier: 1, level: 1, doriExp: 0, cottonCandy: 0, cottonCandyTotal: 0 });

test("setup — 잔액 0 · ownedItems 없음", async () => {
  await clearFirestore();
  uid = (await signInTestUser(auth, "equip-own")).uid;
  await setDoc(doc(db, "users", uid), BASE());
  assert.ok((await getDoc(doc(db, "users", uid))).exists());
});

// ── 1~6. 미소유 유료 아이템 장착 → 거부 ────────────────────────────────
for (const slot of ["bg", "frame", "nameEffect", "bannerEffect", "pet"] as const) {
  test(`유료 ${slot} 미소유 → 거부`, async () => {
    const it = paid(slot);
    assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { [slot]: it.id })), "denied",
      `${slot}::${it.id}(${it.price}) 를 미소유 상태로 장착함`);
  });
}

test("유료 sticker 하나라도 미소유 → 전체 거부", async () => {
  assert.equal(
    await try_(() => updateDoc(doc(db, "users", uid), { stickers: [FREE_STICKERS[0], paidSticker.emoji] })),
    "denied", `${paidSticker.emoji}(${paidSticker.price}) 를 미소유 상태로 장착함`);
});

// ── 7~9. 형식·카테고리 위조 ────────────────────────────────────────────
test("다른 카테고리 itemKey → 거부", async () => {
  // bg 필드에 pet 아이템 id 를 넣는다 → 'bg::pet_xxx' 는 보유 목록에 없다.
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { bg: paid("pet").id })), "denied");
});

test("존재하지 않는 itemKey → 거부", async () => {
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { bg: "totally_made_up_id" })), "denied");
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { frame: "../../etc/passwd" })), "denied");
});

test("스티커 6개 초과 → 거부(클라 상한을 서버가 강제)", async () => {
  const seven = FREE_STICKERS.slice(0, 7);
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { stickers: seven })), "denied");
});

// ── 10. 같은 update 에서 ownedItems 위조 + 장착 → 거부 ─────────────────
test("★ownedItems 위조와 장착을 같은 요청으로 시도 → 거부", async () => {
  const it = paid("bg");
  assert.equal(
    await try_(() => updateDoc(doc(db, "users", uid), {
      ownedItems: [itemKey(it.slot, it.id)],     // 보유 목록 위조
      bg: it.id,                                  // 동시에 장착
    })),
    "denied", "ownedItems 를 함께 실으면 통과해 버린다");
});

test("★localStorage 조작은 서버 판정에 영향이 없다(서버 ownedItems 가 기준)", async () => {
  // 로컬 캐시는 Firestore 에 전혀 반영되지 않는다. 서버 문서에 없으면 거부된다.
  const snap = await getDoc(doc(db, "users", uid));
  assert.equal((snap.data() as Record<string, unknown>).ownedItems, undefined, "서버 보유 목록은 비어 있다");
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { pet: paid("pet").id })), "denied");
});

// ── 12~15. 정상 동작은 그대로 ──────────────────────────────────────────
test("무료 기본 아이템 → 허용", async () => {
  for (const slot of ["bg", "frame", "nameEffect", "bannerEffect", "pet"] as const) {
    const it = free(slot);
    assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { [slot]: it.id })), "allowed", `무료 ${slot}::${it.id}`);
  }
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { stickers: FREE_STICKERS.slice(0, 6) })), "allowed");
});

test("★실제 보유한 유료 아이템 → 허용", async () => {
  // 서버(SA)만 쓸 수 있는 필드라 테스트에서는 Rules 우회 없이 넣을 수 없다.
  // → 에뮬레이터 REST(owner)로 직접 심어 '구매 완료' 상태를 만든다.
  const bg = paid("bg"), pet = paid("pet");
  const keys = [itemKey(bg.slot, bg.id), itemKey(pet.slot, pet.id), itemKey("sticker", paidSticker.id)];
  const host = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const r = await fetch(
    `http://${host}/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=ownedItems`,
    { method: "PATCH", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { ownedItems: { arrayValue: { values: keys.map((k) => ({ stringValue: k })) } } } }) },
  );
  assert.ok(r.ok, "보유 목록 심기 실패");

  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { bg: bg.id })), "allowed", "보유한 bg");
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { pet: pet.id })), "allowed", "보유한 pet");
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { stickers: [paidSticker.emoji] })), "allowed", "보유한 sticker");
  // 보유하지 않은 다른 유료 아이템은 여전히 거부
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { frame: paid("frame").id })), "denied", "미보유 frame");
});

test("빈 값으로 장착 해제 → 허용", async () => {
  for (const slot of ["bg", "frame", "nameEffect", "bannerEffect", "pet"] as const) {
    assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { [slot]: "" })), "allowed", `${slot} 해제`);
  }
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), { stickers: [] })), "allowed", "스티커 전체 해제");
});

test("정상 프로필 텍스트 수정 → 허용(장착 검사가 방해하지 않는다)", async () => {
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), {
    name: "새이름", bio: "소개", statusMsg: "상태", themeColor: "#123456", greeting: "안녕", mood: "😀",
    interests: ["ai", "game"], title: "내가 직접 쓴 칭호",
  })), "allowed");
});

test("room·character·diary·quickBar 등 무관한 저장 → 허용", async () => {
  assert.equal(await try_(() => updateDoc(doc(db, "users", uid), {
    room: { layout: [{ id: "a", x: 1 }] }, character: { hair: "b" },
    diary: [{ at: 1, text: "메모", mood: "😀" }], quickBar: ["shop"],
  })), "allowed");
});

// ── 16. legacy 문서 ────────────────────────────────────────────────────
test("legacy 문서(ownedItems 필드 없음) — 무료는 허용, 유료는 거부", async () => {
  const legacy = await signInTestUser(auth, "equip-legacy");
  await setDoc(doc(db, "users", legacy.uid), { uid: legacy.uid, name: "legacy", tier: 1, level: 1, doriExp: 0, cottonCandy: 0 });
  assert.equal(await try_(() => updateDoc(doc(db, "users", legacy.uid), { bg: free("bg").id })), "allowed");
  assert.equal(await try_(() => updateDoc(doc(db, "users", legacy.uid), { bg: paid("bg").id })), "denied");
  uid = legacy.uid;   // 이후 테스트는 이 사용자로 진행
});

// ── 17. 다른 사용자 문서 ───────────────────────────────────────────────
test("다른 사용자 문서에 장착 쓰기 → 거부", async () => {
  assert.equal(await try_(() => updateDoc(doc(db, "users", "someone-else-uid-0001"), { bg: free("bg").id })), "denied");
});

// ── create 경로 ────────────────────────────────────────────────────────
test("문서 create 시 유료 장착 → 거부 / 무료·빈 값 → 허용", async () => {
  const fresh = await signInTestUser(auth, "equip-create");
  const base = { uid: fresh.uid, name: "c", tier: 1, level: 1, doriExp: 0, cottonCandy: 100, cottonCandyTotal: 100 };
  assert.equal(await try_(() => setDoc(doc(db, "users", fresh.uid), { ...base, bg: paid("bg").id })), "denied");
  assert.equal(await try_(() => setDoc(doc(db, "users", fresh.uid), { ...base, stickers: [paidSticker.emoji] })), "denied");
  assert.equal(await try_(() => setDoc(doc(db, "users", fresh.uid), { ...base, bg: free("bg").id, stickers: [FREE_STICKERS[0]] })), "allowed");
});

test("teardown", async () => { await deleteApp(app).catch(() => { /* noop */ }); });
