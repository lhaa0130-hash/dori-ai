import {
  INTERACTION_AFFINITY_DAILY_MAX,
  INTERACTION_COOLDOWN_MS,
  INTERACTION_EXP_DAILY_MAX,
  INTERACTION_RECENT_LIMIT,
  INTERACTION_REWARD,
  INTERACTION_SPAM_MAX,
  INTERACTION_SPAM_WINDOW_MS,
  INTERACTION_VERSION,
} from "./constants.ts";
import { resolveReaction } from "./catalog.ts";
import type { InteractionDailyState, InteractionEvent, InteractionIntent, InteractionResult, InteractionState } from "./types.ts";

export function localDateKey(at = Date.now()): string {
  const d = new Date(at);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptyDaily(at = Date.now()): InteractionDailyState {
  return { date: localDateKey(at), count: 0, affinityGained: 0, expGained: 0, notableTypes: [] };
}

export function defaultInteractionState(at = Date.now()): InteractionState {
  return { version: INTERACTION_VERSION, affinity: 0, emotion: "normal", lastInteraction: null, cooldowns: {}, daily: emptyDaily(at), recent: [] };
}

function eventId(now: number, count: number): string {
  return `ix_${now.toString(36)}_${count.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function currentDaily(state: InteractionState, now: number): InteractionDailyState {
  return state.daily.date === localDateKey(now) ? state.daily : emptyDaily(now);
}

export function processInteraction(state: InteractionState, intent: InteractionIntent): InteractionResult {
  const now = intent.at ?? Date.now();
  const daily = currentDaily(state, now);

  if (intent.type !== "idle") {
    const cooldownUntil = state.cooldowns[intent.type] ?? 0;
    if (cooldownUntil > now) return { accepted: false, state, reason: "cooldown", retryAfterMs: cooldownUntil - now };
    const recentCount = state.recent.filter((event) => event.type !== "idle" && now - event.at < INTERACTION_SPAM_WINDOW_MS).length;
    if (recentCount >= INTERACTION_SPAM_MAX) return { accepted: false, state, reason: "spam", retryAfterMs: INTERACTION_SPAM_WINDOW_MS };
  }

  const reaction = resolveReaction(intent, { ...state, daily }, now);
  const reward = INTERACTION_REWARD[intent.type];
  const affinityDelta = Math.max(0, Math.min(reward.affinity, INTERACTION_AFFINITY_DAILY_MAX - daily.affinityGained, 100 - state.affinity));
  const expDelta = Math.max(0, Math.min(reward.exp, INTERACTION_EXP_DAILY_MAX - daily.expGained));

  const event: InteractionEvent = {
    id: eventId(now, daily.count),
    type: intent.type,
    source: intent.source,
    characterId: intent.characterId,
    roomItemId: intent.roomItemId,
    at: now,
    emotion: reaction.emotion,
    animation: reaction.animation,
    speech: reaction.speech,
    affinityDelta,
    expDelta,
    metadata: intent.metadata ?? {},
  };

  const countsTowardDay = intent.type !== "idle";
  const nextDaily: InteractionDailyState = countsTowardDay ? {
    ...daily,
    count: daily.count + 1,
    affinityGained: daily.affinityGained + affinityDelta,
    expGained: daily.expGained + expDelta,
    notableTypes: daily.notableTypes.includes(intent.type) ? daily.notableTypes : [...daily.notableTypes, intent.type],
  } : daily;

  const next: InteractionState = {
    version: INTERACTION_VERSION,
    affinity: Math.min(100, state.affinity + affinityDelta),
    emotion: reaction.emotion,
    lastInteraction: countsTowardDay ? now : state.lastInteraction,
    cooldowns: countsTowardDay ? { ...state.cooldowns, [intent.type]: now + INTERACTION_COOLDOWN_MS[intent.type] } : state.cooldowns,
    daily: nextDaily,
    recent: [event, ...state.recent].slice(0, INTERACTION_RECENT_LIMIT),
  };

  return {
    accepted: true,
    state: next,
    event,
    ...(countsTowardDay && affinityDelta === 0 && expDelta === 0 ? { reason: "daily_limit" as const } : {}),
  };
}

export function affinityMilestoneCrossed(before: number, after: number): number | null {
  const milestone = [25, 50, 75, 100].find((value) => before < value && after >= value);
  return milestone ?? null;
}
