import type { IlloPlayProgress } from "./types";

export const ILLO_MART_STORAGE_KEY = "illo_play_mart_v1";
export const ILLO_MART_RUN_KEY = "illo_play_mart_run_v1";

export const DEFAULT_ILLO_PLAY_PROGRESS: IlloPlayProgress = {
  version: 1,
  updatedAt: 0,
  unlockedLevel: 1,
  bestStars: {},
  bestMoves: {},
  recentLevels: [],
  bestStreak: 0,
  currentStreak: 0,
  tutorialComplete: false,
  consecutiveFails: 0,
  settings: {
    sound: true,
    vibration: true,
    reducedMotion: false,
  },
};

export function normalizeProgress(value: unknown): IlloPlayProgress {
  if (!value || typeof value !== "object") return { ...DEFAULT_ILLO_PLAY_PROGRESS };
  const raw = value as Partial<IlloPlayProgress>;
  return {
    ...DEFAULT_ILLO_PLAY_PROGRESS,
    ...raw,
    version: 1,
    unlockedLevel: Math.min(30, Math.max(1, Number(raw.unlockedLevel) || 1)),
    bestStars: raw.bestStars && typeof raw.bestStars === "object" ? raw.bestStars : {},
    bestMoves: raw.bestMoves && typeof raw.bestMoves === "object" ? raw.bestMoves : {},
    recentLevels: Array.isArray(raw.recentLevels)
      ? raw.recentLevels.filter((level) => Number.isInteger(level) && level >= 1 && level <= 30).slice(0, 5)
      : [],
    settings: { ...DEFAULT_ILLO_PLAY_PROGRESS.settings, ...(raw.settings || {}) },
  };
}

export function readLocalProgress(): IlloPlayProgress {
  if (typeof window === "undefined") return { ...DEFAULT_ILLO_PLAY_PROGRESS };
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(ILLO_MART_STORAGE_KEY) || "null"));
  } catch {
    return { ...DEFAULT_ILLO_PLAY_PROGRESS };
  }
}

export function writeLocalProgress(progress: IlloPlayProgress): IlloPlayProgress {
  const next = normalizeProgress({ ...progress, updatedAt: Date.now() });
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ILLO_MART_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private browsing and full storage should not block a game.
    }
  }
  return next;
}

export function readLocalRun<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(ILLO_MART_RUN_KEY) || "null") as T | null;
  } catch {
    return null;
  }
}

export function writeLocalRun<T>(run: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ILLO_MART_RUN_KEY, JSON.stringify(run));
  } catch {
    // The next interaction will try again if storage becomes available.
  }
}

export function clearLocalRun() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ILLO_MART_RUN_KEY);
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}
