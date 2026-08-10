// 랭킹 페이지 (KO) — 지시서 10 §12.2
//
// ⚠️ 서버 컴포넌트다. 본문이 server HTML 에 있어야 검색엔진과 JS 가 꺼진 사용자에게
//    내용이 보인다. 지도는 별도 클라이언트 컴포넌트이고, 지도가 없어도 이 페이지는 성립한다.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCountryDataset } from "@/lib/worldmap/server";
import { RANKING_METRICS } from "@/lib/worldmap/ranking";
import { metricSlug, rankingPath, absolute, type Locale } from "@/lib/worldmap/seoRoutes";
import { RankingArticle } from "@/components/worldmap/TaxonomyPages";
import { BreadcrumbNav, simpleCrumbs } from "@/components/worldmap/WorldMapBreadcrumb";
import TaxonomyJsonLd from "@/components/worldmap/TaxonomyJsonLd";

export const dynamic = "force-static";
const LOCALE: Locale = "ko";

export function generateStaticParams() {
  return RANKING_METRICS.map((m) => ({ metric: metricSlug(m.metricId) }));
}

const bySlug = (slug: string) => RANKING_METRICS.find((m) => metricSlug(m.metricId) === slug);

export function generateMetadata({ params }: { params: { metric: string } }): Metadata {
  const m = bySlug(params.metric);
  if (!m) return {};
  const koUrl = rankingPath("ko", params.metric);
  const enUrl = rankingPath("en", params.metric);
  const self = LOCALE === "ko" ? koUrl : enUrl;
  return {
    title: LOCALE === "ko"
      ? `${m.questionKo} — ${m.koLabel} 순위 TOP 10 | 나라콕`
      : `${m.questionEn} — ${m.enLabel} Top 10 | NARAKOK`,
    description: LOCALE === "ko"
      ? `${m.koDescription} 자료가 있는 나라만 순위를 매기고 기준연도와 출처를 함께 보여줘요.`
      : `${m.enDescription} Only countries with data are ranked, with the reference year and source shown.`,
    alternates: {
      canonical: absolute(self),
      languages: { "ko-KR": absolute(koUrl), en: absolute(enUrl), "x-default": absolute(koUrl) },
    },
    robots: { index: true, follow: true },
  };
}

export default function Page({ params }: { params: { metric: string } }) {
  const m = bySlug(params.metric);
  if (!m) notFound();
  const { countries, generatedAt } = loadCountryDataset();
  const name = LOCALE === "ko" ? m.koLabel : m.enLabel;
  return (
    <>
      <TaxonomyJsonLd
        locale={LOCALE}
        path={rankingPath(LOCALE, params.metric)}
        name={LOCALE === "ko" ? m.questionKo : m.questionEn}
        description={LOCALE === "ko" ? m.koDescription : m.enDescription}
        sectionName={LOCALE === "ko" ? "세계 랭킹" : "World rankings"}
        generatedAt={generatedAt}
        dataset={{ sourceName: m.sourceName, sourceUrl: m.sourceUrl, unit: m.unit, variable: name }}
      />
      <BreadcrumbNav locale={LOCALE}
        crumbs={simpleCrumbs(LOCALE, LOCALE === "ko" ? "세계 랭킹" : "World rankings", rankingPath(LOCALE, params.metric), name)} />
      <RankingArticle metric={m} all={countries} locale={LOCALE} />
    </>
  );
}
