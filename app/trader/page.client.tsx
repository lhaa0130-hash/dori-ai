"use client";

import { useEffect, useRef, useState } from "react";

const ORANGE = "#F9954E";
const TABS = ["국내주식", "해외주식", "코인"] as const;

const SELL_REASON: Record<string, string> = {
  stop_loss: "손절선까지 떨어져 매도 — 손실을 작게 끊음",
  trailing_stop: "고점 대비 내려와 매도 — 벌어둔 수익 지킴",
  take_profit: "목표 수익 도달 매도",
  signal: "신호 종료(추세 꺾임/회복)로 매도",
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
interface Strategy {
  key: string; name: string; desc: string; verified: boolean;
  starting: number; ending: number; return_pct: number; holding: number; trades: number;
  categories: Category[]; sections: Section[];
}
interface Lb { key: string; name: string; return_pct: number; ending: number; holding: number; verified: boolean; }
interface RecentRun { time: string; watching?: number; best?: string; best_ret?: number; total?: number; }
interface Data {
  program: string; generated_at: string; mode: string; multi?: boolean;
  usdkrw?: number; watching?: number; interval_hours?: number; capital_each?: number;
  test_period?: { start: string; end: string };
  total_starting?: number; total_ending?: number; total_return_pct?: number;
  leaderboard?: Lb[]; strategies?: Strategy[]; recent_runs?: RecentRun[];
}

const won = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";
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
const pm = (n: number, usd: boolean) => (n >= 0 ? "+" : "−") + money(Math.abs(n), usd);

function Chg({ n, big = false }: { n: number; big?: boolean }) {
  const up = n >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full font-bold tabular-nums ${big ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"} ${
      up ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
      <span className="text-[0.8em] leading-none">{up ? "▲" : "▼"}</span>{Math.abs(n)}%
    </span>
  );
}
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
  const [selStrat, setSelStrat] = useState<string>("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("해외주식");
  const [now, setNow] = useState<number>(() => Date.now());
  const userPicked = useRef(false);

  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => {
    const loadLs = () => {
      try { const f = JSON.parse(localStorage.getItem("trader_favs") || "[]"); if (Array.isArray(f)) setFavs(f); } catch { /* */ }
    };
    loadLs();
    window.addEventListener("dori-project-synced", loadLs);
    return () => window.removeEventListener("dori-project-synced", loadLs);
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
          if (!userPicked.current && j.strategies?.length) {
            const key = j.leaderboard?.[0]?.key || j.strategies[0].key;
            setSelStrat(key);
            const sg = j.strategies.find((s) => s.key === key);
            if (sg) {
              let best: (typeof TABS)[number] | null = null, n = 0;
              for (const t of TABS) { const c = sg.sections.filter((s) => s.category === t && s.open_position).length; if (c > n) { n = c; best = t; } }
              if (best) setTab(best);
            }
          }
        })
        .catch(() => setErr(true));
    load();
    const poll = setInterval(load, 60000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, []);

  const pickStrat = (key: string) => {
    userPicked.current = true; setSelStrat(key);
    const sg = d?.strategies?.find((s) => s.key === key);
    if (sg) { let best: (typeof TABS)[number] | null = null, n = 0; for (const t of TABS) { const c = sg.sections.filter((s) => s.category === t && s.open_position).length; if (c > n) { n = c; best = t; } } setTab(best || "해외주식"); }
  };

  const gen = d ? new Date(d.generated_at.replace(" ", "T")).getTime() : 0;
  const ms = now - gen;
  const interval = (d?.interval_hours ?? 4) * 3600 * 1000;
  const left = Math.max(0, gen + interval - now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const cd = `${pad(Math.floor(left / 3600000))}:${pad(Math.floor((left % 3600000) / 60000))}:${pad(Math.floor((left % 60000) / 1000))}`;
  const alive = d ? ms < interval + 3600 * 1000 : false;
  const minAgo = Math.max(0, Math.floor(ms / 60000));
  const agoStr = minAgo < 1 ? "방금" : minAgo < 60 ? `${minAgo}분 전` : `${Math.floor(minAgo / 60)}시간 ${minAgo % 60}분 전`;
  const beforeLaunch = now < new Date("2026-07-01T00:00:00").getTime();

  const strat = d?.strategies?.find((s) => s.key === selStrat) || d?.strategies?.[0];
  const secs = strat ? strat.sections.filter((s) => s.category === tab) : [];
  const cat = strat?.categories.find((c) => c.name === tab);
  const usd = tab === "해외주식";
  const openPos = secs.filter((s) => s.open_position).map((s) => ({ sym: s.symbol, nm: s.name || s.symbol, ...(s.open_position as OpenPos) }));
  // 거래 내역 = 매수·매도 타임라인. 아직 안 판(보유중) 매수도 함께 보여준다(완료된 청산만 보이면 "매매 안 한 것처럼" 보여서).
  type Txn = { sym: string; nm: string; open: boolean; entry: string; entry_price?: number; qty?: number; exit?: string; exit_price?: number; reason?: string; pnl: number; pnl_pct: number; when: string; };
  const txns: Txn[] = secs.flatMap((s) => {
    const rows: Txn[] = (s.trade_log || []).map((t) => ({
      sym: s.symbol, nm: s.name || s.symbol, open: false,
      entry: t.entry, entry_price: t.entry_price, qty: t.qty,
      exit: t.exit, exit_price: t.exit_price, reason: t.reason,
      pnl: t.pnl ?? 0, pnl_pct: t.pnl_pct, when: t.exit,
    }));
    const p = s.open_position;
    if (p) rows.push({
      sym: s.symbol, nm: s.name || s.symbol, open: true,
      entry: p.entry_time || "", entry_price: p.entry_price, qty: p.qty,
      pnl: ((p.cur_price ?? p.entry_price ?? 0) - (p.entry_price ?? 0)) * (p.qty ?? 0),
      pnl_pct: p.unrealized_pnl_pct ?? 0, when: p.entry_time || "",
    });
    return rows;
  }).sort((a, b) => (a.when < b.when ? 1 : -1)).slice(0, 40);
  const tradedSecs = secs.filter((s) => s.trades > 0 || s.open_position);

  return (
    <main className="w-full min-h-screen max-w-2xl mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-neutral-950 dark:text-white">
          트레이더일로 <span style={{ color: ORANGE }}>(Trader Illo)</span>
        </h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">5개 AI 전략이 각 300만원으로 겨루는 자동매매 대결.</p>
        {beforeLaunch && (
          <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 mt-2.5 text-xs font-bold" style={{ background: "rgba(249,149,78,0.12)", color: ORANGE }}>
            🎉 7월 1일 정식 오픈 · 지금은 모의 테스트 중
          </div>
        )}
      </header>

      {err && <div className="text-sm text-neutral-400 py-16 text-center">아직 데이터가 없습니다. 곧 업데이트됩니다.</div>}
      {!err && !d && <div className="text-sm text-neutral-400 py-16 text-center">불러오는 중…</div>}

      {d && d.strategies?.length && d.leaderboard?.length && (
        <>
          {/* 상태 */}
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="inline-flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${alive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className={alive ? "text-neutral-500" : "text-amber-600 dark:text-amber-400 font-medium"}>{alive ? "작동중" : "대기중"}</span>
              <span className="text-neutral-400">· 모의투자 · 각 300만원 · 4시간마다</span>
            </span>
            <span className="text-neutral-400">{alive ? <>다음 점검 <b className="tabular-nums text-neutral-600 dark:text-neutral-300">{cd}</b></> : null}</span>
          </div>

          {/* ── 리더보드 (전략 대결) ── */}
          <H2 sub={`${dot(d.test_period?.start || "")}~${dot(d.test_period?.end || "")}`}>전략 순위 🏆</H2>
          <div className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 divide-y divide-neutral-100 dark:divide-zinc-800 overflow-hidden mb-2">
            {d.leaderboard.map((s, i) => {
              const sel = (strat?.key ?? "") === s.key;
              const pnl = (d.strategies!.find((x) => x.key === s.key)?.ending ?? 0) - (d.strategies!.find((x) => x.key === s.key)?.starting ?? 0);
              return (
                <button key={s.key} onClick={() => pickStrat(s.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-3 text-left transition-colors ${sel ? "bg-[#F9954E]/[0.07]" : "hover:bg-neutral-50 dark:hover:bg-zinc-900/40"}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${i === 0 ? "text-white" : "text-neutral-500 bg-neutral-100 dark:bg-zinc-800"}`} style={i === 0 ? { background: ORANGE } : undefined}>{i + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className={`text-sm font-bold ${sel ? "text-[#F9954E]" : "text-neutral-800 dark:text-neutral-100"}`}>{s.name}</span>
                      {!s.verified && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-400">실험</span>}
                    </span>
                    <span className="block text-[11px] text-neutral-400 tabular-nums">보유 {s.holding}종 · {pm(pnl, false)}</span>
                  </span>
                  <Chg n={s.return_pct} />
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-400 mb-5 px-1">전략을 눌러 상세 보기 · ‘실험’ = 장기검증 전인 전략</p>

          {/* ── 선택 전략 상세 ── */}
          {strat && (
            <>
              <div className="rounded-2xl border border-[#F9954E]/20 bg-gradient-to-b from-[#F9954E]/[0.06] to-transparent p-4 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-neutral-950 dark:text-white">{strat.name}</span>
                  <Chg n={strat.return_pct} big />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{strat.desc}</p>
                <div className="text-xs mt-2"><span className="text-neutral-400">평가손익 </span><b className={`tabular-nums ${sgn(strat.ending - strat.starting)}`}>{pm(strat.ending - strat.starting, false)}</b><span className="text-neutral-400"> · 보유 {strat.holding}종 · 청산 {strat.trades}건</span></div>
              </div>

              {/* 카테고리 탭 */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-zinc-900 mb-4">
                {TABS.map((t) => {
                  const c = strat.categories.find((x) => x.name === t);
                  const active = t === tab;
                  return (
                    <button key={t} onClick={() => setTab(t)}
                      className={`rounded-xl py-2 text-center transition-all ${active ? "bg-white dark:bg-zinc-800 shadow-sm" : "hover:bg-white/50 dark:hover:bg-zinc-800/40"}`}>
                      <div className={`text-xs mb-0.5 ${active ? "text-neutral-900 dark:text-white font-bold" : "text-neutral-400"}`}>{t}</div>
                      <div className={`text-sm font-extrabold tabular-nums ${c ? sgn(c.return_pct) : "text-neutral-400"}`}>{c ? (c.return_pct >= 0 ? "+" : "") + c.return_pct + "%" : "-"}</div>
                    </button>
                  );
                })}
              </div>

              {cat && (
                <div className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 mb-5 flex items-end justify-between">
                  <div>
                    <div className="text-xs text-neutral-400">{cat.name} · 시작 {usd ? money(cat.starting, true) : man(cat.starting) + "원"} · 감시 {cat.count}종목{usd && cat.fx ? ` · 환율 ${cat.fx.toLocaleString()}` : ""}</div>
                    <div className="text-2xl font-extrabold tabular-nums mt-1 text-neutral-950 dark:text-white">{money(cat.ending, usd)}</div>
                    <div className="text-xs mt-0.5"><span className="text-neutral-400">평가손익 </span><b className={`tabular-nums ${sgn(cat.ending - cat.starting)}`}>{pm(cat.ending - cat.starting, usd)}</b></div>
                  </div>
                  <Chg n={cat.return_pct} big />
                </div>
              )}

              {/* 현재 보유 */}
              {openPos.length > 0 && (
                <section className="mb-6">
                  <H2>현재 보유</H2>
                  <div className="space-y-2">
                    {openPos.map((p) => {
                      const up = (p.unrealized_pnl_pct ?? 0) >= 0;
                      const amt = ((p.cur_price ?? p.entry_price ?? 0) - (p.entry_price ?? 0)) * (p.qty ?? 0);
                      return (
                        <div key={p.sym} className="rounded-xl border border-l-[3px] border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-3.5" style={{ borderLeftColor: up ? "#10b981" : "#ef4444" }}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{withCode(p.nm, p.sym)}</span>
                            <span className="flex items-center gap-2"><span className={`text-sm font-bold tabular-nums ${sgn(amt)}`}>{pm(amt, usd)}</span><Chg n={p.unrealized_pnl_pct ?? 0} /></span>
                          </div>
                          <div className="text-xs text-neutral-400 mt-1.5">매수 {money(p.entry_price ?? 0, usd)} × {qtyStr(p.qty ?? 0)} · 투자 <b className="text-neutral-600 dark:text-neutral-300">{money(p.invested ?? 0, usd)}</b></div>
                          <div className="text-xs text-neutral-400 mt-0.5">손절 <span className="text-neutral-600 dark:text-neutral-300">{money(p.stop_price ?? 0, usd)}</span>{p.take_profit ? <> · 목표 <span className="text-neutral-600 dark:text-neutral-300">{money(p.take_profit, usd)}</span></> : null} · {p.entry_time?.slice(0, 10)} 매수</div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 거래 내역 (매수·매도 타임라인 — 아직 안 판 매수도 '보유중'으로 표시) */}
              {txns.length > 0 && (
                <section className="mb-6">
                  <H2 sub="매수·매도 기록">거래 내역</H2>
                  <div className="space-y-2">
                    {txns.map((t, i) => (
                      <div key={i} className="rounded-xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100 truncate">{withCode(t.nm, t.sym)}</span>
                            {t.open && <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">보유중</span>}
                          </span>
                          <span className="flex items-center gap-2 flex-shrink-0"><span className={`text-sm font-bold tabular-nums ${sgn(t.pnl)}`}>{pm(t.pnl, usd)}</span><Chg n={t.pnl_pct} /></span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-1.5"><b className="text-emerald-600 dark:text-emerald-500">매수</b> {t.entry} · {money(t.entry_price ?? 0, usd)} × {qtyStr(t.qty ?? 0)}</div>
                        {t.open
                          ? <div className="text-xs text-neutral-400 mt-0.5"><b className="text-emerald-600 dark:text-emerald-400">보유중</b> · 아직 팔지 않음 (위 손익은 평가손익)</div>
                          : <div className="text-xs text-neutral-400 mt-0.5"><b className="text-red-500">매도</b> {t.exit} · {money(t.exit_price ?? 0, usd)} — {SELL_REASON[t.reason || ""] || t.reason}</div>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 종목별 요약 */}
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
                              <button onClick={() => toggleFav(s.symbol)} aria-label="관심종목" className="mr-1.5 align-middle text-[13px] leading-none" style={{ color: favs.includes(s.symbol) ? ORANGE : "#cbd5e1" }}>{favs.includes(s.symbol) ? "★" : "☆"}</button>
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

              {txns.length === 0 && (
                <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 p-5 text-center text-[13px] text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
                  <b>{strat.name}</b>이 아직 <b>{tab}</b>에서 산 게 없어요.<br />이 전략의 매수 조건에 맞는 종목이 나오면 자동으로 사고 표시됩니다.
                </div>
              )}
            </>
          )}

          {/* 작업 기록 */}
          {d.recent_runs && d.recent_runs.length > 0 && (
            <section className="mb-6">
              <H2 sub="봇이 점검한 시각">작업 기록</H2>
              <div className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 divide-y divide-neutral-100 dark:divide-zinc-800 overflow-hidden">
                {d.recent_runs.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400"><span className="text-neutral-400 mr-2 tabular-nums">{r.time?.slice(5, 16)}</span>{r.watching ?? 0}종목 점검</span>
                    <span className="tabular-nums text-neutral-500 dark:text-neutral-300">1위 <b style={{ color: ORANGE }}>{r.best}</b> <span className={`font-semibold ${sgn(r.best_ret ?? 0)}`}>{(r.best_ret ?? 0) >= 0 ? "+" : ""}{r.best_ret ?? 0}%</span></span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 더 알아보기 */}
          <div className="mt-8 mb-1 text-xs font-bold text-neutral-400">더 알아보기</div>
          <div className="space-y-2">
            <details className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-4 text-[13px] text-neutral-600 dark:text-neutral-300">
              <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">5개 전략은 뭐가 다른가요?</summary>
              <ul className="mt-3 space-y-2 leading-relaxed">
                <li><b style={{ color: ORANGE }}>추세추종</b> — 상승추세에서 20일 신고가를 돌파할 때 매수(큰 흐름 타기). <b>유일하게 장기검증된</b> 전략.</li>
                <li><b style={{ color: ORANGE }}>돌파</b> — 20일 신고가를 강하게 뚫을 때 매수, 10일 신저가 이탈 시 매도.</li>
                <li><b style={{ color: ORANGE }}>평균회귀</b> — 상승추세의 눌림목(과매도)에서 싸게 매수, 회복하면 매도.</li>
                <li><b style={{ color: ORANGE }}>모멘텀</b> — 최근 60일 가장 강하게 오른 종목을 추격(상대강도).</li>
                <li><b style={{ color: ORANGE }}>안정형</b> — 상승추세 중 ‘덜 출렁이는’ 저변동성 종목 위주, 타이트한 손절.</li>
                <li className="text-neutral-400">돌파·평균회귀·모멘텀·안정형은 <b>실험적</b>(장기검증 전)이라, 5개를 나란히 돌려 어느 게 잘 맞는지 비교하는 거예요.</li>
              </ul>
            </details>

            <details className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-4 text-[13px] text-neutral-600 dark:text-neutral-300">
              <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">이 페이지, 어떻게 보나요? (이용 방법)</summary>
              <ul className="mt-3 space-y-2 leading-relaxed list-disc pl-5">
                <li>맨 위 <b>전략 순위</b>에서 어느 전략이 잘하는지 한눈에 봐요. 전략을 누르면 상세가 열려요.</li>
                <li>전략 안에서 <b>코인·국내·해외</b> 탭으로 나눠 보고, 종목별 매수가·손절선·손익까지 확인해요.</li>
                <li>표에서 <b>★</b>를 누르면 관심 종목으로 표시돼요(로그인하면 계정에 저장).</li>
                <li>⚠️ <b>직접 매매하는 서비스가 아니라, 봇의 결과를 보여주는 페이지</b>예요 — 투자 참고·학습용입니다.</li>
              </ul>
            </details>

            <details className="rounded-2xl border border-amber-300/40 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/10 p-4 text-[13px] text-neutral-600 dark:text-neutral-300">
              <summary className="cursor-pointer font-bold text-amber-700 dark:text-amber-400">⚠️ 투자 주의사항 (꼭 읽어주세요)</summary>
              <ul className="mt-3 space-y-2 leading-relaxed list-disc pl-5">
                <li><b>원금 손실 위험</b>이 있어요. 어떤 전략도 손실을 100% 막지 못합니다.</li>
                <li><b>과거 성과 ≠ 미래 수익.</b> 지금 1위가 앞으로도 1위라는 보장은 없어요.</li>
                <li>지금 수치는 <b>모의(가짜 돈) 결과</b>라 실제 매매와 다를 수 있어요(수수료·체결·세금 차이).</li>
                <li>실험 전략(돌파·평균회귀·모멘텀·안정형)은 <b>장기검증 전</b>이라 더 불안정할 수 있어요.</li>
                <li>이 페이지는 <b>투자 권유가 아니라 정보 제공</b>입니다. 투자 결정과 책임은 <b>본인</b>에게 있어요.</li>
              </ul>
            </details>

            <details className="rounded-2xl border border-neutral-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-4 text-[13px] text-neutral-600 dark:text-neutral-300">
              <summary className="cursor-pointer font-bold text-neutral-800 dark:text-neutral-100">용어가 헷갈려요</summary>
              <ul className="mt-3 space-y-2 leading-relaxed">
                <li><b style={{ color: ORANGE }}>수익률</b> — 투자한 돈 대비 번 비율. +면 이익, -면 손실.</li>
                <li><b style={{ color: ORANGE }}>승률</b> — 전체 거래 중 이긴 거래의 비율. 10번 중 6번 수익이면 60%.</li>
                <li><b style={{ color: ORANGE }}>손절선 / 목표가</b> — 손절선은 ‘여기까지 떨어지면 판다’. 목표가는 참고용(닿아도 바로 안 팖).</li>
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
