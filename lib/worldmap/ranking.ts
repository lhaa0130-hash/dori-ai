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
  | "forestAreaRate" | "renewableEnergyRate" | "co2PerCapita"
  // 지시서 08 §5.1 — 이미 검증된 국가 데이터만으로 계산되는 지표. 외부 API 를 새로 부르지 않는다.
  | "timezoneCount" | "officialLanguageCount" | "capitalEquatorDistance";

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
  /**
   * 어린이가 먼저 읽는 질문형 제목 (지시서 08 §3.1).
   * "인구 밀도" 보다 "사람들이 가장 빽빽하게 사는 나라는?" 에 먼저 반응한다.
   */
  questionKo: string;
  questionEn: string;
  /** 값의 출처. 화면에 항상 함께 보여준다(§7.2). */
  sourceName: string;
  sourceUrl: string;
  /**
   * 값이 작을수록 '가까움·적음' 같은 뜻이라 기본 정렬이 오름차순인 지표.
   * 순위의 좋고 나쁨이 아니라 읽는 방향이다.
   */
  caveatKo?: string;
}

const WB = { sourceName: "World Bank", sourceUrl: "https://data.worldbank.org" } as const;
const OWN = { sourceName: "나라콕 국가 데이터", sourceUrl: "https://illo.im/world-map" } as const;

export const RANKING_METRICS: RankingMetric[] = [
  // ── 크기와 위치 ─────────────────────────────────────────────────
  { metricId: "area", category: "land", koLabel: "국토 면적", enLabel: "Total area",
    questionKo: "어느 나라가 가장 클까?", questionEn: "Which country is the largest?",
    koDescription: "나라가 차지하는 전체 면적이에요.", enDescription: "Total land and inland water area.",
    unit: "km²", defaultOrder: "desc", ...OWN },
  { metricId: "population", category: "land", koLabel: "인구", enLabel: "Population",
    questionKo: "사람이 가장 많이 사는 나라는?", questionEn: "Which country has the most people?",
    koDescription: "그 나라에 사는 사람 수예요.", enDescription: "Total number of people living in the country.",
    unit: "명", defaultOrder: "desc", ...WB },
  { metricId: "populationDensity", category: "land", koLabel: "인구 밀도", enLabel: "Population density",
    questionKo: "사람들이 가장 빽빽하게 사는 나라는?", questionEn: "Where do people live most closely together?",
    koDescription: "1km²에 몇 명이 사는지예요. 인구 ÷ 국토 면적으로 계산했어요.",
    enDescription: "People per km², computed as population divided by total area.",
    unit: "명/km²", defaultOrder: "desc", derived: true, ...WB },
  { metricId: "borderCountryCount", category: "land", koLabel: "이웃 나라 수", enLabel: "Land neighbours",
    questionKo: "이웃 나라가 가장 많은 나라는?", questionEn: "Which country has the most land neighbours?",
    koDescription: "육지로 맞닿은 나라가 몇 개인지예요.", enDescription: "Number of countries sharing a land border.",
    unit: "개국", defaultOrder: "desc", derived: true, ...OWN },
  { metricId: "timezoneCount", category: "land", koLabel: "시간대 수", enLabel: "Time zones",
    questionKo: "시간대가 가장 많은 나라는?", questionEn: "Which country has the most time zones?",
    koDescription: "그 나라가 쓰는 시간대가 몇 개인지예요. 멀리 떨어진 섬이나 땅이 있으면 늘어나요.",
    enDescription: "Number of distinct IANA time zones used by the country.",
    unit: "개", defaultOrder: "desc", derived: true, ...OWN,
    caveatKo: "시간대 자료가 있는 나라만 순위에 넣었어요." },
  { metricId: "officialLanguageCount", category: "land", koLabel: "공식 언어 수", enLabel: "Official languages",
    questionKo: "공식 언어가 가장 많은 나라는?", questionEn: "Which country has the most official languages?",
    koDescription: "나라에서 공식으로 쓰는 언어가 몇 개인지예요.",
    enDescription: "Number of official languages.", unit: "개", defaultOrder: "desc", derived: true, ...OWN },
  { metricId: "capitalEquatorDistance", category: "land", koLabel: "수도와 적도의 위도 차이", enLabel: "Capital latitude from equator",
    questionKo: "어느 수도가 적도와 가장 가까울까?", questionEn: "Which capital is closest to the equator?",
    koDescription: "수도가 적도에서 위아래로 얼마나 떨어져 있는지를 위도 차이로 나타냈어요. 숫자가 작을수록 적도에 가까워요.",
    enDescription: "Absolute latitude of the capital city, in degrees. Smaller means closer to the equator.",
    // ⚠️ km 로 적지 않는다. 위도 차이는 거리가 아니다. 지구 대원거리로 바꾸려면 산식을 따로 검증해야 한다.
    unit: "°", defaultOrder: "asc", derived: true, ...OWN,
    caveatKo: "거리(km)가 아니라 위도 차이예요." },

  // ── 돈과 산업 ───────────────────────────────────────────────────
  { metricId: "gdp", category: "economy", koLabel: "GDP", enLabel: "GDP",
    questionKo: "경제 규모가 큰 나라는?", questionEn: "Which country has the largest economy?",
    koDescription: "한 해 동안 그 나라에서 만들어진 것의 값을 모두 더한 금액이에요. 명목·현재 미국 달러 기준이에요. 경제 규모가 크다고 해서 그 나라 사람들의 생활이 모두 넉넉하다는 뜻은 아니에요.",
    enDescription: "Gross domestic product, nominal, current US$.",
    unit: "US$", defaultOrder: "desc", ...WB },
  { metricId: "gdpPerCapita", category: "economy", koLabel: "1인당 GDP", enLabel: "GDP per capita",
    questionKo: "1인당 GDP가 높은 나라는?", questionEn: "Which country has the highest GDP per person?",
    koDescription: "GDP 를 인구로 나눈 값이에요. 명목·현재 미국 달러 기준이에요. 평균이라서 사람마다의 형편과는 달라요.",
    enDescription: "GDP divided by population, nominal, current US$.",
    unit: "US$", defaultOrder: "desc", ...WB },
  { metricId: "gdpGrowth", category: "economy", koLabel: "경제 성장률", enLabel: "GDP growth",
    questionKo: "경제 규모가 빠르게 변한 나라는?", questionEn: "Where did the economy change fastest?",
    koDescription: "작년보다 경제 규모가 얼마나 늘거나 줄었는지예요.", enDescription: "Annual percentage growth rate of GDP.",
    unit: "%", defaultOrder: "desc", ...WB },

  // ── 사람과 생활 ─────────────────────────────────────────────────
  { metricId: "lifeExpectancy", category: "society", koLabel: "기대 수명", enLabel: "Life expectancy",
    questionKo: "평균적으로 오래 사는 나라는?", questionEn: "Where do people live longest on average?",
    koDescription: "지금 태어난 아기가 평균 몇 살까지 살 것으로 보는지예요.",
    enDescription: "Life expectancy at birth, in years.", unit: "세", defaultOrder: "desc", ...WB },
  { metricId: "internetUsageRate", category: "society", koLabel: "인터넷 사용 비율", enLabel: "Internet users",
    questionKo: "인터넷을 사용하는 사람이 많은 나라는?", questionEn: "Where do the most people use the internet?",
    koDescription: "100명 중 몇 명이 인터넷을 쓰는지예요.", enDescription: "Share of people using the internet.",
    unit: "%", defaultOrder: "desc", ...WB },
  { metricId: "urbanPopulationRate", category: "society", koLabel: "도시 인구 비율", enLabel: "Urban population",
    questionKo: "도시에 사는 사람이 많은 나라는?", questionEn: "Where do the most people live in cities?",
    koDescription: "100명 중 몇 명이 도시에 사는지예요.", enDescription: "Share of people living in urban areas.",
    unit: "%", defaultOrder: "desc", ...WB },
  { metricId: "birthRate", category: "society", koLabel: "출생률", enLabel: "Birth rate",
    questionKo: "아기가 많이 태어나는 나라는?", questionEn: "Where are the most babies born?",
    koDescription: "1년 동안 인구 1000명당 몇 명이 태어나는지예요.", enDescription: "Births per 1,000 people per year.",
    unit: "‰", defaultOrder: "desc", ...WB },
  { metricId: "childPopulationRate", category: "society", koLabel: "어린이 비율", enLabel: "Children (0–14)",
    questionKo: "어린이가 차지하는 비율이 높은 나라는?", questionEn: "Where is the share of children highest?",
    koDescription: "전체 인구 중 0~14세가 차지하는 비율이에요.", enDescription: "Share of population aged 0–14.",
    unit: "%", defaultOrder: "desc", ...WB },

  // ── 자연과 지구 ─────────────────────────────────────────────────
  { metricId: "forestAreaRate", category: "nature", koLabel: "숲 비율", enLabel: "Forest area",
    questionKo: "국토에서 숲이 차지하는 비율이 큰 나라는?", questionEn: "Where does forest cover the most land?",
    koDescription: "국토 중 숲이 차지하는 비율이에요.", enDescription: "Share of land area covered by forest.",
    unit: "%", defaultOrder: "desc", ...WB },
  { metricId: "renewableEnergyRate", category: "nature", koLabel: "재생에너지 비율", enLabel: "Renewable energy",
    questionKo: "재생에너지를 많이 사용하는 나라는?", questionEn: "Which countries use the most renewable energy?",
    koDescription: "쓰는 에너지 중 재생에너지가 차지하는 비율이에요.",
    enDescription: "Renewable energy share of total final energy consumption.", unit: "%", defaultOrder: "desc", ...WB },
  { metricId: "co2PerCapita", category: "nature", koLabel: "1인당 이산화탄소 배출", enLabel: "CO₂ per person",
    questionKo: "한 사람당 이산화탄소 배출량은?", questionEn: "How much CO₂ is emitted per person?",
    koDescription: "한 사람이 1년에 내보내는 이산화탄소 양이에요.",
    enDescription: "Carbon dioxide emissions per person per year.", unit: "t", defaultOrder: "desc", ...WB },
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
  if (id === "timezoneCount") {
    // ⚠️ 원본은 같은 시간대를 ["Asia/Seoul", "Korea Standard Time", "UTC+09:00"] 처럼
    //    세 형태로 함께 준다. 그대로 세면 한국이 시간대 3개인 나라가 된다.
    //    실제 시간대를 뜻하는 IANA ID 만 센다.
    const ids = new Set((c.timezones ?? []).filter((z) => z.includes("/")));
    // 자료 자체가 없는 나라는 0 이 아니라 결측이다 — 시간대가 없는 나라는 없다.
    return ids.size > 0 ? { value: ids.size, year: null } : { value: null, year: null };
  }
  if (id === "officialLanguageCount") {
    const n = (c.languages ?? []).length;
    return n > 0 ? { value: n, year: null } : { value: null, year: null };
  }
  if (id === "capitalEquatorDistance") {
    // capitalPoint 는 [경도, 위도]. 적도와의 위도 차이는 위도의 절댓값이다.
    const lat = Array.isArray(c.capitalPoint) ? c.capitalPoint[1] : null;
    if (lat == null || !Number.isFinite(lat)) return { value: null, year: null };
    return { value: Math.abs(lat), year: null };
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
