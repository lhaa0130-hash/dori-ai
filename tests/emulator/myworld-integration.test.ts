// My World 로그인 통합 검증 (05-06C) — 실제 앱 코드 경로를 Auth/Firestore 에뮬레이터에 대고 확인한다.
// saveInteractionState / loadInteractionState / addExp / addDiaryEntry 를 그대로 호출한다.
import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import {
  clearFirestore, installBrowserShim, prepareEmulatorEnv, shutdownFirebase, signInTestUser, uninstallBrowserShim,
} from "./harness.ts";

let fs: typeof import("firebase/firestore");
let db: import("firebase/firestore").Firestore;
let auth: import("firebase/auth").Auth;
let shim: { storage: Map<string, string>; events: string[] };

let interactionState: typeof import("@/lib/myWorld/interaction/state");
let engine: typeof import("@/lib/myWorld/interaction/engine");
let diaryState: typeof import("@/lib/myWorld/diary/state");
let diaryConstants: typeof import("@/lib/myWorld/diary/constants");
let characterRegistry: typeof import("@/lib/myWorld/character/registry");

let user: { uid: string; email: string };

const AT = Date.now();

before(async () => {
  prepareEmulatorEnv();                 // fail-closed guard
  shim = installBrowserShim();          // cottonCandy 등 브라우저 API 사용 모듈용
  const firebase = await import("@/lib/firebase");
  fs = await import("firebase/firestore");
  auth = firebase.getFirebaseAuth();
  db = firebase.getFirebaseFirestore();
  interactionState = await import("@/lib/myWorld/interaction/state");
  engine = await import("@/lib/myWorld/interaction/engine");
  diaryState = await import("@/lib/myWorld/diary/state");
  diaryConstants = await import("@/lib/myWorld/diary/constants");
  characterRegistry = await import("@/lib/myWorld/character/registry");
});

after(async () => {
  await shutdownFirebase();
  uninstallBrowserShim();
});

beforeEach(async () => {
  await clearFirestore();
  shim.storage.clear();
  shim.events.length = 0;
  user = await signInTestUser(auth, "ix");
});

const userDoc = () => fs.doc(db, "users", user.uid);
const readUser = async () => (await fs.getDoc(userDoc())).data() as Record<string, any>;

/** 다른 기능이 이미 써 둔 데이터를 흉내 낸다(보존 검증용). */
async function seedUnrelatedData() {
  // ⚠️ 05-06H: doriExp/level/tier 는 클라이언트가 쓸 수 없다(Rules 차단) → 시드에서 제외.
  //   서버 권위 필드는 SA REST 만 쓰므로 에뮬 클라이언트 시드는 비보상 필드만 넣는다.
  await fs.setDoc(userDoc(), {
    nickname: "도리팬",
    cottonCandy: 120,
    attendance: { lastChecked: "2026-07-24", streak: 3, totalDays: 10, weekDays: ["mon"] },
    myWorld: {
      character: { selectedId: "bomi", owned: ["dori", "bomi"], expression: "happy" },
      room: { version: 1, themeId: "basic", floorId: "basic_wood", wallId: "basic_warm", placedItems: [{ instanceId: "keep-me", itemId: "bed-basic", x: 20, y: 30, scale: 1, rotation: 0, flipped: false, zIndex: 0 }] },
      diary: { entries: [{ id: "old-entry", userId: "seed", characterId: "dori", type: "system", title: "이전 기록", content: "보존되어야 함", createdAt: AT - 1000, icon: "✨", color: "#a78bfa" }] },
    },
  }, { merge: true });
}

// ── B. Interaction 실제 roundtrip ───────────────────────────────────────
test("saves interaction state to Firestore and restores it on a fresh read", async () => {
  const start = engine.defaultInteractionState(AT);
  const result = engine.processInteraction(start, { type: "pet", at: AT, source: "pointer", characterId: "dori" });
  assert.equal(result.accepted, true);

  await interactionState.saveInteractionState(user.uid, result.state);

  const raw = await readUser();
  assert.equal(raw.myWorld.interaction.affinity, 2);
  assert.equal(raw.myWorld.interaction.emotion, "love");
  assert.ok(raw.myWorld.interaction.updatedAt, "updatedAt(serverTimestamp) 이 기록되어야 한다");
  assert.equal(Array.isArray(raw.myWorld.interaction.recent), true);
  assert.equal(raw.myWorld.interaction.recent.length, 1);

  // 새 로드(앱 재진입과 동일 경로)에서 동일 상태 복원
  const restored = await interactionState.loadInteractionState(user.uid);
  assert.equal(restored.affinity, 2);
  assert.equal(restored.emotion, "love");
  assert.equal(restored.recent[0].type, "pet");
});

test("normalizes corrupt server data on load instead of throwing", async () => {
  await fs.setDoc(userDoc(), {
    myWorld: { interaction: { affinity: 9999, emotion: "bogus", recent: "not-an-array", daily: { date: "2000-01-01", count: -3 }, version: 0 } },
  }, { merge: true });

  const restored = await interactionState.loadInteractionState(user.uid);
  assert.equal(restored.affinity, 100);
  assert.equal(restored.emotion, "normal");
  assert.deepEqual(restored.recent, []);
  assert.equal(restored.version, 1);
  assert.equal(restored.daily.count, 0);
});

test("only accepted interactions reach the server; the latest state wins after repeated saves", async () => {
  let state = engine.defaultInteractionState(AT);
  const first = engine.processInteraction(state, { type: "touch", at: AT, source: "pointer", characterId: "dori" });
  state = first.state;

  // 쿨다운으로 거절 → 상태 변화 없음
  const rejected = engine.processInteraction(state, { type: "touch", at: AT + 100, source: "pointer", characterId: "dori" });
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.state.affinity, state.affinity);

  // 연속 저장(디바운스 후 마지막 상태가 최종이어야 함)
  await interactionState.saveInteractionState(user.uid, state);
  const second = engine.processInteraction({ ...state, cooldowns: {} }, { type: "gift", at: AT + 10_000, source: "pointer", characterId: "dori" });
  await interactionState.saveInteractionState(user.uid, second.state);

  const raw = await readUser();
  assert.equal(raw.myWorld.interaction.affinity, second.state.affinity);
  assert.equal(raw.myWorld.interaction.recent.length, 2);
});

// ── C. 기존 데이터 보존 ────────────────────────────────────────────────
test("merge save preserves character, room, diary and account fields", async () => {
  await seedUnrelatedData();
  const before = await readUser();

  const result = engine.processInteraction(engine.defaultInteractionState(AT), { type: "greet", at: AT, source: "pointer", characterId: "dori" });
  await interactionState.saveInteractionState(user.uid, result.state);

  const after = await readUser();
  assert.equal(after.nickname, "도리팬");
  assert.equal(after.cottonCandy, 120);
  assert.equal(after.doriExp, before.doriExp);
  assert.deepEqual(after.attendance, before.attendance);
  assert.equal(after.myWorld.character.selectedId, "bomi");
  assert.deepEqual(after.myWorld.character.owned, ["dori", "bomi"]);
  assert.equal(after.myWorld.room.placedItems[0].instanceId, "keep-me");
  assert.equal(after.myWorld.diary.entries[0].id, "old-entry");
  assert.equal(after.myWorld.interaction.affinity, result.state.affinity); // 새로 기록됨
});

test("stored interaction payload contains no PII", async () => {
  const result = engine.processInteraction(engine.defaultInteractionState(AT), { type: "pet", at: AT, source: "pointer", characterId: "dori" });
  await interactionState.saveInteractionState(user.uid, result.state);
  const raw = await readUser();
  const serialized = JSON.stringify(raw.myWorld.interaction);
  for (const pii of ["email", "displayName", "photoURL", "provider", "@emulator.test", "idToken", "accessToken"]) {
    assert.equal(serialized.includes(pii), false, `PII 유출: ${pii}`);
  }
});

// ── D. EXP 서버 권위 — 클라이언트 직접 쓰기 차단(05-06H) ─────────────────
test("client cannot write doriExp/level/tier directly (rules deny); unrelated game data is preserved", async () => {
  await seedUnrelatedData();
  const fs = await import("firebase/firestore");

  // 클라이언트가 doriExp 를 직접 올리려는 시도 → Rules 가 거부(서버 권위).
  await assert.rejects(
    fs.setDoc(fs.doc(db, "users", user.uid), { doriExp: 30, level: 5, tier: 3 }, { merge: true }),
    (e: { code?: string }) => String(e.code || e).includes("permission-denied"),
    "클라이언트 직접 EXP 쓰기는 거부돼야 한다",
  );

  // 거부돼도 기존 게임 데이터(솜사탕·캐릭터·myWorld)는 그대로 보존.
  const raw = await readUser();
  assert.equal(raw?.doriExp ?? 0, 0, "직접 쓰기 실패 후 서버 EXP 는 그대로");
  assert.equal(raw?.cottonCandy, 120);
  assert.equal(raw?.myWorld.character.selectedId, "bomi");

  // 정상 저장(솜사탕/myWorld 등 비보상 필드)은 여전히 허용됨을 함께 확인.
  await fs.setDoc(fs.doc(db, "users", user.uid), { cottonCandy: 130 }, { merge: true });
  assert.equal((await readUser())?.cottonCandy, 130, "비보상 필드 저장은 정상 통과해야 한다");
});

test("EXP is not written for rejected interactions", async () => {
  await seedUnrelatedData();
  const before = await readUser();
  const state = engine.processInteraction(engine.defaultInteractionState(AT), { type: "pet", at: AT, source: "pointer", characterId: "dori" }).state;
  const rejected = engine.processInteraction(state, { type: "pet", at: AT + 10, source: "pointer", characterId: "dori" });

  assert.equal(rejected.accepted, false);
  assert.equal(rejected.event, undefined);   // UI 는 event.expDelta 로만 적립 → 호출 자체가 일어나지 않음

  const after = await readUser();
  assert.equal(after.doriExp, before.doriExp);
});

// ── E. Diary 실제 생성 ─────────────────────────────────────────────────
test("creates exactly one diary entry for a qualifying interaction", async () => {
  const character = characterRegistry.getCharacter("dori");
  const event = { id: "ix_1", type: "pet" as const, source: "pointer" as const, characterId: "dori", at: AT, emotion: "love" as const, animation: "pet" as const, speech: "포근해", affinityDelta: 2, expDelta: 2, metadata: {} };
  const entry = diaryConstants.buildInteractionEntry(character, event, { firstMeeting: true, longAbsence: false, milestone: null });

  const afterFirst = await diaryState.addDiaryEntry(user.uid, entry);
  assert.equal(afterFirst.entries.length, 1);

  const raw = await readUser();
  const stored = raw.myWorld.diary.entries[0];
  assert.equal(stored.type, "interaction");
  assert.equal(stored.characterId, "dori");
  assert.equal(stored.userId, user.uid);
  assert.equal(typeof stored.createdAt, "number");
  assert.ok(stored.title && stored.content);
  assert.equal(stored.metadata.interactionType, "pet");
});

test("diary entries do not leak between users", async () => {
  const character = characterRegistry.getCharacter("dori");
  const event = { id: "ix_a", type: "gift" as const, source: "pointer" as const, characterId: "dori", at: AT, emotion: "excited" as const, animation: "eat" as const, speech: "고마워", affinityDelta: 4, expDelta: 5, metadata: {} };
  await diaryState.addDiaryEntry(user.uid, diaryConstants.buildInteractionEntry(character, event, { firstMeeting: true, longAbsence: false, milestone: null }));

  const other = await signInTestUser(auth, "ix-other");
  const otherEntries = await diaryState.getDiaryState(other.uid);
  assert.deepEqual(otherEntries.entries, [], "다른 사용자의 일기가 섞이면 안 된다");

  await signInTestUser(auth, "ix");
});

test("interaction save and diary write do not destroy each other", async () => {
  await seedUnrelatedData();
  const character = characterRegistry.getCharacter("dori");
  const result = engine.processInteraction(engine.defaultInteractionState(AT), { type: "pet", at: AT, source: "pointer", characterId: "dori" });
  await interactionState.saveInteractionState(user.uid, result.state);

  const event = { id: "ix_2", type: "pet" as const, source: "pointer" as const, characterId: "dori", at: AT, emotion: "love" as const, animation: "pet" as const, speech: "좋아", affinityDelta: 2, expDelta: 2, metadata: {} };
  await diaryState.addDiaryEntry(user.uid, diaryConstants.buildInteractionEntry(character, event, { firstMeeting: true, longAbsence: false, milestone: null }));

  const raw = await readUser();
  assert.equal(raw.myWorld.interaction.affinity, result.state.affinity);   // interaction 유지
  assert.equal(raw.myWorld.diary.entries.length, 2);                        // 시드 1 + 신규 1
  assert.equal(raw.myWorld.character.selectedId, "bomi");                   // character 유지
  assert.equal(raw.myWorld.room.placedItems[0].instanceId, "keep-me");      // room 유지
});
