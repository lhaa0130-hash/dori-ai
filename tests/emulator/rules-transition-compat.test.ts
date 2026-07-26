// Phase 8 — Firestore Rules 전환 호환성 (감사 브랜치 신규)
//
// 목적: **신규 Rules 를 배포하면 구버전 client 의 어떤 동작이 깨지는가**를 열거로 확정한다.
//   "코드 먼저, Rules 마지막" 이라는 배포 순서 규칙의 근거를 추측이 아니라 실측으로 남긴다.
//
// 구버전 client(d1faa790f3c)가 실제로 수행하던 쓰기 패턴을 그대로 재현해 신규 Rules 아래에서
// 허용/거부를 기록한다. 거부되는 것이 곧 "Rules 를 먼저 배포하면 사용자 화면에서 깨지는 기능"이다.
import test from "node:test";
import assert from "node:assert/strict";
import {
  prepareEmulatorEnv, clearFirestore, signInTestUser, DEMO_PROJECT_ID,
} from "./harness.ts";

prepareEmulatorEnv();

const { initializeApp, deleteApp } = await import("firebase/app");
const { getAuth, connectAuthEmulator } = await import("firebase/auth");
const {
  getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc, getDoc, deleteDoc, increment,
} = await import("firebase/firestore");

const app = initializeApp({ projectId: DEMO_PROJECT_ID, apiKey: "demo-key" }, "rules-compat");
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, "127.0.0.1", 8080);

/** 쓰기를 시도하고 허용/거부만 돌려준다(오류 메시지는 기록하지 않는다). */
async function attempt(fn: () => Promise<unknown>): Promise<"allowed" | "denied"> {
  try { await fn(); return "allowed"; } catch { return "denied"; }
}

const COMPAT: Array<{ 동작: string; 구버전출처: string; 신규Rules: string }> = [];
function record(동작: string, 구버전출처: string, 결과: "allowed" | "denied") {
  COMPAT.push({ 동작, 구버전출처, 신규Rules: 결과 === "denied" ? "❌ 거부" : "✅ 허용" });
}

let uid = "";
let other = "";

test("setup — 사용자 2명 + 기본 문서", async () => {
  await clearFirestore();
  const me = await signInTestUser(auth, "compat-me");
  uid = me.uid;
  other = "other-user-uid-000001";
  await setDoc(doc(db, "users", uid), {
    uid, name: "compat", tier: 1, level: 1, doriExp: 0,
    cottonCandy: 100, cottonCandyTotal: 100,
    attendance: { lastChecked: "", streak: 0, weekDays: [], totalDays: 0 },
  });
  assert.ok((await getDoc(doc(db, "users", uid))).exists());
});

// ── A. 구버전 client 가 하던 재화 쓰기 (전부 막혀야 한다) ───────────────
test("A1. fsAddCandy 상당 — cottonCandy increment 직접 증가", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { cottonCandy: increment(500) }));
  record("솜사탕 직접 증가(미니게임·업적·레벨 보상)", "lib/cottonCandy.ts:50 fsAddCandy", r);
  assert.equal(r, "denied");
});

test("A2. spendCottonCandy 상당 — cottonCandy 직접 차감", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { cottonCandy: increment(-20) }));
  record("솜사탕 직접 차감(상점 구매)", "lib/cottonCandy.ts:482 fsAddCandy(-n)", r);
  assert.equal(r, "denied");
});

test("A3. purchaseShopItem 상당 — ownedItems 직접 추가 + 잔액 차감", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { ownedItems: ["bg::x"], cottonCandy: 80 }));
  record("아이템 보유 직접 기록 + 차감", "lib/cottonCandy.ts purchaseShopItem", r);
  assert.equal(r, "denied");
});

test("A4. 프리미엄 자가 부여", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { isPremium: true }));
  record("프리미엄 자가 부여", "관리자 지급 폴백 소비", r);
  assert.equal(r, "denied");
});

test("A5. 누적 재화 조작", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { cottonCandyTotal: 999999 }));
  record("누적 재화 조작", "표시용 집계", r);
  assert.equal(r, "denied");
});

test("A6. 일일 집계 리셋으로 상한 우회", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { candyDailyDate: "1999-01-01", candyDailyTotal: 0 }));
  record("일일 상한 카운터 리셋", "신규 필드(구버전엔 없음)", r);
  assert.equal(r, "denied");
});

// ── B. 구버전 client 의 알림 기반 관리자 지급 (P0 #6) ───────────────────
test("B1. 타인 알림함에 재화 지급 예약 위조", async () => {
  const r = await attempt(() => setDoc(doc(db, "notifications", other, "items", "forged1"), {
    type: "candy_grant", fromUid: uid, amount: 100000, applied: false, createdAt: new Date().toISOString(),
  }));
  record("타인에게 재화 지급 알림 위조", "lib/cottonCandy.ts:95 adminGrantCandy", r);
  assert.equal(r, "denied");
});

test("B2. 자기 알림함에 재화 지급 예약(계정 2개 우회)", async () => {
  const r = await attempt(() => setDoc(doc(db, "notifications", uid, "items", "self1"), {
    type: "candy_grant", fromUid: other, amount: 100000, applied: false,
  }));
  record("자기 알림함에 재화 예약", "P0 #6 A→B 우회", r);
  assert.equal(r, "denied");
});

test("B3. visits 폴백 경로(pendingCandy)", async () => {
  const r = await attempt(() => setDoc(doc(db, "visits", uid), { pendingCandy: 99999 }, { merge: true }));
  record("visits.pendingCandy 폴백 지급", "구버전 lib/cottonCandy.ts 3곳 참조", r);
  assert.equal(r, "denied");
});

// ── C. 구버전 client 의 **정상** 동작 (깨지면 안 된다) ──────────────────
test("C1. 프로필 이름·소개 수정", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { name: "새이름", bio: "소개" }));
  record("프로필 수정", "정상 기능", r);
  assert.equal(r, "allowed");
});

test("C2. 코지홈 방 배치·캐릭터 설정 저장", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), {
    room: { layout: [{ id: "a", x: 1, y: 2 }] }, character: { hair: "b" }, equipped: { bg: "bg::free1" },
  }));
  record("코지홈 방·캐릭터·장착 저장", "정상 기능", r);
  assert.equal(r, "allowed");
});

test("C3. quickBar·일기 저장", async () => {
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { quickBar: ["shop", "animal"], diary: { "2026-07-26": "메모" } }));
  record("퀵바·일기 저장", "정상 기능", r);
  assert.equal(r, "allowed");
});

test("C4. 출석 필드 갱신 — ★구버전 client 의 로컬 출석 표시", async () => {
  // attendance 는 rewardFieldNames() 에 없다 → 클라이언트가 여전히 쓸 수 있다.
  const r = await attempt(() => updateDoc(doc(db, "users", uid), {
    attendance: { lastChecked: "2026-07-26", streak: 1, weekDays: [1], totalDays: 1 },
  }));
  record("출석 필드 직접 갱신", "구버전·신규 공통", r);
  assert.equal(r, "allowed", "출석은 잠그지 않았다 — 서버 원장이 실제 지급을 소유한다");
});

test("C5. 같은 값 재전송(no-op update)은 통과한다", async () => {
  // diff().affectedKeys() 는 값이 같으면 포함하지 않는다 → 캐시 동기화 코드가 깨지지 않는다.
  const snap = await getDoc(doc(db, "users", uid));
  const cur = snap.data() as Record<string, unknown>;
  const r = await attempt(() => updateDoc(doc(db, "users", uid), { cottonCandy: cur.cottonCandy as number }));
  record("동일 값 재전송(캐시 동기화)", "회귀 방지", r);
  assert.equal(r, "allowed");
});

// ── D. 원장 컬렉션 ─────────────────────────────────────────────────────
test("D1. 구매·지급·보상 원장 직접 생성", async () => {
  const a = await attempt(() => setDoc(doc(db, "users", uid, "purchases", "buy_bg__x"), { charged: 0 }));
  const b = await attempt(() => setDoc(doc(db, "users", uid, "grants", "grant_fake01"), { requestedCandy: 99999 }));
  record("구매 원장 직접 생성", "멱등 우회 시도", a);
  record("지급 원장 직접 생성", "감사 추적 위조", b);
  assert.equal(a, "denied");
  assert.equal(b, "denied");
});

test("D2. 본인 원장 읽기는 허용(내역 표시용)", async () => {
  const r = await attempt(() => getDoc(doc(db, "users", uid, "purchases", "nonexistent")));
  record("본인 원장 읽기", "포인트 내역 후속 설계 근거", r);
  assert.equal(r, "allowed");
});

// ── E. 문서 삭제·재생성 ────────────────────────────────────────────────
test("E1. 본인 문서 삭제는 허용되지만 재생성은 상한이 강제된다", async () => {
  const del = await attempt(() => deleteDoc(doc(db, "users", uid)));
  assert.equal(del, "allowed", "계정 정리 기능");
  const over = await attempt(() => setDoc(doc(db, "users", uid), { uid, name: "x", cottonCandy: 99999 }));
  assert.equal(over, "denied", "재생성 시 100 초과 불가");
  const ok = await attempt(() => setDoc(doc(db, "users", uid), { uid, name: "x", cottonCandy: 100, cottonCandyTotal: 100, tier: 1, level: 1, doriExp: 0 }));
  assert.equal(ok, "allowed");
  record("문서 삭제 후 재생성", "파밍 시도 — 원장이 남아 무의미", "denied");
});

// ── 결과 표 출력 ───────────────────────────────────────────────────────
test("호환성 표 요약", () => {
  const denied = COMPAT.filter((c) => c.신규Rules.startsWith("❌"));
  const allowed = COMPAT.filter((c) => c.신규Rules.startsWith("✅"));
  console.log(`\n     ── Rules 배포 시 구버전 client 영향 ──`);
  console.log(`     ❌ 거부(=깨지는 동작) ${denied.length}건 / ✅ 유지 ${allowed.length}건`);
  for (const c of denied) console.log(`       ❌ ${c.동작}  ← ${c.구버전출처}`);
  for (const c of allowed) console.log(`       ✅ ${c.동작}`);
  assert.ok(denied.length >= 9, "재화 쓰기가 충분히 막히지 않았다");
  assert.ok(allowed.length >= 5, "정상 기능이 과도하게 막혔다");
});

test("teardown", async () => {
  // ⚠️ shutdownFirebase() 는 **공용** Firebase 상태를 내린다. 다른 에뮬레이터 스위트가
  //    같은 프로세스에서 뒤이어 돌므로 여기서 부르면 그쪽이 깨진다.
  //    이 파일이 만든 named app 만 정리한다.
  await deleteApp(app).catch(() => { /* 이미 정리됨 */ });
});
