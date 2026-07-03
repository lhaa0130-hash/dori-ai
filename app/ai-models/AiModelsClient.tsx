"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ORANGE = "#F9954E";

interface RawModel { name: string; provider?: string; reqM?: number | null; req?: number | null; tps?: number | null; pin?: number | null; pout?: number | null; intel?: number | null; }
interface Stats { updatedAt?: string; usageTop?: RawModel[]; speedTop?: RawModel[]; priceTop?: RawModel[]; intelTop?: { name: string; score: number }[]; }
interface Model { name: string; provider: string; reqM: number | null; tps: number | null; pin: number | null; pout: number | null; intel: number | null; }

type SortKey = "cost" | "reqM" | "intel" | "tps" | "pin" | "pout";

const norm = (s: string) => String(s || "").toLowerCase().replace(/^[^:]+:\s*/, "").replace(/[\s\-_.()]/g, "");
function usd(v: number | null) { if (v == null) return "—"; if (v === 0) return "$0"; if (v < 0.01) return "$" + v.toFixed(4); if (v < 1) return "$" + v.toFixed(3); if (v < 1000) return "$" + v.toFixed(2); return "$" + v.toLocaleString(undefined, { maximumFractionDigits: 0 }); }
function num(v: number | null, suffix = "") { return v == null ? "—" : v.toLocaleString() + suffix; }

const COLS: { key: SortKey; label: string; defAsc: boolean; hint: string }[] = [
  { key: "cost", label: "월 예상비용", defAsc: true, hint: "입력값 기준" },
  { key: "reqM", label: "사용량", defAsc: false, hint: "백만 요청/일" },
  { key: "intel", label: "지능", defAsc: false, hint: "벤치 점수" },
  { key: "tps", label: "속도", defAsc: false, hint: "토큰/초" },
  { key: "pin", label: "입력가", defAsc: true, hint: "$/100만" },
  { key: "pout", label: "출력가", defAsc: true, hint: "$/100만" },
];

const SORT_LABEL: Record<SortKey, string> = { cost: "월 예상비용", reqM: "사용량", intel: "지능", tps: "속도", pin: "입력가", pout: "출력가" };

export default function AiModelsClient() {
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

  const clickSort = (k: SortKey) => { if (k === sort) setAsc((v) => !v); else { setSort(k); setAsc(COLS.find((c) => c.key === k)!.defAsc); } };

  // 현재 정렬 기준 셀 텍스트
  const metricText = (m: Model, c: number | null): string => {
    switch (sort) {
      case "cost": return usd(c);
      case "reqM": return num(m.reqM, "M");
      case "intel": return m.intel != null ? m.intel + "점" : "—";
      case "tps": return m.tps != null ? m.tps + " t/s" : "—";
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
    ctx.fillStyle = "#ffffff"; ctx.font = "800 60px sans-serif"; ctx.fillText("전 세계 AI 모델 순위", 70, 200);
    ctx.fillStyle = "#9CA3AF"; ctx.font = "600 32px sans-serif"; ctx.fillText(SORT_LABEL[sort] + " 기준 · TOP 8", 70, 252);
    let y = 350;
    rows.slice(0, 8).forEach((r, i) => {
      const name = r.m.name.replace(/^[^:]+:\s*/, "").slice(0, 26);
      ctx.fillStyle = i < 3 ? ORANGE : "#52525b"; ctx.font = "800 46px sans-serif"; ctx.fillText(String(i + 1), 72, y);
      ctx.fillStyle = "#ffffff"; ctx.font = "700 42px sans-serif"; ctx.fillText(name, 160, y);
      ctx.fillStyle = ORANGE; ctx.font = "800 42px sans-serif"; ctx.textAlign = "right"; ctx.fillText(metricText(r.m, r.c), W - 70, y); ctx.textAlign = "left";
      y += 86;
    });
    ctx.fillStyle = "#6b7280"; ctx.font = "600 30px sans-serif"; ctx.fillText("illo.im/ai-models · 6시간마다 갱신", 70, H - 56);
    const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "ai-model-ranking.png"; a.click();
  };

  // 하이라이트 (싸다/많이쓴다/똑똑하다)
  const cheapest = useMemo(() => models.filter((m) => m.pin != null && m.pout != null).sort((a, b) => (a.pin! + a.pout!) - (b.pin! + b.pout!))[0], [models]);
  const mostUsed = useMemo(() => models.filter((m) => m.reqM != null).sort((a, b) => b.reqM! - a.reqM!)[0], [models]);
  const smartest = useMemo(() => models.filter((m) => m.intel != null).sort((a, b) => b.intel! - a.intel!)[0], [models]);

  const numInput = (v: number, set: (n: number) => void, label: string, unit: string) => (
    <label className="flex-1 min-w-[100px]">
      <span className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">{label}</span>
      <div className="flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus-within:border-[#F9954E]">
        <input type="number" min={0} value={v} onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent text-[14px] font-bold text-neutral-900 dark:text-white outline-none tabular-nums" />
        <span className="text-[11px] text-neutral-400 whitespace-nowrap">{unit}</span>
      </div>
    </label>
  );

  return (
    <main className="w-full min-h-screen max-w-3xl mx-auto px-4">
      {/* 히어로 */}
      <section className="pt-8 pb-5 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">AI 모델</p>
        <h1 className="text-[30px] sm:text-[40px] font-extrabold text-neutral-950 dark:text-white leading-[1.14] tracking-tight mb-2 break-keep">
          AI 모델 가격 비교 ·<br />실시간 비용 계산기
        </h1>
        <p className="text-[14px] text-neutral-400 dark:text-neutral-500 leading-relaxed break-keep">
          전 세계에서 가장 많이 쓰는 AI 모델의 <b className="text-neutral-600 dark:text-neutral-300">사용량 · 지능 · 속도 · 가격</b>을 한눈에. 토큰 수만 넣으면 모델별 월 비용을 자동 계산해드려요.
        </p>
      </section>

      {err && (
        <p className="text-[13px] text-neutral-400 py-10 text-center">데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
      )}

      {!err && (
        <>
          {/* 하이라이트 3종 */}
          <section className="grid grid-cols-3 gap-2 pt-5">
            {[
              { t: "💰 가장 저렴", m: cheapest, sub: cheapest ? usd((cheapest.pin || 0) + (cheapest.pout || 0)) + "/100만" : "" },
              { t: "🔥 사용량 1위", m: mostUsed, sub: mostUsed && mostUsed.reqM != null ? mostUsed.reqM + "M 요청/일" : "" },
              { t: "🧠 가장 똑똑", m: smartest, sub: smartest && smartest.intel != null ? smartest.intel + "점" : "" },
            ].map((h, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 dark:border-zinc-800 p-3 bg-gradient-to-b from-[#F9954E]/5 to-transparent">
                <p className="text-[10.5px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">{h.t}</p>
                <p className="text-[12.5px] font-extrabold text-neutral-900 dark:text-white leading-tight line-clamp-2 min-h-[30px]">{h.m ? h.m.name.replace(/^[^:]+:\s*/, "") : "—"}</p>
                <p className="text-[10.5px] font-bold text-[#F9954E] mt-1">{h.sub}</p>
              </div>
            ))}
          </section>

          {/* 계산기 입력 */}
          <section className="mt-5 rounded-2xl border border-neutral-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#F9954E]" />
              <h2 className="text-[14px] font-extrabold text-neutral-900 dark:text-white">비용 계산기</h2>
              <span className="ml-auto text-[10.5px] font-bold text-[#F9954E]">● LIVE</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {numInput(inTok, setInTok, "1회 입력 토큰", "토큰")}
              {numInput(outTok, setOutTok, "1회 출력 토큰", "토큰")}
              {numInput(calls, setCalls, "월 호출 횟수", "회")}
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">예: 입력 1,000 · 출력 1,000 토큰을 월 1,000번 호출 시 모델별 월 비용 = 아래 표 정렬됨</p>
          </section>

          {/* 비교/계산 표 */}
          <section className="mt-4 pb-16">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[14px] font-extrabold text-neutral-900 dark:text-white">📊 모델 비교 <span className="text-[11px] font-medium text-neutral-400">({SORT_LABEL[sort]}순)</span></h2>
              <button onClick={downloadCard} disabled={rows.length === 0}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-zinc-700 text-neutral-700 dark:text-neutral-200 text-[12px] font-bold px-3 py-1.5 hover:border-[#F9954E] hover:text-[#F9954E] disabled:opacity-40 transition-colors">
                📸 순위 이미지 저장
              </button>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full min-w-[640px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white dark:bg-black text-left text-[11px] font-bold text-neutral-400 pb-2 pr-2">모델</th>
                    {COLS.map((c) => (
                      <th key={c.key} onClick={() => clickSort(c.key)}
                        className="text-right text-[11px] font-bold pb-2 px-2 cursor-pointer select-none whitespace-nowrap hover:text-[#F9954E]"
                        style={{ color: sort === c.key ? ORANGE : undefined }}>
                        {c.label}{sort === c.key ? (asc ? " ▲" : " ▼") : ""}
                        <span className="block text-[9px] font-medium text-neutral-300 dark:text-neutral-600">{c.hint}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="text-center text-[13px] text-neutral-400 py-10">불러오는 중…</td></tr>
                  )}
                  {rows.map(({ m, c }, i) => (
                    <tr key={m.name + i} className="border-t border-neutral-100 dark:border-zinc-900">
                      <td className="sticky left-0 z-10 bg-white dark:bg-black py-2.5 pr-2">
                        <p className="text-[12.5px] font-bold text-neutral-900 dark:text-white leading-tight line-clamp-1">{m.name.replace(/^[^:]+:\s*/, "")}</p>
                        {m.provider && <p className="text-[10px] text-neutral-400 capitalize">{m.provider}</p>}
                      </td>
                      <td className="text-right px-2 text-[12.5px] font-extrabold tabular-nums" style={{ color: c != null ? ORANGE : undefined }}>{usd(c)}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-neutral-600 dark:text-neutral-300">{num(m.reqM, "M")}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-neutral-600 dark:text-neutral-300">{m.intel != null ? m.intel : "—"}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-neutral-600 dark:text-neutral-300">{num(m.tps)}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-neutral-500">{usd(m.pin)}</td>
                      <td className="text-right px-2 text-[12px] tabular-nums text-neutral-500">{usd(m.pout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10.5px] text-neutral-400 mt-3">데이터: OpenRouter 실사용 통계 · 자동 갱신 · 가격은 100만 토큰당 USD</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/ai-tools" className="inline-flex items-center gap-1 rounded-full bg-[#F9954E] text-white text-[12.5px] font-bold px-4 py-2">AI 도구 343개 보기 →</Link>
              <Link href="/insight" className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-neutral-300 text-[12.5px] font-bold px-4 py-2">AI 트렌드 인사이트 →</Link>
            </div>

            {/* FAQ (사람용 — JSON-LD는 서버에서 별도 주입) */}
            <div className="mt-8 space-y-3">
              <h2 className="text-[15px] font-extrabold text-neutral-900 dark:text-white">자주 묻는 질문</h2>
              {[
                ["가격은 어떻게 계산되나요?", "각 모델의 입력·출력 100만 토큰당 단가(OpenRouter 기준)에, 입력하신 토큰 수와 월 호출 횟수를 곱해 월 예상 비용을 계산합니다."],
                ["데이터는 얼마나 최신인가요?", "OpenRouter의 실제 사용량·가격 데이터를 자동으로 수시 갱신합니다. 원천 데이터가 바뀌는 즉시 반영돼요."],
                ["사용량 순위는 무슨 기준인가요?", "전 세계 개발자들이 OpenRouter를 통해 실제로 보낸 요청량(하루 백만 건 단위) 기준입니다."],
              ].map(([q, a], i) => (
                <details key={i} className="rounded-xl border border-neutral-200 dark:border-zinc-800 p-3">
                  <summary className="text-[13px] font-bold text-neutral-900 dark:text-white cursor-pointer">{q}</summary>
                  <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
