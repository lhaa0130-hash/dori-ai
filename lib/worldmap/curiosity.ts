// 호기심 모음 (지시서 08 §3.2 · §6).
//
// 모든 주제를 1위부터 195위까지 줄 세우지 않는다. `섬나라` 나 `적도가 지나는 나라` 는
// 크고 작음이 아니라 맞다/아니다의 문제라서, 순위 숫자를 붙이면 없는 서열을 만든다.
// 여기 있는 항목에는 순위를 붙이지 않고 "해당 국가 N개" 와 지도 하이라이트로 보여준다.
//
// 판정은 전부 이미 검증된 국가 데이터에서 나온다. 근거를 댈 수 없는 분류는 넣지 않는다.

import type { CountryRecord, SupportedLanguage } from "./types";

export type CuriosityId =
  | "island" | "landlocked" | "equator"
  | "single-neighbour" | "double-landlocked" | "multilingual"
  | "capital-equals-country" | "many-timezones" | "shared-currency";

export interface CuriosityCollection {
  id: CuriosityId;
  titleKo: string;
  titleEn: string;
  /** 무엇을 모았는지 한 문장. 판정 기준을 숨기지 않는다(§6.2). */
  ruleKo: string;
  ruleEn: string;
  /** 애매할 수 있는 분류에는 한계를 밝힌다. */
  caveatKo?: string;
  match: (c: CountryRecord, all: CountryRecord[]) => boolean;
}

/** 같은 통화 코드를 두 나라 이상이 쓰는지 — 유로·CFA 프랑처럼. */
function sharesCurrency(c: CountryRecord, all: CountryRecord[]): boolean {
  const mine = new Set((c.currencies ?? []).map((x) => x.code));
  if (mine.size === 0) return false;
  return all.some((o) => o.iso3 !== c.iso3 && (o.currencies ?? []).some((x) => mine.has(x.code)));
}

export const CURIOSITY_COLLECTIONS: CuriosityCollection[] = [
  {
    id: "island",
    titleKo: "바다에 둘러싸인 섬나라", titleEn: "Island countries",
    ruleKo: "육지로 맞닿은 이웃 나라가 하나도 없는 나라예요.",
    ruleEn: "Countries with no land border with any other country.",
    match: (c) => c.islandCountry,
  },
  {
    id: "landlocked",
    titleKo: "바다가 없는 내륙국", titleEn: "Landlocked countries",
    ruleKo: "바다와 맞닿은 곳이 없는 나라예요.",
    ruleEn: "Countries with no coastline.",
    match: (c) => c.landlocked,
  },
  {
    id: "equator",
    titleKo: "적도가 지나가는 나라", titleEn: "Countries on the equator",
    // '북반구·남반구 양쪽에 걸친 나라' 는 이것과 정확히 같은 집합이다.
    // 이름만 바꿔 두 개로 나누면 목록이 똑같은데 개수만 늘어난다.
    ruleKo: "나라의 땅이 적도(위도 0°) 위아래에 걸쳐 있는 나라예요. 북반구와 남반구 양쪽에 걸쳐 있다는 뜻이에요.",
    ruleEn: "Countries whose territory spans latitude 0°.",
    // ⚠️ 본토 경계 상자로만 판정한다. 멀리 흩어진 섬까지 세지 않으므로
    //    적도 근처 섬을 가진 나라가 빠질 수 있다.
    caveatKo: "본토를 기준으로 판정했어요. 멀리 떨어진 섬은 계산에 넣지 않았어요.",
    match: (c) => c.bbox[1] < 0 && c.bbox[3] > 0,
  },
  {
    id: "single-neighbour",
    titleKo: "이웃 나라가 딱 하나인 나라", titleEn: "Countries with exactly one neighbour",
    ruleKo: "육지로 맞닿은 나라가 정확히 1개인 나라예요.",
    ruleEn: "Countries sharing a land border with exactly one other country.",
    match: (c) => (c.borderCountryIso3 ?? []).length === 1,
  },
  {
    id: "double-landlocked",
    titleKo: "두 겹 내륙국", titleEn: "Doubly landlocked countries",
    ruleKo: "바다가 없는 나라인데, 이웃 나라도 전부 바다가 없는 나라예요. 바다에 가려면 나라를 두 번 지나야 해요.",
    ruleEn: "Landlocked countries whose every neighbour is also landlocked.",
    match: (c, all) => {
      if (!c.landlocked) return false;
      const neighbours = (c.borderCountryIso3 ?? [])
        .map((iso) => all.find((o) => o.iso3 === iso))
        .filter((x): x is CountryRecord => !!x);
      // 이웃 정보가 없으면 판정하지 않는다. 모른다는 것과 '전부 내륙국' 은 다르다.
      return neighbours.length > 0 && neighbours.every((n) => n.landlocked);
    },
  },
  {
    id: "multilingual",
    titleKo: "공식 언어가 둘 이상인 나라", titleEn: "Countries with two or more official languages",
    ruleKo: "나라에서 공식으로 쓰는 언어가 2개 이상인 나라예요.",
    ruleEn: "Countries with at least two official languages.",
    match: (c) => (c.languages ?? []).length >= 2,
  },
  {
    id: "many-timezones",
    titleKo: "시간대가 여러 개인 나라", titleEn: "Countries with multiple time zones",
    ruleKo: "나라 안에서 쓰는 시간대가 2개 이상인 나라예요.",
    ruleEn: "Countries using two or more time zones.",
    match: (c) => new Set((c.timezones ?? []).filter((z) => z.includes("/"))).size >= 2,
  },
  {
    id: "shared-currency",
    titleKo: "다른 나라와 통화를 함께 쓰는 나라", titleEn: "Countries sharing a currency",
    ruleKo: "같은 돈을 쓰는 다른 나라가 있는 나라예요. 유로처럼요.",
    ruleEn: "Countries whose currency is also used by at least one other country.",
    match: (c, all) => sharesCurrency(c, all),
  },
  {
    id: "capital-equals-country",
    titleKo: "수도와 나라 이름이 같은 나라", titleEn: "Countries whose capital shares its name",
    ruleKo: "수도 이름과 나라 이름이 같은 나라예요.",
    ruleEn: "Countries where the capital city has the same name as the country.",
    match: (c) =>
      (!!c.capitalKo && c.capitalKo === c.nameKo) || (!!c.capitalEn && c.capitalEn === c.nameEn),
  },
];

export const CURIOSITY_BY_ID = new Map(CURIOSITY_COLLECTIONS.map((x) => [x.id, x]));

export interface CuriosityResult {
  collection: CuriosityCollection;
  /** 해당하는 나라들. 순위 번호는 붙이지 않는다 — 국가명 순으로만 정렬한다. */
  countries: CountryRecord[];
  total: number;
}

export function buildCuriosity(
  all: CountryRecord[],
  id: CuriosityId,
  lang: SupportedLanguage = "ko",
): CuriosityResult | null {
  const collection = CURIOSITY_BY_ID.get(id);
  if (!collection) return null;
  const countries = all
    .filter((c) => collection.match(c, all))
    .sort((a, b) =>
      lang === "ko" ? a.nameKo.localeCompare(b.nameKo, "ko") : a.nameEn.localeCompare(b.nameEn, "en"));
  return { collection, countries, total: countries.length };
}
