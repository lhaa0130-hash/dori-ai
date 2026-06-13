"use client";

// 코지홈 배너 효과 오버레이 (상점 bannerEffect)
// 떨어지거나(꽃잎/눈/단풍/꽃가루/하트/별) 떠오르거나(비눗방울) 반짝이는(반짝이) 이모지 입자.
// 결정적 분포 배열을 써서 SSR/CSR 하이드레이션 불일치를 피한다.

import { bannerFxOf } from "@/lib/shopItems";

type Particle = { left: number; top: number; delay: number; dur: number; size: number };

const PARTS: Particle[] = [
  { left: 6, top: 12, delay: 0.0, dur: 7.5, size: 16 },
  { left: 16, top: 62, delay: 1.4, dur: 9.0, size: 22 },
  { left: 27, top: 30, delay: 0.7, dur: 6.5, size: 14 },
  { left: 38, top: 78, delay: 2.2, dur: 8.5, size: 20 },
  { left: 48, top: 18, delay: 0.3, dur: 7.0, size: 18 },
  { left: 58, top: 54, delay: 1.9, dur: 9.5, size: 24 },
  { left: 68, top: 38, delay: 1.0, dur: 6.8, size: 15 },
  { left: 78, top: 70, delay: 2.6, dur: 8.2, size: 21 },
  { left: 88, top: 24, delay: 0.5, dur: 7.7, size: 17 },
  { left: 95, top: 58, delay: 1.6, dur: 9.2, size: 19 },
  { left: 12, top: 46, delay: 3.0, dur: 8.0, size: 13 },
  { left: 33, top: 8, delay: 3.6, dur: 7.3, size: 23 },
  { left: 63, top: 84, delay: 3.2, dur: 8.8, size: 16 },
  { left: 83, top: 42, delay: 2.9, dur: 6.6, size: 20 },
];

const FX: Record<string, { emojis: string[]; anim: "fall" | "rise" | "twinkle" }> = {
  petals: { emojis: ["🌸", "🌺", "🌸"], anim: "fall" },
  snow: { emojis: ["❄️", "❅", "❆"], anim: "fall" },
  leaves: { emojis: ["🍂", "🍁", "🍂"], anim: "fall" },
  confetti: { emojis: ["🎉", "🎊", "💛", "💙", "💖"], anim: "fall" },
  hearts: { emojis: ["💛", "🧡", "💖", "💕"], anim: "fall" },
  stars: { emojis: ["⭐", "🌟", "💫", "✨"], anim: "fall" },
  bubble: { emojis: ["🫧", "🫧", "💧"], anim: "rise" },
  sparkle: { emojis: ["✨", "⭐", "✦", "💫"], anim: "twinkle" },
};

export default function BannerFx({ id, fx, count = 12 }: { id?: string; fx?: string; count?: number }) {
  const k = fx || (id ? bannerFxOf(id) : "none");
  const conf = FX[k];
  if (!conf) return null;
  const animClass = conf.anim === "fall" ? "cozy-fall" : conf.anim === "rise" ? "cozy-rise" : "cozy-twinkle";
  const parts = PARTS.slice(0, count);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {parts.map((p, i) => {
        const pos: React.CSSProperties =
          conf.anim === "fall"
            ? { left: `${p.left}%`, top: "-8%" }
            : conf.anim === "rise"
            ? { left: `${p.left}%`, bottom: "-8%" }
            : { left: `${p.left}%`, top: `${p.top}%` };
        return (
          <span
            key={i}
            className={`absolute ${animClass}`}
            style={{
              ...pos,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              lineHeight: 1,
            }}
          >
            {conf.emojis[i % conf.emojis.length]}
          </span>
        );
      })}
    </div>
  );
}
