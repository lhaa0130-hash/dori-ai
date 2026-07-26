// 05-08C — 관리자 인증·인가 계약 테스트.
//
// ⭐ 검증하는 두 가지:
//   ① "토큰이 유효한 사용자" ≠ "관리자" — 로그인만으로는 절대 통과하지 못한다.
//   ② capability 분리 — 기사 관리자가 재화 관리자가 되지 않고, 그 반대도 아니다.
//
// ⚠️ 운영 관리자 credential 을 쓰지 않는다. 토큰은 전부 로컬 가짜이고
//    Firestore 왕복은 mock verifier 로 대체한다(네트워크 없음).
import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeIdToken, tokenClaimsValid, decideAdminAccess, parseAdminUids,
  verifyArticleAdmin, verifyRewardAdmin, PROD_PROJECT_ID,
} from "../functions/_shared/adminAuth.ts";

const NOW = 1_800_000_000_000;
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o), "utf8").toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** 서명은 검증 대상이 아니므로(Firestore 가 담당) 형태만 맞춘 가짜 토큰. */
const mkToken = (payload: Record<string, unknown>) => `h.${b64(payload)}.s`;

const ARTICLE_UID = "article-admin-uid-1";
const REWARD_UID = "reward-admin-uid-2";
const NORMAL_UID = "normal-user-uid-9";
const LEGACY_ADMIN_EMAIL = "lhaa0130@gmail.com";   // 과거 email 계약에 쓰이던 주소

const tok = (uid: string, over: Record<string, unknown> = {}) => mkToken({
  user_id: uid, email: "someone@example.com", email_verified: true,
  aud: PROD_PROJECT_ID, iss: `https://securetoken.google.com/${PROD_PROJECT_ID}`,
  exp: Math.floor(NOW / 1000) + 3600, ...over,
});
const mockVerify = (r: "ok" | "mismatch" | "invalid") => (async () => r) as never;
const ARTICLE_ENV = { ARTICLE_ADMIN_UIDS: ARTICLE_UID };
const REWARD_ENV = { REWARD_ADMIN_UIDS: REWARD_UID };
const BOTH_ENV = { ARTICLE_ADMIN_UIDS: ARTICLE_UID, REWARD_ADMIN_UIDS: REWARD_UID };

// ── 토큰 검증 ────────────────────────────────────────────────────
test("토큰 없음·형식오류는 디코딩 불가", () => {
  for (const bad of [undefined, null, "", "not-a-jwt", "a.b", "a.b.c.d", 12345, {}]) {
    assert.equal(decodeIdToken(bad as never), null, String(bad));
  }
});

test("⭐ 다른 Firebase 프로젝트 토큰 거부(aud/iss)", () => {
  assert.equal(tokenClaimsValid(decodeIdToken(tok(ARTICLE_UID, { aud: "other-project" })), PROD_PROJECT_ID, NOW), false);
  assert.equal(tokenClaimsValid(decodeIdToken(tok(ARTICLE_UID, { iss: "https://securetoken.google.com/evil" })), PROD_PROJECT_ID, NOW), false);
});

test("만료 토큰 거부 / 유효 토큰 통과", () => {
  assert.equal(tokenClaimsValid(decodeIdToken(tok(ARTICLE_UID, { exp: Math.floor(NOW / 1000) - 1 })), PROD_PROJECT_ID, NOW), false);
  assert.equal(tokenClaimsValid(decodeIdToken(tok(ARTICLE_UID, { exp: 0 })), PROD_PROJECT_ID, NOW), false);
  assert.equal(tokenClaimsValid(decodeIdToken(tok(ARTICLE_UID)), PROD_PROJECT_ID, NOW), true);
});

test("UID 는 검증된 토큰에서만 도출한다", () => {
  assert.equal(decodeIdToken(tok("from-token"))!.uid, "from-token");
  const subOnly = mkToken({ sub: "sub-uid", aud: PROD_PROJECT_ID, iss: `https://securetoken.google.com/${PROD_PROJECT_ID}`, exp: Math.floor(NOW / 1000) + 60 });
  assert.equal(decodeIdToken(subOnly)!.uid, "sub-uid");
});

// ── ⭐ email 단독 fallback 제거 ──────────────────────────────────
test("⭐ allowlist 미설정이면 관리자 email 이어도 통과하지 못한다(503)", async () => {
  const adminEmailToken = tok(NORMAL_UID, { email: LEGACY_ADMIN_EMAIL, email_verified: true });
  const r = await verifyArticleAdmin(adminEmailToken, {}, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, false);
  if (!r.ok) { assert.equal(r.status, 503); assert.equal(r.reason, "article_admin_not_configured"); }
});

test("⭐ allowlist 가 있어도 email 만으로는 통과하지 못한다(UID 가 근거)", async () => {
  // 관리자 email 을 가졌지만 UID 는 목록 밖 → 403
  const r = await verifyArticleAdmin(
    tok(NORMAL_UID, { email: LEGACY_ADMIN_EMAIL }), ARTICLE_ENV, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 403);

  // 반대로 email 이 전혀 달라도 UID 가 목록에 있으면 통과 → email 은 판정에 안 쓰인다
  const ok = await verifyArticleAdmin(
    tok(ARTICLE_UID, { email: "anything@example.com", email_verified: false }), ARTICLE_ENV, undefined, NOW, mockVerify("ok"));
  assert.equal(ok.ok, true);
});

// ── 설정 파서 ────────────────────────────────────────────────────
test("allowlist 파싱 — trim·빈항목·중복 제거", () => {
  const s = parseAdminUids(" abcdef , ghijkl ,, abcdef ");
  assert.deepEqual([...s].sort(), ["abcdef", "ghijkl"]);
});

test("⭐ 비정상 설정은 전부 '미설정'으로 fail-closed", () => {
  for (const bad of [undefined, null, "", "   ", ",,,", "short", "bad uid!", "a".repeat(9000),
                     Array.from({ length: 60 }, (_, i) => "uid" + String(i).padStart(5, "0")).join(",")]) {
    assert.equal(parseAdminUids(bad as never).size, 0, JSON.stringify(String(bad).slice(0, 20)));
  }
  // 하나라도 형식 위반이면 전체 무효(일부만 통과시키지 않는다)
  assert.equal(parseAdminUids("valid-uid-1,bad uid").size, 0);
});

test("⭐ 빈값·공백만 설정 → 503", async () => {
  for (const env of [{}, { ARTICLE_ADMIN_UIDS: "" }, { ARTICLE_ADMIN_UIDS: "   " }, { ARTICLE_ADMIN_UIDS: ",,," }]) {
    const r = await verifyArticleAdmin(tok(ARTICLE_UID), env, undefined, NOW, mockVerify("ok"));
    assert.equal(r.ok, false, JSON.stringify(env));
    if (!r.ok) assert.equal(r.status, 503);
  }
});

// ── 인가 판정 ────────────────────────────────────────────────────
test("⭐ 로그인한 일반 사용자는 기사 관리자가 아니다(403)", async () => {
  const r = await verifyArticleAdmin(tok(NORMAL_UID), ARTICLE_ENV, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, false);
  if (!r.ok) { assert.equal(r.status, 403); assert.equal(r.reason, "not_admin"); }
});

test("기사 관리자 UID → 통과", async () => {
  assert.equal((await verifyArticleAdmin(tok(ARTICLE_UID), ARTICLE_ENV, undefined, NOW, mockVerify("ok"))).ok, true);
});

test("Firestore 가 토큰을 거부하면 401", async () => {
  for (const own of ["invalid", "mismatch"] as const) {
    const r = await verifyArticleAdmin(tok(ARTICLE_UID), ARTICLE_ENV, undefined, NOW, mockVerify(own));
    assert.equal(r.ok, false, own);
    if (!r.ok) { assert.equal(r.status, 401); assert.equal(r.reason, "token_not_verified"); }
  }
});

test("⭐ 검증 서비스 오류는 fail-closed(503)", async () => {
  const boom = (async () => { throw new Error("network down"); }) as never;
  const r = await verifyArticleAdmin(tok(ARTICLE_UID), ARTICLE_ENV, undefined, NOW, boom);
  assert.equal(r.ok, false);
  if (!r.ok) { assert.equal(r.status, 503); assert.equal(r.reason, "verify_unavailable"); }
});

// ── ⭐⭐ capability 분리 (교차 권한) ──────────────────────────────
test("⭐⭐ 재화 관리자는 기사 관리자가 되지 않는다", async () => {
  const r = await verifyArticleAdmin(tok(REWARD_UID), BOTH_ENV, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, false, "REWARD_ADMIN_UIDS 소속이 기사 권한을 얻으면 안 된다");
  if (!r.ok) assert.equal(r.status, 403);
});

test("⭐⭐ 기사 관리자는 재화 관리자가 되지 않는다", async () => {
  const r = await verifyRewardAdmin(tok(ARTICLE_UID), BOTH_ENV, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, false, "ARTICLE_ADMIN_UIDS 소속이 재화 권한을 얻으면 안 된다");
  if (!r.ok) assert.equal(r.status, 403);
});

test("⭐⭐ 환경변수 이름을 바꿔 넣어도 권한이 열리지 않는다", async () => {
  // 기사 UID 를 REWARD 변수에만 넣음 → 기사 권한은 미설정(503)
  const swapped = { REWARD_ADMIN_UIDS: ARTICLE_UID };
  const a = await verifyArticleAdmin(tok(ARTICLE_UID), swapped, undefined, NOW, mockVerify("ok"));
  assert.equal(a.ok, false);
  if (!a.ok) assert.equal(a.status, 503, "기사 allowlist 는 여전히 미설정");

  // 재화 UID 를 ARTICLE 변수에만 넣음 → 재화 권한은 미설정(503)
  const swapped2 = { ARTICLE_ADMIN_UIDS: REWARD_UID };
  const b = await verifyRewardAdmin(tok(REWARD_UID), swapped2, undefined, NOW, mockVerify("ok"));
  assert.equal(b.ok, false);
  if (!b.ok) assert.equal(b.status, 503, "재화 allowlist 는 여전히 미설정");
});

test("각 capability 는 자기 변수로만 열린다", async () => {
  assert.equal((await verifyArticleAdmin(tok(ARTICLE_UID), ARTICLE_ENV, undefined, NOW, mockVerify("ok"))).ok, true);
  assert.equal((await verifyRewardAdmin(tok(REWARD_UID), REWARD_ENV, undefined, NOW, mockVerify("ok"))).ok, true);
  // 상대 변수만 있으면 503
  assert.equal((await verifyArticleAdmin(tok(ARTICLE_UID), REWARD_ENV, undefined, NOW, mockVerify("ok"))).ok, false);
  assert.equal((await verifyRewardAdmin(tok(REWARD_UID), ARTICLE_ENV, undefined, NOW, mockVerify("ok"))).ok, false);
});

// ── 위조 시도 ────────────────────────────────────────────────────
test("⭐ 토큰에 role/isAdmin 을 심어도 권한 상승 없음", async () => {
  const forged = tok(NORMAL_UID, { role: "admin", isAdmin: true, admin: true, email: LEGACY_ADMIN_EMAIL });
  const r = await verifyArticleAdmin(forged, ARTICLE_ENV, undefined, NOW, mockVerify("ok"));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 403);
});

test("⭐ 판정 입력에 클라이언트 조작 가능한 값이 아예 없다", () => {
  // decideAdminAccess(토큰, Firestore결과, allowlist, capability) — body email/uid 를 넣을 자리가 없다.
  assert.equal(decideAdminAccess.length, 4);
  const user = decodeIdToken(tok(NORMAL_UID, { email: LEGACY_ADMIN_EMAIL }));
  assert.equal(decideAdminAccess(user, "ok", new Set([ARTICLE_UID]), "article").ok, false);
});

test("응답 사유에 UID·email·토큰 세부가 섞이지 않는다", async () => {
  const results = [
    await verifyArticleAdmin("garbage", ARTICLE_ENV, undefined, NOW, mockVerify("ok")),
    await verifyArticleAdmin(tok(NORMAL_UID), ARTICLE_ENV, undefined, NOW, mockVerify("ok")),
    await verifyArticleAdmin(tok(ARTICLE_UID), {}, undefined, NOW, mockVerify("ok")),
  ];
  for (const r of results) {
    if (r.ok) continue;
    assert.match(r.reason, /^[a-z_]+$/, "reason 은 고정 코드: " + r.reason);
    assert.equal(r.reason.includes(ARTICLE_UID) || r.reason.includes(NORMAL_UID), false);
    assert.equal(r.reason.includes("@"), false);
  }
});
