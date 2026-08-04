// 대륙 페이지 (EN) — 지시서 10 §12.3
//
// ⚠️ 서버 컴포넌트다. 본문이 server HTML 에 있어야 검색엔진과 JS 가 꺼진 사용자에게
//    내용이 보인다. 지도는 별도 클라이언트 컴포넌트이고, 지도가 없어도 이 페이지는 성립한다.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCountryDataset } from "@/lib/worldmap/server";
import { CONTINENT_SLUG, CONTINENT_BY_SLUG, continentPath, absolute, type Locale } from "@/lib/worldmap/seoRoutes";
import { ContinentArticle } from "@/components/worldmap/TaxonomyPages";
import { BreadcrumbNav, simpleCrumbs } from "@/components/worldmap/WorldMapBreadcrumb";
import TaxonomyJsonLd from "@/components/worldmap/TaxonomyJsonLd";

export const dynamic = "force-static";
const LOCALE: Locale = "en";

export function generateStaticParams() {
  return Object.values(CONTINENT_SLUG).map((slug) => ({ slug }));
}

function pick(slug: string) {
  const code = CONTINENT_BY_SLUG.get(slug);
  if (!code) return null;
  const { countries, generatedAt } = loadCountryDataset();
  const list = countries.filter((c) => c.continentCode === code);
  if (list.length === 0) return null;
  return { code, list, generatedAt, nameKo: list[0].continentKo, nameEn: list[0].continentEn };
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const found = pick(params.slug);
  if (!found) return {};
  const name = LOCALE === "ko" ? found.nameKo : found.nameEn;
  const koUrl = continentPath("ko", params.slug);
  const enUrl = continentPath("en", params.slug);
  const self = LOCALE === "ko" ? koUrl : enUrl;
  return {
    title: LOCALE === "ko"
      ? `${name} 국가 목록과 지도 — 수도·인구 비교 | 나라콕`
      : `Countries in ${name}: Map, Capitals & Population | NARAKOK`,
    description: LOCALE === "ko"
      ? `${name}에 있는 ${found.list.length}개국을 한눈에 봐요. 나라마다 수도·인구·면적·이웃 나라를 확인하고 지도에서 위치를 찾아보세요.`
      : `All ${found.list.length} countries in ${name}. Check each country's capital, population, area and neighbours, and find them on the map.`,
    alternates: {
      canonical: absolute(self),
      languages: { "ko-KR": absolute(koUrl), en: absolute(enUrl), "x-default": absolute(koUrl) },
    },
    robots: { index: true, follow: true },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const found = pick(params.slug);
  if (!found) notFound();
  const name = LOCALE === "ko" ? found.nameKo : found.nameEn;
  return (
    <>
      <TaxonomyJsonLd
        locale={LOCALE}
        path={continentPath(LOCALE, params.slug)}
        name={name}
        description={LOCALE === "ko" ? `${name}의 국가 목록` : `Countries in ${name}`}
        sectionName={LOCALE === "ko" ? "대륙" : "Continents"}
        generatedAt={found.generatedAt}
      />
      <BreadcrumbNav locale={LOCALE}
        crumbs={simpleCrumbs(LOCALE, LOCALE === "ko" ? "대륙" : "Continents", continentPath(LOCALE, params.slug), name)} />
      <ContinentArticle code={found.code} nameKo={found.nameKo} nameEn={found.nameEn}
        countries={found.list} locale={LOCALE} />
    </>
  );
}
