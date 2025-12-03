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