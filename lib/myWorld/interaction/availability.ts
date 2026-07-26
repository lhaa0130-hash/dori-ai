// My World — 행동 가능 여부 계산(순수).
//
// 목적: "누르고 나서야 거절 알림으로 알게 되는" UX 를 없애기 위해, 버튼을 그리기 전에
//       cooldown 남은 시간과 오늘의 보상 상한 도달 여부를 미리 계산한다.
//
// ⚠️ 정책을 정의하지 않는다. cooldown 값·보상 수치·일일 상한은 모두 `constants.ts` 가 소유하고,
//    수락/거절의 최종 판정은 `engine.processInteraction` 이 한다. 이 모듈은 같은 입력으로
//    **표시용 예측**만 만든다. 여기서 available=true 라도 engine 이 연타(spam)로 거절할 수 있다.
import {
  INTERACTION_AFFINITY_DAILY_MAX,
  INTERACTION_EXP_DAILY_MAX,
} from "./constants.ts";
import { localDateKey } from "./engine.ts";
import type { InteractionState, InteractionType } from "./types.ts";

export interface ActionAvailability {
  type: InteractionType;
  /** 지금 누를 수 있는가 — cooldown 중이면 false. */
  available: boolean;
  /** cooldown 남은 시간(ms). 없으면 0. */
  retryAfterMs: number;
  /** 버튼에 표시할 남은 초(올림). 없으면 0. */
  retryAfterSeconds: number;
}

export interface DailyRewardProgress {
  affinityGained: number;
  affinityMax: number;
  expGained: number;
  expMax: number;
  /** 오늘 받을 수 있는 친밀도·EXP 를 모두 받았는가(놀이는 계속 가능). */
  exhausted: boolean;
}

/** cooldown 기준 표시용 가용성. `idle` 은 사용자 행동이 아니므로 항상 가능으로 본다. */
export function resolveActionAvailability(
  state: InteractionState,
  type: InteractionType,
  now: number = Date.now(),
): ActionAvailability {
  if (type === "idle") return { type, available: true, retryAfterMs: 0, retryAfterSeconds: 0 };
  const until = state.cooldowns[type] ?? 0;
  const remaining = Math.max(0, until - now);
  return {
    type,
    available: remaining === 0,
    retryAfterMs: remaining,
    retryAfterSeconds: remaining > 0 ? Math.ceil(remaining / 1000) : 0,
  };
}

/**
 * 오늘의 보상 적립 현황. 날짜가 바뀌었으면 0 으로 본다(engine 의 `currentDaily` 와 같은 규칙).
 * 상한에 도달해도 상호작용 자체는 계속 가능하다 — 보상만 0 이 된다.
 */
export function dailyRewardProgress(
  state: InteractionState,
  now: number = Date.now(),
): DailyRewardProgress {
  const sameDay = state.daily.date === localDateKey(now);
  const affinityGained = sameDay ? state.daily.affinityGained : 0;
  const expGained = sameDay ? state.daily.expGained : 0;
  return {
    affinityGained,
    affinityMax: INTERACTION_AFFINITY_DAILY_MAX,
    expGained,
    expMax: INTERACTION_EXP_DAILY_MAX,
    exhausted:
      affinityGained >= INTERACTION_AFFINITY_DAILY_MAX &&
      expGained >= INTERACTION_EXP_DAILY_MAX,
  };
}

/** 버튼 보조 문구 — 색이나 흐림만으로 상태를 전달하지 않기 위한 텍스트. */
export function availabilityHint(availability: ActionAvailability): string | null {
  if (availability.available) return null;
  return `${availability.retryAfterSeconds}초 후`;
}
