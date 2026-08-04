// 검색엔진이 색인할 수 있는 나라콕 라우트 registry (지시서 10 §3.1).
//
// 지금까지 국가 상세는 `?country=KOR` 쿼리 상태로만 존재했다. 사용자에게는 195개국이
// 다 다르게 보였지만, 검색엔진에는 전부 같은 문서 하나였다 — title·description·H1·
// canonical 이 전부 허브와 같았기 때문이다. 이 파일이 국가마다 진짜 주소를 준다.
//
// ⚠️ slug 는 표시명과 분리한다. 표시명은 정식 국호 논의로 바뀔 수 있지만
//    주소가 따라 바뀌면 그동안 쌓인 링크가 전부 깨진다.

import type { ContinentCode, CountryRecord } from "./types";

export interface CountrySeoRoute {
  iso3: string;
  /** 안정적인 ASCII slug. 한 번 정하면 바꾸지 않는다. */
  slug: string;
  /** 바꿔야 했던 적이 있으면 여기 남기고 308 로 보낸다. */
  previousSlugs: string[];
  indexableKo: boolean;
  indexableEn: boolean;
}

/**
 * 1차 공개 30개국 (§4.4).
 *
 * 195개를 한 번에 색인시키지 않는다. 얇은 페이지가 대량으로 색인되면
 * 사이트 전체의 평가가 내려간다 — 애드센스 심사에서 이미 겪은 문제다.
 */
export const FIRST_WAVE_ISO3 = [
  "KOR", "PRK", "JPN", "CHN", "USA", "CAN",
  "GBR", "FRA", "DEU", "ITA", "ESP", "RUS",
  "IND", "IDN", "THA", "VNM", "SGP",
  "AUS", "NZL",
  "EGY", "KEN", "ZAF", "NGA", "MAR",
  "BRA", "ARG", "MEX", "PER",
  "TON", "SUR",
] as const;

/**
 * 표시용 영문명에서 slug 를 만든다.
 *
 * ⚠️ 자동 생성한 slug 를 그대로 쓰지 않고 아래 SLUG_OVERRIDE 로 확인한 것만 고정한다.
 *    "Korea (Republic of)" 같은 원본에서 기계적으로 뽑으면 주소가 이상해진다.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 사람이 확인한 slug. 자동 생성이 어색하거나 흔히 쓰는 이름과 다른 경우만 적는다. */
const SLUG_OVERRIDE: Record<string, string> = {
  KOR: "south-korea",
  PRK: "north-korea",
  USA: "united-states",
  GBR: "united-kingdom",
  RUS: "russia",
  CZE: "czechia",
  ARE: "united-arab-emirates",
  COD: "dr-congo",
  COG: "republic-of-the-congo",
  LAO: "laos",
  SYR: "syria",
  TZA: "tanzania",
  VEN: "venezuela",
  BOL: "bolivia",
  IRN: "iran",
  VNM: "vietnam",
  MDA: "moldova",
  BRN: "brunei",
  FSM: "micronesia",
  MKD: "north-macedonia",
  SWZ: "eswatini",
  TLS: "timor-leste",
  CIV: "ivory-coast",
  CPV: "cape-verde",
  VAT: "vatican-city",
};

export function countrySlug(c: CountryRecord): string {
  return SLUG_OVERRIDE[c.iso3] ?? slugify(c.nameEn);
}

export function buildCountryRoutes(countries: CountryRecord[]): CountrySeoRoute[] {
  const firstWave = new Set<string>(FIRST_WAVE_ISO3);
  return countries.map((c) => ({
    iso3: c.iso3,
    slug: countrySlug(c),
    previousSlugs: [],
    // 품질 gate 를 통과한 나라만 색인한다(§4.3). 나머지는 페이지는 있되 noindex 다.
    indexableKo: firstWave.has(c.iso3),
    indexableEn: firstWave.has(c.iso3),
  }));
}

// ── 대륙 ──────────────────────────────────────────────────────────
export const CONTINENT_SLUG: Record<ContinentCode, string> = {
  AS: "asia", EU: "europe", AF: "africa", NA: "north-america", SA: "south-america", OC: "oceania",
};
export const CONTINENT_BY_SLUG = new Map(
  (Object.entries(CONTINENT_SLUG) as Array<[ContinentCode, string]>).map(([code, slug]) => [slug, code]),
);

// ── 랭킹 ──────────────────────────────────────────────────────────
/**
 * 랭킹 지표 id 는 camelCase 인데 주소에는 그대로 쓰지 않는다.
 * `/rankings/populationDensity` 보다 `/rankings/population-density` 가 읽기 쉽고
 * 대소문자 혼동으로 중복 URL 이 생기지 않는다.
 */
export function metricSlug(metricId: string): string {
  return metricId.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

// ── 경로 조립 ─────────────────────────────────────────────────────
export type Locale = "ko" | "en";

const PREFIX: Record<Locale, string> = { ko: "/world-map", en: "/en/world-map" };

export const worldMapHubPath = (locale: Locale) => PREFIX[locale];
export const countriesIndexPath = (locale: Locale) => `${PREFIX[locale]}/countries`;
export const countryPath = (locale: Locale, slug: string) => `${PREFIX[locale]}/countries/${slug}`;
export const continentPath = (locale: Locale, slug: string) => `${PREFIX[locale]}/continents/${slug}`;
export const rankingPath = (locale: Locale, slug: string) => `${PREFIX[locale]}/rankings/${slug}`;
export const curiosityPath = (locale: Locale, slug: string) => `${PREFIX[locale]}/curiosities/${slug}`;

export const SITE_ORIGIN = "https://illo.im";
export const absolute = (path: string) => `${SITE_ORIGIN}${path}`;

/** 호기심 모음 id 는 이미 kebab-case 라 그대로 쓰되, 주소에서 뜻이 드러나게 다듬는다. */
export const CURIOSITY_SLUG: Record<string, string> = {
  island: "island-countries",
  landlocked: "landlocked-countries",
  "double-landlocked": "doubly-landlocked-countries",
  equator: "countries-on-the-equator",
  "single-neighbour": "countries-with-one-neighbour",
  multilingual: "multilingual-countries",
  "many-timezones": "countries-with-many-time-zones",
  "shared-currency": "countries-sharing-a-currency",
  "capital-equals-country": "capital-same-name-as-country",
};
export const CURIOSITY_BY_SLUG = new Map(
  Object.entries(CURIOSITY_SLUG).map(([id, slug]) => [slug, id]),
);
