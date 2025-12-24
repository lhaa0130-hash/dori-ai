/**
 * 연속적으로 발생하는 이벤트 (스크롤, 드래그 등)를 일정 시간 동안 한 번만 실행되도록 제한합니다.
 * @param func 실행할 함수
 * @param limit 제한 시간 (ms)
 */
export const throttle = (func: (...args: any[]) => void, limit: number) => {
  let inThrottle: boolean;
  let lastResult: any;

  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      lastResult = func.apply(this, args);
    }
    return lastResult;
  };
};

/**
 * 현재 환경이 앱(WebView)인지 확인하는 함수
 * 
 * 주 판별 조건: User-Agent에 "DoriAIApp/Android"가 포함되어 있으면 앱으로 판단
 * 개발/테스트 용도: 쿼리 파라미터에 ?app=true가 있으면 앱으로 판단 (로컬 개발 환경에서만 사용)
 */
export function isApp(): boolean {
  if (typeof window === "undefined") return false;
  
  // 개발/테스트 용도: 쿼리 파라미터 체크 (로컬 개발 환경에서만 사용)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("app") === "true") return true;
  
  // 주 판별 조건: User-Agent에 "DoriAIApp/Android" 포함 여부 확인
  const userAgent = window.navigator.userAgent;
  return userAgent.includes("DoriAIApp/Android");
}