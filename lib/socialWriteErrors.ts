// 소셜 쓰기(글/댓글) 실패의 '안전한' 관측성 (05-06M).
//  기존에는 addPost/addComment 가 예외를 통째로 삼켜(catch { return false }) 실패 원인이
//  콘솔에도 남지 않았다 → 사용자는 "저장하지 못했어요"만 보고, 운영자는 원인을 알 수 없었다.
//
// ⚠️ 로그에 남기는 것: operation 이름 · Firebase error code · 분류 · 환경(dev/emulator 여부).
// ⚠️ 절대 남기지 않는 것: token/Authorization · email · UID 전체값 · 글 제목/본문 · 댓글 내용 ·
//    Service Account 정보. production 에서는 상세 메시지를 출력하지 않고 code/분류만 남긴다.

export type SocialWriteFailureKind =
  | "permission_denied"   // Rules 거부 — payload 와 Rules 계약 불일치
  | "unauthenticated"     // 로그인 안 됨/토큰 만료
  | "invalid_argument"    // undefined 직렬화 등 payload 문제
  | "unavailable"         // 네트워크/일시 장애
  | "not_found"
  | "unknown";

export interface SocialWriteFailure {
  operation: string;
  code: string;                     // Firebase error code(예: permission-denied). 비밀 아님.
  kind: SocialWriteFailureKind;
}

/** Firebase error code → 분류. code 는 라이브러리 상수라 PII 가 아니다. */
export function classifySocialWriteError(error: unknown): SocialWriteFailure["kind"] {
  const code = String((error as { code?: string })?.code || "").toLowerCase();
  if (code.includes("permission-denied")) return "permission_denied";
  if (code.includes("unauthenticated")) return "unauthenticated";
  if (code.includes("invalid-argument")) return "invalid_argument";
  if (code.includes("unavailable") || code.includes("deadline")) return "unavailable";
  if (code.includes("not-found")) return "not_found";
  return "unknown";
}

/** 안전한 code 추출. code 가 없으면 메시지 대신 'unknown' — 본문/PII 유출 방지. */
export function safeErrorCode(error: unknown): string {
  const code = (error as { code?: unknown })?.code;
  return typeof code === "string" && code.length <= 64 ? code : "unknown";
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * 소셜 쓰기 실패를 안전하게 보고한다.
 *  · 항상: operation + code + kind (비밀 아님)
 *  · dev/emulator 에서만: 원본 error 객체(디버깅용). production 에서는 출력하지 않는다.
 *  · 테스트/진단이 읽을 수 있도록 마지막 실패를 창 전역에 code 만 남긴다(본문·PII 없음).
 */
export function reportSocialWriteFailure(operation: string, error: unknown): SocialWriteFailure {
  const failure: SocialWriteFailure = {
    operation,
    code: safeErrorCode(error),
    kind: classifySocialWriteError(error),
  };
  try {
    // eslint-disable-next-line no-console
    console.warn(`[social] ${failure.operation} failed: code=${failure.code} kind=${failure.kind}`);
    if (isDev) console.warn("[social] (dev only) detail:", error);
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__illoLastSocialWriteFailure = { ...failure };
    }
  } catch { /* 로깅 실패가 기능을 막지 않는다 */ }
  return failure;
}
