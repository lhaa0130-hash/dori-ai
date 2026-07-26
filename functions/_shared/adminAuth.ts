// 관리자 인증 공통 계약 (05-08B).
//
// ⚠️ 왜 공통 모듈인가:
//   관리자 엔드포인트가 각자 다른 방식으로 토큰을 검증하면 한 곳만 약해도 전체가 뚫린다.
//   /api/claim-reward 에서 이미 운영 검증된 계약(aud/iss/exp + Firestore 실검증)을 그대로 재사용한다.
//
// ⚠️ 핵심 구분 — "토큰이 유효한 사용자" ≠ "관리자":
//   Firestore 접근이 성공한다는 것은 **로그인한 사용자라는 뜻일 뿐**이다(누구나 자기 userPrivate 을 읽는다).
//   따라서 Firestore 왕복은 '토큰이 진짜인지'만 증명하고, 관리자 판정은 **별도 서버 권위 근거**로 한다.
//
// ⚠️ 이 모듈은 서버 전용이다. functions/_shared 는 CF Pages 라우트로 노출되지 않으며
//   client bundle 에 포함되지 않는다. 클라이언트에서 import 하지 말 것.
import { productionFirestoreTarget, verifyIdTokenOwnsUid, type FirestoreTarget } from "./firestoreRest.ts";

/** 운영 Firebase 프로젝트. 다른 프로젝트에서 발급된 토큰은 전부 거부한다. */
export const PROD_PROJECT_ID = "dori-ai-0130";
/** 보조 조건으로만 쓰는 관리자 이메일(단독 근거 아님 — 아래 decideAdminAccess 참고). */
export const ADMIN_EMAIL = "lhaa0130@gmail.com";

export interface DecodedIdToken { uid: string; email: string; aud: string; iss: string; exp: number }

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
      aud: String(j.aud || ""),
      iss: String(j.iss || ""),
      exp: Number(j.exp || 0),
    };
  } catch { return null; }
}

/** 콤마 구분 UID allowlist 파싱(공백 제거, 빈 항목 무시). */
export function parseAdminUids(raw: unknown): Set<string> {
  return new Set(String(raw ?? "").split(",").map((s) => s.trim()).filter(Boolean));
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
 * 관리자 판정(순수 함수 — 테스트 가능).
 *
 * @param decoded    디코딩된 토큰(서명은 ownership 으로 별도 증명)
 * @param ownership  Firestore 가 토큰을 실검증한 결과
 * @param adminUids  서버 환경변수 allowlist(REWARD_ADMIN_UIDS). 비어 있으면 email 계약으로 폴백.
 *
 * 권한 근거 우선순위:
 *   ① adminUids 가 설정돼 있으면 **UID allowlist 통과 + email 일치** 를 모두 요구(AND).
 *   ② allowlist 가 비어 있으면 기존 운영 계약인 email 일치만 사용한다.
 *      ⚠️ 이건 "지금은 우연히 안전한" 계약이다 — Firebase 는 이메일이 유일해서 관리자 주소를
 *         선점당하지 않지만, 관리자 계정을 지우면 그 주소가 풀린다. 그래서 ①을 권장한다.
 *      기존 동작을 깨지 않으려고 폴백을 남긴다(이 엔드포인트는 이미 운영 중이던 기능이다).
 *
 * ⚠️ 클라이언트가 바꿀 수 있는 값(요청 body 의 email/uid, 사용자 문서 role/isAdmin,
 *    localStorage, UI 상태)은 **어떤 경우에도** 근거로 쓰지 않는다. 이 함수는 그런 입력을 받지 않는다.
 */
export function decideAdminAccess(
  decoded: DecodedIdToken | null,
  ownership: "ok" | "mismatch" | "invalid",
  adminUids: Set<string>,
): AdminDecision {
  if (!decoded) return { ok: false, status: 401, reason: "invalid_token" };
  // Firestore 가 토큰을 거부했다 → 서명·만료가 유효하지 않다.
  if (ownership !== "ok") return { ok: false, status: 401, reason: "token_not_verified" };

  const emailMatches = decoded.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (adminUids.size > 0) {
    // 강한 계약: 서버 allowlist + email 동시 충족.
    if (!adminUids.has(decoded.uid) || !emailMatches) return { ok: false, status: 403, reason: "not_admin" };
    return { ok: true };
  }
  // 폴백(기존 운영 계약). 로그인한 일반 사용자는 여기서 403 으로 걸러진다.
  if (!emailMatches) return { ok: false, status: 403, reason: "not_admin" };
  return { ok: true };
}

/**
 * 실제 검증(네트워크 포함). 토큰 claim 검사 → Firestore 실검증 → 관리자 판정.
 * 검증 서비스 오류는 fail-closed(401)로 처리한다.
 */
export async function verifyAdmin(
  idToken: string,
  env: Record<string, any>,
  target: FirestoreTarget = productionFirestoreTarget(),
  nowMs: number = Date.now(),
  verify: typeof verifyIdTokenOwnsUid = verifyIdTokenOwnsUid,
): Promise<AdminDecision> {
  const decoded = decodeIdToken(idToken);
  if (!tokenClaimsValid(decoded, PROD_PROJECT_ID, nowMs)) {
    return { ok: false, status: 401, reason: "invalid_token" };
  }
  let ownership: "ok" | "mismatch" | "invalid";
  try {
    ownership = await verify(target, idToken, (decoded as DecodedIdToken).uid);
  } catch {
    return { ok: false, status: 401, reason: "verify_unavailable" };   // fail-closed
  }
  return decideAdminAccess(decoded, ownership, parseAdminUids(env?.REWARD_ADMIN_UIDS));
}
