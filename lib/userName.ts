/**
 * 사용자 이름을 일관되게 가져오는 유틸리티 함수
 * localStorage에 저장된 이름을 우선적으로 사용
 */

export function getUserName(userEmail: string | null | undefined, sessionName: string | null | undefined): string {
  if (typeof window === 'undefined') {
    return sessionName || "사용자";
  }

  if (!userEmail) {
    return sessionName || "사용자";
  }

  // localStorage에 저장된 이름을 우선적으로 사용
  const savedName = localStorage.getItem(`dori_user_name_${userEmail}`);
  if (savedName) {
    return savedName;
  }

  // 없으면 세션 이름 사용
  if (sessionName) {
    // 세션 이름을 localStorage에 저장 (다음 로그인 시 사용)
    localStorage.setItem(`dori_user_name_${userEmail}`, sessionName);
    return sessionName;
  }

  return "사용자";
}

/**
 * 사용자 이름을 설정하는 함수
 */
export function setUserName(userEmail: string, name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`dori_user_name_${userEmail}`, name);
}

