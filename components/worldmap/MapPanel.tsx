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
/** 미니맵에 담을 위도 범위. Mercator 는 극지방이 무한히 늘어나므로 잘라야 세계가 다 들어온다. */
const MINI_MAX_LAT = 83;

/** 미니맵 위에 그릴 '현재 화면 범위' 상자. 날짜변경선을 넘으면 좌우 둘로 나눈다. */
export interface ViewBoxRect { l: number; t: number; w: number; h: number }

function computeViewBox(map: MlMap, mini: MlMap | null): ViewBoxRect[] {
  if (!mini) return [];
  const el = mini.getCanvas();
  const W = el.clientWidth, H = el.clientHeight;
  if (W <= 0 || H <= 0) return [];

  const b = map.getBounds();
  const north = Math.min(MINI_MAX_LAT, b.getNorth());
  const south = Math.max(-MINI_MAX_LAT, b.getSouth());
  const west = b.getWest(), east = b.getEast();

  const pct = (lonW: number, lonE: number): ViewBoxRect | null => {
    const tl = mini.project([lonW, north]);
    const br = mini.project([lonE, south]);
    const l = Math.max(0, Math.min(W, tl.x));
    const r = Math.max(0, Math.min(W, br.x));
    const t = Math.max(0, Math.min(H, tl.y));
    const bm = Math.max(0, Math.min(H, br.y));
    if (r - l < 1 || bm - t < 1) return null;
    return { l: (l / W) * 100, t: (t / H) * 100, w: ((r - l) / W) * 100, h: ((bm - t) / H) * 100 };
  };

  // 날짜변경선을 넘는 화면(통가·피지·키리바시 등)은 하나의 상자로 그릴 수 없다.
  if (east < west) {
    return [pct(west, 180), pct(-180, east)].filter((x): x is ViewBoxRect => x !== null);
  }
  const one = pct(west, east);
  return one ? [one] : [];
}

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

/** 미니맵 전용 고정 대륙색. 주 지도 색 기준과 무관하게 항상 같다. */
const MINI_CONTINENT: Record<string, string> = {
  AS: "#ffd9c2", EU: "#cfe0f5", AF: "#cfeadd", NA: "#e6d7f2", SA: "#fbeec6", OC: "#d3ecee",
};

function miniContinentExpr(countries: CountryRecord[]): unknown[] {
  const expr: unknown[] = ["match", ["get", "iso3"]];
  for (const c of countries) expr.push(c.iso3, MINI_CONTINENT[c.continentCode] ?? "#d8d0c8");
  expr.push("#d8d0c8");
  return expr;
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
  /** 클릭 가능한 점을 그릴지 — 라벨과 별개다(§3.5) */
  showMarker: boolean;
  /** 국가명 텍스트를 그릴지 */
  showLabel: boolean;
}

/**
 * 확대 단계 — 세계 전체가 맞춰진 zoom(worldBaseZoom)과의 차이로 정한다.
 *
 * ⚠️ zoom 절대값(예: 2.6)만 쓰면 안 된다. 컨테이너 높이가 바뀌면 세계 전체가 맞는 zoom 도
 *    달라져서, 어떤 화면에서는 처음부터 국가명이 쏟아진다.
 */
function labelStage(delta: number): 0 | 1 | 2 | 3 {
  if (delta < 0.45) return 0;   // 최초 세계 보기 — 국가명 0개
  if (delta < 1.2) return 1;    // 화면상 큰 나라만
  if (delta < 2.2) return 2;    // 중간 크기 추가
  return 3;                     // 작은 나라까지
}

/** 단계별로 '이 픽셀 크기 이상'인 나라만 이름을 보여준다. */
const STAGE_MIN_PX = [Infinity, 150, 70, 26];

/** 이미 놓인 라벨과 겹치는지 — 화면 사각형 목록으로 판정한다(§3.6). */
function collides(rects: Array<[number, number, number, number]>, r: [number, number, number, number]): boolean {
  for (const q of rects) {
    if (r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1]) return true;
  }
  return false;
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
  const miniRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<MlMap | null>(null);
  /** 세계 전체가 맞춰진 zoom. 라벨 단계는 이 값과의 차이로 정한다(§3.3). */
  const worldBaseZoomRef = useRef<number | null>(null);

  const [failed, setFailed] = useState(false);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [hover, setHover] = useState<CountryRecord | null>(null);
  /** marker 가 겹칠 때 임의로 고르지 않고 목록을 띄운다(§9-7). */
  const [overlap, setOverlap] = useState<{ x: number; y: number; list: CountryRecord[] } | null>(null);
  /** ⑨ 미니맵의 현재 보이는 범위 사각형(%) */
  const [viewBox, setViewBox] = useState<ViewBoxRect[]>([]);

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

    const stage = labelStage(map.getZoom() - (worldBaseZoomRef.current ?? map.getZoom()));
    const minPx = STAGE_MIN_PX[stage];
    const { selectedCountry: sel, comparisonCountries: cmp, comparisonMode: cmpMode } = stateRef.current;
    const rankOf = new Map(cmp.map((c, i) => [c.iso3, i + 1]));

    // 1) 화면 안에 있는 나라를 모으고 픽셀 크기를 잰다
    type Cand = { c: CountryRecord; x: number; y: number; sizePx: number; rank: number | null; selected: boolean; micro: boolean };
    const cands: Cand[] = [];
    for (const c of countriesRef.current) {
      const [lon, lat] = c.center;
      const p = map.project([lon, lat]);
      if (p.x < 2 || p.y < 2 || p.x > w - 2 || p.y > h - 2) continue;
      const a = map.project([c.bbox[0], c.bbox[1]]);
      const b = map.project([c.bbox[2], c.bbox[3]]);
      const sizePx = Math.hypot(b.x - a.x, b.y - a.y);
      cands.push({
        c, x: p.x, y: p.y, sizePx,
        rank: rankOf.get(c.iso3) ?? null,
        selected: !cmpMode && c.iso3 === sel,
        micro: sizePx < MICRO_MIN_PX,
      });
    }

    // 2) 라벨 우선순위 — 선택·비교가 가장 높고, 그다음은 화면에서 큰 나라 순.
    //    배열 순서(알파벳)대로 자르면 특정 대륙만 이름이 붙는다(§3.4).
    cands.sort((p, q) => {
      const rank = (x: Cand) => (x.selected ? 2 : x.rank !== null ? 1 : 0);
      return rank(q) - rank(p) || q.sizePx - p.sizePx;
    });

    // 3) 겹치지 않는 것만 라벨을 준다
    const placed: Array<[number, number, number, number]> = [];
    const out: Overlay[] = [];
    let labels = 0;
    for (const cand of cands) {
      const name = langRef.current === "ko" ? cand.c.nameKo : cand.c.nameEn;
      // 마커는 라벨과 별개다 — 최초 세계 보기에서도 작은 나라는 누를 수 있어야 한다.
      const showMarker = cand.micro;

      let showLabel = false;
      // 최초 세계 보기(stage 0)에서는 선택 국가조차 지도 안에 이름을 쓰지 않는다(§3.2).
      if (stage > 0 && labels < MAX_PLAIN_LABELS) {
        const big = cand.selected || cand.rank !== null || cand.sizePx >= minPx;
        if (big) {
          // 글자 폭 추정 — 한글은 글자당 약 11px, 영문은 약 6.5px
          const perChar = langRef.current === "ko" ? 11 : 6.5;
          const halfW = (name.length * perChar) / 2 + 4;
          const rect: [number, number, number, number] = [cand.x - halfW, cand.y - 9, cand.x + halfW, cand.y + 9];
          if (!collides(placed, rect)) { placed.push(rect); showLabel = true; labels++; }
        }
      }

      if (!showMarker && !showLabel && cand.rank === null && !cand.selected) continue;
      out.push({
        iso3: cand.c.iso3, name, x: cand.x, y: cand.y,
        rank: cand.rank,
        color: cand.rank ? colorFor(cand.rank - 1).fill : null,
        selected: cand.selected,
        micro: cand.micro,
        showMarker, showLabel,
      });
    }
    setOverlays(out);

    // 미니맵의 '지금 보고 있는 범위'.
    // ⚠️ 위경도를 백분율로 환산하면 Mercator 에서 위도가 어긋난다. 미니맵의 실제 project() 를 쓴다.
    setViewBox(computeViewBox(map, miniMapRef.current));
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
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 2, 3, 3, 6, 4.5] as never,
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

    map.on("load", () => { worldBaseZoomRef.current = map.getZoom(); setStyleReady(true); paintOverlays(); onReady?.(); });
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

  // ── 미니맵 ────────────────────────────────────────────────────
  // 같은 GeoJSON 을 쓰되 대륙 색만 칠하고 조작은 막는다. 클릭하면 그 지역으로 이동한다.
  useEffect(() => {
    const holder = miniRef.current;
    if (!holder || miniMapRef.current) return;
    let mini: MlMap;
    try {
      mini = new maplibregl.Map({
        container: holder,
        style: {
          version: 8,
          projection: { type: "mercator" },
          sources: { [SOURCE_ID]: { type: "geojson", data: geojsonUrl, promoteId: "iso3" } },
          layers: [
            { id: "ocean", type: "background", paint: { "background-color": "#e3eef0" } },
            {
              id: "land",
              type: "fill",
              source: SOURCE_ID,
              // ⚠️ 미니맵은 데이터 시각화가 아니라 '지금 어디를 보고 있나' 안내다.
              //    주 지도의 선택·비교·랭킹 색을 따라가면 미니맵 전체가 오렌지로 물들어
              //    위치 안내라는 본래 역할을 잃는다. 생성 시 대륙색으로 한 번만 고정한다.
              paint: { "fill-color": miniContinentExpr(countriesRef.current) as never },
            },
          ],
        },
        center: [0, 0], zoom: 0,
        // 세계가 좌우로 반복되면 범위 상자가 어디를 가리키는지 알 수 없다.
        renderWorldCopies: false,
        interactive: false, attributionControl: false,
      });
    } catch { return; }
    miniMapRef.current = mini;

    // ⚠️ 고정 zoom 을 쓰면 컨테이너 크기가 조금만 달라도 아메리카가 잘린다.
    //    실제 캔버스 크기에 맞춰 세계 전체를 담도록 계산한다.
    const fitWorld = () => {
      const el = mini.getCanvas();
      if (el.clientWidth <= 0 || el.clientHeight <= 0) return;   // 크기가 잡히기 전이면 하지 않는다
      mini.fitBounds(
        [[-180, MINI_MAX_LAT * -1], [180, MINI_MAX_LAT]],
        { padding: 3, duration: 0, animate: false },
      );
    };
    mini.on("load", fitWorld);

    // 컨테이너 크기가 바뀌면 다시 맞춘다
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { mini.resize(); fitWorld(); paintOverlays(); })
      : null;
    ro?.observe(holder);

    // 미니맵을 누르면 주 지도를 그 지역으로 옮긴다
    // 누른 지점을 미니맵의 실제 투영으로 되돌린다.
    // 선형 환산(x/width→경도)은 Mercator 에서 위도가 어긋난다.
    const onClick = (e: MouseEvent) => {
      const map = mapRef.current;
      if (!map) return;
      const r = holder.getBoundingClientRect();
      const ll = mini.unproject([e.clientX - r.left, e.clientY - r.top]);
      map.easeTo({ center: [ll.lng, ll.lat], zoom: map.getZoom(), duration: 600 });
    };
    holder.style.cursor = "pointer";
    holder.addEventListener("click", onClick);

    return () => { ro?.disconnect(); holder.removeEventListener("click", onClick); mini.remove(); miniMapRef.current = null; };
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
            {o.showMarker && (
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
                {/* 최초 세계 보기에서는 번호만 — 이름은 확대해야 나온다 */}
                {o.showLabel && o.name}
              </span>
            ) : o.showLabel ? (
              <span
                className={`whitespace-nowrap rounded px-1 text-[11px] font-semibold leading-tight ${
                  o.selected
                    ? "bg-[#ff8b55] text-white"
                    : "text-[#4a423c] [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_2px_rgba(255,255,255,0.95)]"
                }`}
              >
                {o.name}
              </span>
            ) : null}
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

      {/* 미니맵 — 실제 국가 도형을 대륙 색으로만 칠한 축소 지도. 클릭하면 그 지역으로 이동한다. */}
      <div className="absolute bottom-3 right-3 z-10 hidden overflow-hidden rounded-lg shadow-sm ring-1 ring-[#d9d0c8] sm:block">
        <div ref={miniRef} style={{ width: 156, height: 98 }} role="img" aria-label={lang === "ko" ? "세계 전체 위치 미니맵" : "World location minimap"} />
        {/* 거의 세계 전체를 보고 있으면 상자가 미니맵을 다 덮어 의미가 없다 — 그때는 그리지 않는다 */}
        {viewBox
          .filter((v) => !(v.w > 92 && v.h > 92))
          .map((v, i) => (
            <span
              key={i}
              className="pointer-events-none absolute rounded-[2px] border border-[#f47f45] bg-[#ff9966]/10"
              style={{ left: `${v.l}%`, top: `${v.t}%`, width: `${v.w}%`, height: `${v.h}%` }}
            />
          ))}
      </div>

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
