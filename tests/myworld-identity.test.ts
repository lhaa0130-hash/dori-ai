import assert from "node:assert/strict";
import test from "node:test";
import { canLoadRemote, canPersistFor, resolveMyWorldIdentity } from "../lib/myWorld/identity.ts";

const UID_A = "uid-aaaa";
const UID_B = "uid-bbbb";

const resolve = (authStatus: "loading" | "authenticated" | "unauthenticated", firebaseUid: string | null) =>
  resolveMyWorldIdentity({ authStatus, firebaseUid });

test("no session and no firebase user is a guest with no remote access", () => {
  const id = resolve("unauthenticated", null);
  assert.equal(id.status, "guest");
  assert.equal(id.firebaseUid, null);
  assert.equal(id.canReadRemote, false);
  assert.equal(id.canWriteRemote, false);
  assert.equal(canLoadRemote(id), false);
});

test("session without a firebase user is blocked (firebase-missing)", () => {
  const id = resolve("authenticated", null);
  assert.equal(id.status, "firebase-missing");
  assert.equal(id.firebaseUid, null);
  assert.equal(id.canReadRemote, false);
  assert.equal(id.canWriteRemote, false);
});

test("firebase user without an app session is blocked (session-missing)", () => {
  const id = resolve("unauthenticated", UID_A);
  assert.equal(id.status, "session-missing");
  assert.equal(id.canReadRemote, false);
  assert.equal(id.canWriteRemote, false);
  assert.equal(canLoadRemote(id), false);
});

test("while auth is still resolving nothing may touch the server", () => {
  for (const uid of [null, UID_A]) {
    const id = resolve("loading", uid);
    assert.equal(id.status, "loading");
    assert.equal(id.canReadRemote, false);
    assert.equal(id.canWriteRemote, false);
    assert.equal(canLoadRemote(id), false);
  }
});

test("authenticated session with a firebase uid is ready and uses the uid as canonical id", () => {
  const id = resolve("authenticated", UID_A);
  assert.equal(id.status, "ready");
  assert.equal(id.firebaseUid, UID_A);
  assert.equal(id.canReadRemote, true);
  assert.equal(id.canWriteRemote, true);
  assert.equal(canLoadRemote(id), true);
});

test("empty or malformed uid strings are never treated as an identity", () => {
  for (const bad of ["", "   ".trim(), null]) {
    const id = resolve("authenticated", bad as string | null);
    assert.equal(id.status, "firebase-missing");
    assert.equal(id.firebaseUid, null);
    assert.equal(id.canWriteRemote, false);
  }
});

// ── 예약된 쓰기의 실행 시점 재검증(로그아웃·계정 전환) ──────────────────
test("a write scheduled for user A is refused after logout", () => {
  const scheduled = resolve("authenticated", UID_A);
  assert.equal(canPersistFor(UID_A, scheduled), true);

  const afterLogout = resolve("unauthenticated", null);
  assert.equal(canPersistFor(UID_A, afterLogout), false, "로그아웃 후에는 A 문서에 쓰면 안 된다");
});

test("a write scheduled for user A is refused after switching to user B", () => {
  const asB = resolve("authenticated", UID_B);
  assert.equal(canPersistFor(UID_A, asB), false, "A 로 예약된 저장이 B 세션에서 실행되면 안 된다");
  assert.equal(canPersistFor(UID_B, asB), true, "B 자신의 저장은 허용");
});

test("a write is refused while auth is re-resolving (token refresh)", () => {
  const refreshing = resolve("loading", UID_A);
  assert.equal(canPersistFor(UID_A, refreshing), false, "판정 중에는 쓰지 않는다");
  // 갱신이 끝나 같은 사용자로 확정되면 다시 허용
  assert.equal(canPersistFor(UID_A, resolve("authenticated", UID_A)), true);
});

test("canPersistFor rejects missing or mismatched scheduled uids", () => {
  const ready = resolve("authenticated", UID_A);
  assert.equal(canPersistFor(null, ready), false);
  assert.equal(canPersistFor("", ready), false);
  assert.equal(canPersistFor("someone-else", ready), false);
});

test("identity never derives from email or display name", () => {
  // 같은 사람처럼 보여도 uid 가 다르면 절대 같은 신원이 아니다.
  const a = resolve("authenticated", UID_A);
  const b = resolve("authenticated", UID_B);
  assert.notEqual(a.firebaseUid, b.firebaseUid);
  assert.equal(canPersistFor(a.firebaseUid, b), false);
  // 반대로 uid 가 같으면 표시 정보와 무관하게 동일 신원이다.
  assert.equal(canPersistFor(UID_A, resolve("authenticated", UID_A)), true);
});
