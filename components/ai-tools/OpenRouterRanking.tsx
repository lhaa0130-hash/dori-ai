"use client";

import { useEffect, useState } from "react";

interface Row {
  name: string; provider: string;
  req: number; reqM: number;
  tps: number | null; pin: number | null; pout: number | null; intel: number | null;
}
interface Stats {
  updatedAt: string; total: number;
  usageTop: Row[]; speedTop: Row[]; priceTop: Row[];
  intelTop: { name: string; score: number }[];
}

const ORANGE = "#F9954E";
const TABS = [
  { key: "usage", label: "🔥 사용량", desc: "전 세계에서 가장 많이 쓰는 모델" },
  { key: "speed", label: "⚡ 성능", desc: "가장 빠른 모델 (초당 토큰)" },
  { key: "price", label: "💰 가격", desc: "가장 저렴한 모델 (입력가)" },
] as const;

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
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("usage");

  useEffect(() => {
    fetch("/openrouter-stats.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS)
      .catch(() => setHide(true));
  }, []);

  if (hide || !s || !s.usageTop?.length) return null;

  const list = tab === "usage" ? s.usageTop : tab === "speed" ? s.speedTop : s.priceTop;
  const activeDesc = TABS.find((t) => t.key === tab)!.desc;

  // 탭별 1차 지표 막대
  const primary = (m: Row): { val: string; pct: number } => {
    if (tab === "usage") { const mx = Math.max(...list.map((x) => x.req), 1); return { val: m.reqM + "M 요청", pct: (m.req / mx) * 100 }; }
    if (tab === "speed") { const mx = Math.max(...list.map((x) => x.tps || 0), 1); return { val: (m.tps ?? "—") + " t/s", pct: ((m.tps || 0) / mx) * 100 }; }
    const ps = list.map((x) => x.pin || 0); const mn = Math.min(...ps), mx = Math.max(...ps);
    return { val: "$" + (m.pin ?? "—") + " /1M", pct: mx > mn ? (1 - ((m.pin || 0) - mn) / (mx - mn)) * 100 : 100 };
  };
  const secondary = (m: Row): string => {
    if (tab === "usage") return `⚡ ${m.tps ?? "—"}t/s · 💰 $${m.pin ?? "—"}/$${m.pout ?? "—"}`;
    if (tab === "speed") return `🔥 ${m.reqM}M 요청 · 💰 $${m.pin ?? "—"}/$${m.pout ?? "—"}`;
    return `🔥 ${m.reqM}M 요청 · ⚡ ${m.tps ?? "—"}t/s · 출력 $${m.pout ?? "—"}`;
  };

  return (
    <div className="rounded-3xl border border-neutral-200 dark:border-zinc-800 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 sm:px-5 pt-4 pb-3 bg-gradient-to-b from-[#F9954E]/10 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-[16px] font-extrabold text-neutral-950 dark:text-white">AI 모델 랭킹</h2>
            <span className="text-[10px] font-bold text-[#F9954E] border border-[#F9954E]/40 rounded-full px-1.5 py-0.5">LIVE</span>
          </div>
          <span className="text-[11px] text-neutral-400 whitespace-nowrap">{s.total}개 · {ago(s.updatedAt)}</span>
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">전 세계 사용량 · 성능 · 가격 · 지능을 한눈에</p>
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

      {/* 탭 */}
      <div className="px-4 sm:px-5 pt-3">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold transition-colors ${
                tab === t.key ? "bg-[#F9954E] text-white" : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-neutral-400 mt-2 mb-1">{activeDesc}</p>
      </div>

      {/* 목록 */}
      <div className="px-4 sm:px-5 pb-3">
        <div className="space-y-2.5 mt-1">
          {list.map((m, i) => {
            const p = primary(m);
            return (
              <div key={m.name + i} className="flex items-start gap-2.5">
                <span className={`text-[13px] font-extrabold w-5 text-center shrink-0 leading-6 ${i < 3 ? "text-[#F9954E]" : "text-neutral-300 dark:text-neutral-600"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{m.name}</span>
                    <span className="text-[12px] font-extrabold text-[#F9954E] tabular-nums shrink-0">{p.val}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden my-1">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(4, p.pct)}%`, background: ORANGE }} />
                  </div>
                  <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate">{secondary(m)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="px-4 sm:px-5 pb-3 text-[10px] text-neutral-400">데이터: OpenRouter · 속도=초당 토큰(중앙값) · 가격=100만 토큰당 USD</p>
    </div>
  );
}
