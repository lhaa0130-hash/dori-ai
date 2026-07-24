"use client";

// My World — AI 배경(현재 기본 그라데이션 placeholder).
// 향후 연결: AI 생성 배경 이미지 URL 을 backgroundUrl prop 으로 받아 <img> 로 교체.
import { ReactNode } from "react";

export default function BackgroundHero({
  children,
  backgroundUrl,
}: {
  children?: ReactNode;
  backgroundUrl?: string; // 향후 AI 생성 배경 연결 지점
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* 배경 레이어 — 기본 그라데이션(향후 AI 배경으로 교체) */}
      {backgroundUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backgroundUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #FFE7CF 0%, #FFD1A6 35%, #F9954E 100%)",
          }}
        />
      )}
      {/* 부드러운 장식(과한 애니메이션 없음) */}
      <div className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-white/25 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 -left-10 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
      {/* 하단 가독성 그라데이션 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/25 to-transparent" />

      <div className="relative">{children}</div>
    </div>
  );
}
