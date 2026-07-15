"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { target: 130, suffix: "+", label: "AI 기사",  delay: 0   },
  { target: 200, suffix: "+", label: "AI 도구",  delay: 60  },
  { target: 20,  suffix: "+", label: "미니게임", delay: 120 },
];

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
            const DURATION = 900;
            const STEPS    = 42;
            let step = 0;
            const id = setInterval(() => {
              step++;
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

  return <span ref={ref} className="tabular-nums">{count}{suffix}</span>;
}

export default function StatsStrip() {
  return (
    <section className="py-12 border-b border-stone-100 dark:border-zinc-900">
      <div className="scroll-reveal grid grid-cols-3">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col items-center gap-2 ${
              i !== 0 ? "border-l border-stone-100 dark:border-zinc-900" : ""
            }`}
          >
            {/* 큰 숫자 */}
            <span className="text-[44px] font-extrabold text-stone-950 dark:text-white tracking-tight leading-none">
              <CountUp target={s.target} suffix={s.suffix} delay={s.delay} />
            </span>
            {/* 라벨 */}
            <span className="text-[12px] font-semibold text-stone-400 dark:text-stone-500">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
