// My World — My Room 타입 (05-05 MVP).
// ⚠️ 3D/AI/구매/재화/소셜 없음. 2D absolute positioning · 퍼센트 좌표.
//    Item Definition(불변 카탈로그) 과 Placed Item(배치 인스턴스) 을 분리한다.
//    Room 데이터에 캐릭터 성장 데이터는 섞지 않는다(캐릭터는 별도 레이어).

export type RoomThemeId = "basic";
export type RoomFloorId = "basic_wood";
export type RoomWallId = "basic_warm";

export type RoomItemCategory =
  | "furniture"
  | "decoration"
  | "plant"
  | "lighting"
  | "storage"
  | "character"; // 예약(캐릭터는 placedItems 에 저장하지 않음 — 확장 여지만)

// 불변 카탈로그 정의(Registry). 배치 상태와 분리.
export interface RoomItemDefinition {
  id: string;
  name: string;
  description: string;
  category: RoomItemCategory;

  // 에셋(이미지 우선 → placeholder 폴백). 실제 파일은 아직 없음.
  image: string;       // sprite 경로
  thumbnail: string;   // 목록 썸네일 경로
  placeholderEmoji: string;

  // 기본 크기 = 캔버스 대비 퍼센트(고정 4:3 캔버스라 기기 무관 동일). w=너비%, h=높이%.
  defaultWidth: number;
  defaultHeight: number;

  minScale: number;
  maxScale: number;

  canRotate: boolean;
  canFlip: boolean;

  layer: number;       // 기본 레이어 힌트(뒤→앞). 실제 z 는 zIndex 로 관리.
  isDefault: boolean;  // 기본 방에 포함되는지

  themeColor: string;  // placeholder 카드 배경 틴트
}

// 방에 배치된 인스턴스. itemId(카탈로그) 와 instanceId(배치) 분리.
export interface PlacedRoomItem {
  instanceId: string;
  itemId: string;

  x: number; // 중심 X, 방 너비의 % (0~100)
  y: number; // 중심 Y, 방 높이의 % (0~100)

  scale: number;    // 배율(item.min/maxScale 범위)
  rotation: number; // 0~359
  flipped: boolean; // 좌우 반전

  zIndex: number;   // 0..n-1 로 정규화 유지
}

export interface RoomState {
  version: number;

  themeId: RoomThemeId;
  floorId: RoomFloorId;
  wallId: RoomWallId;

  placedItems: PlacedRoomItem[];

  updatedAt?: unknown; // 컨테이너 저장 시 serverTimestamp(배열 원소엔 넣지 않음)
}

// 테마/바닥/벽 정의(배경 CSS). 단순 카탈로그.
export interface RoomThemeDefinition { id: RoomThemeId; name: string; }
export interface RoomFloorDefinition { id: RoomFloorId; name: string; background: string; }
export interface RoomWallDefinition { id: RoomWallId; name: string; background: string; }

// updateItem 부분 패치용.
export type PlacedRoomItemPatch = Partial<Omit<PlacedRoomItem, "instanceId" | "itemId">>;
