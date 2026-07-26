"use client";

// My World — Diary Context (05-04).
//  자동 기록 조회/추가/삭제를 공유하는 Provider. CharacterContext 와 동일 패턴.
//  비로그인: 읽기(빈 상태)만, 쓰기(addEntry/removeEntry)는 무시.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase";
import type { DiaryEntry, DiaryEntryInput, DiaryState } from "@/lib/myWorld/diary/types";
import {
  emptyDiaryState,
  getDiaryState,
  addDiaryEntry,
  removeDiaryEntry,
} from "@/lib/myWorld/diary/state";

interface DiaryContextValue {
  state: DiaryState;
  entries: DiaryEntry[];                 // 최신순(desc)
  loading: boolean;
  saving: boolean;
  /**
   * 조회 실패 메시지(사용자 문구). "기록이 없음"과 "불러오지 못함"은 다른 상태이며
   * 이를 구별하지 못하면 권한·네트워크 오류가 빈 상태로 위장된다. Firebase 원문은 노출하지 않는다.
   */
  error: string | null;
  /** 기록 쓰기 실패(자동 기록). 조회 실패(error)와 구분한다. */
  writeError: string | null;
  clearWriteError: () => void;
  addEntry: (input: DiaryEntryInput) => Promise<void>;  // 자동 기록 추가(로그인 필요)
  removeEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<DiaryContextValue | null>(null);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<DiaryState>(emptyDiaryState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const uid = useCallback(() => {
    try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
  }, []);

  const load = useCallback(async () => {
    const u = uid();
    // 로그아웃·계정 전환 시 이전 사용자의 기록과 오류가 남지 않도록 초기화한다.
    setError(null); setWriteError(null);
    if (!u) { setState(emptyDiaryState()); setLoading(false); return; }
    setLoading(true);
    try { setState(await getDiaryState(u)); setError(null); }
    catch { setError("일기를 불러오지 못했어요. 잠시 후 다시 시도해주세요."); }
    finally { setLoading(false); }
  }, [uid]);

  // 세션 복원 비동기 대비 session 의존으로 로드.
  useEffect(() => {
    let alive = true;
    (async () => { if (alive) await load(); })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  const clearWriteError = useCallback(() => setWriteError(null), []);

  const addEntry = useCallback(async (input: DiaryEntryInput) => {
    const u = uid();
    if (!u) return;                 // 비로그인: 쓰기 무시(§13)
    if (savingRef.current) return;  // 동시 저장 방지
    savingRef.current = true; setSaving(true); setWriteError(null);
    try { setState(await addDiaryEntry(u, input)); }
    catch { setWriteError("일기를 기록하지 못했어요. 잠시 후 다시 시도해주세요."); }
    finally { savingRef.current = false; setSaving(false); }
  }, [uid]);

  const removeEntry = useCallback(async (id: string) => {
    const u = uid();
    if (!u) return;
    if (savingRef.current) return;
    savingRef.current = true; setSaving(true);
    try { setState(await removeDiaryEntry(u, id)); }
    catch { /* noop */ }
    finally { savingRef.current = false; setSaving(false); }
  }, [uid]);

  const value = useMemo<DiaryContextValue>(() => ({
    state,
    entries: state.entries,
    loading,
    saving,
    error,
    writeError,
    clearWriteError,
    addEntry,
    removeEntry,
    refresh: load,
  }), [state, loading, saving, error, writeError, clearWriteError, addEntry, removeEntry, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDiary(): DiaryContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDiary must be used within <DiaryProvider>");
  return c;
}
