"use client";

// 평면 지도(mercator) / 지구본(globe) 한 장. 두 장 모두 같은 GeoJSON·같은 선택 상태를 쓴다.
//
// 국가명 라벨과 작은 나라 marker 는 MapLibre symbol 레이어 대신 HTML 오버레이로 그린다.
// symbol 레이어는 외부 글리프(.pbf) 서버가 필요해서, 그 서버가 죽으면 콘솔 오류가 쏟아지고
// 라벨이 통째로 사라진다. 오버레이는 자체 폰트를 쓰므로 그런 의존이 없다.

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { type Map as MlMap, type MapGeoJSONFeature } from "maplibre-gl";
import type { CountryRecord, SupportedLanguage } from "@/lib/worldmap/types";
import { MapSyncController, type Camera } from "@/lib/worldmap/mapSync";
import { type ComparisonSelection, colorFor } from "@/lib/worldmap/comparison";
import { t } from "@/lib/worldmap/i18n";

const SOURCE_ID = "countries";
const OCEAN = "#eaf5f5";
const LAND_DEFAULT = "#eeeae4";
const BORDER = "#c7beb6";
const ACCENT = "#ff8b55";

/** 작은 나라는 폴리곤이 화면에서 몇 px 안 되므로 반드시 marker 로 눌러야 한다. */
const MICRO_MIN_PX = 14;
/** pointer 한 점 대신 이 반경의 상자로 질의해 얇은 나라도 잡는다(후속 지시서 §9-6). */
const HIT_PAD_PX = 9;
/** 이 거리보다 많이 끌었으면 탭이 아니라 팬으로 본다(§9-9). */
const TAP_SLOP_PX = 8;
/** 일반 국가명 라벨 상한. 작은 나라 marker·선택·비교는 여기 포함되지 않는다. */
const MAX_PLAIN_LABELS = 40;

export interface MapPanelProps {
  controller: MapSyncController;
  geojsonUrl: string;
  countries: CountryRecord[];
  lang: SupportedLanguage;
  colors: Record<string, string>;
  /** 일반 탐색의 단일 선택. 비교 모드에서는 표시하지 않는다. */
  selectedCountry: string | null;
  comparisonCountries: ComparisonSelection[];
  comparisonMode: boolean;
  dimmed: Set<string> | null;
  onSelect: (iso3: string) => void;
  onReady?: () => void;
  className?: string;
}

/** 수도 좌표만 모아 점 레이어용 GeoJSON 을 만든다. */
function capitalsGeoJson(countries: CountryRecord[]) {
  return {
    type: "FeatureCollection" as const,
    features: countries
      .filter((c) => Array.isArray(c.capitalPoint))
      .map((c) => ({
        type: "Feature" as const,
        properties: { iso3: c.iso3 },
        geometry: { type: "Point" as const, coordinates: c.capitalPoint as [number, number] },
      })),
  };
}

interface Overlay {
  iso3: string;
  name: string;
  x: number;
  y: number;
  /** 비교 순번(1~4). 없으면 null. */
  rank: number | null;
  color: string | null;
  selected: boolean;
  /** 화면상 폴리곤이 너무 작아 marker 로만 누를 수 있는 나라 */
  micro: boolean;
}


export default function MapPanel({
  controller, geojsonUrl, countries, lang, colors,
  selectedCountry, comparisonCountries, comparisonMode, dimmed, onSelect, onReady, className,
}: MapPanelProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downPointRef = useRef<{ x: number; y: number } | null>(null);

  const [failed, setFailed] = useState(false);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [hover, setHover] = useState<CountryRecord | null>(null);
  /** marker 가 겹칠 때 임의로 고르지 않고 목록을 띄운다(§9-7). */
  const [overlap, setOverlap] = useState<{ x: number; y: number; list: CountryRecord[] } | null>(null);
  /** ⑨ 미니맵의 현재 보이는 범위 사각형(%) */
  const [viewBox, setViewBox] = useState<{ l: number; t: number; w: number; h: number } | null>(null);

  // 콜백·데이터를 ref 로 잡아둔다. 지도는 한 번만 만들고 재생성하지 않는다.
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const countriesRef = useRef(countries); countriesRef.current = countries;
  const langRef = useRef(lang); langRef.current = lang;
  const stateRef = useRef({ selectedCountry, comparisonCountries, comparisonMode });
  stateRef.current = { selectedCountry, comparisonCountries, comparisonMode };

  // ── 오버레이(국가명·순번·작은 나라 marker) 계산 ────────────────
  const paintOverlays = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const canvas = map.getCanvas();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return;      // 숨겨진 탭은 폭이 0 이다

    const zoom = map.getZoom();
        const { selectedCountry: sel, comparisonCountries: cmp, comparisonMode: cmpMode } = stateRef.current;
    const rankOf = new Map(cmp.map((c, i) => [c.iso3, i + 1]));
    const out: Overlay[] = [];
    let plainLabels = 0;   // 일반 국가명 라벨 개수(상한 검사용)

    for (const c of countriesRef.current) {
      const [lon, lat] = c.center;
      const p = map.project([lon, lat]);
      if (p.x < 2 || p.y < 2 || p.x > w - 2 || p.y > h - 2) continue;

      const rank = rankOf.get(c.iso3) ?? null;
      const selected = !cmpMode && c.iso3 === sel;

      // 화면상 나라 크기(경계 상자 대각선 px). 작으면 marker 를 띄워 반드시 누를 수 있게 한다.
      const a = map.project([c.bbox[0], c.bbox[1]]);
      const b = map.project([c.bbox[2], c.bbox[3]]);
      const sizePx = Math.hypot(b.x - a.x, b.y - a.y);
      const micro = sizePx < MICRO_MIN_PX;

      // 라벨이 화면을 덮지 않도록: 선택·비교·작은 나라는 항상, 나머지는 확대했을 때만.
      if (!rank && !selected && !micro && zoom < 2.6) continue;

      // 작은 나라 marker·선택·비교는 라벨 상한과 무관하게 항상 넣는다.
      // 상한에 밀려 빠지면 '지도에서 직접 선택' 자체가 불가능해진다.
      //
      // ⚠️ 상한 검사에 out.filter() 를 쓰면 안 된다. 이 루프는 move 이벤트마다 195번 도는데
      //    안에서 배열을 다시 훑으면 프레임당 수만 번 연산이 되어 지도가 눈에 띄게 버벅인다.
      //    카운터 하나로 센다.
      const mustShow = micro || selected || rank !== null;
      if (!mustShow) {
        if (plainLabels >= MAX_PLAIN_LABELS) continue;
        plainLabels++;
      }

      out.push({
        iso3: c.iso3,
        name: langRef.current === "ko" ? c.nameKo : c.nameEn,
        x: p.x, y: p.y,
        rank,
        color: rank ? colorFor(rank - 1).fill : null,
        selected,
        micro,
      });
    }
    setOverlays(out);

    // ⑨ 미니맵에 표시할 '지금 보고 있는 범위'. 정거원통도법 비율로 환산한다.
    const b = map.getBounds();
    const west = b.getWest(), east = b.getEast();
    const lonSpan = east >= west ? east - west : east + 360 - west;
    setViewBox({
      l: (((west + 180) % 360) / 360) * 100,
      t: ((90 - Math.min(85, b.getNorth())) / 180) * 100,
      w: Math.min(100, (lonSpan / 360) * 100),
      h: Math.min(100, ((Math.min(85, b.getNorth()) - Math.max(-85, b.getSouth())) / 180) * 100),
    });
  }, []);

  // ── 지도 생성 (한 번만) ────────────────────────────────────────
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    let map: MlMap;
    try {
      map = new maplibregl.Map({
        container: holder,
        style: {
          version: 8,
          // ⚠️ 투영은 반드시 스타일 안에서 정한다.
          //    map.setProjection() 을 생성 직후에 부르면 스타일이 아직 로드되지 않아 던진다.
          projection: { type: "mercator" },
          sources: {
            [SOURCE_ID]: { type: "geojson", data: geojsonUrl, promoteId: "iso3" },
            // ⑧ 수도는 점 하나만 찍는다(글씨 없음). 나라 데이터에서 만든다.
            capitals: { type: "geojson", data: capitalsGeoJson(countriesRef.current) },
          },
          layers: [
            { id: "ocean", type: "background", paint: { "background-color": OCEAN } },
            // ⑦ hover 한 나라를 살짝 밝게 — 어디를 가리키는지 바로 보인다
            {
              id: "country-hover-fill",
              type: "fill",
              source: SOURCE_ID,
              filter: ["in", ["get", "iso3"], ["literal", []]] as never,
              paint: { "fill-color": "#ffffff", "fill-opacity": 0.28 },
            },
            { id: "country-fill", type: "fill", source: SOURCE_ID, paint: { "fill-color": LAND_DEFAULT, "fill-opacity": 1 } },
            { id: "country-line", type: "line", source: SOURCE_ID, paint: { "line-color": BORDER, "line-width": 0.35, "line-opacity": 0.75 } },
            // 비교 1~4번은 각각 별도 레이어로 둔다. 색이 서로 덮이지 않고 filter 만 갈아끼우면 된다.
            ...[0, 1, 2, 3].map((i) => ({
              id: `compare-${i}`,
              type: "line" as const,
              source: SOURCE_ID,
              filter: ["in", ["get", "iso3"], ["literal", []]] as never,
              paint: { "line-color": colorFor(i).fill, "line-width": 1.8 },
            })),
            ...[0, 1, 2, 3].map((i) => ({
              id: `compare-fill-${i}`,
              type: "fill" as const,
              source: SOURCE_ID,
              filter: ["in", ["get", "iso3"], ["literal", []]] as never,
              paint: { "fill-color": colorFor(i).fill, "fill-opacity": 0.28 },
            })),
            { id: "country-selected", type: "line", source: SOURCE_ID, filter: ["in", ["get", "iso3"], ["literal", []]], paint: { "line-color": ACCENT, "line-width": 1.6 } },
            // hover 는 비교 색을 덮지 않도록 가장 얇게, 맨 위에 둔다(§10)
            { id: "country-hover", type: "line", source: SOURCE_ID, filter: ["in", ["get", "iso3"], ["literal", []]], paint: { "line-color": ACCENT, "line-width": 1.1 } },
            // ⑧ 수도 점 — 확대할수록 살짝 커진다. 흰 테두리로 어떤 색 위에서도 보이게.
            {
              id: "capital-dot",
              type: "circle",
              source: "capitals",
              paint: {
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 1.6, 3, 2.6, 6, 4] as never,
                "circle-color": "#3f3a35",
                "circle-stroke-width": 1,
                "circle-stroke-color": "rgba(255,255,255,0.9)",
                "circle-opacity": ["interpolate", ["linear"], ["zoom"], 0.8, 0.35, 2, 0.85] as never,
              },
            },
          ],
        },
        center: [10, 20],
        zoom: 1.1,
        minZoom: 0.6,
        maxZoom: 7,
        pitch: 0,
        attributionControl: { compact: true },
        pitchWithRotate: false,
        dragRotate: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[worldmap] 지도 생성 실패", err);
      setFailReason(message);
      setFailed(true);
      return;
    }

    mapRef.current = map;

    // E2E 가 카메라 연동을 실제로 관찰하려면 지도 객체에 닿아야 한다(명세서 §17.4).
    // production 번들에는 넣지 않는다.
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      const w = window as unknown as { __worldmap?: Record<string, MlMap> };
      w.__worldmap = { flat: map };
    }

    const adapter = {
      getCamera: (): Camera => {
        const c = map.getCenter();
        return { center: [c.lng, c.lat], zoom: map.getZoom(), bearing: map.getBearing() };
      },
      jumpTo: (cam: Camera) => map.jumpTo({ center: cam.center, zoom: cam.zoom, bearing: cam.bearing }),
      easeTo: (cam: Camera, duration: number) => map.easeTo({ center: cam.center, zoom: cam.zoom, bearing: cam.bearing, duration }),
      stop: () => map.stop(),
    };
    controller.register("flat", adapter);

    // ⚠️ 반드시 originalEvent(실제 마우스·터치 이벤트)가 있을 때만 사용자 조작으로 인정한다.
    //    easeTo/jumpTo 같은 프로그램 이동도 zoomstart 를 쏘는데, 그걸 조작으로 오해하면
    //    beginInteraction 이 상대 지도의 stop() 을 불러 **양쪽이 서로의 이동을 죽인다.**
    const isUserGesture = (e: unknown) => !!(e as { originalEvent?: unknown } | undefined)?.originalEvent;
    const onDown = (e: unknown) => { if (isUserGesture(e)) controller.beginInteraction("flat"); };
    const onUp = (e: unknown) => { if (isUserGesture(e)) controller.endInteraction("flat"); };
    map.on("dragstart", onDown);
    map.on("zoomstart", onDown);
    map.on("rotatestart", onDown);
    map.on("dragend", onUp);
    map.on("zoomend", onUp);
    map.on("rotateend", onUp);
    map.on("wheel", () => controller.beginInteraction("flat"));

    // 드래그가 시작되면 tooltip 을 즉시 감춘다(§10)
    map.on("dragstart", () => { setHover(null); hoveredRef.current = null; });

    const onMove = () => { controller.handleMove("flat", adapter.getCamera()); paintOverlays(); };
    map.on("move", onMove);

    /** pointer 주변 상자로 질의해 얇고 작은 나라도 잡는다. */
    const hitAt = (pt: maplibregl.Point): string[] => {
      const box: [maplibregl.PointLike, maplibregl.PointLike] = [
        [pt.x - HIT_PAD_PX, pt.y - HIT_PAD_PX],
        [pt.x + HIT_PAD_PX, pt.y + HIT_PAD_PX],
      ];
      const feats = map.queryRenderedFeatures(box, { layers: ["country-fill"] }) as MapGeoJSONFeature[];
      const seen = new Set<string>();
      for (const f of feats) {
        const iso3 = f.properties?.iso3;
        if (typeof iso3 === "string") seen.add(iso3);
      }
      return [...seen];
    };

    // 탭/클릭: 많이 끌었으면 선택하지 않는다(§9-9)
    map.on("mousedown", (e) => { downPointRef.current = { x: e.point.x, y: e.point.y }; });
    map.on("touchstart", (e) => { downPointRef.current = { x: e.point.x, y: e.point.y }; });

    map.on("click", (e) => {
      const down = downPointRef.current;
      downPointRef.current = null;
      if (down && Math.hypot(e.point.x - down.x, e.point.y - down.y) > TAP_SLOP_PX) return;

      const hits = hitAt(e.point);
      if (hits.length === 0) { setOverlap(null); return; }
      if (hits.length === 1) { setOverlap(null); onSelectRef.current(hits[0]); return; }
      // 여러 나라가 겹쳤다 — 임의로 고르지 않고 목록을 띄운다
      const list = hits.map((iso3) => countriesRef.current.find((c) => c.iso3 === iso3)).filter(Boolean) as CountryRecord[];
      setOverlap({ x: e.point.x, y: e.point.y, list });
    });

    // hover 는 100~150ms 지연 후에만 띄운다(§10). 같은 나라 안에서 움직일 때는 다시 만들지 않는다.
    map.on("mousemove", (e) => {
      const iso3 = hitAt(e.point)[0] ?? null;
      if (iso3 === hoveredRef.current) return;
      hoveredRef.current = iso3;
      map.getCanvas().style.cursor = iso3 ? "pointer" : "";
      const hoverFilter = ["in", ["get", "iso3"], ["literal", iso3 ? [iso3] : []]] as never;
      if (map.getLayer("country-hover")) map.setFilter("country-hover", hoverFilter);
      if (map.getLayer("country-hover-fill")) map.setFilter("country-hover-fill", hoverFilter);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (!iso3) { setHover(null); return; }
      hoverTimerRef.current = setTimeout(() => {
        setHover(countriesRef.current.find((c) => c.iso3 === iso3) ?? null);
      }, 120);
    });
    map.on("mouseout", () => {
      hoveredRef.current = null;
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      setHover(null);
    });

    map.on("load", () => { setStyleReady(true); paintOverlays(); onReady?.(); });
    map.on("webglcontextlost", () => setFailed(true));
    map.on("error", (e) => {
      if (process.env.NODE_ENV === "development") console.warn("[worldmap]", e?.error?.message);
    });

    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      controller.unregister("flat");
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 색칠 갱신 ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const entries = Object.entries(colors);
    if (entries.length) {
      const expr: unknown[] = ["match", ["get", "iso3"]];
      for (const [iso3, color] of entries) expr.push(iso3, color);
      expr.push(LAND_DEFAULT);
      map.setPaintProperty("country-fill", "fill-color", expr as never);
    }
    map.setPaintProperty(
      "country-fill",
      "fill-opacity",
      dimmed && dimmed.size ? (["case", ["in", ["get", "iso3"], ["literal", [...dimmed]]], 0.25, 1] as never) : 1,
    );
  }, [colors, dimmed, styleReady]);

  // ── 선택·비교 표시 갱신 ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    for (let i = 0; i < 4; i++) {
      const iso3 = comparisonCountries[i]?.iso3;
      const filter = ["in", ["get", "iso3"], ["literal", iso3 ? [iso3] : []]] as never;
      if (map.getLayer(`compare-${i}`)) map.setFilter(`compare-${i}`, filter);
      if (map.getLayer(`compare-fill-${i}`)) map.setFilter(`compare-fill-${i}`, filter);
    }
    // 비교 모드에서는 일반 선택 강조를 끈다
    if (map.getLayer("country-selected")) {
      const solo = !comparisonMode && selectedCountry ? [selectedCountry] : [];
      map.setFilter("country-selected", ["in", ["get", "iso3"], ["literal", solo]]);
    }
    paintOverlays();
  }, [selectedCountry, comparisonCountries, comparisonMode, styleReady, paintOverlays]);

  // 탭 전환으로 크기가 바뀌면 캔버스를 다시 맞춘다.
  // ⚠️ 숨겨진 탭의 컨테이너는 폭이 0 이라, 보이게 된 다음 resize 해야 지도가 나타난다.
  useEffect(() => {
    const holder = holderRef.current;
    const map = mapRef.current;
    if (!holder || !map || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (holder.clientWidth > 0) { map.resize(); paintOverlays(); }
    });
    ro.observe(holder);
    return () => ro.disconnect();
  }, [paintOverlays]);

  if (failed) {
    return (
      <div className={className}>
        <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-[#ece6e0] bg-[#f8f4f0] p-6 text-center">
          <p className="text-sm font-semibold text-[#201b18]">{t("webglFallback", lang)}</p>
          <p className="text-xs text-[#7d746e]">{t("webglFallbackHint", lang)}</p>
          {process.env.NODE_ENV === "development" && failReason && (
            <p className="mt-1 max-w-md font-mono text-[10px] text-[#c64e4e]">{failReason}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <div
        ref={holderRef}
        className="h-full w-full overflow-hidden rounded-2xl border border-[#ece6e0]"
        role="img"
        aria-label={t("mapLabel", lang)}
      />

      {/* 국가명·순번·작은 나라 marker */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {overlays.map((o) => (
          <div key={o.iso3} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: o.x, top: o.y }}>
            {o.micro && (
              // 작은 나라는 눌리는 영역을 크게 만든다: 데스크톱 32px, 터치 44px
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSelectRef.current(o.iso3); }}
                aria-label={o.name}
                className="pointer-events-auto absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff9966] sm:h-8 sm:w-8"
              >
                <span
                  className="absolute left-1/2 top-1/2 block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: o.color ?? (o.selected ? ACCENT : "#7d746e") }}
                />
              </button>
            )}
            {o.rank ? (
              <span
                className="flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-tight text-white"
                style={{ backgroundColor: o.color ?? ACCENT }}
              >
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/30 text-[9px]">{o.rank}</span>
                {o.name}
              </span>
            ) : (
              <span
                className={`whitespace-nowrap rounded px-1 text-[11px] font-semibold leading-tight ${
                  o.selected
                    ? "bg-[#ff8b55] text-white"
                    : "text-[#4a423c] [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_2px_rgba(255,255,255,0.95)]"
                }`}
              >
                {o.name}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 겹친 나라 목록 — 임의로 고르지 않는다 */}
      {overlap && (
        <div
          role="listbox"
          aria-label={lang === "ko" ? "겹친 나라 선택" : "Overlapping countries"}
          className="absolute z-20 max-h-56 -translate-x-1/2 overflow-auto rounded-xl border border-[#ece6e0] bg-white py-1 shadow-lg"
          style={{ left: overlap.x, top: overlap.y + 12 }}
          onKeyDown={(e) => { if (e.key === "Escape") setOverlap(null); }}
        >
          {overlap.list.map((c) => (
            <button
              key={c.iso3}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => { setOverlap(null); onSelectRef.current(c.iso3); }}
              className="block w-full px-3 py-2 text-left text-[13px] font-medium text-[#40382f] hover:bg-[#fff0e6] focus-visible:bg-[#fff0e6] focus-visible:outline-none"
            >
              {lang === "ko" ? c.nameKo : c.nameEn}
            </button>
          ))}
        </div>
      )}

      {/* ⑨ 미니맵 — 우측 하단. 세계 전체 실루엣 위에 지금 보는 범위를 표시한다. */}
      {viewBox && (
        <div
          className="pointer-events-none absolute bottom-3 right-3 z-10 overflow-hidden rounded-md bg-[#eaf5f5]/95 shadow-sm ring-1 ring-[#d9d0c8]"
          style={{ width: 132, height: 66 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 360 180" width="132" height="66" preserveAspectRatio="none">
            {/* 대륙 실루엣 — 미니맵이라 아주 단순한 도형이면 충분하다 */}
            <g fill="#c9c0b8" opacity="0.85">
              <path d="M35 30h60l18 22-14 26-24 8-16 30-18-14-6-38z" />
              <path d="M108 96l24-6 16 34-10 40-18 6-14-34z" />
              <path d="M168 26l40-4 22 14-8 22-26 10-20-16z" />
              <path d="M172 66l30 4 16 30-8 44-26 8-18-40z" />
              <path d="M214 24l90-6 44 22-16 46-52 20-44-24-16-38z" />
              <path d="M292 116l34-6 14 18-16 20-28-6z" />
            </g>
          </svg>
          {/* 지금 보이는 범위 */}
          <span
            className="absolute rounded-[2px] border-2 border-[#f47f45] bg-[#ff9966]/20"
            style={{
              left: `${viewBox.l}%`, top: `${viewBox.t}%`,
              width: `${viewBox.w}%`, height: `${viewBox.h}%`,
            }}
          />
        </div>
      )}

      {/* hover tooltip — pointer 를 덮지 않게 왼쪽 위 고정 */}
      {hover && !overlap && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white px-2.5 py-1.5 text-xs shadow-sm ring-1 ring-[#ece6e0]">
          <p className="font-bold text-[#201b18]">
            {lang === "ko" ? hover.nameKo : hover.nameEn}
            <span className="ml-1 font-normal text-[#a89f98]">{lang === "ko" ? hover.nameEn : hover.nameKo}</span>
          </p>
          <p className="text-[10px] text-[#7d746e]">
            {lang === "ko" ? hover.continentKo : hover.continentEn}
            {(lang === "ko" ? hover.capitalKo : hover.capitalEn) && ` · ${lang === "ko" ? hover.capitalKo : hover.capitalEn}`}
          </p>
        </div>
      )}
    </div>
  );
}
