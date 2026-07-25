import assert from "node:assert/strict";
import test from "node:test";
import {
  commitAuthoritativeToUidKey,
  createAuthenticatedScope,
  guestCacheKey,
  keyHasPii,
  readWithLegacyFallback,
  uidCacheKey,
  type AuthenticatedStorageScope,
} from "../lib/myWorld/storageScope.ts";
import { resolveMyWorldIdentity } from "../lib/myWorld/identity.ts";
import { createMemoryStorage } from "../lib/myWorld/interaction/storage.ts";

const UID_A = "uid-aaaa";
const UID_B = "uid-bbbb";
const ready = (uid: string) => resolveMyWorldIdentity({ authStatus: "authenticated", firebaseUid: uid });
const scopeA: AuthenticatedStorageScope = { uid: UID_A, legacyEmail: "a@x.com" };

// ── scope 생성 ──────────────────────────────────────────────────────
test("scope is created only when identity is ready and currentUser matches the uid", () => {
  assert.deepEqual(
    createAuthenticatedScope(ready(UID_A), { uid: UID_A, email: "a@x.com" }),
    { uid: UID_A, legacyEmail: "a@x.com" },
  );
  // uid 불일치(계정 전환 순간) → 스코프 없음
  assert.equal(createAuthenticatedScope(ready(UID_A), { uid: UID_B, email: "b@x.com" }), null);
  // currentUser 없음
  assert.equal(createAuthenticatedScope(ready(UID_A), null), null);
  // 게스트/판정중/불완전 → 스코프 없음
  assert.equal(createAuthenticatedScope(resolveMyWorldIdentity({ authStatus: "unauthenticated", firebaseUid: null }), null), null);
  assert.equal(createAuthenticatedScope(resolveMyWorldIdentity({ authStatus: "loading", firebaseUid: UID_A }), { uid: UID_A, email: "a@x.com" }), null);
});

test("a null-email user still gets a valid uid scope (email is optional)", () => {
  const scope = createAuthenticatedScope(ready(UID_A), { uid: UID_A, email: null });
  assert.deepEqual(scope, { uid: UID_A, legacyEmail: null });
  assert.equal(uidCacheKey(scope!, "exp"), "myworld_exp_uid_uid-aaaa");
});

// ── 키 규약 ──────────────────────────────────────────────────────────
test("uid cache keys never contain an email or @ symbol", () => {
  for (const name of ["exp", "interaction", "attendance", "diary"]) {
    const key = uidCacheKey(scopeA, name);
    assert.equal(keyHasPii(key), false, key);
    assert.equal(key.includes("@"), false);
    assert.equal(key.includes("x.com"), false);
    assert.match(key, /^myworld_[a-z0-9_]+_uid_uid-aaaa$/);
  }
});

test("same uid yields the same key even if the email changes; different uid yields a different key", () => {
  const beforeEmailChange: AuthenticatedStorageScope = { uid: UID_A, legacyEmail: "old@x.com" };
  const afterEmailChange: AuthenticatedStorageScope = { uid: UID_A, legacyEmail: "new@y.com" };
  assert.equal(uidCacheKey(beforeEmailChange, "exp"), uidCacheKey(afterEmailChange, "exp"));

  const otherUser: AuthenticatedStorageScope = { uid: UID_B, legacyEmail: "old@x.com" }; // 같은 이메일처럼 보여도
  assert.notEqual(uidCacheKey(scopeA, "exp"), uidCacheKey(otherUser, "exp"));
});

test("guest keys are isolated from authenticated keys", () => {
  assert.equal(guestCacheKey("interaction"), "myworld_interaction_guest");
  assert.notEqual(guestCacheKey("exp"), uidCacheKey(scopeA, "exp"));
  assert.equal(keyHasPii(guestCacheKey("exp")), false);
});

test("keyHasPii flags emails and email-shaped keys", () => {
  assert.equal(keyHasPii("dori_cc_user@example.com"), true);
  assert.equal(keyHasPii("myworld_exp_uid_uid-aaaa"), false);
  assert.equal(keyHasPii("myworld_email_uid_x"), true);
});

test("invalid uid or cache name is rejected", () => {
  assert.throws(() => uidCacheKey({ uid: "bad uid!", legacyEmail: null }, "exp"));
  assert.throws(() => uidCacheKey(scopeA, "Exp Name"));
  assert.throws(() => uidCacheKey({ uid: "a@b.com", legacyEmail: null }, "exp")); // uid 에 @ 방지
});

// ── legacy 우선순위 & 마이그레이션 ──────────────────────────────────
const validate = (v: { exp: number }) => typeof v?.exp === "number" && Number.isFinite(v.exp) && v.exp >= 0 && v.exp < 1e9;

test("uid key wins over a legacy key", () => {
  const storage = createMemoryStorage();
  const uidKey = uidCacheKey(scopeA, "exp");
  const legacyKey = "dori_game_profile_a@x.com";
  storage.setItem(uidKey, JSON.stringify({ exp: 50 }));
  storage.setItem(legacyKey, JSON.stringify({ exp: 999 }));
  const r = readWithLegacyFallback(storage, uidKey, legacyKey, validate);
  assert.equal(r.source, "uid");
  assert.equal(r.value!.exp, 50);
});

test("legacy key is used only as a display fallback when no uid key exists", () => {
  const storage = createMemoryStorage();
  const uidKey = uidCacheKey(scopeA, "exp");
  const legacyKey = "dori_game_profile_a@x.com";
  storage.setItem(legacyKey, JSON.stringify({ exp: 42 }));
  const r = readWithLegacyFallback(storage, uidKey, legacyKey, validate);
  assert.equal(r.source, "legacy");
  assert.equal(r.value!.exp, 42);
});

test("malformed or out-of-range legacy payloads are ignored", () => {
  const storage = createMemoryStorage();
  const uidKey = uidCacheKey(scopeA, "exp");
  const legacyKey = "dori_game_profile_a@x.com";
  for (const bad of ["{not json", JSON.stringify({ exp: -5 }), JSON.stringify({ exp: Number.MAX_VALUE }), JSON.stringify({ exp: "999" })]) {
    storage.setItem(legacyKey, bad);
    assert.equal(readWithLegacyFallback(storage, uidKey, legacyKey, validate).source, "none");
  }
});

test("committing authoritative value writes the uid key and removes legacy only after success", () => {
  const storage = createMemoryStorage();
  const uidKey = uidCacheKey(scopeA, "exp");
  const legacyKey = "dori_game_profile_a@x.com";
  storage.setItem(legacyKey, JSON.stringify({ exp: 42 }));

  const res = commitAuthoritativeToUidKey(storage, uidKey, legacyKey, { exp: 100 });
  assert.equal(res.committed, true);
  assert.equal(res.legacyRemoved, true);
  assert.equal(JSON.parse(storage.getItem(uidKey)!).exp, 100);
  assert.equal(storage.getItem(legacyKey), null, "legacy 키는 uid 저장 성공 후에만 제거된다");
});

test("migration is idempotent and never duplicates", () => {
  const storage = createMemoryStorage();
  const uidKey = uidCacheKey(scopeA, "exp");
  const legacyKey = "dori_game_profile_a@x.com";
  storage.setItem(legacyKey, JSON.stringify({ exp: 42 }));

  const first = commitAuthoritativeToUidKey(storage, uidKey, legacyKey, { exp: 100 });
  const second = commitAuthoritativeToUidKey(storage, uidKey, legacyKey, { exp: 100 });
  const third = commitAuthoritativeToUidKey(storage, uidKey, legacyKey, { exp: 100 });
  assert.equal(first.legacyRemoved, true);
  assert.equal(second.legacyRemoved, false); // 이미 제거됨
  assert.equal(third.legacyRemoved, false);
  assert.equal(JSON.parse(storage.getItem(uidKey)!).exp, 100); // 값 중복/합산 없음
  assert.equal(readWithLegacyFallback(storage, uidKey, legacyKey, validate).source, "uid");
});

test("server authoritative value overwrites a stale/tampered legacy local value", () => {
  const storage = createMemoryStorage();
  const uidKey = uidCacheKey(scopeA, "exp");
  const legacyKey = "dori_game_profile_a@x.com";
  storage.setItem(legacyKey, JSON.stringify({ exp: 999999 })); // 조작된 로컬 값

  // 서버(권위) 값 30 을 커밋 → legacy 총량을 서버로 올리지 않고, UID 키는 서버 값이 된다.
  commitAuthoritativeToUidKey(storage, uidKey, legacyKey, { exp: 30 });
  const r = readWithLegacyFallback(storage, uidKey, legacyKey, validate);
  assert.equal(r.source, "uid");
  assert.equal(r.value!.exp, 30, "조작된 로컬 값이 서버 권위 값을 덮어쓰면 안 된다");
});

test("no-storage environments are safe no-ops", () => {
  assert.deepEqual(readWithLegacyFallback(null, "k", "l", validate), { value: null, source: "none" });
  assert.deepEqual(commitAuthoritativeToUidKey(null, "k", "l", { exp: 1 }), { committed: false, legacyRemoved: false });
});
