import type { GameAnalyticsEvent } from "./types";

export type GameAnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export interface GameAnalyticsAdapter {
  track(event: GameAnalyticsEvent, payload?: GameAnalyticsPayload): void;
}

function browserTrack(event: GameAnalyticsEvent, payload: GameAnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const detail = { game: "illo-mart", event, ...payload };
  window.dispatchEvent(new CustomEvent("illo-game-analytics", { detail }));

  const dataLayer = (window as typeof window & { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(dataLayer)) dataLayer.push(detail);
}

let adapter: GameAnalyticsAdapter = { track: browserTrack };

export function setGameAnalyticsAdapter(next: GameAnalyticsAdapter) {
  adapter = next;
}

export function trackGameEvent(event: GameAnalyticsEvent, payload?: GameAnalyticsPayload) {
  try {
    adapter.track(event, payload);
  } catch {
    // Analytics must never interrupt play.
  }
}

