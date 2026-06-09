"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { target: 130, suffix: "+", label: "AI 기사",  delay: 0   },
  { target: 200, suffix: "+", label: "AI 도구",  delay: 55  },
  { target: 20,  suffix: "+", label: "미니게임", delay: 110 },
];

/** 0 → target 으로 ease-out 카운트업 (뷰포트 진입 시 트리거) */
function CountUp({ target, suffix, delay }: { target: number; suffix: string; delay: number }) {
  const [count, setCount] = useState(0);
  const ref   = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true;
          setTimeout(() => {
            const DURATION = 820;
            const STEPS    = 38;
            let step = 0;
            const id = setInterval(() => {
              step++;
              // cubic ease-out: 처음엔 빠르게, 끝엔 느리게
              const p = 1 - Math.pow(1 - step / STEPS, 3);
              setCount(Math.round(target * p));
              if (step >= STEPS) { setCount(target); clearInterval(id); }
            }, DURATION / STEPS);
          }, delay);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

export default function StatsStrip() {
  return (
    <div className="py-6 mb-2">
      {/* 오렌지 틴트 카드 래퍼 — 숫자에 시각적 무게감 부여 */}
      <div className="scroll-reveal rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/5 border border-[#F9954E]/15 dark:border-[#F9954E]/10 py-6">
        <div className="grid grid-cols-3">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`scroll-reveal-item scroll-delay-${i + 1} flex flex-col items-center gap-1 ${
                i !== 0 ? "border-l border-[#F9954E]/15 dark:border-[#F9954E]/10" : ""
              }`}
            >
              <span className="text-[30px] font-extrabold text-neutral-950 dark:text-white tracking-tight leading-none">
                <CountUp target={s.target} suffix={s.suffix} delay={s.delay} />
              </span>
              <span className="text-[11px] text-[#F9954E] font-semibold mt-0.5">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
