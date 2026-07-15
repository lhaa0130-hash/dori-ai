// 관리자(운영자) 판별 — 단일 소스. 관리자 이메일과 판별 함수를 여기서만 관리한다.
// (app/admin, RequireAdmin, 프로젝트 카드 등 접근 제어가 모두 이 값을 공유)
export const ADMIN_EMAIL = "lhaa0130@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
