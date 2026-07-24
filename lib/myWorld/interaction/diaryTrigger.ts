// My World — Diary 자동 기록 조건 (05-06B). React 밖 순수 함수로 분리해 중복 기록을 검증한다.
// 기록 대상: 첫 만남 / 오랜만의 재방문 / 친밀도 단계 상승 / 하루 첫 쓰다듬기 / 하루 첫 선물.
import { localDateKey } from "./engine.ts";
import type { InteractionEvent, InteractionState } from "./types.ts";

/** 이 시간 이상 만나지 않았다가 돌아오면 "오랜만의 방문"으로 기록한다. */
export const DIARY_LONG_ABSENCE_MS = 24 * 60 * 60 * 1000;

export interface DiaryTrigger {
  record: boolean;
  firstMeeting: boolean;
  longAbsence: boolean;
  milestone: number | null;
  firstPetToday: boolean;
  firstGiftToday: boolean;
}

/**
 * before(상호작용 직전 상태)와 방금 발생한 event 로 기록 여부를 판정한다.
 * "오늘 처음" 판정은 daily.notableTypes 로 하며, 날짜가 바뀌면 다시 처음이 된다.
 */
export function evaluateDiaryTrigger(
  before: InteractionState,
  event: InteractionEvent,
  milestone: number | null,
): DiaryTrigger {
  const firstMeeting = before.lastInteraction === null;
  const longAbsence = before.lastInteraction !== null && event.at - before.lastInteraction >= DIARY_LONG_ABSENCE_MS;
  const newDailyWindow = before.daily.date !== localDateKey(event.at);
  const firstPetToday = event.type === "pet" && (newDailyWindow || !before.daily.notableTypes.includes("pet"));
  const firstGiftToday = event.type === "gift" && (newDailyWindow || !before.daily.notableTypes.includes("gift"));

  return {
    record: firstMeeting || longAbsence || milestone !== null || firstPetToday || firstGiftToday,
    firstMeeting,
    longAbsence,
    milestone,
    firstPetToday,
    firstGiftToday,
  };
}
