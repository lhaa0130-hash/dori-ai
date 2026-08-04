// 전체 국가 목록 — 영문 (지시서 10 §3.1 · §6.1 · §7).
//
// 지금까지 국가로 가는 길은 지도 클릭(button)뿐이었다. crawler 는 button 을 누르지
// 못하므로 195개국이 link graph 에서 보이지 않았다. 이 페이지가 그 입구다.

import type { Metadata } from "next";
import Link from "next/link";
import { loadCountryDataset } from "@/lib/worldmap/server";
import {
  buildCountryRoutes, countryPath, countriesIndexPath, continentPath,
  CONTINENT_SLUG, absolute,
} from "@/lib/worldmap/seoRoutes";
import { BreadcrumbNav, simpleCrumbs } from "@/components/worldmap/WorldMapBreadcrumb";
import { CONTINENTS, type ContinentCode } from "@/lib/worldmap/types";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "All 195 Countries by Continent: Capitals & Maps | NARAKOK",
  description:
    "Every one of the 195 countries NARAKOK covers, grouped by continent. Tap a country for its capital, population, area, neighbours and map location.",
  alternates: {
    canonical: absolute(countriesIndexPath("en")),
    languages: {
      "ko-KR": absolute(countriesIndexPath("ko")),
      en: absolute(countriesIndexPath("en")),
      "x-default": absolute(countriesIndexPath("ko")),
    },
  },
  robots: { index: true, follow: true },
};

export default function CountriesIndexPage() {
  const { countries } = loadCountryDataset();
  const routes = new Map(buildCountryRoutes(countries).map((r) => [r.iso3, r]));

  return (
    <>
      <BreadcrumbNav locale="en" crumbs={simpleCrumbs("en", "Countries", countriesIndexPath("en"))} />
      <article className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2e2a26]">
          All 195 countries
        </h1>
        <p className="mt-3 leading-relaxed text-[#4a423c]">
          NARAKOK covers 193 UN member states and 2 observer states — 195 countries, all on the
          same data contract. Tap a country to see its capital, population, area, neighbours and map location.
        </p>

        {CONTINENTS.map((code: ContinentCode) => {
          const list = countries
            .filter((c) => c.continentCode === code)
            .sort((a, b) => a.nameEn.localeCompare(b.nameEn, "en"));
          if (list.length === 0) return null;
          return (
            <section key={code} className="mt-8">
              <h2 className="text-xl font-bold text-[#2e2a26]">
                <Link href={continentPath("en", CONTINENT_SLUG[code])} className="underline underline-offset-4">
                  {list[0].continentEn}
                </Link>
                <span className="ml-2 text-sm font-normal text-[#8a807a]">{list.length} countries</span>
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((c) => (
                  <li key={c.iso3}>
                    <Link href={countryPath("en", routes.get(c.iso3)!.slug)}
                      className="flex items-center gap-2 rounded-lg border border-[#eee7e0] px-3 py-2 text-sm hover:bg-[#fff7f2]">
                      {c.flagUrl && <img src={c.flagUrl} alt="" aria-hidden width={20} height={15} loading="lazy" className="rounded-[2px]" />}
                      <span className="truncate">{c.nameEn}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </article>
    </>
  );
}
