"use client";

import { useEffect, useState } from "react";

interface ModelRow {
  rank: number; name: string; provider: string;
  reqM: number; usePct: number;
  tps: number | null; pin: number | null; pout: number | null; intel: number | null;
}
interface Stats {
  updatedAt: string;
  total: number;
  models: ModelRow[];
  intelTop: { name: string; score: number }[];
}

const ORANGE = "#F9954E";

function ago(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "시간 전";
  return Math.floor(h / 24) + "일 전";
}

export default function OpenRouterRanking() {
  const [s, setS] = useState<Stats | null>(null);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    fetch("/openrouter-stats.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS)
      .catch(() => setHide(true));
  }, []);

  if (hide || !s || !s.models?.length) return null;

  return (
    <div className="rounded-3xl border border-neutral-200 dark:border-zinc-800 overflow-hidden">
      {/* 헤더 — illo 오렌지 */}
      <div className="px-4 sm:px-5 pt-4 pb-3 bg-gradient-to-b from-[#F9954E]/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-[16px] font-extrabold text-neutral-950 dark:text-white">AI 모델 랭킹</h2>
            <span className="text-[10px] font-bold text-[#F9954E] border border-[#F9954E]/40 rounded-full px-1.5 py-0.5">LIVE</span>
          </div>
          <span className="text-[11px] text-neutral-400 whitespace-nowrap">{s.total}개 · {ago(s.updatedAt)}</span>
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">전 세계 사용량 · 속도 · 가격을 한눈에 · 6시간마다 갱신</p>
      </div>

      {/* 지능 하이라이트 */}
      {s.intelTop?.length > 0 && (
        <div className="px-4 sm:px-5 py-3 border-y border-neutral-100 dark:border-zinc-800/60">
          <p className="text-[11px] font-semibold text-neutral-500 mb-2">🧠 가장 똑똑한 모델 <span className="text-neutral-400 font-normal">(지능 점수)</span></p>
          <div className="flex flex-wrap gap-1.5">
            {s.intelTop.slice(0, 5).map((it, i) => (
              <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-[#F9954E]/10 text-neutral-700 dark:text-neutral-200 border border-[#F9954E]/20">
                {i === 0 && "👑 "}{it.name} <span className="font-bold text-[#F9954E]">{it.score}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 통합 랭킹: 사용량 순 + 속도 + 가격 */}
      <div className="px-4 sm:px-5 py-3">
        <p className="text-[11px] font-semibold text-neutral-500 mb-2.5">🔥 사용량 순위 <span className="text-neutral-400 font-normal">(요청수 · 속도 · 가격)</span></p>
        <div className="space-y-2.5">
          {s.models.map((m) => (
            <div key={m.rank} className="flex items-start gap-2.5">
              {/* 순위 */}
              <span className={`text-[13px] font-extrabold w-5 text-center shrink-0 leading-6 ${m.rank <= 3 ? "text-[#F9954E]" : "text-neutral-300 dark:text-neutral-600"}`}>{m.rank}</span>
              <div className="flex-1 min-w-0">
                {/* 이름 + 제공사 + 지능 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{m.name}</span>
                  {m.intel != null && <span className="text-[9px] font-bold text-[#F9954E] bg-[#F9954E]/10 rounded px-1 py-0.5 shrink-0">지능 {m.intel}</span>}
                </div>
                {/* 사용량 막대 */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, m.usePct)}%`, background: ORANGE }} />
                  </div>
                  <span className="text-[10px] text-neutral-400 tabular-nums shrink-0">{m.reqM}M 요청</span>
                </div>
                {/* 속도 · 가격 */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10.5px] text-neutral-500 dark:text-neutral-400">
                  <span>⚡ {m.tps != null ? m.tps + " t/s" : "—"}</span>
                  <span>💰 입력 ${m.pin ?? "—"} <span className="text-neutral-300 dark:text-neutral-600">·</span> 출력 ${m.pout ?? "—"} <span className="text-neutral-300 dark:text-neutral-600">/1M</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="px-4 sm:px-5 pb-3 text-[10px] text-neutral-400">데이터: OpenRouter · 속도=초당 토큰(중앙값) · 가격=100만 토큰당 USD</p>
    </div>
  );
}
