// My World — My Room Registry (05-05). 가구 카탈로그·테마·바닥·벽 + 기본 방 생성.
// ⚠️ 컴포넌트에서 직접 데이터 작성 금지 — 여기서만 정의한다.
import type {
  RoomItemDefinition, RoomItemCategory, RoomState,
  RoomThemeDefinition, RoomFloorDefinition, RoomWallDefinition,
  RoomThemeId, RoomFloorId, RoomWallId,
} from "@/lib/myWorld/room/types";
import { ROOM_VERSION } from "@/lib/myWorld/room/constants";

// 향후 실제 에셋 경로(현재는 ROOM_ASSETS_READY=false 라 미사용).
const sprite = (id: string) => `/rooms/items/${id}/sprite.webp`;
const thumb = (id: string) => `/rooms/items/${id}/thumbnail.webp`;

function def(d: Omit<RoomItemDefinition, "image" | "thumbnail">): RoomItemDefinition {
  return { ...d, image: sprite(d.id), thumbnail: thumb(d.id) };
}

// ── 기본 가구 12종 ──
const ITEMS: RoomItemDefinition[] = [
  def({ id: "bed-basic", name: "침대", description: "포근한 기본 침대", category: "furniture", placeholderEmoji: "🛏️", defaultWidth: 40, defaultHeight: 30, minScale: 0.6, maxScale: 1.6, canRotate: true, canFlip: true, layer: 1, isDefault: true, themeColor: "#F4A98C" }),
  def({ id: "desk-basic", name: "책상", description: "작은 나무 책상", category: "furniture", placeholderEmoji: "🗄️", defaultWidth: 28, defaultHeight: 24, minScale: 0.6, maxScale: 1.6, canRotate: true, canFlip: true, layer: 1, isDefault: true, themeColor: "#C9A27E" }),
  def({ id: "chair-basic", name: "의자", description: "귀여운 의자", category: "furniture", placeholderEmoji: "🪑", defaultWidth: 15, defaultHeight: 22, minScale: 0.6, maxScale: 1.8, canRotate: true, canFlip: true, layer: 1, isDefault: false, themeColor: "#B0BEC5" }),
  def({ id: "table-basic", name: "작은 테이블", description: "동그란 협탁", category: "furniture", placeholderEmoji: "☕", defaultWidth: 20, defaultHeight: 18, minScale: 0.6, maxScale: 1.6, canRotate: true, canFlip: true, layer: 1, isDefault: false, themeColor: "#D7B899" }),
  def({ id: "bookshelf-basic", name: "책장", description: "책이 가득한 책장", category: "storage", placeholderEmoji: "📚", defaultWidth: 24, defaultHeight: 40, minScale: 0.6, maxScale: 1.4, canRotate: false, canFlip: true, layer: 1, isDefault: false, themeColor: "#A1887F" }),
  def({ id: "toybox-basic", name: "장난감 상자", description: "장난감을 담는 상자", category: "storage", placeholderEmoji: "📦", defaultWidth: 20, defaultHeight: 18, minScale: 0.6, maxScale: 1.6, canRotate: true, canFlip: true, layer: 1, isDefault: false, themeColor: "#E5A663" }),
  def({ id: "rug-basic", name: "러그", description: "바닥을 덮는 러그", category: "decoration", placeholderEmoji: "🟫", defaultWidth: 46, defaultHeight: 26, minScale: 0.6, maxScale: 1.6, canRotate: true, canFlip: false, layer: 0, isDefault: true, themeColor: "#C98B7A" }),
  def({ id: "cushion-basic", name: "쿠션", description: "폭신한 쿠션", category: "decoration", placeholderEmoji: "🟦", defaultWidth: 16, defaultHeight: 14, minScale: 0.6, maxScale: 1.8, canRotate: false, canFlip: true, layer: 1, isDefault: false, themeColor: "#7FA8D9" }),
  def({ id: "frame-basic", name: "액자", description: "벽에 거는 액자", category: "decoration", placeholderEmoji: "🖼️", defaultWidth: 16, defaultHeight: 18, minScale: 0.6, maxScale: 1.6, canRotate: false, canFlip: true, layer: 3, isDefault: false, themeColor: "#C0A16B" }),
  def({ id: "doll-basic", name: "인형", description: "귀여운 곰인형", category: "decoration", placeholderEmoji: "🧸", defaultWidth: 12, defaultHeight: 18, minScale: 0.6, maxScale: 1.8, canRotate: false, canFlip: true, layer: 2, isDefault: false, themeColor: "#D9A066" }),
  def({ id: "plant-basic", name: "화분", description: "싱그러운 화분", category: "plant", placeholderEmoji: "🪴", defaultWidth: 15, defaultHeight: 26, minScale: 0.6, maxScale: 1.8, canRotate: false, canFlip: true, layer: 2, isDefault: true, themeColor: "#6FBF8B" }),
  def({ id: "lamp-basic", name: "스탠드 조명", description: "은은한 스탠드", category: "lighting", placeholderEmoji: "💡", defaultWidth: 14, defaultHeight: 30, minScale: 0.6, maxScale: 1.6, canRotate: false, canFlip: true, layer: 2, isDefault: false, themeColor: "#E8C86B" }),
];

const ITEM_MAP = new Map(ITEMS.map((i) => [i.id, i]));

export function getAllRoomItems(): RoomItemDefinition[] { return ITEMS.slice(); }
export function getRoomItem(itemId: string): RoomItemDefinition | undefined { return ITEM_MAP.get(itemId); }
export function hasRoomItem(itemId: string): boolean { return ITEM_MAP.has(itemId); }
export function getRoomItemsByCategory(category: RoomItemCategory | "all"): RoomItemDefinition[] {
  return category === "all" ? ITEMS.slice() : ITEMS.filter((i) => i.category === category);
}
export function getDefaultRoomItems(): RoomItemDefinition[] { return ITEMS.filter((i) => i.isDefault); }

// ── 테마/바닥/벽 ──
const THEMES: Record<RoomThemeId, RoomThemeDefinition> = {
  basic: { id: "basic", name: "기본 테마" },
};
const FLOORS: Record<RoomFloorId, RoomFloorDefinition> = {
  basic_wood: { id: "basic_wood", name: "나무 바닥", background: "linear-gradient(180deg,#E8D2B4 0%,#D8BE99 100%)" },
};
const WALLS: Record<RoomWallId, RoomWallDefinition> = {
  basic_warm: { id: "basic_warm", name: "따뜻한 벽", background: "linear-gradient(180deg,#FBEFE2 0%,#F6E2CE 100%)" },
};

export function getRoomTheme(id: string): RoomThemeDefinition { return THEMES[id as RoomThemeId] ?? THEMES.basic; }
export function getRoomFloor(id: string): RoomFloorDefinition { return FLOORS[id as RoomFloorId] ?? FLOORS.basic_wood; }
export function getRoomWall(id: string): RoomWallDefinition { return WALLS[id as RoomWallId] ?? WALLS.basic_warm; }
export function isValidThemeId(id: unknown): id is RoomThemeId { return typeof id === "string" && id in THEMES; }
export function isValidFloorId(id: unknown): id is RoomFloorId { return typeof id === "string" && id in FLOORS; }
export function isValidWallId(id: unknown): id is RoomWallId { return typeof id === "string" && id in WALLS; }

export const DEFAULT_THEME_ID: RoomThemeId = "basic";
export const DEFAULT_FLOOR_ID: RoomFloorId = "basic_wood";
export const DEFAULT_WALL_ID: RoomWallId = "basic_warm";

// ── 기본 방 상태(항상 새 객체 반환, 참조 공유 금지) ──
// 기본 배치: 러그(뒤) · 침대 · 책상 · 화분. 서로 겹치지 않게 배치. 고정 instanceId(SSR 안정).
export function createDefaultRoomState(): RoomState {
  return {
    version: ROOM_VERSION,
    themeId: DEFAULT_THEME_ID,
    floorId: DEFAULT_FLOOR_ID,
    wallId: DEFAULT_WALL_ID,
    placedItems: [
      { instanceId: "default-rug", itemId: "rug-basic", x: 50, y: 76, scale: 1, rotation: 0, flipped: false, zIndex: 0 },
      { instanceId: "default-bed", itemId: "bed-basic", x: 27, y: 44, scale: 1, rotation: 0, flipped: false, zIndex: 1 },
      { instanceId: "default-desk", itemId: "desk-basic", x: 74, y: 46, scale: 1, rotation: 0, flipped: false, zIndex: 2 },
      { instanceId: "default-plant", itemId: "plant-basic", x: 90, y: 70, scale: 1, rotation: 0, flipped: false, zIndex: 3 },
    ],
  };
}

// getDefaultRoomState = createDefaultRoomState 별칭(스펙 §4/§6 양쪽 명명 지원).
export function getDefaultRoomState(): RoomState { return createDefaultRoomState(); }
