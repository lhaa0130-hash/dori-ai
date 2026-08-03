// 세계 랭킹 (랭킹 지시서 §3 · §4).
//
// 원칙:
//   · **표시 문자열이 아니라 원본 숫자로 정렬한다.** "1.2조" 같은 축약값으로 정렬하면 순서가 깨진다.
//   · 0 과 '자료 없음' 은 다르다. 자료가 없는 나라는 순위 산정에서 빼고, 0 은 정상 값으로 센다.
//   · 동점은 표준 경쟁 순위 — 1, 2, 2, 4.
//   · 분모(순위를 매긴 나라 수)를 항상 함께 돌려준다.
//   · 값을 추정해 결측을 메우지 않는다.

import type { ContinentCode, CountryRecord, NumericMetric, SupportedLanguage } from "./types";
import { withJosa } from "./korean";

/** 랭킹에 쓸 수 있는 지표. CountryRecord 의 숫자 지표 키와 1:1로 맞춘다. */
export type RankingMetricId =
  | "area" | "population" | "populationDensity" | "borderCountryCount"
  | "gdp" | "gdpPerCapita" | "gdpGrowth"
  | "lifeExpectancy" | "internetUsageRate" | "urbanPopulationRate"
  | "birthRate" | "childPopulationRate"
  | "forestAreaRate" | "renewableEnergyRate" | "co2PerCapita";

export type RankingCategory = "land" | "economy" | "society" | "nature";

export interface RankingMetric {
  metricId: RankingMetricId;
  category: RankingCategory;
  koLabel: string;
  enLabel: string;
  koDescription: string;
  enDescription: string;
  unit: string;
  /** 값이 큰 쪽이 위로 오는 게 자연스러운 지표인지. 순위의 '우열' 판단이 아니라 기본 정렬 방향이다. */
  defaultOrder: "desc" | "asc";
  /** 원본 지표에서 파생 계산되는지(인구밀도·국경 수). */
  derived?: boolean;
}

export const RANKING_METRICS: RankingMetric[] = [
  // 땅과 사람
  { metricId: "area", category: "land", koLabel: "국토 면적", enLabel: "Total area",
    koDescription: "나라가 차지하는 전체 면적이에요.", enDescription: "Total land and inland water area.",
    unit: "km²", defaultOrder: "desc" },
  { metricId: "population", category: "land", koLabel: "인구", enLabel: "Population",
    koDescription: "그 나라에 사는 사람 수예요.", enDescription: "Total number of people living in the country.",
    unit: "명", defaultOrder: "desc" },
  { metricId: "populationDensity", category: "land", koLabel: "인구 밀도", enLabel: "Population density",
    koDescription: "1km²에 몇 명이 사는지예요. 인구 ÷ 국토 면적으로 계산했어요.",
    enDescription: "People per km², computed as population divided by total area.",
    unit: "명/km²", defaultOrder: "desc", derived: true },
  { metricId: "borderCountryCount", category: "land", koLabel: "이웃 나라 수", enLabel: "Land neighbours",
    koDescription: "육지로 맞닿은 나라가 몇 개인지예요.", enDescription: "Number of countries sharing a land border.",
    unit: "개국", defaultOrder: "desc", derived: true },

  // 경제
  { metricId: "gdp", category: "economy", koLabel: "GDP", enLabel: "GDP",
    koDescription: "한 해 동안 그 나라에서 만들어진 것의 값을 모두 더한 금액이에요. 명목·현재 미국 달러 기준이에요.",
    enDescription: "Gross domestic product, nominal, current US$.",
    unit: "US$", defaultOrder: "desc" },
  { metricId: "gdpPerCapita", category: "economy", koLabel: "1인당 GDP", enLabel: "GDP per capita",
    koDescription: "GDP 를 인구로 나눈 값이에요. 명목·현재 미국 달러 기준이에요.",
    enDescription: "GDP divided by population, nominal, current US$.",
    unit: "US$", defaultOrder: "desc" },
  { metricId: "gdpGrowth", category: "economy", koLabel: "경제 성장률", enLabel: "GDP growth",
    koDescription: "작년보다 경제 규모가 얼마나 늘었는지예요.", enDescription: "Annual percentage growth rate of GDP.",
    unit: "%", defaultOrder: "desc" },

  // 생활과 사회
  { metricId: "lifeExpectancy", category: "society", koLabel: "기대 수명", enLabel: "Life expectancy",
    koDescription: "지금 태어난 아기가 평균 몇 살까지 살 것으로 보는지예요.",
    enDescription: "Life expectancy at birth, in years.", unit: "세", defaultOrder: "desc" },
  { metricId: "internetUsageRate", category: "society", koLabel: "인터넷 사용 비율", enLabel: "Internet users",
    koDescription: "100명 중 몇 명이 인터넷을 쓰는지예요.", enDescription: "Share of people using the internet.",
    unit: "%", defaultOrder: "desc" },
  { metricId: "urbanPopulationRate", category: "society", koLabel: "도시 인구 비율", enLabel: "Urban population",
    koDescription: "100명 중 몇 명이 도시에 사는지예요.", enDescription: "Share of people living in urban areas.",
    unit: "%", defaultOrder: "desc" },
  { metricId: "birthRate", category: "society", koLabel: "출생률", enLabel: "Birth rate",
    koDescription: "1년 동안 인구 1000명당 몇 명이 태어나는지예요.", enDescription: "Births per 1,000 people per year.",
    unit: "‰", defaultOrder: "desc" },
  { metricId: "childPopulationRate", category: "society", koLabel: "어린이 비율", enLabel: "Children (0–14)",
    koDescription: "전체 인구 중 0~14세가 차지하는 비율이에요.", enDescription: "Share of population aged 0–14.",
    unit: "%", defaultOrder: "desc" },

  // 자연과 환경
  { metricId: "forestAreaRate", category: "nature", koLabel: "숲 비율", enLabel: "Forest area",
    koDescription: "국토 중 숲이 차지하는 비율이에요.", enDescription: "Share of land area covered by forest.",
    unit: "%", defaultOrder: "desc" },
  { metricId: "renewableEnergyRate", category: "nature", koLabel: "재생에너지 비율", enLabel: "Renewable energy",
    koDescription: "쓰는 에너지 중 재생에너지가 차지하는 비율이에요.",
    enDescription: "Renewable energy share of total final energy consumption.", unit: "%", defaultOrder: "desc" },
  { metricId: "co2PerCapita", category: "nature", koLabel: "1인당 CO₂ 배출", enLabel: "CO₂ per person",
    koDescription: "한 사람이 1년에 내보내는 이산화탄소 양이에요.", enDescription: "Carbon dioxide emissions per person per year.",
    unit: "t", defaultOrder: "desc" },
];

export const RANKING_BY_ID = new Map(RANKING_METRICS.map((m) => [m.metricId, m]));

export const CATEGORY_LABEL: Record<RankingCategory, { ko: string; en: string }> = {
  land: { ko: "땅과 사람", en: "Land & people" },
  economy: { ko: "경제", en: "Economy" },
  society: { ko: "생활과 사회", en: "Society" },
  nature: { ko: "자연과 환경", en: "Nature" },
};

/**
 * 나라 하나에서 지표 값을 꺼낸다.
 * 파생 지표는 여기서 계산하되, 재료가 하나라도 없으면 **null 을 돌려 결측으로 둔다.**
 */
export function metricValue(c: CountryRecord, id: RankingMetricId): { value: number | null; year: number | null } {
  if (id === "populationDensity") {
    const pop = c.population.s === "ok" ? c.population.v : null;
    const area = c.area.s === "ok" ? c.area.v : null;
    if (pop == null || area == null || area <= 0) return { value: null, year: null };
    return { value: pop / area, year: c.population.y };
  }
  if (id === "borderCountryCount") {
    // 0 은 정상 값이다(섬나라). 자료 없음과 구분한다.
    return { value: c.borderCountryIso3.length, year: null };
  }
  const m = (c as unknown as Record<string, NumericMetric>)[id];
  if (!m || m.s === "missing" || m.v == null) return { value: null, year: null };
  return { value: m.v, year: m.y };
}

export interface RankingRow {
  rank: number;
  iso3: string;
  country: CountryRecord;
  value: number;
  year: number | null;
}

export interface RankingResult {
  metric: RankingMetric;
  rows: RankingRow[];
  /** 순위를 매긴 나라 수 = 분모 */
  eligibleCountryCount: number;
  /** 자료가 없어 제외된 나라 */
  missingIso3: string[];
  /** 여러 해가 섞였는지 — 섞였다면 화면에서 알려야 한다(지시서 §9) */
  years: number[];
  order: "desc" | "asc";
}

export interface RankingScope {
  continent?: ContinentCode | null;
  order?: "desc" | "asc";
}

/**
 * 랭킹을 계산한다.
 * 동점은 표준 경쟁 순위(1, 2, 2, 4)로 매긴다.
 */
export function buildRanking(
  countries: CountryRecord[],
  metricId: RankingMetricId,
  scope: RankingScope = {},
): RankingResult {
  const metric = RANKING_BY_ID.get(metricId);
  if (!metric) throw new Error(`알 수 없는 랭킹 지표: ${metricId}`);
  const order = scope.order ?? metric.defaultOrder;

  const pool = scope.continent ? countries.filter((c) => c.continentCode === scope.continent) : countries;

  const withValue: Array<{ c: CountryRecord; value: number; year: number | null }> = [];
  const missingIso3: string[] = [];
  for (const c of pool) {
    const { value, year } = metricValue(c, metricId);
    if (value == null || !Number.isFinite(value)) { missingIso3.push(c.iso3); continue; }
    withValue.push({ c, value, year });
  }

  // 원본 숫자로 정렬. 값이 같으면 이름 순으로 안정화한다(같은 순위는 그대로 유지).
  withValue.sort((a, b) =>
    a.value === b.value ? a.c.iso3.localeCompare(b.c.iso3) : order === "desc" ? b.value - a.value : a.value - b.value,
  );

  const rows: RankingRow[] = [];
  let lastValue: number | null = null;
  let lastRank = 0;
  withValue.forEach((item, i) => {
    // 표준 경쟁 순위 — 앞의 동점 개수만큼 건너뛴다
    const rank = lastValue !== null && item.value === lastValue ? lastRank : i + 1;
    lastValue = item.value;
    lastRank = rank;
    rows.push({ rank, iso3: item.c.iso3, country: item.c, value: item.value, year: item.year });
  });

  const years = [...new Set(rows.map((r) => r.year).filter((y): y is number => y != null))].sort();

  return {
    metric, rows, order,
    eligibleCountryCount: rows.length,
    missingIso3,
    years,
  };
}

/** 특정 나라의 순위만 뽑는다. 자료가 없으면 null. */
export function rankOf(result: RankingResult, iso3: string): RankingRow | null {
  return result.rows.find((r) => r.iso3 === iso3) ?? null;
}

/**
 * 어린이용 순위 설명 (지시서 §6).
 * 우수·열등 같은 가치 판단을 넣지 않는다.
 */
export function rankSentence(
  result: RankingResult,
  iso3: string,
  lang: SupportedLanguage,
  scopeLabel?: string,
): string | null {
  const row = rankOf(result, iso3);
  const total = result.eligibleCountryCount;
  const label = lang === "ko" ? result.metric.koLabel : result.metric.enLabel;

  if (!row) {
    return lang === "ko"
      ? `${withJosa(label, "은는")} 자료가 없어 순위를 매기지 않았어요.`
      : `No data for ${label}, so this country is not ranked.`;
  }
    // '전 세계' 는 '전 세계에서', 대륙 이름은 '아시아 국가 중에서' 로 읽히게 한다.
  const where = !scopeLabel || scopeLabel === "전 세계" || scopeLabel === "World"
    ? (lang === "ko" ? "전 세계에서" : "worldwide")
    : (lang === "ko" ? `${scopeLabel} 국가 중에서` : `among ${scopeLabel}`);
  return lang === "ko"
    ? `${where} ${withJosa(label, "이가")} ${row.rank}번째예요. (자료가 있는 ${total}개국 기준)`
    : `${row.rank}${ordinalSuffix(row.rank)} in ${label} ${where}. (of ${total} countries with data)`;
}

function ordinalSuffix(n: number): string {
  const r10 = n % 10, r100 = n % 100;
  if (r10 === 1 && r100 !== 11) return "st";
  if (r10 === 2 && r100 !== 12) return "nd";
  if (r10 === 3 && r100 !== 13) return "rd";
  return "th";
}

/** 상위 몇 %인지. 가치 판단 없이 위치만 알려준다. */
export function percentile(result: RankingResult, iso3: string): number | null {
  const row = rankOf(result, iso3);
  if (!row || result.eligibleCountryCount === 0) return null;
  return Math.round((row.rank / result.eligibleCountryCount) * 100);
}
