// My World — My Room 상수 (05-05).
import type { RoomItemCategory } from "@/lib/myWorld/room/types";

export const ROOM_VERSION = 1;

// 배치 한도/좌표/배율/회전 규칙.
export const MAX_PLACED_ITEMS = 30;
export const COORD_MIN = 0;
export const COORD_MAX = 100;
export const ROTATION_STEP = 45;     // 회전 단위(도)
export const SCALE_STEP = 0.1;       // 크기 조절 단위
export const SCALE_FALLBACK_MIN = 0.5;
export const SCALE_FALLBACK_MAX = 2;
export const NUDGE_STEP = 1;         // 방향키 이동(%)
export const NUDGE_STEP_LARGE = 5;   // Shift+방향키(%)

// 복제 시 오프셋(%).
export const DUPLICATE_OFFSET = 4;

// 캔버스 논리 비율(4:3). CSS aspect-ratio 로 사용.
export const ROOM_ASPECT = "4 / 3";
// 바닥 밴드 높이(캔버스 높이 대비 %).
export const FLOOR_BAND_PERCENT = 34;

// 에셋 준비 플래그 — false 인 동안은 항상 placeholder(404 방지).
export const ROOM_ASSETS_READY = false;

// localStorage 캐시 키(표시 속도용, 원본은 Firestore).
export const roomCacheKey = (uid: string) => `illo.room.${uid}`;

// 팔레트 카테고리(전체 + 6종). "character" 는 팔레트에 노출하지 않음.
export const ROOM_CATEGORIES: { key: RoomItemCategory | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "furniture", label: "가구" },
  { key: "decoration", label: "장식" },
  { key: "plant", label: "식물" },
  { key: "lighting", label: "조명" },
  { key: "storage", label: "수납" },
];

export const CATEGORY_LABEL: Record<RoomItemCategory, string> = {
  furniture: "가구",
  decoration: "장식",
  plant: "식물",
  lighting: "조명",
  storage: "수납",
  character: "캐릭터",
};
