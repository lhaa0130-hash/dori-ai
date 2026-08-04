// 국가 SEO 페이지 본문 (지시서 10 §4.2).
//
// ⚠️ 이 컴포넌트에는 "use client" 를 붙이지 않는다. 서버에서 HTML 로 그려져야
//    검색엔진과 JS 가 꺼진 사용자에게 내용이 보인다. 지도는 별도 클라이언트
//    컴포넌트로 아래에 얹고, 지도가 없어도 이 본문만으로 페이지가 성립한다.

import Link from "next/link";
import type { CountryRecord, SupportedLanguage } from "@/lib/worldmap/types";
import {
  factRows, locationStory, notableRankings, questions,
} from "@/lib/worldmap/countryPage";
import { formatYear } from "@/lib/worldmap/display";
import { CONTINENT_SLUG, countrySlug, continentPath, countryPath, rankingPath, metricSlug, type Locale } from "@/lib/worldmap/seoRoutes";
import { CURIOSITY_COLLECTIONS } from "@/lib/worldmap/curiosity";
import { CURIOSITY_SLUG, curiosityPath } from "@/lib/worldmap/seoRoutes";

export interface CountryArticleProps {
  country: CountryRecord;
  all: CountryRecord[];
  locale: Locale;
  generatedAt: string;
}

const T = {
  ko: {
    where: "어디에 있을까?",
    facts: "핵심 정보",
    numbers: "숫자로 보는",
    ranks: "이 나라가 이름을 올린 랭킹",
    qna: "궁금한 이야기",
    neighbours: "이웃 나라",
    sameContinent: "같은 대륙의 나라",
    collections: "이 나라가 속한 모음",
    sources: "출처와 데이터 갱신일",
    map: "지도에서 보기",
    compare: "다른 나라와 비교하기",
    dataUpdated: "데이터 갱신",
    rankOf: (r: number, t: number) => `세계 ${r}위 / ${t}개국`,
  },
  en: {
    where: "Where is it?",
    facts: "Key facts",
    numbers: "By the numbers:",
    ranks: "Rankings this country appears in",
    qna: "Questions kids ask",
    neighbours: "Neighbouring countries",
    sameContinent: "Countries on the same continent",
    collections: "Collections this country belongs to",
    sources: "Sources and last data update",
    map: "See on the map",
    compare: "Compare with other countries",
    dataUpdated: "Data updated",
    rankOf: (r: number, t: number) => `World #${r} of ${t}`,
  },
} as const;

export default function CountryArticle({ country: c, all, locale, generatedAt }: CountryArticleProps) {
  const t = T[locale];
  const lang = locale as SupportedLanguage;
  const name = locale === "ko" ? c.nameKo : c.nameEn;
  const story = locationStory(c, all, lang);
  const facts = factRows(c, lang);
  const ranks = notableRankings(c, all);
  const qna = questions(c, all, lang);

  const neighbours = (c.borderCountryIso3 ?? [])
    .map((iso) => all.find((o) => o.iso3 === iso))
    .filter((x): x is CountryRecord => !!x);

  // 같은 대륙에서 가까운 크기의 나라 — 무작위가 아니라 면적 순서상 이웃이다.
  const sameContinent = all
    .filter((o) => o.continentCode === c.continentCode && o.iso3 !== c.iso3)
    .sort((a, b) => (a.area.v ?? 0) - (b.area.v ?? 0));
  const myIdx = sameContinent.findIndex((o) => (o.area.v ?? 0) >= (c.area.v ?? 0));
  const nearby = sameContinent.slice(Math.max(0, myIdx - 3), Math.max(0, myIdx - 3) + 6);

  const collections = CURIOSITY_COLLECTIONS.filter((col) => col.match(c, all));

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#2e2a26]">
        {locale === "ko" ? `${name}은 어떤 나라일까?` : `What is ${name} like?`}
      </h1>

      <p className="mt-3 flex items-center gap-2 text-sm text-[#6b625c]">
        {c.flagUrl && (
          // 국기는 장식이 아니라 나라를 알아보는 정보다. alt 에 나라 이름을 넣는다.
          <img src={c.flagUrl} srcSet={c.flagUrl2x ? `${c.flagUrl2x} 2x` : undefined}
            alt={locale === "ko" ? `${name} 국기` : `Flag of ${name}`}
            width={32} height={24} loading="eager" className="rounded-sm ring-1 ring-black/10" />
        )}
        <span>{locale === "ko" ? c.nameEn : c.nameKo}</span>
        <span aria-hidden>·</span>
        <Link href={continentPath(locale, CONTINENT_SLUG[c.continentCode])} className="underline underline-offset-2">
          {locale === "ko" ? c.continentKo : c.continentEn}
        </Link>
      </p>

      {/* 어디에 있을까 — 데이터로만 만든 위치 이야기 */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-[#2e2a26]">{t.where}</h2>
        {story.map((s, i) => <p key={i} className="mt-2 leading-relaxed text-[#4a423c]">{s}</p>)}
      </section>

      {/* 핵심 정보 */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-[#2e2a26]">{t.facts}</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-wrap items-baseline gap-x-2 border-b border-[#eee7e0] py-2">
              <dt className="min-w-[5.5rem] text-sm text-[#8a807a]">{f.label}</dt>
              <dd className="font-medium text-[#2e2a26]">{f.value}</dd>
              {f.note && <span className="text-xs text-[#a89f98]">{f.note}</span>}
            </div>
          ))}
        </dl>
      </section>

      {/* 랭킹 — 실제로 TOP 10 에 든 것만 */}
      {ranks.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#2e2a26]">{t.ranks}</h2>
          <ul className="mt-3 space-y-2">
            {ranks.map((r) => (
              <li key={r.metric.metricId}>
                <Link href={rankingPath(locale, metricSlug(r.metric.metricId))}
                  className="text-[#f47f45] underline underline-offset-2">
                  {locale === "ko" ? r.metric.koLabel : r.metric.enLabel}
                </Link>
                <span className="ml-2 text-sm text-[#6b625c]">{t.rankOf(r.rank, r.total)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 질문과 답 */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-[#2e2a26]">{t.qna}</h2>
        <dl className="mt-3 space-y-4">
          {qna.map((x, i) => (
            <div key={i}>
              <dt className="font-semibold text-[#2e2a26]">{x.q}</dt>
              <dd className="mt-1 leading-relaxed text-[#4a423c]">{x.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 내부 링크 — crawler 가 따라갈 수 있는 진짜 anchor 다 */}
      {neighbours.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#2e2a26]">{t.neighbours}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {neighbours.map((n) => (
              <li key={n.iso3}>
                <Link href={countryPath(locale, countrySlug(n))}
                  className="inline-block rounded-full border border-[#e4dcd4] px-3 py-1 text-sm hover:bg-[#fff3ec]">
                  {locale === "ko" ? n.nameKo : n.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nearby.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#2e2a26]">{t.sameContinent}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {nearby.map((n) => (
              <li key={n.iso3}>
                <Link href={countryPath(locale, countrySlug(n))}
                  className="inline-block rounded-full border border-[#e4dcd4] px-3 py-1 text-sm hover:bg-[#fff3ec]">
                  {locale === "ko" ? n.nameKo : n.nameEn}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {collections.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-[#2e2a26]">{t.collections}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {collections.map((col) => (
              <li key={col.id}>
                <Link href={curiosityPath(locale, CURIOSITY_SLUG[col.id])}
                  className="inline-block rounded-full bg-[#fff3ec] px-3 py-1 text-sm text-[#c9541f]">
                  {locale === "ko" ? col.titleKo : col.titleEn}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 flex flex-wrap gap-3">
        <Link href={`/world-map?country=${c.iso3}${locale === "en" ? "&lang=en" : ""}`}
          className="rounded-full bg-[#ff8b55] px-4 py-2 font-semibold text-white">
          {t.map}
        </Link>
        <Link href={`/world-map?mode=compare&countries=${c.iso3}`}
          className="rounded-full border border-[#e4dcd4] px-4 py-2 font-semibold text-[#4a423c]">
          {t.compare}
        </Link>
      </section>

      {/* 출처 — 수치마다 기준연도를 적었고, 원출처를 여기서 밝힌다 */}
      <section className="mt-10 border-t border-[#eee7e0] pt-4 text-sm text-[#8a807a]">
        <h2 className="text-base font-bold text-[#4a423c]">{t.sources}</h2>
        <ul className="mt-2 space-y-1">
          <li>
            <a href="https://data.worldbank.org" rel="noopener" className="underline underline-offset-2">World Bank Open Data</a>
            {" — "}{locale === "ko" ? "인구·면적·GDP 등 숫자 지표" : "population, area, GDP and other indicators"}
          </li>
          <li>
            <a href="https://www.wikidata.org" rel="noopener" className="underline underline-offset-2">Wikidata</a>
            {" — "}{locale === "ko" ? "수도 좌표·시간대·국가 수립일" : "capital coordinates, time zones, founding date"}
          </li>
          <li>
            <a href="https://www.naturalearthdata.com" rel="noopener" className="underline underline-offset-2">Natural Earth</a>
            {" — "}{locale === "ko" ? "국경과 지도 도형" : "borders and map geometry"}
          </li>
        </ul>
        <p className="mt-2">{t.dataUpdated}: {formatYear(new Date(generatedAt).getFullYear(), lang)}</p>
      </section>
    </article>
  );
}
