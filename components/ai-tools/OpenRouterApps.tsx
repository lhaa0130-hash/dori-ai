"use client";

import { useEffect, useState } from "react";

interface App { rank: number; title: string; desc: string; tokensB: number; url: string; favicon: string; }
interface Stats { updatedAt: string; appsTop: App[]; }

const ORANGE = "#F9954E";

function ago(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "시간 전";
  return Math.floor(h / 24) + "일 전";
}
function tokens(b: number): string {
  return b >= 1000 ? (b / 1000).toFixed(1) + "T" : b + "B";
}
function letterAvatar(name: string) {
  const ch = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="#F9954E"/><text x="32" y="44" font-size="34" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">${ch}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export default function OpenRouterApps() {
  const [s, setS] = useState<Stats | null>(null);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    fetch("/openrouter-stats.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS)
      .catch(() => setHide(true));
  }, []);

  if (hide || !s || !s.appsTop?.length) return null;

  return (
    <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 sm:px-5 pt-4 pb-3 bg-gradient-to-b from-[#F9954E]/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-[16px] font-extrabold text-stone-950 dark:text-white">AI 앱·에이전트 순위</h2>
            <span className="text-[10px] font-bold text-[#F9954E] border border-[#F9954E]/40 rounded-full px-1.5 py-0.5">LIVE</span>
          </div>
          <span className="text-[11px] text-stone-400 whitespace-nowrap">{ago(s.updatedAt)}</span>
        </div>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">전 세계에서 가장 많이 쓰는 AI 앱·에이전트 (토큰 사용량)</p>
      </div>

      <div className="px-4 sm:px-5 py-3 space-y-1">
        {s.appsTop.slice(0, 10).map((a, i) => (
          <a
            key={a.title + i}
            href={a.url || undefined}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-zinc-900 transition-colors -mx-1 px-1"
          >
            <span className={`text-[13px] font-extrabold w-5 text-center shrink-0 ${i < 3 ? "text-[#F9954E]" : "text-stone-300 dark:text-stone-600"}`}>{i + 1}</span>
            <img
              src={a.favicon || letterAvatar(a.title)}
              alt={a.title}
              loading="lazy"
              className="w-7 h-7 rounded-lg object-contain bg-stone-50 dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 shrink-0"
              onError={(e) => { const t = e.target as HTMLImageElement; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = letterAvatar(a.title); } }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-stone-900 dark:text-white truncate">{a.title}</p>
              {a.desc && <p className="text-[10.5px] text-stone-400 truncate">{a.desc}</p>}
            </div>
            <span className="text-[12px] font-extrabold text-[#F9954E] tabular-nums shrink-0">{tokens(a.tokensB)}</span>
          </a>
        ))}
      </div>

      <p className="px-4 sm:px-5 pb-3 text-[10px] text-stone-400">데이터: OpenRouter · 토큰 사용량 기준</p>
    </div>
  );
}
