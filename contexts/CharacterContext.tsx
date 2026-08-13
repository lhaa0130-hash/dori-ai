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
  readOnly: boolean;                // 남의 세계를 보는 중이면 true(선택 불가)
}

const Ctx = createContext<CharacterContextValue | null>(null);

/**
 * 캐릭터 Provider.
 *
 * 기본(인자 없음)은 **로그인한 본인**의 캐릭터를 읽는다 — My World 편집기가 쓰는 방식이다.
 *
 * ⚠️ 2026-08-13 추가 — `viewUid` 를 주면 **그 사람의** 캐릭터를 읽는다(읽기 전용).
 *   /@핸들 공개 홈에서 남의 방을 그리려면 RoomCanvas 안의 캐릭터 레이어도 그 사람 것이어야 하는데,
 *   RoomCanvas 는 room 을 prop 으로 받으면서 캐릭터만 이 Context 에서 꺼내 쓴다.
 *   그래서 캔버스를 고치는 대신 Provider 가 다른 uid 를 읽을 수 있게 했다(캔버스는 그대로 재사용).
 *   viewUid 가 있으면 selectCharacter 는 아무것도 하지 않는다 — 남의 캐릭터를 바꿀 수는 없다.
 */
export function CharacterProvider({ children, viewUid }: { children: ReactNode; viewUid?: string }) {
  const { session } = useAuth();
  const [state, setState] = useState<MyCharacterState>(defaultCharacterState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const readOnly = !!viewUid;

  const uid = useCallback(() => {
    if (viewUid) return viewUid;
    try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
  }, [viewUid]);

  // 로드: 캐시(즉시) → Firestore(원본). 세션 복원 비동기 대비 session 의존.
  // ⚠️ 남의 캐릭터(viewUid)는 로컬 캐시에 쓰지 않는다 — 본인 캐시를 덮어써 버린다.
  useEffect(() => {
    let alive = true;
    const u = uid();
    if (!u) { setState(defaultCharacterState()); setLoading(false); return; }
    if (!readOnly) {
      const cached = getCachedCharacterState(u);
      if (cached) setState(cached);
    }
    setLoading(true);
    getCharacterState(u)
      .then((st) => { if (!alive) return; setState(st); if (!readOnly) setCachedCharacterState(u, st); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, viewUid]);

  const selectCharacter = useCallback(async (id: string) => {
    if (readOnly) return;            // 남의 세계를 보는 중 — 캐릭터를 바꿀 수 없다
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
  }, [state.owned, uid, readOnly]);

  const value = useMemo<CharacterContextValue>(() => ({
    state,
    character: getCharacter(state.selectedId),
    allCharacters: getAllCharacters(),
    loading,
    saving,
    selectCharacter,
    readOnly,
  }), [state, loading, saving, selectCharacter, readOnly]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCharacter(): CharacterContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCharacter must be used within <CharacterProvider>");
  return c;
}
