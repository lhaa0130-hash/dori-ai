// My World — 캐릭터 유틸(에셋 경로·희귀도·정렬/검색). (05-03)
import type { Character, CharacterRarity } from "@/lib/myWorld/character/types";

// ── 에셋 경로 (/public/characters/{id}/...) ──
//  ⚠️ 실제 이미지는 아직 없음. ASSETS_READY=false 동안은 컴포넌트가 이모지 placeholder 를 쓴다.
//     실제 webp 를 넣은 뒤 ASSETS_READY=true 로 바꾸면 이미지가 자동 사용된다(코드 변경 최소).
export const CHARACTER_ASSETS_READY = false;

const BASE = "/characters";
export function characterAssetPath(id: string, kind: "thumbnail" | "portrait" | "idle" | "avatar"): string {
  return `${BASE}/${id}/${kind}.webp`;
}
export function characterImage(id: string): string { return characterAssetPath(id, "portrait"); }
export function characterThumbnail(id: string): string { return characterAssetPath(id, "thumbnail"); }

// ── 희귀도 표시 ──
export const RARITY_STYLE: Record<CharacterRarity, { label: string; color: string; order: number }> = {
  common:    { label: "일반",   color: "#94a3b8", order: 0 },
  rare:      { label: "레어",   color: "#60a5fa", order: 1 },
  epic:      { label: "에픽",   color: "#a78bfa", order: 2 },
  legendary: { label: "전설",   color: "#f59e0b", order: 3 },
};

// ── 정렬 ──
export type CharacterSort = "default" | "name" | "rarity";
export function sortCharacters(list: Character[], sort: CharacterSort): Character[] {
  const arr = [...list];
  if (sort === "name") return arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  if (sort === "rarity") return arr.sort((a, b) => RARITY_STYLE[b.rarity].order - RARITY_STYLE[a.rarity].order);
  return arr; // default = 등록 순서 유지
}

// ── 검색(이름·영문·종) ──
export function searchCharacters(list: Character[], query: string): Character[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.englishName.toLowerCase().includes(q) ||
      c.species.toLowerCase().includes(q)
  );
}

/** 테마 컬러의 옅은 배경(투명도 tint). */
export function themeTint(color: string, alpha = "1a"): string {
  return `${color}${alpha}`;
}
