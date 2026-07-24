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

// 방 가구별 상호작용 매핑(Room Registry 아이템 id → 반응). 스펙 최소 매핑 구현.
//  없는 id 는 기본 room_item 반응으로 폴백.
interface RoomItemReaction { emotion: Emotion; animation: AnimationType; lines: string[] }
const ROOM_ITEM_REACTIONS: Record<string, RoomItemReaction> = {
  "bed-basic": { emotion: "sleepy", animation: "sleep", lines: ["폭신한 침대에 누워볼까?", "침대에서 잠깐 낮잠 자면 좋겠다.", "침대는 언제나 포근해."] },
  "desk-basic": { emotion: "thinking", animation: "think", lines: ["책상에서 뭘 해볼까?", "여기서 공부하면 집중이 잘 돼.", "골똘히 생각 중이야."] },
  "chair-basic": { emotion: "normal", animation: "sit", lines: ["의자에 앉아 쉴래.", "여기 앉으면 편안해.", "잠깐 앉아 있을게."] },
  "table-basic": { emotion: "normal", animation: "sit", lines: ["테이블 앞에 앉았어.", "여기서 간식 먹을까?", "도란도란 이야기하기 좋아."] },
  "bookshelf-basic": { emotion: "thinking", animation: "think", lines: ["어떤 책을 읽어볼까?", "책이 정말 많다!", "이야기 속으로 빠져들 것 같아."] },
  "toybox-basic": { emotion: "excited", animation: "bounce", lines: ["장난감 상자다! 놀자!", "안에 뭐가 들어있을까?", "신나는 게 가득해!"] },
  "plant-basic": { emotion: "happy", animation: "look", lines: ["화분을 가만히 관찰하는 중이야.", "새싹이 무럭무럭 자라고 있어!", "식물을 보면 마음이 편안해져."] },
  "lamp-basic": { emotion: "normal", animation: "look", lines: ["조명을 가만히 바라봐.", "따뜻한 불빛이 참 좋아.", "은은한 빛에 마음이 놓여."] },
  "doll-basic": { emotion: "love", animation: "love", lines: ["인형을 꼭 안았어.", "포근한 친구야.", "같이 꼭 안고 있을래."] },
  "rug-basic": { emotion: "normal", animation: "sit", lines: ["러그 위에 앉아 쉬는 중.", "폭신한 러그가 좋아.", "여기서 뒹굴뒹굴하고 싶어."] },
  "cushion-basic": { emotion: "sleepy", animation: "sit", lines: ["쿠션에 기대 쉴래.", "폭신폭신 편안해.", "여기 기대면 스르르 잠이 와."] },
  "frame-basic": { emotion: "happy", animation: "look", lines: ["액자를 바라보고 있어.", "좋은 추억이 담긴 것 같아.", "그림을 보니 기분이 좋아져."] },
};

function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) value = (value * 31 + input.charCodeAt(i)) >>> 0;
  return value;
}

/** 방 가구 id 에 매핑된 반응(없으면 null). UI/테스트 재사용. */
export function roomItemReaction(itemId?: string): RoomItemReaction | null {
  return itemId && ROOM_ITEM_REACTIONS[itemId] ? ROOM_ITEM_REACTIONS[itemId] : null;
}

export function relationshipFor(affinity: number): "new" | "familiar" | "close" | "best_friend" {
  if (affinity >= 75) return "best_friend";
  if (affinity >= 50) return "close";
  if (affinity >= 25) return "familiar";
  return "new";
}

export function resolveReaction(intent: InteractionIntent, state: InteractionState, now: number): ReactionDefinition & { speech: string } {
  let base = REACTIONS[intent.type];
  // 방 가구별 상호작용: 매핑이 있으면 감정/애니메이션/대사를 가구에 맞게 대체(스펙 Room Hook).
  if (intent.type === "room_item") {
    const mapped = roomItemReaction(intent.roomItemId);
    if (mapped) base = { ...base, emotion: mapped.emotion, animation: mapped.animation, lines: mapped.lines };
  }
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
