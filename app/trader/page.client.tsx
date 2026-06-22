"use client";

import { useEffect, useState } from "react";

const ORANGE = "#F9954E";
const TABS = ["국내주식", "해외주식", "코인"] as const;

const SELL_REASON: Record<string, string> = {
  stop_loss: "정해둔 손절선까지 떨어져 매도 — 손실을 작게 끊었어요",
  trailing_stop: "고점 대비 일정폭 내려와 매도 — 벌어둔 수익을 지켰어요",
  take_profit: "목표 수익에 도달해 매도",
  signal: "상승 추세가 꺾여서 매도",
};

interface Trade { entry: string; exit: string; entry_price?: number; exit_price?: number; qty?: number; pnl_pct: number; reason: string; entry_reason: string; }
interface OpenPos {
  entry_time?: string; entry_reason?: string; entry_price?: number; qty?: number;
  invested?: number; cur_price?: number; stop_price?: number; take_profit?: number; unrealized_pnl_pct?: number;
}
interface Section {
  symbol: string; name?: string; category: string;
  trades: number; win_rate_pct: number; realized_pnl: number;
  open_position: OpenPos | null; trade_log: Trade[];
}
interface Category { name: string; count: number; currency?: string; fx?: number; starting: number; ending: number; return_pct: number; }
interface Data {
  program: string; generated_at: string; mode: string;
  total_starting: number; total_ending: number; total_return_pct: number;
  usdkrw?: number; categories?: Category[]; sections: Section[];
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const man = (n: number) => Math.round(n / 10000) + "만";
// 통화별 금액/가격 표기 (해외=달러, 그 외=원화)
const money = (n: number, usd: boolean) =>
  usd ? "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : Math.round(n).toLocaleString("ko-KR") + "원";
const qtyStr = (q: number) => (q >= 1 ? q.toLocaleString("en-US", { maximumFractionDigits: 2 }) : q.toFixed(4));
const codeOf = (sym: string) => (sym.startsWith("KRW-") ? sym.slice(4) : sym); // 코인은 KRW- 제거
// "이름 (티커/코드)" — 무엇을 샀는지 명확히
const withCode = (name: string | undefined, sym: string) => {
  const c = codeOf(sym);
  return name && name !== sym ? `${name} (${c})` : c;
};
const sgn = (n: number) => (n >= 0 ? "text-emerald-500" : "text-red-500");
const pc = (n: number) => (n >= 0 ? "+" : "") + n + "%";

export default function TraderClient() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("국내주식");

  useEffect(() => {
    fetch("/trader-data.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setD)
      .catch(() => setErr(true));
  }, []);

  const secs = d ? d.sections.filter((s) => s.category === tab) : [];
  const cat = d?.categories?.find((c) => c.name === tab);
  const usd = tab === "해외주식"; // 해외는 달러 표기
  const openPos = secs.filter((s) => s.open_position).map((s) => ({ sym: s.symbol, nm: s.name || s.symbol, ...(s.open_position as OpenPos) }));
  const trades = secs
    .flatMap((s) => (s.trade_log || []).map((t) => ({ ...t, sym: s.symbol, nm: s.name || s.symbol })))
    .sort((a, b) => (a.exit < b.exit ? 1 : -1))
    .slice(0, 40);
  // 실제로 거래했거나 보유 중인 종목만 (아직 거래 안 한 후보는 숨김)
  const tradedSecs = secs.filter((s) => s.trades > 0 || s.open_position);

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

      <div className="rounded-xl border border-amber-300/40 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 mb-3 text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
        ⚠️ <b>모의(연습) 매매</b>입니다 — 진짜 돈이 아니라 <b>실제 시세</b>로 연습하며 기록합니다. 투자엔 손실 위험이 있어요. 코인·국내주식·해외주식 <b>각 100만원</b>으로 시작했고, 매수·매도가 생길 때마다 자동 갱신됩니다.
      </div>

      <details className="rounded-xl border border-neutral-200 dark:border-zinc-800 p-3 mb-5 text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
        <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">📌 솔직하게 — 이 봇이 할 수 있는 것 / 없는 것 (꼭 읽어주세요)</summary>
        <ul className="mt-3 space-y-2">
          <li>🎯 이 봇의 목표는 <b>“시장을 이기는 것”이 아니라 “크게 잃지 않는 것(낙폭 관리)”</b>입니다.</li>
          <li>📉 과거 데이터에선 <b>그냥 사서 들고 있기(존버)가 봇보다 훨씬 많이 벌었어요</b> — 대신 중간에 <b>-50%대 폭락</b>을 다 견뎌야 했고, 어떤 종목이 살아남을지는 <b>미리 알 수 없습니다</b>.</li>
          <li>🛡️ 봇은 손절·트레일링으로 손실을 작게 끊는 대신, 큰 상승을 다 먹진 못합니다. (수익과 안전은 맞바꿈 관계예요)</li>
          <li>🔬 전략은 미국 24·한국 10·코인 6종의 장기데이터로 검증했지만, <b>표본이 ‘살아남은 대형주’ 위주라 실제 성과는 더 낮을 수 있습니다</b>(생존편향).</li>
          <li>🚫 <b>과거 성과는 미래를 보장하지 않습니다.</b> “안 잃기”는 불가능합니다.</li>
        </ul>
      </details>

      {err && <div className="text-sm text-neutral-500 py-10 text-center">아직 데이터가 없습니다. 곧 업데이트됩니다.</div>}
      {!err && !d && <div className="text-sm text-neutral-400 py-10 text-center">불러오는 중…</div>}

      {d && (
        <>
          {/* 전체 요약(작게) */}
          <div className="flex items-center justify-between text-[12px] text-neutral-500 mb-3 px-1">
            <span>전체 합계</span>
            <span>
              {won(d.total_ending)} <span className={`font-bold ${sgn(d.total_return_pct)}`}>{pc(d.total_return_pct)}</span>
            </span>
          </div>

          {/* 탭 (국내/해외/코인) */}
          <div className="flex gap-2 mb-5">
            {TABS.map((t) => {
              const c = d.categories?.find((x) => x.name === t);
              const active = t === tab;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-xl border p-3 text-center transition-colors ${
                    active
                      ? "border-[#F9954E] bg-[#F9954E]/10"
                      : "border-neutral-200 dark:border-zinc-800 hover:border-neutral-300"
                  }`}
                >
                  <div className={`text-[12px] mb-0.5 ${active ? "text-[#F9954E] font-bold" : "text-neutral-500"}`}>{t}</div>
                  <div className={`text-[15px] font-extrabold ${c ? sgn(c.return_pct) : "text-neutral-400"}`}>
                    {c ? pc(c.return_pct) : "-"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 선택한 카테고리 요약 */}
          {cat && (
            <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4 mb-5 flex items-center justify-between">
              <div>
                <div className="text-[12px] text-neutral-500">
                  {cat.name} · 시작 {usd ? money(cat.starting, true) : man(cat.starting) + "원"} · 감시 {cat.count}종목
                  {usd && cat.fx ? `  (실투자금 100만원, 환율 ${cat.fx.toLocaleString()}원)` : ""}
                </div>
                <div className={`text-2xl font-extrabold ${sgn(cat.return_pct)}`}>{money(cat.ending, usd)}</div>
              </div>
              <div className={`text-2xl font-extrabold ${sgn(cat.return_pct)}`}>{pc(cat.return_pct)}</div>
            </div>
          )}

          {/* 현재 보유 (있을 때만) */}
          {openPos.length > 0 && (
            <>
              <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white mb-2">🟢 현재 보유 중</h2>
              <div className="space-y-2 mb-5">
                {openPos.map((p) => (
                  <div key={p.sym} className="rounded-2xl border border-emerald-300/40 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">{withCode(p.nm, p.sym)}</span>
                      <span className={`font-extrabold ${sgn(p.unrealized_pnl_pct ?? 0)}`}>{pc(p.unrealized_pnl_pct ?? 0)}</span>
                    </div>
                    <div className="text-[12px] text-neutral-600 dark:text-neutral-300 mt-1">
                      🛒 {money(p.entry_price ?? 0, usd)} × {qtyStr(p.qty ?? 0)}주 = <b>{money(p.invested ?? 0, usd)}</b> 투자
                    </div>
                    <div className="text-[12px] text-neutral-500">
                      🟥 손절선 {money(p.stop_price ?? 0, usd)}{p.take_profit ? `  ·  🎯 목표가(참고) ${money(p.take_profit, usd)}` : ""}
                    </div>
                    <div className="text-[11px] text-neutral-400">손절선은 수익이 나면 위로 따라 올라가요(트레일링). 목표가는 <b>참고선</b> — 닿아도 바로 안 팔고 추세 끝까지 따라갑니다.</div>
                    <div className="text-[11px] text-neutral-400 mt-1">매수시각 {p.entry_time} · {p.entry_reason}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 거래 내역 (있을 때만) */}
          {trades.length > 0 && (
            <>
              <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white mb-2">📒 거래 내역</h2>
              <div className="space-y-2 mb-5">
                {trades.map((t, i) => (
                  <div key={i} className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-neutral-800 dark:text-neutral-100">{withCode(t.nm, t.sym)}</span>
                      <span className={`font-extrabold ${sgn(t.pnl_pct)}`}>{pc(t.pnl_pct)}</span>
                    </div>
                    <div className="text-[12px] text-neutral-600 dark:text-neutral-300">🛒 <b>매수</b> {t.entry} · {money(t.entry_price ?? 0, usd)} × {qtyStr(t.qty ?? 0)}주</div>
                    <div className="text-[11px] text-neutral-400 mb-1 pl-4">└ {t.entry_reason || "추세 신호 발생"}</div>
                    <div className="text-[12px] text-neutral-600 dark:text-neutral-300">💰 <b>매도</b> {t.exit} · {money(t.exit_price ?? 0, usd)}</div>
                    <div className="text-[11px] text-neutral-400 pl-4">└ {SELL_REASON[t.reason] || t.reason}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 종목별 요약 — 실제 거래/보유한 종목만 (0거래 후보는 숨김) */}
          {tradedSecs.length > 0 && (
            <>
              <h2 className="text-[15px] font-extrabold text-neutral-950 dark:text-white mb-2">📊 {tab} 거래 종목</h2>
              <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 overflow-hidden overflow-x-auto mb-3">
                <table className="w-full text-[13px] min-w-[380px]">
                  <thead>
                    <tr className="text-neutral-400 border-b border-neutral-200 dark:border-zinc-800">
                      <th className="text-left font-medium py-2 px-3">종목</th>
                      <th className="text-right font-medium px-2">실현손익</th>
                      <th className="text-right font-medium px-2">거래수</th>
                      <th className="text-right font-medium px-3">승률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradedSecs.map((s) => (
                      <tr key={s.symbol} className="border-b border-neutral-100 dark:border-zinc-900 last:border-0">
                        <td className="py-2 px-3 text-neutral-700 dark:text-neutral-200">{withCode(s.name, s.symbol)}</td>
                        <td className={`text-right px-2 tabular-nums font-semibold ${sgn(s.realized_pnl)}`}>{(s.realized_pnl >= 0 ? "+" : "") + won(s.realized_pnl)}</td>
                        <td className="text-right px-2 tabular-nums text-neutral-500">{s.trades}</td>
                        <td className="text-right px-3 tabular-nums text-neutral-500">{s.win_rate_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {(openPos.length === 0 && trades.length === 0) && (
            <p className="text-[12px] text-neutral-400 mb-4 px-1">아직 이 카테고리에서 거래한 종목이 없어요. 좋은 매수 신호가 나오면 자동으로 사고 여기에 표시됩니다.</p>
          )}

          {/* 용어 설명 */}
          <details className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4 mb-5 text-[12px] text-neutral-600 dark:text-neutral-300">
            <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">❓ 용어가 헷갈려요 (눌러서 보기)</summary>
            <ul className="mt-3 space-y-2 leading-relaxed">
              <li><b style={{ color: ORANGE }}>수익률</b> — 투자한 돈 대비 번 비율. +면 이익, -면 손실.</li>
              <li><b style={{ color: ORANGE }}>승률</b> — 전체 거래 중 이긴(수익 본) 거래의 비율. 예) 10번 중 6번 수익이면 60%.</li>
              <li><b style={{ color: ORANGE }}>최대낙폭 (MDD)</b> — 제일 높았을 때 대비 가장 많이 떨어진 폭. 작을수록 덜 출렁여 안전해요.</li>
              <li><b style={{ color: ORANGE }}>손절선 / 목표가</b> — 손절선은 ‘여기까지 떨어지면 판다’(수익 나면 위로 따라 올라감). 목표가는 참고용 — 닿아도 바로 안 팔고 추세 끝까지 따라가요.</li>
              <li><b style={{ color: ORANGE }}>모의(페이퍼)</b> — 진짜 돈이 아니라 실제 시세로 연습하는 매매.</li>
            </ul>
          </details>

          <p className="text-[11px] text-neutral-400 text-center mt-2">
            마지막 업데이트: {d.generated_at} · 4시간마다 자동 갱신 · 트레이더일로
          </p>
          <p className="text-[11px] text-neutral-400 text-center mt-1">정보 제공용이며 투자 권유가 아닙니다. 투자 책임은 본인에게 있습니다.</p>
        </>
      )}
    </main>
  );
}
