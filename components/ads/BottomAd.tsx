"use client";

import { useEffect, useRef } from "react";

/**
 * 하단 고정 소형 가로 광고 — 전체화면 도구(예: Flat-Form)용.
 * 좌우 사이드 광고 대신 화면 맨 아래에 작게 1개만 노출.
 */
export default function BottomAd({ height = 60 }: { height?: number }) {
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const checkAndInit = () => {
      if (typeof window === "undefined") return;
      if (initialized.current) return;
      const adEl = adRef.current?.querySelector(".adsbygoogle") as HTMLElement | null;
      if ((window as any).adsbygoogle && adEl && adEl.offsetWidth > 0) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          initialized.current = true;
          return;
        } catch (e) {
          console.error("AdSense bottom ad init error:", e);
        }
      }
      setTimeout(checkAndInit, 200);
    };
    checkAndInit();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 8,
        width: "min(468px, 94vw)",
        height,
        zIndex: 10000,
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(6px)",
        border: "1px solid #F9954E",
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 10,
          fontSize: 9,
          letterSpacing: 1,
          color: "#F9954E",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        Ad
      </span>
      <div ref={adRef} style={{ width: "100%", maxWidth: 468, height }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height }}
          data-ad-client="ca-pub-1868839951780851"
          data-ad-slot="5937639143"
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
