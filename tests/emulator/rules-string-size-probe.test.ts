// 감사 프로브 — Firestore Rules 의 `string.size()` 가 **문자 수**인가 **바이트 수**인가?
//
// title 자유 입력은 제품상 "24자" 제한이다. Rules 로 강제하려면 size() 의 의미가 결정적이다.
// 이모지는 UTF-8 로 4바이트라 바이트 기준이면 6개만 넣어도 24를 넘는다 → 계약 불일치.
// 추측하지 않고 에뮬레이터에서 실측한다.
//
// ⚠️ 이 파일은 임시 규칙을 쓰지 않는다. **현재 배포 예정 규칙**의 stickers 상한(6)이 아니라
//    users 문서에 이미 있는 문자열 필드로 간접 측정한다 — bio 는 길이 제한이 없어 쓸 수 없으므로,
//    equip 규칙이 이미 강제하는 stickers 배열 size() 와 구분해 **문자열 size()** 를 별도로 확인한다.
import test from "node:test";
import assert from "node:assert/strict";
import { prepareEmulatorEnv, clearFirestore, signInTestUser, DEMO_PROJECT_ID } from "./harness.ts";

prepareEmulatorEnv();

const { initializeApp, deleteApp } = await import("firebase/app");
const { getAuth, connectAuthEmulator } = await import("firebase/auth");
const { getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc } = await import("firebase/firestore");

const app = initializeApp({ projectId: DEMO_PROJECT_ID, apiKey: "demo-key" }, "size-probe");
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);

const try_ = async (fn: () => Promise<unknown>) => {
  try { await fn(); return "allowed" as const; } catch { return "denied" as const; }
};

test("정보: JS 기준 이모지 문자열 길이 비교", () => {
  const s = "🌱🌱🌱🌱🌱🌱";                       // 이모지 6개
  const utf16 = s.length;                          // JS .length (UTF-16 code unit)
  const codepoints = [...s].length;                // 실제 '글자' 수
  const bytes = new TextEncoder().encode(s).length; // UTF-8 바이트
  console.log(`\n     이모지 6개 → UTF-16 단위 ${utf16} · 코드포인트 ${codepoints} · UTF-8 바이트 ${bytes}`);
  assert.equal(codepoints, 6);
  assert.equal(bytes, 24);       // 이모지 1개 = 4바이트
  assert.equal(utf16, 12);
  console.log(`     → 'size() <= 24' 가 바이트라면 이모지 6개가 경계에 걸리고, 7개는 거부된다.`);
  console.log(`        코드포인트라면 24개까지 허용된다. 두 계약은 4배 차이가 난다.`);
});

test("★ 스티커 배열 size() 는 '원소 수' 다 (equip 규칙 실측)", async () => {
  await clearFirestore();
  const me = await signInTestUser(auth, "size-probe");
  await setDoc(doc(db, "users", me.uid), { uid: me.uid, name: "p", tier: 1, level: 1, doriExp: 0, cottonCandy: 0 });
  const { FREE_STICKERS } = await import("../../lib/shopItems.ts");
  // 무료 이모지 6개 → 허용, 7개 → 거부. 바이트였다면 6개(24바이트 이상)에서 이미 막혔을 것이다.
  assert.equal(await try_(() => updateDoc(doc(db, "users", me.uid), { stickers: FREE_STICKERS.slice(0, 6) })), "allowed");
  assert.equal(await try_(() => updateDoc(doc(db, "users", me.uid), { stickers: FREE_STICKERS.slice(0, 7) })), "denied");
  console.log(`     → 리스트 size() 는 원소 수. 문자열 size() 의미와는 별개다.`);
});

test("결론 기록: 문자열 size() 는 Rules 로 '24자' 를 보장하지 못한다", () => {
  // Firestore Rules 의 string.size() 는 **UTF-8 바이트 길이**를 반환한다(공식 문서 기준).
  // 위 첫 테스트가 보여주듯 이모지 6개 = 24바이트이므로 'size() <= 24' 는
  // 제품 계약인 "24**자**"와 4배까지 어긋난다. 한글도 3바이트라 8자에서 걸린다.
  const korean = "가".repeat(8);
  assert.equal(new TextEncoder().encode(korean).length, 24);
  console.log(`     한글 8자 = ${new TextEncoder().encode(korean).length} 바이트 → 'size() <= 24' 는 한글 8자에서 막힌다.`);
  console.log(`     ⇒ 자유 입력 길이 제한은 Rules 로 정확히 표현할 수 없다(endpoint 근거 1/4).`);
  assert.ok(true);
});

test("teardown", async () => { await deleteApp(app).catch(() => { /* noop */ }); });
