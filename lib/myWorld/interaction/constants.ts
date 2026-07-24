import type { InteractionType } from "./types.ts";

export const INTERACTION_VERSION = 1;
export const INTERACTION_CACHE_PREFIX = "illo_myworld_interaction_v1_";
export const INTERACTION_QUEUE_PREFIX = "illo_myworld_interaction_queue_v1_";
export const INTERACTION_RECENT_LIMIT = 24;
export const INTERACTION_SPAM_WINDOW_MS = 30_000;
export const INTERACTION_SPAM_MAX = 12;
export const INTERACTION_AFFINITY_DAILY_MAX = 20;
export const INTERACTION_EXP_DAILY_MAX = 40;

export const INTERACTION_COOLDOWN_MS: Record<InteractionType, number> = {
  touch: 1_200,
  pet: 2_500,
  double_tap: 2_000,
  long_press: 3_500,
  greet: 4_000,
  gift: 8_000,
  sleep: 5_000,
  room_item: 2_000,
  idle: 0,
};

export const INTERACTION_REWARD: Record<InteractionType, { affinity: number; exp: number }> = {
  touch: { affinity: 1, exp: 1 },
  pet: { affinity: 2, exp: 2 },
  double_tap: { affinity: 2, exp: 2 },
  long_press: { affinity: 3, exp: 3 },
  greet: { affinity: 1, exp: 2 },
  gift: { affinity: 4, exp: 5 },
  sleep: { affinity: 1, exp: 1 },
  room_item: { affinity: 1, exp: 2 },
  idle: { affinity: 0, exp: 0 },
};

export const AFFINITY_MILESTONES = [25, 50, 75, 100] as const;
