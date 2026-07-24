import assert from "node:assert/strict";
import test from "node:test";
import {
  LONG_ABSENCE_MS,
  TRANSIENT_EMOTION_MS,
  TRANSIENT_SPEECH,
  idleHungerEmotion,
  isMealHour,
  recoversTransient,
  rejectionEmotion,
  returnEmotion,
  transientSpeech,
} from "../lib/myWorld/interaction/emotion.ts";

test("hungry only appears around meal hours and only for part of the rolls", () => {
  assert.equal(isMealHour(12), true);
  assert.equal(isMealHour(18), true);
  assert.equal(isMealHour(9), false);
  assert.equal(isMealHour(15), false);
  assert.equal(isMealHour(23), false);

  assert.equal(idleHungerEmotion(12, 0.1), "hungry");
  assert.equal(idleHungerEmotion(18, 0.34), "hungry");
  assert.equal(idleHungerEmotion(12, 0.9), null);  // 같은 시간대라도 항상 뜨지는 않음
  assert.equal(idleHungerEmotion(9, 0.1), null);   // 식사 시간대가 아니면 안 뜸
});

test("sad only appears after a long absence and never on a first visit", () => {
  const now = new Date(2026, 6, 24, 10).getTime();
  assert.equal(returnEmotion(null, now), null);                        // 첫 방문
  assert.equal(returnEmotion(now - 60_000, now), null);                // 방금 전
  assert.equal(returnEmotion(now - LONG_ABSENCE_MS + 1, now), null);   // 경계 직전
  assert.equal(returnEmotion(now - LONG_ABSENCE_MS, now), "sad");      // 경계
  assert.equal(returnEmotion(now - 10 * 24 * 3600_000, now), "sad");
  assert.equal(returnEmotion(Number.NaN, now), null);
});

test("angry is limited to spam rejection, not cooldown or daily limits", () => {
  assert.equal(rejectionEmotion("spam"), "angry");
  assert.equal(rejectionEmotion("cooldown"), null);
  assert.equal(rejectionEmotion("daily_limit"), null);
  assert.equal(rejectionEmotion(undefined), null);
});

test("positive interactions recover transient emotions, idle does not", () => {
  for (const type of ["touch", "pet", "greet", "gift", "double_tap", "long_press", "room_item"] as const) {
    assert.equal(recoversTransient(type), true, `${type} should recover`);
  }
  assert.equal(recoversTransient("idle"), false);
  assert.equal(recoversTransient("sleep"), false);
});

test("transient emotions are short-lived and use non-blaming copy", () => {
  for (const emotion of ["hungry", "sad", "angry"] as const) {
    assert.ok(TRANSIENT_EMOTION_MS[emotion] > 0);
    assert.ok(TRANSIENT_EMOTION_MS[emotion] <= 10_000, "일시 감정은 오래 남지 않아야 한다");
    assert.ok(TRANSIENT_SPEECH[emotion].length > 0);
  }
  // 사용자를 비난하거나 죄책감을 주는 표현이 없어야 한다.
  const blaming = /(왜|안 왔|버렸|미워|싫어|짜증|화났|삐졌|잘못)/;
  for (const lines of Object.values(TRANSIENT_SPEECH)) {
    for (const line of lines) assert.ok(!blaming.test(line), `비난 표현 금지: ${line}`);
  }
});

test("transient speech selection is deterministic and stays in range", () => {
  assert.equal(transientSpeech("angry", 0), TRANSIENT_SPEECH.angry[0]);
  assert.equal(transientSpeech("angry", 0.999), TRANSIENT_SPEECH.angry[TRANSIENT_SPEECH.angry.length - 1]);
  assert.ok(TRANSIENT_SPEECH.hungry.includes(transientSpeech("hungry", 0.5)));
  assert.equal(transientSpeech("sad", 1.5), TRANSIENT_SPEECH.sad[TRANSIENT_SPEECH.sad.length - 1]); // 범위 밖 방어
  assert.equal(transientSpeech("sad", -1), TRANSIENT_SPEECH.sad[0]);
});
