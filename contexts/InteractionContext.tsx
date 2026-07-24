"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCharacter } from "@/contexts/CharacterContext";
import { useDiary } from "@/contexts/DiaryContext";
import { useInteractionAudio } from "@/contexts/InteractionAudioContext";
import { addExp } from "@/lib/cottonCandy";
import { getFirebaseAuth } from "@/lib/firebase";
import { audioCueFor } from "@/lib/myWorld/interaction/catalog";
import { affinityMilestoneCrossed, defaultInteractionState, processInteraction } from "@/lib/myWorld/interaction/engine";
import { publishInteraction } from "@/lib/myWorld/interaction/events";
import {
  flushInteractionQueue,
  getCachedInteractionState,
  getQueuedInteractionState,
  hasQueuedInteractionSync,
  loadInteractionState,
  queueInteractionSync,
  saveInteractionState,
  setCachedInteractionState,
} from "@/lib/myWorld/interaction/state";
import type {
  AnimationCommand,
  AnimationType,
  Emotion,
  InteractionIntent,
  InteractionNotice,
  InteractionResult,
  InteractionState,
} from "@/lib/myWorld/interaction/types";
import { buildInteractionEntry } from "@/lib/myWorld/diary/constants";

type PerformInput = Omit<InteractionIntent, "characterId">;

interface InteractionContextValue {
  state: InteractionState;
  loading: boolean;
  syncing: boolean;
  offline: boolean;
  currentAnimation: AnimationType;
  speech: string | null;
  notices: InteractionNotice[];
  perform: (input: PerformInput) => InteractionResult;
  previewReaction: (animation: AnimationType, emotion?: Emotion, speech?: string) => void;
  dismissNotice: (id: string) => void;
}

const Ctx = createContext<InteractionContextValue | null>(null);

function command(type: AnimationType, priority = 1, durationMs = 1_100): AnimationCommand {
  return { id: `anim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, type, durationMs, priority };
}

export function InteractionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { character } = useCharacter();
  const { addEntry } = useDiary();
  const { playCue } = useInteractionAudio();
  const [state, setState] = useState<InteractionState>(() => defaultInteractionState());
  const stateRef = useRef(state);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [speech, setSpeech] = useState<string | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notices, setNotices] = useState<InteractionNotice[]>([]);
  const [animationQueue, setAnimationQueue] = useState<AnimationCommand[]>([]);
  const [activeCommand, setActiveCommand] = useState<AnimationCommand | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => { stateRef.current = state; }, [state]);

  const uid = useCallback(() => {
    try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
  }, []);

  const enqueueAnimation = useCallback((next: AnimationCommand) => {
    setAnimationQueue((queue) => {
      const trimmed = queue.slice(-5);
      return next.priority > 1 ? [next, ...trimmed] : [...trimmed, next];
    });
  }, []);

  useEffect(() => {
    if (activeCommand || animationQueue.length === 0) return;
    const [next, ...rest] = animationQueue;
    setAnimationQueue(rest);
    setActiveCommand(next);
  }, [activeCommand, animationQueue]);

  useEffect(() => {
    if (!activeCommand) return;
    const timer = setTimeout(() => setActiveCommand(null), activeCommand.durationMs);
    return () => clearTimeout(timer);
  }, [activeCommand]);

  const showSpeech = useCallback((line: string | null) => {
    if (speechTimer.current) clearTimeout(speechTimer.current);
    setSpeech(line);
    if (line) speechTimer.current = setTimeout(() => setSpeech(null), 4_500);
  }, []);

  const dismissNotice = useCallback((id: string) => setNotices((items) => items.filter((item) => item.id !== id)), []);

  const notify = useCallback((notice: Omit<InteractionNotice, "id">) => {
    const id = `notice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
    setNotices((items) => [...items.slice(-3), { ...notice, id }]);
    setTimeout(() => dismissNotice(id), 2_400);
  }, [dismissNotice]);

  const persistSoon = useCallback((next: InteractionState) => {
    const u = uid();
    if (!u) return;
    setCachedInteractionState(u, next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueInteractionSync(u, stateRef.current);
        setOffline(true);
        return;
      }
      setSyncing(true);
      saveChain.current = saveChain.current
        .catch(() => undefined)
        .then(() => saveInteractionState(u, stateRef.current))
        .catch(() => { queueInteractionSync(u, stateRef.current); setOffline(true); })
        .finally(() => setSyncing(false));
    }, 450);
  }, [uid]);

  useEffect(() => {
    let alive = true;
    const u = uid();
    if (!u) { const fresh = defaultInteractionState(); setState(fresh); stateRef.current = fresh; setLoading(false); return; }
    const cached = getCachedInteractionState(u);
    const queued = getQueuedInteractionState(u);
    const optimistic = queued ?? cached;
    if (optimistic) { setState(optimistic); stateRef.current = optimistic; }
    setLoading(true);
    loadInteractionState(u)
      .then(async (remote) => {
        if (!alive) return;
        const local = getQueuedInteractionState(u) ?? getCachedInteractionState(u);
        const localIsNewer = !!local && (local.lastInteraction ?? 0) > (remote.lastInteraction ?? 0);
        const chosen = localIsNewer ? local! : remote;
        setState(chosen); stateRef.current = chosen; setCachedInteractionState(u, chosen);
        if (localIsNewer && typeof navigator !== "undefined" && navigator.onLine) {
          try { await saveInteractionState(u, chosen); } catch { queueInteractionSync(u, chosen); }
        }
      })
      .catch(() => setOffline(true))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [session?.user?.email, uid]);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    const flush = async () => {
      update();
      const u = uid();
      if (!u || !navigator.onLine || !hasQueuedInteractionSync(u)) return;
      setSyncing(true);
      try {
        const synced = await flushInteractionQueue(u);
        if (synced) { setState(synced); stateRef.current = synced; }
      } catch { setOffline(true); }
      finally { setSyncing(false); }
    };
    update();
    window.addEventListener("online", flush);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", flush); window.removeEventListener("offline", update); };
  }, [uid]);

  useEffect(() => () => {
    if (speechTimer.current) clearTimeout(speechTimer.current);
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const previewReaction = useCallback((animation: AnimationType, emotion: Emotion = "normal", line?: string) => {
    enqueueAnimation(command(animation, 0, animation === "sleep" ? 2_200 : 900));
    if (line) showSpeech(line);
    // Preview emotion is intentionally transient and not persisted.
    if (emotion !== "normal" && !line) showSpeech(null);
  }, [enqueueAnimation, showSpeech]);

  const perform = useCallback((input: PerformInput): InteractionResult => {
    const before = stateRef.current;
    const result = processInteraction(before, { ...input, characterId: character.id });
    if (!result.accepted || !result.event) {
      playCue("limit");
      const seconds = Math.max(1, Math.ceil((result.retryAfterMs ?? 0) / 1000));
      notify({ emoji: "⏳", label: result.reason === "spam" ? "잠깐 쉬었다가 다시 놀아요" : `${seconds}초 뒤에 다시 해주세요`, tone: "limit" });
      return result;
    }

    const event = result.event;
    stateRef.current = result.state;
    setState(result.state);
    showSpeech(event.speech);
    enqueueAnimation(command(event.animation, input.type === "gift" || input.type === "long_press" ? 2 : 1, input.type === "sleep" ? 2_200 : 1_150));
    playCue(audioCueFor(input.type));
    publishInteraction(event, result.state.affinity);
    persistSoon(result.state);

    if (event.affinityDelta > 0) notify({ emoji: "💗", label: `친밀도 +${event.affinityDelta}`, tone: "affinity" });
    if (event.expDelta > 0) {
      notify({ emoji: "✨", label: `EXP +${event.expDelta}`, tone: "exp" });
      const email = session?.user?.email;
      if (email) addExp(email, event.expDelta, `My World ${event.type}`);
    }
    if (result.reason === "daily_limit") notify({ emoji: "🌙", label: "오늘의 친밀도·EXP 보상을 모두 받았어요", tone: "info" });

    const milestone = affinityMilestoneCrossed(before.affinity, result.state.affinity);
    const longAbsence = before.lastInteraction !== null && event.at - before.lastInteraction >= 24 * 60 * 60 * 1000;
    const firstMeeting = before.lastInteraction === null;
    const newDailyWindow = before.daily.date !== result.state.daily.date;
    const firstPetToday = event.type === "pet" && (newDailyWindow || !before.daily.notableTypes.includes("pet"));
    const notableGift = event.type === "gift" && (newDailyWindow || !before.daily.notableTypes.includes("gift"));
    if (firstMeeting || longAbsence || milestone || firstPetToday || notableGift) {
      void addEntry(buildInteractionEntry(character, event, { firstMeeting, longAbsence, milestone })).catch(() => {});
    }
    return result;
  }, [addEntry, character, enqueueAnimation, notify, persistSoon, playCue, session?.user?.email, showSpeech]);

  // Idle scheduler: lightweight local reactions only; it never awards or writes.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const hour = new Date().getHours();
        const choices: AnimationType[] = hour >= 22 || hour < 6 ? ["sleep", "blink", "sit"] : ["blink", "look", "sit", "walk"];
        const next = choices[Math.floor(Math.random() * choices.length)];
        previewReaction(next, next === "sleep" ? "sleepy" : "normal", Math.random() < 0.22 ? "여기서 기다리고 있을게." : undefined);
        schedule();
      }, 8_000 + Math.floor(Math.random() * 6_000));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [previewReaction]);

  const value = useMemo<InteractionContextValue>(() => ({
    state,
    loading,
    syncing,
    offline,
    currentAnimation: activeCommand?.type ?? "idle",
    speech,
    notices,
    perform,
    previewReaction,
    dismissNotice,
  }), [state, loading, syncing, offline, activeCommand, speech, notices, perform, previewReaction, dismissNotice]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInteraction(): InteractionContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error("useInteraction must be used within <InteractionProvider>");
  return value;
}
