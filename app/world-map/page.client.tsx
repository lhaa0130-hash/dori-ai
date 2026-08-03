"use client";

// 월드맵 화면 전체 조립 (명세서 §7 · §8).
// 상태는 URL 이 원본이다. 주소를 복사해 새 창에서 열면 같은 선택·비교가 복원된다.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContinentCode, CountryDataset, CountryRecord, MetricKey, SupportedLanguage } from "@/lib/worldmap/types";
import { CONTINENTS, METRIC_KEYS } from "@/lib/worldmap/types";
import { MapSyncController, cameraForBounds, combinedBounds } from "@/lib/worldmap/mapSync";
import { parseUrlState, buildUrlQuery, type WorldMapView } from "@/lib/worldmap/search";
import RankingPanel from "@/components/worldmap/RankingPanel";
import { RANKING_BY_ID, type RankingMetricId, buildRanking } from "@/lib/worldmap/ranking";
import {
  type ComparisonSelection, type WorldMapMode,
  addComparison, removeComparison, moveComparison, clearComparison, shouldShowTable,
} from "@/lib/worldmap/comparison";
import { DICT, LANG_STORAGE_KEY, QUICK_PICKS, resolveLanguage, t } from "@/lib/worldmap/i18n";
import MapPanel from "@/components/worldmap/MapPanel";
import SearchBox from "@/components/worldmap/SearchBox";
import CountryDetail, { Flag } from "@/components/worldmap/CountryDetail";
import ComparePanel from "@/components/worldmap/ComparePanel";

const DATA_URL = "/worldmap/countries.json";
const GEOJSON_URL = "/worldmap/countries.geojson";

// 지표 색칠 램프 — illo 브랜드 오렌지 계열 6단계. 값이 없으면 회색으로 둔다.
const RAMP = ["#fff4ec", "#ffe2d2", "#ffc9ab", "#ffab7d", "#ff8b55", "#ef6b2e"];
const NO_VALUE = "#e8e2dc";

// 대륙별 색 — 서로 확실히 구분되면서 illo 의 밝고 따뜻한 톤을 벗어나지 않게 고른다.
// 파스텔 톤 — 국가명 라벨과 선택 강조가 위에 얹히므로 배경은 연하게 둔다.
const CONTINENT_FILL: Record<ContinentCode, string> = {
  AS: "#ffd9c2",   // 연한 오렌지
  EU: "#cfe0f5",   // 연한 블루
  AF: "#cfeadd",   // 연한 그린
  NA: "#e6d7f2",   // 연한 퍼플
  SA: "#fbeec6",   // 연한 옐로
  OC: "#d3ecee",   // 연한 틸
};

/** 색 기준 — 숫자 지표 4종 + 대륙. */
type ColorMode = MetricKey | "continent";

/** 지표 분포는 한쪽으로 크게 쏠려 있어 로그 눈금이라야 나라 사이 차이가 보인다. */
function buildColors(countries: CountryRecord[], metric: ColorMode): Record<string, string> {
  // 대륙은 눈금이 아니라 분류다. 로그 계산 없이 대륙 색을 그대로 칠한다.
  if (metric === "continent") {
    const out: Record<string, string> = {};
    for (const c of countries) out[c.iso3] = CONTINENT_FILL[c.continentCode] ?? NO_VALUE;
    return out;
  }
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

export default function WorldMapClient({ initialLang }: { initialLang?: SupportedLanguage } = {}) {
  const [dataset, setDataset] = useState<CountryDataset | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lang, setLang] = useState<SupportedLanguage>(initialLang ?? "ko");
  const [view, setView] = useState<WorldMapView>("map");
  const [rankMetric, setRankMetric] = useState<RankingMetricId>("area");
  const [rankOrder, setRankOrder] = useState<"desc" | "asc">("desc");
  const [rankShowAll, setRankShowAll] = useState(false);
  const [hoveredIso3, setHoveredIso3] = useState<string | null>(null);
  const [continent, setContinent] = useState<ContinentCode | null>(null);
  const [metric, setMetric] = useState<ColorMode>("continent");
  const [selected, setSelected] = useState<string | null>(null);
  // 비교 선택은 일반 선택과 완전히 별개다. 비교 모드에 들어가도 자동으로 채우지 않는다.
  const [mode, setMode] = useState<WorldMapMode>("explore");
  const [comparison, setComparison] = useState<ComparisonSelection[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [flashIso3, setFlashIso3] = useState<string | null>(null);
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
    // 언어는 라우트(initialLang)가 유일한 기준이다. 저장값이 라우트를 덮어쓰지 않게 한다(§9.2).
    setLang(initialLang ?? (s.lang === "en" ? "en" : "ko"));
    setView(s.view);
    if (s.rankingMetric && RANKING_BY_ID.has(s.rankingMetric as RankingMetricId)) setRankMetric(s.rankingMetric as RankingMetricId);
    if (s.rankingOrder) setRankOrder(s.rankingOrder);
    setContinent(s.continent);
    setSelected(s.country);
    setMode(s.mode);
    setComparison(s.comparison);
  }, [byIso, initialLang]);

  useEffect(() => {
    // 구형 링크 정리: /world-map?...&lang=en → /en/world-map?... (다른 상태는 그대로 둔다)
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const q = p.get("lang");
      if (q === "en" || q === "ko") {
        p.delete("lang");
        const rest = p.toString();
        const path = q === "en" ? "/en/world-map" : "/world-map";
        if (window.location.pathname !== path) {
          window.location.replace(rest ? `${path}?${rest}` : path);
          return;
        }
        window.history.replaceState(null, "", rest ? `${path}?${rest}` : path);
      }
    }
    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [applyUrl]);

  // ── 상태 → URL ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !dataset) return;
    const query = buildUrlQuery({ view, rankingMetric: view === "ranking" ? rankMetric : null, rankingOrder: view === "ranking" ? rankOrder : null, mode, country: selected, comparison, lang: null, continent });
    const next = `${window.location.pathname}${query}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, [selected, mode, comparison, lang, view, continent, rankMetric, rankOrder, dataset]);

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

  // 랭킹 화면에서는 지도도 같은 지표로 칠한다(지시서 §7). 결측은 중립 회색.
  const colors = useMemo(() => {
    if (!dataset) return {};
    if (view !== "ranking") return buildColors(dataset.countries, metric);
    const r = buildRanking(dataset.countries, rankMetric, { order: rankOrder });
    const out: Record<string, string> = {};
    for (const c of dataset.countries) out[c.iso3] = NO_VALUE;
    r.rows.forEach((row, i) => {
      const ratio = r.rows.length > 1 ? i / (r.rows.length - 1) : 0;
      out[row.iso3] = RAMP[Math.min(RAMP.length - 1, Math.floor((1 - ratio) * RAMP.length))];
    });
    return out;
  }, [dataset, metric, view, rankMetric, rankOrder]);

  const dimmed = useMemo(() => {
    if (!dataset || !continent) return null;
    return new Set(dataset.countries.filter((c) => c.continentCode !== continent).map((c) => c.iso3));
  }, [dataset, continent]);

  // ── 국가 선택 → 양쪽 지도를 같은 duration 으로 이동 ─────────────
  const focusCountry = useCallback((iso3: string) => {
    const rec = byIso.get(iso3);
    if (!rec) return;
    const cam = cameraForBounds(rec.bbox);
    // 나라를 화면 정중앙이 아니라 살짝 위에 둔다 — 아래 상세 카드로 시선이 이어진다.
    // 위도 오프셋은 확대할수록 작아져야 같은 화면 비율을 유지한다.
    const offset = 6 / Math.pow(2, cam.zoom);
    controller.moveAll({ ...cam, center: [cam.center[0], cam.center[1] - offset] });
  }, [byIso, controller]);

  const comparisonRecords = useMemo(
    () => comparison.map((c) => byIso.get(c.iso3)).filter(Boolean) as CountryRecord[],
    [comparison, byIso],
  );

  /** 비교 모드에서는 목록에 담고, 일반 탐색에서는 상세를 연다. */
  const selectCountry = useCallback((iso3: string) => {
    if (mode === "compare") {
      setComparison((list) => {
        const r = addComparison(list, iso3);
        if (r.status === "duplicate") {
          // 이미 있는 나라 — 중복으로 넣지 않고 해당 chip 을 잠깐 강조한다
          setFlashIso3(iso3);
          setNotice(null);
          window.setTimeout(() => setFlashIso3(null), 900);
        } else if (r.status === "full") {
          setNotice(lang === "ko" ? "최대 4개 나라까지 비교할 수 있어요." : "You can compare up to four countries.");
          window.setTimeout(() => setNotice(null), 2600);
        } else {
          setNotice(null);
        }
        return r.list;
      });
      // 비교 모드에서도 마지막으로 고른 나라를 기억해 둔다(비교를 끝내면 그 나라 상세를 연다)
      setSelected(iso3);
    } else {
      setSelected(iso3);
    }
    focusCountry(iso3);
  }, [mode, lang, focusCountry]);

  const enterCompare = useCallback(() => {
    // 지금 보고 있던 나라를 자동으로 넣지 않는다 — 빈 4칸에서 시작한다.
    setMode("compare");
    setComparison(clearComparison());
    setNotice(null);
  }, []);

  const exitCompare = useCallback(() => {
    setMode("explore");
    setComparison(clearComparison());
    setNotice(null);
  }, []);

  // 지도가 준비되면 URL 에 있던 국가로 카메라를 맞춘다.
  const onMapReady = useCallback(() => {
    // 지도가 준비되기 전에 부른 moveAll 은 등록된 지도가 없어 그냥 사라진다.
    // URL 로 바로 들어온 경우를 위해 준비 시점에 한 번 더 맞춘다.
    if (mode === "compare" && comparisonRecords.length >= 2) {
      controller.moveAll(cameraForBounds(combinedBounds(comparisonRecords.map((c) => c.bbox))));
    } else if (selected) {
      focusCountry(selected);
    }
  }, [mode, comparisonRecords, controller, selected, focusCountry]);

  const selectedRecord = selected ? byIso.get(selected) ?? null : null;

  // 비교 중인 나라가 모두 보이도록 경계 상자를 합친다(후속 지시서 §5).
  useEffect(() => {
    if (mode !== "compare" || comparisonRecords.length < 2) return;
    controller.moveAll(cameraForBounds(combinedBounds(comparisonRecords.map((c) => c.bbox))));
  }, [mode, comparisonRecords, controller]);

  // 지도 상단 배너에 띄울 나라. 비교 중이면 가장 마지막에 담은 나라를 보여준다.
  const bannerCountry =
    mode === "compare"
      ? comparisonRecords[comparisonRecords.length - 1] ?? null
      : selectedRecord;

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

  // 지구본은 걷어내고 평면 지도 한 장을 화면 가득 쓴다.
  // 헤더·검색·컨트롤이 차지하는 높이를 빼고 남는 만큼 지도에 준다.
  // 지도 높이는 화면 상태에 따라 다르게 잡는다(지시서 배포1 §1).
  // 나라를 고르면 아래 상세 카드가 길어지므로 지도를 조금 낮춰 시선이 자연스럽게 이어지게 한다.
  const mapHeight = isNarrow
    ? "h-[clamp(340px,48vh,480px)]"
    : mode === "compare" || view === "ranking"
      ? "h-[clamp(430px,56vh,640px)]"
      : selected
        ? "h-[clamp(390px,50vh,570px)]"
        : "h-[clamp(420px,56vh,640px)]";

  const chip = (activeState: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9966] ${
      activeState
        ? "border-[#ff9966] bg-[#fff0e6] text-[#f47f45]"
        : "border-[#ece6e0] bg-white text-[#7d746e] hover:border-[#d9d0c8]"
    }`;

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-4 pt-5 sm:px-6 lg:px-10">
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#f47f45]">{DICT.eyebrow[lang]}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-[28px] font-extrabold leading-tight text-[#201b18] lg:text-[34px]">
          {DICT.title[lang]}
        </h1>
        <p className="text-[14px] text-[#7d746e]">{DICT.lead[lang]}</p>
      </div>

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
          {/* 상단 3탭 — 지도 탐색 / 세계 랭킹 / 국가 비교 (지시서 §8.1) */}
          <div role="group" aria-label={lang === "ko" ? "탐색 방식" : "Explore mode"} className="flex gap-1.5">
            <button type="button" onClick={() => { setView("map"); exitCompare(); }}
              aria-pressed={view === "map" && mode === "explore"} className={chip(view === "map" && mode === "explore")}>
              {lang === "ko" ? "지도 탐색" : "Map"}
            </button>
            <button type="button" onClick={() => { setView("ranking"); exitCompare(); }}
              aria-pressed={view === "ranking"} className={chip(view === "ranking")}>
              {lang === "ko" ? "세계 랭킹" : "Ranking"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const list = dataset?.countries ?? [];
              if (!list.length) return;
              const pick = list[Math.floor(Math.random() * list.length)];
              selectCountry(pick.iso3);
            }}
            className={chip(false)}
          >
            {t("randomTrip", lang)}
          </button>

          {/* 비교하기 — 지도 위 상단에 눈에 띄게 둔다 */}
          <button
            type="button"
            onClick={mode === "compare" ? exitCompare : enterCompare}
            aria-pressed={mode === "compare"}
            className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9966] ${
              mode === "compare"
                ? "bg-[#f47f45] text-white hover:bg-[#e06f36]"
                : "bg-[#fff0e6] text-[#f47f45] hover:bg-[#ffe2d2]"
            }`}
          >
            {mode === "compare"
              ? `${lang === "ko" ? "비교" : "Compare"} ${comparison.length}/4 · ${lang === "ko" ? "끝내기" : "exit"}`
              : (lang === "ko" ? "🔍 비교하기" : "🔍 Compare")}
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
          <button type="button" onClick={() => setMetric("continent")} aria-pressed={metric === "continent"} className={chip(metric === "continent")}>
            {lang === "ko" ? "대륙" : "Continent"}
          </button>
          {METRIC_KEYS.map((m) => (
            <button key={m} type="button" onClick={() => setMetric(m)} aria-pressed={metric === m} className={chip(metric === m)}>
              {t(m, lang)}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <p role="status" className="mt-3 inline-block rounded-lg bg-[#fdf3e2] px-3 py-1.5 text-[13px] font-semibold text-[#b6792e]">
          {notice}
        </p>
      )}

      {/* 지도 영역 — 평면 지도 한 장 */}
      <div className="relative mt-4">
        {/* 나라를 고르면 지도 위에 국기·대륙·나라 이름만 크게 띄운다 */}
        {bannerCountry && (
          <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
            <div className="flex items-center gap-2.5 rounded-full bg-white/95 px-4 py-2 shadow-md ring-1 ring-[#ece6e0] backdrop-blur-sm">
              <Flag country={bannerCountry} size={34} />
              <span className="text-[13px] font-semibold text-[#7d746e]">
                {lang === "ko" ? bannerCountry.continentKo : bannerCountry.continentEn}
              </span>
              <span className="text-[#ded5cc]">·</span>
              <span className="text-[19px] font-extrabold leading-none text-[#201b18]">
                {lang === "ko" ? bannerCountry.nameKo : bannerCountry.nameEn}
              </span>
            </div>
          </div>
        )}
        {dataset && (
          <MapPanel
            controller={controller} geojsonUrl={GEOJSON_URL} countries={dataset.countries}
            lang={lang} colors={colors} selectedCountry={selected}
            comparisonCountries={comparison} comparisonMode={mode === "compare"} dimmed={dimmed}
            onSelect={selectCountry} onReady={onMapReady} className={mapHeight}
          />
        )}
      </div>

      {/* 대륙 색 범례 — 색만으로 구분하지 않도록 이름을 함께 둔다 */}
      {dataset && metric === "continent" && (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {CONTINENTS.map((code) => {
            const sample = dataset.countries.find((c) => c.continentCode === code);
            return (
              <li key={code} className="flex items-center gap-1.5 text-[12px] text-[#7d746e]">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CONTINENT_FILL[code] }} />
                {lang === "ko" ? sample?.continentKo ?? code : sample?.continentEn ?? code}
              </li>
            );
          })}
        </ul>
      )}

      {!dataset && <p className="mt-6 text-[14px] text-[#7d746e]">{t("loading", lang)}</p>}

      {/* 상세 / 비교 */}
      <div className="mt-3">
        {!selectedRecord && dataset && mode === "explore" && view === "map" && (
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

        {dataset && view === "ranking" && mode === "explore" && (
          <RankingPanel
            dataset={dataset} lang={lang} metricId={rankMetric} continent={continent}
            order={rankOrder} showAll={rankShowAll}
            selectedIso3={selected} hoveredIso3={hoveredIso3}
            onMetric={setRankMetric} onContinent={setContinent} onOrder={setRankOrder}
            onShowAll={setRankShowAll}
            onPick={(iso3) => { setSelected(iso3); focusCountry(iso3); }}
            onHover={setHoveredIso3}
            onCompare={(iso3) => { setView("map"); enterCompare(); setComparison((l) => addComparison(l, iso3).list); }}
          />
        )}

        {dataset && mode === "compare" && (
          <ComparePanel
            countries={comparisonRecords} selections={comparison} dataset={dataset} lang={lang}
            flashIso3={flashIso3}
            onRemove={(iso3) => setComparison((l) => removeComparison(l, iso3))}
            onMove={(iso3, d) => setComparison((l) => moveComparison(l, iso3, d))}
            onClear={() => { setComparison(clearComparison()); setNotice(null); }}
            onExit={exitCompare}
          />
        )}

        {selectedRecord && dataset && mode === "explore" && view === "map" && (
          <CountryDetail
            country={selectedRecord} dataset={dataset} lang={lang}
            allCountries={dataset.countries} onCompare={enterCompare}
            onSelectCountry={selectCountry}
          />
        )}
      </div>

      {/* 데이터 출처 (명세서 §6.2 attribution) */}
      {dataset && (
        <footer className="mt-4 border-t border-[#ece6e0] pt-4 text-[11px] leading-relaxed text-[#a89f98]">
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
