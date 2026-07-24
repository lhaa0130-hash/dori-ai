"use client";

// My World — 대표 캐릭터 카드(공용, My World·Profile·Showcase 재사용). (05-03)
//  CharacterAvatar(placeholder 이미지 구조) + 테마 컬러 링 + 편집 진입.
//  characterId(string) 또는 character(객체) 둘 다 허용. 클릭 시 onEdit(선택 모달).
import type { Character } from "@/lib/myWorld/character/types";
import { getCharacter, DEFAULT_CHARACTER_ID } from "@/lib/myWorld/character/registry";
import CharacterAvatar from "@/components/my-world/CharacterAvatar";

export default function CharacterCard({
  character,
  characterId,
  size = 96,
  onEdit,
}: {
  character?: Character;
  characterId?: string;
  size?: number;
  onEdit?: () => void;
}) {
  const c = character || getCharacter(characterId ?? DEFAULT_CHARACTER_ID);
  const clickable = typeof onEdit === "function";

  const inner = (
    <div
      className="relative rounded-full bg-white p-1 shadow-lg ring-4 ring-white/70"
      style={{ boxShadow: `0 8px 24px ${c.themeColor}33` }}
    >
      <CharacterAvatar character={c} size={size} />
      {clickable && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-white shadow ring-2 ring-white"
          style={{ backgroundColor: c.themeColor }}
          aria-hidden
        >
          ✎
        </span>
      )}
    </div>
  );

  if (!clickable) return inner;
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label="대표 캐릭터 변경"
      className="rounded-full transition-transform active:scale-95"
    >
      {inner}
    </button>
  );
}
