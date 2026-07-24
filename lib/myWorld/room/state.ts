// My World — My Room 상태 저장/조회 + 정규화 + Lazy Migration + 캐시 (05-05).
// ⚠️ users/{uid}.myWorld.room 하위만 merge 저장. character/diary/기존 users 필드 보존.
//    비-PII 라 기존 users write 규칙 통과(Rules 무변경). 배열 원소엔 serverTimestamp 미사용.
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import type { PlacedRoomItem, RoomState } from "@/lib/myWorld/room/types";
import {
  createDefaultRoomState, getRoomItem, hasRoomItem,
  isValidFloorId, isValidThemeId, isValidWallId,
  DEFAULT_FLOOR_ID, DEFAULT_THEME_ID, DEFAULT_WALL_ID,
} from "@/lib/myWorld/room/registry";
import { MAX_PLACED_ITEMS, ROOM_VERSION, roomCacheKey } from "@/lib/myWorld/room/constants";
import { clampCoord, clampScale, normalizeRotation, normalizeZIndices } from "@/lib/myWorld/room/calculations";
import { makeInstanceId } from "@/lib/myWorld/room/utils";

// ── 배치 아이템 1개 정규화. 유효하지 않으면 null(제외). ──
function normalizePlaced(raw: unknown, seen: Set<string>): PlacedRoomItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const itemId = typeof r.itemId === "string" ? r.itemId : null;
  if (!itemId || !hasRoomItem(itemId)) return null; // Registry 없는 itemId 제외

  // instanceId 없으면 생성, 중복이면 새로 발급.
  let instanceId = typeof r.instanceId === "string" && r.instanceId ? r.instanceId : makeInstanceId();
  if (seen.has(instanceId)) instanceId = makeInstanceId();
  seen.add(instanceId);

  const def = getRoomItem(itemId)!;
  return {
    instanceId,
    itemId,
    x: clampCoord(typeof r.x === "number" ? r.x : 50),
    y: clampCoord(typeof r.y === "number" ? r.y : 50),
    scale: clampScale(typeof r.scale === "number" ? r.scale : 1, def),
    rotation: def.canRotate ? normalizeRotation(typeof r.rotation === "number" ? r.rotation : 0) : 0,
    flipped: def.canFlip ? r.flipped === true : false,
    zIndex: Number.isFinite(r.zIndex as number) && (r.zIndex as number) >= 0 ? Math.floor(r.zIndex as number) : 0,
  };
}

/**
 * 원시 저장값 → 안전한 RoomState. 잘못된 값은 오류 대신 정규화/제외.
 *  version/theme/floor/wall 검증, placedItems 배열·instanceId·itemId·좌표·배율·회전·zIndex·중복·최대개수.
 *  Lazy Migration: room 없음/깨짐 → 기본 방.
 */
export function normalizeRoomState(raw: unknown): RoomState {
  if (!raw || typeof raw !== "object") return createDefaultRoomState();
  const r = raw as Record<string, unknown>;

  const themeId = isValidThemeId(r.themeId) ? r.themeId : DEFAULT_THEME_ID;
  const floorId = isValidFloorId(r.floorId) ? r.floorId : DEFAULT_FLOOR_ID;
  const wallId = isValidWallId(r.wallId) ? r.wallId : DEFAULT_WALL_ID;

  const rawItems = Array.isArray(r.placedItems) ? r.placedItems : [];
  const seen = new Set<string>();
  const placed: PlacedRoomItem[] = [];
  for (const it of rawItems) {
    if (placed.length >= MAX_PLACED_ITEMS) break; // 최대 개수 제한
    const n = normalizePlaced(it, seen);
    if (n) placed.push(n);
  }

  return {
    version: ROOM_VERSION,
    themeId,
    floorId,
    wallId,
    placedItems: normalizeZIndices(placed), // zIndex 0..n-1 재부여
  };
}

// 저장/캐시 직렬화 — updatedAt·비직렬화 값 제거하고 순수 데이터만.
export function serializeRoomState(room: RoomState): Omit<RoomState, "updatedAt"> {
  const n = normalizeRoomState(room);
  return { version: n.version, themeId: n.themeId, floorId: n.floorId, wallId: n.wallId, placedItems: n.placedItems };
}
export function deserializeRoomState(raw: unknown): RoomState { return normalizeRoomState(raw); }

// ── localStorage 캐시(표시 속도용, 원본=Firestore) ──
export function getCachedRoomState(uid: string | null | undefined): RoomState | null {
  if (!uid || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(roomCacheKey(uid));
    return raw ? normalizeRoomState(JSON.parse(raw)) : null;
  } catch { return null; }
}
export function setCachedRoomState(uid: string, room: RoomState): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(roomCacheKey(uid), JSON.stringify(serializeRoomState(room))); } catch { /* noop */ }
}
export function clearCachedRoomState(uid: string): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(roomCacheKey(uid)); } catch { /* noop */ }
}

// ── Firestore ──
/** users/{uid}.myWorld.room 읽기 + 정규화(Lazy Migration). */
export async function loadRoomState(uid: string): Promise<RoomState> {
  if (!uid) return createDefaultRoomState();
  try {
    const snap = await getDoc(doc(getFirebaseFirestore(), "users", uid));
    const room = snap.exists() ? (snap.data() as any)?.myWorld?.room : null;
    return normalizeRoomState(room ?? null);
  } catch { return createDefaultRoomState(); }
}

/** myWorld.room 만 merge 저장(character/diary/기존 필드 보존). 컨테이너 updatedAt=serverTimestamp. */
export async function saveRoomState(uid: string, room: RoomState): Promise<RoomState> {
  if (!uid) throw new Error("no uid");
  const clean = serializeRoomState(room);
  await setDoc(
    doc(getFirebaseFirestore(), "users", uid),
    { myWorld: { room: { ...clean, updatedAt: serverTimestamp() } } },
    { merge: true }
  );
  const saved: RoomState = { ...clean };
  setCachedRoomState(uid, saved);
  return saved;
}

/** 기본 방으로 초기화 후 저장. */
export async function resetRoomState(uid: string): Promise<RoomState> {
  return saveRoomState(uid, createDefaultRoomState());
}
