// My World — 일시적 감정(Transient Emotion) 수명주기 (05-06B).
// hungry/sad/angry 는 "영구 감정"이 아니라 UI 표시용 일시 감정이다.
//  · Firestore 에 저장하지 않는다(영구 감정은 InteractionState.emotion 만).
//  · 친밀도를 차감하지 않는다.
//  · 사용자를 비난하거나 죄책감을 주는 문구를 쓰지 않는다.
//  · 일정 시간 뒤 또는 긍정적 상호작용 시 회복된다.
import type { InteractionRejectReason, InteractionType } from "./types.ts";

export type TransientEmotion = "hungry" | "sad" | "angry";

/** 일시 감정 표시 시간(ms). 지나면 자동으로 영구 감정으로 복귀. */
export const TRANSIENT_EMOTION_MS: Record<TransientEmotion, number> = {
  hungry: 6_000,
  sad: 5_000,
  angry: 2_500,
};

/** 이 기간 이상 상호작용이 없었다가 돌아오면 "오랜만" 으로 본다. */
export const LONG_ABSENCE_MS = 3 * 24 * 60 * 60 * 1000;

/** 점심(11~13시)·저녁(17~19시) 무렵. */
export function isMealHour(hour: number): boolean {
  return (hour >= 11 && hour < 14) || (hour >= 17 && hour < 20);
}

/**
 * Idle 중 배고픔 표시 여부. roll 은 0~1 (호출부에서 주입 → 테스트 결정적).
 * 식사 시간대에만, 그중 일부 확률로만 표시한다.
 */
export function idleHungerEmotion(hour: number, roll: number): TransientEmotion | null {
  if (!isMealHour(hour)) return null;
  return roll < 0.35 ? "hungry" : null;
}

/** 오랜만에 돌아온 첫 순간의 아쉬움(비난 아님). lastInteraction 이 없으면 표시하지 않음. */
export function returnEmotion(lastInteraction: number | null, now: number): TransientEmotion | null {
  if (lastInteraction === null || !Number.isFinite(lastInteraction)) return null;
  return now - lastInteraction >= LONG_ABSENCE_MS ? "sad" : null;
}

/** 연타 제한(spam)에 걸렸을 때만 짧게 삐침. 쿨다운 거절은 감정 변화 없음. */
export function rejectionEmotion(reason: InteractionRejectReason | undefined): TransientEmotion | null {
  return reason === "spam" ? "angry" : null;
}

/** 긍정적 상호작용이 성공하면 일시 감정을 즉시 회복(해제)한다. */
const RECOVERING: ReadonlySet<InteractionType> = new Set<InteractionType>([
  "touch", "pet", "greet", "gift", "double_tap", "long_press", "room_item",
]);
export function recoversTransient(type: InteractionType): boolean {
  return RECOVERING.has(type);
}

/** 일시 감정별 말풍선(비난·죄책감 없는 문구). */
export const TRANSIENT_SPEECH: Record<TransientEmotion, string[]> = {
  hungry: ["슬슬 배가 고파지는 시간이야.", "간식 생각이 나는걸?", "밥 먹을 시간인가 봐."],
  sad: ["오랜만이야. 많이 기다렸어.", "다시 만나서 정말 반가워.", "그동안 잘 지냈어?"],
  angry: ["잠깐 쉬었다 놀자!", "조금만 천천히 해줘.", "숨 좀 돌리고 다시 놀자."],
};

/** roll 은 0~1 (호출부 주입 → 테스트 결정적). */
export function transientSpeech(emotion: TransientEmotion, roll: number): string {
  const lines = TRANSIENT_SPEECH[emotion];
  const index = Math.min(lines.length - 1, Math.max(0, Math.floor(roll * lines.length)));
  return lines[index];
}
