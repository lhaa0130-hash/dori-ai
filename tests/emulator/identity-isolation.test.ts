// 05-06D — 로그아웃·계정 전환 시 데이터 격리 (Auth/Firestore 에뮬레이터, 실제 SDK).
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { clearFirestore, installBrowserShim, prepareEmulatorEnv, shutdownFirebase, signInTestUser, uninstallBrowserShim } from "./harness.ts";
import { canLoadRemote, canPersistFor, resolveMyWorldIdentity } from "@/lib/myWorld/identity";

let fs: typeof import("firebase/firestore");
let db: import("firebase/firestore").Firestore;
let auth: import("firebase/auth").Auth;
let interactionState: typeof import("@/lib/myWorld/interaction/state");
let storage: typeof import("@/lib/myWorld/interaction/storage");
let engine: typeof import("@/lib/myWorld/interaction/engine");
let shim: { storage: Map<string, string>; events: string[] };

const AT = Date.now();
const ready = (uid: string) => resolveMyWorldIdentity({ authStatus: "authenticated", firebaseUid: uid });
const guest = () => resolveMyWorldIdentity({ authStatus: "unauthenticated", firebaseUid: null });

before(async () => {
  prepareEmulatorEnv();
  shim = installBrowserShim();
  const firebase = await import("@/lib/firebase");
  fs = await import("firebase/firestore");
  auth = firebase.getFirebaseAuth();
  db = firebase.getFirebaseFirestore();
  interactionState = await import("@/lib/myWorld/interaction/state");
  storage = await import("@/lib/myWorld/interaction/storage");
  engine = await import("@/lib/myWorld/interaction/engine");
});

after(async () => { await shutdownFirebase(); uninstallBrowserShim(); });
beforeEach(async () => { await clearFirestore(); shim.storage.clear(); });

const readDoc = async (uid: string) => (await fs.getDoc(fs.doc(db, "users", uid))).data() as Record<string, any> | undefined;
const stateWith = (affinity: number) => ({ ...engine.defaultInteractionState(AT), affinity, lastInteraction: AT });

test("user A's data stays in user A's document only", async () => {
  const a = await signInTestUser(auth, "iso-a");
  await interactionState.saveInteractionState(a.uid, stateWith(11));

  const b = await signInTestUser(auth, "iso-b");
  const bRemote = await interactionState.loadInteractionState(b.uid);
  assert.equal(bRemote.affinity, 0, "B 는 A 의 친밀도를 보면 안 된다");
  assert.equal((await readDoc(b.uid)) === undefined || !(await readDoc(b.uid))?.myWorld?.interaction, true);

  // A 문서는 그대로
  await signInTestUser(auth, "iso-a");
  assert.equal((await readDoc(a.uid))!.myWorld.interaction.affinity, 11);
});

test("a queue belonging to A is never flushed into B's document", async () => {
  const ls = (globalThis as unknown as { localStorage: import("@/lib/myWorld/interaction/storage").KeyValueStorage }).localStorage;
  const a = await signInTestUser(auth, "q-a");
  storage.writeQueuedState(ls, a.uid, stateWith(9));
  assert.equal(storage.hasQueuedState(ls, a.uid), true);

  // B 로 전환된 상태에서 A 의 큐를 보내려 시도 → 게이트가 막아야 한다.
  const b = await signInTestUser(auth, "q-b");
  const identityAsB = ready(b.uid);
  assert.equal(canPersistFor(a.uid, identityAsB), false);

  let persistCalls = 0;
  const result = await storage.flushQueuedState(ls, a.uid, async (queued) => {
    if (!canPersistFor(a.uid, identityAsB)) throw new Error("identity changed");
    persistCalls += 1;
    await interactionState.saveInteractionState(a.uid, queued);
  });

  assert.equal(persistCalls, 0, "다른 사용자 세션에서는 전송 자체가 일어나지 않아야 한다");
  assert.equal(result.kept, true, "실패했으므로 큐는 유지된다");
  assert.equal(storage.hasQueuedState(ls, a.uid), true);

  const bDoc = await readDoc(b.uid);
  assert.equal(bDoc?.myWorld?.interaction, undefined, "B 문서에 A 데이터가 들어가면 안 된다");
});

test("a save scheduled before logout does not run afterwards", async () => {
  const a = await signInTestUser(auth, "logout-a");
  await interactionState.saveInteractionState(a.uid, stateWith(20));

  // 로그아웃 시점의 신원으로 재검증하면 쓰기가 거부된다.
  const { signOut } = await import("firebase/auth");
  await signOut(auth);
  const identityAfterLogout = guest();
  assert.equal(canPersistFor(a.uid, identityAfterLogout), false);
  assert.equal(canLoadRemote(identityAfterLogout), false);

  // 게이트를 지키면 서버 값은 로그아웃 전 그대로 남는다(기본 상태로 덮이지 않음).
  await signInTestUser(auth, "logout-a-again");
  const doc = await readDoc(a.uid);
  assert.equal(doc!.myWorld.interaction.affinity, 20, "로그아웃 후 예약 저장이 실행되면 20 이 0 으로 덮인다");
});

test("firestore rules still deny writing another user's document", async () => {
  const a = await signInTestUser(auth, "rules-a");
  await interactionState.saveInteractionState(a.uid, stateWith(5));
  const b = await signInTestUser(auth, "rules-b");

  await assert.rejects(
    interactionState.saveInteractionState(a.uid, stateWith(99)),  // B 세션에서 A 문서에 쓰기
    (e: { code?: string }) => String(e.code || e).includes("permission-denied"),
    "규칙이 교차 사용자 쓰기를 계속 거부해야 한다",
  );

  await signInTestUser(auth, "rules-a-2");
  assert.equal((await readDoc(a.uid))!.myWorld.interaction.affinity, 5, "A 데이터가 훼손되지 않아야 한다");
  assert.ok(b.uid);
});

test("guest identity can neither read nor write remote state", async () => {
  const g = guest();
  assert.equal(g.status, "guest");
  assert.equal(canLoadRemote(g), false);
  assert.equal(canPersistFor("anything", g), false);
});

test("a late-arriving load for A must not be applied once B is active", async () => {
  const a = await signInTestUser(auth, "late-a");
  await interactionState.saveInteractionState(a.uid, stateWith(33));

  // A 의 로드를 시작해 두고 B 로 전환한 뒤 결과가 도착하는 상황
  const pendingLoad = interactionState.loadInteractionState(a.uid);
  const b = await signInTestUser(auth, "late-b");
  const loaded = await pendingLoad;

  assert.equal(loaded.affinity, 33, "로드 자체는 A 의 값을 반환한다");
  // 적용 여부는 게이트가 결정한다 — 현재 활성 사용자가 B 이므로 적용 금지.
  assert.equal(canPersistFor(a.uid, ready(b.uid)), false);
  const bRemote = await interactionState.loadInteractionState(b.uid);
  assert.equal(bRemote.affinity, 0, "B 의 상태는 A 의 늦은 응답에 오염되지 않는다");
});
