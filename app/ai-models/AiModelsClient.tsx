"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ORANGE = "#F9954E";

interface RawModel { name: string; provider?: string; reqM?: number | null; req?: number | null; tps?: number | null; pin?: number | null; pout?: number | null; intel?: number | null; }
interface Stats { updatedAt?: string; usageTop?: RawModel[]; speedTop?: RawModel[]; priceTop?: RawModel[]; intelTop?: { name: string; score: number }[]; }
interface Model { name: string; provider: string; reqM: number | null; tps: number | null; pin: number | null; pout: number | null; intel: number | null; }

type SortKey = "cost" | "reqM" | "intel" | "tps" | "pin" | "pout";
type Locale = "ko" | "en";

const norm = (s: string) => String(s || "").toLowerCase().replace(/^[^:]+:\s*/, "").replace(/[\s\-_.()]/g, "");
function usd(v: number | null) { if (v == null) return "—"; if (v === 0) return "$0"; if (v < 0.01) return "$" + v.toFixed(4); if (v < 1) return "$" + v.toFixed(3); if (v < 1000) return "$" + v.toFixed(2); return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
function num(v: number | null, suffix = "") { return v == null ? "—" : v.toLocaleString() + suffix; }

const COL_KEYS: { key: SortKey; defAsc: boolean }[] = [
  { key: "cost", defAsc: true },
  { key: "reqM", defAsc: false },
  { key: "intel", defAsc: false },
  { key: "tps", defAsc: false },
  { key: "pin", defAsc: true },
  { key: "pout", defAsc: true },
];

// ── 다국어 문자열 ──────────────────────────────────────────────
const STRINGS: Record<Locale, {
  eyebrow: string; h1a: string; h1b: string; heroPre: string; heroBold: string; heroPost: string;
  errText: string; loading: string;
  hiCheap: string; hiUsed: string; hiSmart: string; perM: string; reqDay: string; ptsSub: string;
  calc: string; inTok: string; outTok: string; calls: string; unitTok: string; unitCall: string; calcHint: string;
  compare: string; bySuffix: string; saveImg: string; colModel: string; dataNote: string;
  ctaTools: (n: number) => string; ctaInsight: string;
  faqTitle: string; faq: [string, string][];
  cols: Record<SortKey, { label: string; hint: string }>;
  pts: string; tps: string;
  cardTitle: string; cardSub: string; cardFoot: string;
  switchTo: string; switchHref: string;
}> = {
  ko: {
    eyebrow: "AI 모델", h1a: "AI 모델 가격 비교 ·", h1b: "실시간 비용 계산기",
    heroPre: "전 세계에서 가장 많이 쓰는 AI 모델의 ", heroBold: "사용량 · 지능 · 속도 · 가격", heroPost: "을 한눈에. 토큰 수만 넣으면 모델별 월 비용을 자동 계산해드려요.",
    errText: "데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.", loading: "불러오는 중…",
    hiCheap: "💰 가장 저렴", hiUsed: "🔥 사용량 1위", hiSmart: "🧠 가장 똑똑", perM: "/100만", reqDay: "M 요청/일", ptsSub: "점",
    calc: "비용 계산기", inTok: "1회 입력 토큰", outTok: "1회 출력 토큰", calls: "월 호출 횟수", unitTok: "토큰", unitCall: "회",
    calcHint: "예: 입력 1,000 · 출력 1,000 토큰을 월 1,000번 호출 시 모델별 월 비용 = 아래 표 정렬됨",
    compare: "📊 모델 비교", bySuffix: "순", saveImg: "📸 순위 이미지 저장", colModel: "모델",
    dataNote: "데이터: OpenRouter 실사용 통계 · 자동 갱신 · 가격은 100만 토큰당 USD",
    ctaTools: (n) => `AI 도구 ${n}개 보기 →`, ctaInsight: "AI 트렌드 인사이트 →",
    faqTitle: "자주 묻는 질문",
    faq: [
      ["가격은 어떻게 계산되나요?", "각 모델의 입력·출력 100만 토큰당 단가(OpenRouter 기준)에, 입력하신 토큰 수와 월 호출 횟수를 곱해 월 예상 비용을 계산합니다."],
      ["데이터는 얼마나 최신인가요?", "OpenRouter의 실제 사용량·가격 데이터를 자동으로 수시 갱신합니다. 원천 데이터가 바뀌는 즉시 반영돼요."],
      ["사용량 순위는 무슨 기준인가요?", "전 세계 개발자들이 OpenRouter를 통해 실제로 보낸 요청량(하루 백만 건 단위) 기준입니다."],
    ],
    cols: {
      cost: { label: "월 예상비용", hint: "입력값 기준" }, reqM: { label: "사용량", hint: "백만 요청/일" },
      intel: { label: "지능", hint: "벤치 점수" }, tps: { label: "속도", hint: "토큰/초" },
      pin: { label: "입력가", hint: "$/100만" }, pout: { label: "출력가", hint: "$/100만" },
    },
    pts: "점", tps: " t/s",
    cardTitle: "전 세계 AI 모델 순위", cardSub: " 기준 · TOP 8", cardFoot: "illo.im/ai-models · 자동 갱신",
    switchTo: "EN", switchHref: "/en/ai-models",
  },
  en: {
    eyebrow: "AI MODELS", h1a: "AI Model Price Comparison &", h1b: "Live Cost Calculator",
    heroPre: "Compare the world's most-used AI models by ", heroBold: "usage · intelligence · speed · price", heroPost: " at a glance. Just enter your token counts to auto-calculate each model's monthly cost.",
    errText: "Couldn't load the data. Please try again in a moment.", loading: "Loading…",
    hiCheap: "💰 Cheapest", hiUsed: "🔥 Most used", hiSmart: "🧠 Smartest", perM: "/1M", reqDay: "M req/day", ptsSub: " pts",
    calc: "Cost Calculator", inTok: "Input tokens / call", outTok: "Output tokens / call", calls: "Calls / month", unitTok: "tokens", unitCall: "calls",
    calcHint: "e.g. 1,000 input · 1,000 output tokens × 1,000 calls/month → monthly cost per model, sorted below",
    compare: "📊 Model Comparison", bySuffix: "", saveImg: "📸 Save ranking image", colModel: "Model",
    dataNote: "Data: OpenRouter real usage stats · auto-updated · prices in USD per 1M tokens",
    ctaTools: (n) => `Browse ${n} AI tools →`, ctaInsight: "AI trend insights →",
    faqTitle: "Frequently Asked Questions",
    faq: [
      ["How is the price calculated?", "We multiply each model's per-1M-token input/output price (from OpenRouter) by your token counts and monthly call volume to estimate the monthly cost."],
      ["How fresh is the data?", "We continuously auto-update OpenRouter's real usage and pricing data. Changes are reflected as soon as the source updates."],
      ["What is the usage ranking based on?", "It's based on the actual request volume (in millions per day) that developers worldwide send through OpenRouter."],
    ],
    cols: {
      cost: { label: "Monthly cost", hint: "by your input" }, reqM: { label: "Usage", hint: "M req/day" },
      intel: { label: "Intelligence", hint: "bench score" }, tps: { label: "Speed", hint: "tokens/sec" },
      pin: { label: "Input price", hint: "$/1M" }, pout: { label: "Output price", hint: "$/1M" },
    },
    pts: " pts", tps: " t/s",
    cardTitle: "Global AI Model Ranking", cardSub: " · TOP 8", cardFoot: "illo.im/en/ai-models · auto-updated",
    switchTo: "한국어", switchHref: "/ai-models",
  },
};

export default function AiModelsClient({ locale = "ko" }: { locale?: Locale }) {
  const t = STRINGS[locale];
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState(false);
  const [inTok, setInTok] = useState(1000);
  const [outTok, setOutTok] = useState(1000);
  const [calls, setCalls] = useState(1000);
  const [sort, setSort] = useState<SortKey>("cost");
  const [asc, setAsc] = useState(true);

  useEffect(() => {
    // 실시간 엣지 함수 우선 → 실패 시 정적 JSON 폴백
    fetch("/api/openrouter")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch(() => fetch("/openrouter-stats.json").then((r) => (r.ok ? r.json() : Promise.reject())))
      .then(setStats)
      .catch(() => setErr(true));
  }, []);

  const models = useMemo<Model[]>(() => {
    if (!stats) return [];
    const map = new Map<string, Model>();
    const add = (arr?: RawModel[]) => {
      (arr || []).forEach((m) => {
        if (!m || !m.name) return;
        const k = norm(m.name);
        const ex = map.get(k);
        const cur: Model = { name: m.name, provider: m.provider || "", reqM: m.reqM ?? null, tps: m.tps ?? null, pin: m.pin ?? null, pout: m.pout ?? null, intel: m.intel ?? null };
        if (!ex) map.set(k, cur);
        else { ex.reqM = ex.reqM ?? cur.reqM; ex.tps = ex.tps ?? cur.tps; ex.pin = ex.pin ?? cur.pin; ex.pout = ex.pout ?? cur.pout; ex.intel = ex.intel ?? cur.intel; if (!ex.provider) ex.provider = cur.provider; }
      });
    };
    add(stats.usageTop); add(stats.priceTop); add(stats.speedTop);
    const intelMap = new Map<string, number>();
    (stats.intelTop || []).forEach((i) => intelMap.set(norm(i.name), i.score));
    map.forEach((m) => { if (m.intel == null) { const s = intelMap.get(norm(m.name)); if (s != null) m.intel = s; } });
    return [...map.values()];
  }, [stats]);

  const cost = (m: Model) => (m.pin == null || m.pout == null ? null : ((inTok * m.pin + outTok * m.pout) / 1e6) * calls);

  const rows = useMemo(() => {
    const list = models.map((m) => ({ m, c: cost(m) }));
    const val = (x: { m: Model; c: number | null }) => (sort === "cost" ? x.c : ((x.m as any)[sort] as number | null));
    return list.sort((a, b) => { const av = val(a), bv = val(b); if (av == null && bv == null) return 0; if (av == null) return 1; if (bv == null) return -1; return asc ? av - bv : bv - av; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, sort, asc, inTok, outTok, calls]);

  const clickSort = (k: SortKey) => { if (k === sort) setAsc((v) => !v); else { setSort(k); setAsc(COL_KEYS.find((c) => c.key === k)!.defAsc); } };

  // 현재 정렬 기준 셀 텍스트
  const metricText = (m: Model, c: number | null): string => {
    switch (sort) {
      case "cost": return usd(c);
      case "reqM": return num(m.reqM, "M");
      case "intel": return m.intel != null ? m.intel + t.pts : "—";
      case "tps": return m.tps != null ? m.tps + t.tps : "—";
      case "pin": return usd(m.pin);
      case "pout": return usd(m.pout);
      default: return "";
    }
  };

  // 순위를 브랜드 PNG 카드로 저장 (커뮤니티 공유용 "짤")
  const downloadCard = () => {
    const W = 1080, H = 1080;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "#0b0b0d"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ORANGE; ctx.fillRect(0, 0, W, 14);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = ORANGE; ctx.font = "800 42px sans-serif"; ctx.fillText("illo", 70, 120);
    ctx.fillStyle = "#ffffff"; ctx.font = "800 60px sans-serif"; ctx.fillText(t.cardTitle, 70, 200);
    ctx.fillStyle = "#9CA3AF"; ctx.font = "600 32px sans-serif"; ctx.fillText(t.cols[sort].label + t.cardSub, 70, 252);
    let y = 350;
    rows.slice(0, 8).forEach((r, i) => {
      const name = r.m.name.replace(/^[^:]+:\s*/, "").slice(0, 26);
      ctx.fillStyle = i < 3 ? ORANGE : "#52525b"; ctx.font = "800 46px sans-serif"; ctx.fillText(String(i + 1), 72, y);
      ctx.fillStyle = "#ffffff"; ctx.font = "700 42px sans-serif"; ctx.fillText(name, 160, y);
      ctx.fillStyle = ORANGE; ctx.font = "800 42px sans-serif"; ctx.textAlign = "right"; ctx.fillText(metricText(r.m, r.c), W - 70, y); ctx.textAlign = "left";
      y += 86;
    });
    ctx.fillStyle = "#6b7280"; ctx.font = "600 30px sans-serif"; ctx.fillText(t.cardFoot, 70, H - 56);
    const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "ai-model-ranking.png"; a.click();
  };

  // 하이라이트 (싸다/많이쓴다/똑똑하다)
  const cheapest = useMemo(() => models.filter((m) => m.pin != null && m.pout != null).sort((a, b) => (a.pin! + a.pout!) - (b.pin! + b.pout!))[0], [models]);
  const mostUsed = useMemo(() => models.filter((m) => m.reqM != null).sort((a, b) => b.reqM! - a.reqM!)[0], [models]);
  const smartest = useMemo(() => models.filter((m) => m.intel != null).sort((a, b) => b.intel! - a.intel!)[0], [models]);

  const numInput = (v: number, set: (n: number) => void, label: string, unit: string) => (
    <label className="flex-1 min-w-[100px]">
      <span className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1">{label}</span>
      <div className="flex items-center gap-1 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-within:border-[#F9954E]">
        <input type="number" min={0} value={v} onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent text-[14px] font-bold text-stone-900 dark:text-white outline-none tabular-nums" />
        <span className="text-[11px] text-stone-400 whitespace-nowrap">{unit}</span>
      </div>
    </label>
  );

  return (
    <main className="w-full min-h-screen max-w-3xl mx-auto px-4">
      {/* 히어로 */}
      <section className="pt-8 pb-5 border-b border-stone-100 dark:border-zinc-900">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold text-[#F9954E] tracking-wide uppercase">{t.eyebrow}</p>
          <Link href={t.switchHref} hrefLang={locale === "en" ? "ko" : "en"}
            className="text-[11px] font-bold rounded-full border border-stone-200 dark:border-zinc-700 px-2.5 py-1 text-stone-500 dark:text-stone-400 hover:border-[#F9954E] hover:text-[#F9954E] transition-colors">
            🌐 {t.switchTo}
          </Link>
        </div>
        <h1 className="text-[30px] sm:text-[40px] font-extrabold text-stone-950 dark:text-white leading-[1.14] tracking-tight mb-2 break-keep">
          {t.h1a}<br />{t.h1b}
        </h1>
        <p className="text-[14px] text-stone-400 dark:text-stone-500 leading-relaxed break-keep">
          {t.heroPre}<b className="text-stone-600 dark:text-stone-300">{t.heroBold}</b>{t.heroPost}
        </p>
      </section>

      {err && (
        <p className="text-[13px] text-stone-400 py-10 text-center">{t.errText}</p>
      )}

      {!err && (
        <>
          {/* 하이라이트 3종 */}
          <section className="grid grid-cols-3 gap-2 pt-5">
            {[
              { t: t.hiCheap, m: cheapest, sub: cheapest ? usd((cheapest.pin || 0) + (cheapest.pout || 0)) + t.perM : "" },
              { t: t.hiUsed, m: mostUsed, sub: mostUsed && mostUsed.reqM != null ? mostUsed.reqM + t.reqDay : "" },
              { t: t.hiSmart, m: smartest, sub: smartest && smartest.intel != null ? smartest.intel + t.ptsSub : "" },
            ].map((h, i) => (
              <div key={i} className="rounded-2xl border border-stone-200 dark:border-zinc-800 p-3 bg-gradient-to-b from-[#F9954E]/5 to-transparent">
                <p className="text-[10.5px] font-bold text-stone-500 dark:text-stone-400 mb-1">{h.t}</p>
                <p className="text-[12.5px] font-extrabold text-stone-900 dark:text-white leading-tight line-clamp-2 min-h-[30px]">{h.m ? h.m.name.replace(/^[^:]+:\s*/, "") : "—"}</p>
                <p className="text-[10.5px] font-bold text-[#F9954E] mt-1">{h.sub}</p>
              </div>
            ))}
          </section>

          {/* 계산기 입력 */}
          <section className="mt-5 rounded-2xl border border-stone-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#F9954E]" />
              <h2 className="text-[14px] font-extrabold text-stone-900 dark:text-white">{t.calc}</h2>
              <span className="ml-auto text-[10.5px] font-bold text-[#F9954E]">● LIVE</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {numInput(inTok, setInTok, t.inTok, t.unitTok)}
              {numInput(outTok, setOutTok, t.outTok, t.unitTok)}
              {numInput(calls, setCalls, t.calls, t.unitCall)}
            </div>
            <p className="text-[11px] text-stone-400 mt-2">{t.calcHint}</p>
          </section>

          {/* 비교/계산 표 */}
          <section className="mt-4 pb-16">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[14px] font-extrabold text-stone-900 dark:text-white">{t.compare} <span className="text-[11px] font-medium text-stone-400">({t.cols[sort].label}{t.bySuffix})</span></h2>
              <button onClick={downloadCard} disabled={rows.length === 0}
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-stone-200 text-[12px] font-bold px-3 py-1.5 hover:border-[#F9954E] hover:text-[#F9954E] disabled:opacity-40 transition-colors">
                {t.saveImg}
              </button>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[640px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white dark:bg-black text-left text-[11px] font-bold text-stone-400 pb-2 pr-2">{t.colModel}</th>
                    {COL_KEYS.map((c) => (
                      <th key={c.key} onClick={() => clickSort(c.key)}
                        className="text-right text-[11px] font-bold pb-2 px-2 cursor-pointer select-none whitespace-nowrap hover:text-[#F9954E]"
                        style={{ color: sort === c.key ? ORANGE : undefined }}>
                        {t.cols[c.key].label}{sort === c.key ? (asc ? " ▲" : " ▼") : ""}
                        <span className="block text-[9px] font-medium text-stone-300 dark:text-stone-600">{t.cols[c.key].hint}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-[13px] text-stone-400 py-10">{t.loading}</td></tr>
                  )}
                  {rows.map(({ m, c }, i) => (
                    <tr key={m.name + i} className="border-t border-stone-100 dark:border-zinc-900">
                      <td className="sticky left-0 z-10 bg-white dark:bg-black py-2.5 pr-2">
                        <p className="text-[12.5px] font-bold text-stone-900 dark:text-white leading-tight line-clamp-1">{m.name.replace(/^[^:]+:\s*/, "")}</p>
                        {m.provider && <p className="text-[10px] text-stone-400 capitalize">{m.provider}</p>}
                      </td>
                      <td className="text-right px-2 text-[12.5px] font-extrabold tabular-nums" style={{ color: c != null ? ORANGE : undefined }}>{usd(c)}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-stone-600 dark:text-stone-300">{num(m.reqM, "M")}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-stone-600 dark:text-stone-300">{m.intel != null ? m.intel : "—"}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-stone-600 dark:text-stone-300">{num(m.tps)}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-stone-500">{usd(m.pin)}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-stone-500">{usd(m.pout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10.5px] text-stone-400 mt-3">{t.dataNote}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/ai-tools" className="inline-flex items-center gap-1 rounded-full bg-[#F9954E] text-white text-[12.5px] font-bold px-4 py-2">{t.ctaTools(343)}</Link>
              <Link href="/insight" className="inline-flex items-center gap-1 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-stone-300 text-[12.5px] font-bold px-4 py-2">{t.ctaInsight}</Link>
            </div>

            {/* FAQ (사람용 — JSON-LD는 서버에서 별도 주입) */}
            <div className="mt-8 space-y-3">
              <h2 className="text-[15px] font-extrabold text-stone-900 dark:text-white">{t.faqTitle}</h2>
              {t.faq.map(([q, a], i) => (
                <details key={i} className="rounded-xl border border-stone-200 dark:border-zinc-800 p-3">
                  <summary className="text-[13px] font-bold text-stone-900 dark:text-white cursor-pointer">{q}</summary>
                  <p className="text-[12.5px] text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
