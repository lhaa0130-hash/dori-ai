// 월드맵 데이터 동기화 (명세서 §12 `sync:data`)
//
//   1) 195개국 레지스트리 구성      2) Natural Earth 경계 연결
//   3) World Bank 지표             4) Wikidata(지도자·수립일·종교·수도 한글명)
//   5) manual override             6) 검증          7) 스냅샷 저장
//
// 외부 API 가 죽어도 마지막 정상 스냅샷을 유지한다. 다만 **레지스트리와 경계 연결 오류는
// 배포 차단 오류**로 취급한다(명세서 §12 마지막 문단).
//
// 실행: npm run sync:data          변경 없이 확인만: npm run sync:data -- --dry-run

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCES, WB_INDICATORS, fetchJson, sparql, isoDate } from "./sources.mjs";

// ⚠️ 경로에 공백이 있어 new URL(...).pathname 은 %20 이 남는다. fileURLToPath 를 써야 한다.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DATA_DIR = path.join(ROOT, "data", "worldmap");
const PUBLIC_DIR = path.join(ROOT, "public", "worldmap");
const DRY = process.argv.includes("--dry-run");

const FETCHED_AT = new Date().toISOString();
const errors = [];
const note = (msg) => process.stdout.write(`${msg}\n`);
const fail = (source, message) => {
  errors.push({ source, message });
  process.stdout.write(`  ! ${source}: ${message}\n`);
};

// ── 대륙·하위지역 한글 표기 ────────────────────────────────────────
// world-countries 는 국가명만 번역을 제공한다. 지역명은 표준 표기를 직접 둔다.
const CONTINENT_KO = { AF: "아프리카", AS: "아시아", EU: "유럽", NA: "북아메리카", SA: "남아메리카", OC: "오세아니아" };
const CONTINENT_EN = { AF: "Africa", AS: "Asia", EU: "Europe", NA: "North America", SA: "South America", OC: "Oceania" };
const SUBREGION_KO = {
  "Northern Africa": "북아프리카", "Western Africa": "서아프리카", "Middle Africa": "중앙아프리카",
  "Eastern Africa": "동아프리카", "Southern Africa": "남아프리카",
  "Central Asia": "중앙아시아", "Eastern Asia": "동아시아", "South-Eastern Asia": "동남아시아",
  "Southern Asia": "남아시아", "Western Asia": "서아시아",
  "Eastern Europe": "동유럽", "Northern Europe": "북유럽", "Southern Europe": "남유럽", "Western Europe": "서유럽",
  "Caribbean": "카리브", "Central America": "중앙아메리카", "North America": "북아메리카", "South America": "남아메리카",
  "Australia and New Zealand": "오스트레일리아·뉴질랜드", "Melanesia": "멜라네시아",
  "Micronesia": "미크로네시아", "Polynesia": "폴리네시아",
};

/** region + subregion → 명세서가 정한 6개 대륙 코드. 아메리카는 하위지역으로 남·북을 가른다. */
function continentCode(region, subregion) {
  if (region === "Africa") return "AF";
  if (region === "Asia") return "AS";
  if (region === "Europe") return "EU";
  if (region === "Oceania") return "OC";
  if (region === "Americas") return subregion === "South America" ? "SA" : "NA";
  return null;
}

// ── 1) 레지스트리 ──────────────────────────────────────────────────
// UN 회원국 193 + 옵서버 2(바티칸 VAT, 팔레스타인 PSE) = 195 (명세서 §2.1)
//
// ⚠️ world-countries 5.1.0 은 교황청(VAT)을 unMember:true 로 잘못 표기한다(실제는 옵서버).
//    그대로 쓰면 회원국이 194 로 집계되므로 여기서 바로잡는다.
const OBSERVERS = new Set(["VAT", "PSE"]);

async function buildRegistry() {
  note("\n[1/7] 195개국 레지스트리");
  const raw = await fetchJson(SOURCES.restCountries.url, { timeoutMs: 120000 });
  if (!Array.isArray(raw)) throw new Error("world-countries 데이터를 받지 못했습니다 (배포 차단 오류)");

  const registry = [];
  for (const c of raw) {
    const iso3 = c.cca3;
    // 옵서버는 데이터셋 플래그와 무관하게 항상 옵서버로 분류한다(위 ⚠️ 참고).
    const isMember = c.unMember === true && !OBSERVERS.has(iso3);
    if (!isMember && !OBSERVERS.has(iso3)) continue;

    const code = continentCode(c.region, c.subregion);
    if (!code) { fail("registry", `${iso3}: 대륙 분류 실패 (region=${c.region})`); continue; }

    registry.push({
      iso2: c.cca2,
      iso3,
      ccn3: c.ccn3 ?? null,
      nameKo: c.translations?.kor?.common || c.name.common,
      nameEn: c.name.common,
      officialNameEn: c.name.official,
      capitalEn: Array.isArray(c.capital) && c.capital.length ? c.capital[0] : null,
      capitalKo: null,                       // Wikidata 단계에서 채운다
      continentCode: code,
      continentKo: CONTINENT_KO[code],
      continentEn: CONTINENT_EN[code],
      subregionEn: c.subregion || null,
      subregionKo: c.subregion ? SUBREGION_KO[c.subregion] ?? c.subregion : null,
      // world-countries latlng 은 [위도, 경도] 순서 → GeoJSON 규약 [경도, 위도] 로 뒤집는다
      center: Array.isArray(c.latlng) && c.latlng.length === 2 ? [c.latlng[1], c.latlng[0]] : null,
      bbox: null,                            // 경계 단계에서 계산
      // ⚠️ world-countries 에는 flags 필드가 없다(이모지 flag 만 있다). 실측 확인함.
      //    ISO 3166-1 alpha-2 로 flagcdn 의 국기 이미지를 만든다(무료·키 불필요).
      flagUrl: `https://flagcdn.com/w80/${c.cca2.toLowerCase()}.png`,
      flagUrl2x: `https://flagcdn.com/w160/${c.cca2.toLowerCase()}.png`,
      flagEmoji: typeof c.flag === "string" ? c.flag : null,
      area: typeof c.area === "number" && c.area > 0 ? c.area : null,
      unMember: isMember,
      // 어린이용 지리 정보 (후속 지시서 §8)
      rawLanguages: c.languages && typeof c.languages === "object" ? c.languages : {},
      rawCurrencies: c.currencies && typeof c.currencies === "object" ? c.currencies : {},
      rawBorders: Array.isArray(c.borders) ? c.borders : [],
      landlocked: c.landlocked === true,
    });
  }

  registry.sort((a, b) => a.iso3.localeCompare(b.iso3));
  const members = registry.filter((r) => r.unMember).length;
  const observers = registry.length - members;
  note(`  UN 회원국 ${members} + 옵서버 ${observers} = ${registry.length}개국`);
  if (members !== 193 || observers !== 2) {
    throw new Error(`회원국 193 + 옵서버 2 여야 하는데 ${members} + ${observers} 입니다 (배포 차단 오류)`);
  }
  return registry;
}

// ── 2) 경계 ────────────────────────────────────────────────────────
// NE 110m 은 작은 나라(바티칸·모나코·싱가포르 등)를 담지 않는다. 빠진 나라만 50m 에서 보충한다.
const NE_50M = SOURCES.naturalEarth.url.replace("110m", "50m");
const NE_110M = SOURCES.naturalEarth.url;

/**
 * NE feature → ISO3. ADM0_A3 우선이되(명세서 §6.2), 그 값이 레지스트리에 없으면
 * 다음 속성으로 계속 내려간다.
 *
 * ⚠️ 첫 후보에서 멈추면 안 된다. NE 는 남수단을 ADM0_A3="SDS"(ISO 는 SSD),
 *    팔레스타인을 "PSX"(ISO 는 PSE)로 담고 있어 첫 값만 보면 두 나라가 통째로 누락된다.
 */
function neIso3(props, mapping, wanted) {
  for (const key of ["ADM0_A3", "ISO_A3_EH", "ISO_A3", "ADM0_A3_US", "SOV_A3"]) {
    const raw = props[key];
    if (typeof raw !== "string" || raw === "-99" || raw.length !== 3) continue;
    const v = mapping[raw] ?? raw;
    if (wanted.has(v)) return v;
  }
  return null;
}

function bboxOf(geometry) {
  let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
  const walk = (coords, depth) => {
    if (depth === 0) {
      const [lon, lat] = coords;
      if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
      return;
    }
    for (const c of coords) walk(c, depth - 1);
  };
  const depth = geometry.type === "Polygon" ? 2 : 3;
  walk(geometry.coordinates, depth);
  return [minLon, minLat, maxLon, maxLat];
}

/**
 * 좌표 소수점을 줄여 용량을 낮춘다.
 * 50m 축척은 정점 자체가 촘촘하므로 소수 3자리(≈100m)로도 110m 보다 훨씬 세밀하다.
 * 4자리로 올리면 gzip 이 600KB 를 넘어 모바일에서 체감될 만큼 무거워진다.
 */
function roundCoords(node, depth) {
  if (depth === 0) return [Math.round(node[0] * 1000) / 1000, Math.round(node[1] * 1000) / 1000];
  return node.map((c) => roundCoords(c, depth - 1));
}

async function buildBoundaries(registry, mapping) {
  note("\n[2/7] Natural Earth 경계 연결");
  const wanted = new Map(registry.map((r) => [r.iso3, r]));
  const features = new Map();

  const ingest = (geojson, label) => {
    if (!geojson?.features) return;
    let hit = 0;
    for (const f of geojson.features) {
      const iso3 = neIso3(f.properties ?? {}, mapping, wanted);
      if (!iso3 || !wanted.has(iso3) || features.has(iso3)) continue;
      const geom = f.geometry;
      if (!geom || (geom.type !== "Polygon" && geom.type !== "MultiPolygon")) continue;
      features.set(iso3, {
        type: "Feature",
        id: iso3,
        properties: { iso3 },
        geometry: { type: geom.type, coordinates: roundCoords(geom.coordinates, geom.type === "Polygon" ? 2 : 3) },
      });
      hit++;
    }
    note(`  ${label}: ${hit}개국 연결`);
  };

  // 1:50m 을 기본으로 쓴다. 110m 은 해안선이 지나치게 단순해 섬·반도가 뭉개진다.
  ingest(await fetchJson(NE_50M, { timeoutMs: 300000 }), "50m");

  const missing = registry.filter((r) => !features.has(r.iso3));
  if (missing.length) {
    note(`  50m 미포함 ${missing.length}개국 → 110m 에서 보충`);
    ingest(await fetchJson(SOURCES.naturalEarth.url, { timeoutMs: 180000 }), "110m 보충");
  }

  // bbox / center 확정
  let pointOnly = 0;
  for (const r of registry) {
    const f = features.get(r.iso3);
    if (f) {
      r.bbox = bboxOf(f.geometry);
      // 레지스트리 center 가 없으면 경계 상자 중앙을 쓴다
      if (!r.center) r.center = [(r.bbox[0] + r.bbox[2]) / 2, (r.bbox[1] + r.bbox[3]) / 2];
      r.hasGeometry = true;
    } else {
      // 폴리곤이 없는 초소형 국가 — 검색·마커로 접근 가능하게 둔다(명세서 §6.5)
      r.hasGeometry = false;
      pointOnly++;
      if (!r.center) { fail("boundaries", `${r.iso3}: 경계도 좌표도 없음`); continue; }
      const [lon, lat] = r.center;
      r.bbox = [lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5];
    }
  }

  const linked = features.size;
  note(`  폴리곤 ${linked}개국 · 좌표 마커 ${pointOnly}개국 · 합계 ${linked + pointOnly}/195`);
  if (linked + pointOnly !== 195) throw new Error("195개국 위치 연결 실패 (배포 차단 오류)");

  return {
    type: "FeatureCollection",
    features: registry.filter((r) => features.has(r.iso3)).map((r) => features.get(r.iso3)),
  };
}

// ── 3) World Bank ──────────────────────────────────────────────────
/** 최근 10년 중 가장 최신의 양수 값. 미래 연도·음수 제외(명세서 §10.2). */
function pickLatest(rows) {
  if (!Array.isArray(rows)) return null;
  const thisYear = new Date().getUTCFullYear();
  const usable = rows
    .filter((r) => r && r.value != null && Number(r.value) > 0 && Number(r.date) <= thisYear)
    .sort((a, b) => Number(b.date) - Number(a.date));
  if (!usable.length) return null;
  return { value: Number(usable[0].value), year: Number(usable[0].date) };
}

async function collectWorldBank(registry) {
  note("\n[3/7] World Bank 지표");
  const out = new Map(registry.map((r) => [r.iso3, {}]));
  const from = new Date().getUTCFullYear() - 10;

  for (const [field, indicator] of Object.entries(WB_INDICATORS)) {
    let page = 1, total = 1, got = 0;
    const byCountry = new Map();
    while (page <= total) {
      const url = `${SOURCES.worldBank.url}/country/all/indicator/${indicator}?format=json&per_page=5000&page=${page}&date=${from}:${new Date().getUTCFullYear()}`;
      const json = await fetchJson(url, { timeoutMs: 120000 });
      if (!Array.isArray(json) || !json[1]) { fail("world-bank", `${field} page ${page} 응답 없음`); break; }
      total = json[0]?.pages ?? 1;
      for (const row of json[1]) {
        const iso3 = row?.countryiso3code;
        if (!iso3 || !out.has(iso3)) continue;
        if (!byCountry.has(iso3)) byCountry.set(iso3, []);
        byCountry.get(iso3).push(row);
      }
      page++;
    }
    for (const [iso3, rows] of byCountry) {
      const picked = pickLatest(rows);
      if (picked) { out.get(iso3)[field] = picked; got++; }
    }
    note(`  ${field.padEnd(13)} ${got}/195개국 (${indicator})`);
  }
  return out;
}

// ── 4) Wikidata ────────────────────────────────────────────────────
const Q_LEADER = (prop, officeProp) => `
SELECT ?iso3 ?personKo ?personEn ?officeKo ?officeEn ?start WHERE {
  ?country wdt:P298 ?iso3 ; p:${prop} ?stmt .
  ?stmt ps:${prop} ?person .
  FILTER NOT EXISTS { ?stmt pq:P582 ?ended }
  OPTIONAL { ?stmt pq:P580 ?start }
  OPTIONAL { ?person rdfs:label ?personKo . FILTER(lang(?personKo) = "ko") }
  OPTIONAL { ?person rdfs:label ?personEn . FILTER(lang(?personEn) = "en") }
  OPTIONAL {
    ?country wdt:${officeProp} ?office .
    OPTIONAL { ?office rdfs:label ?officeKo . FILTER(lang(?officeKo) = "ko") }
    OPTIONAL { ?office rdfs:label ?officeEn . FILTER(lang(?officeEn) = "en") }
  }
}`;

const Q_INCEPTION = `
SELECT ?iso3 ?inception WHERE {
  ?country wdt:P298 ?iso3 ; wdt:P571 ?inception .
}`;

// 종교(명세서 §10.5): P3075 공식 종교를 우선하고, 없으면 P140 대표 종교를 쓴다.
// 어느 쪽이든 서로 다른 값이 여러 개면 임의로 고르지 않고 '자료 없음' 으로 둔다.
const Q_RELIGION = (prop) => `
SELECT ?iso3 ?religionKo ?religionEn WHERE {
  ?country wdt:P298 ?iso3 ; wdt:${prop} ?religion .
  OPTIONAL { ?religion rdfs:label ?religionKo . FILTER(lang(?religionKo) = "ko") }
  OPTIONAL { ?religion rdfs:label ?religionEn . FILTER(lang(?religionEn) = "en") }
}`;

const Q_CAPITAL_KO = `
SELECT ?iso3 ?capitalKo WHERE {
  ?country wdt:P298 ?iso3 ; wdt:P36 ?capital .
  ?capital rdfs:label ?capitalKo . FILTER(lang(?capitalKo) = "ko")
}`;

// world-countries 는 언어·통화 이름을 영어로만 준다. 한글 이름은 표준 코드로 이어 받는다.
//   P220 = ISO 639-3 언어 코드, P498 = ISO 4217 통화 코드
const Q_LANGUAGE_KO = `
SELECT ?code ?ko WHERE {
  ?lang wdt:P220 ?code ; rdfs:label ?ko . FILTER(lang(?ko) = "ko")
}`;

const Q_CURRENCY_KO = `
SELECT ?code ?ko WHERE {
  ?cur wdt:P498 ?code ; rdfs:label ?ko . FILTER(lang(?ko) = "ko")
}`;

// ⚠️ world-countries 5.1.0 에는 timezones 필드가 아예 없다(250개국 전부 없음 — 실측).
//    지어내지 않고 Wikidata P421(속한 시간대)에서 받는다.
const Q_TIMEZONE = `
SELECT ?iso3 ?tzLabel WHERE {
  ?country wdt:P298 ?iso3 ; wdt:P421 ?tz .
  ?tz rdfs:label ?tzLabel . FILTER(lang(?tzLabel) = "en")
}`;

/** iso3 별로 후보를 모으되, 값이 서로 다르게 여러 개면 임의 선택하지 않고 버린다. */
function uniqueByIso3(rows, keyFields) {
  const bag = new Map();
  for (const row of rows ?? []) {
    const iso3 = row.iso3;
    if (!iso3) continue;
    if (!bag.has(iso3)) bag.set(iso3, []);
    bag.get(iso3).push(row);
  }
  const out = new Map();
  for (const [iso3, list] of bag) {
    const distinct = new Map();
    for (const r of list) distinct.set(keyFields.map((f) => r[f] ?? "").join("|"), r);
    if (distinct.size === 1) out.set(iso3, list[0]);
    else if (list[0]?.start) {
      // 지도자는 취임일이 가장 최근인 값을 고른다(명세서 §10.3-4)
      const sorted = list.filter((r) => r.start).sort((a, b) => String(b.start).localeCompare(String(a.start)));
      if (sorted.length) out.set(iso3, sorted[0]);
    }
    // 그 외(동등한 복수 값)는 담지 않는다 → 자료 없음
  }
  return out;
}

async function collectWikidata() {
  note("\n[4/7] Wikidata");
  const [hog, hos, inception, official, main, capitalKo, langKo, curKo, tz] = await Promise.all([
    sparql(Q_LEADER("P6", "P1313")),
    sparql(Q_LEADER("P35", "P1906")),
    sparql(Q_INCEPTION),
    sparql(Q_RELIGION("P3075")),
    sparql(Q_RELIGION("P140")),
    sparql(Q_CAPITAL_KO),
    sparql(Q_LANGUAGE_KO),
    sparql(Q_CURRENCY_KO),
    sparql(Q_TIMEZONE),
  ]);
  if (!hog) fail("wikidata", "정부수반 질의 실패");
  if (!hos) fail("wikidata", "국가원수 질의 실패");
  if (!inception) fail("wikidata", "수립일 질의 실패");
  if (!official) fail("wikidata", "공식 종교 질의 실패");
  if (!main) fail("wikidata", "대표 종교 질의 실패");

  const hogMap = uniqueByIso3(hog, ["personEn"]);
  const hosMap = uniqueByIso3(hos, ["personEn"]);
  const capMap = uniqueByIso3(capitalKo, ["capitalKo"]);

  // 공식 종교 우선, 없을 때만 대표 종교. 어느 쪽을 썼는지 kind 로 남겨 화면에 정확히 표기한다.
  const officialMap = uniqueByIso3(official, ["religionEn"]);
  const mainMap = uniqueByIso3(main, ["religionEn"]);
  const relMap = new Map();
  for (const [iso3, row] of officialMap) relMap.set(iso3, { ...row, kind: "official" });
  for (const [iso3, row] of mainMap) if (!relMap.has(iso3)) relMap.set(iso3, { ...row, kind: "main" });

  // 수립일: 여러 값이면 현 체제에 해당하는 가장 최신 날짜(명세서 §10.4-3)
  const incMap = new Map();
  for (const row of inception ?? []) {
    const d = isoDate(row.inception);
    if (!d) continue;
    const prev = incMap.get(row.iso3);
    if (!prev || d > prev) incMap.set(row.iso3, d);
  }

  // 코드 → 한글 이름. 같은 코드에 여러 label 이 오면 첫 번째만 쓴다.
  const codeMap = (rows) => {
    const m = new Map();
    for (const r of rows ?? []) if (r.code && r.ko && !m.has(r.code)) m.set(r.code, r.ko);
    return m;
  };
  const langKoMap = codeMap(langKo);
  const curKoMap = codeMap(curKo);

  // 시간대는 나라마다 여러 개일 수 있다(미국·러시아 등). 중복만 제거하고 전부 담는다.
  const tzMap = new Map();
  for (const r of tz ?? []) {
    if (!r.iso3 || !r.tzLabel) continue;
    if (!tzMap.has(r.iso3)) tzMap.set(r.iso3, new Set());
    tzMap.get(r.iso3).add(r.tzLabel);
  }

  note(`  정부수반 ${hogMap.size} · 국가원수 ${hosMap.size} · 수립일 ${incMap.size} · 수도한글 ${capMap.size}`);
  note(`  종교: 공식 ${officialMap.size} + 대표(공식 없을 때) ${relMap.size - officialMap.size} = ${relMap.size}`);
  note(`  언어 한글명 ${langKoMap.size} · 통화 한글명 ${curKoMap.size} · 시간대 ${tzMap.size}개국`);
  return { hogMap, hosMap, incMap, relMap, capMap, langKoMap, curKoMap, tzMap };
}

// ── 5~7) 조립 ──────────────────────────────────────────────────────
const src = (key, extra = {}) => ({
  provider: SOURCES[key].provider,
  label: SOURCES[key].label,
  url: SOURCES[key].homepage,
  fetchedAt: FETCHED_AT,
  ...extra,
});

const numeric = (picked, unit, source) =>
  picked
    ? { value: picked.value, year: picked.year, unit, status: "ok", source }
    : { value: null, year: null, unit, status: "missing", source: null };

async function main() {
  note(`월드맵 데이터 동기화${DRY ? " (dry-run)" : ""} — ${FETCHED_AT}`);

  const overridePath = path.join(DATA_DIR, "manual-overrides.json");
  const overrides = existsSync(overridePath) ? JSON.parse(await readFile(overridePath, "utf8")) : {};
  const mapping = overrides.__isoMapping ?? {};

  const registry = await buildRegistry();
  const geojson = await buildBoundaries(registry, mapping);
  const wb = await collectWorldBank(registry);
  const wd = await collectWikidata();

  note("\n[5/7] manual override 적용");
  let overrideCount = 0;

  // 이웃 나라는 195개국 레지스트리 안에 있는 코드만 남긴다(비회원 영토는 뺀다).
  const inRegistry = new Set(registry.map((r) => r.iso3));

  // 육지 국경은 정의상 대칭이다. 한쪽에만 적힌 항목은 출처의 오류다.
  // 예: world-countries 는 스리랑카에 인도를 국경으로 적어 두었는데(팔크 해협으로 갈린 섬나라)
  //     인도 쪽에는 스리랑카가 없다. 그대로 두면 섬나라 판정까지 틀어진다.
  const borderOf = new Map(registry.map((r) => [r.iso3, new Set(r.rawBorders.filter((b) => inRegistry.has(b)))]));
  const dropped = [];
  for (const [iso3, set] of borderOf) {
    for (const other of [...set]) {
      if (!borderOf.get(other)?.has(iso3)) { set.delete(other); dropped.push(`${iso3}→${other}`); }
    }
  }
  if (dropped.length) note(`  한쪽에만 있던 국경 ${dropped.length}건 제거: ${dropped.join(", ")}`);
  // 섬나라 판정: landlocked 만으로는 안 된다(후속 지시서 §8).
  // '육지 국경이 하나도 없고 내륙국도 아닌' 나라를 섬나라로 본다. 예외는 override 로 뒤집는다.
  const islandOverride = overrides.__islandCountry ?? {};
  // 한국에서 실제로 쓰는 통용 국가명. world-countries 의 kor 번역이 공식 국명(몽골국)이거나
  // 아예 다른 이름(조선), 심지어 두 나라가 같은 이름(도미니카)으로 나오는 경우가 있다.
  const nameKoOverride = overrides.__nameKo ?? {};

  const records = registry.map((r) => {
    const m = wb.get(r.iso3) ?? {};
    const ov = overrides[r.iso3] ?? {};
    if (Object.keys(ov).length) overrideCount++;

    const hog = wd.hogMap.get(r.iso3);
    const hos = hog ? null : wd.hosMap.get(r.iso3);
    const leaderRow = hog ?? hos;
    const role = hog ? "head_of_government" : "head_of_state";

    const rel = wd.relMap.get(r.iso3);
    const inc = wd.incMap.get(r.iso3);
    const capKo = wd.capMap.get(r.iso3)?.capitalKo ?? null;

    // area 는 World Bank 대신 world-countries 값을 쓴다(정의가 안정적이고 결측이 적다)
    const areaMetric = r.area
      ? { value: r.area, year: null, unit: "km2", status: "ok", source: src("restCountries") }
      : { value: null, year: null, unit: "km2", status: "missing", source: null };

    return {
      iso2: r.iso2,
      iso3: r.iso3,
      ccn3: r.ccn3,
      wikidataId: null,
      nameKo: ov.nameKo ?? nameKoOverride[r.iso3] ?? r.nameKo,
      nameEn: r.nameEn,
      officialNameEn: r.officialNameEn,
      capitalKo: ov.capitalKo ?? capKo ?? r.capitalEn,     // 한글 없으면 영문 (명세서 §10.1)
      capitalEn: r.capitalEn,
      continentCode: r.continentCode,
      continentKo: r.continentKo,
      continentEn: r.continentEn,
      subregionKo: r.subregionKo,
      subregionEn: r.subregionEn,
      center: r.center,
      bbox: r.bbox,
      hasGeometry: r.hasGeometry,
      flagUrl: r.flagUrl,
      flagUrl2x: r.flagUrl2x,
      flagEmoji: r.flagEmoji,

      // 어린이용 지리 정보. 값이 없으면 빈 배열이고, 화면에서 '자료 없음' 과
      // '육지 국경 없음' 을 구분해 보여준다.
      languages: Object.entries(r.rawLanguages).map(([code, en]) => ({
        code,
        ko: wd.langKoMap.get(code) ?? en,      // 한글 이름이 없으면 영어를 쓴다
        en,
      })),
      currencies: Object.entries(r.rawCurrencies).map(([code, info]) => ({
        code,
        ko: wd.curKoMap.get(code) ?? info?.name ?? code,
        en: info?.name ?? code,
        symbol: info?.symbol ?? null,
      })),
      timezones: [...(wd.tzMap.get(r.iso3) ?? [])].sort(),
      borderCountryIso3: [...(borderOf.get(r.iso3) ?? [])].sort(),
      landlocked: r.landlocked,
      islandCountry: islandOverride[r.iso3] ?? (!r.landlocked && (borderOf.get(r.iso3)?.size ?? 0) === 0),

      leader: ov.leader ?? (leaderRow
        ? {
            valueKo: leaderRow.personKo ?? leaderRow.personEn ?? null,
            valueEn: leaderRow.personEn ?? null,
            titleKo: leaderRow.officeKo ?? (role === "head_of_government" ? "정부수반" : "국가원수"),
            titleEn: leaderRow.officeEn ?? (role === "head_of_government" ? "Head of Government" : "Head of State"),
            role,
            status: "ok",
            source: src("wikidata"),
          }
        : { valueKo: null, valueEn: null, titleKo: null, titleEn: null, role, status: "missing", source: null }),
      established: ov.established ?? (inc
        ? { date: inc, labelKo: "수립일", labelEn: "Established", status: "ok", source: src("wikidata") }
        : { date: null, labelKo: "수립일", labelEn: "Established", status: "missing", source: null }),
      religion: ov.religion ?? (rel
        ? {
            valueKo: rel.religionKo ?? rel.religionEn ?? null,
            valueEn: rel.religionEn ?? null,
            // 공식 종교인지 대표 종교인지는 의미가 다르므로 화면에서도 구분해 보여준다
            kind: rel.kind,
            labelKo: rel.kind === "official" ? "국교" : "주요 종교",
            labelEn: rel.kind === "official" ? "Official religion" : "Main religion",
            status: "ok",
            source: src("wikidata"),
          }
        : { valueKo: null, valueEn: null, kind: null, labelKo: "주요 종교", labelEn: "Main religion", status: "missing", source: null }),
      population: numeric(m.population, "people", src("worldBank", { asOf: String(m.population?.year ?? "") })),
      area: areaMetric,
      gdp: numeric(m.gdp, "current_usd", src("worldBank", { asOf: String(m.gdp?.year ?? "") })),
      gdpPerCapita: numeric(m.gdpPerCapita, "current_usd_per_person", src("worldBank", { asOf: String(m.gdpPerCapita?.year ?? "") })),
      updatedAt: FETCHED_AT,
      stale: false,
    };
  });
  note(`  override 적용 ${overrideCount}개국`);

  note("\n[6/7] 검증");
  const missingCount = (field) => records.filter((r) => (r[field]?.status ?? "missing") === "missing").length;
  for (const f of ["population", "gdp", "gdpPerCapita", "area", "leader", "established", "religion"]) {
    const n = missingCount(f);
    note(`  ${f.padEnd(13)} 자료 없음 ${String(n).padStart(3)}/195`);
  }
  const emptyList = (field) => records.filter((r) => r[field].length === 0).length;
  for (const f of ["languages", "currencies", "timezones", "borderCountryIso3"]) {
    note(`  ${f.padEnd(17)} 빈 배열 ${String(emptyList(f)).padStart(3)}/195`);
  }
  note(`  내륙국 ${records.filter((r) => r.landlocked).length} · 섬나라 ${records.filter((r) => r.islandCountry).length}`);

  note("\n[7/7] 저장");
  if (DRY) { note("  dry-run — 파일을 쓰지 않았습니다."); return; }
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  const snapshot = { schemaVersion: 2, generatedAt: FETCHED_AT, stale: false, errors, countries: records };
  await writeFile(path.join(DATA_DIR, "snapshot.json"), JSON.stringify(snapshot));
  await writeFile(path.join(PUBLIC_DIR, "countries.geojson"), JSON.stringify(geojson));

  // 브라우저가 받는 파일은 출처 객체를 한 번만 싣고 지표는 id 로 참조한다.
  // (출처를 지표마다 반복하면 같은 문자열이 1,300번 넘게 들어가 용량이 3배가 된다)
  const sourceTable = {};
  const sourceId = (s) => {
    if (!s) return null;
    const id = s.provider;
    if (!sourceTable[id]) sourceTable[id] = { provider: s.provider, label: s.label, url: s.url, fetchedAt: s.fetchedAt };
    return id;
  };
  const num = (m) => ({ v: m.value, y: m.year, u: m.unit, s: m.status, src: sourceId(m.source) });
  const txt = (m, extra = {}) => ({ ko: m.valueKo, en: m.valueEn, s: m.status, src: sourceId(m.source), ...extra });

  const compact = {
    schemaVersion: 2,
    generatedAt: FETCHED_AT,
    stale: false,
    countries: records.map((r) => ({
      iso2: r.iso2, iso3: r.iso3,
      nameKo: r.nameKo, nameEn: r.nameEn, officialNameEn: r.officialNameEn,
      capitalKo: r.capitalKo, capitalEn: r.capitalEn,
      continentCode: r.continentCode, continentKo: r.continentKo, continentEn: r.continentEn,
      subregionKo: r.subregionKo, subregionEn: r.subregionEn,
      center: r.center.map((n) => Math.round(n * 100) / 100),
      bbox: r.bbox.map((n) => Math.round(n * 100) / 100),
      flagUrl: r.flagUrl,
      flagUrl2x: r.flagUrl2x,
      flagEmoji: r.flagEmoji,
      languages: r.languages,
      currencies: r.currencies,
      timezones: r.timezones,
      borderCountryIso3: r.borderCountryIso3,
      landlocked: r.landlocked,
      islandCountry: r.islandCountry,
      leader: txt(r.leader, { titleKo: r.leader.titleKo, titleEn: r.leader.titleEn, role: r.leader.role }),
      established: { date: r.established.date, s: r.established.status, src: sourceId(r.established.source) },
      religion: txt(r.religion, { kind: r.religion.kind, labelKo: r.religion.labelKo, labelEn: r.religion.labelEn }),
      population: num(r.population), area: num(r.area),
      gdp: num(r.gdp), gdpPerCapita: num(r.gdpPerCapita),
    })),
    sources: sourceTable,
  };
  await writeFile(path.join(PUBLIC_DIR, "countries.json"), JSON.stringify(compact));
  note(`  countries.json       ${Math.round(Buffer.byteLength(JSON.stringify(compact)) / 1024)}KB (브라우저용)`);
  await writeFile(
    path.join(DATA_DIR, "country-registry.json"),
    JSON.stringify({ generatedAt: FETCHED_AT, count: registry.length, countries: registry.map((r) => ({ iso2: r.iso2, iso3: r.iso3, ccn3: r.ccn3, nameKo: r.nameKo, nameEn: r.nameEn, unMember: r.unMember })) }, null, 1),
  );

  const kb = (p) => Math.round(Buffer.byteLength(JSON.stringify(p)) / 1024);
  note(`  snapshot.json        ${kb(snapshot)}KB`);
  note(`  countries.geojson    ${kb(geojson)}KB (${geojson.features.length} features)`);
  note(`  country-registry.json ${registry.length}개국`);
  note(`\n오류 ${errors.length}건`);
}

main().catch((err) => {
  process.stderr.write(`\n배포 차단 오류: ${err.message}\n`);
  process.exit(1);
});
