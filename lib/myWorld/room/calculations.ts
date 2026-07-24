// My World — My Room 순수 계산 함수 (05-05). 좌표/배율/회전/레이어 정규화.
import type { PlacedRoomItem, RoomItemDefinition } from "@/lib/myWorld/room/types";
import { COORD_MAX, COORD_MIN, ROTATION_STEP, SCALE_FALLBACK_MAX, SCALE_FALLBACK_MIN } from "@/lib/myWorld/room/constants";

export function clampCoord(v: number): number {
  if (!Number.isFinite(v)) return 50;
  return Math.min(COORD_MAX, Math.max(COORD_MIN, v));
}

export function clampScale(scale: number, item?: RoomItemDefinition): number {
  const min = item?.minScale ?? SCALE_FALLBACK_MIN;
  const max = item?.maxScale ?? SCALE_FALLBACK_MAX;
  if (!Number.isFinite(scale)) return 1;
  return Math.min(max, Math.max(min, scale));
}

// 0~359 로 정규화. NaN/Infinity → 0.
export function normalizeRotation(r: number): number {
  if (!Number.isFinite(r)) return 0;
  return ((Math.round(r) % 360) + 360) % 360;
}

// 회전 스텝 단위로 스냅(선택). 저장/버튼 회전용.
export function snapRotation(r: number): number {
  return normalizeRotation(Math.round(normalizeRotation(r) / ROTATION_STEP) * ROTATION_STEP);
}

// zIndex 를 렌더 순서(오름차순, tie-break=배열 index)로 0..n-1 재부여. 순수(새 배열 반환).
export function normalizeZIndices(items: PlacedRoomItem[]): PlacedRoomItem[] {
  return items
    .map((it, index) => ({ it, index }))
    .sort((a, b) => (a.it.zIndex - b.it.zIndex) || (a.index - b.index))
    .map(({ it }, i) => ({ ...it, zIndex: i }));
}

// 렌더 순서(오름차순). 원본 불변.
export function sortedByZ(items: PlacedRoomItem[]): PlacedRoomItem[] {
  return items
    .map((it, index) => ({ it, index }))
    .sort((a, b) => (a.it.zIndex - b.it.zIndex) || (a.index - b.index))
    .map(({ it }) => it);
}

export function maxZIndex(items: PlacedRoomItem[]): number {
  return items.reduce((m, it) => Math.max(m, Number.isFinite(it.zIndex) ? it.zIndex : 0), -1);
}

// 캔버스 rect 기준 클라이언트 좌표 → 중심 퍼센트(클램프).
export function clientToPercent(
  clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  const x = rect.width ? ((clientX - rect.left) / rect.width) * 100 : 50;
  const y = rect.height ? ((clientY - rect.top) / rect.height) * 100 : 50;
  return { x: clampCoord(x), y: clampCoord(y) };
}

// CSS transform(중심 기준: 회전 + 좌우반전). 크기는 width/height 로 처리하므로 여기서 scale(크기) 미포함.
export function itemTransform(rotation: number, flipped: boolean): string {
  return `translate(-50%, -50%) rotate(${normalizeRotation(rotation)}deg) scaleX(${flipped ? -1 : 1})`;
}
