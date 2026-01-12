"use client";

import { useEffect, useRef } from "react";

/**
 * 우측 플로팅 광고 섹션 컴포넌트
 * 좌측 사이드바와 대칭을 이루는 디자인
 */
export default function RightSideAd() {
  const adRef = useRef<HTMLDivElement>(null);
  const adInitialized = useRef(false);

  useEffect(() => {
    // 이미 초기화되었으면 스킵
    if (adInitialized.current || typeof window === "undefined" || !adRef.current) return;

    // 애드센스 스크립트가 이미 로드되어 있는지 확인
    const checkAndInit = () => {
      if ((window as any).adsbygoogle && adRef.current) {
        try {
          // 광고 초기화
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          adInitialized.current = true;
        } catch (e) {
          console.error("AdSense initialization error:", e);
        }
      } else {
        // 스크립트가 아직 로드되지 않았으면 잠시 후 재시도
        setTimeout(checkAndInit, 100);
      }
    };

    // 초기화 시도
    checkAndInit();
  }, []);

  return (
    <aside
      className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:block z-40"
      style={{
        width: "160px",
        maxWidth: "180px",
      }}
    >
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

        {/* 애드센스 광고 영역 */}
        <div ref={adRef} style={{ minHeight: "250px", width: "100%" }}>
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              minHeight: "250px",
            }}
            data-ad-client="ca-pub-1868839951780851"
            data-ad-slot="여기에_슬롯ID를_넣어줘"
            data-ad-format="auto"
            data-full-width-responsive="false"
          />
        </div>
      </div>
    </aside>
  );
}

