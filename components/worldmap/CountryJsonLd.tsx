// 국가 페이지 구조화 데이터 (지시서 10 §8).
//
// ⚠️ JSON-LD 는 화면에 실제로 보이는 내용과 같아야 한다. 화면에 없는 값을
//    구조화 데이터에만 넣지 않는다. 값이 없으면 필드를 통째로 뺀다 — 빈 문자열이나
//    추정치를 넣으면 잘못된 정보를 기계가 읽는다.

import type { CountryRecord } from "@/lib/worldmap/types";
import { countryPath, continentPath, worldMapHubPath, CONTINENT_SLUG, absolute, type Locale } from "@/lib/worldmap/seoRoutes";
import { pageTitle, pageDescription } from "@/lib/worldmap/countryPage";

export interface CountryJsonLdProps {
  country: CountryRecord;
  all: CountryRecord[];
  locale: Locale;
  slug: string;
  generatedAt: string;
}

export default function CountryJsonLd({ country: c, all, locale, slug, generatedAt }: CountryJsonLdProps) {
  const url = absolute(countryPath(locale, slug));
  const name = locale === "ko" ? c.nameKo : c.nameEn;

  const place: Record<string, unknown> = {
    "@type": "Country",
    name,
    alternateName: locale === "ko" ? c.nameEn : c.nameKo,
    url,
    identifier: c.iso3,
    containedInPlace: {
      "@type": "Place",
      name: locale === "ko" ? c.continentKo : c.continentEn,
      url: absolute(continentPath(locale, CONTINENT_SLUG[c.continentCode])),
    },
  };
  // 좌표는 실제 값이 있을 때만 넣는다.
  if (Array.isArray(c.center)) {
    place.geo = { "@type": "GeoCoordinates", latitude: c.center[1], longitude: c.center[0] };
  }

  const graph = [
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name: pageTitle(c, locale),
      description: pageDescription(c, all, locale),
      inLanguage: locale === "ko" ? "ko-KR" : "en",
      // 실제 데이터 스냅샷 생성일. 배포할 때마다 오늘로 갱신하지 않는다.
      dateModified: generatedAt,
      mainEntity: place,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: locale === "ko" ? "나라콕" : "NARAKOK", item: absolute(worldMapHubPath(locale)) },
        {
          "@type": "ListItem", position: 2,
          name: locale === "ko" ? c.continentKo : c.continentEn,
          item: absolute(continentPath(locale, CONTINENT_SLUG[c.continentCode])),
        },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      // 구조화 데이터는 사용자 입력이 아니라 우리가 만든 데이터라 그대로 직렬화한다.
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
