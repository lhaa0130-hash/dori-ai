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

test("브라우저용 파일이 과하게 크지 않다", () => {
  const kb = (p: string) => readFileSync(path.join(ROOT, p)).byteLength / 1024;
  assert.ok(kb("public/worldmap/countries.json") < 400, `countries.json ${kb("public/worldmap/countries.json")}KB`);
  assert.ok(kb("public/worldmap/countries.geojson") < 600, `geojson ${kb("public/worldmap/countries.geojson")}KB`);
});
