"use client";

import { useEffect, useState } from "react";

interface Row {
  name: string; provider: string;
  req: number; reqM: number;
  tps: number | null; pin: number | null; pout: number | null; intel: number | null;
}
interface Stats {
  updatedAt: string; total: number;
  usageTop: Row[]; priceTop: Row[];
  intelTop: { name: string; score: number }[];
}

const ORANGE = "#F9954E";

function shortName(name: string) {
  // "제공사: 모델명" 형태에서 모델명만 추출, 너무 길면 자름
  const n = name.includes(":") ? name.split(":").slice(1).join(":").trim() : name;
  return n.length > 22 ? n.slice(0, 21) + "…" : n;
}

const RT = {
  ko: {
    title: "AI 모델 랭킹",
    total: (n: number | string) => `${n}개 모델`,
    sub: "전 세계 사용량 · 지능 · 가격을 한눈에",
    usage: "🔥 사용량", intel: "🧠 지능", price: "💰 가격",
    source: "데이터: OpenRouter · 지능=Artificial Analysis · 가격=입력 토큰 100만 개당 USD",
  },
  en: {
    title: "AI model rankings",
    total: (n: number | string) => `${n} models`,
    sub: "Usage, intelligence and price worldwide, at a glance",
    usage: "🔥 Usage", intel: "🧠 Intelligence", price: "💰 Price",
    source: "Data: OpenRouter · Intelligence = Artificial Analysis · Price = USD per 1M input tokens",
  },
} as const;

export default function OpenRouterRanking({ locale = "ko" }: { locale?: "ko" | "en" }) {
  const t = RT[locale];
  const [s, setS] = useState<Stats | null>(null);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    fetch("/api/openrouter")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch(() => fetch("/openrouter-stats.json").then((r) => (r.ok ? r.json() : Promise.reject())))
      .then(setS)
      .catch(() => setHide(true));
  }, []);

  if (hide || !s || !s.usageTop?.length) return null;

  const usage = s.usageTop.slice(0, 5);
  const intel = s.intelTop.slice(0, 5);
  const price = s.priceTop.slice(0, 5);

  return (
    <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 sm:px-5 pt-3 pb-2 bg-gradient-to-b from-[#F9954E]/10 to-transparent border-b border-stone-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-[16px] font-extrabold text-stone-950 dark:text-white">{t.title}</h2>
            <span className="text-[10px] font-bold text-[#F9954E] border border-[#F9954E]/40 rounded-full px-1.5 py-0.5">LIVE</span>
          </div>
          <span className="text-[11px] text-stone-400 whitespace-nowrap">{t.total(s.total)}</span>
        </div>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{t.sub}</p>
      </div>

      {/* 3열 동시 표시 */}
      <div className="grid grid-cols-3 divide-x divide-stone-100 dark:divide-zinc-800">

        {/* 🔥 사용량 */}
        <div className="px-3 sm:px-4 py-2">
          <p className="text-[11px] font-extrabold text-stone-700 dark:text-stone-200 mb-2">{t.usage}</p>
          <ol className="space-y-1.5">
            {usage.map((m, i) => (
              <li key={m.name} className="flex items-center gap-1.5">
                <span className={`text-[11px] font-extrabold w-4 text-center shrink-0 ${i < 3 ? "text-[#F9954E]" : "text-stone-300 dark:text-stone-600"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-stone-900 dark:text-white truncate leading-snug">{shortName(m.name)}</p>
                  <p className="text-[10px] text-stone-400 tabular-nums">{m.reqM}M</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* 🧠 지능 */}
        <div className="px-3 sm:px-4 py-2">
          <p className="text-[11px] font-extrabold text-stone-700 dark:text-stone-200 mb-2">{t.intel}</p>
          <ol className="space-y-1.5">
            {intel.map((m, i) => {
              const max = Math.max(...intel.map((x) => x.score), 1);
              return (
                <li key={m.name} className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-extrabold w-4 text-center shrink-0 ${i < 3 ? "text-[#F9954E]" : "text-stone-300 dark:text-stone-600"}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-stone-900 dark:text-white truncate leading-snug">{shortName(m.name)}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(m.score / max) * 100}%`, background: ORANGE }} />
                      </div>
                      <span className="text-[10px] text-[#F9954E] font-bold tabular-nums">{m.score}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* 💰 가격 */}
        <div className="px-3 sm:px-4 py-2">
          <p className="text-[11px] font-extrabold text-stone-700 dark:text-stone-200 mb-2">{t.price}</p>
          <ol className="space-y-1.5">
            {price.map((m, i) => (
              <li key={m.name} className="flex items-center gap-1.5">
                <span className={`text-[11px] font-extrabold w-4 text-center shrink-0 ${i < 3 ? "text-[#F9954E]" : "text-stone-300 dark:text-stone-600"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-stone-900 dark:text-white truncate leading-snug">{shortName(m.name)}</p>
                  <p className="text-[10px] text-stone-400 tabular-nums">${m.pin ?? "—"}<span className="text-[9px]">/1M</span></p>
                </div>
              </li>
            ))}
          </ol>
        </div>

      </div>

      <p className="px-4 sm:px-5 pb-2 text-[10px] text-stone-400 border-t border-stone-100 dark:border-zinc-800 pt-1.5">{t.source}</p>
    </div>
  );
}
