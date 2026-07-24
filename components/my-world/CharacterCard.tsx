"use client";

// My World — 대표 캐릭터 표시(공용 컴포넌트, My World·Profile 재사용).
//  characterId 로 캐릭터 데이터(이모지/이름)를 해석해 표시. 클릭 시 선택 모달 열기(onEdit).
//  ⚠️ 향후: avatar 를 이미지/스프라이트로 교체, 표정/포즈 오버레이 추가 가능(이번 단계 미사용).
import { getCharacter, DEFAULT_CHARACTER_ID } from "@/lib/myWorld/characters";

export default function CharacterCard({
  characterId = DEFAULT_CHARACTER_ID,
  size = 96,
  onEdit,
}: {
  characterId?: string;
  size?: number;
  onEdit?: () => void; // 있으면 클릭으로 대표 캐릭터 변경 모달 열기
}) {
  const c = getCharacter(characterId);
  const clickable = typeof onEdit === "function";

  const inner = (
    <div
      className="relative flex items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/70"
      style={{ width: size, height: size }}
      aria-label={c.name}
      role="img"
    >
      <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{c.avatar}</span>
      {clickable && (
        <span
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#F9954E] text-[13px] text-white shadow ring-2 ring-white"
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
