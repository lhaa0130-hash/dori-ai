"use client";

// 국가 상세 (명세서 §7.4). 표시 순서는 명세서가 정한 그대로다.
// 숫자 카드마다 값·단위·기준연도·출처를 함께 둔다. 기준연도가 다른 값을 같은 해처럼 보이게 하지 않는다.

import { useMemo, useState } from "react";
import type { CountryDataset, CountryRecord, MetricKey, SupportedLanguage } from "@/lib/worldmap/types";
import { METRIC_KEYS } from "@/lib/worldmap/types";
import { buildChildSummary, buildBreadcrumb } from "@/lib/worldmap/childSummary";
import { formatMetric, formatDate, NO_DATA } from "@/lib/worldmap/format";
import { worldRank } from "@/lib/worldmap/search";
import { t } from "@/lib/worldmap/i18n";

export function Flag({ country, size = 40 }: { country: CountryRecord; size?: number }) {
  const [broken, setBroken] = useState(false);
  // 국기 이미지가 늦거나 실패해도 레이아웃이 흔들리지 않게 영역을 고정한다(명세서 §14).
  const box = { width: size, height: Math.round((size * 2) / 3) };
  if (!country.flagUrl || broken) {
    return (
      <span
        style={box}
        className="inline-flex items-center justify-center rounded border border-[#ece6e0] bg-[#f8f4f0] font-mono text-[10px] font-semibold text-[#7d746e]"
      >
        {country.iso3}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={country.flagUrl}
      alt=""
      style={box}
      onError={() => setBroken(true)}
      className="rounded border border-[#ece6e0] object-cover"
    />
  );
}

const METRIC_LABEL: Record<MetricKey, "population" | "area" | "gdp" | "gdpPerCapita"> = {
  population: "population",
  area: "area",
  gdp: "gdp",
  gdpPerCapita: "gdpPerCapita",
};

function MetricCard({
  country, metric, lang, dataset, allCountries,
}: {
  country: CountryRecord; metric: MetricKey; lang: SupportedLanguage;
  dataset: CountryDataset; allCountries: CountryRecord[];
}) {
  const value = country[metric];
  const f = formatMetric(value, lang);
  const rank = f.missing ? null : worldRank(allCountries, country.iso3, metric);
  const source = value.src ? dataset.sources[value.src] : null;

  return (
    <div className="rounded-xl border border-[#ece6e0] bg-white p-3.5">
      <p className="text-[13px] font-medium text-[#7d746e]">{t(METRIC_LABEL[metric], lang)}</p>
      <p
        className="mt-1 text-[19px] font-extrabold tabular-nums text-[#201b18]"
        title={f.full ?? undefined}
      >
        {f.display}
        {f.full && <span className="sr-only"> ({f.full})</span>}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#a89f98]">
        {f.year && <span>{t("asOf", lang)} {f.year}</span>}
        {metric === "gdp" && <span>{t("gdpNote", lang)}</span>}
        {rank && <span className="font-semibold text-[#f47f45]">{t("worldRank", lang)} {rank.rank}/{rank.total}</span>}
        {source && (
          <a href={source.url} target="_blank" rel="noreferrer noopener" className="underline decoration-dotted hover:text-[#7d746e]">
            {source.label}
          </a>
        )}
      </div>
    </div>
  );
}

function TextRow({ label, value, source, lang, dataset }: {
  label: string; value: string | null; source: string | null;
  lang: SupportedLanguage; dataset: CountryDataset;
}) {
  const s = source ? dataset.sources[source] : null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#f3eee9] py-2.5 last:border-0">
      <span className="shrink-0 text-[13px] font-medium text-[#7d746e]">{label}</span>
      <span className="text-right text-[14px] font-semibold text-[#201b18]">
        {value ?? <span className="font-normal text-[#a89f98]">{NO_DATA[lang]}</span>}
        {s && value && (
          <a
            href={s.url} target="_blank" rel="noreferrer noopener"
            className="ml-1.5 align-middle text-[10px] font-normal text-[#a89f98] underline decoration-dotted"
          >
            {s.provider}
          </a>
        )}
      </span>
    </div>
  );
}

export default function CountryDetail({
  country, dataset, lang, allCountries, onCompare, onSelectCountry,
}: {
  country: CountryRecord; dataset: CountryDataset; lang: SupportedLanguage;
  allCountries: CountryRecord[]; onCompare: () => void;
  onSelectCountry: (iso3: string) => void;
}) {
  const [showSources, setShowSources] = useState(false);
  const byIso = useMemo(() => new Map(allCountries.map((c) => [c.iso3, c])), [allCountries]);
  const nameOf = (iso3: string) => {
    const c = byIso.get(iso3);
    return c ? (lang === "ko" ? c.nameKo : c.nameEn) : null;
  };

  const crumbs = buildBreadcrumb(country, lang);
  const story = buildChildSummary(country, lang, nameOf);
  const neighbours = country.borderCountryIso3.map((iso3) => byIso.get(iso3)).filter(Boolean) as CountryRecord[];

  return (
    <section aria-label={lang === "ko" ? country.nameKo : country.nameEn} className="rounded-2xl border border-[#ece6e0] bg-white p-5">
      {/* 1. 국기·이름·공식명 */}
      <header className="flex items-start gap-3">
        <Flag country={country} size={48} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] font-extrabold leading-tight text-[#201b18]">
            {lang === "ko" ? country.nameKo : country.nameEn}
          </h2>
          <p className="truncate text-[13px] text-[#7d746e]">
            {lang === "ko" ? country.nameEn : country.nameKo} · {country.officialNameEn}
          </p>
        </div>
        <button
          type="button"
          onClick={onCompare}
          className="shrink-0 rounded-lg bg-[#fff0e6] px-3 py-1.5 text-[13px] font-bold text-[#f47f45] transition hover:bg-[#ffe2d2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9966]"
        >
          {lang === "ko" ? "비교하기" : "Compare"}
        </button>
      </header>

      {/* 2. 대륙 > 지역 > 나라 */}
      {crumbs.length > 0 && (
        <nav aria-label={t("region", lang)} className="mt-2 text-[12px] font-medium text-[#7d746e]">
          {crumbs.join(" › ")}
        </nav>
      )}

      {/* 3. 어린이용 설명 — 생성형 문장이 아니라 가진 데이터로 조립한다 */}
      {story.length > 0 && (
        <div className="mt-3 rounded-xl bg-[#fff8f3] p-3.5">
          <p className="text-[12px] font-bold text-[#f47f45]">
            {lang === "ko" ? "이 나라는 어떤 나라야?" : "About this country"}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#40382f]">{story.join(" ")}</p>
        </div>
      )}

      {/* 4~6. 수도·언어·통화 / 이웃 나라 / 섬나라·내륙국 */}
      <div className="mt-4">
        <TextRow label={t("capital", lang)} value={lang === "ko" ? country.capitalKo : country.capitalEn} source={null} lang={lang} dataset={dataset} />
        <TextRow
          label={lang === "ko" ? "언어" : "Languages"}
          value={country.languages.length ? country.languages.map((l) => (lang === "ko" ? l.ko : l.en)).join(", ") : null}
          source={null} lang={lang} dataset={dataset}
        />
        <TextRow
          label={lang === "ko" ? "통화" : "Currency"}
          value={country.currencies.length
            ? country.currencies.map((c) => `${lang === "ko" ? c.ko : c.en} ${c.symbol ?? ""} (${c.code})`.replace(/\s+/g, " ").trim()).join(", ")
            : null}
          source={null} lang={lang} dataset={dataset}
        />
        {country.timezones.length > 0 && (
          <TextRow label={lang === "ko" ? "시간대" : "Time zone"} value={country.timezones.join(", ")} source="wikidata" lang={lang} dataset={dataset} />
        )}

        {/* 이웃 나라 — 눌러서 바로 이동 */}
        <div className="flex items-start justify-between gap-3 border-b border-[#f3eee9] py-2.5">
          <span className="shrink-0 text-[13px] font-medium text-[#7d746e]">{lang === "ko" ? "이웃 나라" : "Neighbours"}</span>
          <span className="flex flex-wrap justify-end gap-1.5">
            {neighbours.length > 0 ? (
              neighbours.map((n) => (
                <button
                  key={n.iso3} type="button" onClick={() => onSelectCountry(n.iso3)}
                  className="rounded-full border border-[#ece6e0] px-2 py-0.5 text-[12px] font-semibold text-[#40382f] transition hover:border-[#ff9966] hover:text-[#f47f45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff9966]"
                >
                  {lang === "ko" ? n.nameKo : n.nameEn}
                </button>
              ))
            ) : (
              <span className="text-[13px] text-[#a89f98]">
                {country.islandCountry
                  ? (lang === "ko" ? "육지 국경 없음 (섬나라)" : "No land borders (island)")
                  : NO_DATA[lang]}
              </span>
            )}
          </span>
        </div>

        {(country.islandCountry || country.landlocked) && (
          <div className="flex items-center justify-between gap-3 border-b border-[#f3eee9] py-2.5">
            <span className="text-[13px] font-medium text-[#7d746e]">{lang === "ko" ? "지형 특징" : "Geography"}</span>
            <span className="rounded-full bg-[#eaf5f5] px-2.5 py-0.5 text-[13px] font-semibold text-[#3f8f8f]">
              {country.islandCountry
                ? (lang === "ko" ? "🏝️ 섬나라" : "🏝️ Island country")
                : (lang === "ko" ? "⛰️ 내륙국" : "⛰️ Landlocked")}
            </span>
          </div>
        )}

        <TextRow
          label={country.leader.titleKo && lang === "ko" ? country.leader.titleKo : country.leader.titleEn && lang === "en" ? country.leader.titleEn : t("leader", lang)}
          value={lang === "ko" ? country.leader.ko : country.leader.en}
          source={country.leader.src} lang={lang} dataset={dataset}
        />
        <TextRow label={t("established", lang)} value={country.established.date ? formatDate(country.established.date, lang) : null} source={country.established.src} lang={lang} dataset={dataset} />
        <TextRow
          label={lang === "ko" ? country.religion.labelKo : country.religion.labelEn}
          value={lang === "ko" ? country.religion.ko : country.religion.en}
          source={country.religion.src} lang={lang} dataset={dataset}
        />
      </div>

      {/* 7~10. 숫자 지표 */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {METRIC_KEYS.map((m) => (
          <MetricCard key={m} country={country} metric={m} lang={lang} dataset={dataset} allCountries={allCountries} />
        ))}
      </div>

      {/* 11. 출처·갱신일 */}
      <div className="mt-4 border-t border-[#f3eee9] pt-3">
        <button
          type="button"
          onClick={() => setShowSources((v) => !v)}
          aria-expanded={showSources}
          className="text-[12px] font-semibold text-[#7d746e] underline decoration-dotted hover:text-[#201b18]"
        >
          {t("showSources", lang)}
        </button>
        {showSources && (
          <ul className="mt-2 space-y-1 text-[11px] text-[#7d746e]">
            {Object.values(dataset.sources).map((s) => (
              <li key={s.provider}>
                <a href={s.url} target="_blank" rel="noreferrer noopener" className="underline decoration-dotted">{s.label}</a>
                <span className="ml-1.5 text-[#a89f98]">
                  {t("updatedAt", lang)} {s.fetchedAt.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
