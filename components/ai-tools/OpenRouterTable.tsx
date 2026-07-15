"use client";

import { useEffect, useState } from "react";

interface TableRow { name: string; provider: string; throughput: number | null; latency: number | null; pin: number | null; pout: number | null; }
interface Stats {
  updatedAt: string;
  table: TableRow[];
  intelTop: { name: string; score: number }[];
}

const ORANGE = "#F9954E";

export default function OpenRouterTable() {
  const [s, setS] = useState<Stats | null>(null);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    fetch("/openrouter-stats.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS)
      .catch(() => setHide(true));
  }, []);

  if (hide || !s || (!s.table?.length && !s.intelTop?.length)) return null;

  const maxIntel = Math.max(...(s.intelTop || []).map((i) => i.score), 1);

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 p-4 sm:p-5">
      <h2 className="text-[15px] font-extrabold text-stone-950 dark:text-white mb-4">AI 모델 성능·가격표</h2>

      {/* 지능 점수 */}
      {s.intelTop?.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-stone-500 mb-2">지능 점수 (Artificial Analysis 벤치마크)</p>
          <div className="space-y-1.5">
            {s.intelTop.slice(0, 6).map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] w-[40%] truncate text-stone-700 dark:text-stone-300" title={it.name}>{it.name}</span>
                <div className="flex-1 h-3 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(6, (it.score / maxIntel) * 100)}%`, background: ORANGE }} />
                </div>
                <span className="text-[10px] text-stone-500 w-8 text-right tabular-nums font-bold">{it.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 성능 + 가격표 */}
      {s.table?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-stone-500 mb-2">인기 모델 속도 · 가격</p>
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="text-stone-400">
                  <th className="text-left font-semibold pb-1.5">모델</th>
                  <th className="text-right font-semibold pb-1.5 px-1">속도</th>
                  <th className="text-right font-semibold pb-1.5 px-1">입력</th>
                  <th className="text-right font-semibold pb-1.5 pl-1">출력</th>
                </tr>
              </thead>
              <tbody>
                {s.table.slice(0, 10).map((t, i) => (
                  <tr key={i} className="border-t border-stone-100 dark:border-zinc-800/60">
                    <td className="py-1.5 pr-2 text-stone-700 dark:text-stone-300 truncate max-w-[150px]" title={t.name}>{t.name}</td>
                    <td className="text-right tabular-nums text-stone-600 dark:text-stone-400 px-1 whitespace-nowrap">{t.throughput != null ? t.throughput + " t/s" : "—"}</td>
                    <td className="text-right tabular-nums text-stone-600 dark:text-stone-400 px-1 whitespace-nowrap">{t.pin != null ? "$" + t.pin : "—"}</td>
                    <td className="text-right tabular-nums text-stone-600 dark:text-stone-400 pl-1 whitespace-nowrap">{t.pout != null ? "$" + t.pout : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-stone-400 mt-2.5">속도=초당 토큰(중앙값) · 가격=100만 토큰당 USD · 데이터: OpenRouter</p>
        </div>
      )}
    </div>
  );
}
