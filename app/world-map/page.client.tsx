"use client";

// 월드맵 화면 전체 조립 (명세서 §7 · §8).
// 상태는 URL 이 원본이다. 주소를 복사해 새 창에서 열면 같은 선택·비교가 복원된다.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContinentCode, CountryDataset, CountryRecord, MetricKey, SupportedLanguage, ViewMode } from "@/lib/worldmap/types";
import { CONTINENTS, METRIC_KEYS } from "@/lib/worldmap/types";
import { MapSyncController, cameraForBounds } from "@/lib/worldmap/mapSync";
import { parseUrlState, buildUrlQuery } from "@/lib/worldmap/search";
import { DICT, LANG_STORAGE_KEY, QUICK_PICKS, resolveLanguage, t } from "@/lib/worldmap/i18n";
import MapPanel from "@/components/worldmap/MapPanel";
import SearchBox from "@/components/worldmap/SearchBox";
import CountryDetail from "@/components/worldmap/CountryDetail";
import ComparePanel from "@/components/worldmap/ComparePanel";

const DATA_URL = "/worldmap/countries.json";
const GEOJSON_URL = "/worldmap/countries.geojson";

// 지표 색칠 램프 — illo 브랜드 오렌지 계열 6단계. 값이 없으면 회색으로 둔다.
const RAMP = ["#fff4ec", "#ffe2d2", "#ffc9ab", "#ffab7d", "#ff8b55", "#ef6b2e"];
const NO_VALUE = "#e8e2dc";

/** 지표 분포는 한쪽으로 크게 쏠려 있어 로그 눈금이라야 나라 사이 차이가 보인다. */
function buildColors(countries: CountryRecord[], metric: MetricKey): Record<string, string> {
  const values = countries.map((c) => c[metric]).filter((m) => m.s !== "missing" && (m.v ?? 0) > 0).map((m) => Math.log10(m.v as number));
  const out: Record<string, string> = {};
  if (!values.length) return out;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  for (const c of countries) {
    const m = c[metric];
    if (m.s === "missing" || m.v == null || m.v <= 0) { out[c.iso3] = NO_VALUE; continue; }
    const ratio = (Math.log10(m.v) - min) / span;
    out[c.iso3] = RAMP[Math.min(RAMP.length - 1, Math.floor(ratio * RAMP.length))];
  }
  return out;
}

type Panel = "detail" | "compare";

export default function WorldMapClient() {
  const [dataset, setDataset] = useState<CountryDataset | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lang, setLang] = useState<SupportedLanguage>("ko");
  const [view, setView] = useState<ViewMode>("split");
  const [continent, setContinent] = useState<ContinentCode | null>(null);
  const [metric, setMetric] = useState<MetricKey>("gdp");
  const [selected, setSelected] = useState<string | null>(null);
  const [compare, setCompare] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("detail");
  const [isNarrow, setIsNarrow] = useState(false);

  // 지도 인스턴스는 재생성 비용이 크므로 컨트롤러를 한 번만 만든다.
  const controllerRef = useRef<MapSyncController | null>(null);
  if (!controllerRef.current) controllerRef.current = new MapSyncController();
  const controller = controllerRef.current;
  useEffect(() => () => controller.dispose(), [controller]);

  const byIso = useMemo(
    () => new Map((dataset?.countries ?? []).map((c) => [c.iso3, c])),
    [dataset],
  );

  // ── 데이터 로드 ────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoadError(false);
    fetch(DATA_URL)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((json: CountryDataset) => setDataset(json))
      .catch(() => setLoadError(true));
  }, []);
  useEffect(load, [load]);

  // ── URL → 상태 (최초 1회 + 뒤로가기) ────────────────────────────
  const applyUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const valid = byIso.size ? new Set(byIso.keys()) : undefined;
    const s = parseUrlState(params, valid);
    setLang(resolveLanguage(s.lang, window.localStorage.getItem(LANG_STORAGE_KEY), window.navigator.language));
    setView(s.view);
    setContinent(s.continent);
    setSelected(s.country);
    setCompare(s.compare);
    setPanel(s.compare ? "compare" : "detail");
  }, [byIso]);

  useEffect(() => {
    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [applyUrl]);

  // ── 상태 → URL ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !dataset) return;
    const query = buildUrlQuery({ country: selected, compare, lang, view, continent });
    const next = `${window.location.pathname}${query}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [selected, compare, lang, view, continent, dataset]);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // 좁은 화면에서는 두 지도를 억지로 2열로 넣지 않는다(명세서 §7.2).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const colors = useMemo(
    () => (dataset ? buildColors(dataset.countries, metric) : {}),
    [dataset, metric],
  );

  const dimmed = useMemo(() => {
    if (!dataset || !continent) return null;
    return new Set(dataset.countries.filter((c) => c.continentCode !== continent).map((c) => c.iso3));
  }, [dataset, continent]);

  // ── 국가 선택 → 양쪽 지도를 같은 duration 으로 이동 ─────────────
  const focusCountry = useCallback((iso3: string) => {
    const rec = byIso.get(iso3);
    if (rec) controller.moveAll(cameraForBounds(rec.bbox));
  }, [byIso, controller]);

  const selectCountry = useCallback((iso3: string) => {
    if (panel === "compare" && selected && iso3 !== selected) setCompare(iso3);
    else { setSelected(iso3); setCompare((c) => (c === iso3 ? null : c)); }
    focusCountry(iso3);
  }, [panel, selected, focusCountry]);

  // 지도가 준비되면 URL 에 있던 국가로 카메라를 맞춘다.
  const onMapReady = useCallback(() => {
    if (selected) focusCountry(selected);
  }, [selected, focusCountry]);

  const selectedRecord = selected ? byIso.get(selected) ?? null : null;
  const compareRecord = compare ? byIso.get(compare) ?? null : null;

  // ── 렌더 ──────────────────────────────────────────────────────
  if (loadError) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-20 text-center sm:px-6 lg:px-10">
        <p className="text-[15px] text-[#40382f]">{t("loadError", lang)}</p>
        <button type="button" onClick={load} className="mt-3 rounded-lg bg-[#ff9966] px-4 py-2 text-[14px] font-bold text-white">
          {t("retry", lang)}
        </button>
      </main>
    );
  }

  const showFlat = view !== "globe";
  const showGlobe = view !== "flat";
  const mapHeight = isNarrow ? "h-[62vh] min-h-[380px]" : "h-[520px]";

  const chip = (activeState: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9966] ${
      activeState
        ? "border-[#ff9966] bg-[#fff0e6] text-[#f47f45]"
        : "border-[#ece6e0] bg-white text-[#7d746e] hover:border-[#d9d0c8]"
    }`;

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#f47f45]">{DICT.eyebrow[lang]}</p>
      <h1 className="mt-1.5 text-[32px] font-extrabold leading-[1.15] text-[#201b18] lg:text-[44px]">
        {DICT.title[lang]}
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#7d746e]">{DICT.lead[lang]}</p>

      {dataset?.stale && (
        <p role="status" className="mt-3 inline-block rounded-lg bg-[#fdf3e2] px-3 py-1.5 text-[13px] font-semibold text-[#b6792e]">
          {t("staleWarning", lang)}
        </p>
      )}

      {/* 검색과 주요 controls */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:max-w-md lg:flex-1">
          {dataset && (
            <SearchBox countries={dataset.countries} lang={lang} continent={continent} onSelect={selectCountry} />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only" id="view-label">{t("flatMap", lang)} / {t("globe", lang)}</span>
          <div role="group" aria-labelledby="view-label" className="flex gap-1.5">
            {(["split", "flat", "globe"] as ViewMode[]).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={chip(view === v)}>
                {v === "split" ? t("split", lang) : v === "flat" ? t("flatMap", lang) : t("globe", lang)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setLang((l) => (l === "ko" ? "en" : "ko"))}
            className="ml-auto rounded-full border border-[#ece6e0] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#40382f] transition hover:border-[#ff9966] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9966]"
          >
            {t("langToggle", lang)}
          </button>
        </div>
      </div>

      {/* 대륙 필터 · 색 기준 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-medium text-[#a89f98]">{t("continent", lang)}</span>
          <button type="button" onClick={() => setContinent(null)} aria-pressed={continent === null} className={chip(continent === null)}>
            {t("allContinents", lang)}
          </button>
          {CONTINENTS.map((code) => {
            const sample = dataset?.countries.find((c) => c.continentCode === code);
            return (
              <button key={code} type="button" onClick={() => setContinent((c) => (c === code ? null : code))} aria-pressed={continent === code} className={chip(continent === code)}>
                {lang === "ko" ? sample?.continentKo ?? code : sample?.continentEn ?? code}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-medium text-[#a89f98]">{t("colorBy", lang)}</span>
          {METRIC_KEYS.map((m) => (
            <button key={m} type="button" onClick={() => setMetric(m)} aria-pressed={metric === m} className={chip(metric === m)}>
              {t(m, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* 지도 영역 */}
      <div className={`mt-5 grid gap-4 ${view === "split" && !isNarrow ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {showFlat && (
          <figure className="m-0">
            <figcaption className="mb-1.5 text-[13px] font-bold text-[#40382f]">{t("flatMap", lang)}</figcaption>
            {dataset && (
              <MapPanel
                side="flat" controller={controller} geojsonUrl={GEOJSON_URL} countries={dataset.countries}
                lang={lang} colors={colors} selectedA={selected} selectedB={compare} dimmed={dimmed}
                onSelect={selectCountry} onReady={onMapReady} className={mapHeight}
              />
            )}
          </figure>
        )}
        {showGlobe && (
          <figure className="m-0">
            <figcaption className="mb-1.5 text-[13px] font-bold text-[#40382f]">{t("globe", lang)}</figcaption>
            {dataset && (
              <MapPanel
                side="globe" controller={controller} geojsonUrl={GEOJSON_URL} countries={dataset.countries}
                lang={lang} colors={colors} selectedA={selected} selectedB={compare} dimmed={dimmed}
                onSelect={selectCountry} onReady={onMapReady} className={mapHeight}
              />
            )}
          </figure>
        )}
      </div>

      {!dataset && <p className="mt-6 text-[14px] text-[#7d746e]">{t("loading", lang)}</p>}

      {/* 상세 / 비교 */}
      <div className="mt-6">
        {!selectedRecord && dataset && (
          <div className="rounded-2xl border border-[#ece6e0] bg-white p-6">
            <p className="text-[15px] text-[#40382f]">{t("emptyState", lang)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium text-[#a89f98]">{t("quickPicks", lang)}</span>
              {QUICK_PICKS.map((iso3) => {
                const c = byIso.get(iso3);
                if (!c) return null;
                return (
                  <button key={iso3} type="button" onClick={() => selectCountry(iso3)} className={chip(false)}>
                    {lang === "ko" ? c.nameKo : c.nameEn}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedRecord && dataset && panel === "detail" && (
          <CountryDetail
            country={selectedRecord} dataset={dataset} lang={lang}
            allCountries={dataset.countries} onCompare={() => setPanel("compare")}
          />
        )}

        {selectedRecord && dataset && panel === "compare" && (
          <ComparePanel
            a={selectedRecord} b={compareRecord} dataset={dataset} lang={lang} continent={continent}
            onPickB={(iso3) => { setCompare(iso3); focusCountry(iso3); }}
            onSwap={() => { if (compare) { const a = selected; setSelected(compare); setCompare(a); } }}
            onReset={() => setCompare(null)}
            onBack={() => { setPanel("detail"); setCompare(null); }}
          />
        )}
      </div>

      {/* 데이터 출처 (명세서 §6.2 attribution) */}
      {dataset && (
        <footer className="mt-8 border-t border-[#ece6e0] pt-4 text-[11px] leading-relaxed text-[#a89f98]">
          <p className="font-semibold text-[#7d746e]">{t("sources", lang)}</p>
          <p className="mt-1">
            {Object.values(dataset.sources).map((s, i) => (
              <span key={s.provider}>
                {i > 0 && " · "}
                <a href={s.url} target="_blank" rel="noreferrer noopener" className="underline decoration-dotted">{s.label}</a>
              </span>
            ))}
            {" · "}
            <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer noopener" className="underline decoration-dotted">Natural Earth (public domain)</a>
            {" · "}
            <a href="https://maplibre.org/" target="_blank" rel="noreferrer noopener" className="underline decoration-dotted">MapLibre</a>
          </p>
          <p className="mt-1">{t("updatedAt", lang)} {dataset.generatedAt.slice(0, 10)}</p>
        </footer>
      )}
    </main>
  );
}
