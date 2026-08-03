// 한국어·영어 문구 (명세서 §13). 화면 문자열은 전부 여기를 거친다.

import type { SupportedLanguage } from "./types";

export const DICT = {
  eyebrow: { ko: "NARAKOK BY ILLO", en: "NARAKOK BY ILLO" },
  title: { ko: "나라콕", en: "NARAKOK" },
  lead: { ko: "콕 눌러 만나는 세계", en: "Tap a Country, Meet the World" },
  randomTrip: { ko: "🎲 랜덤 여행", en: "🎲 Random trip" },
  searchPlaceholder: { ko: "국가명 또는 ISO 코드 검색", en: "Search country name or ISO code" },
  searchLabel: { ko: "국가 검색", en: "Search countries" },
  emptyState: { ko: "지도에서 국가를 선택하거나 검색해 보세요.", en: "Select a country on the map or search by name." },
  quickPicks: { ko: "빠른 선택", en: "Quick picks" },
  noResults: { ko: "검색 결과가 없습니다.", en: "No countries found." },
  noData: { ko: "자료 없음", en: "No data" },
  noComparison: { ko: "비교할 자료가 없습니다.", en: "No data to compare." },

  continent: { ko: "대륙", en: "Continent" },
  allContinents: { ko: "전체", en: "All" },

  capital: { ko: "수도", en: "Capital" },
  region: { ko: "지역", en: "Region" },
  leader: { ko: "대표 지도자", en: "Leader" },
  established: { ko: "국가 수립일", en: "Established" },
  religionDefault: { ko: "주요 종교", en: "Main religion" },
  population: { ko: "인구", en: "Population" },
  area: { ko: "국토 면적", en: "Area" },
  gdp: { ko: "GDP", en: "GDP" },
  gdpPerCapita: { ko: "1인당 GDP", en: "GDP per capita" },
  gdpNote: { ko: "명목 · 현재 미국 달러", en: "Nominal, current US$" },

  compare: { ko: "비교", en: "Compare" },
  compareWith: { ko: "비교할 국가 선택", en: "Choose a country to compare" },
  countryA: { ko: "선택 국가", en: "Selected" },
  countryB: { ko: "비교 국가", en: "Comparison" },
  swap: { ko: "A/B 교환", en: "Swap A/B" },
  resetCompare: { ko: "비교 초기화", en: "Clear comparison" },
  backToDetail: { ko: "단일 국가 상세로", en: "Back to details" },
  changeA: { ko: "선택 국가 변경", en: "Change selected" },
  changeB: { ko: "비교 국가 변경", en: "Change comparison" },
  sameCountry: { ko: "같은 국가는 비교할 수 없습니다.", en: "Pick two different countries." },
  difference: { ko: "차이", en: "Difference" },

  sources: { ko: "데이터 출처", en: "Data sources" },
  asOf: { ko: "기준", en: "as of" },
  updatedAt: { ko: "갱신", en: "Updated" },
  staleWarning: { ko: "업데이트 지연", en: "Update delayed" },
  showSources: { ko: "출처 보기", en: "Show sources" },

  colorBy: { ko: "색 기준", en: "Color by" },
  webglFallback: { ko: "이 기기에서는 지도를 표시할 수 없습니다.", en: "This device cannot display the map." },
  webglFallbackHint: {
    ko: "검색과 국가 정보, 비교는 그대로 사용할 수 있습니다.",
    en: "Search, country details and comparison still work.",
  },
  mapLabel: {
    ko: "국가 경계가 표시된 세계 지도입니다. 국가를 선택하려면 아래 검색을 사용하세요.",
    en: "World map with country borders. Use the search below to select a country.",
  },
  loading: { ko: "지도 데이터를 불러오는 중…", en: "Loading map data…" },
  loadError: { ko: "국가 데이터를 불러오지 못했습니다.", en: "Could not load country data." },
  retry: { ko: "다시 시도", en: "Retry" },
  langToggle: { ko: "English", en: "한국어" },
  worldRank: { ko: "세계 순위", en: "World rank" },
} as const;

export type DictKey = keyof typeof DICT;

export function t(key: DictKey, lang: SupportedLanguage): string {
  return DICT[key][lang];
}

/** 명세서 §7.3 빠른 선택 */
export const QUICK_PICKS = ["KOR", "USA", "JPN", "FRA", "BRA"] as const;

/**
 * 표시 언어 결정 (명세서 §13).
 *   1) URL lang  2) 저장된 선택  3) 브라우저 언어가 한국어면 ko  4) en
 */
export function resolveLanguage(urlLang: string | null, stored: string | null, navigatorLang: string | undefined): SupportedLanguage {
  if (urlLang === "ko" || urlLang === "en") return urlLang;
  if (stored === "ko" || stored === "en") return stored;
  return navigatorLang?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

export const LANG_STORAGE_KEY = "illo-worldmap-lang";
