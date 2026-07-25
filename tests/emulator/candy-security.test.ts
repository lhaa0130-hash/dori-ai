// 05-07 — 솜사탕(재화)·보유 아이템·프리미엄 신뢰경계 (Auth/Firestore 에뮬레이터, 실제 SDK·실제 Rules).
//  ⚠️ 서버(SA REST)만 cottonCandy/ownedItems/isPremium 을 쓸 수 있고, 클라이언트는 어떤 경로로도 못 쓴다.
//     (과거엔 클라이언트가 직접 increment 했고, 남의 알림함에 candy_grant 를 넣어 무한 지급이 가능했다.)
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { clearFirestore, installBrowserShim, prepareEmulatorEnv, shutdownFirebase, signInTestUser, uninstallBrowserShim } from "./harness.ts";

let fs: typeof import("firebase/firestore");
let db: import("firebase/firestore").Firestore;
let auth: import("firebase/auth").Auth;
let cottonCandy: typeof import("@/lib/cottonCandy");
let shim: { storage: Map<string, string>; events: string[] };

before(async () => {
  prepareEmulatorEnv();
  shim = installBrowserShim();
  const firebase = await import("@/lib/firebase");
  fs = await import("firebase/firestore");
  auth = firebase.getFirebaseAuth();
  db = firebase.getFirebaseFirestore();
  cottonCandy = await import("@/lib/cottonCandy");
});
after(async () => { await shutdownFirebase(); uninstallBrowserShim(); });
beforeEach(async () => { await clearFirestore(); shim.storage.clear(); shim.events.length = 0; });

const readDoc = async (uid: string) => (await fs.getDoc(fs.doc(db, "users", uid))).data() as Record<string, any> | undefined;
const isDenied = (e: { code?: string }) => String(e.code || e).includes("permission-denied");
/** 가입 직후 상태(create 규칙이 허용하는 환영 보너스 100). */
const seed = (uid: string) =>
  fs.setDoc(fs.doc(db, "users", uid), { uid, doriExp: 0, level: 1, tier: 1, cottonCandy: 100, cottonCandyTotal: 100 });

test("P0 CLOSED: 클라이언트가 cottonCandy 를 직접 올릴 수 없다", async () => {
  const u = await signInTestUser(auth, "candy");
  await seed(u.uid);
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", u.uid), { cottonCandy: 999999 }, { merge: true }),
    isDenied, "직접 재화 쓰기는 Rules 로 차단",
  );
  await assert.rejects(
    fs.updateDoc(fs.doc(db, "users", u.uid), { cottonCandy: fs.increment(500) }),
    isDenied, "increment 도 차단",
  );
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", u.uid), { cottonCandyTotal: 999999 }, { merge: true }),
    isDenied, "누적 획득량도 차단",
  );
  assert.equal((await readDoc(u.uid))!.cottonCandy, 100, "서버 잔액은 그대로");
});

test("P0 CLOSED: 클라이언트가 ownedItems / isPremium 을 직접 쓸 수 없다", async () => {
  const u = await signInTestUser(auth, "items");
  await seed(u.uid);
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", u.uid), { ownedItems: ["bg::premium", "pet::dragon"] }, { merge: true }),
    isDenied, "아이템 직접 지급 차단",
  );
  await assert.rejects(
    fs.updateDoc(fs.doc(db, "users", u.uid), { ownedItems: fs.arrayUnion("bg::premium") }),
    isDenied, "arrayUnion 도 차단",
  );
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", u.uid), { isPremium: true }, { merge: true }),
    isDenied, "프리미엄 자가 부여 차단(= 전 상점 무료)",
  );
  const d = await readDoc(u.uid);
  assert.equal(d!.ownedItems, undefined);
  assert.equal(d!.isPremium, undefined);
});

test("P0 CLOSED: 재화 일일 카운터를 리셋해 상한을 우회할 수 없다", async () => {
  const u = await signInTestUser(auth, "cap");
  await seed(u.uid);
  for (const f of ["rewardTypeCandy_mission_complete", "rewardTypeCandy_minigame_play",
                   "rewardTypeDate_mission_complete", "rewardTypeCandy_achievement_claim",
                   "rewardTypeCandy_level_reward"]) {
    await assert.rejects(
      fs.setDoc(fs.doc(db, "users", u.uid), { [f]: 0 }, { merge: true }),
      isDenied, `${f} 조작 차단`,
    );
  }
});

test("가입 create 는 환영 보너스(≤100)만 허용 — 초과 시드는 거부", async () => {
  const u = await signInTestUser(auth, "create");
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", u.uid), { uid: u.uid, cottonCandy: 100000, cottonCandyTotal: 100000 }),
    isDenied, "환영 보너스를 넘겨 문서를 만들 수 없다",
  );
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", u.uid), { uid: u.uid, cottonCandy: 0, isPremium: true }),
    isDenied, "프리미엄으로 가입할 수 없다",
  );
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", u.uid), { uid: u.uid, cottonCandy: 0, ownedItems: ["bg::x"] }),
    isDenied, "아이템을 들고 가입할 수 없다",
  );
  await seed(u.uid); // 정상 가입은 통과해야 한다
  assert.equal((await readDoc(u.uid))!.cottonCandy, 100);
});

test("문서를 지우고 다시 만들어도 재화가 누적되지 않는다(파밍 불가)", async () => {
  const u = await signInTestUser(auth, "recreate");
  await seed(u.uid);
  await fs.deleteDoc(fs.doc(db, "users", u.uid));
  await seed(u.uid);
  assert.equal((await readDoc(u.uid))!.cottonCandy, 100, "재생성해도 100 으로 '재설정'될 뿐");
});

test("P0 CLOSED: 남의 알림함에 candy_grant 를 넣어도 자동 반영 경로가 없다", async () => {
  const attacker = await signInTestUser(auth, "attacker");
  // 공격자는 여전히 남의 알림함에 문서를 만들 수 있다(알림 기능 자체는 유지).
  const victimUid = "victim-uid-0001";
  await fs.addDoc(fs.collection(db, "notifications", victimUid, "items"), {
    type: "candy_grant", amount: 999999, applied: false, fromUid: attacker.uid,
    fromName: "관리자", text: "선물", link: "/my", read: false, createdAt: fs.serverTimestamp(),
  });
  // 그러나 이걸 잔액으로 바꿔주던 클라이언트 함수가 사라졌다.
  assert.equal((cottonCandy as Record<string, unknown>).applyPendingCandyGrants, undefined,
    "지급 예약 자동 반영 함수는 제거돼야 한다");
  // 피해자 본인이 직접 반영하려 해도 Rules 가 막는다.
  const victim = await signInTestUser(auth, "victim");
  await seed(victim.uid);
  await assert.rejects(
    fs.updateDoc(fs.doc(db, "users", victim.uid), { cottonCandy: fs.increment(999999) }),
    isDenied, "예약을 본인이 반영하는 것도 차단",
  );
});

test("재화와 무관한 정상 저장은 그대로 통과한다(회귀 방지)", async () => {
  const u = await signInTestUser(auth, "normal");
  await seed(u.uid);
  await fs.setDoc(fs.doc(db, "users", u.uid), {
    name: "테스터",
    quickBar: ["/community", "/minigame"],
    attendance: { lastChecked: "2026-07-26", streak: 3, weekDays: [], totalDays: 3 },
    myWorld: { room: { placedItems: [{ id: "sofa", x: 1, y: 2 }] } },
    photoURL: "https://example.test/a.png",
  }, { merge: true });
  const d = await readDoc(u.uid);
  assert.equal(d!.name, "테스터");
  assert.equal(d!.quickBar.length, 2);
  assert.equal(d!.myWorld.room.placedItems.length, 1);
  assert.equal(d!.cottonCandy, 100, "정상 저장이 재화를 건드리지 않는다");
});

test("구매·지급 원장은 클라이언트가 쓸 수 없다(본인 읽기만)", async () => {
  const u = await signInTestUser(auth, "ledger");
  await seed(u.uid);
  for (const col of ["purchases", "grants"]) {
    await assert.rejects(
      fs.setDoc(fs.doc(db, "users", u.uid, col, "buy_bg__x"), { charged: 0 }),
      isDenied, `${col} 원장 위조 차단`,
    );
  }
  // 읽기는 허용(내 구매 이력 확인)
  await fs.getDocs(fs.collection(db, "users", u.uid, "purchases"));
});
