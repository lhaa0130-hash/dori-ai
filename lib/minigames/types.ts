export type MiniGameStatus = "live" | "coming-soon" | "hidden";

export interface MiniGameRegistration {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  accent: string;
  status: MiniGameStatus;
  relatedGame?: string;
}

export interface IlloPlaySettings {
  sound: boolean;
  vibration: boolean;
  reducedMotion: boolean;
}

export interface IlloPlayProgress {
  version: 1;
  updatedAt: number;
  unlockedLevel: number;
  bestStars: Record<string, number>;
  bestMoves: Record<string, number>;
  recentLevels: number[];
  bestStreak: number;
  currentStreak: number;
  tutorialComplete: boolean;
  consecutiveFails: number;
  settings: IlloPlaySettings;
  currentRun?: unknown;
}

export type GameAnalyticsEvent =
  | "game_open"
  | "game_start"
  | "item_move"
  | "set_complete"
  | "order_complete"
  | "no_move"
  | "booster_use"
  | "game_end"
  | "game_retry"
  | "next_game_click";

