// 세계 랭킹 로직 (랭킹 지시서 §4 · §10)
import test from "node:test";
import assert from "node:assert/strict";
import { buildRanking, rankOf, rankSentence, percentile, metricValue, RANKING_METRICS } from "../../lib/worldmap/ranking.ts";
import type { CountryRecord, NumericMetric } from "../../lib/worldmap/types.ts";

const num = (v: number | null, y: number | null = 2024): NumericMetric =>
  ({ v, y, u: "percent" as NumericMetric["u"], s: v == null ? "missing" : "ok", src: v == null ? null : "world-bank" });

function c(iso3: string, over: Partial<Record<string, unknown>> = {}): CountryRecord {
  const base: Record<string, unknown> = {
    iso2: iso3.slice(0, 2), iso3, nameKo: iso3, nameEn: iso3, officialNameEn: iso3,
    capitalKo: null, capitalEn: null, continentCode: "AS", continentKo: "아시아", continentEn: "Asia",
    subregionKo: null, subregionEn: null, center: [0, 0], bbox: [-1, -1, 1, 1], capitalPoint: null,
    flagUrl: null, flagUrl2x: null, flagEmoji: null,
    leader: { ko: null, en: null, titleKo: null, titleEn: null, role: "head_of_government", s: "missing", src: null },
    established: { date: null, s: "missing", src: null },
    religion: { ko: null, en: null, kind: null, labelKo: "", labelEn: "", s: "missing", src: null },
    population: num(null), area: num(null), gdp: num(null), gdpPerCapita: num(null),
    gdpGrowth: num(null), lifeExpectancy: num(null), internetUsageRate: num(null),
    urbanPopulationRate: num(null), birthRate: num(null), childPopulationRate: num(null),
    forestAreaRate: num(null), renewableEnergyRate: num(null), co2PerCapita: num(null),
    languages: [], currencies: [], timezones: [], borderCountryIso3: [], landlocked: false, islandCountry: false,
  };
  return { ...base, ...over } as CountryRecord;
}

test("원본 숫자로 정렬한다 — 축약 문자열 순서에 흔들리지 않는다", () => {
  const list = [c("AAA", { gdp: num(9e11) }), c("BBB", { gdp: num(1.2e12) }), c("CCC", { gdp: num(2e11) })];
  const r = buildRanking(list, "gdp");
  assert.deepEqual(r.rows.map((x) => x.iso3), ["BBB", "AAA", "CCC"]);
});

test("자료 없는 나라는 순위에서 빼고 분모에도 넣지 않는다", () => {
  const list = [c("AAA", { gdp: num(100) }), c("BBB", { gdp: num(null) }), c("CCC", { gdp: num(50) })];
  const r = buildRanking(list, "gdp");
  assert.equal(r.eligibleCountryCount, 2);
  assert.deepEqual(r.missingIso3, ["BBB"]);
  assert.equal(rankOf(r, "BBB"), null);
});

test("0 은 자료 없음이 아니라 정상 값이다", () => {
  const list = [c("AAA", { borderCountryIso3: [] }), c("BBB", { borderCountryIso3: ["X", "Y"] })];
  const r = buildRanking(list, "borderCountryCount");
  assert.equal(r.eligibleCountryCount, 2, "국경 0개인 섬나라도 순위에 든다");
  assert.equal(rankOf(r, "AAA")!.value, 0);
});

test("동점은 표준 경쟁 순위 — 1, 2, 2, 4", () => {
  const list = [c("AAA", { gdp: num(30) }), c("BBB", { gdp: num(20) }), c("CCC", { gdp: num(20) }), c("DDD", { gdp: num(10) })];
  const r = buildRanking(list, "gdp");
  assert.deepEqual(r.rows.map((x) => x.rank), [1, 2, 2, 4]);
});

test("높은 순·낮은 순을 전환할 수 있다", () => {
  const list = [c("AAA", { gdp: num(30) }), c("BBB", { gdp: num(10) })];
  assert.equal(buildRanking(list, "gdp", { order: "desc" }).rows[0].iso3, "AAA");
  assert.equal(buildRanking(list, "gdp", { order: "asc" }).rows[0].iso3, "BBB");
});

test("대륙으로 범위를 좁히면 분모도 함께 줄어든다", () => {
  const list = [
    c("AAA", { gdp: num(30), continentCode: "AS" }),
    c("BBB", { gdp: num(20), continentCode: "EU" }),
    c("CCC", { gdp: num(10), continentCode: "AS" }),
  ];
  const r = buildRanking(list, "gdp", { continent: "AS" });
  assert.equal(r.eligibleCountryCount, 2);
  assert.deepEqual(r.rows.map((x) => x.iso3), ["AAA", "CCC"]);
});

test("인구 밀도는 재료가 하나라도 없으면 계산하지 않는다", () => {
  assert.equal(metricValue(c("AAA", { population: num(1000), area: num(null) }), "populationDensity").value, null);
  assert.equal(metricValue(c("AAA", { population: num(null), area: num(10) }), "populationDensity").value, null);
  assert.equal(metricValue(c("AAA", { population: num(1000), area: num(10) }), "populationDensity").value, 100);
});

test("면적 0 으로 나누지 않는다", () => {
  assert.equal(metricValue(c("AAA", { population: num(1000), area: num(0) }), "populationDensity").value, null);
});

test("여러 해가 섞이면 years 로 알 수 있다", () => {
  const list = [c("AAA", { gdp: num(30, 2024) }), c("BBB", { gdp: num(20, 2022) })];
  assert.deepEqual(buildRanking(list, "gdp").years, [2022, 2024]);
});

test("순위 설명에 우열 표현이 없다", () => {
  const list = [c("KOR", { gdp: num(30) }), c("BBB", { gdp: num(20) })];
  const r = buildRanking(list, "gdp");
  const s = rankSentence(r, "KOR", "ko")!;
  assert.match(s, /1번째/);
  assert.match(s, /2개국/);
  for (const banned of ["우수", "최고", "1등", "훌륭", "뒤처", "열등", "부족"]) {
    assert.ok(!s.includes(banned), `가치 판단 표현: ${banned}`);
  }
});

test("자료 없는 나라의 설명은 순위 대신 이유를 말한다", () => {
  const r = buildRanking([c("AAA", { gdp: num(null) })], "gdp");
  assert.match(rankSentence(r, "AAA", "ko")!, /자료가 없어/);
});

test("상위 몇 퍼센트를 계산한다", () => {
  const list = Array.from({ length: 10 }, (_, i) => c(`C${i}`, { gdp: num(100 - i) }));
  const r = buildRanking(list, "gdp");
  assert.equal(percentile(r, "C0"), 10);
  assert.equal(percentile(r, "C9"), 100);
});

test("모든 랭킹 지표에 한국어·영어 라벨과 설명, 단위가 있다", () => {
  for (const m of RANKING_METRICS) {
    assert.ok(m.koLabel && m.enLabel, `${m.metricId} 라벨`);
    assert.ok(m.koDescription && m.enDescription, `${m.metricId} 설명`);
    assert.ok(m.unit, `${m.metricId} 단위`);
    assert.ok(["desc", "asc"].includes(m.defaultOrder));
  }
  assert.equal(new Set(RANKING_METRICS.map((m) => m.metricId)).size, RANKING_METRICS.length, "지표 id 중복");
});
