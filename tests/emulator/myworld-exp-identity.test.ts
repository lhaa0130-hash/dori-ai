// 05-06E/05-06H — My World EXP 적립 게이트가 Identity Gate 를 따르고, EXP 영속화는 서버 권위임을 검증.
//  · 클라이언트는 scope(ready + currentUser uid 일치)일 때만 서버 보상을 청구한다(순수 경계).
//  · 실제 doriExp 는 클라이언트가 Firestore 에 못 쓴다(Rules 차단) — 서버(SA REST)만 갱신.
//  (과거엔 cottonCandy.addExp 가 클라이언트에서 doriExp 를 직접 썼고 그게 P0 였다 → 제거됨.)
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { clearFirestore, installBrowserShim, prepareEmulatorEnv, shutdownFirebase, signInTestUser, uninstallBrowserShim } from "./harness.ts";
import { createAuthenticatedScope } from "@/lib/myWorld/storageScope";
import { resolveMyWorldIdentity } from "@/lib/myWorld/identity";

let fs: typeof import("firebase/firestore");
let db: import("firebase/firestore").Firestore;
let auth: import("firebase/auth").Auth;
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
});
after(async () => { await shutdownFirebase(); uninstallBrowserShim(); });
beforeEach(async () => { await clearFirestore(); shim.storage.clear(); shim.events.length = 0; });

/** 클라이언트가 보상을 '청구할지' 결정하는 순수 게이트(서버 청구 경로가 실제로 쓰는 판정). Firestore 를 건드리지 않는다. */
function wouldClaim(identity: ReturnType<typeof ready>): "awarded" | "skipped" {
  return createAuthenticatedScope(identity, currentUser()) ? "awarded" : "skipped";
}
/** 클라이언트가 직접 서버 EXP 를 쓰려는 시도(반드시 Rules 로 거부돼야 한다). */
const directExpWrite = (uid: string, exp: number) => fs.setDoc(fs.doc(db, "users", uid), { doriExp: exp }, { merge: true });
const isDenied = (e: { code?: string }) => String(e.code || e).includes("permission-denied");

test("본인 scope 는 청구 허용 — 그러나 클라이언트의 직접 doriExp 쓰기는 Rules 가 거부(서버 권위)", async () => {
  const a = await signInTestUser(auth, "exp-a");
  await fs.setDoc(fs.doc(db, "users", a.uid), { doriExp: 0, level: 1, tier: 1 }, { merge: true }); // 가입 기본값(허용)
  assert.equal(wouldClaim(ready(a.uid)), "awarded");
  // 서버 권위: 클라이언트가 doriExp 를 직접 올리는 것은 차단.
  await assert.rejects(directExpWrite(a.uid, 20), isDenied, "클라이언트 직접 doriExp 쓰기는 거부돼야 한다");
  const d = await readDoc(a.uid);
  assert.equal(d?.doriExp, 0, "직접 쓰기 실패 후에도 서버 EXP 는 그대로 0");
});

test("A→B 전환 후 A-scope 청구는 skip, 두 문서 모두 클라이언트가 EXP 를 못 바꾼다", async () => {
  const a = await signInTestUser(auth, "sw-a");
  const b = await signInTestUser(auth, "sw-b");   // 현재 로그인 = B

  // A 신원 + currentUser=B → scope 불일치 → 청구하지 않음.
  assert.equal(wouldClaim(ready(a.uid)), "skipped");
  // B 자신은 청구 허용(게이트 통과)이지만, 그래도 직접 EXP 쓰기는 Rules 가 막는다.
  assert.equal(wouldClaim(ready(b.uid)), "awarded");
  await assert.rejects(directExpWrite(b.uid, 7), isDenied);
  await assert.rejects(directExpWrite(a.uid, 50), isDenied); // 타인 문서도 당연히 거부
  assert.equal((await readDoc(a.uid))?.doriExp ?? 0, 0);
  assert.equal((await readDoc(b.uid))?.doriExp ?? 0, 0);
});

test("guest·loading·mismatch 신원은 청구하지 않는다", async () => {
  await signInTestUser(auth, "gate-a");
  assert.equal(wouldClaim(resolveMyWorldIdentity({ authStatus: "unauthenticated", firebaseUid: null })), "skipped");
  assert.equal(wouldClaim(resolveMyWorldIdentity({ authStatus: "loading", firebaseUid: auth.currentUser!.uid })), "skipped");
  assert.equal(wouldClaim(ready("some-other-uid")), "skipped");
});

test("firestore rules 는 타인 문서로의 EXP 쓰기를 거부한다", async () => {
  const a = await signInTestUser(auth, "rule-a");
  const b = await signInTestUser(auth, "rule-b"); // 현재 = B
  await assert.rejects(directExpWrite(a.uid, 999), isDenied);
  assert.ok(b.uid);
});
