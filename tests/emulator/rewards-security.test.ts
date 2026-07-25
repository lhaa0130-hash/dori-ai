// 05-06F — 보상 신뢰경계 & 멱등 (Auth/Firestore 에뮬레이터, 실제 SDK).
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import { clearFirestore, installBrowserShim, prepareEmulatorEnv, shutdownFirebase, signInTestUser, uninstallBrowserShim } from "./harness.ts";

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
const isDenied = (e: { code?: string }) => String(e.code || e).includes("permission-denied");

// ── P0 CLOSED: 클라이언트 EXP 라이터 제거 + 캐시 조작 무효 + 직접 쓰기 Rules 거부 ──────────────
test("P0 CLOSED: the client-authoritative addExp writer is gone", () => {
  // 과거 취약점의 진원지. 이제 EXP 적립은 서버 권위 엔드포인트만 담당한다.
  assert.equal((cottonCandy as Record<string, unknown>).addExp, undefined, "cottonCandy.addExp 는 제거돼야 한다");
  assert.equal((cottonCandy as Record<string, unknown>).ensureExpAtLeast, undefined, "ensureExpAtLeast 도 제거");
});

test("P0 CLOSED: tampering the localStorage cache has no server effect (rules deny direct EXP writes)", async () => {
  const u = await signInTestUser(auth, "p0");
  // 가입 기본값(create 규칙이 허용하는 doriExp=0). 클라이언트는 애초에 0 이 아닌 값으로 시드할 수 없다.
  await fs.setDoc(fs.doc(db, "users", u.uid), { doriExp: 0, cottonCandy: 0, tier: 1, level: 1 }, { merge: true });

  // 공격 재현: 캐시의 doriExp 를 999999 로 조작.
  shim.storage.set(`dori_game_profile_${u.email}`, JSON.stringify({ doriExp: 999999, cottonCandy: 0, tier: 1, level: 1 }));

  // 조작된 캐시값을 서버에 직접 반영하려는 유일한 방법(직접 setDoc)은 Rules 가 거부한다.
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", u.uid), { doriExp: 1000001, tier: 9, level: 9 }, { merge: true }),
    isDenied, "클라이언트의 doriExp/level/tier 직접 쓰기는 Rules 로 차단",
  );
  // 서버 EXP 는 원래 값 그대로. 캐시 조작이 서버에 전혀 영향 없음.
  const doc = await readDoc(u.uid);
  assert.equal(doc!.doriExp, 0, "캐시 조작 후에도 서버 doriExp 는 0 그대로(조작 무효)");
});

test("P0 CLOSED: rules also block the reward daily/type counter fields (no cap bypass)", async () => {
  const u = await signInTestUser(auth, "p0-cap");
  await fs.setDoc(fs.doc(db, "users", u.uid), { doriExp: 0, tier: 1, level: 1 }, { merge: true });
  // 일일 카운터를 0 으로 리셋해 서버 상한을 우회하려는 시도 → 거부.
  for (const field of ["rewardDailyExp", "rewardTypeExp_community_post", "rewardTypeExp_minigame_play"]) {
    await assert.rejects(
      fs.setDoc(fs.doc(db, "users", u.uid), { [field]: 0 }, { merge: true }),
      isDenied, `${field} 클라이언트 쓰기는 거부돼야 한다`,
    );
  }
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
