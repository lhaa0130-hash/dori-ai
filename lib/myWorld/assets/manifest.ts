// My World — 이미지 자산 manifest (단일 진실 공급원).
//
// 목적: 실제 이미지가 도착했을 때 **코드 재작업 없이** 반영하는 것.
//  · 파일 경로·표시 크기·원본 해상도·투명 필요 여부·로딩 우선순위를 한 곳에 적는다.
//  · `scripts/verify-my-world-assets.mjs` 가 이 manifest 를 읽어 실제 파일을 검증한다.
//  · readiness 플래그는 **fail-safe** 다 — 자산이 없는데 켜면 검증이 실패한다.
//
// ⚠️ 이 파일은 자산의 "계약" 만 담는다. 컴포넌트는 여전히 이미지 우선 → 이모지 폴백 구조다.
//    따라서 manifest 에 적힌 파일이 없어도 화면은 깨지지 않는다(깨진 아이콘 금지).

// ⚠️ registry 를 런타임 import 하지 않는다 — registry 는 `@/` alias 를 쓰고,
//    이 파일은 별도 로더 없는 `node --test` 와 독립 검증 스크립트에서도 읽혀야 한다.
//    대신 id 목록을 여기 명시하고, **registry 와 어긋나면 테스트가 실패**하게 한다
//    (tests/my-world-assets.test.ts 가 registry 소스를 파싱해 대조).

/** 첫 화면에 필요한가(eager) vs 스크롤 후에 필요한가(lazy). */
export type LoadPriority = "eager" | "lazy";

export interface AssetSpec {
  /** public 기준 절대 경로 */
  path: string;
  /** 화면에서 표시되는 최대 CSS 크기(px). 2x 원본 판단 근거 */
  displayMax: { w: number; h: number };
  /** 요구 원본 해상도(px) */
  source: { w: number; h: number };
  /** 투명 배경이 필요한가 */
  transparent: boolean;
  /** 로딩 우선순위 — 첫 화면 캐릭터·방은 eager, 하단 기록은 lazy */
  priority: LoadPriority;
  /** 용도 설명(자산 제작자·검증 도구가 함께 읽는다) */
  purpose: string;
  /** MVP(착수 최소 단위)인가 */
  mvp: boolean;
  /** 예상 용량 예산(KB). 초과 시 검증이 경고한다 */
  budgetKb: number;
}

/** 감정 키 — `lib/myWorld/interaction/types.ts` 의 Emotion 과 반드시 일치해야 한다. */
export const EMOTION_ASSET_KEYS = ["happy", "love", "sleepy", "hungry", "thinking", "sad"] as const;
export type EmotionAssetKey = (typeof EMOTION_ASSET_KEYS)[number];

const DEFAULT_CHARACTER_ID = "dori";

/** 캐릭터 id — `lib/myWorld/character/registry.ts` 와 일치해야 한다(테스트가 대조). */
const CHARACTER_IDS = [
  "dori", "bomi", "nabi", "haru", "pengs", "gomi",
  "simba", "buhu", "mango", "koya", "uni", "ari",
] as const;

/** 캐릭터 표시 이름 — 자산 제작자가 읽을 용도 설명에만 쓴다. */
const CHARACTER_NAMES: Record<string, string> = {
  dori: "도리", bomi: "보미", nabi: "나비", haru: "하루", pengs: "펭수", gomi: "고미",
  simba: "심바", buhu: "부후", mango: "망고", koya: "코야", uni: "유니", ari: "아리",
};

/** 가구 id + 기본 크기(%) — `lib/myWorld/room/registry.ts` 와 일치해야 한다(테스트가 대조). */
const ROOM_ITEMS = [
  { id: "bed-basic", name: "침대", w: 40, h: 30 },
  { id: "desk-basic", name: "책상", w: 28, h: 24 },
  { id: "chair-basic", name: "의자", w: 15, h: 22 },
  { id: "table-basic", name: "작은 테이블", w: 20, h: 18 },
  { id: "bookshelf-basic", name: "책장", w: 24, h: 40 },
  { id: "toybox-basic", name: "장난감 상자", w: 20, h: 18 },
  { id: "rug-basic", name: "러그", w: 46, h: 26 },
  { id: "cushion-basic", name: "쿠션", w: 16, h: 14 },
  { id: "frame-basic", name: "액자", w: 16, h: 18 },
  { id: "doll-basic", name: "인형", w: 12, h: 18 },
  { id: "plant-basic", name: "화분", w: 15, h: 26 },
  { id: "lamp-basic", name: "스탠드 조명", w: 14, h: 30 },
] as const;

/** 캐릭터 기본 4종. MVP 는 기본 캐릭터(dori)만. */
function characterSpecs(): AssetSpec[] {
  const specs: AssetSpec[] = [];
  for (const id of CHARACTER_IDS) {
    const c = { id, name: CHARACTER_NAMES[id] ?? id };
    const isDefault = c.id === DEFAULT_CHARACTER_ID;
    specs.push(
      {
        path: `/characters/${c.id}/portrait.webp`,
        displayMax: { w: 140, h: 140 },
        source: { w: 1024, h: 1024 },
        transparent: true,
        priority: "eager",
        purpose: `${c.name} 무대 위 캐릭터(주역)`,
        mvp: isDefault,
        budgetKb: 120,
      },
      {
        path: `/characters/${c.id}/avatar.webp`,
        displayMax: { w: 60, h: 60 },
        source: { w: 256, h: 256 },
        transparent: true,
        priority: "eager",
        purpose: `${c.name} 월드 바 아바타`,
        mvp: isDefault,
        budgetKb: 24,
      },
      {
        path: `/characters/${c.id}/thumbnail.webp`,
        displayMax: { w: 72, h: 72 },
        source: { w: 256, h: 256 },
        transparent: true,
        priority: "lazy",
        purpose: `${c.name} 캐릭터 선택 모달 썸네일`,
        mvp: isDefault,
        budgetKb: 24,
      },
      {
        path: `/characters/${c.id}/idle.webp`,
        displayMax: { w: 140, h: 140 },
        source: { w: 1024, h: 1024 },
        transparent: true,
        priority: "lazy",
        purpose: `${c.name} 기본 포즈(향후 애니메이션)`,
        mvp: false,
        budgetKb: 120,
      },
    );
    for (const key of EMOTION_ASSET_KEYS) {
      specs.push({
        path: `/characters/${c.id}/emotion-${key}.webp`,
        displayMax: { w: 140, h: 140 },
        source: { w: 1024, h: 1024 },
        transparent: true,
        priority: "lazy",
        purpose: `${c.name} 표정: ${key}`,
        mvp: isDefault,
        budgetKb: 120,
      });
    }
  }
  return specs;
}

/** 가구 sprite/thumbnail. 크기는 registry 의 defaultWidth/Height 와 scale 최대 1.8 을 근거로 산출. */
function roomItemSpecs(): AssetSpec[] {
  const CANVAS = { w: 532, h: 399 }; // 1440 데스크톱에서의 캔버스 실측 크기
  const MAX_SCALE = 1.8;
  const specs: AssetSpec[] = [];
  for (const item of ROOM_ITEMS) {
    const dw = Math.round((item.w / 100) * CANVAS.w * MAX_SCALE);
    const dh = Math.round((item.h / 100) * CANVAS.h * MAX_SCALE);
    // 2x 를 확보하되 1024 를 넘기지 않는다(모바일 용량 예산).
    const sw = Math.min(1024, Math.max(512, Math.ceil((dw * 2) / 128) * 128));
    const sh = Math.min(1024, Math.max(512, Math.ceil((dh * 2) / 128) * 128));
    specs.push(
      {
        path: `/rooms/items/${item.id}/sprite.webp`,
        displayMax: { w: dw, h: dh },
        source: { w: sw, h: sh },
        transparent: true,
        priority: "eager",
        purpose: `${item.name} 방 배치용 스프라이트`,
        mvp: true,
        budgetKb: 90,
      },
      {
        path: `/rooms/items/${item.id}/thumbnail.webp`,
        displayMax: { w: 48, h: 48 },
        source: { w: 256, h: 256 },
        transparent: true,
        priority: "lazy",
        purpose: `${item.name} 팔레트 썸네일`,
        mvp: true,
        budgetKb: 20,
      },
    );
  }
  return specs;
}

/** 방 배경 — 벽 66% + 바닥 34% 가 한 장에 연결돼야 좌표계와 어긋나지 않는다. */
const ROOM_BACKGROUND_SPECS: AssetSpec[] = [
  {
    path: "/rooms/backgrounds/basic/scene.webp",
    displayMax: { w: 532, h: 399 },
    source: { w: 1536, h: 1152 },
    transparent: false,
    priority: "eager",
    purpose: "벽+바닥이 연결된 기본 방 배경(4:3, 상단 66% 벽 / 하단 34% 바닥)",
    mvp: true,
    budgetKb: 180,
  },
];

/** 상태 일러스트·효과. */
const STATE_ASSET_SPECS: AssetSpec[] = [
  {
    path: "/my-world/empty-room.webp",
    displayMax: { w: 240, h: 180 },
    source: { w: 1024, h: 768 },
    transparent: true,
    priority: "lazy",
    purpose: "가구 0개인 빈 방 안내",
    mvp: true,
    budgetKb: 80,
  },
  {
    path: "/my-world/empty-diary.webp",
    displayMax: { w: 120, h: 120 },
    source: { w: 512, h: 512 },
    transparent: true,
    priority: "lazy",
    purpose: "일기 빈 상태",
    mvp: true,
    budgetKb: 50,
  },
  {
    path: "/my-world/guest-preview.webp",
    displayMax: { w: 532, h: 399 },
    source: { w: 1536, h: 1152 },
    transparent: false,
    priority: "lazy",
    purpose: "게스트용 My World 한 장 미리보기",
    mvp: false,
    budgetKb: 180,
  },
  {
    path: "/my-world/fx-affinity.webp",
    displayMax: { w: 36, h: 36 },
    source: { w: 256, h: 256 },
    transparent: true,
    priority: "lazy",
    purpose: "친밀도 상승 피드백",
    mvp: false,
    budgetKb: 14,
  },
  {
    path: "/my-world/fx-exp.webp",
    displayMax: { w: 36, h: 36 },
    source: { w: 256, h: 256 },
    transparent: true,
    priority: "lazy",
    purpose: "EXP 상승 피드백",
    mvp: false,
    budgetKb: 14,
  },
];

export interface AssetGroup {
  key: "character" | "room-item" | "room-background" | "state";
  label: string;
  /** 이 그룹을 켜는 readiness 플래그 이름(검증 도구가 소스에서 값을 읽는다) */
  readinessFlag: "CHARACTER_ASSETS_READY" | "ROOM_ASSETS_READY" | null;
  specs: AssetSpec[];
}

/** 전체 manifest. 검증 도구와 문서가 같은 값을 쓴다. */
export function getAssetManifest(): AssetGroup[] {
  return [
    { key: "character", label: "캐릭터", readinessFlag: "CHARACTER_ASSETS_READY", specs: characterSpecs() },
    { key: "room-item", label: "가구", readinessFlag: "ROOM_ASSETS_READY", specs: roomItemSpecs() },
    { key: "room-background", label: "방 배경", readinessFlag: "ROOM_ASSETS_READY", specs: ROOM_BACKGROUND_SPECS },
    { key: "state", label: "상태 일러스트·효과", readinessFlag: null, specs: STATE_ASSET_SPECS },
  ];
}

export function getAllAssetSpecs(): AssetSpec[] {
  return getAssetManifest().flatMap((g) => g.specs);
}

export function getMvpAssetSpecs(): AssetSpec[] {
  return getAllAssetSpecs().filter((s) => s.mvp);
}
