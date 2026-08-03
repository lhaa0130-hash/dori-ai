// 어린이용 국가 설명 (후속 지시서 §7).
//
// 생성형 AI 문장을 쓰지 않는다. 가지고 있는 데이터만으로 정해진 틀에 맞춰 조립한다.
// 없는 절은 자연스럽게 생략하고, **특정 국가(특히 대한민국)와 자동 비교하지 않는다.**
// 나라끼리의 비교는 사용자가 비교 모드에서 직접 고른 경우에만 보여준다.

import type { CountryRecord, SupportedLanguage } from "./types";
import { withJosa, joinWithJosa } from "./korean";

/** 사람 수를 아이가 읽기 쉬운 단위로. 1,000명 미만은 그대로 쓴다. */
function peopleKo(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(1).replace(/\.0$/, "")}억`;
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString("ko-KR")}만`;
  return n.toLocaleString("ko-KR");
}

function peopleEn(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")} billion`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")} million`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} thousand`;
  return String(n);
}

const MAX_NEIGHBOURS = 3;

/**
 * 최대 3문장.
 *   1) 대륙·하위 지역   2) 수도·인구   3) 이웃 나라 또는 섬나라·내륙국
 * 재료가 없는 문장은 통째로 빠진다.
 */
export function buildChildSummary(
  country: CountryRecord,
  lang: SupportedLanguage,
  nameOf: (iso3: string) => string | null,
): string[] {
  const sentences: string[] = [];
  const name = lang === "ko" ? country.nameKo : country.nameEn;
  const continent = lang === "ko" ? country.continentKo : country.continentEn;
  const subregion = lang === "ko" ? country.subregionKo : country.subregionEn;
  const capital = lang === "ko" ? country.capitalKo : country.capitalEn;
  const population = country.population.s === "ok" ? country.population.v : null;

  // ── 1) 어디 대륙에 있는 나라인가
  if (continent) {
    if (lang === "ko") {
      const where = subregion && subregion !== continent ? `${continent}의 ${subregion}에` : `${continent}에`;
      sentences.push(`${withJosa(name, "은는")} ${where} 있는 나라예요.`);
    } else {
      const where = subregion && subregion !== continent ? `${subregion}, ${continent}` : continent;
      sentences.push(`${name} is a country in ${where}.`);
    }
  }

  // ── 2) 수도와 인구
  if (capital || population != null) {
    if (lang === "ko") {
      const parts: string[] = [];
      if (capital) parts.push(`수도는 ${capital}이고`);
      if (population != null) parts.push(`약 ${peopleKo(population)} 명이 살고 있어요`);
      // 수도만 있으면 '~이고' 로 끝나 어색하다. 어미를 맞춘다.
      sentences.push(parts.length === 1 && capital && population == null
        ? `수도는 ${withJosa(capital, "이에요예요")}.`
        : `${parts.join(", ")}.`);
    } else {
      const parts: string[] = [];
      if (capital) parts.push(`Its capital is ${capital}`);
      if (population != null) parts.push(`about ${peopleEn(population)} people live here`);
      sentences.push(`${parts.join(" and ")}.`);
    }
  }

  // ── 3) 이웃 나라 / 섬나라 / 내륙국
  const neighbourNames = country.borderCountryIso3
    .map(nameOf)
    .filter((n): n is string => Boolean(n));

  if (neighbourNames.length > 0) {
    const shown = neighbourNames.slice(0, MAX_NEIGHBOURS);
    const more = neighbourNames.length > shown.length;
    if (lang === "ko") {
      // 받침에 따라 '과/와' 가 달라진다. "북한와" 같은 오류를 막으려면 직접 이어 붙이지 않는다.
      const joined = joinWithJosa(neighbourNames, "과와", { max: MAX_NEIGHBOURS });
      sentences.push(
        country.landlocked
          ? `${shown.join(", ")}${more ? " 등" : ""} 여러 나라에 둘러싸인 내륙국이에요.`
          : `${joined} 국경을 맞대고 있어요.`,
      );
    } else {
      const list = shown.join(", ");
      sentences.push(
        country.landlocked
          ? `It is landlocked, surrounded by ${list}${more ? " and others" : ""}.`
          : `It shares land borders with ${list}${more ? " and others" : ""}.`,
      );
    }
  } else if (country.islandCountry) {
    sentences.push(
      lang === "ko"
        ? "바다로 둘러싸여 있어서 다른 나라와 땅으로 이어져 있지 않아요."
        : "It is surrounded by the sea and has no land borders.",
    );
  }

  return sentences;
}

/** 대륙 > 하위 지역 > 국가 breadcrumb. 없는 단계는 빠진다. */
export function buildBreadcrumb(country: CountryRecord, lang: SupportedLanguage): string[] {
  const continent = lang === "ko" ? country.continentKo : country.continentEn;
  const subregion = lang === "ko" ? country.subregionKo : country.subregionEn;
  const name = lang === "ko" ? country.nameKo : country.nameEn;
  return [continent, subregion !== continent ? subregion : null, name].filter((v): v is string => Boolean(v));
}
