// 전체 국가 목록 (지시서 10 §3.1 · §6.1).
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
  title: "세계 195개국 목록 — 대륙별 나라와 수도 | 나라콕",
  description:
    "나라콕이 다루는 195개국을 대륙별로 모았어요. 나라를 누르면 수도·인구·면적·이웃 나라와 지도 위치를 볼 수 있어요.",
  alternates: {
    canonical: absolute(countriesIndexPath("ko")),
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
      <BreadcrumbNav locale="ko" crumbs={simpleCrumbs("ko", "나라 목록", countriesIndexPath("ko"))} />
      <article className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2e2a26]">
          세계 195개국 목록
        </h1>
        <p className="mt-3 leading-relaxed text-[#4a423c]">
          나라콕은 유엔 회원국 193개국과 옵서버 2개국, 모두 195개국을 같은 기준으로 다뤄요.
          나라 이름을 누르면 수도·인구·면적·이웃 나라와 지도 위치를 볼 수 있어요.
        </p>

        {CONTINENTS.map((code: ContinentCode) => {
          const list = countries
            .filter((c) => c.continentCode === code)
            .sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
          if (list.length === 0) return null;
          return (
            <section key={code} className="mt-8">
              <h2 className="text-xl font-bold text-[#2e2a26]">
                <Link href={continentPath("ko", CONTINENT_SLUG[code])} className="underline underline-offset-4">
                  {list[0].continentKo}
                </Link>
                <span className="ml-2 text-sm font-normal text-[#8a807a]">{list.length}개국</span>
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((c) => (
                  <li key={c.iso3}>
                    <Link href={countryPath("ko", routes.get(c.iso3)!.slug)}
                      className="flex items-center gap-2 rounded-lg border border-[#eee7e0] px-3 py-2 text-sm hover:bg-[#fff7f2]">
                      {c.flagUrl && <img src={c.flagUrl} alt="" aria-hidden width={20} height={15} loading="lazy" className="rounded-[2px]" />}
                      <span className="truncate">{c.nameKo}</span>
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
