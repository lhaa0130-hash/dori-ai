// 05-06F — 보상 신뢰경계 & 멱등 (Auth/Firestore 에뮬레이터, 실제 SDK).
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { clearFirestore, installBrowserShim, prepareEmulatorEnv, shutdownFirebase, signInTestUser, uninstallBrowserShim, waitFor } from "./harness.ts";

let fs: typeof import("firebase/firestore");
let db: import("firebase/firestore").Firestore;
let auth: import("firebase/auth").Auth;
let cottonCandy: typeof import("@/lib/cottonCandy");
let diaryState: typeof import("@/lib/myWorld/diary/state");
let shim: { storage: Map<string, string>; events: string[] };

before(async () => {
  prepareEmulatorEnv();
  shim = installBrowserShim();
  const firebase = await import("@/lib/firebase");
  fs = await import("firebase/firestore");
  auth = firebase.getFirebaseAuth();
  db = firebase.getFirebaseFirestore();
  cottonCandy = await import("@/lib/cottonCandy");
  diaryState = await import("@/lib/myWorld/diary/state");
});
after(async () => { await shutdownFirebase(); uninstallBrowserShim(); });
beforeEach(async () => { await clearFirestore(); shim.storage.clear(); shim.events.length = 0; });

const readDoc = async (uid: string) => (await fs.getDoc(fs.doc(db, "users", uid))).data() as Record<string, any> | undefined;

// ── P0 재현: 조작된 localStorage 로 서버 EXP 를 임의 증가 ──────────────
test("REPRODUCTION: tampered localStorage cache lets the client inflate server EXP", async () => {
  const u = await signInTestUser(auth, "p0");
  await fs.setDoc(fs.doc(db, "users", u.uid), { doriExp: 10, cottonCandy: 0, tier: 1, level: 1 }, { merge: true });

  // 공격: 캐시의 doriExp 를 999999 로 조작한 뒤, 정상적으로 EXP 를 주는 행동을 1회 수행.
  shim.storage.set(`dori_game_profile_${u.email}`, JSON.stringify({ doriExp: 999999, cottonCandy: 0, tier: 1, level: 1 }));
  cottonCandy.addExp(u.email, 2, "My World pet");

  const doc = await waitFor(async () => { const d = await readDoc(u.uid); return d && d.doriExp !== 10 ? d : null; }, { label: "exp write" });
  // 현재(취약) 동작: 서버 doriExp 가 10+2=12 가 아니라 조작값 기반 1000001 이 된다.
  assert.equal(doc.doriExp, 1000001,
    "P0 확인: addExp 가 로컬 캐시값으로 서버 EXP 를 계산·덮어씀. 서버 권위화 전까지 유효한 취약점.");
});

// ── reward operation ledger 규칙: 클라이언트는 원장을 위조할 수 없다 ──
test("clients cannot create, modify, or delete a reward operation ledger entry", async () => {
  const u = await signInTestUser(auth, "ledger");
  const ref = fs.doc(db, "users", u.uid, "rewardOperations", "mwi_abcdefgh");
  await assert.rejects(
    fs.setDoc(ref, { awardedExp: 999, resultingExp: 999 }),
    (e: { code?: string }) => String(e.code || e).includes("permission-denied"),
    "클라이언트가 원장을 직접 만들면 안 된다",
  );
});

test("a user may read their own ledger but not another user's", async () => {
  const a = await signInTestUser(auth, "led-a");
  // 자기 원장 read 는 허용(없으면 not-exists 스냅샷, 오류 아님)
  const own = await fs.getDoc(fs.doc(db, "users", a.uid, "rewardOperations", "mwi_selfselfself"));
  assert.equal(own.exists(), false);

  const b = await signInTestUser(auth, "led-b"); // 현재 = B
  await assert.rejects(
    fs.getDoc(fs.doc(db, "users", a.uid, "rewardOperations", "mwi_otherother")),
    (e: { code?: string }) => String(e.code || e).includes("permission-denied"),
    "타인의 원장은 읽을 수 없다",
  );
});

// ── Diary 멱등: 같은 operation(eventId)으로 재전송해도 1건 ──────────────
test("addDiaryEntry is idempotent for the same interaction event id", async () => {
  const u = await signInTestUser(auth, "diary");
  const input = {
    type: "interaction" as const, characterId: "dori", title: "함께한 순간", content: "쓰다듬음",
    icon: "💬", color: "#4FA3E3", metadata: { eventId: "ix_fixed_operation_1", interactionType: "pet" },
  };
  const first = await diaryState.addDiaryEntry(u.uid, input);
  assert.equal(first.entries.length, 1);

  // 재전송(같은 eventId) 2회 → 중복 생성 없음
  const second = await diaryState.addDiaryEntry(u.uid, input);
  const third = await diaryState.addDiaryEntry(u.uid, { ...input, content: "다른 텍스트지만 같은 이벤트" });
  assert.equal(second.entries.length, 1);
  assert.equal(third.entries.length, 1, "같은 eventId 면 내용이 달라도 1건 유지");

  // 서버 문서에도 1건만
  const doc = await readDoc(u.uid);
  assert.equal(doc!.myWorld.diary.entries.length, 1);

  // 다른 eventId 는 정상 추가
  const other = await diaryState.addDiaryEntry(u.uid, { ...input, metadata: { eventId: "ix_fixed_operation_2", interactionType: "gift" } });
  assert.equal(other.entries.length, 2);
});
