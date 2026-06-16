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
        left: 0,
        right: 0,
        bottom: 0,
        height,
        zIndex: 10000,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(6px)",
        borderTop: "1px solid #F9954E",
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
      <div ref={adRef} style={{ width: "100%", maxWidth: 728, height }}>
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
