"use client";

// My World — Room 아이템 스프라이트(에셋 우선 → placeholder 폴백). (05-05)
//  ROOM_ASSETS_READY=false 인 동안은 항상 placeholder(테마 틴트 카드 + SVG 이모지).
//  SVG 이모지는 컨테이너에 맞춰 무단계 스케일 → 캔버스/팔레트 어디서든 선명.
import { useState } from "react";
import type { RoomItemDefinition } from "@/lib/myWorld/room/types";
import { ROOM_ASSETS_READY } from "@/lib/myWorld/room/constants";

export default function RoomItemSprite({
  def,
  withBackground = true,
}: {
  def: RoomItemDefinition;
  withBackground?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const useImage = ROOM_ASSETS_READY && !failed && !!def.image;

  if (useImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={def.image}
        alt={def.name}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
        draggable={false}
      />
    );
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-center rounded-2xl"
      style={
        withBackground
          ? {
              background: `linear-gradient(160deg, ${def.themeColor}59 0%, ${def.themeColor}26 100%)`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 8px rgba(0,0,0,0.08)",
            }
          : undefined
      }
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden focusable="false" preserveAspectRatio="xMidYMid meet">
        <text x="50" y="52" textAnchor="middle" dominantBaseline="central" fontSize="56">
          {def.placeholderEmoji}
        </text>
      </svg>
    </div>
  );
}
