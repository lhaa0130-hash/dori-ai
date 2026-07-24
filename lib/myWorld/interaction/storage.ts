// My World — Interaction 저장 경계(05-06B).
// 브라우저 API에 의존하지 않도록 KeyValueStorage 어댑터로 분리 → 캐시·오프라인 큐·충돌 규칙을 테스트 가능.
// Firestore 접근은 state.ts 가 담당한다(이 파일은 firebase 를 import 하지 않는다).
import { INTERACTION_CACHE_PREFIX, INTERACTION_QUEUE_PREFIX, INTERACTION_RECENT_LIMIT, INTERACTION_VERSION } from "./constants.ts";
import { defaultInteractionState, emptyDaily, localDateKey } from "./engine.ts";
import type { AnimationType, Emotion, InteractionEvent, InteractionSource, InteractionState, InteractionType } from "./types.ts";

/** localStorage 와 호환되는 최소 인터페이스(테스트에서는 메모리 구현 주입). */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** 테스트·SSR용 인메모리 구현. */
export function createMemoryStorage(seed: Record<string, string> = {}): KeyValueStorage {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
  };
}

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
  // ⚠️ Firestore 는 undefined 값을 거부한다(setDoc → invalid-argument).
  //    roomItemId 는 방 가구 상호작용에서만 존재하므로 없을 때는 **키 자체를 넣지 않는다**.
  const roomItemId = typeof r.roomItemId === "string" ? { roomItemId: r.roomItemId } : {};
  return {
    id: r.id,
    type: r.type as InteractionType,
    source: SOURCES.has(r.source as InteractionSource) ? r.source as InteractionSource : "system",
    characterId: r.characterId,
    ...roomItemId,
    at: number(r.at, Date.now()),
    emotion: EMOTIONS.has(r.emotion as Emotion) ? r.emotion as Emotion : "normal",
    animation: ANIMATIONS.has(r.animation as AnimationType) ? r.animation as AnimationType : "idle",
    speech: typeof r.speech === "string" ? r.speech.slice(0, 160) : "",
    affinityDelta: Math.max(0, Math.min(4, number(r.affinityDelta))),
    expDelta: Math.max(0, Math.min(5, number(r.expDelta))),
    metadata: r.metadata && typeof r.metadata === "object" ? r.metadata as InteractionEvent["metadata"] : {},
  };
}

/**
 * 저장된(또는 손상된) 값을 안전한 InteractionState 로 정규화.
 * version 은 항상 현재 버전으로 승격 → 이전 버전 데이터 Lazy Migration.
 */
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

  // 손상 방어: 유효 이벤트만 + id 중복 제거 + 최신순 + 상한.
  const seen = new Set<string>();
  const recent = (Array.isArray(r.recent) ? r.recent : [])
    .map(normalizeEvent)
    .filter((event): event is InteractionEvent => !!event)
    .filter((event) => (seen.has(event.id) ? false : (seen.add(event.id), true)))
    .sort((a, b) => b.at - a.at)
    .slice(0, INTERACTION_RECENT_LIMIT);

  return {
    version: INTERACTION_VERSION,
    affinity: Math.max(0, Math.min(100, Math.floor(number(r.affinity)))),
    emotion: EMOTIONS.has(r.emotion as Emotion) ? r.emotion as Emotion : "normal",
    lastInteraction: typeof r.lastInteraction === "number" && Number.isFinite(r.lastInteraction) ? r.lastInteraction : null,
    cooldowns,
    daily,
    recent,
  };
}

export function serializeInteractionState(state: InteractionState): InteractionState {
  return normalizeInteractionState(state);
}

export function cacheKey(uid: string): string { return `${INTERACTION_CACHE_PREFIX}${uid}`; }
export function queueKey(uid: string): string { return `${INTERACTION_QUEUE_PREFIX}${uid}`; }

function readState(storage: KeyValueStorage | null, key: string, at?: number): InteractionState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? normalizeInteractionState(JSON.parse(raw), at) : null;
  } catch { return null; } // 손상된 JSON 방어
}
function writeState(storage: KeyValueStorage | null, key: string, state: InteractionState): void {
  if (!storage) return;
  try { storage.setItem(key, JSON.stringify(serializeInteractionState(state))); } catch { /* 저장소 사용 불가 */ }
}

export function readCachedState(storage: KeyValueStorage | null, uid: string, at?: number): InteractionState | null {
  return readState(storage, cacheKey(uid), at);
}
export function writeCachedState(storage: KeyValueStorage | null, uid: string, state: InteractionState): void {
  writeState(storage, cacheKey(uid), state);
}
export function readQueuedState(storage: KeyValueStorage | null, uid: string, at?: number): InteractionState | null {
  return readState(storage, queueKey(uid), at);
}
export function writeQueuedState(storage: KeyValueStorage | null, uid: string, state: InteractionState): void {
  writeState(storage, queueKey(uid), state);
}
export function hasQueuedState(storage: KeyValueStorage | null, uid: string): boolean {
  if (!storage) return false;
  try { return !!storage.getItem(queueKey(uid)); } catch { return false; }
}
export function clearQueuedState(storage: KeyValueStorage | null, uid: string): void {
  if (!storage) return;
  try { storage.removeItem(queueKey(uid)); } catch { /* noop */ }
}

/**
 * Firestore 에 merge 저장할 페이로드를 만든다(순수).
 * `myWorld.interaction` 하위만 포함하므로 merge:true 와 함께 쓰면
 * myWorld.character / myWorld.diary / myWorld.room 및 계정 필드가 보존된다.
 * updatedAt 센티넬(serverTimestamp())은 호출부에서 주입한다.
 */
export function buildInteractionMergePayload(state: InteractionState, updatedAt: unknown) {
  return { myWorld: { interaction: { ...serializeInteractionState(state), updatedAt } } };
}

/**
 * 큐에 남은 상태를 전송한다. 성공하면 큐를 비우고, 실패하면 **큐를 유지**해 다음 기회에 재시도한다.
 * persist 를 주입받으므로 Firestore 없이도 성공·실패 경로를 검증할 수 있다.
 */
export async function flushQueuedState(
  storage: KeyValueStorage | null,
  uid: string,
  persist: (state: InteractionState) => Promise<unknown>,
): Promise<{ flushed: InteractionState | null; kept: boolean }> {
  const queued = readQueuedState(storage, uid);
  if (!queued) return { flushed: null, kept: false };
  try {
    await persist(queued);
    clearQueuedState(storage, uid);
    return { flushed: queued, kept: false };
  } catch {
    return { flushed: null, kept: true }; // 큐 유지 → 재시도 가능
  }
}

/**
 * 서버/로컬 충돌 규칙(순수). 로컬이 더 최신이면 로컬 보호, 아니면 서버 채택.
 * lastInteraction(ms) 기준이며 null 은 0 으로 취급.
 */
export function resolveSyncState(local: InteractionState | null, remote: InteractionState): { chosen: InteractionState; localIsNewer: boolean } {
  const localAt = local?.lastInteraction ?? 0;
  const remoteAt = remote.lastInteraction ?? 0;
  const localIsNewer = !!local && localAt > remoteAt;
  return { chosen: localIsNewer ? local! : remote, localIsNewer };
}
