"use client";

import { useEffect, useRef, useState } from "react";

const ORANGE = "#F9954E";
const TABS = ["국내주식", "해외주식", "코인"] as const;

const SELL_REASON: Record<string, string> = {
  stop_loss: "손절선까지 떨어져 매도 — 손실을 작게 끊음",
  trailing_stop: "고점 대비 내려와 매도 — 벌어둔 수익 지킴",
  take_profit: "목표 수익 도달 매도",
  signal: "상승 추세가 꺾여 매도",
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
interface RecentRun { time: string; watching?: number; holding?: number; new_trades?: number; total?: number; ret?: number; }
interface Data {
  program: string; generated_at: string; mode: string;
  total_starting: number; total_ending: number; total_return_pct: number;
  usdkrw?: number; watching?: number; holding?: number; interval_hours?: number;
  test_period?: { start: string; end: string };
  categories?: Category[]; sections: Section[]; recent_runs?: RecentRun[];
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const man = (n: number) => Math.round(n / 10000) + "만";
const money = (n: number, usd: boolean) =>
  usd ? "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : Math.round(n).toLocaleString("ko-KR") + "원";
const qtyStr = (q: number) => (q >= 1 ? q.toLocaleString("en-US", { maximumFractionDigits: 2 }) : q.toFixed(4));
const codeOf = (sym: string) => (sym.startsWith("KRW-") ? sym.slice(4) : sym);
const withCode = (name: string | undefined, sym: string) => {
  const c = codeOf(sym);
  return name && name !== sym ? `${name} (${c})` : c;
};
const sgn = (n: number) => (n >= 0 ? "text-emerald-500" : "text-red-500");
const pc = (n: number) => (n >= 0 ? "+" : "") + n + "%";
const dot = (s: string) => s.replaceAll("-", ".").slice(2); // 2026-06-15 → 26.06.15

export default function TraderClient() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("해외주식");
  const [now, setNow] = useState<number>(() => Date.now());
  const userPicked = useRef(false);

  useEffect(() => {
    const load = () =>
      fetch("/trader-data.json", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j: Data) => {
          setD(j); setErr(false);
          if (!userPicked.current) {
            let best: (typeof TABS)[number] | null = null, bestN = 0;
            for (const t of TABS) {
              const n = j.sections.filter((s) => s.category === t && s.open_position).length;
              if (n > bestN) { bestN = n; best = t; }
            }
            if (best) setTab(best);
          }
        })
        .catch(() => setErr(true));
    load();
    const poll = setInterval(load, 60000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, []);

  const secs = d ? d.sections.filter((s) => s.category === tab) : [];
  const cat = d?.categories?.find((c) => c.name === tab);
  const usd = tab === "해외주식";
  const openPos = secs.filter((s) => s.open_position).map((s) => ({ sym: s.symbol, nm: s.name || s.symbol, ...(s.open_position as OpenPos) }));
  const trades = secs
    .flatMap((s) => (s.trade_log || []).map((t) => ({ ...t, sym: s.symbol, nm: s.name || s.symbol })))
    .sort((a, b) => (a.exit < b.exit ? 1 : -1))
    .slice(0, 40);
  const tradedSecs = secs.filter((s) => s.trades > 0 || s.open_position);

  // 라이브 상태
  const gen = d ? new Date(d.generated_at.replace(" ", "T")).getTime() : 0;
  const ms = now - gen;
  const interval = (d?.interval_hours ?? 4) * 3600 * 1000;
  const left = Math.max(0, gen + interval - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const cd = `${pad(Math.floor(left / 3600000))}:${pad(Math.floor((left % 3600000) / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`;
  const alive = d ? ms < interval + 3600 * 1000 : false;
  const minAgo = Math.max(0, Math.floor(ms / 60000));
  const agoStr = minAgo < 1 ? "방금" : minAgo < 60 ? `${minAgo}분 전` : `${Math.floor(minAgo / 60)}시간 ${minAgo % 60}분 전`;

  // 지금 한 줄
  const holdByCat = (name: string) => (d ? d.sections.filter((s) => s.category === name && s.open_position).length : 0);
  const heldCats = d ? TABS.filter((t) => holdByCat(t) > 0) : [];
  const waitCats = d ? TABS.filter((t) => holdByCat(t) === 0) : [];
  const nowDoing =
    heldCats.length > 0
      ? `${heldCats.map((t) => `${t} ${holdByCat(t)}종`).join(", ")}을 보유 중` +
        (waitCats.length ? ` · ${waitCats.join("·")}은 좋은 기회를 기다리는 중.` : ".")
      : "전 종목을 살펴보며 좋은 매수 신호를 기다리는 중. (약한 시장에선 억지로 사지 않아요)";

  return (
    <main className="w-full min-h-screen max-w-2xl mx-auto px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
          트레이더일로 <span style={{ color: ORANGE }}>(Trader Illo)</span>
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">AI 자동매매 — 손실은 작게, 수익은 크게.</p>
      </header>

      {err && <div className="text-sm text-neutral-400 py-16 text-center">아직 데이터가 없습니다. 곧 업데이트됩니다.</div>}
      {!err && !d && <div className="text-sm text-neutral-400 py-16 text-center">불러오는 중…</div>}

      {d && (
        <>
          {/* ── 히어로 ── */}
          <section className="pb-5 mb-5 border-b border-neutral-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${alive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className={alive ? "text-neutral-500" : "text-amber-600 dark:text-amber-400 font-medium"}>{alive ? "작동중" : "대기중"}</span>
              </span>
              <span className="text-neutral-400">
                {alive ? <>다음 점검 <b className="tabular-nums text-neutral-600 dark:text-neutral-300">{cd}</b></> : "PC 켜지면 재개"}
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-4">전체 평가액</div>
            <div className="flex items-end justify-between gap-2 mt-0.5">
              <span className="text-4xl font-extrabold tracking-tight tabular-nums leading-none text-neutral-950 dark:text-white">{won(d.total_ending)}</span>
              <span className={`text-2xl font-extrabold tabular-nums ${sgn(d.total_return_pct)}`}>{pc(d.total_return_pct)}</span>
            </div>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3 leading-relaxed">
              모의투자(실제 시세·가짜 돈) · 각 300만원
              {d.test_period?.start ? ` · ${dot(d.test_period.start)}~${dot(d.test_period.end)}` : ""}
              {` · 감시 ${d.watching ?? 0} · 보유 ${d.holding ?? 0} · ${agoStr}`}
            </p>
          </section>

          {/* ── 탭 ── */}
          <div className="flex gap-4 mb-4">
            {TABS.map((t) => {
              const c = d.categories?.find((x) => x.name === t);
              const active = t === tab;
              return (
                <button key={t} onClick={() => { userPicked.current = true; setTab(t); }}
                  className={`flex-1 pb-2 text-center border-b-2 transition-colors ${active ? "border-[#F9954E]" : "border-transparent hover:border-neutral-200 dark:hover:border-zinc-700"}`}>
                  <div className={`text-xs mb-0.5 ${active ? "text-[#F9954E] font-bold" : "text-neutral-400"}`}>{t}</div>
                  <div className={`text-base font-extrabold tabular-nums ${c ? sgn(c.return_pct) : "text-neutral-400"}`}>{c ? pc(c.return_pct) : "-"}</div>
                </button>
              );
            })}
          </div>

          {/* ── 지금 + 진행 단계 ── */}
          <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
            <b style={{ color: ORANGE }}>지금</b> {nowDoing}
          </p>
          <p className="text-xs mt-1.5 mb-5">
            <b style={{ color: ORANGE }}>① 모의 연습(지금)</b>
            <span className="text-neutral-400"> → ② 소액 실전 → ③ 점차 확대</span>
          </p>

          {/* ── 카테고리 요약 ── */}
          {cat && (
            <div className="flex items-end justify-between py-3 border-b border-neutral-100 dark:border-zinc-800 mb-5">
              <div>
                <div className="text-xs text-neutral-400">
                  {cat.name} · 시작 {usd ? money(cat.starting, true) : man(cat.starting) + "원"} · 감시 {cat.count}종목
                  {usd && cat.fx ? ` · 실투자금 300만원(환율 ${cat.fx.toLocaleString()})` : ""}
                </div>
                <div className={`text-2xl font-extrabold tabular-nums mt-0.5 ${sgn(cat.return_pct)}`}>{money(cat.ending, usd)}</div>
              </div>
              <div className={`text-2xl font-extrabold tabular-nums ${sgn(cat.return_pct)}`}>{pc(cat.return_pct)}</div>
            </div>
          )}

          {/* ── 현재 보유 ── */}
          {openPos.length > 0 && (
            <section className="mb-5">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">현재 보유</h2>
              <div className="divide-y divide-neutral-100 dark:divide-zinc-800 border-y border-neutral-100 dark:border-zinc-800">
                {openPos.map((p) => (
                  <div key={p.sym} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{withCode(p.nm, p.sym)}</span>
                      <span className={`text-base font-extrabold tabular-nums ${sgn(p.unrealized_pnl_pct ?? 0)}`}>{pc(p.unrealized_pnl_pct ?? 0)}</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      매수 {money(p.entry_price ?? 0, usd)} × {qtyStr(p.qty ?? 0)} · 투자 <b className="text-neutral-600 dark:text-neutral-300">{money(p.invested ?? 0, usd)}</b> · 손절 <span className="text-neutral-600 dark:text-neutral-300">{money(p.stop_price ?? 0, usd)}</span>{p.take_profit ? <> · 목표 {money(p.take_profit, usd)}</> : null}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">{p.entry_time} · {p.entry_reason}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 거래 내역 ── */}
          {trades.length > 0 && (
            <section className="mb-5">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">거래 내역</h2>
              <div className="divide-y divide-neutral-100 dark:divide-zinc-800 border-y border-neutral-100 dark:border-zinc-800">
                {trades.map((t, i) => (
                  <div key={i} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{withCode(t.nm, t.sym)}</span>
                      <span className={`text-base font-extrabold tabular-nums ${sgn(t.pnl_pct)}`}>{pc(t.pnl_pct)}</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1"><b className="text-neutral-500">매수</b> {t.entry} · {money(t.entry_price ?? 0, usd)} × {qtyStr(t.qty ?? 0)}</div>
                    <div className="text-xs text-neutral-400"><b className="text-neutral-500">매도</b> {t.exit} · {money(t.exit_price ?? 0, usd)} — {SELL_REASON[t.reason] || t.reason}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 종목별 요약 ── */}
          {tradedSecs.length > 0 && (
            <section className="mb-5">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">{tab} 거래 종목</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[340px]">
                  <thead>
                    <tr className="text-neutral-400 border-b border-neutral-200 dark:border-zinc-800">
                      <th className="text-left font-medium py-2">종목</th>
                      <th className="text-right font-medium">실현손익</th>
                      <th className="text-right font-medium px-2">거래수</th>
                      <th className="text-right font-medium">승률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-zinc-900">
                    {tradedSecs.map((s) => (
                      <tr key={s.symbol}>
                        <td className="py-2 text-neutral-700 dark:text-neutral-200">{withCode(s.name, s.symbol)}</td>
                        <td className={`text-right tabular-nums font-semibold ${sgn(s.realized_pnl)}`}>{(s.realized_pnl >= 0 ? "+" : "") + won(s.realized_pnl)}</td>
                        <td className="text-right px-2 tabular-nums text-neutral-400">{s.trades}</td>
                        <td className="text-right tabular-nums text-neutral-400">{s.win_rate_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {openPos.length === 0 && trades.length === 0 && (
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
              아직 <b>{tab}</b>에서 거래한 종목이 없어요. 좋은 매수 신호(꾸준한 상승 흐름 + 신고가 돌파)가 나오면 자동으로 사고 여기 표시됩니다.
            </p>
          )}

          {/* ── 작업 기록 ── */}
          {d.recent_runs && d.recent_runs.length > 0 && (
            <section className="mb-5">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1">작업 기록 <span className="text-xs font-normal text-neutral-400">봇이 점검한 시각</span></h2>
              <div className="divide-y divide-neutral-100 dark:divide-zinc-800 border-y border-neutral-100 dark:border-zinc-800">
                {d.recent_runs.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      <span className="text-neutral-400 mr-2 tabular-nums">{r.time?.slice(5, 16)}</span>
                      {r.watching ?? 0}종목 점검 · {r.holding ?? 0}종 보유
                      {r.new_trades ? <span className="ml-1 font-bold" style={{ color: ORANGE }}>신규 {r.new_trades}</span> : null}
                    </span>
                    <span className="tabular-nums text-neutral-400">
                      {won(r.total ?? 0)} <span className={`font-semibold ${sgn(r.ret ?? 0)}`}>{pc(r.ret ?? 0)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 더 알아보기 (접기) ── */}
          <div className="mt-8 mb-1 text-xs font-medium text-neutral-400">더 알아보기</div>

          <details className="border-t border-neutral-100 dark:border-zinc-800 py-3 text-[13px] text-neutral-600 dark:text-neutral-300">
            <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">이게 무슨 서비스예요? (쉽게 설명)</summary>
            <div className="mt-3 space-y-3">
              <div>
                <div className="font-bold text-neutral-800 dark:text-neutral-100 mb-1">① 지금 무슨 일을 하나요?</div>
                <ul className="space-y-1 leading-relaxed list-disc pl-5">
                  <li>AI가 4시간마다 코인·국내·미국 주식 453개를 살펴봐요.</li>
                  <li>그중 꾸준히 오르는 흐름을 탄 종목만 골라 삽니다. 아무거나 안 사요.</li>
                  <li>사면 손절선(여기까지 내려오면 자동 매도)을 정해 손실을 작게 끊어요.</li>
                </ul>
              </div>
              <div>
                <div className="font-bold text-neutral-800 dark:text-neutral-100 mb-1">② 지금은 ‘연습’ 중 (진짜 돈 아님)</div>
                <ul className="space-y-1 leading-relaxed list-disc pl-5">
                  <li>게임처럼 가짜 돈으로, 대신 진짜 시세를 받아 똑같이 연습해요.</li>
                  <li>과거 최대 26년치 데이터로도 미리 시험했어요(=백테스트).</li>
                </ul>
              </div>
              <div>
                <div className="font-bold text-neutral-800 dark:text-neutral-100 mb-1">③ 앞으로 계획</div>
                <ul className="space-y-1 leading-relaxed list-disc pl-5">
                  <li>1주일 연습 결과를 보고, 안전장치 점검이 끝나면</li>
                  <li>코인·국내부터 아주 적은 돈으로 진짜 매매 시작 (한 번에 안 몰아넣어요).</li>
                  <li>미국주식은 아직 자동 ‘진짜 주문’이 안 돼서 당분간 연습만 합니다.</li>
                </ul>
              </div>
            </div>
          </details>

          <details className="border-t border-neutral-100 dark:border-zinc-800 py-3 text-[13px] text-neutral-600 dark:text-neutral-300">
            <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">솔직하게 — 봇이 할 수 있는 것 / 없는 것</summary>
            <ul className="mt-3 space-y-2 leading-relaxed list-disc pl-5">
              <li>목표는 “시장을 이기는 것”이 아니라 “크게 잃지 않는 것(낙폭 관리)”입니다.</li>
              <li>과거엔 그냥 들고 있기(존버)가 봇보다 훨씬 많이 벌었어요 — 대신 중간에 -50%대 폭락도 다 견뎌야 했죠.</li>
              <li>봇은 손실을 작게 끊는 대신 큰 상승을 다 먹진 못해요(수익과 안전은 맞바꿈).</li>
              <li>과거 성과는 미래를 보장하지 않습니다. “안 잃기”는 불가능합니다.</li>
            </ul>
          </details>

          <details className="border-t border-b border-neutral-100 dark:border-zinc-800 py-3 text-[13px] text-neutral-600 dark:text-neutral-300">
            <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">용어가 헷갈려요</summary>
            <ul className="mt-3 space-y-2 leading-relaxed">
              <li><b style={{ color: ORANGE }}>수익률</b> — 투자한 돈 대비 번 비율. +면 이익, -면 손실.</li>
              <li><b style={{ color: ORANGE }}>승률</b> — 전체 거래 중 이긴 거래의 비율. 10번 중 6번 수익이면 60%.</li>
              <li><b style={{ color: ORANGE }}>손절선 / 목표가</b> — 손절선은 ‘여기까지 떨어지면 판다’(수익 나면 위로 따라 올라감). 목표가는 참고용 — 닿아도 바로 안 팔고 추세 끝까지 따라가요.</li>
              <li><b style={{ color: ORANGE }}>모의(페이퍼)</b> — 진짜 돈이 아니라 실제 시세로 하는 연습 매매.</li>
            </ul>
          </details>

          <p className="text-xs text-neutral-400 text-center mt-6">마지막 업데이트 {d.generated_at} · 4시간마다 자동 갱신</p>
          <p className="text-xs text-neutral-400 text-center mt-1">정보 제공용이며 투자 권유가 아닙니다. 투자 책임은 본인에게 있습니다.</p>
        </>
      )}
    </main>
  );
}
