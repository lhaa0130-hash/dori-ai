"use client";

// My World — 대표 캐릭터(현재 기본 캐릭터 placeholder).
// 향후 연결: 12종 캐릭터 선택 → characterId 로 이미지/이모지 교체.
export type CharacterId = "default";

const CHARACTERS: Record<CharacterId, { emoji: string; label: string }> = {
  default: { emoji: "🦊", label: "기본 캐릭터" },
};

export default function CharacterCard({
  characterId = "default",
  size = 96,
}: {
  characterId?: CharacterId; // 향후 12종 캐릭터 연결 지점
  size?: number;
}) {
  const c = CHARACTERS[characterId] ?? CHARACTERS.default;
  return (
    <div
      className="flex items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-white/70"
      style={{ width: size, height: size }}
      aria-label={c.label}
      role="img"
    >
      <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{c.emoji}</span>
    </div>
  );
}
