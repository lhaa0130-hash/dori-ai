"use client";

// My World — My Room Context (05-05).
//  savedRoom(서버 원본) 과 draftRoom(편집본) 을 분리. 편집은 draft 에서만, 저장 시에만 Firestore 반영.
//  캐릭터는 CharacterContext 에서 별도 레이어로. 저장 성공 시 Diary 1건 자동 기록(실패해도 저장은 유지).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCharacter } from "@/contexts/CharacterContext";
import { useDiary } from "@/contexts/DiaryContext";
import { getFirebaseAuth } from "@/lib/firebase";
import type { PlacedRoomItem, PlacedRoomItemPatch, RoomState } from "@/lib/myWorld/room/types";
import { createDefaultRoomState, getRoomItem } from "@/lib/myWorld/room/registry";
import { DUPLICATE_OFFSET, MAX_PLACED_ITEMS, ROTATION_STEP, SCALE_STEP } from "@/lib/myWorld/room/constants";
import { clampCoord, clampScale, maxZIndex, normalizeRotation, normalizeZIndices, sortedByZ } from "@/lib/myWorld/room/calculations";
import { makeInstanceId } from "@/lib/myWorld/room/utils";
import {
  getCachedRoomState, setCachedRoomState, loadRoomState, saveRoomState, serializeRoomState,
} from "@/lib/myWorld/room/state";
import { buildRoomUpdatedEntry } from "@/lib/myWorld/diary/constants";

export interface SaveResult { ok: boolean; needLogin?: boolean; error?: boolean }

interface RoomContextValue {
  savedRoom: RoomState;
  draftRoom: RoomState;
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  error: string | null;
  loggedIn: boolean;

  selectedItemId: string | null;
  selectedItem: PlacedRoomItem | null;
  itemCount: number;
  atLimit: boolean;

  selectItem: (instanceId: string | null) => void;
  addItem: (itemId: string) => void;
  updateItem: (instanceId: string, patch: PlacedRoomItemPatch) => void;
  moveItem: (instanceId: string, x: number, y: number) => void;
  nudgeItem: (instanceId: string, dx: number, dy: number) => void;
  rotateItem: (instanceId: string, dir: 1 | -1) => void;
  scaleItem: (instanceId: string, dir: 1 | -1) => void;
  flipItem: (instanceId: string) => void;
  bringForward: (instanceId: string) => void;
  sendBackward: (instanceId: string) => void;
  duplicateItem: (instanceId: string) => void;
  removeItem: (instanceId: string) => void;

  resetDraft: () => void;       // 기본 방으로(확인 모달은 UI 담당)
  discardDraft: () => void;     // draft = saved
  saveRoom: () => Promise<SaveResult>;
  reloadRoom: () => Promise<void>;
}

const Ctx = createContext<RoomContextValue | null>(null);

function cloneRoom(r: RoomState): RoomState {
  return { version: r.version, themeId: r.themeId, floorId: r.floorId, wallId: r.wallId, placedItems: r.placedItems.map((it) => ({ ...it })) };
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const { session, status } = useAuth();
  const { character } = useCharacter();
  const { addEntry } = useDiary();
  const loggedIn = status === "authenticated";

  const [savedRoom, setSavedRoom] = useState<RoomState>(createDefaultRoomState);
  const [draftRoom, setDraftRoom] = useState<RoomState>(createDefaultRoomState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const savingRef = useRef(false);

  const uid = useCallback(() => {
    try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; }
  }, []);

  // 로드: 캐시(즉시) → Firestore(원본). 비로그인은 기본 방.
  useEffect(() => {
    let alive = true;
    const u = uid();
    if (!u) {
      const def = createDefaultRoomState();
      setSavedRoom(def); setDraftRoom(cloneRoom(def)); setSelectedItemId(null); setLoading(false);
      return;
    }
    const cached = getCachedRoomState(u);
    if (cached) { setSavedRoom(cached); setDraftRoom(cloneRoom(cached)); }
    setLoading(true);
    loadRoomState(u)
      .then((room) => {
        if (!alive) return;
        setSavedRoom(room); setDraftRoom(cloneRoom(room)); setCachedRoomState(u, room);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  // ── draft 편집 헬퍼 ──
  const patchItems = useCallback((fn: (items: PlacedRoomItem[]) => PlacedRoomItem[]) => {
    setDraftRoom((prev) => ({ ...prev, placedItems: fn(prev.placedItems) }));
  }, []);

  const selectItem = useCallback((id: string | null) => setSelectedItemId(id), []);

  const addItem = useCallback((itemId: string) => {
    const def = getRoomItem(itemId);
    if (!def) return;
    const instanceId = makeInstanceId(); // 업데이터 밖에서 1회 생성(StrictMode 이중호출 안전)
    setDraftRoom((prev) => {
      if (prev.placedItems.length >= MAX_PLACED_ITEMS) return prev;
      const item: PlacedRoomItem = {
        instanceId, itemId, x: 50, y: 50, scale: 1, rotation: 0, flipped: false,
        zIndex: maxZIndex(prev.placedItems) + 1,
      };
      return { ...prev, placedItems: [...prev.placedItems, item] };
    });
    setSelectedItemId(instanceId); // 팔레트에서 atLimit 이면 버튼이 비활성 → 여기 도달 안 함
  }, []);

  const updateItem = useCallback((instanceId: string, patch: PlacedRoomItemPatch) => {
    patchItems((items) => items.map((it) => {
      if (it.instanceId !== instanceId) return it;
      const def = getRoomItem(it.itemId);
      const next = { ...it };
      if (patch.x !== undefined) next.x = clampCoord(patch.x);
      if (patch.y !== undefined) next.y = clampCoord(patch.y);
      if (patch.scale !== undefined) next.scale = clampScale(patch.scale, def);
      if (patch.rotation !== undefined) next.rotation = def?.canRotate ? normalizeRotation(patch.rotation) : 0;
      if (patch.flipped !== undefined) next.flipped = def?.canFlip ? !!patch.flipped : false;
      if (patch.zIndex !== undefined) next.zIndex = Math.max(0, Math.floor(patch.zIndex));
      return next;
    }));
  }, [patchItems]);

  const moveItem = useCallback((id: string, x: number, y: number) => updateItem(id, { x, y }), [updateItem]);
  const nudgeItem = useCallback((id: string, dx: number, dy: number) => {
    patchItems((items) => items.map((it) => it.instanceId === id ? { ...it, x: clampCoord(it.x + dx), y: clampCoord(it.y + dy) } : it));
  }, [patchItems]);

  const rotateItem = useCallback((id: string, dir: 1 | -1) => {
    patchItems((items) => items.map((it) => {
      if (it.instanceId !== id) return it;
      const def = getRoomItem(it.itemId);
      if (!def?.canRotate) return it;
      return { ...it, rotation: normalizeRotation(it.rotation + dir * ROTATION_STEP) };
    }));
  }, [patchItems]);

  const scaleItem = useCallback((id: string, dir: 1 | -1) => {
    patchItems((items) => items.map((it) => {
      if (it.instanceId !== id) return it;
      const def = getRoomItem(it.itemId);
      return { ...it, scale: clampScale(it.scale + dir * SCALE_STEP, def) };
    }));
  }, [patchItems]);

  const flipItem = useCallback((id: string) => {
    patchItems((items) => items.map((it) => {
      if (it.instanceId !== id) return it;
      const def = getRoomItem(it.itemId);
      if (!def?.canFlip) return it;
      return { ...it, flipped: !it.flipped };
    }));
  }, [patchItems]);

  // 레이어 이동: 정렬 순서에서 이웃과 zIndex 교환.
  const shiftLayer = useCallback((id: string, dir: 1 | -1) => {
    patchItems((items) => {
      const sorted = sortedByZ(items);
      const pos = sorted.findIndex((it) => it.instanceId === id);
      const swapPos = pos + dir;
      if (pos < 0 || swapPos < 0 || swapPos >= sorted.length) return items;
      const a = sorted[pos], b = sorted[swapPos];
      return items.map((it) => {
        if (it.instanceId === a.instanceId) return { ...it, zIndex: b.zIndex };
        if (it.instanceId === b.instanceId) return { ...it, zIndex: a.zIndex };
        return it;
      });
    });
  }, [patchItems]);
  const bringForward = useCallback((id: string) => shiftLayer(id, 1), [shiftLayer]);
  const sendBackward = useCallback((id: string) => shiftLayer(id, -1), [shiftLayer]);

  const duplicateItem = useCallback((id: string) => {
    const instanceId = makeInstanceId(); // 업데이터 밖에서 1회 생성(StrictMode 안전)
    setDraftRoom((prev) => {
      if (prev.placedItems.length >= MAX_PLACED_ITEMS) return prev;
      const src = prev.placedItems.find((it) => it.instanceId === id);
      if (!src) return prev;
      let nx = src.x + DUPLICATE_OFFSET, ny = src.y + DUPLICATE_OFFSET;
      if (nx > 100 || ny > 100) { nx = 50; ny = 50; } // 범위 초과 시 중앙
      const copy: PlacedRoomItem = { ...src, instanceId, x: clampCoord(nx), y: clampCoord(ny), zIndex: maxZIndex(prev.placedItems) + 1 };
      return { ...prev, placedItems: [...prev.placedItems, copy] };
    });
    setSelectedItemId(instanceId);
  }, []);

  const removeItem = useCallback((id: string) => {
    setSelectedItemId((sel) => (sel === id ? null : sel));
    patchItems((items) => normalizeZIndices(items.filter((it) => it.instanceId !== id)));
  }, [patchItems]);

  const resetDraft = useCallback(() => { setDraftRoom(createDefaultRoomState()); setSelectedItemId(null); }, []);
  const discardDraft = useCallback(() => { setDraftRoom(cloneRoom(savedRoom)); setSelectedItemId(null); }, [savedRoom]);

  const saveRoom = useCallback(async (): Promise<SaveResult> => {
    const u = uid();
    if (!u) return { ok: false, needLogin: true };
    if (savingRef.current) return { ok: false };
    savingRef.current = true; setSaving(true); setError(null);
    try {
      const saved = await saveRoomState(u, draftRoom); // normalize + merge + 캐시
      setSavedRoom(saved);
      setDraftRoom(cloneRoom(saved));
      // Diary 1건 자동 기록 — 실패해도 방 저장은 유지(조용히 무시).
      try { await addEntry(buildRoomUpdatedEntry(character)); } catch { /* diary 실패 무시 */ }
      return { ok: true };
    } catch {
      setError("방을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      return { ok: false, error: true };
    } finally {
      savingRef.current = false; setSaving(false);
    }
  }, [uid, draftRoom, addEntry, character]);

  const reloadRoom = useCallback(async () => {
    const u = uid();
    if (!u) return;
    setLoading(true);
    try {
      const room = await loadRoomState(u);
      setSavedRoom(room); setDraftRoom(cloneRoom(room)); setCachedRoomState(u, room); setSelectedItemId(null);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, [uid]);

  const dirty = useMemo(
    () => JSON.stringify(serializeRoomState(draftRoom)) !== JSON.stringify(serializeRoomState(savedRoom)),
    [draftRoom, savedRoom]
  );
  const selectedItem = useMemo(
    () => draftRoom.placedItems.find((it) => it.instanceId === selectedItemId) ?? null,
    [draftRoom.placedItems, selectedItemId]
  );

  const value = useMemo<RoomContextValue>(() => ({
    savedRoom, draftRoom, loading, saving, dirty, error, loggedIn,
    selectedItemId, selectedItem,
    itemCount: draftRoom.placedItems.length,
    atLimit: draftRoom.placedItems.length >= MAX_PLACED_ITEMS,
    selectItem, addItem, updateItem, moveItem, nudgeItem, rotateItem, scaleItem, flipItem,
    bringForward, sendBackward, duplicateItem, removeItem,
    resetDraft, discardDraft, saveRoom, reloadRoom,
  }), [
    savedRoom, draftRoom, loading, saving, dirty, error, loggedIn, selectedItemId, selectedItem,
    selectItem, addItem, updateItem, moveItem, nudgeItem, rotateItem, scaleItem, flipItem,
    bringForward, sendBackward, duplicateItem, removeItem, resetDraft, discardDraft, saveRoom, reloadRoom,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoom(): RoomContextValue {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRoom must be used within <RoomProvider>");
  return c;
}
