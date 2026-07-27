// 칭호 Rules 계약 — 클라이언트 직접 쓰기가 **전면 차단**되는지 조합으로 확인 (05-09).
//
// enforcement 는 endpoint(POST /api/profile/title)가 하고, Rules 는 "클라가 못 쓴다"만 담당한다.
// 따라서 여기서는 **모든 조합이 거부**되는 것이 정상이고, 무관한 저장은 그대로 통과해야 한다.
import test from "node:test";
import assert from "node:assert/strict";
import { prepareEmulatorEnv, clearFirestore, signInTestUser, DEMO_PROJECT_ID } from "./harness.ts";
import { SHOP_ITEMS, itemKey } from "../../lib/shopItems.ts";

prepareEmulatorEnv();

const { initializeApp, deleteApp } = await import("firebase/app");
const { getAuth, connectAuthEmulator } = await import("firebase/auth");
const { getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc, getDoc } = await import("firebase/firestore");

const app = initializeApp({ projectId: DEMO_PROJECT_ID, apiKey: "demo-key" }, "title-rules");
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);

const try_ = async (fn: () => Promise<unknown>) => {
  try { await fn(); return "allowed" as const; } catch { return "denied" as const; }
};
const TITLES = SHOP_ITEMS.filter((i) => i.slot === "title");
const T1 = TITLES[0], T2 = TITLES[1];
const KEY1 = itemKey(T1.slot, T1.id), KEY2 = itemKey(T2.slot, T2.id);
const BG = SHOP_ITEMS.find((i) => i.slot === "bg" && i.price > 0)!;

let uid = "";
const up = (patch: Record<string, unknown>) => updateDoc(doc(db, "users", uid), patch);

test("setup", async () => {
  await clearFirestore();
  uid = (await signInTestUser(auth, "title-rules")).uid;
  await setDoc(doc(db, "users", uid), { uid, name: "t", tier: 1, level: 1, doriExp: 0, cottonCandy: 0 });
});

// ── 단일 필드 변경 (전부 거부) ────────────────────────────────────────
for (const [name, patch] of [
  ["titleMode 만", { titleMode: "custom" }],
  ["titleId 만", { titleId: KEY1 }],
  ["customTitle 만", { customTitle: "내 칭호" }],
  ["legacy title 만", { title: "내 칭호" }],
] as Array<[string, Record<string, unknown>]>) {
  test(`${name} 변경 → 거부`, async () => {
    assert.equal(await try_(() => up(patch)), "denied");
  });
}

// ── 모드 전이 (전부 거부) ─────────────────────────────────────────────
for (const [name, patch] of [
  ["catalog 설정", { titleMode: "catalog", titleId: KEY1, customTitle: "", title: T1.text }],
  ["custom 설정", { titleMode: "custom", titleId: "", customTitle: "내 칭호", title: "내 칭호" }],
  ["none 설정", { titleMode: "none", titleId: "", customTitle: "", title: "" }],
  ["catalog→custom", { titleMode: "custom", titleId: "", customTitle: T1.text, title: T1.text }],
  ["custom→catalog", { titleMode: "catalog", titleId: KEY2, customTitle: "", title: T2.text }],
  ["catalog→none", { titleMode: "none", titleId: "", title: "" }],
  ["custom→none", { titleMode: "none", customTitle: "", title: "" }],
  ["잘못된 mode", { titleMode: "admin", title: "x" }],
  ["titleId unknown", { titleMode: "catalog", titleId: "title::nope" }],
  ["titleId 다른 category", { titleMode: "catalog", titleId: itemKey(BG.slot, BG.id) }],
  ["customTitle 빈값", { titleMode: "custom", customTitle: "" }],
  ["customTitle 공백", { titleMode: "custom", customTitle: "   " }],
  ["customTitle 24자", { titleMode: "custom", customTitle: "가".repeat(24) }],
  ["customTitle 25자", { titleMode: "custom", customTitle: "가".repeat(25) }],
  ["모든 칭호 필드 동시", { titleMode: "catalog", titleId: KEY1, customTitle: "x", title: "y" }],
] as Array<[string, Record<string, unknown>]>) {
  test(`${name} → 거부`, async () => {
    assert.equal(await try_(() => up(patch)), "denied");
  });
}

// ── 위조 조합 ─────────────────────────────────────────────────────────
test("★ownedItems 위조 + titleId 를 같은 요청으로 → 거부", async () => {
  assert.equal(await try_(() => up({ ownedItems: [KEY1], titleMode: "catalog", titleId: KEY1, title: T1.text })), "denied");
  const d = (await getDoc(doc(db, "users", uid))).data() as Record<string, unknown>;
  assert.equal(d.ownedItems, undefined, "보유 목록이 생겼다");
  assert.equal(d.titleId, undefined, "titleId 가 생겼다");
});

test("★실제로 보유하고 있어도 클라이언트는 titleId 를 쓸 수 없다(endpoint 전용)", async () => {
  // 서버(SA)로 보유 목록을 심는다 — 구매 완료 상태 재현
  const host = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  const r = await fetch(
    `http://${host}/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=ownedItems`,
    { method: "PATCH", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { ownedItems: { arrayValue: { values: [{ stringValue: KEY1 }] } } } }) });
  assert.ok(r.ok);
  assert.equal(await try_(() => up({ titleMode: "catalog", titleId: KEY1 })), "denied");
});

test("칭호 필드를 다른 장착 필드와 함께 저장해도 거부(전체 요청이 막힌다)", async () => {
  const freeBg = SHOP_ITEMS.find((i) => i.slot === "bg" && !(i.price > 0))!;
  assert.equal(await try_(() => up({ bg: freeBg.id, titleMode: "custom", customTitle: "x" })), "denied");
});

test("다른 사용자 문서의 칭호 → 거부", async () => {
  assert.equal(await try_(() => updateDoc(doc(db, "users", "someone-else-uid-01"), { titleMode: "none" })), "denied");
});

// ── 무관한 저장은 그대로 (회귀 방지) ──────────────────────────────────
test("정상 프로필 텍스트·색·소개 저장 → 허용", async () => {
  assert.equal(await try_(() => up({ name: "새이름", bio: "소개", statusMsg: "상태", themeColor: "#123456", greeting: "안녕", mood: "😀", interests: ["a"] })), "allowed");
});

test("room·character·diary·quickBar 저장 → 허용", async () => {
  assert.equal(await try_(() => up({ room: { layout: [] }, character: { hair: "a" }, diary: [{ at: 1, text: "m", mood: "😀" }], quickBar: ["shop"] })), "allowed");
});

test("무료 장착 아이템 저장 → 허용(칭호 잠금이 다른 장착을 막지 않는다)", async () => {
  const freeFrame = SHOP_ITEMS.find((i) => i.slot === "frame" && !(i.price > 0))!;
  assert.equal(await try_(() => up({ frame: freeFrame.id })), "allowed");
});

test("동일 값 재전송(no-op)은 통과한다", async () => {
  const cur = (await getDoc(doc(db, "users", uid))).data() as Record<string, unknown>;
  assert.equal(await try_(() => up({ name: cur.name as string })), "allowed");
});

// ── 원장 컬렉션 ───────────────────────────────────────────────────────
test("titleOps 원장은 클라이언트가 쓸 수 없고 본인만 읽는다", async () => {
  assert.equal(await try_(() => setDoc(doc(db, "users", uid, "titleOps", "title_fake001"), { mode: "catalog" })), "denied");
  assert.equal(await try_(() => getDoc(doc(db, "users", uid, "titleOps", "title_fake001"))), "allowed");
  assert.equal(await try_(() => getDoc(doc(db, "users", "someone-else-uid-01", "titleOps", "x"))), "denied");
});

// ⚠️ 이 블록은 signInTestUser 로 **로그인 사용자를 바꾼다**. 이후 테스트가 남의 문서를 쓰게 되므로
//    반드시 마지막에 둔다(앞에 두면 뒤따르는 '허용' 테스트가 전부 거부로 뒤집힌다).
// ── create 경로 ───────────────────────────────────────────────────────
test("문서 create 에 칭호 필드를 실으면 거부 / 없으면 허용", async () => {
  const fresh = await signInTestUser(auth, "title-create");
  const base = { uid: fresh.uid, name: "c", tier: 1, level: 1, doriExp: 0, cottonCandy: 100, cottonCandyTotal: 100 };
  for (const bad of [{ title: T1.text }, { titleMode: "catalog" }, { titleId: KEY1 }, { customTitle: "x" }]) {
    assert.equal(await try_(() => setDoc(doc(db, "users", fresh.uid), { ...base, ...bad })), "denied", JSON.stringify(bad));
  }
  assert.equal(await try_(() => setDoc(doc(db, "users", fresh.uid), base)), "allowed");
});

test("teardown", async () => { await deleteApp(app).catch(() => { /* noop */ }); });
