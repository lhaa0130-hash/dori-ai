// 국가 페이지 본문 생성 (지시서 10 §4.2 · §11.2).
//
// ⚠️ 여기서 만드는 모든 문장은 검증된 국가 데이터에서 나온다. AI 가 "케냐는 아름다운
//    자연으로 유명합니다" 같은 문장을 지어내게 하지 않는다. 확인할 수 없는 문장은
//    한 줄도 넣지 않는다 — 어린이가 읽는 페이지라 더욱 그렇다.

import type { CountryRecord, SupportedLanguage } from "./types";
import { josa, joinWithJosa } from "./korean";
import { formatMetric, formatDate } from "./format";
import { formatCurrency, formatTimezones, formatYear } from "./display";
import { buildRanking, RANKING_METRICS, type RankingMetric } from "./ranking";

export interface FactRow {
  label: string;
  value: string;
  /** 기준연도·출처처럼 값 옆에 붙는 보조 정보. */
  note?: string;
}

export interface QnA {
  q: string;
  a: string;
}

/** 어느 반구에 있는지 — 본토 경계 상자로 판정한다. */
function hemisphere(c: CountryRecord, lang: SupportedLanguage): string {
  const [, south, , north] = c.bbox;
  if (south < 0 && north > 0) return lang === "ko" ? "북반구와 남반구 양쪽" : "both hemispheres";
  if (north <= 0) return lang === "ko" ? "남반구" : "the southern hemisphere";
  return lang === "ko" ? "북반구" : "the northern hemisphere";
}

/**
 * "왜 이곳에 있을까?" — 위치 이야기 (§11.2).
 * 대륙·반구·적도와의 관계·바다/내륙/섬·이웃을 데이터로만 조립한다.
 */
export function locationStory(
  c: CountryRecord,
  all: CountryRecord[],
  lang: SupportedLanguage,
): string[] {
  const name = lang === "ko" ? c.nameKo : c.nameEn;
  const out: string[] = [];

  if (lang === "ko") {
    out.push(`${name}${josa(name, "은는")} ${c.continentKo}에 있어요. 지구를 반으로 나누면 ${hemisphere(c, "ko")}에 자리해요.`);
  } else {
    out.push(`${name} is in ${c.continentEn}, located in ${hemisphere(c, "en")}.`);
  }

  // 적도와의 거리 — 수도 위도로 설명한다. 위도 차이지 거리(km)가 아니다.
  const lat = Array.isArray(c.capitalPoint) ? c.capitalPoint[1] : null;
  if (lat != null) {
    const d = Math.abs(lat).toFixed(1);
    const near = Math.abs(lat) < 10;
    if (lang === "ko") {
      out.push(near
        ? `수도는 적도에서 위도로 약 ${d}° 떨어져 있어요. 적도와 아주 가까워요.`
        : `수도는 적도에서 위도로 약 ${d}° 떨어져 있어요.`);
    } else {
      out.push(near
        ? `Its capital sits about ${d}° of latitude from the equator — very close to it.`
        : `Its capital sits about ${d}° of latitude from the equator.`);
    }
  }

  // 바다·내륙·섬
  if (lang === "ko") {
    if (c.islandCountry) out.push("육지로 맞닿은 이웃 나라가 없는 섬나라예요.");
    else if (c.landlocked) out.push("바다와 맞닿은 곳이 없는 내륙국이에요.");
  } else {
    if (c.islandCountry) out.push("It is an island country with no land borders.");
    else if (c.landlocked) out.push("It is landlocked, with no coastline.");
  }

  // 이웃
  const neighbours = (c.borderCountryIso3 ?? [])
    .map((iso) => all.find((o) => o.iso3 === iso))
    .filter((x): x is CountryRecord => !!x);
  if (neighbours.length > 0) {
    if (lang === "ko") {
      const names = neighbours.map((n) => n.nameKo);
      out.push(`${joinWithJosa(names, "과와", { max: 4 })} 국경을 맞대고 있어요.`);
    } else {
      const names = neighbours.slice(0, 4).map((n) => n.nameEn);
      const more = neighbours.length > 4 ? ` and ${neighbours.length - 4} more` : "";
      out.push(`It shares land borders with ${names.join(", ")}${more}.`);
    }
  }

  return out;
}

/** 핵심 정보 카드 (§4.2). 값이 없으면 지어내지 않고 그 줄을 뺀다. */
export function factRows(c: CountryRecord, lang: SupportedLanguage): FactRow[] {
  const ko = lang === "ko";
  const rows: FactRow[] = [];

  if (c.capitalKo || c.capitalEn) {
    rows.push({ label: ko ? "수도" : "Capital", value: (ko ? c.capitalKo : c.capitalEn) ?? "" });
  }
  rows.push({ label: ko ? "대륙" : "Continent", value: ko ? c.continentKo : c.continentEn });
  if (c.subregionKo || c.subregionEn) {
    rows.push({ label: ko ? "지역" : "Region", value: (ko ? c.subregionKo : c.subregionEn) ?? "" });
  }

  const langs = (c.languages ?? []).map((l) => (ko ? l.ko : l.en)).filter(Boolean);
  if (langs.length) rows.push({ label: ko ? "공식 언어" : "Official languages", value: langs.join(", ") });

  const cur = (c.currencies ?? []).map((x) => formatCurrency(x, lang));
  if (cur.length) rows.push({ label: ko ? "통화" : "Currency", value: cur.join(", ") });

  if ((c.timezones ?? []).length) {
    rows.push({ label: ko ? "시간대" : "Time zone", value: formatTimezones(c.timezones, lang) });
  }

  for (const [key, labelKo, labelEn] of [
    ["population", "인구", "Population"],
    ["area", "국토 면적", "Area"],
    ["gdp", "GDP", "GDP"],
    ["gdpPerCapita", "1인당 GDP", "GDP per capita"],
  ] as const) {
    const f = formatMetric(c[key], lang);
    if (f.missing) continue;
    rows.push({ label: ko ? labelKo : labelEn, value: f.display, note: formatYear(f.year, lang) ?? undefined });
  }

  if (c.established.date) {
    rows.push({ label: ko ? "국가 수립일" : "Founded", value: formatDate(c.established.date, lang) });
  }
  return rows;
}

/**
 * 이 나라가 TOP 10 안에 든 랭킹 (§6.3).
 * 순위를 자랑하려는 게 아니라 관련 페이지로 이어주는 실제 데이터 관계다.
 */
export interface RankHit { metric: RankingMetric; rank: number; total: number }

export function notableRankings(c: CountryRecord, all: CountryRecord[], limit = 6): RankHit[] {
  const hits: RankHit[] = [];
  for (const metric of RANKING_METRICS) {
    const result = buildRanking(all, metric.metricId, { order: metric.defaultOrder });
    const row = result.rows.find((r) => r.iso3 === c.iso3);
    if (row && row.rank <= 10) {
      hits.push({ metric, rank: row.rank, total: result.eligibleCountryCount });
    }
  }
  return hits.sort((a, b) => a.rank - b.rank).slice(0, limit);
}

/** 어린이용 질문·답 (§4.3 — 최소 3개). 전부 데이터에서 나온다. */
export function questions(c: CountryRecord, all: CountryRecord[], lang: SupportedLanguage): QnA[] {
  const ko = lang === "ko";
  const name = ko ? c.nameKo : c.nameEn;
  const out: QnA[] = [];

  out.push({
    q: ko ? `${name}${josa(name, "은는")} 어느 대륙에 있나요?` : `Which continent is ${name} in?`,
    a: ko
      ? `${c.continentKo}에 있어요.${c.subregionKo ? ` 그중에서도 ${c.subregionKo} 지역이에요.` : ""}`
      : `It is in ${c.continentEn}.${c.subregionEn ? ` More specifically, in ${c.subregionEn}.` : ""}`,
  });

  const capital = ko ? c.capitalKo : c.capitalEn;
  if (capital) {
    out.push({
      q: ko ? `${name}의 수도는 어디인가요?` : `What is the capital of ${name}?`,
      a: ko ? `수도는 ${capital}${josa(capital, "이에요예요")}.` : `The capital is ${capital}.`,
    });
  }

  const neighbours = (c.borderCountryIso3 ?? [])
    .map((iso) => all.find((o) => o.iso3 === iso))
    .filter((x): x is CountryRecord => !!x);
  out.push({
    q: ko ? `${name}의 이웃 나라는 어디인가요?` : `Which countries border ${name}?`,
    a: neighbours.length === 0
      ? (ko
        ? (c.islandCountry ? "육지로 맞닿은 이웃 나라가 없는 섬나라예요." : "육지로 맞닿은 이웃 나라가 없어요.")
        : "It has no land neighbours.")
      : (ko
        ? `${joinWithJosa(neighbours.map((n) => n.nameKo), "과와", { max: 4 })} 맞닿아 있어요.`
        : `It borders ${neighbours.slice(0, 4).map((n) => n.nameEn).join(", ")}${neighbours.length > 4 ? " and others" : ""}.`),
  });

  const pop = formatMetric(c.population, lang);
  if (!pop.missing) {
    out.push({
      q: ko ? `${name}에는 몇 명이 살고 있나요?` : `How many people live in ${name}?`,
      a: ko
        ? `${pop.display}이 살고 있어요. ${formatYear(pop.year, "ko") ?? ""}이에요.`.trim()
        : `About ${pop.display}. ${formatYear(pop.year, "en") ?? ""}`.trim(),
    });
  }

  const area = formatMetric(c.area, lang);
  if (!area.missing) {
    out.push({
      q: ko ? `${name}의 국토 면적은 얼마인가요?` : `How large is ${name}?`,
      a: ko ? `국토 면적은 ${area.display}예요.` : `Its land area is ${area.display}.`,
    });
  }

  return out;
}

/** 페이지 title (§5.1). 국가명이 앞에 오고, 실제 본문에 있는 것만 적는다. */
export function pageTitle(c: CountryRecord, lang: SupportedLanguage): string {
  return lang === "ko"
    ? `${c.nameKo}은 어떤 나라? 수도·인구·지도·이웃 나라 | 나라콕`
    : `${c.nameEn} for Kids: Map, Capital, Population & Neighbours | NARAKOK`;
}

/**
 * 페이지 description (§5.2).
 * ⚠️ 모든 나라에 같은 문장을 두고 국가명만 갈아끼우지 않는다.
 *    수도·대륙·이웃 수·인구가 나라마다 달라 실제로 고유한 문장이 나온다.
 */
export function pageDescription(c: CountryRecord, all: CountryRecord[], lang: SupportedLanguage): string {
  const pop = formatMetric(c.population, lang);
  const n = (c.borderCountryIso3 ?? []).length;

  if (lang === "ko") {
    const parts = [`${c.nameKo}${josa(c.nameKo, "은는")} ${c.continentKo}에 있는 나라예요.`];
    if (c.capitalKo) parts.push(`수도는 ${c.capitalKo},`);
    if (!pop.missing) parts.push(`인구는 ${pop.display}이에요.`);
    parts.push(n === 0
      ? "육지로 맞닿은 이웃 나라는 없어요."
      : `이웃 나라는 ${n}개국이에요.`);
    parts.push("지도에서 위치를 확인하고 다른 나라와 비교해 보세요.");
    return parts.join(" ").replace(/\s+/g, " ");
  }

  const parts = [`${c.nameEn} is a country in ${c.continentEn}.`];
  if (c.capitalEn) parts.push(`Its capital is ${c.capitalEn}.`);
  if (!pop.missing) parts.push(`Population: ${pop.display}.`);
  parts.push(n === 0 ? "It has no land neighbours." : `It borders ${n} ${n === 1 ? "country" : "countries"}.`);
  parts.push("See it on the map and compare it with other countries.");
  return parts.join(" ");
}
