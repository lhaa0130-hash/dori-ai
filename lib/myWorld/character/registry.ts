// My World — 캐릭터 레지스트리 (05-03).
//  컴포넌트에서 데이터 배열을 직접 쓰지 않고 이 함수들로만 접근한다.
//  ⚠️ 잠금(unlockLevel) 정책 제거 — 12종 모두 처음부터 선택 가능.
import type { Character } from "@/lib/myWorld/character/types";
import { characterImage, characterThumbnail } from "@/lib/myWorld/character/utils";

// 데이터 원본. image/thumbnail 은 유틸로 경로 생성(향후 /public/characters/{id}/...).
const RAW: Omit<Character, "image" | "thumbnail">[] = [
  { id: "dori",  name: "도리", englishName: "Dori",  species: "여우",   description: "가장 먼저 만나는 나의 첫 친구. 호기심 많고 다정해요.", themeColor: "#F9954E", rarity: "common",    defaultBackground: "linear-gradient(135deg,#FFE7CF 0%,#FFD1A6 35%,#F9954E 100%)", defaultExpression: "default", defaultPose: "idle", isDefault: true, emoji: "🦊" },
  { id: "bomi",  name: "보미", englishName: "Bomi",  species: "토끼",   description: "폴짝폴짝 뛰어다니는 명랑한 토끼.",                themeColor: "#F368A0", rarity: "common",    defaultBackground: "linear-gradient(135deg,#FFE1EC 0%,#FFC1D6 100%)",             defaultExpression: "happy",   defaultPose: "jump", emoji: "🐰" },
  { id: "nabi",  name: "나비", englishName: "Nabi",  species: "고양이", description: "조용하지만 마음이 따뜻한 고양이.",              themeColor: "#8B7BE8", rarity: "common",    defaultBackground: "linear-gradient(135deg,#EDE7FF 0%,#C9B8FF 100%)",             defaultExpression: "default", defaultPose: "sit",  emoji: "🐱" },
  { id: "haru",  name: "하루", englishName: "Haru",  species: "강아지", description: "매일 함께 걷는 든든한 강아지.",                  themeColor: "#4FA3E3", rarity: "common",    defaultBackground: "linear-gradient(135deg,#DDF0FF 0%,#A9D6FF 100%)",             defaultExpression: "happy",   defaultPose: "wave", emoji: "🐶" },
  { id: "pengs", name: "펭수", englishName: "Pengs", species: "펭귄",   description: "차분하고 씩씩한 펭귄 친구.",                     themeColor: "#3FBBD6", rarity: "rare",      defaultBackground: "linear-gradient(135deg,#E5F7FF 0%,#9FE0F0 100%)",             defaultExpression: "default", defaultPose: "idle", emoji: "🐧" },
  { id: "gomi",  name: "고미", englishName: "Gomi",  species: "곰",     description: "포근하고 든든한 곰돌이.",                        themeColor: "#B5895E", rarity: "rare",      defaultBackground: "linear-gradient(135deg,#F3E7D8 0%,#D6B08A 100%)",             defaultExpression: "sleepy",  defaultPose: "sit",  emoji: "🐻" },
  { id: "simba", name: "심바", englishName: "Simba", species: "사자",   description: "용감한 마음을 가진 어린 사자.",                  themeColor: "#EDA92E", rarity: "rare",      defaultBackground: "linear-gradient(135deg,#FFF0CF 0%,#F5C660 100%)",             defaultExpression: "default", defaultPose: "cheer",emoji: "🦁" },
  { id: "buhu",  name: "부후", englishName: "Buhu",  species: "부엉이", description: "밤을 지키는 지혜로운 부엉이.",                   themeColor: "#7E88A8", rarity: "rare",      defaultBackground: "linear-gradient(135deg,#E7EAF3 0%,#9AA6C4 100%)",             defaultExpression: "wink",    defaultPose: "idle", emoji: "🦉" },
  { id: "mango", name: "망고", englishName: "Mango", species: "호랑이", description: "날쌘 줄무늬의 장난꾸러기 호랑이.",               themeColor: "#F0851F", rarity: "epic",      defaultBackground: "linear-gradient(135deg,#FFE9CC 0%,#F79E3D 100%)",             defaultExpression: "surprised",defaultPose: "jump",emoji: "🐯" },
  { id: "koya",  name: "코야", englishName: "Koya",  species: "코알라", description: "느긋하고 다정한 코알라.",                        themeColor: "#7FA894", rarity: "epic",      defaultBackground: "linear-gradient(135deg,#E7EFEA 0%,#A9C4B4 100%)",             defaultExpression: "sleepy",  defaultPose: "sit",  emoji: "🐨" },
  { id: "uni",   name: "유니", englishName: "Uni",   species: "유니콘", description: "반짝이는 전설 속 유니콘.",                       themeColor: "#C88BE8", rarity: "legendary", defaultBackground: "linear-gradient(135deg,#F3E4FF 0%,#FFC7E6 60%,#B8C0FF 100%)", defaultExpression: "happy",   defaultPose: "cheer",emoji: "🦄" },
  { id: "ari",   name: "아리", englishName: "Ari",   species: "용",     description: "하늘을 나는 씩씩한 어린 용.",                    themeColor: "#3FAF9E", rarity: "legendary", defaultBackground: "linear-gradient(135deg,#DBFBEF 0%,#7FD8C0 60%,#4FA3D9 100%)", defaultExpression: "default", defaultPose: "wave", emoji: "🐉" },
];

const CHARACTERS: Character[] = RAW.map((c) => ({
  ...c,
  image: characterImage(c.id),
  thumbnail: characterThumbnail(c.id),
}));

const BY_ID: Record<string, Character> = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

export const DEFAULT_CHARACTER_ID = "dori";

/** 전체 캐릭터(순서 유지). */
export function getAllCharacters(): Character[] {
  return CHARACTERS;
}

/** id 로 조회. 없으면 기본 캐릭터(도리). */
export function getCharacter(id: string | null | undefined): Character {
  return (id && BY_ID[id]) || BY_ID[DEFAULT_CHARACTER_ID];
}

/** 기본 캐릭터(도리). */
export function getDefaultCharacter(): Character {
  return BY_ID[DEFAULT_CHARACTER_ID];
}

/** 전체 캐릭터 id 목록(마이그레이션용 owned). */
export function getAllCharacterIds(): string[] {
  return CHARACTERS.map((c) => c.id);
}
