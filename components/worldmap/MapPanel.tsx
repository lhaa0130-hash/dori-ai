"use client";

// 평면 지도(mercator) / 지구본(globe) 한 장. 두 장 모두 같은 GeoJSON·같은 선택 상태를 쓴다.
//
// 국가명 라벨은 MapLibre symbol 레이어 대신 HTML 오버레이로 그린다.
// symbol 레이어는 외부 글리프(.pbf) 서버가 필요해서, 그 서버가 죽으면 콘솔 오류가 쏟아지고
// 라벨이 통째로 사라진다. 오버레이는 자체 폰트를 쓰므로 그런 의존이 없다.

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { type Map as MlMap, type MapGeoJSONFeature } from "maplibre-gl";
import type { CountryRecord, SupportedLanguage } from "@/lib/worldmap/types";
import { MapSyncController, type MapSide, type Camera } from "@/lib/worldmap/mapSync";
import { t } from "@/lib/worldmap/i18n";

const SOURCE_ID = "countries";
const OCEAN = "#eaf5f5";
const LAND_DEFAULT = "#eeeae4";
const BORDER = "#c7beb6";
const ACCENT_A = "#ff8b55";
const ACCENT_B = "#4b7bec";

export interface MapPanelProps {
  side: MapSide;
  controller: MapSyncController;
  geojsonUrl: string;
  countries: CountryRecord[];
  lang: SupportedLanguage;
  /** iso3 → 채움색. 지표 색칠 결과. */
  colors: Record<string, string>;
  selectedA: string | null;
  selectedB: string | null;
  /** 대륙 필터 밖 국가는 지우지 않고 흐리게 (명세서 §8.2) */
  dimmed: Set<string> | null;
  onSelect: (iso3: string) => void;
  /** 지도가 준비되면 알린다. 최초 카메라 배치에 쓴다. */
  onReady?: (side: MapSide) => void;
  className?: string;
}

interface OverlayLabel {
  iso3: string;
  name: string;
  x: number;
  y: number;
  role: "a" | "b" | "plain";
}

/** 지구본은 뒷면 좌표도 화면 좌표를 돌려주므로, 실제로 보이는지 따로 확인한다. */
function isVisibleOnGlobe(map: MlMap, lon: number, lat: number): boolean {
  const center = map.getCenter();
  const toRad = Math.PI / 180;
  const cosAngle =
    Math.sin(center.lat * toRad) * Math.sin(lat * toRad) +
    Math.cos(center.lat * toRad) * Math.cos(lat * toRad) * Math.cos((lon - center.lng) * toRad);
  return cosAngle > 0.06;   // 가장자리 살짝 안쪽까지만
}

export default function MapPanel({
  side, controller, geojsonUrl, countries, lang, colors,
  selectedA, selectedB, dimmed, onSelect, onReady, className,
}: MapPanelProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);
  // 무엇 때문에 지도가 죽었는지 남긴다. 사용자에게는 stack 을 보여주지 않고(명세서 §16)
  // 개발 중에만 콘솔로 확인한다.
  const [failReason, setFailReason] = useState<string | null>(null);
  // 스타일이 올라오기 전에는 setFilter·setPaintProperty 가 통하지 않는다.
  // URL 로 국가를 지정해 들어온 경우 이 플래그가 서야 강조를 다시 건다.
  const [styleReady, setStyleReady] = useState(false);
  const [labels, setLabels] = useState<OverlayLabel[]>([]);
  const [hoverName, setHoverName] = useState<string | null>(null);

  // 콜백을 ref 로 잡아둔다. 지도는 한 번만 만들고, 핸들러가 바뀔 때마다 재생성하지 않는다.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const countriesRef = useRef(countries);
  countriesRef.current = countries;
  const langRef = useRef(lang);
  langRef.current = lang;
  const selRef = useRef({ a: selectedA, b: selectedB });
  selRef.current = { a: selectedA, b: selectedB };

  const paintLabels = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    const globe = side === "globe";
    const out: OverlayLabel[] = [];
    const { a, b } = selRef.current;

    for (const c of countriesRef.current) {
      const role = c.iso3 === a ? "a" : c.iso3 === b ? "b" : "plain";
      // 축척이 낮으면 화면이 글자로 덮이므로 선택된 나라만 보여준다(명세서 §6.2 "적절한 축척에서").
      if (role === "plain" && zoom < 2.6) continue;
      const [lon, lat] = c.center;
      if (globe && !isVisibleOnGlobe(map, lon, lat)) continue;
      const p = map.project([lon, lat]);
      if (p.x < 4 || p.y < 4 || p.x > map.getCanvas().clientWidth - 4 || p.y > map.getCanvas().clientHeight - 4) continue;
      out.push({ iso3: c.iso3, name: langRef.current === "ko" ? c.nameKo : c.nameEn, x: p.x, y: p.y, role });
      if (out.length > 40) break;      // 라벨이 너무 많으면 읽기 어렵고 느려진다
    }
    setLabels(out);
  }, [side]);

  // ── 지도 생성 (한 번만) ────────────────────────────────────────
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    let map: MlMap;
    try {
      map = new maplibregl.Map({
        container: holder,
        // 외부 스타일 서버에 의존하지 않는다. 우리 GeoJSON 만으로 완결된 스타일이다.
        style: {
          version: 8,
          // ⚠️ 투영은 반드시 스타일 안에서 정한다.
          //    map.setProjection() 을 생성 직후에 부르면 스타일이 아직 로드되지 않아 던진다.
          projection: { type: side === "globe" ? "globe" : "mercator" },
          sources: { [SOURCE_ID]: { type: "geojson", data: geojsonUrl, promoteId: "iso3" } },
          layers: [
            { id: "ocean", type: "background", paint: { "background-color": OCEAN } },
            {
              id: "country-fill",
              type: "fill",
              source: SOURCE_ID,
              paint: { "fill-color": LAND_DEFAULT, "fill-opacity": 1 },
            },
            {
              id: "country-line",
              type: "line",
              source: SOURCE_ID,
              paint: { "line-color": BORDER, "line-width": 0.6 },
            },
            {
              id: "country-selected",
              type: "line",
              source: SOURCE_ID,
              // 선택·비교 국가만 굵은 테두리. 색상만으로 구분하지 않도록 라벨도 함께 띄운다.
              filter: ["in", ["get", "iso3"], ["literal", []]],
              paint: { "line-color": ACCENT_A, "line-width": 2.4 },
            },
            {
              id: "country-compare",
              type: "line",
              source: SOURCE_ID,
              filter: ["in", ["get", "iso3"], ["literal", []]],
              paint: { "line-color": ACCENT_B, "line-width": 2.4 },
            },
            {
              id: "country-hover",
              type: "line",
              source: SOURCE_ID,
              filter: ["in", ["get", "iso3"], ["literal", []]],
              paint: { "line-color": ACCENT_A, "line-width": 1.4 },
            },
          ],
        },
        center: [10, 20],
        zoom: side === "globe" ? 0.9 : 1.1,
        minZoom: 0.6,
        maxZoom: 7,
        pitch: 0,
        attributionControl: { compact: true },
        // 지구본에서 각도가 붙으면 두 지도가 서로 다른 화면을 보여 혼란스럽다.
        pitchWithRotate: false,
        dragRotate: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[worldmap:${side}] 지도 생성 실패`, err);
      setFailReason(message);
      setFailed(true);
      return;
    }

    mapRef.current = map;

    // E2E 가 카메라 연동을 실제로 관찰하려면 지도 객체에 닿아야 한다(명세서 §17.4).
    // production 번들에는 넣지 않는다.
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      const w = window as unknown as { __worldmap?: Record<string, MlMap> };
      w.__worldmap = { ...(w.__worldmap ?? {}), [side]: map };
    }

    const adapter = {
      getCamera: (): Camera => {
        const c = map.getCenter();
        return { center: [c.lng, c.lat], zoom: map.getZoom(), bearing: map.getBearing() };
      },
      jumpTo: (cam: Camera) => map.jumpTo({ center: cam.center, zoom: cam.zoom, bearing: cam.bearing }),
      easeTo: (cam: Camera, duration: number) =>
        map.easeTo({ center: cam.center, zoom: cam.zoom, bearing: cam.bearing, duration }),
      stop: () => map.stop(),
    };
    controller.register(side, adapter);

    // 사용자가 직접 만지기 시작/끝 — 이 지도가 발신자가 된다.
    //
    // ⚠️ 반드시 originalEvent(실제 마우스·터치 이벤트)가 있을 때만 인정해야 한다.
    //    easeTo/jumpTo 같은 프로그램 이동도 zoomstart·movestart 를 쏘는데,
    //    그걸 사용자 조작으로 오해하면 beginInteraction 이 상대 지도의 stop() 을 불러
    //    **양쪽이 서로의 이동 애니메이션을 즉시 죽인다**(국가 선택이 먹통이 된다).
    const isUserGesture = (e: unknown): boolean =>
      !!(e as { originalEvent?: unknown } | undefined)?.originalEvent;
    const onDown = (e: unknown) => { if (isUserGesture(e)) controller.beginInteraction(side); };
    const onUp = (e: unknown) => { if (isUserGesture(e)) controller.endInteraction(side); };
    map.on("dragstart", onDown);
    map.on("zoomstart", onDown);
    map.on("rotatestart", onDown);
    map.on("dragend", onUp);
    map.on("zoomend", onUp);
    map.on("rotateend", onUp);
    // 휠 확대는 dragstart 가 없으므로 별도로 발신자 지정 (wheel 은 항상 사용자 조작이다)
    map.on("wheel", () => controller.beginInteraction(side));

    const onMove = () => {
      controller.handleMove(side, adapter.getCamera());
      paintLabels();
    };
    map.on("move", onMove);

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["country-fill"] })[0] as MapGeoJSONFeature | undefined;
      const iso3 = f?.properties?.iso3;
      if (typeof iso3 === "string") onSelectRef.current(iso3);
    };
    map.on("click", onClick);

    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["country-fill"] })[0] as MapGeoJSONFeature | undefined;
      const iso3 = (f?.properties?.iso3 as string | undefined) ?? null;
      if (iso3 === hoveredRef.current) return;
      hoveredRef.current = iso3;
      map.getCanvas().style.cursor = iso3 ? "pointer" : "";
      if (map.getLayer("country-hover")) {
        map.setFilter("country-hover", ["in", ["get", "iso3"], ["literal", iso3 ? [iso3] : []]]);
      }
      const rec = iso3 ? countriesRef.current.find((c) => c.iso3 === iso3) : null;
      setHoverName(rec ? (langRef.current === "ko" ? rec.nameKo : rec.nameEn) : null);
    };
    map.on("mousemove", onMouseMove);
    map.on("mouseout", () => { hoveredRef.current = null; setHoverName(null); });

    map.on("load", () => { setStyleReady(true); paintLabels(); onReady?.(side); });
    // WebGL context 를 잃어도 페이지 전체가 죽지 않게 한다(명세서 §16).
    map.on("webglcontextlost", () => setFailed(true));
    map.on("error", (e) => {
      // 타일·글리프 없는 스타일이라 대부분 무해하다. 조용히 넘기되 개발 중에는 남긴다.
      if (process.env.NODE_ENV === "development") console.warn(`[worldmap:${side}]`, e?.error?.message);
    });

    return () => {
      controller.unregister(side);
      map.remove();
      mapRef.current = null;
    };
    // 지도는 한 번만 만든다. geojsonUrl·side 는 이 컴포넌트 수명 동안 바뀌지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 색칠 갱신 ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;      // 스타일이 올라온 뒤 이 effect 가 다시 돈다
    const entries = Object.entries(colors);
    if (!entries.length) return;
    const expr: unknown[] = ["match", ["get", "iso3"]];
    for (const [iso3, color] of entries) expr.push(iso3, color);
    expr.push(LAND_DEFAULT);
    map.setPaintProperty("country-fill", "fill-color", expr as never);

    map.setPaintProperty(
      "country-fill",
      "fill-opacity",
      dimmed && dimmed.size
        ? (["case", ["in", ["get", "iso3"], ["literal", [...dimmed]]], 0.25, 1] as never)
        : 1,
    );
  }, [colors, dimmed, styleReady]);

  // ── 선택 표시 갱신 ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !map.getLayer("country-selected")) return;
    map.setFilter("country-selected", ["in", ["get", "iso3"], ["literal", selectedA ? [selectedA] : []]]);
    map.setFilter("country-compare", ["in", ["get", "iso3"], ["literal", selectedB ? [selectedB] : []]]);
    paintLabels();
  }, [selectedA, selectedB, styleReady, paintLabels]);

  // 탭 전환으로 크기가 바뀌면 캔버스를 다시 맞춘다.
  // ⚠️ 숨겨진 탭의 컨테이너는 폭이 0 이라, 보이게 된 다음 resize 해야 지도가 나타난다.
  useEffect(() => {
    const holder = holderRef.current;
    const map = mapRef.current;
    if (!holder || !map || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (holder.clientWidth > 0) { map.resize(); paintLabels(); }
    });
    ro.observe(holder);
    return () => ro.disconnect();
  }, [paintLabels]);

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
      {/* 국가명 오버레이 — 실제 DOM 텍스트라 확대해도 또렷하고 스크린리더에도 잡힌다 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {labels.map((l) => (
          <span
            key={l.iso3}
            className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded px-1 text-[11px] font-semibold leading-tight ${
              l.role === "a"
                ? "bg-[#ff8b55] text-white"
                : l.role === "b"
                  ? "bg-[#4b7bec] text-white"
                  : "text-[#4a423c] [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_2px_rgba(255,255,255,0.95)]"
            }`}
            style={{ left: l.x, top: l.y }}
          >
            {l.name}
          </span>
        ))}
      </div>
      {hoverName && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#201b18] shadow-sm ring-1 ring-[#ece6e0]">
          {hoverName}
        </div>
      )}
    </div>
  );
}
