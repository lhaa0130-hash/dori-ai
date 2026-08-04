// 화면에 보이는 breadcrumb (지시서 10 §8.4).
//
// ⚠️ JSON-LD BreadcrumbList 와 이 화면 표시는 반드시 같아야 한다.
//    구조화 데이터에만 있고 화면에 없는 breadcrumb 는 만들지 않는다.

import Link from "next/link";
import type { CountryRecord } from "@/lib/worldmap/types";
import {
  CONTINENT_SLUG, continentPath, countriesIndexPath, worldMapHubPath, type Locale,
} from "@/lib/worldmap/seoRoutes";

export interface Crumb { name: string; href?: string }

export function countryCrumbs(locale: Locale, country: CountryRecord): Crumb[] {
  return [
    { name: locale === "ko" ? "나라콕" : "NARAKOK", href: worldMapHubPath(locale) },
    {
      name: locale === "ko" ? country.continentKo : country.continentEn,
      href: continentPath(locale, CONTINENT_SLUG[country.continentCode]),
    },
    { name: locale === "ko" ? country.nameKo : country.nameEn },
  ];
}

export function simpleCrumbs(locale: Locale, sectionName: string, sectionHref: string, leaf?: string): Crumb[] {
  const out: Crumb[] = [
    { name: locale === "ko" ? "나라콕" : "NARAKOK", href: worldMapHubPath(locale) },
    { name: sectionName, href: leaf ? sectionHref : undefined },
  ];
  if (leaf) out.push({ name: leaf });
  return out;
}

export function BreadcrumbNav({ crumbs, locale }: { crumbs: Crumb[]; locale: Locale }) {
  return (
    <nav aria-label={locale === "ko" ? "현재 위치" : "Breadcrumb"}
      className="mx-auto w-full max-w-3xl px-4 pt-6 text-sm text-[#8a807a]">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>›</span>}
            {c.href ? (
              <Link href={c.href} className="underline underline-offset-2 hover:text-[#4a423c]">{c.name}</Link>
            ) : (
              <span className="text-[#4a423c]" aria-current="page">{c.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function WorldMapBreadcrumb(
  { locale, country, slug }: { locale: Locale; country: CountryRecord; slug: string },
) {
  void slug;
  void countriesIndexPath;
  return <BreadcrumbNav crumbs={countryCrumbs(locale, country)} locale={locale} />;
}
