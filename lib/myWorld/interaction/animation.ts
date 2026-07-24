// My World — Animation Queue 정책 (05-06B). React 밖의 순수 함수로 분리 → 테스트 가능.
import type { AnimationCommand } from "./types.ts";

/** 큐 최대 길이(오래된 명령은 버려 큐가 무한히 자라지 않게 한다). */
export const ANIMATION_QUEUE_MAX = 5;

/** 우선순위 명령으로 간주하는 기준. */
export const ANIMATION_PRIORITY_THRESHOLD = 1;

/**
 * 명령 큐잉(순수). priority 가 임계값보다 크면 앞으로, 아니면 뒤로.
 * 항상 max 이하 길이를 유지하며, 넘칠 때는 우선순위 명령 반대쪽 끝을 버린다.
 */
export function enqueueAnimationCommand(
  queue: AnimationCommand[],
  next: AnimationCommand,
  max: number = ANIMATION_QUEUE_MAX,
): AnimationCommand[] {
  const highPriority = next.priority > ANIMATION_PRIORITY_THRESHOLD;
  const merged = highPriority ? [next, ...queue] : [...queue, next];
  if (merged.length <= max) return merged;
  // 우선순위 명령은 앞을 지키고 뒤를 버리고, 일반 명령은 오래된 앞을 버린다.
  return highPriority ? merged.slice(0, max) : merged.slice(merged.length - max);
}
