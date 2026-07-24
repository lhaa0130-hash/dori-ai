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
import { enqueueAnimationCommand } from "@/lib/myWorld/interaction/animation";
import { evaluateDiaryTrigger } from "@/lib/myWorld/interaction/diaryTrigger";
import {
  TRANSIENT_EMOTION_MS,
  idleHungerEmotion,
  recoversTransient,
  rejectionEmotion,
  returnEmotion,
  transientSpeech,
  type TransientEmotion,
} from "@/lib/myWorld/interaction/emotion";
import {
  flushInteractionQueue,
  getCachedInteractionState,
  getQueuedInteractionState,
  hasQueuedInteractionSync,
  loadInteractionState,
  queueInteractionSync,
  resolveSyncState,
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
  /** 화면에 표시할 감정 = 일시 감정(hungry/sad/angry) 우선, 없으면 영구 감정. */
  emotion: Emotion;
  /** 로그인 여부 — 비로그인은 체험 모드(EXP 미적립). */
  signedIn: boolean;
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
  // 일시 감정(hungry/sad/angry) — 저장하지 않으며 타이머로 자동 회복.
  const [transient, setTransient] = useState<TransientEmotion | null>(null);
  const transientTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const guestNoticeShown = useRef(false);
  const sadShownForLoad = useRef(false);

  useEffect(() => { stateRef.current = state; }, [state]);

  const signedIn = !!session?.user?.email;

  const uid = useCallback(() => {
    try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
  }, []);

  const enqueueAnimation = useCallback((next: AnimationCommand) => {
    setAnimationQueue((queue) => enqueueAnimationCommand(queue, next));
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

  /** 일시 감정 표시(+안내 문구). 저장하지 않으며 시간이 지나면 자동 회복. */
  const showTransient = useCallback((emotion: TransientEmotion, withSpeech = true) => {
    if (transientTimer.current) clearTimeout(transientTimer.current);
    setTransient(emotion);
    if (withSpeech) showSpeech(transientSpeech(emotion, Math.random()));
    transientTimer.current = setTimeout(() => setTransient(null), TRANSIENT_EMOTION_MS[emotion]);
  }, [showSpeech]);

  const clearTransient = useCallback(() => {
    if (transientTimer.current) clearTimeout(transientTimer.current);
    transientTimer.current = null;
    setTransient(null);
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
        // 충돌 규칙은 순수 함수(resolveSyncState)로 분리되어 단위 테스트된다.
        const { chosen, localIsNewer } = resolveSyncState(local, remote);
        setState(chosen); stateRef.current = chosen; setCachedInteractionState(u, chosen);
        // 오랜만에 돌아온 첫 순간에만 짧게 아쉬움 표시(1회, 저장 없음).
        if (!sadShownForLoad.current) {
          sadShownForLoad.current = true;
          const back = returnEmotion(chosen.lastInteraction, Date.now());
          if (back) showTransient(back);
        }
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
    if (transientTimer.current) clearTimeout(transientTimer.current);
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
      // 연타 제한일 때만 짧게 삐침(친밀도 차감 없음, 저장 없음).
      const rejected = rejectionEmotion(result.reason);
      if (rejected) showTransient(rejected);
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

    // 긍정적 상호작용이 성공하면 일시 감정(배고픔/아쉬움/삐침)에서 즉시 회복.
    if (recoversTransient(event.type)) clearTransient();

    if (event.affinityDelta > 0) notify({ emoji: "💗", label: `친밀도 +${event.affinityDelta}`, tone: "affinity" });
    if (event.expDelta > 0) {
      const email = session?.user?.email;
      if (email) {
        // 로그인 사용자만 실제 EXP 적립 + 적립 알림.
        notify({ emoji: "✨", label: `EXP +${event.expDelta}`, tone: "exp" });
        addExp(email, event.expDelta, `My World ${event.type}`);
      } else if (!guestNoticeShown.current) {
        // 비로그인: 적립되지 않으므로 EXP 알림 대신 1회만 안내(매번 반복하지 않음).
        guestNoticeShown.current = true;
        notify({ emoji: "🔒", label: "로그인하면 친밀도와 EXP가 저장돼요", tone: "info" });
      }
    }
    if (result.reason === "daily_limit") notify({ emoji: "🌙", label: "오늘의 친밀도·EXP 보상을 모두 받았어요", tone: "info" });

    // 기록 조건은 순수 함수로 분리되어 중복 기록 방지가 단위 테스트된다.
    const milestone = affinityMilestoneCrossed(before.affinity, result.state.affinity);
    const trigger = evaluateDiaryTrigger(before, event, milestone);
    if (trigger.record) {
      // Diary 실패가 상호작용 성공을 취소하지 않도록 분리(조용히 무시).
      void addEntry(buildInteractionEntry(character, event, {
        firstMeeting: trigger.firstMeeting,
        longAbsence: trigger.longAbsence,
        milestone: trigger.milestone,
      })).catch(() => {});
    }
    return result;
  }, [addEntry, character, clearTransient, enqueueAnimation, notify, persistSoon, playCue, session?.user?.email, showSpeech, showTransient]);

  // Idle scheduler: lightweight local reactions only; it never awards or writes.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const hour = new Date().getHours();
        // 식사 시간대에는 가끔 배고픔을 표시(보상·저장 없음, 시간이 지나면 자동 회복).
        const hungry = idleHungerEmotion(hour, Math.random());
        if (hungry) {
          showTransient(hungry);
          enqueueAnimation(command("look", 0, 900));
          schedule();
          return;
        }
        const choices: AnimationType[] = hour >= 22 || hour < 6 ? ["sleep", "blink", "sit"] : ["blink", "look", "sit", "walk"];
        const next = choices[Math.floor(Math.random() * choices.length)];
        previewReaction(next, next === "sleep" ? "sleepy" : "normal", Math.random() < 0.22 ? "여기서 기다리고 있을게." : undefined);
        schedule();
      }, 8_000 + Math.floor(Math.random() * 6_000));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [previewReaction, showTransient, enqueueAnimation]);

  const value = useMemo<InteractionContextValue>(() => ({
    state,
    loading,
    syncing,
    offline,
    emotion: transient ?? state.emotion, // 일시 감정 우선(저장되지 않음)
    signedIn,
    currentAnimation: activeCommand?.type ?? "idle",
    speech,
    notices,
    perform,
    previewReaction,
    dismissNotice,
  }), [state, loading, syncing, offline, transient, signedIn, activeCommand, speech, notices, perform, previewReaction, dismissNotice]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInteraction(): InteractionContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error("useInteraction must be used within <InteractionProvider>");
  return value;
}
