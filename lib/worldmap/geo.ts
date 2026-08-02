// 월드맵 지오메트리 — TopoJSON 해석 + 투영. **외부 라이브러리 없이** 직접 구현한다.
//
// 왜 자체 구현인가:
//   · d3-geo·topojson-client 를 넣으면 번들이 커지고, 지금은 보안 릴리스가 진행 중이라
//     공유 node_modules 를 건드리지 않는 편이 안전하다.
//   · 필요한 건 정사도법(지구본)·정거원통도법(평면지도) 두 가지뿐이라 수식이 짧다.
//
// 좌표 규약: [경도(lon), 위도(lat)] — GeoJSON 과 동일한 순서.

export type Ring = number[][];          // [[lon, lat], ...]
export type Polygon = Ring[];           // [바깥 링, 구멍...]
export interface CountryShape {
  /** world-atlas 의 숫자 ISO 코드(ccn3). 국가 정보와 이 값으로 매칭한다. */
  id: string;
  name: string;
  polygons: Polygon[];
  /** 화면 밖 판정을 빠르게 하려고 미리 구해둔 경계 상자 [minLon, minLat, maxLon, maxLat] */
  bbox: [number, number, number, number];
}

// ── TopoJSON ────────────────────────────────────────────────────────
interface Topology {
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: number[][][];
  objects: Record<string, { type: string; geometries: TopoGeometry[] }>;
}
interface TopoGeometry {
  type: string;
  id?: string | number;
  arcs?: unknown;
  properties?: { name?: string };
}

/**
 * TopoJSON 의 델타 인코딩된 arc 를 실제 좌표열로 되돌린다.
 * 각 점은 이전 점과의 차이로 저장돼 있고, transform 으로 정수를 실수로 되돌린다.
 */
function decodeArcs(topo: Topology): number[][][] {
  const t = topo.transform;
  return topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => {
      x += dx; y += dy;
      return t ? [x * t.scale[0] + t.translate[0], y * t.scale[1] + t.translate[1]] : [x, y];
    });
  });
}

/** arc 인덱스(음수면 역방향)를 이어 붙여 하나의 링을 만든다. */
function ringFromArcs(indices: number[], arcs: number[][][]): Ring {
  const out: Ring = [];
  for (const idx of indices) {
    // ⚠️ 음수 인덱스는 '~i' 로 인코딩된 역방향 arc 다(TopoJSON 규약).
    const arc = idx < 0 ? arcs[~idx].slice().reverse() : arcs[idx];
    // 이어 붙일 때 이음새 점이 중복되므로 두 번째부터 넣는다.
    for (let i = out.length ? 1 : 0; i < arc.length; i++) out.push(arc[i] as number[]);
  }
  return out;
}

/** world-atlas TopoJSON → 국가별 폴리곤 목록. */
export function topoToCountries(topo: Topology, objectName = "countries"): CountryShape[] {
  const arcs = decodeArcs(topo);
  const geoms = topo.objects?.[objectName]?.geometries ?? [];
  const out: CountryShape[] = [];

  for (const g of geoms) {
    const polygons: Polygon[] = [];
    if (g.type === "Polygon") {
      polygons.push((g.arcs as number[][]).map((r) => ringFromArcs(r, arcs)));
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.arcs as number[][][]) polygons.push(poly.map((r) => ringFromArcs(r, arcs)));
    } else continue;

    let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
    for (const poly of polygons) for (const [lon, lat] of poly[0] ?? []) {
      if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    }
    out.push({
      id: String(Number(g.id)),
      name: g.properties?.name ?? "",
      polygons,
      bbox: [minLon, minLat, maxLon, maxLat],
    });
  }
  return out;
}

// ── 투영 ────────────────────────────────────────────────────────────
const RAD = Math.PI / 180;

export interface Viewport { width: number; height: number; }

/** 평면 지도(정거원통도법) — 경도·위도를 그대로 x·y 로. */
export function equirectangular(lon: number, lat: number, vp: Viewport): [number, number] {
  return [((lon + 180) / 360) * vp.width, ((90 - lat) / 180) * vp.height];
}

export interface GlobeView { lon: number; lat: number; radius: number; cx: number; cy: number; }

/**
 * 지구본(정사도법). 뒷면 점은 null 을 돌려준다.
 * 중심(lon0, lat0)을 기준으로 회전한 뒤 평행 투영한다.
 */
export function orthographic(lon: number, lat: number, v: GlobeView): [number, number] | null {
  const λ = (lon - v.lon) * RAD, φ = lat * RAD, φ0 = v.lat * RAD;
  const cosc = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ);
  if (cosc < 0) return null;                                   // 지구 반대편
  const x = Math.cos(φ) * Math.sin(λ);
  const y = Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ);
  return [v.cx + x * v.radius, v.cy - y * v.radius];
}

/** 화면 좌표 → 지구본 위의 경위도. 구 밖을 클릭하면 null. */
export function orthographicInvert(px: number, py: number, v: GlobeView): [number, number] | null {
  const x = (px - v.cx) / v.radius, y = -(py - v.cy) / v.radius;
  const ρ2 = x * x + y * y;
  if (ρ2 > 1) return null;
  const ρ = Math.sqrt(ρ2);
  if (ρ < 1e-9) return [v.lon, v.lat];
  const c = Math.asin(ρ), φ0 = v.lat * RAD;
  const lat = Math.asin(Math.cos(c) * Math.sin(φ0) + (y * Math.sin(c) * Math.cos(φ0)) / ρ) / RAD;
  const lon = v.lon + Math.atan2(x * Math.sin(c), ρ * Math.cos(c) * Math.cos(φ0) - y * Math.sin(c) * Math.sin(φ0)) / RAD;
  return [((lon + 540) % 360) - 180, lat];
}

/** 화면 좌표 → 평면지도 위의 경위도. */
export function equirectangularInvert(px: number, py: number, vp: Viewport): [number, number] {
  return [(px / vp.width) * 360 - 180, 90 - (py / vp.height) * 180];
}

// ── 히트 테스트 ─────────────────────────────────────────────────────
/** ray casting. 링 좌표는 [lon, lat]. */
function pointInRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 경위도가 어느 나라 안에 있는지. 없으면 null. 구멍(내부 링)도 처리한다. */
export function countryAt(lon: number, lat: number, shapes: CountryShape[]): CountryShape | null {
  for (const s of shapes) {
    const [minLon, minLat, maxLon, maxLat] = s.bbox;
    if (lon < minLon || lon > maxLon || lat < minLat || lat > maxLat) continue;   // 빠른 제외
    for (const poly of s.polygons) {
      if (!poly.length || !pointInRing(lon, lat, poly[0])) continue;
      let inHole = false;
      for (let h = 1; h < poly.length; h++) if (pointInRing(lon, lat, poly[h])) { inHole = true; break; }
      if (!inHole) return s;
    }
  }
  return null;
}

/** 나라의 대략적인 중심(경계 상자 중앙) — 지구본을 그 나라로 돌릴 때 쓴다. */
export function shapeCenter(s: CountryShape): [number, number] {
  return [(s.bbox[0] + s.bbox[2]) / 2, (s.bbox[1] + s.bbox[3]) / 2];
}
