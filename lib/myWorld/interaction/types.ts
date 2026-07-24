// My World — Interaction domain contracts (05-06).
// UI, persistence, animation/audio adapters and future AI consumers communicate
// through these types so the character renderer can be replaced independently.

export type InteractionType =
  | "touch"
  | "pet"
  | "double_tap"
  | "long_press"
  | "greet"
  | "gift"
  | "sleep"
  | "room_item"
  | "idle";

export type InteractionSource = "pointer" | "touch" | "mouse" | "keyboard" | "room" | "system";

export type Emotion =
  | "happy"
  | "normal"
  | "sleepy"
  | "hungry"
  | "thinking"
  | "excited"
  | "sad"
  | "angry"
  | "love";

export type AnimationType =
  | "idle"
  | "blink"
  | "look"
  | "walk"
  | "sit"
  | "wave"
  | "bounce"
  | "spin"
  | "pet"
  | "eat"
  | "sleep"
  | "think"
  | "sad"
  | "angry"
  | "love";

export type AudioCue = "tap" | "happy" | "gift" | "sleep" | "limit";

export interface InteractionIntent {
  type: InteractionType;
  source: InteractionSource;
  characterId: string;
  roomItemId?: string;
  roomItemName?: string;
  at?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface InteractionEvent {
  id: string;
  type: InteractionType;
  source: InteractionSource;
  characterId: string;
  roomItemId?: string;
  at: number;
  emotion: Emotion;
  animation: AnimationType;
  speech: string;
  affinityDelta: number;
  expDelta: number;
  metadata: Record<string, string | number | boolean>;
}

export interface InteractionDailyState {
  date: string;
  count: number;
  affinityGained: number;
  expGained: number;
  notableTypes: InteractionType[];
}

export interface InteractionState {
  version: number;
  affinity: number;
  emotion: Emotion;
  lastInteraction: number | null;
  cooldowns: Partial<Record<InteractionType, number>>;
  daily: InteractionDailyState;
  recent: InteractionEvent[];
}

export type InteractionRejectReason = "cooldown" | "spam" | "daily_limit";

export interface InteractionResult {
  accepted: boolean;
  state: InteractionState;
  event?: InteractionEvent;
  reason?: InteractionRejectReason;
  retryAfterMs?: number;
}

export interface AnimationCommand {
  id: string;
  type: AnimationType;
  durationMs: number;
  priority: number;
}

export interface InteractionNotice {
  id: string;
  emoji: string;
  label: string;
  tone: "affinity" | "exp" | "info" | "limit";
}

/** Stable payload consumed by a future AI-character prompt pipeline. */
export interface AIInteractionContext {
  event: InteractionEvent;
  affinity: number;
  emotion: Emotion;
  relationship: "new" | "familiar" | "close" | "best_friend";
}
