// 국가별 색인 가능 페이지 (지시서 10 §3.1 · §4).
//
// 지금까지 `?country=KOR` 은 검색엔진에게 허브와 같은 문서였다. 이제 나라마다
// 고유한 title·description·H1·canonical·본문·내부 링크를 가진 진짜 주소가 생긴다.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCountryDataset } from "@/lib/worldmap/server";
import { buildCountryRoutes, countryPath, absolute } from "@/lib/worldmap/seoRoutes";
import { pageTitle, pageDescription } from "@/lib/worldmap/countryPage";
import CountryArticle from "@/components/worldmap/CountryArticle";
import CountryJsonLd from "@/components/worldmap/CountryJsonLd";
import WorldMapBreadcrumb from "@/components/worldmap/WorldMapBreadcrumb";

export const dynamic = "force-static";

function routes() {
  return buildCountryRoutes(loadCountryDataset().countries);
}

export function generateStaticParams() {
  return routes().map((r) => ({ slug: r.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const { countries } = loadCountryDataset();
  const route = routes().find((r) => r.slug === params.slug);
  const country = route && countries.find((c) => c.iso3 === route.iso3);
  if (!route || !country) return {};

  const koUrl = countryPath("ko", route.slug);
  const enUrl = countryPath("en", route.slug);

  return {
    title: pageTitle(country, "ko"),
    description: pageDescription(country, countries, "ko"),
    alternates: {
      canonical: absolute(koUrl),
      languages: { "ko-KR": absolute(koUrl), en: absolute(enUrl), "x-default": absolute(koUrl) },
    },
    // ⚠️ 품질 gate 를 통과하지 못한 나라는 페이지는 있되 색인하지 않는다(§4.3).
    //    follow 는 남겨서 내부 링크는 따라가게 한다.
    robots: route.indexableKo ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "article",
      title: pageTitle(country, "ko"),
      description: pageDescription(country, countries, "ko"),
      url: absolute(koUrl),
      locale: "ko_KR",
    },
  };
}

export default function CountryPage({ params }: { params: { slug: string } }) {
  const dataset = loadCountryDataset();
  const route = routes().find((r) => r.slug === params.slug);
  const country = route && dataset.countries.find((c) => c.iso3 === route.iso3);
  // 없는 slug 는 허브로 보내지 않고 진짜 404 를 낸다(§9.2).
  if (!route || !country) notFound();

  return (
    <>
      <CountryJsonLd country={country} all={dataset.countries} locale="ko" slug={route.slug}
        generatedAt={dataset.generatedAt} />
      <WorldMapBreadcrumb locale="ko" country={country} slug={route.slug} />
      <CountryArticle country={country} all={dataset.countries} locale="ko"
        generatedAt={dataset.generatedAt} />
    </>
  );
}
