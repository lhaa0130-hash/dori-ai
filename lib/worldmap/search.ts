// 국가 검색과 URL 상태 (명세서 §8).
// 검색 index 는 한 번만 만들고 입력마다 다시 만들지 않는다(명세서 §14).

import type { ContinentCode, CountryRecord, SupportedLanguage, ViewMode } from "./types";
import { CONTINENTS, VIEW_MODES } from "./types";

/** 대소문자·앞뒤 공백·라틴 악센트 차이를 없앤다. 한글은 그대로 둔다. */
export function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // 결합 악센트 제거 (é → e). 소스에 결합문자를 직접 넣지 않는다.
    .normalize("NFC");
}

export interface SearchEntry {
  iso3: string;
  continentCode: ContinentCode;
  /** 매칭 대상 문자열들 — 한글명·영문명·공식명·ISO2·ISO3 (명세서 §8.1) */
  haystack: string[];
}

export function buildSearchIndex(countries: CountryRecord[]): SearchEntry[] {
  return countries.map((c) => ({
    iso3: c.iso3,
    continentCode: c.continentCode,
    haystack: [c.nameKo, c.nameEn, c.officialNameEn, c.iso2, c.iso3].filter(Boolean).map(normalize),
  }));
}

export const SEARCH_LIMIT = 10;

/**
 * prefix 일치를 먼저, contains 일치를 다음으로 정렬해 최대 10개.
 * continent 가 주어지면 그 대륙으로 제한한다(명세서 §8.2).
 */
export function searchCountries(
  index: SearchEntry[],
  query: string,
  continent: ContinentCode | null = null,
): string[] {
  const q = normalize(query);
  if (!q) return [];

  const prefix: string[] = [];
  const contains: string[] = [];

  for (const entry of index) {
    if (continent && entry.continentCode !== continent) continue;
    let rank = -1;
    for (const hay of entry.haystack) {
      if (hay.startsWith(q)) { rank = 0; break; }
      if (hay.includes(q)) rank = 1;
    }
    if (rank === 0) prefix.push(entry.iso3);
    else if (rank === 1) contains.push(entry.iso3);
  }

  return [...prefix, ...contains].slice(0, SEARCH_LIMIT);
}

// ── URL 상태 (명세서 §8.3) ─────────────────────────────────────────
export interface UrlState {
  country: string | null;
  compare: string | null;
  lang: SupportedLanguage | null;
  view: ViewMode;
  continent: ContinentCode | null;
}

const ISO3 = /^[A-Za-z]{3}$/;

/**
 * 쿼리스트링 → 상태. 잘못된 값은 조용히 무시한다(명세서 §8.3).
 * `valid` 를 주면 실제 존재하는 ISO 인지까지 확인한다.
 */
export function parseUrlState(params: URLSearchParams, valid?: Set<string>): UrlState {
  const iso = (raw: string | null): string | null => {
    if (!raw || !ISO3.test(raw)) return null;
    const upper = raw.toUpperCase();
    if (valid && !valid.has(upper)) return null;
    return upper;
  };

  const country = iso(params.get("country"));
  let compare = iso(params.get("compare"));
  // 같은 국가를 A·B 로 둘 수 없다(명세서 §7.5-4)
  if (compare && compare === country) compare = null;
  // 선택 국가가 없으면 비교만 남길 수 없다
  if (!country) compare = null;

  const rawLang = params.get("lang");
  const rawView = params.get("view");
  const rawContinent = params.get("continent")?.toUpperCase() ?? null;

  return {
    country,
    compare,
    lang: rawLang === "ko" || rawLang === "en" ? rawLang : null,
    view: VIEW_MODES.includes(rawView as ViewMode) ? (rawView as ViewMode) : "split",
    continent: CONTINENTS.includes(rawContinent as ContinentCode) ? (rawContinent as ContinentCode) : null,
  };
}

/** 상태 → 쿼리스트링. 기본값은 넣지 않아 URL 을 짧게 유지한다. */
export function buildUrlQuery(state: UrlState): string {
  const p = new URLSearchParams();
  if (state.country) p.set("country", state.country);
  if (state.compare && state.country && state.compare !== state.country) p.set("compare", state.compare);
  if (state.lang) p.set("lang", state.lang);
  if (state.view !== "split") p.set("view", state.view);
  if (state.continent) p.set("continent", state.continent);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** 지표 기준 세계 순위. 자료 없는 나라는 순위에서 뺀다. */
export function worldRank(
  countries: CountryRecord[],
  iso3: string,
  metric: "population" | "area" | "gdp" | "gdpPerCapita",
): { rank: number; total: number } | null {
  const ranked = countries
    .filter((c) => c[metric].s !== "missing" && c[metric].v != null)
    .sort((a, b) => (b[metric].v ?? 0) - (a[metric].v ?? 0));
  const idx = ranked.findIndex((c) => c.iso3 === iso3);
  return idx < 0 ? null : { rank: idx + 1, total: ranked.length };
}
