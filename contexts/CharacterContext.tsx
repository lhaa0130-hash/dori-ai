"use client";

// My World — 캐릭터 Context (05-03).
//  My World·Profile·Diary·Room·Showcase 가 같은 대표 캐릭터 상태를 공유하도록 하는 Provider.
//  현재는 My World 에서만 사용. 향후 상위 레이아웃으로 올리면 전 페이지 공유.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseAuth } from "@/lib/firebase";
import type { Character, MyCharacterState } from "@/lib/myWorld/character/types";
import {
  DEFAULT_CHARACTER_ID,
  getCharacter,
  getAllCharacters,
} from "@/lib/myWorld/character/registry";
import {
  defaultCharacterState,
  getCharacterState,
  saveSelectedCharacter,
  getCachedCharacterState,
  setCachedCharacterState,
} from "@/lib/myWorld/character/state";

interface CharacterContextValue {
  state: MyCharacterState;          // 현재 캐릭터 상태(selectedId·owned·기본값들)
  character: Character;             // 선택된 캐릭터(해석됨)
  allCharacters: Character[];       // 전체 12종
  loading: boolean;
  saving: boolean;
  selectCharacter: (id: string) => Promise<void>; // Hero 즉시 반영 + Firestore 저장
}

const Ctx = createContext<CharacterContextValue | null>(null);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<MyCharacterState>(defaultCharacterState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const uid = useCallback(() => {
    try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
  }, []);

  // 로드: 캐시(즉시) → Firestore(원본). 세션 복원 비동기 대비 session 의존.
  useEffect(() => {
    let alive = true;
    const u = uid();
    if (!u) { setState(defaultCharacterState()); setLoading(false); return; }
    const cached = getCachedCharacterState(u);
    if (cached) setState(cached);
    setLoading(true);
    getCharacterState(u)
      .then((st) => { if (!alive) return; setState(st); setCachedCharacterState(u, st); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  const selectCharacter = useCallback(async (id: string) => {
    if (savingRef.current) return;
    const ch = getCharacter(id);
    // Hero 즉시 반영: 선택 캐릭터 기준으로 상태 갱신(기본값).
    const next: MyCharacterState = {
      selectedId: ch.id,
      owned: state.owned.length ? state.owned : [DEFAULT_CHARACTER_ID],
      expression: ch.defaultExpression,
      pose: ch.defaultPose,
      skin: "default",
      costume: "default",
      background: "default",
    };
    setState(next);
    const u = uid();
    if (!u) return; // 비로그인: 로컬 표시만
    setCachedCharacterState(u, next);
    savingRef.current = true; setSaving(true);
    try { await saveSelectedCharacter(u, ch.id); }
    catch { /* 저장 실패는 조용히 — 다음 로드에서 원본으로 정정 */ }
    finally { savingRef.current = false; setSaving(false); }
  }, [state.owned, uid]);

  const value = useMemo<CharacterContextValue>(() => ({
    state,
    character: getCharacter(state.selectedId),
    allCharacters: getAllCharacters(),
    loading,
    saving,
    selectCharacter,
  }), [state, loading, saving, selectCharacter]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCharacter(): CharacterContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCharacter must be used within <CharacterProvider>");
  return c;
}
