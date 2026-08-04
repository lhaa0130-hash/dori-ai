// 대륙 · 랭킹 · 호기심 모음 페이지 본문 (지시서 10 §12.2 ~ §12.4).
//
// 세 페이지 모두 같은 계약을 지킨다:
//   · 서버 HTML 에 본문이 있다 (지도 canvas 안에만 있는 정보는 본문이 아니다)
//   · 국가 이름은 전부 진짜 <a href> 다 (crawler 가 따라갈 수 있어야 한다)
//   · 숫자 옆에 기준연도와 출처가 있다
//   · 순위가 어울리지 않는 주제에는 순위 숫자를 붙이지 않는다

import Link from "next/link";
import type { ContinentCode, CountryRecord, SupportedLanguage } from "@/lib/worldmap/types";
import { countryPath, countrySlug, type Locale } from "@/lib/worldmap/seoRoutes";
import { buildRanking, type RankingMetric } from "@/lib/worldmap/ranking";
import { formatMetric } from "@/lib/worldmap/format";
import { formatYear } from "@/lib/worldmap/display";
import type { CuriosityResult } from "@/lib/worldmap/curiosity";

function CountryLinkList({ countries, locale }: { countries: CountryRecord[]; locale: Locale }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {countries.map((c) => (
        <li key={c.iso3}>
          <Link href={countryPath(locale, countrySlug(c))}
            className="flex items-center gap-2 rounded-lg border border-[#eee7e0] px-3 py-2 text-sm hover:bg-[#fff7f2]">
            {c.flagUrl && (
              <img src={c.flagUrl} alt="" aria-hidden width={20} height={15} loading="lazy" className="rounded-[2px]" />
            )}
            <span className="truncate">{locale === "ko" ? c.nameKo : c.nameEn}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── 대륙 ──────────────────────────────────────────────────────────
export function ContinentArticle(
  { code, nameKo, nameEn, countries, locale }:
  { code: ContinentCode; nameKo: string; nameEn: string; countries: CountryRecord[]; locale: Locale },
) {
  void code;
  const name = locale === "ko" ? nameKo : nameEn;
  const lang = locale as SupportedLanguage;
  const sorted = [...countries].sort((a, b) =>
    locale === "ko" ? a.nameKo.localeCompare(b.nameKo, "ko") : a.nameEn.localeCompare(b.nameEn, "en"));

  const withPop = countries.filter((c) => c.population.s === "ok" && c.population.v != null);
  const totalPop = withPop.reduce((s, c) => s + (c.population.v ?? 0), 0);
  const island = countries.filter((c) => c.islandCountry).length;
  const landlocked = countries.filter((c) => c.landlocked).length;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#2e2a26]">
        {locale === "ko" ? `${name}에는 어떤 나라가 있을까?` : `Which countries are in ${name}?`}
      </h1>
      <p className="mt-3 leading-relaxed text-[#4a423c]">
        {locale === "ko"
          ? `${name}에는 나라콕이 다루는 나라가 ${countries.length}개국 있어요. 그중 ${island}개국은 섬나라이고, ${landlocked}개국은 바다가 없는 내륙국이에요.`
          : `NARAKOK covers ${countries.length} countries in ${name}. ${island} of them are island countries and ${landlocked} are landlocked.`}
      </p>
      {withPop.length > 0 && (
        <p className="mt-2 leading-relaxed text-[#4a423c]">
          {locale === "ko"
            ? `인구 자료가 있는 ${withPop.length}개국을 모두 더하면 약 ${Math.round(totalPop / 1e8) / 10}억 명이에요.`
            : `Adding up the ${withPop.length} countries with population data gives about ${(totalPop / 1e9).toFixed(1)} billion people.`}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold text-[#2e2a26]">
          {locale === "ko" ? `${name} 나라 목록` : `Countries in ${name}`}
        </h2>
        <CountryLinkList countries={sorted} locale={locale} />
      </section>

      <p className="mt-8 text-sm text-[#8a807a]">
        {locale === "ko" ? "인구 자료 출처: " : "Population data: "}
        <a href="https://data.worldbank.org" rel="noopener" className="underline underline-offset-2">World Bank Open Data</a>
        {" · "}{formatYear(withPop[0]?.population.y ?? null, lang)}
      </p>
    </article>
  );
}

// ── 랭킹 ──────────────────────────────────────────────────────────
export function RankingArticle(
  { metric, all, locale }: { metric: RankingMetric; all: CountryRecord[]; locale: Locale },
) {
  const lang = locale as SupportedLanguage;
  const result = buildRanking(all, metric.metricId, { order: metric.defaultOrder });
  const top = result.rows.slice(0, 10);
  const years = [...new Set(top.map((r) => r.year).filter((y): y is number => y != null))];

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#2e2a26]">
        {locale === "ko" ? metric.questionKo : metric.questionEn}
      </h1>
      <p className="mt-3 leading-relaxed text-[#4a423c]">
        {locale === "ko" ? metric.koDescription : metric.enDescription}
      </p>
      {/* 분모를 숨기지 않는다 — 몇 개국 중의 순위인지가 순위만큼 중요하다 */}
      <p className="mt-2 text-sm text-[#8a807a]">
        {locale === "ko"
          ? `자료가 있는 ${result.eligibleCountryCount}개국으로 순위를 매겼어요.`
          : `Ranked among ${result.eligibleCountryCount} countries with data.`}
        {years.length === 1 && <> · {formatYear(years[0], lang)}</>}
        {years.length > 1 && <> · {locale === "ko" ? "국가별 기준연도가 달라요" : "reference years vary by country"}</>}
      </p>
      {metric.caveatKo && locale === "ko" && (
        <p className="mt-1 text-sm text-[#a8794f]">※ {metric.caveatKo}</p>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold text-[#2e2a26]">TOP 10</h2>
        <ol className="mt-3 divide-y divide-[#eee7e0]">
          {top.map((row) => {
            const f = formatMetric(
              { v: row.value, y: row.year, u: "people", s: "ok", src: null },
              lang,
            );
            void f;
            return (
              <li key={row.iso3} className="flex items-baseline gap-3 py-2">
                <span className="w-7 shrink-0 text-right font-bold text-[#f47f45]">{row.rank}</span>
                {row.country.flagUrl && (
                  <img src={row.country.flagUrl} alt="" aria-hidden width={20} height={15} loading="lazy" className="rounded-[2px]" />
                )}
                <Link href={countryPath(locale, countrySlug(row.country))}
                  className="flex-1 truncate underline underline-offset-2">
                  {locale === "ko" ? row.country.nameKo : row.country.nameEn}
                </Link>
                <span className="tabular-nums font-medium text-[#2e2a26]">
                  {row.value.toLocaleString(locale === "ko" ? "ko-KR" : "en-US", { maximumFractionDigits: 1 })}
                  <span className="ml-1 text-xs text-[#8a807a]">{metric.unit}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="mt-8 text-sm text-[#8a807a]">
        {locale === "ko" ? "출처: " : "Source: "}
        <a href={metric.sourceUrl} rel="noopener" className="underline underline-offset-2">{metric.sourceName}</a>
      </p>
    </article>
  );
}

// ── 호기심 모음 ───────────────────────────────────────────────────
export function CuriosityArticle(
  { result, locale }: { result: CuriosityResult; locale: Locale },
) {
  const col = result.collection;
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#2e2a26]">
        {locale === "ko" ? col.titleKo : col.titleEn}
      </h1>
      <p className="mt-3 leading-relaxed text-[#4a423c]">{locale === "ko" ? col.ruleKo : col.ruleEn}</p>
      {col.caveatKo && locale === "ko" && <p className="mt-1 text-sm text-[#a8794f]">※ {col.caveatKo}</p>}
      {/* 순위 숫자를 붙이지 않는다 — 맞다/아니다인 주제에 서열을 만들지 않는다 */}
      <p className="mt-2 text-sm text-[#8a807a]">
        {locale === "ko" ? `해당 국가 ${result.total}개` : `${result.total} countries`}
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-[#2e2a26]">
          {locale === "ko" ? "나라 목록" : "Countries"}
        </h2>
        <CountryLinkList countries={result.countries} locale={locale} />
      </section>
    </article>
  );
}
