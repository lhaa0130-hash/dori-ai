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

  // 배경은 "카드" 가 아니라 물체 뒤의 옅은 후광이다.
  //  이전에는 불투명한 사각 패널 + inset 하이라이트라서, 방 안에 가구가 놓인 게 아니라
  //  타일 카드가 떠 있는 데모처럼 보였다. 타원형 후광으로 바꿔 물체 자체가 읽히게 한다.
  //  (팔레트에서는 카드 형태가 오히려 알아보기 쉬우므로 withBackground 로 구분한다.)
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={
        withBackground
          ? {
              background: `radial-gradient(58% 52% at 50% 56%, ${def.themeColor}3d 0%, ${def.themeColor}14 62%, rgba(255,255,255,0) 78%)`,
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
