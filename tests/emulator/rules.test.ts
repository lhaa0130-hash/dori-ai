// Firestore Security Rules 검증 (05-06C) — 실제 firestore.rules 를 에뮬레이터에 적용해 확인.
import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import { DEMO_PROJECT_ID, clearFirestore, prepareEmulatorEnv, shutdownFirebase, signInTestUser, uninstallBrowserShim } from "./harness.ts";

let auth: import("firebase/auth").Auth;
let db: import("firebase/firestore").Firestore;
let fs: typeof import("firebase/firestore");
let userA: { uid: string; email: string };
let userB: { uid: string; email: string };

before(async () => {
  prepareEmulatorEnv();                       // fail-closed guard
  const firebase = await import("@/lib/firebase");
  fs = await import("firebase/firestore");
  auth = firebase.getFirebaseAuth();
  db = firebase.getFirebaseFirestore();
  await clearFirestore();
  userA = await signInTestUser(auth, "rules-a");
});

after(async () => {
  await shutdownFirebase();
  uninstallBrowserShim();
});

async function denied(promise: Promise<unknown>, label: string) {
  await assert.rejects(promise, (error: { code?: string }) => {
    assert.ok(String(error.code || error).includes("permission-denied"), `${label}: expected permission-denied, got ${String(error.code || error)}`);
    return true;
  }, label);
}

test("emulator is wired to the demo project, never production", () => {
  assert.equal(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, DEMO_PROJECT_ID);
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, "FIRESTORE_EMULATOR_HOST required");
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, "FIREBASE_AUTH_EMULATOR_HOST required");
  assert.ok(DEMO_PROJECT_ID.startsWith("demo-"));
});

test("a signed-in user can write and read their own document", async () => {
  const ref = fs.doc(db, "users", userA.uid);
  await fs.setDoc(ref, { nickname: "도리팬", myWorld: { interaction: { affinity: 3 } } }, { merge: true });
  const snap = await fs.getDoc(ref);
  assert.equal(snap.exists(), true);
  assert.equal((snap.data() as { myWorld: { interaction: { affinity: number } } }).myWorld.interaction.affinity, 3);
});

test("a user cannot write another user's document", async () => {
  const otherUid = `${userA.uid}-someone-else`;
  await denied(
    fs.setDoc(fs.doc(db, "users", otherUid), { myWorld: { interaction: { affinity: 99 } } }, { merge: true }),
    "cross-user write must be denied",
  );
});

test("the real interaction payload passes the rules", async () => {
  const { buildInteractionMergePayload } = await import("@/lib/myWorld/interaction/storage");
  const { defaultInteractionState } = await import("@/lib/myWorld/interaction/engine");
  const payload = buildInteractionMergePayload(
    { ...defaultInteractionState(Date.now()), affinity: 12, lastInteraction: Date.now() },
    fs.serverTimestamp(),
  );
  await assert.doesNotReject(fs.setDoc(fs.doc(db, "users", userA.uid), payload, { merge: true }));
});

test("the real EXP payload passes the rules", async () => {
  await assert.doesNotReject(
    fs.setDoc(fs.doc(db, "users", userA.uid), { doriExp: 25, level: 2, tier: 1 }, { merge: true }),
  );
});

test("PII fields are rejected by the rules, which is why interaction payloads omit them", async () => {
  await denied(
    fs.setDoc(fs.doc(db, "users", userA.uid), { email: "leak@example.com" }, { merge: true }),
    "email must be rejected",
  );
  await denied(
    fs.setDoc(fs.doc(db, "users", userA.uid), { provider: "google" }, { merge: true }),
    "provider must be rejected",
  );
});

test("a second user is isolated from the first user's document", async () => {
  userB = await signInTestUser(auth, "rules-b");
  assert.notEqual(userB.uid, userA.uid);

  // B 는 자기 문서에 쓸 수 있다.
  await fs.setDoc(fs.doc(db, "users", userB.uid), { myWorld: { interaction: { affinity: 7 } } }, { merge: true });
  const own = await fs.getDoc(fs.doc(db, "users", userB.uid));
  assert.equal((own.data() as { myWorld: { interaction: { affinity: number } } }).myWorld.interaction.affinity, 7);

  // 그러나 A 의 문서는 수정할 수 없다.
  await denied(
    fs.setDoc(fs.doc(db, "users", userA.uid), { myWorld: { interaction: { affinity: 100 } } }, { merge: true }),
    "B must not overwrite A",
  );

  // A 의 데이터가 그대로 남아 있는지 확인(교차 오염 없음).
  const aDoc = await fs.getDoc(fs.doc(db, "users", userA.uid));
  assert.notEqual((aDoc.data() as { myWorld: { interaction: { affinity: number } } }).myWorld.interaction.affinity, 100);
});

test("an unauthenticated client cannot write a protected document", async () => {
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
  await denied(
    fs.setDoc(fs.doc(db, "users", userA.uid), { myWorld: { interaction: { affinity: 55 } } }, { merge: true }),
    "anonymous write must be denied",
  );
  // 재로그인해 이후 테스트에 영향 주지 않도록 복구
  userA = await signInTestUser(auth, "rules-a-again");
});
