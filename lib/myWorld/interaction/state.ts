// My World — Interaction persistence (05-06 / 05-06B).
// Firestore is authoritative for signed-in users; cache enables instant/offline UX.
// 정규화·캐시·오프라인 큐·충돌 규칙은 storage.ts(브라우저 비의존)로 분리되어 단위 테스트된다.
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { defaultInteractionState } from "@/lib/myWorld/interaction/engine";
import {
  buildInteractionMergePayload,
  clearQueuedState,
  flushQueuedState,
  hasQueuedState,
  normalizeInteractionState,
  readCachedState,
  readQueuedState,
  serializeInteractionState,
  writeCachedState,
  writeQueuedState,
  type KeyValueStorage,
} from "@/lib/myWorld/interaction/storage";
import type { InteractionState } from "@/lib/myWorld/interaction/types";

export { normalizeInteractionState, serializeInteractionState, resolveSyncState } from "@/lib/myWorld/interaction/storage";

/** 브라우저 localStorage(SSR·차단 환경이면 null). */
function browserStorage(): KeyValueStorage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

export function getCachedInteractionState(uid: string | null | undefined): InteractionState | null {
  if (!uid) return null;
  return readCachedState(browserStorage(), uid);
}

export function setCachedInteractionState(uid: string, state: InteractionState): void {
  writeCachedState(browserStorage(), uid, state);
}

export function queueInteractionSync(uid: string, state: InteractionState): void {
  writeQueuedState(browserStorage(), uid, state);
}

export function hasQueuedInteractionSync(uid: string): boolean {
  return hasQueuedState(browserStorage(), uid);
}

export function getQueuedInteractionState(uid: string): InteractionState | null {
  return readQueuedState(browserStorage(), uid);
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
    buildInteractionMergePayload(clean, serverTimestamp()),
    { merge: true },
  );
  setCachedInteractionState(uid, clean);
  clearQueuedState(browserStorage(), uid);
  return clean;
}

/** 온라인 복귀 시 호출. 성공하면 큐를 비우고, 실패하면 큐를 유지해 다음 기회에 재시도한다. */
/**
 * 온라인 복귀 시 호출. 전송 중 새 interaction 이 큐에 쌓이면(superseded) 최신까지 이어서 전송한다.
 * saveInteractionState 는 같은 상태 merge 라 재전송해도 서버 중복이 없다(idempotent).
 */
export async function flushInteractionQueue(uid: string): Promise<InteractionState | null> {
  let last: InteractionState | null = null;
  for (let i = 0; i < 5; i += 1) {
    const { flushed, superseded } = await flushQueuedState(browserStorage(), uid, (queued) => saveInteractionState(uid, queued));
    if (flushed) last = flushed;
    if (!superseded) break; // 큐가 비었거나 최신 상태까지 전송 완료
  }
  return last;
}
