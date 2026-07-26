// 관리자 인증·인가 공통 계약 (05-08C).
//
// ⚠️ 설계 원칙 — **인증(authentication)은 공유, 인가(authorization)는 분리**.
//   토큰이 진짜인지 확인하는 절차는 한 곳에 모아 약한 복제본이 생기지 않게 한다.
//   그러나 "무엇을 할 수 있는가"는 capability 별로 **서로 다른 allowlist** 로 판정한다.
//   기사 발행 관리자가 재화·프리미엄까지 지급할 수 있으면 안 된다(권한 확대 = 사고 반경 확대).
//
// ⚠️ 핵심 구분 — "토큰이 유효한 사용자" ≠ "관리자":
//   Firestore 접근 성공은 **로그인했다는 뜻일 뿐**이다(누구나 자기 userPrivate 을 읽는다).
//   따라서 Firestore 왕복은 '토큰이 진짜인지'만 증명하고, 관리자 판정은 서버 allowlist 가 한다.
//
// ⚠️ **email 단독 관리자 판정은 존재하지 않는다**(05-08C 에서 완전 제거).
//   Firebase 는 사용자가 스스로 email 을 바꿀 수 있고, 관리자 계정을 지우면 그 주소가 풀린다.
//   "관리자 주소를 아는 것"이 권한 후보 조건이 되어서는 안 된다.
//
// ⚠️ 이 모듈은 서버 전용이다. functions/_shared 는 CF Pages 라우트로 노출되지 않으며
//   client bundle 에 포함되지 않는다. 클라이언트에서 import 하지 말 것.
import { productionFirestoreTarget, verifyIdTokenOwnsUid, type FirestoreTarget } from "./firestoreRest.ts";

/** 운영 Firebase 프로젝트. 다른 프로젝트에서 발급된 토큰은 전부 거부한다. */
export const PROD_PROJECT_ID = "dori-ai-0130";

/**
 * 관리자 capability. **각각 다른 환경변수**를 쓴다 — 절대 공유하지 않는다.
 *  · article : 기사 발행/삭제 (ARTICLE_ADMIN_UIDS)
 *  · reward  : 재화·프리미엄 지급 (REWARD_ADMIN_UIDS) — /api/admin/grant 가 사용
 */
export type AdminCapability = "article" | "reward";
const CAPABILITY_ENV: Record<AdminCapability, string> = {
  article: "ARTICLE_ADMIN_UIDS",
  reward: "REWARD_ADMIN_UIDS",
};
/** 설정 미완료 시 응답 코드(capability 별로 구분해 운영자가 어느 쪽인지 바로 안다). */
const NOT_CONFIGURED: Record<AdminCapability, string> = {
  article: "article_admin_not_configured",
  reward: "reward_admin_not_configured",
};

export interface DecodedIdToken { uid: string; email: string; emailVerified: boolean; aud: string; iss: string; exp: number }

/** ID 토큰 payload 디코딩. 서명 검증은 하지 않는다(Firestore 왕복이 담당). */
export function decodeIdToken(idToken: unknown): DecodedIdToken | null {
  try {
    if (typeof idToken !== "string") return null;
    const p = idToken.split(".");
    if (p.length !== 3) return null;
    const j = JSON.parse(decodeURIComponent(escape(atob(p[1].replace(/-/g, "+").replace(/_/g, "/")))));
    const uid = j.user_id || j.sub;
    if (!uid || typeof uid !== "string") return null;
    return {
      uid,
      email: String(j.email || ""),
      emailVerified: j.email_verified === true,
      aud: String(j.aud || ""),
      iss: String(j.iss || ""),
      exp: Number(j.exp || 0),
    };
  } catch { return null; }
}

/** UID 형식 — Firebase UID 는 영숫자/-/_ 조합. 비정상 입력은 목록에서 버린다. */
const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;
const MAX_ADMIN_UIDS = 50;          // 과도한 목록은 오설정 신호 → fail-closed
const MAX_RAW_LENGTH = 8000;

/**
 * allowlist 파싱. trim·빈 항목 제거·중복 제거·형식 검증.
 * ⚠️ 비정상 입력(과도한 길이, 형식 위반 포함)은 **빈 집합**으로 취급해 fail-closed 시킨다.
 *    (일부만 걸러 통과시키면 오설정이 조용히 넘어간다)
 * ⚠️ UID 목록·개수를 로그에 남기지 않는다.
 */
export function parseAdminUids(raw: unknown): Set<string> {
  const s = String(raw ?? "");
  if (!s.trim()) return new Set();
  if (s.length > MAX_RAW_LENGTH) return new Set();
  const parts = s.split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length === 0 || parts.length > MAX_ADMIN_UIDS) return new Set();
  if (parts.some((x) => !UID_RE.test(x))) return new Set();   // 하나라도 형식 위반 → 전체 무효
  return new Set(parts);
}

/**
 * 토큰이 향해야 할 Firebase 프로젝트. 운영은 항상 dori-ai-0130 이고,
 * 로컬 에뮬레이터(demo- 프로젝트)에서만 target 의 projectId 를 따른다.
 * ⚠️ 운영 target 에서는 어떤 경우에도 PROD_PROJECT_ID 로 고정된다 — 우회 여지를 만들지 않는다.
 */
export function expectedProjectFor(target: FirestoreTarget): string {
  return target.emulator && target.projectId.startsWith("demo-") ? target.projectId : PROD_PROJECT_ID;
}

/** 토큰 자체의 형식·대상·만료 검증(네트워크 없이 판정 가능한 부분). */
export function tokenClaimsValid(d: DecodedIdToken | null, expectedProject: string, nowMs: number): boolean {
  if (!d) return false;
  if (d.aud !== expectedProject) return false;              // 다른 프로젝트 토큰 거부
  if (!d.iss.endsWith(expectedProject)) return false;       // issuer 불일치 거부
  if (!d.exp || d.exp * 1000 < nowMs) return false;         // 만료 거부
  return true;
}

export type AdminDecision =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 503; reason: string };

/**
 * 인가 판정(순수 함수 — 테스트 가능).
 *
 * @param decoded    디코딩된 토큰(서명은 ownership 으로 별도 증명)
 * @param ownership  Firestore 가 토큰을 실검증한 결과
 * @param allow      **해당 capability 전용** allowlist
 * @param capability 어떤 권한을 판정하는지(응답 코드 구분용)
 *
 * 계약:
 *   · allowlist 가 비면 → 503. 그 기능만 비활성이고 로그인·일반 서비스는 영향 없다.
 *   · 로그인은 했지만 목록 밖 → 403.
 *   · **email 은 판정에 쓰지 않는다.** 이 함수는 email 을 아예 보지 않는다.
 *
 * ⚠️ 클라이언트가 바꿀 수 있는 값(요청 body 의 email/uid, 사용자 문서 role/isAdmin,
 *    localStorage, UI 상태)은 입력 자리 자체가 없다 — 구조적으로 차단된다.
 */
export function decideAdminAccess(
  decoded: DecodedIdToken | null,
  ownership: "ok" | "mismatch" | "invalid",
  allow: Set<string>,
  capability: AdminCapability,
): AdminDecision {
  if (!decoded) return { ok: false, status: 401, reason: "invalid_token" };
  // Firestore 가 토큰을 거부했다 → 서명·만료가 유효하지 않다.
  if (ownership !== "ok") return { ok: false, status: 401, reason: "token_not_verified" };
  // 설정 미완료 = 기능 비활성(fail-closed). email 로 우회할 길은 없다.
  if (allow.size === 0) return { ok: false, status: 503, reason: NOT_CONFIGURED[capability] };
  if (!allow.has(decoded.uid)) return { ok: false, status: 403, reason: "not_admin" };
  return { ok: true };
}

/**
 * capability 별 관리자 검증(네트워크 포함).
 * 토큰 claim 검사 → Firestore 실검증 → 해당 capability allowlist 판정.
 * 검증 서비스 오류는 fail-closed(503 — 일시 장애이지 권한 부재가 아니므로 401 과 구분).
 */
async function verifyCapability(
  capability: AdminCapability,
  idToken: string,
  env: Record<string, any>,
  target: FirestoreTarget,
  nowMs: number,
  verify: typeof verifyIdTokenOwnsUid,
  expectedProject: string,
): Promise<AdminDecision> {
  const decoded = decodeIdToken(idToken);
  if (!tokenClaimsValid(decoded, expectedProject, nowMs)) {
    return { ok: false, status: 401, reason: "invalid_token" };
  }
  const allow = parseAdminUids(env?.[CAPABILITY_ENV[capability]]);
  // 설정이 없으면 네트워크 왕복 없이 즉시 503(불필요한 외부 호출도 줄인다).
  if (allow.size === 0) return { ok: false, status: 503, reason: NOT_CONFIGURED[capability] };

  let ownership: "ok" | "mismatch" | "invalid";
  try {
    ownership = await verify(target, idToken, (decoded as DecodedIdToken).uid);
  } catch {
    return { ok: false, status: 503, reason: "verify_unavailable" };   // fail-closed
  }
  return decideAdminAccess(decoded, ownership, allow, capability);
}

/**
 * 기사 발행 관리자 검증 — **ARTICLE_ADMIN_UIDS 만** 사용한다.
 * ⚠️ REWARD_ADMIN_UIDS 로는 절대 통과하지 않는다.
 */
export function verifyArticleAdmin(
  idToken: string,
  env: Record<string, any>,
  target: FirestoreTarget = productionFirestoreTarget(),
  nowMs: number = Date.now(),
  verify: typeof verifyIdTokenOwnsUid = verifyIdTokenOwnsUid,
  expectedProject: string = expectedProjectFor(target),
): Promise<AdminDecision> {
  return verifyCapability("article", idToken, env, target, nowMs, verify, expectedProject);
}

/**
 * 재화·프리미엄 지급 관리자 검증 — **REWARD_ADMIN_UIDS 만** 사용한다.
 * ⚠️ ARTICLE_ADMIN_UIDS 로는 절대 통과하지 않는다.
 */
export function verifyRewardAdmin(
  idToken: string,
  env: Record<string, any>,
  target: FirestoreTarget = productionFirestoreTarget(),
  nowMs: number = Date.now(),
  verify: typeof verifyIdTokenOwnsUid = verifyIdTokenOwnsUid,
  expectedProject: string = expectedProjectFor(target),
): Promise<AdminDecision> {
  return verifyCapability("reward", idToken, env, target, nowMs, verify, expectedProject);
}
