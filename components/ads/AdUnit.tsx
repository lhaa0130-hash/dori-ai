"use client";

import { useEffect, useRef } from "react";

/**
 * 본문 인라인 반응형 애드센스 광고 (모바일·태블릿·PC 전부 노출).
 * 사이드 광고(LeftSideAd/RightSideAd)는 xl 데스크톱 전용이라, 모바일 수익화를 위해 본문에 배치.
 */
export default function AdUnit({
  slot = "5937639143",
  className = "",
}: { slot?: string; className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    const t = setTimeout(() => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushed.current = true;
      } catch { /* 스크립트 아직 로드 전 — 무시 */ }
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`my-8 text-center overflow-hidden ${className}`}>
      <p className="text-[10px] text-stone-300 dark:text-zinc-600 uppercase tracking-widest mb-1">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-1868839951780851"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
