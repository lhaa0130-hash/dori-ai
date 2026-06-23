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

interface Trade { entry: string; exit: string; entry_price?: number; exit_price?: number; qty?: number; pnl?: number; pnl_pct: number; reason: string; entry_reason: string; }
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
const dot = (s: string) => s.replaceAll("-", ".").slice(2);
const pm = (n: number, usd: boolean) => (n >= 0 ? "+" : "−") + money(Math.abs(n), usd); // 부호 있는 손익 금액

// 손익 배지(▲▼ + 톤다운 배경) — 페이지 전반 일관 사용
function Chg({ n, big = false }: { n: number; big?: boolean }) {
  const up = n >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-bold tabular-nums ${big ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"} ${
        up ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
      }`}
    >
      <span className="text-[0.8em] leading-none">{up ? "▲" : "▼"}</span>
      {Math.abs(n)}%
    </span>
  );
}

// 섹션 제목 (주황 액센트 바 + 부제)
function H2({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <h2 className="flex items-center gap-2 mb-2.5">
      <span className="inline-block w-1 h-4 rounded-full" style={{ background: ORANGE }} />
      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{children}</span>
      {sub && <span className="text-xs font-normal text-neutral-400">{sub}</span>}
    </h2>
  );
}

export default function TraderClient() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("해외주식");
  const [now, setNow] = useState<number>(() => Date.now());
  const userPicked = useRef(false);

  // 관심종목·설정(localStorage) — ProjectSync가 계정(Firebase)과 동기화
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    const load = () => {
      try { const f = JSON.parse(localStorage.getItem("trader_favs") || "[]"); if (Array.isArray(f)) setFavs(f); } catch { /* */ }
      try { const t = localStorage.getItem("trader_tab"); if (t && (TABS as readonly string[]).includes(t)) { userPicked.current = true; setTab(t as (typeof TABS)[number]); } } catch { /* */ }
    };
    load();
    window.addEventListener("dori-project-synced", load); // Firebase 복원 후 반영
    return () => window.removeEventListener("dori-project-synced", load);
  }, []);
  const toggleFav = (sym: string) => setFavs((cur) => {
    const next = cur.includes(sym) ? cur.filter((x) => x !== sym) : [...cur, sym];
    try { localStorage.setItem("trader_favs", JSON.stringify(next)); } catch { /* */ }
    return next;
  });

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

  const gen = d ? new Date(d.generated_at.replace(" ", "T")).getTime() : 0;
  const ms = now - gen;
  const interval = (d?.interval_hours ?? 4) * 3600 * 1000;
  const left = Math.max(0, gen + interval - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const cd = `${pad(Math.floor(left / 3600000))}:${pad(Math.floor((left % 3600000) / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`;
  const alive = d ? ms < interval + 3600 * 1000 : false;
  const minAgo = Math.max(0, Math.floor(ms / 60000));
  const agoStr = minAgo < 1 ? "방금" : minAgo < 60 ? `${minAgo}분 전` : `${Math.floor(minAgo / 60)}시간 ${minAgo % 60}분 전`;

  return (
    <main className="w-full min-h-screen max-w-2xl mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
          트레이더일로 <span style={{ color: ORANGE }}>(Trader Illo)</span>
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">AI 자동매매 — 손실은 작게, 수익은 크게.</p>
      </header>

      {err && <div className="text-sm text-neutral-400 py-16 text-center">아직 데이터가 없습니다. 곧 업데이트됩니다.</div>}
      {!err && !d && <div className="text-sm text-neutral-400 py-16 text-center">불러오는 중…</div>}

      {d && (
        <>
          {/* ── 히어로 카드 ── */}
          <section className="rounded-2xl border border-[#F9954E]/20 dark:border-zinc-800 bg-gradient-to-b from-[#F9954E]/[0.07] to-transparent dark:from-[#F9954E]/[0.05] shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between text-xs mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-zinc-900/60 border border-neutral-200/70 dark:border-zinc-700 px-2 py-0.5">
                <span className={`inline-block w-2 h-2 rounded-full ${alive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className={`font-medium ${alive ? "text-neutral-600 dark:text-neutral-300" : "text-amber-600 dark:text-amber-400"}`}>{alive ? "작동중" : "대기중"}</span>
              </span>
              <span className="text-neutral-400">
                {alive ? <>다음 점검 <b className="tabular-nums text-neutral-600 dark:text-neutral-300">{cd}</b></> : null}
              </span>
            </div>

            <div className="text-xs text-neutral-400">전체 평가액</div>
            <div className="flex items-end justify-between gap-2 mt-1">
              <span className="text-[28px] sm:text-[38px] font-extrabold tracking-tight tabular-nums leading-none text-neutral-950 dark:text-white whitespace-nowrap">{won(d.total_ending)}</span>
              <Chg n={d.total_return_pct} big />
            </div>
            <div className="text-sm mt-1.5">
              {d.usdkrw ? <span className="tabular-nums text-neutral-500 dark:text-neutral-300">≈ ${Math.round(d.total_ending / d.usdkrw).toLocaleString("en-US")}</span> : null}
              <span className="text-neutral-400"> · 평가손익 </span>
              <b className={`tabular-nums ${sgn(d.total_ending - d.total_starting)}`}>{pm(d.total_ending - d.total_starting, false)}</b>
            </div>

            <div className="text-[11px] text-neutral-400 mt-4">감시 {d.watching ?? 0}종목 · 보유 {d.holding ?? 0}종</div>
          </section>

          {/* ── 세그먼트 탭 ── */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-zinc-900 mb-5">
            {TABS.map((t) => {
              const c = d.categories?.find((x) => x.name === t);
              const active = t === tab;
              const tu = t === "해외주식";
              return (
                <button key={t} onClick={() => { userPicked.current = true; setTab(t); try { localStorage.setItem("trader_tab", t); } catch { /* */ } }}
                  className={`rounded-xl py-2 px-0.5 text-center transition-all ${active ? "bg-white dark:bg-zinc-800 shadow-sm" : "hover:bg-white/50 dark:hover:bg-zinc-800/40"}`}>
                  <div className={`text-xs mb-0.5 ${active ? "text-neutral-900 dark:text-white font-bold" : "text-neutral-400"}`}>{t}</div>
                  <div className={`text-sm font-extrabold tabular-nums ${c ? sgn(c.return_pct) : "text-neutral-400"}`}>{c ? (c.return_pct >= 0 ? "+" : "") + c.return_pct + "%" : "-"}</div>
                  {c && <div className={`text-[10px] tabular-nums leading-tight ${sgn(c.ending - c.starting)}`}>{pm(c.ending - c.starting, tu)}</div>}
                </button>
              );
            })}
          </div>

          {/* ── 카테고리 요약 ── */}
          {cat && (
            <div className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 mb-5 flex items-end justify-between">
              <div>
                <div className="text-xs text-neutral-400">
                  {cat.name} · 시작 {usd ? money(cat.starting, true) : man(cat.starting) + "원"} · 감시 {cat.count}종목
                </div>
                <div className="text-2xl font-extrabold tabular-nums mt-1 text-neutral-950 dark:text-white">{money(cat.ending, usd)}</div>
                <div className="text-xs mt-0.5"><span className="text-neutral-400">평가손익 </span><b className={`tabular-nums ${sgn(cat.ending - cat.starting)}`}>{pm(cat.ending - cat.starting, usd)}</b></div>
              </div>
              <Chg n={cat.return_pct} big />
            </div>
          )}

          {/* ── 현재 보유 ── */}
          {openPos.length > 0 && (
            <section className="mb-6">
              <H2>현재 보유</H2>
              <div className="space-y-2">
                {openPos.map((p) => {
                  const up = (p.unrealized_pnl_pct ?? 0) >= 0;
                  const amt = ((p.cur_price ?? p.entry_price ?? 0) - (p.entry_price ?? 0)) * (p.qty ?? 0);
                  return (
                    <div key={p.sym} className="rounded-xl border border-l-[3px] border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-3.5"
                      style={{ borderLeftColor: up ? "#10b981" : "#ef4444" }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{withCode(p.nm, p.sym)}</span>
                        <span className="flex items-center gap-2">
                          <span className={`text-sm font-bold tabular-nums ${sgn(amt)}`}>{pm(amt, usd)}</span>
                          <Chg n={p.unrealized_pnl_pct ?? 0} />
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-1.5">
                        매수 {money(p.entry_price ?? 0, usd)} × {qtyStr(p.qty ?? 0)} · 투자 <b className="text-neutral-600 dark:text-neutral-300">{money(p.invested ?? 0, usd)}</b>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        손절 <span className="text-neutral-600 dark:text-neutral-300">{money(p.stop_price ?? 0, usd)}</span>{p.take_profit ? <> · 목표 <span className="text-neutral-600 dark:text-neutral-300">{money(p.take_profit, usd)}</span></> : null} · {p.entry_time?.slice(0, 10)} 매수
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 거래 내역 ── */}
          {trades.length > 0 && (
            <section className="mb-6">
              <H2>거래 내역</H2>
              <div className="space-y-2">
                {trades.map((t, i) => {
                  const amt = t.pnl ?? ((t.exit_price ?? 0) - (t.entry_price ?? 0)) * (t.qty ?? 0);
                  return (
                  <div key={i} className="rounded-xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{withCode(t.nm, t.sym)}</span>
                      <span className="flex items-center gap-2">
                        <span className={`text-sm font-bold tabular-nums ${sgn(amt)}`}>{pm(amt, usd)}</span>
                        <Chg n={t.pnl_pct} />
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1.5"><b className="text-neutral-500">매수</b> {t.entry} · {money(t.entry_price ?? 0, usd)} × {qtyStr(t.qty ?? 0)}</div>
                    <div className="text-xs text-neutral-400 mt-0.5"><b className="text-neutral-500">매도</b> {t.exit} · {money(t.exit_price ?? 0, usd)} — {SELL_REASON[t.reason] || t.reason}</div>
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── 종목별 요약 ── */}
          {tradedSecs.length > 0 && (
            <section className="mb-6">
              <H2>{tab} 거래 종목</H2>
              <div className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 overflow-hidden overflow-x-auto">
                <table className="w-full text-xs min-w-[340px]">
                  <thead>
                    <tr className="text-neutral-400 bg-neutral-50 dark:bg-zinc-900/60">
                      <th className="text-left font-medium py-2.5 px-3">종목</th>
                      <th className="text-right font-medium px-2">실현손익</th>
                      <th className="text-right font-medium px-2">거래</th>
                      <th className="text-right font-medium px-3">승률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800">
                    {tradedSecs.map((s) => (
                      <tr key={s.symbol}>
                        <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-200">
                          <button onClick={() => toggleFav(s.symbol)} aria-label="관심종목" className="mr-1.5 align-middle text-[13px] leading-none" style={{ color: favs.includes(s.symbol) ? ORANGE : "#cbd5e1" }}>
                            {favs.includes(s.symbol) ? "★" : "☆"}
                          </button>
                          {withCode(s.name, s.symbol)}
                        </td>
                        <td className={`text-right px-2 tabular-nums font-semibold ${sgn(s.realized_pnl)}`}>{(s.realized_pnl >= 0 ? "+" : "") + won(s.realized_pnl)}</td>
                        <td className="text-right px-2 tabular-nums text-neutral-400">{s.trades}</td>
                        <td className="text-right px-3 tabular-nums text-neutral-400">{s.win_rate_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {openPos.length === 0 && trades.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 p-5 text-center text-[13px] text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              아직 <b>{tab}</b>에서 거래한 종목이 없어요.<br />좋은 매수 신호(상승 흐름 + 신고가 돌파)가 나오면 자동으로 사고 여기 표시됩니다.
            </div>
          )}

          {/* ── 작업 기록 ── */}
          {d.recent_runs && d.recent_runs.length > 0 && (
            <section className="mb-6">
              <H2 sub="봇이 점검한 시각">작업 기록</H2>
              <div className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 divide-y divide-neutral-100 dark:divide-zinc-800 overflow-hidden">
                {d.recent_runs.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      <span className="text-neutral-400 mr-2 tabular-nums">{r.time?.slice(5, 16)}</span>
                      {r.watching ?? 0}종목 점검 · {r.holding ?? 0}종 보유
                      {r.new_trades ? <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: ORANGE }}>신규 {r.new_trades}</span> : null}
                    </span>
                    <span className="tabular-nums text-neutral-500 dark:text-neutral-300">
                      {won(r.total ?? 0)} <span className={`font-semibold ${sgn(r.ret ?? 0)}`}>{(r.ret ?? 0) >= 0 ? "+" : ""}{r.ret ?? 0}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 더 알아보기 ── */}
          <div className="mt-8 mb-2 text-xs font-bold text-neutral-400">더 알아보기</div>
          <div className="space-y-2">
            <details className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-4 text-[13px] text-neutral-600 dark:text-neutral-300">
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

            <details className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-4 text-[13px] text-neutral-600 dark:text-neutral-300">
              <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">솔직하게 — 봇이 할 수 있는 것 / 없는 것</summary>
              <ul className="mt-3 space-y-2 leading-relaxed list-disc pl-5">
                <li>목표는 “시장을 이기는 것”이 아니라 “크게 잃지 않는 것(낙폭 관리)”입니다.</li>
                <li>과거엔 그냥 들고 있기(존버)가 봇보다 훨씬 많이 벌었어요 — 대신 중간에 -50%대 폭락도 다 견뎌야 했죠.</li>
                <li>봇은 손실을 작게 끊는 대신 큰 상승을 다 먹진 못해요(수익과 안전은 맞바꿈).</li>
                <li>과거 성과는 미래를 보장하지 않습니다. “안 잃기”는 불가능합니다.</li>
              </ul>
            </details>

            <details className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-4 text-[13px] text-neutral-600 dark:text-neutral-300">
              <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">용어가 헷갈려요</summary>
              <ul className="mt-3 space-y-2 leading-relaxed">
                <li><b style={{ color: ORANGE }}>수익률</b> — 투자한 돈 대비 번 비율. +면 이익, -면 손실.</li>
                <li><b style={{ color: ORANGE }}>승률</b> — 전체 거래 중 이긴 거래의 비율. 10번 중 6번 수익이면 60%.</li>
                <li><b style={{ color: ORANGE }}>손절선 / 목표가</b> — 손절선은 ‘여기까지 떨어지면 판다’(수익 나면 위로 따라 올라감). 목표가는 참고용 — 닿아도 바로 안 팔고 추세 끝까지 따라가요.</li>
                <li><b style={{ color: ORANGE }}>모의(페이퍼)</b> — 진짜 돈이 아니라 실제 시세로 하는 연습 매매.</li>
              </ul>
            </details>
          </div>

          <p className="text-xs text-neutral-400 text-center mt-6">마지막 업데이트 {d.generated_at} · 4시간마다 자동 갱신</p>
          <p className="text-xs text-neutral-400 text-center mt-1">정보 제공용이며 투자 권유가 아닙니다. 투자 책임은 본인에게 있습니다.</p>
        </>
      )}
    </main>
  );
}
