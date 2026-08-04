// 대륙·랭킹·호기심 페이지 구조화 데이터 (지시서 10 §8.1 · §8.3 · §8.4).

import { absolute, worldMapHubPath, type Locale } from "@/lib/worldmap/seoRoutes";

export interface TaxonomyJsonLdProps {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  sectionName: string;
  generatedAt: string;
  /**
   * 랭킹처럼 실제로 데이터셋을 보여주는 페이지에만 준다.
   * ⚠️ Dataset 을 아무 페이지에나 붙이지 않는다. 정식 dataset landing page 에만 쓴다(§8.3).
   */
  dataset?: { sourceName: string; sourceUrl: string; unit: string; variable: string };
}

export default function TaxonomyJsonLd(
  { locale, path, name, description, sectionName, generatedAt, dataset }: TaxonomyJsonLdProps,
) {
  const url = absolute(path);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": url,
      url,
      name,
      description,
      inLanguage: locale === "ko" ? "ko-KR" : "en",
      dateModified: generatedAt,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: locale === "ko" ? "나라콕" : "NARAKOK", item: absolute(worldMapHubPath(locale)) },
        { "@type": "ListItem", position: 2, name: sectionName },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  ];

  if (dataset) {
    graph.push({
      "@type": "Dataset",
      name,
      description,
      url,
      inLanguage: locale === "ko" ? "ko-KR" : "en",
      version: generatedAt,
      dateModified: generatedAt,
      // 195개국 전체가 대상이지만 값이 있는 나라만 순위에 든다 — 그 사실은 본문에 적혀 있다.
      spatialCoverage: { "@type": "Place", name: locale === "ko" ? "전 세계" : "World" },
      variableMeasured: { "@type": "PropertyValue", name: dataset.variable, unitText: dataset.unit },
      creator: { "@type": "Organization", name: dataset.sourceName, url: dataset.sourceUrl },
      publisher: { "@type": "Organization", name: "illo", url: "https://illo.im" },
      isBasedOn: dataset.sourceUrl,
    });
  }

  return (
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }} />
  );
}
