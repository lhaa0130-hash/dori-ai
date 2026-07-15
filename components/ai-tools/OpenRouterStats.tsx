"use client";

import { useEffect, useState } from "react";

interface Stats {
  updatedAt: string;
  total: number;
  topModels: { rank: number; name: string; provider: string; share: number }[];
  providerShare: { provider: string; pct: number }[];
  providerTop: string;
  shareTrend: { x: string; pct: number }[];
}

const ORANGE = "#F9954E";

function ago(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "시간 전";
  return Math.floor(h / 24) + "일 전";
}

export default function OpenRouterStats() {
  const [s, setS] = useState<Stats | null>(null);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    fetch("/openrouter-stats.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS)
      .catch(() => setHide(true));
  }, []);

  if (hide || !s || !s.topModels?.length) return null;

  const maxShare = Math.max(...s.topModels.map((m) => m.share), 1);
  const tr = s.shareTrend || [];
  const tvals = tr.map((p) => p.pct);
  const tmin = Math.min(...tvals), tmax = Math.max(...tvals);
  const spPts = tr.map((p, i) => {
    const x = tr.length > 1 ? (i / (tr.length - 1)) * 100 : 0;
    const y = tmax > tmin ? 28 - ((p.pct - tmin) / (tmax - tmin)) * 26 : 14;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-[15px] font-extrabold text-stone-950 dark:text-white">전 세계 AI 모델 사용량 순위</h2>
        </div>
        <span className="text-[11px] text-stone-400 whitespace-nowrap">{ago(s.updatedAt)}</span>
      </div>
      <p className="text-[11px] text-stone-400 mb-4">OpenRouter 실사용 토큰 기준 · 6시간마다 갱신</p>

      {/* 사용량 순위 막대 */}
      <div className="space-y-1.5 mb-4">
        {s.topModels.slice(0, 8).map((m) => (
          <div key={m.rank} className="flex items-center gap-2">
            <span className="text-[11px] w-4 text-stone-400 font-bold text-right">{m.rank}</span>
            <span className="text-[11px] w-[38%] truncate text-stone-700 dark:text-stone-300" title={m.name}>{m.name}</span>
            <div className="flex-1 h-3.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.max(5, (m.share / maxShare) * 100)}%`, background: ORANGE }} />
            </div>
            <span className="text-[10px] text-stone-500 w-9 text-right tabular-nums">{m.share}%</span>
          </div>
        ))}
      </div>

      {/* 제공사 점유율 */}
      {s.providerShare?.length > 0 && (
        <div className="pt-3 border-t border-stone-100 dark:border-zinc-800/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-stone-500">제공사 점유율</span>
            {tr.length > 1 && (
              <span className="text-[10px] text-stone-400">{s.providerTop} 추이</span>
            )}
          </div>
          {tr.length > 1 && (
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-6 mb-2">
              <polyline points={spPts} fill="none" stroke={ORANGE} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          )}
          <div className="flex flex-wrap gap-1.5">
            {s.providerShare.map((p) => (
              <span key={p.provider} className="text-[11px] px-2 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-stone-300">
                {p.provider} <span className="font-bold text-stone-900 dark:text-white">{p.pct}%</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
