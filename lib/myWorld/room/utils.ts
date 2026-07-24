// My World — My Room 유틸 (05-05).
import type { PlacedRoomItem, RoomItemDefinition } from "@/lib/myWorld/room/types";

// 배치 인스턴스 고유 id. crypto 우선, 폴백. (렌더 중 호출 금지 — 사용자 액션 시에만)
export function makeInstanceId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return `ri-${crypto.randomUUID()}`;
  } catch { /* noop */ }
  return `ri-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// 배치 아이템의 캔버스 대비 크기(%) — defaultW/H × scale.
export function itemBoxPercent(def: RoomItemDefinition, scale: number): { w: number; h: number } {
  return { w: def.defaultWidth * scale, h: def.defaultHeight * scale };
}

// placedItems 배열에서 특정 인스턴스 찾기.
export function findPlaced(items: PlacedRoomItem[], instanceId: string | null): PlacedRoomItem | undefined {
  if (!instanceId) return undefined;
  return items.find((it) => it.instanceId === instanceId);
}
