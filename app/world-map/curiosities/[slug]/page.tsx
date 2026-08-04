// 호기심 모음 페이지 (KO) — 지시서 10 §12.4
//
// ⚠️ 서버 컴포넌트다. 본문이 server HTML 에 있어야 검색엔진과 JS 가 꺼진 사용자에게
//    내용이 보인다. 지도는 별도 클라이언트 컴포넌트이고, 지도가 없어도 이 페이지는 성립한다.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadCountryDataset } from "@/lib/worldmap/server";
import { buildCuriosity, CURIOSITY_COLLECTIONS, type CuriosityId } from "@/lib/worldmap/curiosity";
import { CURIOSITY_SLUG, CURIOSITY_BY_SLUG, curiosityPath, absolute, type Locale } from "@/lib/worldmap/seoRoutes";
import { CuriosityArticle } from "@/components/worldmap/TaxonomyPages";
import { BreadcrumbNav, simpleCrumbs } from "@/components/worldmap/WorldMapBreadcrumb";
import TaxonomyJsonLd from "@/components/worldmap/TaxonomyJsonLd";

export const dynamic = "force-static";
const LOCALE: Locale = "ko";

export function generateStaticParams() {
  return CURIOSITY_COLLECTIONS.map((c) => ({ slug: CURIOSITY_SLUG[c.id] }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const id = CURIOSITY_BY_SLUG.get(params.slug) as CuriosityId | undefined;
  if (!id) return {};
  const { countries } = loadCountryDataset();
  const r = buildCuriosity(countries, id, LOCALE);
  if (!r) return {};
  const koUrl = curiosityPath("ko", params.slug);
  const enUrl = curiosityPath("en", params.slug);
  const self = LOCALE === "ko" ? koUrl : enUrl;
  return {
    title: LOCALE === "ko"
      ? `${r.collection.titleKo} ${r.total}개국 — 지도와 목록 | 나라콕`
      : `${r.collection.titleEn}: ${r.total} countries with map | NARAKOK`,
    description: LOCALE === "ko"
      ? `${r.collection.ruleKo} 나라콕이 다루는 195개국 가운데 ${r.total}개국이 해당해요.`
      : `${r.collection.ruleEn} ${r.total} of the 195 countries NARAKOK covers belong here.`,
    alternates: {
      canonical: absolute(self),
      languages: { "ko-KR": absolute(koUrl), en: absolute(enUrl), "x-default": absolute(koUrl) },
    },
    robots: { index: true, follow: true },
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  const id = CURIOSITY_BY_SLUG.get(params.slug) as CuriosityId | undefined;
  if (!id) notFound();
  const { countries, generatedAt } = loadCountryDataset();
  const r = buildCuriosity(countries, id, LOCALE);
  if (!r) notFound();
  const name = LOCALE === "ko" ? r.collection.titleKo : r.collection.titleEn;
  return (
    <>
      <TaxonomyJsonLd
        locale={LOCALE}
        path={curiosityPath(LOCALE, params.slug)}
        name={name}
        description={LOCALE === "ko" ? r.collection.ruleKo : r.collection.ruleEn}
        sectionName={LOCALE === "ko" ? "호기심 모음" : "Curiosities"}
        generatedAt={generatedAt}
      />
      <BreadcrumbNav locale={LOCALE}
        crumbs={simpleCrumbs(LOCALE, LOCALE === "ko" ? "호기심 모음" : "Curiosities", curiosityPath(LOCALE, params.slug), name)} />
      <CuriosityArticle result={r} locale={LOCALE} />
    </>
  );
}
