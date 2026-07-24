"use client";

// My World — 캐릭터 아바타(Placeholder Image 구조). (05-03)
//  구조: 이미지 우선(<img src=character.image>) → 실패/미준비 시 테마색 원 + 이모지 placeholder.
//  ⚠️ 실제 이미지가 없는 동안(CHARACTER_ASSETS_READY=false)은 항상 placeholder 를 쓴다(404 방지).
//     /public/characters/{id}/portrait.webp 를 넣고 플래그를 true 로 바꾸면 이미지가 자동 사용됨.
import { useState } from "react";
import type { Character } from "@/lib/myWorld/character/types";
import { CHARACTER_ASSETS_READY, themeTint } from "@/lib/myWorld/character/utils";

export default function CharacterAvatar({
  character,
  size = 96,
  rounded = "full",
}: {
  character: Character;
  size?: number;
  rounded?: "full" | "xl";
}) {
  const [failed, setFailed] = useState(false);
  const radius = rounded === "full" ? "9999px" : "18px";
  const useImage = CHARACTER_ASSETS_READY && !failed && !!character.image;

  if (useImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={character.image}
        alt={character.name}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: radius }}
        className="object-cover"
      />
    );
  }

  // Placeholder — 테마색 옅은 배경 + 이모지.
  return (
    <div
      role="img"
      aria-label={character.name}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `radial-gradient(circle at 50% 38%, ${themeTint(character.themeColor, "33")} 0%, #ffffff 78%)`,
      }}
      className="flex items-center justify-center"
    >
      <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{character.emoji}</span>
    </div>
  );
}
