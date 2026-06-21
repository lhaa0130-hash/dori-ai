"use client";

import { useEffect, useState } from "react";

const ORANGE = "#F9954E";

const NAME_MAP: Record<string, string> = {
  "KRW-BTC": "비트코인",
  "KRW-ETH": "이더리움",
  "360750": "미국 S&P500",
  "379810": "미국 나스닥100",
  "381180": "미국 반도체",
  "241180": "일본 니케이225",
  "446720": "미국 배당(SCHD)",
  "229200": "코스닥150",
  "411060": "금(Gold)",
};

interface Section {
  label: string;
  symbol: string;
  starting: number;
  ending: number;
  return_pct: number;
  trades: number;
  win_rate_pct: number;
  mdd_pct: number;
  open_position: { unrealized_pnl_pct?: number } | null;
}
interface Data {
  program: string;
  generated_at: string;
  mode: string;
  total_starting: number;
  total_ending: number;
  total_return_pct: number;
  sections: Section[];
  portfolio?: { allocation: { symbol: string; weight_end: number; ret: number; end: number }[] };
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const nameOf = (s: Section) => NAME_MAP[s.symbol] || s.symbol;
const sign = (n: number) => (n >= 0 ? "text-emerald-500" : "text-red-500");

export default function TraderClient() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/trader-data.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setErr(true));
  }, []);

  return (
    <main className="w-full min-h-screen max-w-3xl mx-auto px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
          트레이더일로 <span style={{ color: ORANGE }}>(Trader Illo)</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          AI 자동매매 — <b>손실 최소·수익 최대</b>를 추구합니다. 단, 투자에 완벽은 없습니다.
        </p>
      </header>

      {/* 정직성 고지 */}
      <div className="rounded-xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 mb-5 text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
        ⚠️ 현재 <b>페이퍼(모의) 운용</b> 결과입니다. 과거 성과는 미래 수익을 보장하지 않으며, 모든 투자는 손실 위험이 있습니다.
        추세추종 + 엄격한 리스크 관리(손절·분산·시장국면 필터)로 손실을 통제하는 것이 목표입니다.
      </div>

      {err && (
        <div className="text-sm text-neutral-500 py-10 text-center">아직 데이터가 없습니다. 곧 업데이트됩니다.</div>
      )}
      {!err && !d && <div className="text-sm text-neutral-400 py-10 text-center">불러오는 중…</div>}

      {d && (
        <>
          {/* 전체 요약 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 mb-5 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-neutral-500">전체 평가액 (시작 {won(d.total_starting)})</div>
              <div className={`text-3xl font-extrabold ${sign(d.total_return_pct)}`}>{won(d.total_ending)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-500">총 수익률</div>
              <div className={`text-3xl font-extrabold ${sign(d.total_return_pct)}`}>
                {d.total_return_pct >= 0 ? "+" : ""}{d.total_return_pct}%
              </div>
            </div>
          </div>

          {/* 종목별 성과 */}
          <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white mb-2">종목별 성과</h2>
          <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 overflow-hidden mb-5">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-200 dark:border-zinc-800">
                  <th className="text-left font-medium py-2 px-3">종목</th>
                  <th className="text-right font-medium px-2">수익률</th>
                  <th className="text-right font-medium px-2">거래</th>
                  <th className="text-right font-medium px-2">승률</th>
                  <th className="text-right font-medium px-3">최대낙폭</th>
                </tr>
              </thead>
              <tbody>
                {d.sections.map((s) => (
                  <tr key={s.symbol} className="border-b border-neutral-100 dark:border-zinc-900 last:border-0">
                    <td className="py-2 px-3 text-neutral-700 dark:text-neutral-200">
                      {nameOf(s)}
                      {s.open_position && <span className="ml-1 text-[10px]" style={{ color: ORANGE }}>● 보유중</span>}
                    </td>
                    <td className={`text-right px-2 tabular-nums font-semibold ${sign(s.return_pct)}`}>
                      {s.return_pct >= 0 ? "+" : ""}{s.return_pct}%
                    </td>
                    <td className="text-right px-2 tabular-nums text-neutral-500">{s.trades}</td>
                    <td className="text-right px-2 tabular-nums text-neutral-500">{s.win_rate_pct}%</td>
                    <td className="text-right px-3 tabular-nums text-neutral-500">{s.mdd_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 포트폴리오 비중 */}
          {d.portfolio?.allocation && (
            <>
              <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white mb-2">포트폴리오 비중</h2>
              <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4 mb-5 space-y-2">
                {[...d.portfolio.allocation].sort((a, b) => b.weight_end - a.weight_end).map((a) => (
                  <div key={a.symbol} className="flex items-center gap-2">
                    <span className="text-[12px] w-[34%] truncate text-neutral-600 dark:text-neutral-300">{NAME_MAP[a.symbol] || a.symbol}</span>
                    <div className="flex-1 h-3.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, a.weight_end)}%`, background: ORANGE }} />
                    </div>
                    <span className="text-[11px] text-neutral-500 w-10 text-right tabular-nums">{a.weight_end}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-[11px] text-neutral-400 text-center mt-6">
            기준: {d.generated_at} · 모드: {d.mode} · 매일 자동 갱신 · 트레이더일로(Trader Illo)
          </p>
          <p className="text-[11px] text-neutral-400 text-center mt-1 leading-relaxed">
            본 페이지는 정보 제공용이며 투자 권유가 아닙니다. 투자 판단과 책임은 본인에게 있습니다.
          </p>
        </>
      )}
    </main>
  );
}
