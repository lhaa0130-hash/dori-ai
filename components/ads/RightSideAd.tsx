"use client";

import { useEffect, useRef } from "react";

/**
 * 우측 듀얼 플로팅 광고 섹션 컴포넌트
 * 좌측 사이드바와 대칭을 이루는 디자인
 * 두 개의 광고를 세로로 배치
 */
export default function RightSideAd() {
  const adTopRef = useRef<HTMLDivElement>(null);
  const adBottomRef = useRef<HTMLDivElement>(null);
  const adTopInitialized = useRef(false);
  const adBottomInitialized = useRef(false);

  useEffect(() => {
    // 애드센스 스크립트가 이미 로드되어 있는지 확인하고 각 광고를 독립적으로 초기화
    const checkAndInit = () => {
      if (typeof window === "undefined") return;

      // 상단 광고 초기화
      if (!adTopInitialized.current && (window as any).adsbygoogle && adTopRef.current) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          adTopInitialized.current = true;
        } catch (e) {
          console.error("AdSense top ad initialization error:", e);
        }
      }

      // 하단 광고 초기화
      if (!adBottomInitialized.current && (window as any).adsbygoogle && adBottomRef.current) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          adBottomInitialized.current = true;
        } catch (e) {
          console.error("AdSense bottom ad initialization error:", e);
        }
      }

      // 둘 다 초기화되지 않았으면 재시도
      if (!adTopInitialized.current || !adBottomInitialized.current) {
        setTimeout(checkAndInit, 100);
      }
    };

    // 초기화 시도
    checkAndInit();
  }, []);

  return (
    <aside
      className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col z-40"
      style={{
        width: "160px",
        maxWidth: "200px",
        gap: "1.5rem",
      }}
    >
      {/* 상단 광고 컨테이너 */}
      <div
        className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-4"
        style={{
          background: "rgba(39, 39, 42, 0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(63, 63, 70, 1)",
          borderRadius: "1rem",
          padding: "1rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* ADVERTISEMENT 라벨 */}
        <div
          className="text-[10px] text-zinc-500 tracking-widest uppercase text-center mb-3"
          style={{
            fontSize: "10px",
            color: "rgba(161, 161, 170, 1)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: "0.75rem",
            fontWeight: "500",
          }}
        >
          ADVERTISEMENT
        </div>

        {/* 상단 애드센스 광고 영역 */}
        <div ref={adTopRef} style={{ minHeight: "250px", width: "100%" }}>
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              minHeight: "250px",
            }}
            data-ad-client="ca-pub-1868839951780851"
            data-ad-slot="5937639143"
            data-ad-format="auto"
            data-full-width-responsive="false"
          />
        </div>
      </div>

      {/* 하단 광고 컨테이너 */}
      <div
        className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-4"
        style={{
          background: "rgba(39, 39, 42, 0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(63, 63, 70, 1)",
          borderRadius: "1rem",
          padding: "1rem",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* ADVERTISEMENT 라벨 */}
        <div
          className="text-[10px] text-zinc-500 tracking-widest uppercase text-center mb-3"
          style={{
            fontSize: "10px",
            color: "rgba(161, 161, 170, 1)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: "0.75rem",
            fontWeight: "500",
          }}
        >
          ADVERTISEMENT
        </div>

        {/* 하단 애드센스 광고 영역 */}
        <div ref={adBottomRef} style={{ minHeight: "250px", width: "100%" }}>
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              minHeight: "250px",
            }}
            data-ad-client="ca-pub-1868839951780851"
            data-ad-slot="8647740571"
            data-ad-format="auto"
            data-full-width-responsive="false"
          />
        </div>
      </div>
    </aside>
  );
}
