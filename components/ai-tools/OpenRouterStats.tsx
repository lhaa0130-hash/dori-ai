"use client";

import { useEffect, useState } from "react";

interface Stats {
  updatedAt: string;
  total: number;
  topByContext: { name: string; ctxK: number; provider: string }[];
  newest: { name: string; date: string; ctxK: number; provider: string }[];
  cheapest: { name: string; perM: number; provider: string }[];
  byProvider: { provider: string; count: number }[];
  trend: { t: string; total: number; majorCtxMax: number }[];
}

const ORANGE = "#F9954E";

function ago(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "시간 전";
  return Math.floor(h / 24) + "일 전";
}
function ctxLabel(k: number): string {
  return k >= 1000 ? (k % 1000 === 0 ? k / 1000 + "M" : (k / 1000).toFixed(1) + "M") : k + "K";
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

  if (hide || !s || !s.topByContext?.length) return null;

  const maxCtx = Math.max(...s.topByContext.map((m) => m.ctxK), 1);
  const tr = s.trend || [];
  const tvals = tr.map((p) => p.total);
  const tmin = Math.min(...tvals), tmax = Math.max(...tvals);
  const spPts = tr
    .map((p, i) => {
      const x = tr.length > 1 ? (i / (tr.length - 1)) * 100 : 0;
      const y = tmax > tmin ? 28 - ((p.total - tmin) / (tmax - tmin)) * 26 : 14;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white">OpenRouter AI 모델 현황</h2>
        </div>
        <span className="text-[11px] text-neutral-400 whitespace-nowrap">{s.total}개 · {ago(s.updatedAt)}</span>
      </div>

      {tr.length > 1 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-neutral-500">등록 모델 수 추이</span>
            <span className="text-[11px] text-neutral-400">{tmin} → {tmax}</span>
          </div>
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8">
            <polyline points={spPts} fill="none" stroke={ORANGE} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )}

      <div className="mb-4">
        <p className="text-[11px] font-semibold text-neutral-500 mb-2">컨텍스트 길이 Top (주요 제공사)</p>
        <div className="space-y-1.5">
          {s.topByContext.slice(0, 6).map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] w-[42%] truncate text-neutral-700 dark:text-neutral-300" title={m.name}>{m.name}</span>
              <div className="flex-1 h-3 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(6, (m.ctxK / maxCtx) * 100)}%`, background: ORANGE }} />
              </div>
              <span className="text-[10px] text-neutral-400 w-11 text-right">{ctxLabel(m.ctxK)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-neutral-500 mb-2">최근 추가된 모델</p>
        <div className="flex flex-wrap gap-1.5">
          {s.newest.slice(0, 6).map((m, i) => (
            <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300">
              {m.name} <span className="text-neutral-400">· {m.date.slice(5)}</span>
            </span>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-neutral-400 mt-3">데이터: OpenRouter · 6시간마다 자동 갱신</p>
    </div>
  );
}
