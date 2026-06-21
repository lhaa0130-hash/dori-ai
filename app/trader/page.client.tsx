"use client";

import { useEffect, useState } from "react";

const ORANGE = "#F9954E";

const NAME_MAP: Record<string, string> = {
  "KRW-BTC": "비트코인",
  "KRW-ETH": "이더리움",
  "005930": "삼성전자",
  "069500": "KODEX 200",
  "229200": "코스닥150",
  "360750": "미국 S&P500",
  "379810": "미국 나스닥100",
  "381180": "미국 반도체",
  "241180": "일본 니케이225",
  "446720": "미국 배당(SCHD)",
  "411060": "금(Gold)",
};

// 매도(청산) 사유를 초보자도 알기 쉬운 한 줄로
const SELL_REASON: Record<string, string> = {
  stop_loss: "정해둔 손절선까지 떨어져 매도 — 손실을 작게 끊었어요",
  trailing_stop: "고점 대비 일정폭 내려와 매도 — 벌어둔 수익을 지켰어요",
  take_profit: "목표 수익에 도달해 매도",
  signal: "상승 추세가 꺾여서 매도",
};

interface Trade {
  entry: string; exit: string;
  entry_price: number; exit_price: number;
  pnl_pct: number; reason: string; entry_reason: string;
}
interface OpenPos {
  entry_time?: string; entry_reason?: string; unrealized_pnl_pct?: number; entry_price?: number;
}
interface Section {
  symbol: string; category: string; return_pct: number;
  trades: number; win_rate_pct: number; mdd_pct: number;
  ending: number; open_position: OpenPos | null; trade_log: Trade[];
}
interface Category { name: string; count: number; ending: number; return_pct: number; }
interface Data {
  program: string; generated_at: string; mode: string;
  total_starting: number; total_ending: number; total_return_pct: number;
  categories?: Category[]; sections: Section[];
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const nameOf = (sym: string) => NAME_MAP[sym] || sym;
const sgn = (n: number) => (n >= 0 ? "text-emerald-500" : "text-red-500");
const pc = (n: number) => (n >= 0 ? "+" : "") + n + "%";

export default function TraderClient() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/trader-data.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setErr(true));
  }, []);

  const openPos = d
    ? d.sections.filter((s) => s.open_position).map((s) => ({ sym: s.symbol, ...(s.open_position as OpenPos) }))
    : [];
  const allTrades = d
    ? d.sections.flatMap((s) => (s.trade_log || []).map((t) => ({ ...t, sym: s.symbol })))
        .sort((a, b) => (a.exit < b.exit ? 1 : -1)).slice(0, 40)
    : [];

  return (
    <main className="w-full min-h-screen max-w-2xl mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
          트레이더일로 <span style={{ color: ORANGE }}>(Trader Illo)</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          AI 자동매매 — <b>손실은 작게, 수익은 크게</b>를 목표로 합니다. (완벽하진 않아요)
        </p>
      </header>

      <div className="rounded-xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 mb-5 text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
        ⚠️ <b>모의(연습) 매매</b>입니다 — 진짜 돈이 아니라 <b>실제 시세</b>로 연습하며 기록합니다. 과거 성과가 미래를 보장하지 않고, 투자엔 손실 위험이 있어요. 매수·매도가 생길 때마다 자동으로 갱신됩니다.
      </div>

      {err && <div className="text-sm text-neutral-500 py-10 text-center">아직 데이터가 없습니다. 곧 업데이트됩니다.</div>}
      {!err && !d && <div className="text-sm text-neutral-400 py-10 text-center">불러오는 중…</div>}

      {d && (
        <>
          {/* 전체 요약 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-5 mb-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-neutral-500">전체 평가액 (시작 {won(d.total_starting)})</div>
              <div className={`text-3xl font-extrabold ${sgn(d.total_return_pct)}`}>{won(d.total_ending)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-500">총 수익률</div>
              <div className={`text-3xl font-extrabold ${sgn(d.total_return_pct)}`}>{pc(d.total_return_pct)}</div>
            </div>
          </div>

          {/* 카테고리 */}
          {d.categories && d.categories.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              {d.categories.map((c) => (
                <div key={c.name} className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-3 text-center">
                  <div className="text-[12px] text-neutral-500 mb-1">{c.name}</div>
                  <div className={`text-xl font-extrabold ${sgn(c.return_pct)}`}>{pc(c.return_pct)}</div>
                </div>
              ))}
            </div>
          )}

          {/* 현재 보유중 */}
          <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white mb-2">🟢 현재 보유 중</h2>
          {openPos.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4 mb-5 text-[13px] text-neutral-500">
              지금은 보유 중인 종목이 없습니다 (현금 보유). 좋은 매수 신호가 나오면 자동으로 사고 여기에 표시됩니다.
            </div>
          ) : (
            <div className="space-y-2 mb-5">
              {openPos.map((p) => (
                <div key={p.sym} className="rounded-2xl border border-emerald-300/40 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-neutral-800 dark:text-neutral-100">{nameOf(p.sym)}</span>
                    <span className={`font-extrabold ${sgn(p.unrealized_pnl_pct ?? 0)}`}>{pc(p.unrealized_pnl_pct ?? 0)}</span>
                  </div>
                  <div className="text-[12px] text-neutral-500 mt-1">🛒 매수: {p.entry_time}</div>
                  <div className="text-[12px] text-neutral-500">💬 {p.entry_reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* 거래 내역 */}
          <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white mb-2">📒 거래 내역</h2>
          {allTrades.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4 mb-5 text-[13px] text-neutral-500">
              아직 사고판 거래가 없습니다. 오늘부터 시작했고, 매도가 완료되면 매수일·매도일·수익률·사유가 여기에 쌓입니다.
            </div>
          ) : (
            <div className="space-y-2 mb-5">
              {allTrades.map((t, i) => (
                <div key={i} className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-neutral-800 dark:text-neutral-100">{nameOf(t.sym)}</span>
                    <span className={`font-extrabold ${sgn(t.pnl_pct)}`}>{pc(t.pnl_pct)}</span>
                  </div>
                  <div className="text-[12px] text-neutral-600 dark:text-neutral-300">🛒 <b>매수</b> {t.entry}</div>
                  <div className="text-[11px] text-neutral-400 mb-1 pl-4">└ {t.entry_reason || "추세 신호 발생"}</div>
                  <div className="text-[12px] text-neutral-600 dark:text-neutral-300">💰 <b>매도</b> {t.exit}</div>
                  <div className="text-[11px] text-neutral-400 pl-4">└ {SELL_REASON[t.reason] || t.reason}</div>
                </div>
              ))}
            </div>
          )}

          {/* 종목별 요약 */}
          <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white mb-2">📊 종목별 요약</h2>
          <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 overflow-hidden overflow-x-auto mb-3">
            <table className="w-full text-[13px] min-w-[420px]">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-200 dark:border-zinc-800">
                  <th className="text-left font-medium py-2 px-3">종목</th>
                  <th className="text-right font-medium px-2">수익률</th>
                  <th className="text-right font-medium px-2">거래수</th>
                  <th className="text-right font-medium px-2">승률</th>
                  <th className="text-right font-medium px-3">최대낙폭</th>
                </tr>
              </thead>
              <tbody>
                {d.sections.map((s) => (
                  <tr key={s.symbol} className="border-b border-neutral-100 dark:border-zinc-900 last:border-0">
                    <td className="py-2 px-3 text-neutral-700 dark:text-neutral-200">{nameOf(s.symbol)}<span className="text-[10px] text-neutral-400 ml-1">{s.category}</span></td>
                    <td className={`text-right px-2 tabular-nums font-semibold ${sgn(s.return_pct)}`}>{pc(s.return_pct)}</td>
                    <td className="text-right px-2 tabular-nums text-neutral-500">{s.trades}</td>
                    <td className="text-right px-2 tabular-nums text-neutral-500">{s.win_rate_pct}%</td>
                    <td className="text-right px-3 tabular-nums text-neutral-500">{s.mdd_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 용어 설명 (초보자용) */}
          <details className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4 mb-5 text-[12px] text-neutral-600 dark:text-neutral-300">
            <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">❓ 용어가 헷갈려요 (눌러서 보기)</summary>
            <ul className="mt-3 space-y-2 leading-relaxed">
              <li><b style={{ color: ORANGE }}>수익률</b> — 투자한 돈 대비 번 비율이에요. +면 이익, -면 손실.</li>
              <li><b style={{ color: ORANGE }}>승률</b> — 전체 거래 중 <b>이긴(수익 본) 거래의 비율</b>이에요. 예) 10번 중 6번 수익이면 60%. (높다고 무조건 좋은 건 아니에요 — 한 번 크게 벌면 승률이 낮아도 이득)</li>
              <li><b style={{ color: ORANGE }}>최대낙폭 (MDD)</b> — 운용 중 <b>제일 높았을 때 대비 가장 많이 떨어진 폭</b>이에요. 예) 100만원까지 갔다가 85만원으로 빠졌으면 -15%. <b>작을수록 덜 출렁여서 마음 편한</b> 운용이에요.</li>
              <li><b style={{ color: ORANGE }}>모의(페이퍼)</b> — 진짜 돈이 아니라 <b>실제 시세로 연습</b>하는 매매예요. 전략이 통하는지 안전하게 검증하는 단계.</li>
            </ul>
          </details>

          <p className="text-[11px] text-neutral-400 text-center mt-2">
            마지막 업데이트: {d.generated_at} · 매일 자동 갱신 · 트레이더일로(Trader Illo)
          </p>
          <p className="text-[11px] text-neutral-400 text-center mt-1">정보 제공용이며 투자 권유가 아닙니다. 투자 책임은 본인에게 있습니다.</p>
        </>
      )}
    </main>
  );
}
