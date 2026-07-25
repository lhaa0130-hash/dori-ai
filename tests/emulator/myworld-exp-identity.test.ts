// 05-06E — My World EXP 적립이 Identity Gate 를 따르는지 (Auth/Firestore 에뮬레이터, 실제 SDK).
// InteractionContext 의 적립 규칙(ready + currentUser uid 일치 시에만, 같은 계정의 email 로)을
// 순수 경계(createAuthenticatedScope)와 실제 addExp/서버 문서로 검증한다.
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { clearFirestore, installBrowserShim, prepareEmulatorEnv, shutdownFirebase, signInTestUser, uninstallBrowserShim, waitFor } from "./harness.ts";
import { createAuthenticatedScope } from "@/lib/myWorld/storageScope";
import { resolveMyWorldIdentity } from "@/lib/myWorld/identity";

let fs: typeof import("firebase/firestore");
let db: import("firebase/firestore").Firestore;
let auth: import("firebase/auth").Auth;
let cottonCandy: typeof import("@/lib/cottonCandy");
let shim: { storage: Map<string, string>; events: string[] };

const readDoc = async (uid: string) => (await fs.getDoc(fs.doc(db, "users", uid))).data() as Record<string, any> | undefined;
const currentUser = () => { const c = auth.currentUser; return c ? { uid: c.uid, email: c.email } : null; };
const ready = (uid: string) => resolveMyWorldIdentity({ authStatus: "authenticated", firebaseUid: uid });

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

/** InteractionContext 의 적립 게이트를 그대로 재현한 헬퍼. */
function awardExpLikeMyWorld(identity: ReturnType<typeof ready>, amount: number): "awarded" | "skipped" {
  const scope = createAuthenticatedScope(identity, currentUser());
  if (scope && scope.legacyEmail) { cottonCandy.addExp(scope.legacyEmail, amount, "My World pet"); return "awarded"; }
  return "skipped";
}

test("My World EXP is written to the signed-in user's own document", async () => {
  const a = await signInTestUser(auth, "exp-a");
  assert.equal(awardExpLikeMyWorld(ready(a.uid), 20), "awarded");
  const persisted = await waitFor(async () => { const d = await readDoc(a.uid); return d?.doriExp === 20 ? d : null; }, { label: "exp propagate" });
  assert.equal(persisted.doriExp, 20);
  assert.ok(shim.events.includes("dori-gamedata-synced"));
});

test("after switching from A to B, an A-scoped award is refused and never touches B's document", async () => {
  const a = await signInTestUser(auth, "sw-a");
  const b = await signInTestUser(auth, "sw-b");   // 현재 로그인 = B

  // A 의 신원으로 적립을 시도하지만 currentUser 는 B → 스코프가 생성되지 않아 적립 거부.
  assert.equal(awardExpLikeMyWorld(ready(a.uid), 50), "skipped");

  // B 문서·A 문서 모두 이 적립으로 변하지 않아야 한다.
  const bDoc = await readDoc(b.uid);
  assert.equal(bDoc?.doriExp ?? 0, 0, "A 적립이 B 문서에 들어가면 안 된다");

  // B 자신의 적립은 정상 → B 문서에만
  assert.equal(awardExpLikeMyWorld(ready(b.uid), 7), "awarded");
  const bAfter = await waitFor(async () => { const d = await readDoc(b.uid); return d?.doriExp === 7 ? d : null; }, { label: "b exp" });
  assert.equal(bAfter.doriExp, 7);
  const aDoc = await readDoc(a.uid);
  assert.equal(aDoc?.doriExp ?? 0, 0, "B 적립이 A 문서로 새면 안 된다");
});

test("EXP is not awarded while the identity is guest, loading, or mismatched", async () => {
  await signInTestUser(auth, "gate-a");
  // guest
  assert.equal(awardExpLikeMyWorld(resolveMyWorldIdentity({ authStatus: "unauthenticated", firebaseUid: null }), 10), "skipped");
  // loading (currentUser 있어도 status loading)
  assert.equal(awardExpLikeMyWorld(resolveMyWorldIdentity({ authStatus: "loading", firebaseUid: auth.currentUser!.uid }), 10), "skipped");
  // mismatch (ready 이지만 다른 uid)
  assert.equal(awardExpLikeMyWorld(ready("some-other-uid"), 10), "skipped");

  const doc = await readDoc(auth.currentUser!.uid);
  assert.equal(doc?.doriExp ?? 0, 0, "게이트를 통과하지 못하면 서버에 EXP 가 없어야 한다");
});

test("firestore rules still reject writing EXP into another user's document", async () => {
  const a = await signInTestUser(auth, "rule-a");
  const b = await signInTestUser(auth, "rule-b"); // 현재 = B
  // B 세션에서 A 문서에 직접 EXP 쓰기 시도 → 규칙이 거부
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", a.uid), { doriExp: 999 }, { merge: true }),
    (e: { code?: string }) => String(e.code || e).includes("permission-denied"),
  );
  assert.ok(b.uid);
});
