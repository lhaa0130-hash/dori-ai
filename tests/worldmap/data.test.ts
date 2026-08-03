// 월드맵 데이터 무결성 (명세서 §17.2 · §21).
// 실제로 구워진 산출물을 검사한다. 이 테스트가 깨지면 배포하지 않는다.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));

const dataset = read("public/worldmap/countries.json");
const geojson = read("public/worldmap/countries.geojson");
const registry = read("data/worldmap/country-registry.json");

const COUNTRIES: any[] = dataset.countries;

test("195개국이다 (UN 193 + 옵서버 2)", () => {
  assert.equal(COUNTRIES.length, 195);
  assert.equal(registry.count, 195);
  assert.equal(registry.countries.filter((c: any) => c.unMember).length, 193);
  assert.equal(registry.countries.filter((c: any) => !c.unMember).length, 2);
});

test("바티칸과 팔레스타인이 옵서버로 들어 있다", () => {
  for (const iso3 of ["VAT", "PSE"]) {
    const rec = registry.countries.find((c: any) => c.iso3 === iso3);
    assert.ok(rec, `${iso3} 누락`);
    assert.equal(rec.unMember, false, `${iso3} 는 회원국이 아니라 옵서버다`);
  }
});

test("195개국 전부가 실제 지도 경계와 연결된다", () => {
  const geoIds = new Set(geojson.features.map((f: any) => f.properties.iso3));
  const missing = COUNTRIES.filter((c) => !geoIds.has(c.iso3)).map((c) => c.iso3);
  assert.deepEqual(missing, [], `경계가 없는 국가: ${missing.join(", ")}`);
  assert.equal(geojson.features.length, 195);
});

test("경계 feature 는 Polygon 또는 MultiPolygon 이다", () => {
  const bad = geojson.features.filter((f: any) => !["Polygon", "MultiPolygon"].includes(f.geometry?.type));
  assert.equal(bad.length, 0);
});

test("ISO 코드는 중복 없이 유일하다", () => {
  assert.equal(new Set(COUNTRIES.map((c) => c.iso3)).size, 195);
  assert.equal(new Set(COUNTRIES.map((c) => c.iso2)).size, 195);
  for (const c of COUNTRIES) {
    assert.match(c.iso3, /^[A-Z]{3}$/, `${c.iso3} 형식 오류`);
    assert.match(c.iso2, /^[A-Z]{2}$/, `${c.iso2} 형식 오류`);
  }
});

test("모든 국가에 한국어·영어 이름이 있다", () => {
  for (const c of COUNTRIES) {
    assert.ok(c.nameKo && c.nameKo.length > 0, `${c.iso3} 한국어명 없음`);
    assert.ok(c.nameEn && c.nameEn.length > 0, `${c.iso3} 영문명 없음`);
    assert.ok(c.officialNameEn && c.officialNameEn.length > 0, `${c.iso3} 공식명 없음`);
  }
});

test("대륙 코드는 정해진 6개 중 하나다", () => {
  const allowed = new Set(["AF", "AS", "EU", "NA", "SA", "OC"]);
  for (const c of COUNTRIES) assert.ok(allowed.has(c.continentCode), `${c.iso3}: ${c.continentCode}`);
});

test("center 와 bbox 가 지리적으로 유효하다", () => {
  for (const c of COUNTRIES) {
    const [lon, lat] = c.center;
    assert.ok(lon >= -180 && lon <= 180, `${c.iso3} 경도 ${lon}`);
    assert.ok(lat >= -90 && lat <= 90, `${c.iso3} 위도 ${lat}`);
    const [minLon, minLat, maxLon, maxLat] = c.bbox;
    assert.ok(minLon <= maxLon && minLat <= maxLat, `${c.iso3} bbox 뒤집힘`);
    assert.ok(minLat >= -90 && maxLat <= 90, `${c.iso3} bbox 위도 범위`);
  }
});

test("숫자 지표는 값·연도·단위·출처를 함께 갖는다", () => {
  const units: Record<string, string> = {
    population: "people", area: "km2", gdp: "current_usd", gdpPerCapita: "current_usd_per_person",
  };
  for (const c of COUNTRIES) {
    for (const [key, unit] of Object.entries(units)) {
      const m = c[key];
      assert.ok(m, `${c.iso3}.${key} 없음`);
      assert.equal(m.u, unit, `${c.iso3}.${key} 단위`);
      if (m.s === "ok") {
        assert.ok(typeof m.v === "number" && m.v > 0, `${c.iso3}.${key} 값 ${m.v}`);
        assert.ok(m.src && dataset.sources[m.src], `${c.iso3}.${key} 출처 누락`);
        // 면적은 기준연도 개념이 없으므로 제외
        if (key !== "area") assert.ok(typeof m.y === "number", `${c.iso3}.${key} 기준연도 누락`);
      } else {
        assert.equal(m.v, null, `${c.iso3}.${key}: 자료 없음인데 값이 있다`);
      }
    }
  }
});

test("기준연도는 미래가 아니다", () => {
  const thisYear = new Date().getUTCFullYear();
  for (const c of COUNTRIES) {
    for (const key of ["population", "gdp", "gdpPerCapita"]) {
      const y = c[key].y;
      if (y != null) assert.ok(y <= thisYear && y > 1960, `${c.iso3}.${key} 연도 ${y}`);
    }
  }
});

test("수립일은 미래가 아니고 형식이 맞다", () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const c of COUNTRIES) {
    const d = c.established.date;
    if (d == null) continue;
    assert.match(d, /^\d{4}-\d{2}-\d{2}$/, `${c.iso3} 수립일 형식 ${d}`);
    assert.ok(d <= today, `${c.iso3} 수립일이 미래 ${d}`);
  }
});

test("종교는 국교와 주요 종교를 구분해 표시한다", () => {
  for (const c of COUNTRIES) {
    const r = c.religion;
    if (r.s === "ok") {
      assert.ok(["official", "main"].includes(r.kind), `${c.iso3} 종교 kind ${r.kind}`);
      assert.equal(r.labelKo, r.kind === "official" ? "국교" : "주요 종교");
      assert.ok(r.ko || r.en, `${c.iso3} 종교 값 없음`);
    } else {
      assert.equal(r.ko, null);
      assert.equal(r.en, null);
    }
  }
});

test("지도자는 정부수반 또는 국가원수로 역할이 명시된다", () => {
  for (const c of COUNTRIES) {
    assert.ok(["head_of_government", "head_of_state"].includes(c.leader.role), `${c.iso3} role`);
    if (c.leader.s === "ok") assert.ok(c.leader.ko || c.leader.en, `${c.iso3} 지도자 이름 없음`);
  }
});

test("모든 출처에 이름·링크·수집시각이 있다", () => {
  const values = Object.values<any>(dataset.sources);
  assert.ok(values.length >= 2, "출처가 너무 적다");
  for (const s of values) {
    assert.ok(s.label && s.url && s.fetchedAt, `출처 항목 불완전: ${JSON.stringify(s)}`);
    assert.match(s.url, /^https?:\/\//);
    assert.match(s.fetchedAt, /^\d{4}-\d{2}-\d{2}T/);
  }
});

test("주요 국가의 값이 상식 범위 안이다", () => {
  const kor = COUNTRIES.find((c) => c.iso3 === "KOR");
  assert.ok(kor, "KOR 누락");
  assert.equal(kor.nameKo, "한국");
  assert.ok(kor.population.v > 45_000_000 && kor.population.v < 60_000_000, `한국 인구 ${kor.population.v}`);
  assert.ok(kor.area.v > 95_000 && kor.area.v < 110_000, `한국 면적 ${kor.area.v}`);
  assert.ok(kor.gdp.v > 1e12 && kor.gdp.v < 3e12, `한국 GDP ${kor.gdp.v}`);

  const chn = COUNTRIES.find((c) => c.iso3 === "CHN");
  assert.ok(chn.population.v > 1.3e9, `중국 인구 ${chn.population.v}`);
  const rus = COUNTRIES.find((c) => c.iso3 === "RUS");
  assert.ok(rus.area.v > 16_000_000, `러시아 면적 ${rus.area.v}`);
});

test("자료 결측률이 감당할 수준이다", () => {
  const missing = (key: string) => COUNTRIES.filter((c) => c[key].s === "missing").length;
  // 결측 자체는 정상이지만(자료 없음으로 표시), 급증하면 수집이 깨진 것이다.
  assert.ok(missing("population") <= 5, `인구 결측 ${missing("population")}`);
  assert.ok(missing("gdp") <= 10, `GDP 결측 ${missing("gdp")}`);
  assert.equal(missing("area"), 0);
});

// ── 어린이용 지리 정보 (후속 지시서 §8 · §12.2) ─────────────────
test("스키마 버전이 올라가 있다", () => {
  assert.equal(dataset.schemaVersion, 2);
});

test("모든 국가에 languages 배열이 있다", () => {
  for (const c of COUNTRIES) {
    assert.ok(Array.isArray(c.languages), `${c.iso3} languages 없음`);
    for (const l of c.languages) {
      assert.ok(l.ko && l.en, `${c.iso3} 언어 이름 비어 있음: ${JSON.stringify(l)}`);
      assert.ok(typeof l.code === "string" && l.code.length >= 2, `${c.iso3} 언어 코드 ${l.code}`);
    }
  }
});

test("통화는 코드·이름을 갖추고 정규화돼 있다", () => {
  for (const c of COUNTRIES) {
    assert.ok(Array.isArray(c.currencies), `${c.iso3} currencies 없음`);
    for (const cur of c.currencies) {
      assert.match(cur.code, /^[A-Z]{3}$/, `${c.iso3} 통화 코드 ${cur.code}`);
      assert.ok(cur.ko && cur.en, `${c.iso3} 통화 이름 비어 있음`);
    }
  }
  // 한국 원화가 제대로 들어왔는지 표본 확인
  const kor = COUNTRIES.find((c) => c.iso3 === "KOR");
  assert.equal(kor.currencies[0].code, "KRW");
  assert.ok(kor.currencies[0].symbol);
});

test("이웃 나라 ISO 는 전부 195개국 레지스트리 안에 있다", () => {
  const known = new Set(COUNTRIES.map((c) => c.iso3));
  for (const c of COUNTRIES) {
    assert.ok(Array.isArray(c.borderCountryIso3), `${c.iso3} 국경 배열 없음`);
    for (const b of c.borderCountryIso3) {
      assert.ok(known.has(b), `${c.iso3} 의 이웃 ${b} 가 레지스트리에 없다`);
      assert.notEqual(b, c.iso3, `${c.iso3} 가 자기 자신과 국경을 맞댐`);
    }
  }
});

test("국경 관계는 서로 대칭이다", () => {
  const byIso = new Map(COUNTRIES.map((c) => [c.iso3, c]));
  const broken: string[] = [];
  for (const c of COUNTRIES) {
    for (const b of c.borderCountryIso3) {
      if (!byIso.get(b)?.borderCountryIso3.includes(c.iso3)) broken.push(`${c.iso3}→${b}`);
    }
  }
  assert.deepEqual(broken, [], `한쪽에만 있는 국경: ${broken.join(", ")}`);
});

test("landlocked·islandCountry 는 boolean 이고 서로 모순되지 않는다", () => {
  for (const c of COUNTRIES) {
    assert.equal(typeof c.landlocked, "boolean", `${c.iso3} landlocked`);
    assert.equal(typeof c.islandCountry, "boolean", `${c.iso3} islandCountry`);
    assert.ok(!(c.landlocked && c.islandCountry), `${c.iso3}: 내륙국이면서 섬나라일 수 없다`);
    // 섬나라는 육지 국경이 없어야 한다 (landlocked===false 만으로 판정하지 않는다)
    if (c.islandCountry) assert.equal(c.borderCountryIso3.length, 0, `${c.iso3} 섬나라인데 국경이 있다`);
    // 내륙국은 반드시 이웃이 있다
    if (c.landlocked) assert.ok(c.borderCountryIso3.length > 0, `${c.iso3} 내륙국인데 이웃이 없다`);
  }
});

test("대표적인 섬나라·내륙국이 올바르게 분류된다", () => {
  const get = (iso3: string) => COUNTRIES.find((c) => c.iso3 === iso3);
  for (const iso3 of ["JPN", "NZL", "ISL", "MDG", "CUB"]) {
    assert.equal(get(iso3).islandCountry, true, `${iso3} 는 섬나라여야 한다`);
  }
  for (const iso3 of ["MNG", "CHE", "AUT", "NPL", "BOL"]) {
    assert.equal(get(iso3).landlocked, true, `${iso3} 는 내륙국이어야 한다`);
    assert.equal(get(iso3).islandCountry, false);
  }
  // 한국은 북한과 육지 국경이 있으므로 섬나라가 아니다
  assert.equal(get("KOR").islandCountry, false);
  assert.deepEqual(get("KOR").borderCountryIso3, ["PRK"]);
});

test("시간대는 문자열 배열이다", () => {
  let empty = 0;
  for (const c of COUNTRIES) {
    assert.ok(Array.isArray(c.timezones), `${c.iso3} timezones 없음`);
    for (const t of c.timezones) assert.ok(typeof t === "string" && t.length > 0);
    if (c.timezones.length === 0) empty++;
  }
  // 자료가 없는 나라가 있는 건 정상이지만, 수집이 통째로 깨지면 눈에 띄어야 한다
  assert.ok(empty <= 10, `시간대 결측 ${empty}/195`);
});

test("작은 국가도 center 좌표를 갖는다 (지도 marker 대상)", () => {
  const tiny = ["VAT", "MCO", "SMR", "LIE", "AND", "MLT", "SGP", "NRU", "TUV", "PLW", "MHL"];
  for (const iso3 of tiny) {
    const c = COUNTRIES.find((x) => x.iso3 === iso3);
    assert.ok(c, `${iso3} 누락`);
    const [lon, lat] = c.center;
    assert.ok(Number.isFinite(lon) && Number.isFinite(lat), `${iso3} center ${c.center}`);
    assert.ok(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90, `${iso3} center 범위`);
  }
});

test("한국에서 쓰는 통용 국가명을 쓴다", () => {
  const name = (iso3: string) => COUNTRIES.find((c) => c.iso3 === iso3)?.nameKo;
  assert.equal(name("PRK"), "북한", "'조선' 이 아니라 '북한'");
  assert.equal(name("MNG"), "몽골", "'몽골국' 이 아니라 '몽골'");
  assert.equal(name("KOR"), "한국");
  assert.equal(name("DMA"), "도미니카 연방");
  assert.equal(name("DOM"), "도미니카 공화국");
});

test("한글 국가명이 서로 겹치지 않는다", () => {
  const seen = new Map<string, string>();
  const dup: string[] = [];
  for (const c of COUNTRIES) {
    if (seen.has(c.nameKo)) dup.push(`${c.nameKo}(${seen.get(c.nameKo)}/${c.iso3})`);
    seen.set(c.nameKo, c.iso3);
  }
  assert.deepEqual(dup, [], `같은 이름을 쓰는 나라: ${dup.join(", ")}`);
});

test("경계가 1:50m 수준의 디테일을 갖는다", () => {
  let vertices = 0;
  const walk = (n: any, d: number) => { if (d === 0) { vertices++; return; } for (const x of n) walk(x, d - 1); };
  for (const f of geojson.features) walk(f.geometry.coordinates, f.geometry.type === "Polygon" ? 2 : 3);
  // 110m 은 약 1만 정점. 50m 은 그보다 크게 많아야 한다.
  assert.ok(vertices > 50_000, `정점 ${vertices}개 — 해상도가 떨어졌다`);
});

test("모든 나라에 수도 좌표가 있다 (지도의 수도 점)", () => {
  const missing = COUNTRIES.filter((c) => !Array.isArray(c.capitalPoint)).map((c) => c.iso3);
  assert.deepEqual(missing, [], `수도 좌표 없음: ${missing.join(", ")}`);
  for (const c of COUNTRIES) {
    const [lon, lat] = c.capitalPoint;
    assert.ok(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90, `${c.iso3} 수도 좌표 ${c.capitalPoint}`);
  }
});

test("bbox 는 본토 기준이라 해외 영토로 부풀지 않는다", () => {
  // 프랑스령 기아나·알래스카 같은 해외 영토까지 감싸면 클릭 시 카메라가 지구 절반을 비춘다.
  const wide = COUNTRIES.filter((c) => c.bbox[2] - c.bbox[0] > 100 && c.iso3 !== "RUS").map((c) => c.iso3);
  assert.deepEqual(wide, [], `경도 폭이 100도를 넘는 나라: ${wide.join(", ")}`);
  const fra = COUNTRIES.find((c) => c.iso3 === "FRA");
  assert.ok(fra.bbox[2] - fra.bbox[0] < 20, `프랑스 bbox 폭 ${fra.bbox[2] - fra.bbox[0]}`);
  assert.ok(fra.center[1] > 40, `프랑스 라벨이 유럽에 있어야 한다: ${fra.center}`);
});

test("라벨 좌표가 나라 경계 상자 안에 있다", () => {
  const outside = COUNTRIES.filter((c) => {
    const [lon, lat] = c.center;
    const [w, s2, e, n] = c.bbox;
    return lon < w - 0.5 || lon > e + 0.5 || lat < s2 - 0.5 || lat > n + 0.5;
  }).map((c) => c.iso3);
  assert.deepEqual(outside, [], `라벨이 나라 밖: ${outside.join(", ")}`);
});

test("브라우저용 파일이 과하게 크지 않다", () => {
  const kb = (p: string) => readFileSync(path.join(ROOT, p)).byteLength / 1024;
  assert.ok(kb("public/worldmap/countries.json") < 400, `countries.json ${kb("public/worldmap/countries.json")}KB`);
  // 1:50m 경계라 110m 보다 훨씬 크다(정점 약 9배). gzip 으로는 500KB 수준.
  assert.ok(kb("public/worldmap/countries.geojson") < 2000, `geojson ${kb("public/worldmap/countries.geojson")}KB`);
});
