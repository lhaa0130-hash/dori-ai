"use client";
// 월드맵 — 지구본 + 평면 세계지도, 나라 클릭 시 핵심 지표 표시.
//
// 설계 메모
//  · 데이터는 public/worldmap/*.json 정적 파일. 런타임 외부 API 호출 0(정적 배포라 안전·빠름).
//  · 렌더는 canvas. 177개국 285폴리곤을 SVG 로 그리면 DOM 노드가 폭증한다.
//  · 지표별 색칠(코로플레스)로 "다른 나라와 쉽게 구분"을 만든다 — 로그 스케일이라 편차가 큰
//    지표(GDP)도 단계가 보인다.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  topoToCountries, orthographic, orthographicInvert, equirectangular, equirectangularInvert,
  countryAt, shapeCenter, type CountryShape, type GlobeView,
} from "@/lib/worldmap/geo";

interface Country {
  iso2: string; iso3: string; ccn3: string;
  nameKo: string; nameEn: string; official: string;
  capital: string; region: string; subregion: string;
  area: number | null; population: number | null; populationYear: number | null;
  gdp: number | null; gdpYear: number | null;
  gdpPerCapita: number | null; gdpPerCapitaYear: number | null;
  currencyCode: string; currencyName: string;
  languages: string[]; flag: string; borders: string[];
  // ⚠️ world-countries 에 timezones 가 없어(250/250 공백) 실제 존재하는 필드로 대체했다.
  callingCode: string; tld: string; landlocked: boolean;
  latlng: [number, number] | null; unMember: boolean; independent: boolean;
}
interface Meta { generatedAt: string; sources: { name: string; url: string; license: string; fields: string }[]; }

type MetricKey = "gdp" | "gdpPerCapita" | "population" | "area";
const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: "gdp", label: "GDP", unit: "USD" },
  { key: "gdpPerCapita", label: "1인당 GDP", unit: "USD" },
  { key: "population", label: "인구", unit: "명" },
  { key: "area", label: "면적", unit: "km²" },
];

// 색 단계 — 색만으로 구분하지 않도록 범례에 수치 구간도 함께 보여준다.
const SCALE = ["#fde8d7", "#fbc99e", "#f9a866", "#f1802f", "#cf5f13", "#9c4409"];
const NO_DATA_LIGHT = "#e7e5e4";
const NO_DATA_DARK = "#3f3f46";

const fmtBig = (n: number | null, unit = "") => {
  if (n == null) return "—";
  if (unit === "USD") {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}조`;
    if (n >= 1e8) return `$${(n / 1e8).toFixed(0)}억`;
    return `$${Math.round(n).toLocaleString()}`;
  }
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)}억`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}만`;
  return n.toLocaleString();
};
const fmtArea = (n: number | null) => (n == null ? "—" : `${Math.round(n).toLocaleString()} km²`);

export default function WorldMapClient() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [shapes, setShapes] = useState<CountryShape[]>([]);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<Country | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>("gdpPerCapita");
  const [view, setView] = useState<"globe" | "flat">("globe");
  const [query, setQuery] = useState("");
  const [rot, setRot] = useState({ lon: 127, lat: 20 });
  const [isDark, setIsDark] = useState(false);

  const globeRef = useRef<HTMLCanvasElement | null>(null);
  const flatRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; lon: number; lat: number; moved: boolean } | null>(null);

  // ── 데이터 로드 ────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, b] = await Promise.all([
          fetch("/worldmap/countries.json").then((r) => { if (!r.ok) throw new Error(`countries ${r.status}`); return r.json(); }),
          fetch("/worldmap/countries-110m.json").then((r) => { if (!r.ok) throw new Error(`topo ${r.status}`); return r.json(); }),
        ]);
        if (!alive) return;
        setCountries(a.countries);
        setMeta(a.meta);
        setShapes(topoToCountries(b));
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "데이터를 불러오지 못했어요");
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const read = () => setIsDark(document.documentElement.classList.contains("dark") || m.matches);
    read();
    m.addEventListener("change", read);
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { m.removeEventListener("change", read); obs.disconnect(); };
  }, []);

  const byCcn3 = useMemo(() => {
    const m = new Map<string, Country>();
    for (const c of countries) if (c.ccn3) m.set(String(Number(c.ccn3)), c);
    return m;
  }, [countries]);

  // ── 지표 → 색 (로그 스케일) ────────────────────────────────────────
  const colorOf = useMemo(() => {
    const vals = countries.map((c) => c[metric]).filter((v): v is number => typeof v === "number" && v > 0).sort((a, b) => a - b);
    if (!vals.length) return () => null as string | null;
    const lo = Math.log10(vals[0]), hi = Math.log10(vals[vals.length - 1]);
    return (c: Country | undefined) => {
      const v = c?.[metric];
      if (typeof v !== "number" || v <= 0) return null;
      const t = (Math.log10(v) - lo) / Math.max(1e-9, hi - lo);
      return SCALE[Math.min(SCALE.length - 1, Math.max(0, Math.floor(t * SCALE.length)))];
    };
  }, [countries, metric]);

  const legend = useMemo(() => {
    const vals = countries.map((c) => c[metric]).filter((v): v is number => typeof v === "number" && v > 0).sort((a, b) => a - b);
    if (!vals.length) return [];
    const lo = Math.log10(vals[0]), hi = Math.log10(vals[vals.length - 1]);
    const m = METRICS.find((x) => x.key === metric)!;
    return SCALE.map((color, i) => ({
      color,
      label: m.unit === "km²"
        ? fmtArea(10 ** (lo + ((i + 1) / SCALE.length) * (hi - lo)))
        : fmtBig(10 ** (lo + ((i + 1) / SCALE.length) * (hi - lo)), m.unit),
    }));
  }, [countries, metric]);

  // ── 공통 그리기 ────────────────────────────────────────────────────
  const paint = useCallback((
    ctx: CanvasRenderingContext2D, w: number, h: number,
    project: (lon: number, lat: number) => [number, number] | null,
  ) => {
    const noData = isDark ? NO_DATA_DARK : NO_DATA_LIGHT;
    const stroke = isDark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.16)";
    for (const s of shapes) {
      const c = byCcn3.get(s.id);
      const isSel = selected && c && c.ccn3 === selected.ccn3;
      const isHov = hovered === s.id;
      ctx.beginPath();
      let drew = false;
      for (const poly of s.polygons) {
        for (const ring of poly) {
          let started = false;
          for (const [lon, lat] of ring) {
            const p = project(lon, lat);
            if (!p) { started = false; continue; }       // 지구 뒷면은 선을 끊는다
            if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]);
            drew = true;
          }
          if (started) ctx.closePath();
        }
      }
      if (!drew) continue;
      ctx.fillStyle = colorOf(c) ?? noData;
      ctx.fill();
      if (isSel || isHov) {
        ctx.strokeStyle = isSel ? "#0f172a" : "#334155";
        ctx.lineWidth = isSel ? 2 : 1.4;
      } else {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 0.5;
      }
      ctx.stroke();
    }
    void w; void h;
  }, [shapes, byCcn3, colorOf, selected, hovered, isDark]);

  // ── 지구본 ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cv = globeRef.current;
    if (!cv || !shapes.length) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = cv.clientWidth;
    // ⚠️ 숨겨진 탭의 캔버스는 clientWidth 가 0 이다. 그대로 그리면 width=0 캔버스가 되어
    //    탭을 전환해도 빈 화면이 남는다 → 크기가 잡힌 뒤에만 그린다(view 가 deps 에 있어 재실행된다).
    if (size <= 0) return;
    cv.width = size * dpr; cv.height = size * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const v: GlobeView = { lon: rot.lon, lat: rot.lat, radius: size / 2 - 6, cx: size / 2, cy: size / 2 };
    // 바다
    ctx.beginPath();
    ctx.arc(v.cx, v.cy, v.radius, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "#0b2233" : "#dceefb";
    ctx.fill();
    paint(ctx, size, size, (lon, lat) => orthographic(lon, lat, v));
    // 테두리
    ctx.beginPath();
    ctx.arc(v.cx, v.cy, v.radius, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [shapes, rot, paint, isDark, view]);   // view: 탭 전환 후 크기가 잡히면 다시 그린다

  // ── 평면 지도 ──────────────────────────────────────────────────────
  useEffect(() => {
    const cv = flatRef.current;
    if (!cv || !shapes.length) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = Math.round(w / 2);
    if (w <= 0) return;   // 숨겨진 동안에는 그리지 않는다(위 주석 참조)
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.height = `${h}px`;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = isDark ? "#0b2233" : "#dceefb";
    ctx.fillRect(0, 0, w, h);
    paint(ctx, w, h, (lon, lat) => equirectangular(lon, lat, { width: w, height: h }));
  }, [shapes, paint, isDark, view]);        // view: 탭 전환 후 크기가 잡히면 다시 그린다

  // ── 상호작용 ───────────────────────────────────────────────────────
  const pick = useCallback((lon: number, lat: number) => {
    const s = countryAt(lon, lat, shapes);
    if (!s) return null;
    return { shape: s, country: byCcn3.get(s.id) ?? null };
  }, [shapes, byCcn3]);

  const onGlobePointer = (e: React.PointerEvent<HTMLCanvasElement>, kind: "down" | "move" | "up") => {
    const cv = globeRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    const size = cv.clientWidth;
    const v: GlobeView = { lon: rot.lon, lat: rot.lat, radius: size / 2 - 6, cx: size / 2, cy: size / 2 };

    if (kind === "down") {
      dragRef.current = { x: px, y: py, lon: rot.lon, lat: rot.lat, moved: false };
      cv.setPointerCapture(e.pointerId);
      return;
    }
    if (kind === "move") {
      const d = dragRef.current;
      if (d) {
        const dx = px - d.x, dy = py - d.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
        setRot({
          lon: d.lon - dx * 0.35,
          lat: Math.max(-85, Math.min(85, d.lat + dy * 0.35)),
        });
        return;
      }
      const g = orthographicInvert(px, py, v);
      setHovered(g ? pick(g[0], g[1])?.shape.id ?? null : null);
      return;
    }
    // up
    const d = dragRef.current;
    dragRef.current = null;
    try { cv.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    if (d?.moved) return;                       // 드래그였으면 선택하지 않는다
    const g = orthographicInvert(px, py, v);
    if (!g) return;
    const found = pick(g[0], g[1]);
    setSelected(found?.country ?? null);
  };

  const onFlatPointer = (e: React.PointerEvent<HTMLCanvasElement>, click: boolean) => {
    const cv = flatRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const [lon, lat] = equirectangularInvert(e.clientX - r.left, e.clientY - r.top, { width: cv.clientWidth, height: r.height });
    const found = pick(lon, lat);
    if (click) {
      setSelected(found?.country ?? null);
      if (found?.shape) { const [cLon, cLat] = shapeCenter(found.shape); setRot({ lon: cLon, lat: Math.max(-85, Math.min(85, cLat)) }); }
    } else setHovered(found?.shape.id ?? null);
  };

  /** 검색·목록에서 고른 나라로 지구본을 돌리고 선택한다. */
  const focus = (c: Country) => {
    setSelected(c);
    const s = shapes.find((x) => x.id === String(Number(c.ccn3)));
    const [lon, lat] = s ? shapeCenter(s) : (c.latlng ? [c.latlng[1], c.latlng[0]] as [number, number] : [0, 0]);
    setRot({ lon, lat: Math.max(-85, Math.min(85, lat)) });
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return countries.filter((c) =>
      c.nameKo.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.iso3.toLowerCase() === q,
    ).slice(0, 8);
  }, [countries, query]);

  // 선택 국가의 지표 순위 — "다른 나라와 비교"의 핵심
  const rank = useMemo(() => {
    if (!selected) return null;
    const out: Partial<Record<MetricKey, { pos: number; total: number }>> = {};
    for (const m of METRICS) {
      const v = selected[m.key];
      if (typeof v !== "number") continue;
      const list = countries.map((c) => c[m.key]).filter((x): x is number => typeof x === "number");
      out[m.key] = { pos: list.filter((x) => x > v).length + 1, total: list.length };
    }
    return out;
  }, [selected, countries]);

  const loading = !shapes.length && !loadError;

  return (
    <main className="w-full min-h-screen">
      <section className="pt-8 pb-6 border-b border-stone-100 dark:border-zinc-900">
        <p className="text-[11px] font-bold text-[#F9954E] mb-3 tracking-wide uppercase">World Map by illo</p>
        <h1 className="text-[30px] sm:text-[40px] font-extrabold text-stone-950 dark:text-white leading-[1.14] tracking-tight mb-2 break-keep">
          지구본으로 돌려보고<br />지도로 한눈에 비교하는 세계
        </h1>
        <p className="text-[14px] text-stone-400 dark:text-stone-500 leading-relaxed break-keep">
          나라를 누르면 면적·인구·GDP·1인당 GDP 같은 핵심 지표를 바로 볼 수 있어요.<br />
          지표를 바꾸면 지도 색이 함께 바뀌어서 나라끼리 쉽게 비교돼요.
        </p>
      </section>

      {loadError && (
        <div className="my-6 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4">
          <p className="text-[13px] font-bold text-rose-700 dark:text-rose-300">지도 데이터를 불러오지 못했어요</p>
          <p className="text-[12px] text-rose-600 dark:text-rose-400 mt-1">{loadError} — 새로고침해 주세요.</p>
        </div>
      )}

      {/* 지표 선택 + 검색 */}
      <section className="py-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-stone-400 dark:text-zinc-600 uppercase tracking-wide mr-1">색 기준</span>
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              aria-pressed={metric === m.key}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors ${
                metric === m.key ? "bg-[#F9954E] text-white" : "bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300"
              }`}
            >{m.label}</button>
          ))}
          <div className="ml-auto flex gap-1.5">
            {(["globe", "flat"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors ${
                  view === v ? "bg-stone-900 dark:bg-white text-white dark:text-stone-900" : "bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300"
                }`}
              >{v === "globe" ? "지구본" : "평면지도"}</button>
            ))}
          </div>
        </div>

        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="나라 이름으로 찾기 (예: 한국, Japan, USA)"
            aria-label="나라 검색"
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
          />
          {results.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-lg">
              {results.map((c) => (
                <li key={c.iso3}>
                  <button
                    onClick={() => { focus(c); setQuery(""); }}
                    className="w-full text-left px-3.5 py-2.5 text-[13px] hover:bg-stone-50 dark:hover:bg-zinc-900 flex items-center gap-2"
                  >
                    <span aria-hidden="true">{c.flag}</span>
                    <span className="font-bold text-stone-900 dark:text-white">{c.nameKo}</span>
                    <span className="text-stone-400">{c.nameEn}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 지도 + 정보 */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 pb-10">
        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
          {loading && <div className="aspect-square lg:aspect-auto lg:h-[420px] grid place-items-center text-[13px] text-stone-400">지도를 불러오는 중…</div>}

          <div className={view === "globe" ? "" : "hidden"}>
            <canvas
              ref={globeRef}
              className="w-full aspect-square touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => onGlobePointer(e, "down")}
              onPointerMove={(e) => onGlobePointer(e, "move")}
              onPointerUp={(e) => onGlobePointer(e, "up")}
              onPointerLeave={() => setHovered(null)}
            />
            <p className="mt-2 text-[11px] text-stone-400 text-center">드래그하면 돌아가고, 나라를 누르면 정보가 나와요</p>
          </div>

          <div className={view === "flat" ? "" : "hidden"}>
            <canvas
              ref={flatRef}
              className="w-full touch-none cursor-pointer"
              onPointerMove={(e) => onFlatPointer(e, false)}
              onPointerLeave={() => setHovered(null)}
              onClick={(e) => onFlatPointer(e as unknown as React.PointerEvent<HTMLCanvasElement>, true)}
            />
            <p className="mt-2 text-[11px] text-stone-400 text-center">나라를 누르면 지구본도 그쪽으로 돌아가요</p>
          </div>

          {/* 범례 */}
          {legend.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-stone-400">{METRICS.find((m) => m.key === metric)?.label}</span>
              <div className="flex items-center">
                {legend.map((l, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="block w-9 h-3" style={{ backgroundColor: l.color }} />
                    <span className="text-[9px] text-stone-400 mt-0.5">{l.label}</span>
                  </div>
                ))}
              </div>
              <span className="flex items-center gap-1 text-[10px] text-stone-400 ml-2">
                <span className="block w-4 h-3" style={{ backgroundColor: isDark ? NO_DATA_DARK : NO_DATA_LIGHT }} /> 자료 없음
              </span>
            </div>
          )}
        </div>

        {/* 정보 패널 */}
        <aside className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 h-fit lg:sticky lg:top-4">
          {!selected ? (
            <div className="py-10 text-center">
              <p className="text-[32px] mb-2" aria-hidden="true">🌍</p>
              <p className="text-[13px] font-bold text-stone-900 dark:text-white mb-1">나라를 선택해 주세요</p>
              <p className="text-[12px] text-stone-400 break-keep">지구본을 돌리거나 지도를 눌러보세요.<br />위에서 이름으로 찾을 수도 있어요.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5 mb-4">
                <span className="text-[30px] leading-none" aria-hidden="true">{selected.flag}</span>
                <div className="min-w-0">
                  <h2 className="text-[19px] font-extrabold text-stone-950 dark:text-white leading-tight break-keep">{selected.nameKo}</h2>
                  <p className="text-[12px] text-stone-400 truncate">{selected.nameEn}</p>
                </div>
              </div>

              <dl className="space-y-0">
                {[
                  ["수도", selected.capital || "—"],
                  ["지역", [selected.region, selected.subregion].filter(Boolean).join(" · ") || "—"],
                  ["면적", fmtArea(selected.area)],
                  ["인구", selected.population != null ? `${fmtBig(selected.population)}명${selected.populationYear ? ` (${selected.populationYear})` : ""}` : "—"],
                  ["GDP", selected.gdp != null ? `${fmtBig(selected.gdp, "USD")}${selected.gdpYear ? ` (${selected.gdpYear})` : ""}` : "—"],
                  ["1인당 GDP", selected.gdpPerCapita != null ? `$${Math.round(selected.gdpPerCapita).toLocaleString()}${selected.gdpPerCapitaYear ? ` (${selected.gdpPerCapitaYear})` : ""}` : "—"],
                  ["통화", selected.currencyCode ? `${selected.currencyName} (${selected.currencyCode})` : "—"],
                  ["언어", selected.languages.length ? selected.languages.join(", ") : "—"],
                  ["국제전화", selected.callingCode || "—"],
                  ["최상위 도메인", selected.tld || "—"],
                  ["인접국", selected.borders.length ? `${selected.borders.length}개국${selected.landlocked ? " · 내륙국" : ""}` : "없음 (섬·고립)"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2 border-b border-stone-100 dark:border-zinc-900 last:border-0">
                    <dt className="text-[12px] text-stone-400 shrink-0">{k}</dt>
                    <dd className="text-[13px] font-semibold text-stone-900 dark:text-white text-right break-keep">{v}</dd>
                  </div>
                ))}
              </dl>

              {rank && (
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-zinc-900">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-2">세계 순위</p>
                  <div className="grid grid-cols-2 gap-2">
                    {METRICS.map((m) => {
                      const r = rank[m.key];
                      if (!r) return null;
                      return (
                        <div key={m.key} className="rounded-xl bg-stone-50 dark:bg-zinc-900 px-3 py-2">
                          <p className="text-[10px] text-stone-400">{m.label}</p>
                          <p className="text-[15px] font-extrabold text-stone-900 dark:text-white">
                            {r.pos}<span className="text-[11px] font-semibold text-stone-400">위 / {r.total}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected.borders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-zinc-900">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-2">인접 국가</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.borders.map((b) => {
                      const n = countries.find((c) => c.iso3 === b);
                      if (!n) return null;
                      return (
                        <button
                          key={b}
                          onClick={() => focus(n)}
                          className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-900 text-[12px] font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-zinc-800"
                        >
                          <span aria-hidden="true">{n.flag}</span> {n.nameKo}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </section>

      {/* 출처 — 수치를 다루므로 반드시 밝힌다 */}
      {meta && (
        <section className="pb-12 border-t border-stone-100 dark:border-zinc-900 pt-5">
          <p className="text-[11px] font-bold text-stone-400 dark:text-zinc-600 uppercase tracking-wide mb-2">데이터 출처 · {meta.generatedAt} 기준</p>
          <ul className="space-y-1">
            {meta.sources.map((s) => (
              <li key={s.name} className="text-[12px] text-stone-500 dark:text-stone-400 break-keep">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-stone-700 dark:text-stone-200 underline">{s.name}</a>
                {" — "}{s.fields} <span className="text-stone-400">({s.license})</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-stone-400 break-keep">
            GDP·인구는 세계은행 최신 확정치라 나라마다 기준 연도가 다를 수 있어요(각 항목에 연도를 함께 표시).
            지도자·종교처럼 자주 바뀌거나 기준이 갈리는 항목은 아직 넣지 않았어요.
          </p>
          <Link href="/projects" className="inline-block mt-4 text-[13px] font-bold text-[#F9954E]">← 다른 프로젝트 보기</Link>
        </section>
      )}
    </main>
  );
}
