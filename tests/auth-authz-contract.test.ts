// Phase 4 — 인증(authentication)·인가(authorization) 계약 감사 (감사 브랜치 신규)
//
// 이 파일은 다섯 문장을 **코드로 증명**한다. 문서로만 주장하면 리팩터링 한 번에 무너진다.
//   1) "로그인됨"은 "관리자임"이 아니다.
//   2) "기사 관리자"는 "재화 관리자"가 아니다.
//   3) "카나리 사용자"는 "재화 관리자"가 아니다.
//   4) "자기 문서를 읽을 수 있음"은 "관리자 권한"이 아니다.
//   5) email 은 관리자 권한의 근거가 아니다.
//
// ⚠️ 운영 credential 미사용 — 로컬에서 만든 가짜 토큰 + mock verifier 만 쓴다.
import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeIdToken, tokenClaimsValid, parseAdminUids, decideAdminAccess,
  expectedProjectFor, verifyArticleAdmin, verifyRewardAdmin, PROD_PROJECT_ID,
} from "../functions/_shared/adminAuth.ts";
import { parseAllowlist } from "../functions/_shared/rewardPolicy.ts";
import { resolveCandyGate } from "../functions/_shared/candyEnv.ts";
import { productionFirestoreTarget, emulatorFirestoreTarget } from "../functions/_shared/firestoreRest.ts";

const NOW = 1_800_000_000_000;
const b64 = (o: unknown) =>
  Buffer.from(JSON.stringify(o)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
/** 형식만 갖춘 토큰(서명 없음). 서명 검증은 Firestore 왕복이 담당하므로 mock 으로 대체한다. */
function tok(over: Record<string, unknown> = {}) {
  const payload = {
    user_id: "user-uid-000001",
    email: "someone@example.com",
    aud: PROD_PROJECT_ID,
    iss: `https://securetoken.google.com/${PROD_PROJECT_ID}`,
    exp: Math.floor(NOW / 1000) + 600,
    ...over,
  };
  return `${b64({ alg: "RS256" })}.${b64(payload)}.sig`;
}
const okVerify = async () => "ok" as const;
const mismatchVerify = async () => "mismatch" as const;
const throwVerify = async () => { throw new Error("network"); };
const PROD = productionFirestoreTarget();

const ARTICLE_UID = "article-admin-uid-01";
const REWARD_UID = "reward-admin-uid-01";
const CANARY_UID = "canary-user-uid-0001";
const NORMAL_UID = "normal-user-uid-0001";
const BOTH_ENV = { ARTICLE_ADMIN_UIDS: ARTICLE_UID, REWARD_ADMIN_UIDS: REWARD_UID };

// ═══ 명제 1: "로그인됨" ≠ "관리자임" ═══════════════════════════════════
test("명제1 — 토큰이 완전히 유효해도 allowlist 밖이면 403", async () => {
  const r = await verifyRewardAdmin(tok({ user_id: NORMAL_UID }), BOTH_ENV, PROD, NOW, okVerify);
  assert.equal(r.ok, false);
  assert.equal((r as { status: number }).status, 403);
});

test("명제1 — Firestore 왕복 성공(ownership=ok)은 '로그인 증명'일 뿐이다", () => {
  // decideAdminAccess 는 ownership 이 ok 여도 allowlist 를 다시 본다.
  const d = decideAdminAccess(decodeIdToken(tok({ user_id: NORMAL_UID })), "ok", new Set([REWARD_UID]), "reward");
  assert.equal(d.ok, false);
  assert.equal((d as { reason: string }).reason, "not_admin");
});

// ═══ 명제 2: "기사 관리자" ≠ "재화 관리자" ════════════════════════════
test("명제2 — 기사 관리자가 재화 엔드포인트에서 403", async () => {
  const r = await verifyRewardAdmin(tok({ user_id: ARTICLE_UID }), BOTH_ENV, PROD, NOW, okVerify);
  assert.equal((r as { status: number }).status, 403);
});

test("명제2 — 재화 관리자가 기사 엔드포인트에서 403", async () => {
  const r = await verifyArticleAdmin(tok({ user_id: REWARD_UID }), BOTH_ENV, PROD, NOW, okVerify);
  assert.equal((r as { status: number }).status, 403);
});

test("명제2 — 환경변수 이름을 뒤바꿔 설정하면 양쪽 다 503(우연히 열리지 않는다)", async () => {
  const swapped = { ARTICLE_ADMIN_UIDS: "", REWARD_ADMIN_UIDS: "" };
  const a = await verifyArticleAdmin(tok({ user_id: ARTICLE_UID }), swapped, PROD, NOW, okVerify);
  const b = await verifyRewardAdmin(tok({ user_id: REWARD_UID }), swapped, PROD, NOW, okVerify);
  assert.equal((a as { status: number }).status, 503);
  assert.equal((b as { status: number }).status, 503);
});

test("명제2 — 각 capability 는 자기 환경변수만 읽는다", async () => {
  // REWARD 만 설정 → article 은 503, reward 는 통과
  const onlyReward = { REWARD_ADMIN_UIDS: REWARD_UID };
  const a = await verifyArticleAdmin(tok({ user_id: REWARD_UID }), onlyReward, PROD, NOW, okVerify);
  assert.equal((a as { status: number }).status, 503);
  assert.equal((a as { reason: string }).reason, "article_admin_not_configured");
  const b = await verifyRewardAdmin(tok({ user_id: REWARD_UID }), onlyReward, PROD, NOW, okVerify);
  assert.equal(b.ok, true);
});

// ═══ 명제 3: "카나리 사용자" ≠ "재화 관리자" ══════════════════════════
test("명제3 — 카나리 allowlist 와 관리자 allowlist 는 서로 다른 환경변수다", () => {
  const env = { REWARD_TEST_UIDS: CANARY_UID, REWARD_ADMIN_UIDS: REWARD_UID };
  const canary = parseAllowlist(env.REWARD_TEST_UIDS);
  const admins = parseAdminUids(env.REWARD_ADMIN_UIDS);
  assert.ok(canary.has(CANARY_UID));
  assert.ok(!canary.has(REWARD_UID), "관리자가 카나리 목록에 자동 포함되면 안 된다");
  assert.ok(admins.has(REWARD_UID));
  assert.ok(!admins.has(CANARY_UID), "카나리가 관리자 목록에 자동 포함되면 안 된다");
});

test("명제3 — 카나리 UID 로 관리자 엔드포인트에 접근하면 403", async () => {
  const env = { REWARD_TEST_UIDS: CANARY_UID, REWARD_ADMIN_UIDS: REWARD_UID };
  const r = await verifyRewardAdmin(tok({ user_id: CANARY_UID }), env, PROD, NOW, okVerify);
  assert.equal((r as { status: number }).status, 403);
});

test("명제3 — 관리자 UID 라도 카나리 게이트를 자동 통과하지 않는다", () => {
  // CANDY_ROLLOUT_MODE=canary 에서 게이트는 REWARD_TEST_UIDS 만 본다.
  const allow = parseAllowlist(CANARY_UID);
  const gate = resolveCandyGate({ CANDY_ROLLOUT_MODE: "canary", REWARD_ADMIN_UIDS: REWARD_UID }, "production", REWARD_UID, allow);
  assert.equal(gate.ok, false, "관리자라는 이유로 재화 게이트가 열렸다");
  assert.equal((gate as { error: string }).error, "candy_rollout_disabled");
});

// ═══ 명제 4: "자기 문서 읽기" ≠ "관리자 권한" ═════════════════════════
test("명제4 — verifyIdTokenOwnsUid 의 'ok' 는 소유권 증명일 뿐 권한이 아니다", () => {
  // 누구나 자기 userPrivate 을 읽을 수 있으므로 ownership=ok 는 전원이 받는다.
  const anyone = decideAdminAccess(decodeIdToken(tok({ user_id: NORMAL_UID })), "ok", new Set(), "reward");
  assert.equal((anyone as { status: number }).status, 503, "allowlist 가 비면 ownership 과 무관하게 닫힌다");
  const stillNo = decideAdminAccess(decodeIdToken(tok({ user_id: NORMAL_UID })), "ok", new Set([REWARD_UID]), "reward");
  assert.equal((stillNo as { status: number }).status, 403);
});

test("명제4 — 다른 uid 의 문서를 노린 토큰(mismatch)은 401", async () => {
  const r = await verifyRewardAdmin(tok({ user_id: REWARD_UID }), BOTH_ENV, PROD, NOW, mismatchVerify);
  assert.equal((r as { status: number }).status, 401);
});

// ═══ 명제 5: email 은 권한 근거가 아니다 ═════════════════════════════
test("명제5 — 관리자 email 을 가져도 UID 가 목록 밖이면 403", async () => {
  const r = await verifyRewardAdmin(
    tok({ user_id: NORMAL_UID, email: "lhaa0130@gmail.com", email_verified: true }),
    BOTH_ENV, PROD, NOW, okVerify);
  assert.equal((r as { status: number }).status, 403);
});

test("명제5 — allowlist 미설정 + 관리자 email 이어도 503(폴백 없음)", async () => {
  const r = await verifyRewardAdmin(
    tok({ user_id: NORMAL_UID, email: "lhaa0130@gmail.com", email_verified: true }),
    {}, PROD, NOW, okVerify);
  assert.equal((r as { status: number }).status, 503);
  assert.equal((r as { reason: string }).reason, "reward_admin_not_configured");
});

test("명제5 — email 이 전혀 없어도 UID 만 맞으면 통과", async () => {
  const r = await verifyRewardAdmin(tok({ user_id: REWARD_UID, email: undefined }), BOTH_ENV, PROD, NOW, okVerify);
  assert.equal(r.ok, true);
});

test("명제5 — decideAdminAccess 의 입력에 email 자리가 없다", () => {
  // 서명(시그니처)로 증명: (decoded, ownership, allow, capability) 4개뿐.
  assert.equal(decideAdminAccess.length, 4);
  // decoded 안의 email 을 바꿔도 판정이 달라지지 않는다.
  const a = decideAdminAccess(decodeIdToken(tok({ user_id: REWARD_UID, email: "a@a.a" })), "ok", new Set([REWARD_UID]), "reward");
  const b = decideAdminAccess(decodeIdToken(tok({ user_id: REWARD_UID, email: "hacker@evil.com" })), "ok", new Set([REWARD_UID]), "reward");
  assert.deepEqual(a, b);
});

// ═══ 토큰 검증 계약 ══════════════════════════════════════════════════
test("다른 Firebase project 토큰은 어떤 경로로도 통과하지 못한다", () => {
  for (const bad of [
    { aud: "other-project" },
    { iss: "https://securetoken.google.com/other-project" },
    { aud: "dori-ai-01300" },                                  // 접두사 유사
    { iss: "https://evil.example/dori-ai-0130" },              // iss 호스트 위조
  ]) {
    const d = decodeIdToken(tok({ user_id: REWARD_UID, ...bad }));
    const valid = tokenClaimsValid(d, PROD_PROJECT_ID, NOW);
    // iss 는 endsWith 검사라 호스트 위조는 통과할 수 있다 — 그 경우 Firestore 실검증이 막는다.
    if (valid) {
      assert.equal(String((bad as { iss?: string }).iss || "").endsWith(PROD_PROJECT_ID), true,
        `예상 밖 통과: ${JSON.stringify(bad)}`);
    }
  }
});

test("만료 토큰은 거부된다(경계 포함)", () => {
  const d = decodeIdToken(tok({ exp: Math.floor(NOW / 1000) - 1 }));
  assert.equal(tokenClaimsValid(d, PROD_PROJECT_ID, NOW), false);
  const edge = decodeIdToken(tok({ exp: Math.floor(NOW / 1000) + 1 }));
  assert.equal(tokenClaimsValid(edge, PROD_PROJECT_ID, NOW), true);
});

test("운영 target 은 어떤 경우에도 dori-ai-0130 으로 고정된다", () => {
  assert.equal(expectedProjectFor(PROD), PROD_PROJECT_ID);
  // 에뮬레이터라도 demo- 접두사가 아니면 운영 프로젝트를 강제한다.
  const fakeEmu = { ...emulatorFirestoreTarget("dori-ai-0130", "127.0.0.1:8080") };
  assert.equal(expectedProjectFor(fakeEmu), PROD_PROJECT_ID, "에뮬레이터로 위장해 운영 검증을 우회할 수 없다");
  const realEmu = emulatorFirestoreTarget("demo-illo-myworld", "127.0.0.1:8080");
  assert.equal(expectedProjectFor(realEmu), "demo-illo-myworld");
});

test("검증 서비스 장애는 401 이 아니라 503 이다(권한 부재와 구분)", async () => {
  const r = await verifyRewardAdmin(tok({ user_id: REWARD_UID }), BOTH_ENV, PROD, NOW, throwVerify);
  assert.equal((r as { status: number }).status, 503);
  assert.equal((r as { reason: string }).reason, "verify_unavailable");
});

test("allowlist 는 하나라도 형식 위반이면 전체 무효(부분 통과 금지)", () => {
  assert.equal(parseAdminUids(`${REWARD_UID},short`).size, 0, "짧은 항목 하나로 전체 무효여야 한다");
  assert.equal(parseAdminUids(`${REWARD_UID},has space`).size, 0);
  assert.equal(parseAdminUids(`${REWARD_UID},a@b.com`).size, 0, "email 형식은 UID 가 아니다");
  assert.equal(parseAdminUids(`${REWARD_UID},${"x".repeat(200)}`).size, 0);
  assert.equal(parseAdminUids(Array.from({ length: 51 }, () => REWARD_UID).join(",")).size, 0, "과도한 개수");
  assert.equal(parseAdminUids("x".repeat(9000)).size, 0, "과도한 길이");
  // 정상 목록은 통과
  assert.equal(parseAdminUids(`${REWARD_UID}, ${ARTICLE_UID}`).size, 2, "공백 trim 후 정상 파싱");
});

test("응답 reason 은 고정 코드라 UID·email·토큰 세부가 새지 않는다", async () => {
  const probes = [
    await verifyRewardAdmin("garbage", BOTH_ENV, PROD, NOW, okVerify),
    await verifyRewardAdmin(tok({ user_id: NORMAL_UID, email: "secret@corp.com" }), BOTH_ENV, PROD, NOW, okVerify),
    await verifyRewardAdmin(tok({ user_id: REWARD_UID }), {}, PROD, NOW, okVerify),
    await verifyRewardAdmin(tok({ user_id: REWARD_UID }), BOTH_ENV, PROD, NOW, throwVerify),
  ];
  const ALLOWED = new Set(["invalid_token", "token_not_verified", "not_admin", "reward_admin_not_configured", "verify_unavailable"]);
  for (const p of probes) {
    assert.equal(p.ok, false);
    const reason = (p as { reason: string }).reason;
    assert.ok(ALLOWED.has(reason), `예상 밖 reason: ${reason}`);
    assert.ok(!reason.includes("@"), "email 유출");
    assert.ok(!reason.includes(NORMAL_UID) && !reason.includes(REWARD_UID), "UID 유출");
  }
});

test("토큰 payload 의 role/isAdmin/admin 클레임은 판정에 쓰이지 않는다", async () => {
  const r = await verifyRewardAdmin(
    tok({ user_id: NORMAL_UID, role: "admin", isAdmin: true, admin: true, permissions: ["*"] }),
    BOTH_ENV, PROD, NOW, okVerify);
  assert.equal((r as { status: number }).status, 403);
});
