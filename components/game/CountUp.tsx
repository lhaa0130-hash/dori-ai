"use client";

// 숫자 카운트업 애니메이션 — 점수/통계가 변할 때 부드럽게 올라감(고급스러운 손맛)
// 사용: <CountUp value={score} className="tabular-nums" />
import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  className?: string;
  duration?: number;             // ms
  format?: (n: number) => string; // 기본: toLocaleString
}

export default function CountUp({ value, className, duration = 600, format }: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) { setDisplay(to); return; }

    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  const out = format ? format(display) : display.toLocaleString();
  return <span className={className}>{out}</span>;
}
