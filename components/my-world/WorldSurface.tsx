"use client";

// My World — 하나의 세계를 담는 표면.
//
// 왜 필요한가: Phase 2 까지는 패널들이 페이지 배경 위에 **독립된 카드**로 흩어져 있어
// 2열이 만들어져도 "하나의 세계" 가 아니라 위젯 모음처럼 읽혔다.
// 이 컴포넌트는 모든 구획을 감싸는 따뜻한 공통 바닥을 깔아, 안쪽 패널들이
// 같은 공간에 놓인 것처럼 보이게 한다.
//
// 구현: 좌우로 살짝 흘러나오게(-mx) 깔고 안쪽에서 다시 padding 을 준다.
// 배경은 사이트 공용 warm paper 위에 크림·블러시 워시 두 겹 + 상단 은은한 빛.
import type { ReactNode } from "react";

export default function WorldSurface({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-1 rounded-[28px] px-1 py-1 sm:-mx-2 sm:px-2 sm:py-2">
      {/* 세계의 바닥 — 여기서만 배경을 정의한다. 안쪽 패널은 이 위에 놓인다. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px] border border-[#F0DCCB] dark:border-zinc-800/80"
        style={{
          background:
            "radial-gradient(120% 70% at 12% 0%, #FFF3E6 0%, rgba(255,243,230,0) 58%)," +
            "radial-gradient(110% 65% at 92% 8%, #FDE9E0 0%, rgba(253,233,224,0) 62%)," +
            "linear-gradient(180deg, #FFFBF6 0%, #FBF3EA 100%)",
        }}
      />
      {/* 상단 빛 — 세계에 광원이 하나 있다는 신호(방 장면의 광원 방향과 같은 좌상단) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[28px]"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 100%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
