// My World — 캐릭터 데이터/모델 (05-02).
// ⚠️ 향후 확장 예정(성장·의상·표정·포즈·3D). 지금은 '선택/표시'만 사용하고,
//    확장 필드는 타입에만 자리를 만들어 둔다(값은 미사용). AI 생성/성장 로직은 이번 단계에 없음.

export type CharacterRarity = "common" | "rare" | "epic" | "legendary";

export interface Character {
  id: string;
  name: string;
  description: string;
  avatar: string;             // MVP: 이모지. 향후: 이미지/스프라이트 URL 로 교체.
  species: string;
  unlockLevel: number;        // 이 레벨 이상에서 해금(도리는 1, isDefault).
  rarity: CharacterRarity;
  defaultBackground: string;  // 대표 배경 그라데이션(향후 AI 배경으로 교체 가능).
  isDefault?: boolean;
}

// 12종. id 는 안정적(저장키). 도리 = 기본 지급/기본 선택.
export const CHARACTERS: Character[] = [
  { id: "dori",  name: "도리", description: "가장 먼저 만나는 나의 첫 친구.", avatar: "🦊", species: "여우", unlockLevel: 1,  rarity: "common",    defaultBackground: "linear-gradient(135deg,#FFE7CF 0%,#FFD1A6 35%,#F9954E 100%)", isDefault: true },
  { id: "bomi",  name: "보미", description: "폴짝폴짝 호기심 많은 토끼.",       avatar: "🐰", species: "토끼", unlockLevel: 2,  rarity: "common",    defaultBackground: "linear-gradient(135deg,#FFE1EC 0%,#FFC1D6 100%)" },
  { id: "nabi",  name: "나비", description: "조용하지만 다정한 고양이.",       avatar: "🐱", species: "고양이", unlockLevel: 3,  rarity: "common",    defaultBackground: "linear-gradient(135deg,#EDE7FF 0%,#C9B8FF 100%)" },
  { id: "haru",  name: "하루", description: "매일 함께 걷는 든든한 강아지.",   avatar: "🐶", species: "강아지", unlockLevel: 5,  rarity: "common",    defaultBackground: "linear-gradient(135deg,#DDF0FF 0%,#A9D6FF 100%)" },
  { id: "pengs", name: "펭수", description: "차분하고 씩씩한 펭귄.",           avatar: "🐧", species: "펭귄", unlockLevel: 7,  rarity: "rare",      defaultBackground: "linear-gradient(135deg,#E5F7FF 0%,#9FE0F0 100%)" },
  { id: "gomi",  name: "고미", description: "포근한 곰돌이 친구.",             avatar: "🐻", species: "곰",   unlockLevel: 10, rarity: "rare",      defaultBackground: "linear-gradient(135deg,#F3E7D8 0%,#D6B08A 100%)" },
  { id: "simba", name: "심바", description: "용감한 마음의 사자.",             avatar: "🦁", species: "사자", unlockLevel: 13, rarity: "rare",      defaultBackground: "linear-gradient(135deg,#FFF0CF 0%,#F5C660 100%)" },
  { id: "buhu",  name: "부후", description: "지혜로운 밤의 부엉이.",           avatar: "🦉", species: "부엉이", unlockLevel: 16, rarity: "rare",      defaultBackground: "linear-gradient(135deg,#E7EAF3 0%,#9AA6C4 100%)" },
  { id: "mango", name: "망고", description: "날쌘 줄무늬 호랑이.",             avatar: "🐯", species: "호랑이", unlockLevel: 20, rarity: "epic",      defaultBackground: "linear-gradient(135deg,#FFE9CC 0%,#F79E3D 100%)" },
  { id: "koya",  name: "코야", description: "느긋한 코알라 친구.",             avatar: "🐨", species: "코알라", unlockLevel: 25, rarity: "epic",      defaultBackground: "linear-gradient(135deg,#E7EFEA 0%,#A9C4B4 100%)" },
  { id: "uni",   name: "유니", description: "반짝이는 전설의 유니콘.",         avatar: "🦄", species: "유니콘", unlockLevel: 30, rarity: "legendary", defaultBackground: "linear-gradient(135deg,#F3E4FF 0%,#FFC7E6 60%,#B8C0FF 100%)" },
  { id: "ari",   name: "아리", description: "하늘을 나는 어린 용.",           avatar: "🐉", species: "용",   unlockLevel: 40, rarity: "legendary", defaultBackground: "linear-gradient(135deg,#DBFBEF 0%,#7FD8C0 60%,#4FA3D9 100%)" },
];

export const DEFAULT_CHARACTER_ID = "dori";

const BY_ID: Record<string, Character> = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

/** id 로 캐릭터 조회. 알 수 없으면 기본 캐릭터(도리). */
export function getCharacter(id: string | null | undefined): Character {
  return (id && BY_ID[id]) || BY_ID[DEFAULT_CHARACTER_ID];
}

/** 해금 여부 — 기본 캐릭터이거나 사용자 레벨이 unlockLevel 이상. */
export function isCharacterUnlocked(c: Character, userLevel: number): boolean {
  return !!c.isDefault || (Number.isFinite(userLevel) && userLevel >= c.unlockLevel);
}

export const RARITY_STYLE: Record<CharacterRarity, { label: string; color: string }> = {
  common:    { label: "일반",   color: "#94a3b8" },
  rare:      { label: "레어",   color: "#60a5fa" },
  epic:      { label: "에픽",   color: "#a78bfa" },
  legendary: { label: "전설",   color: "#f59e0b" },
};
