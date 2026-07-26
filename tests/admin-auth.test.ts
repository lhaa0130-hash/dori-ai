// 05-08B — 관리자 인증 계약 테스트.
//
// ⭐ 핵심 검증: "토큰이 유효한 사용자" ≠ "관리자".
//   Firestore 접근이 성공한다는 건 로그인했다는 뜻일 뿐이다(누구나 자기 userPrivate 을 읽는다).
//   일반 사용자 토큰이 관리자 기사 발행을 통과하면 안 된다.
//
// ⚠️ 실제 운영 관리자 credential 을 쓰지 않는다. 토큰은 전부 로컬에서 만든 가짜이고,
//    Firestore 왕복은 mock verifier 로 대체한다(네트워크 없음).
import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeIdToken, tokenClaimsValid, decideAdminAccess, parseAdminUids, verifyAdmin,
  PROD_PROJECT_ID, ADMIN_EMAIL,
} from "../functions/_shared/adminAuth.ts";

const NOW = 1_800_000_000_000;
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o), "utf8").toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** 서명은 검증 대상이 아니므로(Firestore 가 담당) 형태만 맞춘 가짜 토큰. */
const mkToken = (payload: Record<string, unknown>) => `h.${b64(payload)}.s`;

const adminPayload = (over: Record<string, unknown> = {}) => ({
  user_id: "admin-uid-1", email: ADMIN_EMAIL, aud: PROD_PROJECT_ID,
  iss: `https://securetoken.google.com/${PROD_PROJECT_ID}`, exp: Math.floor(NOW / 1000) + 3600, ...over,
});
const userPayload = (over: Record<string, unknown> = {}) => adminPayload({
  user_id: "normal-uid-9", email: "someone@example.com", ...over,
});

// ── 토큰 claim 검증 ──────────────────────────────────────────────
test("Authorization 토큰이 없거나 형식이 틀리면 거부", () => {
  for (const bad of [undefined, null, "", "not-a-jwt", "a.b", "a.b.c.d", 12345, {}]) {
    assert.equal(decodeIdToken(bad as never), null, String(bad));
  }
});

test("⭐ 다른 Firebase 프로젝트 토큰 거부(aud/iss)", () => {
  const other = decodeIdToken(mkToken(adminPayload({ aud: "some-other-project" })));
  assert.equal(tokenClaimsValid(other, PROD_PROJECT_ID, NOW), false, "aud 불일치는 거부");

  const badIss = decodeIdToken(mkToken(adminPayload({ iss: "https://securetoken.google.com/evil-project" })));
  assert.equal(tokenClaimsValid(badIss, PROD_PROJECT_ID, NOW), false, "iss 불일치는 거부");
});

test("만료 토큰 거부 / 유효 토큰 통과", () => {
  const expired = decodeIdToken(mkToken(adminPayload({ exp: Math.floor(NOW / 1000) - 10 })));
  assert.equal(tokenClaimsValid(expired, PROD_PROJECT_ID, NOW), false);
  const noExp = decodeIdToken(mkToken(adminPayload({ exp: 0 })));
  assert.equal(tokenClaimsValid(noExp, PROD_PROJECT_ID, NOW), false);
  const good = decodeIdToken(mkToken(adminPayload()));
  assert.equal(tokenClaimsValid(good, PROD_PROJECT_ID, NOW), true);
});

test("UID 는 검증된 토큰에서만 도출한다(요청 body 아님)", () => {
  const d = decodeIdToken(mkToken(adminPayload({ user_id: "from-token" })));
  assert.equal(d!.uid, "from-token");
  // sub 폴백도 토큰 안의 값이다
  const d2 = decodeIdToken(mkToken({ ...adminPayload(), user_id: undefined, sub: "sub-uid" }));
  assert.equal(d2!.uid, "sub-uid");
});

// ── 관리자 판정 ─────────────────────────────────────────────────
test("⭐ 로그인한 일반 사용자는 관리자가 아니다(403)", () => {
  const user = decodeIdToken(mkToken(userPayload()));
  // Firestore 왕복은 'ok' — 즉 토큰은 진짜다. 그래도 관리자는 아니어야 한다.
  const r = decideAdminAccess(user, "ok", new Set());
  assert.equal(r.ok, false);
  if (!r.ok) { assert.equal(r.status, 403); assert.equal(r.reason, "not_admin"); }
});

test("관리자 토큰은 통과", () => {
  const admin = decodeIdToken(mkToken(adminPayload()));
  assert.equal(decideAdminAccess(admin, "ok", new Set()).ok, true);
});

test("Firestore 가 토큰을 거부하면 401(서명·만료 불량)", () => {
  const admin = decodeIdToken(mkToken(adminPayload()));
  for (const own of ["invalid", "mismatch"] as const) {
    const r = decideAdminAccess(admin, own, new Set());
    assert.equal(r.ok, false, own);
    if (!r.ok) { assert.equal(r.status, 401); assert.equal(r.reason, "token_not_verified"); }
  }
});

test("⭐ allowlist 가 설정되면 UID + email 을 모두 요구한다(AND)", () => {
  const admin = decodeIdToken(mkToken(adminPayload()));           // uid=admin-uid-1
  const allow = new Set(["admin-uid-1"]);
  assert.equal(decideAdminAccess(admin, "ok", allow).ok, true, "둘 다 맞으면 통과");

  // email 은 관리자인데 uid 가 목록 밖 → 거부
  const otherUid = decodeIdToken(mkToken(adminPayload({ user_id: "not-listed" })));
  assert.equal(decideAdminAccess(otherUid, "ok", allow).ok, false, "uid 불일치 거부");

  // uid 는 목록에 있는데 email 이 다름 → 거부
  const otherEmail = decodeIdToken(mkToken(adminPayload({ email: "attacker@example.com" })));
  assert.equal(decideAdminAccess(otherEmail, "ok", allow).ok, false, "email 불일치 거부");
});

test("⭐ 클라이언트가 바꿀 수 있는 값은 판정 입력에 아예 없다", () => {
  // decideAdminAccess 는 (토큰, Firestore 검증결과, 서버 allowlist) 만 받는다.
  //   요청 body 의 email/uid, 사용자 문서 role/isAdmin 을 넣을 자리가 없다 = 구조적으로 차단.
  assert.equal(decideAdminAccess.length, 3);
  const user = decodeIdToken(mkToken(userPayload({
    // 토큰 안에 role/isAdmin 을 심어도 무시된다(판정에 쓰이지 않음).
    role: "admin", isAdmin: true, admin: true,
  })));
  assert.equal(decideAdminAccess(user, "ok", new Set()).ok, false, "토큰 내 role/isAdmin 위조 무효");
});

test("allowlist 파싱 — 공백·빈 항목 제거", () => {
  assert.deepEqual([...parseAdminUids(" a , b ,, c ")], ["a", "b", "c"]);
  assert.equal(parseAdminUids(undefined).size, 0);
  assert.equal(parseAdminUids("   ").size, 0);
});

// ── 통합(mock verifier — 네트워크 없음) ──────────────────────────
const mockVerify = (result: "ok" | "mismatch" | "invalid") =>
  (async () => result) as never;

test("verifyAdmin: 관리자 토큰 → 통과", async () => {
  const r = await verifyAdmin(mkToken(adminPayload()), {}, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, true);
});

test("⭐ verifyAdmin: 일반 사용자 토큰 → 403", async () => {
  const r = await verifyAdmin(mkToken(userPayload()), {}, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 403);
});

test("verifyAdmin: 만료·다른 프로젝트·형식오류 → 401", async () => {
  for (const tok of [
    mkToken(adminPayload({ exp: Math.floor(NOW / 1000) - 1 })),
    mkToken(adminPayload({ aud: "other" })),
    "garbage",
  ]) {
    const r = await verifyAdmin(tok, {}, undefined, NOW, mockVerify("ok"));
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.status, 401);
  }
});

test("⭐ verifyAdmin: 검증 서비스 오류는 fail-closed(401)", async () => {
  const boom = (async () => { throw new Error("network down"); }) as never;
  const r = await verifyAdmin(mkToken(adminPayload()), {}, undefined, NOW, boom);
  assert.equal(r.ok, false);
  if (!r.ok) { assert.equal(r.status, 401); assert.equal(r.reason, "verify_unavailable"); }
});

test("verifyAdmin: REWARD_ADMIN_UIDS 설정 시 목록 밖 UID 거부", async () => {
  const env = { REWARD_ADMIN_UIDS: "some-other-uid" };
  const r = await verifyAdmin(mkToken(adminPayload()), env, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 403);

  const env2 = { REWARD_ADMIN_UIDS: "admin-uid-1" };
  assert.equal((await verifyAdmin(mkToken(adminPayload()), env2, undefined, NOW, mockVerify("ok"))).ok, true);
});

test("응답 사유에 토큰·키·SA 정보가 섞이지 않는다", async () => {
  const results = [
    await verifyAdmin("garbage", {}, undefined, NOW, mockVerify("ok")),
    await verifyAdmin(mkToken(userPayload()), {}, undefined, NOW, mockVerify("ok")),
  ];
  for (const r of results) {
    if (r.ok) continue;
    assert.match(r.reason, /^[a-z_]+$/, "reason 은 고정 코드여야 한다: " + r.reason);
  }
});
