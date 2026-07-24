// My World — Interaction persistence, cache and offline queue (05-06).
// Firestore is authoritative for signed-in users; cache enables instant/offline UX.
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { INTERACTION_CACHE_PREFIX, INTERACTION_QUEUE_PREFIX, INTERACTION_RECENT_LIMIT, INTERACTION_VERSION } from "@/lib/myWorld/interaction/constants";
import { defaultInteractionState, emptyDaily, localDateKey } from "@/lib/myWorld/interaction/engine";
import type { AnimationType, Emotion, InteractionEvent, InteractionSource, InteractionState, InteractionType } from "@/lib/myWorld/interaction/types";

const TYPES = new Set<InteractionType>(["touch", "pet", "double_tap", "long_press", "greet", "gift", "sleep", "room_item", "idle"]);
const SOURCES = new Set<InteractionSource>(["pointer", "touch", "mouse", "keyboard", "room", "system"]);
const EMOTIONS = new Set<Emotion>(["happy", "normal", "sleepy", "hungry", "thinking", "excited", "sad", "angry", "love"]);
const ANIMATIONS = new Set<AnimationType>(["idle", "blink", "look", "walk", "sit", "wave", "bounce", "spin", "pet", "eat", "sleep", "think", "sad", "angry", "love"]);

function number(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeEvent(raw: unknown): InteractionEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.characterId !== "string" || !TYPES.has(r.type as InteractionType)) return null;
  return {
    id: r.id,
    type: r.type as InteractionType,
    source: SOURCES.has(r.source as InteractionSource) ? r.source as InteractionSource : "system",
    characterId: r.characterId,
    roomItemId: typeof r.roomItemId === "string" ? r.roomItemId : undefined,
    at: number(r.at, Date.now()),
    emotion: EMOTIONS.has(r.emotion as Emotion) ? r.emotion as Emotion : "normal",
    animation: ANIMATIONS.has(r.animation as AnimationType) ? r.animation as AnimationType : "idle",
    speech: typeof r.speech === "string" ? r.speech.slice(0, 160) : "",
    affinityDelta: Math.max(0, Math.min(4, number(r.affinityDelta))),
    expDelta: Math.max(0, Math.min(5, number(r.expDelta))),
    metadata: r.metadata && typeof r.metadata === "object" ? r.metadata as InteractionEvent["metadata"] : {},
  };
}

export function normalizeInteractionState(raw: unknown, at = Date.now()): InteractionState {
  if (!raw || typeof raw !== "object") return defaultInteractionState(at);
  const r = raw as Record<string, unknown>;
  const dailyRaw = r.daily && typeof r.daily === "object" ? r.daily as Record<string, unknown> : {};
  const date = typeof dailyRaw.date === "string" ? dailyRaw.date : localDateKey(at);
  const daily = date === localDateKey(at) ? {
    date,
    count: Math.max(0, Math.floor(number(dailyRaw.count))),
    affinityGained: Math.max(0, Math.floor(number(dailyRaw.affinityGained))),
    expGained: Math.max(0, Math.floor(number(dailyRaw.expGained))),
    notableTypes: Array.isArray(dailyRaw.notableTypes) ? dailyRaw.notableTypes.filter((v): v is InteractionType => TYPES.has(v as InteractionType)).slice(0, 9) : [],
  } : emptyDaily(at);

  const cooldownRaw = r.cooldowns && typeof r.cooldowns === "object" ? r.cooldowns as Record<string, unknown> : {};
  const cooldowns: InteractionState["cooldowns"] = {};
  TYPES.forEach((type) => {
    const value = number(cooldownRaw[type]);
    if (value > at - 60_000) cooldowns[type] = value;
  });

  return {
    version: INTERACTION_VERSION,
    affinity: Math.max(0, Math.min(100, Math.floor(number(r.affinity)))),
    emotion: EMOTIONS.has(r.emotion as Emotion) ? r.emotion as Emotion : "normal",
    lastInteraction: typeof r.lastInteraction === "number" && Number.isFinite(r.lastInteraction) ? r.lastInteraction : null,
    cooldowns,
    daily,
    recent: (Array.isArray(r.recent) ? r.recent : []).map(normalizeEvent).filter((event): event is InteractionEvent => !!event).sort((a, b) => b.at - a.at).slice(0, INTERACTION_RECENT_LIMIT),
  };
}

export function serializeInteractionState(state: InteractionState): InteractionState {
  return normalizeInteractionState(state);
}

function cacheKey(uid: string): string { return `${INTERACTION_CACHE_PREFIX}${uid}`; }
function queueKey(uid: string): string { return `${INTERACTION_QUEUE_PREFIX}${uid}`; }

export function getCachedInteractionState(uid: string | null | undefined): InteractionState | null {
  if (!uid || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(uid));
    return raw ? normalizeInteractionState(JSON.parse(raw)) : null;
  } catch { return null; }
}

export function setCachedInteractionState(uid: string, state: InteractionState): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(cacheKey(uid), JSON.stringify(serializeInteractionState(state))); } catch { /* storage may be unavailable */ }
}

export function queueInteractionSync(uid: string, state: InteractionState): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(queueKey(uid), JSON.stringify(serializeInteractionState(state))); } catch { /* storage may be unavailable */ }
}

export function hasQueuedInteractionSync(uid: string): boolean {
  if (typeof window === "undefined") return false;
  try { return !!window.localStorage.getItem(queueKey(uid)); } catch { return false; }
}

export function getQueuedInteractionState(uid: string): InteractionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(queueKey(uid));
    return raw ? normalizeInteractionState(JSON.parse(raw)) : null;
  } catch { return null; }
}

function clearQueue(uid: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(queueKey(uid)); } catch { /* noop */ }
}

export async function loadInteractionState(uid: string): Promise<InteractionState> {
  if (!uid) return defaultInteractionState();
  try {
    const snap = await getDoc(doc(getFirebaseFirestore(), "users", uid));
    const raw = snap.exists() ? (snap.data() as { myWorld?: { interaction?: unknown } }).myWorld?.interaction : null;
    return normalizeInteractionState(raw);
  } catch { return getCachedInteractionState(uid) ?? defaultInteractionState(); }
}

/** Merge-saves only myWorld.interaction; Character, Diary, Room and account fields are preserved. */
export async function saveInteractionState(uid: string, state: InteractionState): Promise<InteractionState> {
  if (!uid) throw new Error("no uid");
  const clean = serializeInteractionState(state);
  await setDoc(
    doc(getFirebaseFirestore(), "users", uid),
    { myWorld: { interaction: { ...clean, updatedAt: serverTimestamp() } } },
    { merge: true },
  );
  setCachedInteractionState(uid, clean);
  clearQueue(uid);
  return clean;
}

export async function flushInteractionQueue(uid: string): Promise<InteractionState | null> {
  const queued = getQueuedInteractionState(uid);
  if (!queued) return null;
  return saveInteractionState(uid, queued);
}
