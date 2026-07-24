import type { AnimationType, AudioCue, Emotion, InteractionIntent, InteractionState } from "./types.ts";

interface ReactionDefinition {
  emotion: Emotion;
  animation: AnimationType;
  audio: AudioCue;
  durationMs: number;
  lines: string[];
}

const REACTIONS: Record<InteractionIntent["type"], ReactionDefinition> = {
  touch: { emotion: "happy", animation: "bounce", audio: "tap", durationMs: 900, lines: ["응? 나 불렀어?", "여기 있었구나!", "헤헤, 간지러워."] },
  pet: { emotion: "love", animation: "pet", audio: "happy", durationMs: 1_300, lines: ["조금만 더 쓰다듬어 줘.", "마음이 포근해졌어.", "너랑 있으면 안심돼."] },
  double_tap: { emotion: "excited", animation: "spin", audio: "happy", durationMs: 1_100, lines: ["두 번이나! 신난다!", "빙글빙글~", "같이 놀자는 신호지?"] },
  long_press: { emotion: "love", animation: "love", audio: "happy", durationMs: 1_500, lines: ["꼭 안아주는 것 같아.", "우리, 꽤 가까워졌네.", "이 순간 기억할게."] },
  greet: { emotion: "happy", animation: "wave", audio: "tap", durationMs: 1_200, lines: ["어서 와! 기다렸어.", "오늘은 어떤 하루였어?", "다시 만나서 반가워!"] },
  gift: { emotion: "excited", animation: "eat", audio: "gift", durationMs: 1_500, lines: ["정말 나 주는 거야?", "고마워! 소중히 간직할게.", "최고의 선물이야!"] },
  sleep: { emotion: "sleepy", animation: "sleep", audio: "sleep", durationMs: 2_200, lines: ["조금 쉬었다 갈까?", "포근한 꿈 꿀게…", "잘 자, 곁에 있어 줘."] },
  room_item: { emotion: "thinking", animation: "look", audio: "tap", durationMs: 1_200, lines: ["{item}이 마음에 들어.", "{item} 옆에서 쉬어볼까?", "우리 방의 {item}, 멋지지?"] },
  idle: { emotion: "normal", animation: "blink", audio: "tap", durationMs: 1_000, lines: ["오늘은 뭘 해볼까?", "창밖을 잠깐 보고 있었어.", "네가 오길 기다리고 있었어."] },
};

function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) value = (value * 31 + input.charCodeAt(i)) >>> 0;
  return value;
}

export function relationshipFor(affinity: number): "new" | "familiar" | "close" | "best_friend" {
  if (affinity >= 75) return "best_friend";
  if (affinity >= 50) return "close";
  if (affinity >= 25) return "familiar";
  return "new";
}

export function resolveReaction(intent: InteractionIntent, state: InteractionState, now: number): ReactionDefinition & { speech: string } {
  const base = REACTIONS[intent.type];
  const relation = relationshipFor(state.affinity);
  const hour = new Date(now).getHours();
  let lines = base.lines;
  if (intent.type === "greet" && hour < 6) lines = ["아직 깨어 있었구나.", "조용한 밤이네. 같이 있을까?"];
  else if (intent.type === "greet" && hour < 12) lines = ["좋은 아침! 오늘도 함께하자.", "잘 잤어? 기다리고 있었어!"];
  else if (intent.type === "greet" && hour >= 22) lines = ["늦은 시간이네. 무리하지 마.", "오늘도 수고했어. 곁에 있을게."];
  else if ((intent.type === "pet" || intent.type === "long_press") && relation === "best_friend") lines = ["역시 내 가장 친한 친구야.", "말하지 않아도 마음을 알 것 같아."];

  const selected = lines[hash(`${intent.characterId}:${intent.type}:${Math.floor(now / 1000)}:${state.daily.count}`) % lines.length]
    .replaceAll("{item}", intent.roomItemName || "이 가구");
  return { ...base, speech: selected };
}

export function audioCueFor(type: InteractionIntent["type"]): AudioCue {
  return REACTIONS[type].audio;
}

export const EMOTION_META: Record<Emotion, { label: string; emoji: string; color: string }> = {
  happy: { label: "행복", emoji: "😊", color: "#F6A93B" },
  normal: { label: "편안", emoji: "🙂", color: "#7FA894" },
  sleepy: { label: "졸림", emoji: "😴", color: "#8B7BE8" },
  hungry: { label: "배고픔", emoji: "😋", color: "#E58B54" },
  thinking: { label: "생각 중", emoji: "🤔", color: "#4FA3E3" },
  excited: { label: "신남", emoji: "🤩", color: "#F368A0" },
  sad: { label: "속상함", emoji: "😢", color: "#7186B5" },
  angry: { label: "화남", emoji: "😠", color: "#D75B5B" },
  love: { label: "애정", emoji: "🥰", color: "#ED6D9A" },
};
