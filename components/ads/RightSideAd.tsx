"use client";

import { useEffect, useRef } from "react";

// 스크롤바 숨김을 위한 CSS 스타일 추가
const hideScrollbarStyle = `
  .right-side-ad-container::-webkit-scrollbar {
    display: none;
  }
`;

/**
 * 우측 듀얼 플로팅 광고 섹션 컴포넌트
 * 좌측 사이드바와 대칭을 이루는 디자인
 * 두 개의 광고를 세로로 배치
 */
export default function RightSideAd() {
  const adTopRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const adTopInitialized = useRef(false);

  useEffect(() => {
    // 스크롤바 숨김 스타일 추가
    const styleId = "right-side-ad-scrollbar-hide";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = hideScrollbarStyle;
      document.head.appendChild(style);
    }

    // 애드센스 스크립트가 이미 로드되어 있는지 확인하고 초기화
    const checkAndInit = () => {
      if (typeof window === "undefined") return;

      // 컨테이너가 실제로 보이는지 확인 (너비가 0보다 큰지)
      const isVisible = containerRef.current && containerRef.current.offsetWidth > 0;
      if (!isVisible) {
        // 보이지 않으면 재시도 (화면 크기가 변경될 수 있음)
        setTimeout(checkAndInit, 500);
        return;
      }

      // 광고 초기화
      if (!adTopInitialized.current && (window as any).adsbygoogle && adTopRef.current) {
        const adElement = adTopRef.current.querySelector('.adsbygoogle') as HTMLElement;
        if (adElement && adElement.offsetWidth > 0) {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            adTopInitialized.current = true;
          } catch (e) {
            console.error("AdSense top ad initialization error:", e);
          }
        }
      }

      // 초기화되지 않았으면 재시도
      if (!adTopInitialized.current) {
        setTimeout(checkAndInit, 100);
      }
    };

    // 초기화 시도
    checkAndInit();
  }, []);

  return (
    <aside
      ref={containerRef}
      className="right-side-ad-container fixed right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col z-40"
      style={{
        width: "160px",
        maxWidth: "200px",
        maxHeight: "90vh",
        overflowY: "auto",
        overflowX: "hidden",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* 단일 광고 컨테이너 */}
      <div
        className="bg-white/80 dark:bg-black/50 backdrop-blur-md border border-orange-500 dark:border-orange-500 rounded-2xl p-4 shadow-xl dark:shadow-black/50 transition-colors duration-300"
      >
        {/* ADVERTISEMENT 라벨 */}
        <div
          className="text-[10px] text-orange-500 dark:text-orange-500 tracking-widest uppercase text-center mb-3 font-medium"
        >
          ADVERTISEMENT
        </div>

        {/* 애드센스 광고 영역 */}
        <div ref={adTopRef} style={{ minHeight: "600px", height: "auto", width: "100%" }}>
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              minHeight: "600px",
              height: "auto",
            }}
            data-ad-client="ca-pub-1868839951780851"
            data-ad-slot="5937639143"
            data-ad-format="auto"
            data-full-width-responsive="false"
          />
        </div>
      </div>
    </aside>
  );
}
