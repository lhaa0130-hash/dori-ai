"use client";

// 두 국가 비교 (명세서 §7.5).
// A 는 브랜드 오렌지, B 는 보조 블루로 구분하되 **색만으로 구분하지 않도록** 항상 글자 라벨을 함께 둔다(§3.2 · §15).

import type { CountryRecord, MetricKey, SupportedLanguage, CountryDataset, ContinentCode } from "@/lib/worldmap/types";
import { METRIC_KEYS } from "@/lib/worldmap/types";
import { compareMetrics, formatMetric, formatDate, abbreviate, NO_DATA } from "@/lib/worldmap/format";
import { t } from "@/lib/worldmap/i18n";
import SearchBox from "./SearchBox";
import { Flag } from "./CountryDetail";

const A_COLOR = "#ff8b55";
const B_COLOR = "#4b7bec";

function Header({ country, slot, lang }: { country: CountryRecord; slot: "a" | "b"; lang: SupportedLanguage }) {
  return (
    <div className="flex items-center gap-2">
      <Flag country={country} size={32} />
      <div className="min-w-0">
        <p
          className="truncate text-[15px] font-extrabold text-[#201b18]"
          style={{ textDecorationColor: slot === "a" ? A_COLOR : B_COLOR }}
        >
          {lang === "ko" ? country.nameKo : country.nameEn}
        </p>
        <p className="text-[11px] font-bold" style={{ color: slot === "a" ? A_COLOR : B_COLOR }}>
          {slot === "a" ? `A · ${t("countryA", lang)}` : `B · ${t("countryB", lang)}`}
        </p>
      </div>
    </div>
  );
}

function TextCompare({ label, a, b, lang }: { label: string; a: string | null; b: string | null; lang: SupportedLanguage }) {
  return (
    <div className="border-b border-[#f3eee9] py-2.5 last:border-0">
      <p className="text-[12px] font-medium text-[#7d746e]">{label}</p>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <p className="text-[14px] font-semibold text-[#201b18]">{a ?? <span className="font-normal text-[#a89f98]">{NO_DATA[lang]}</span>}</p>
        <p className="text-[14px] font-semibold text-[#201b18]">{b ?? <span className="font-normal text-[#a89f98]">{NO_DATA[lang]}</span>}</p>
      </div>
    </div>
  );
}

function NumericCompare({ metric, a, b, lang }: { metric: MetricKey; a: CountryRecord; b: CountryRecord; lang: SupportedLanguage }) {
  const fa = formatMetric(a[metric], lang);
  const fb = formatMetric(b[metric], lang);
  const cmp = compareMetrics(a[metric], b[metric]);

  return (
    <div className="border-b border-[#f3eee9] py-3 last:border-0">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-medium text-[#7d746e]">{t(metric, lang)}</p>
        {cmp.comparable && cmp.diff != null && (
          <p className="text-[11px] text-[#a89f98]">
            {t("difference", lang)} {metric === "gdp" || metric === "gdpPerCapita" ? "$" : ""}
            {abbreviate(cmp.diff, lang)}
            {metric === "area" ? " km²" : ""}
          </p>
        )}
      </div>

      <div className="mt-1.5 grid grid-cols-2 gap-3">
        {[{ f: fa, cmp: cmp.ratioA, color: A_COLOR }, { f: fb, cmp: cmp.ratioB, color: B_COLOR }].map((side, i) => (
          <div key={i}>
            <p className="text-[16px] font-extrabold tabular-nums text-[#201b18]" title={side.f.full ?? undefined}>
              {side.f.display}
              {side.f.full && <span className="sr-only"> ({side.f.full})</span>}
            </p>
            {side.f.year && <p className="text-[10px] text-[#a89f98]">{t("asOf", lang)} {side.f.year}</p>}
            {/* 큰 값을 100% 로 정규화한 비교 막대 */}
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f3eee9]">
              <div
                className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${Math.round(side.cmp * 100)}%`, backgroundColor: side.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {!cmp.comparable && <p className="mt-1.5 text-[11px] text-[#a89f98]">{t("noComparison", lang)}</p>}
    </div>
  );
}

interface Props {
  a: CountryRecord;
  b: CountryRecord | null;
  dataset: CountryDataset;
  lang: SupportedLanguage;
  continent: ContinentCode | null;
  onPickB: (iso3: string) => void;
  onSwap: () => void;
  onReset: () => void;
  onBack: () => void;
}

export default function ComparePanel({ a, b, dataset, lang, continent, onPickB, onSwap, onReset, onBack }: Props) {
  const btn =
    "rounded-lg border border-[#ece6e0] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#40382f] transition hover:border-[#ff9966] hover:text-[#f47f45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9966]";

  return (
    <section aria-label={t("compare", lang)} className="rounded-2xl border border-[#ece6e0] bg-white p-5">
      <div className="grid grid-cols-2 gap-3">
        <Header country={a} slot="a" lang={lang} />
        {b ? (
          <Header country={b} slot="b" lang={lang} />
        ) : (
          <div>
            <p className="mb-1.5 text-[11px] font-bold" style={{ color: B_COLOR }}>B · {t("countryB", lang)}</p>
            <SearchBox
              countries={dataset.countries.filter((c) => c.iso3 !== a.iso3)}
              lang={lang} continent={continent} mode="compare" onSelect={onPickB}
            />
          </div>
        )}
      </div>

      {b ? (
        <>
          <div className="mt-4">
            <TextCompare label={t("capital", lang)} a={lang === "ko" ? a.capitalKo : a.capitalEn} b={lang === "ko" ? b.capitalKo : b.capitalEn} lang={lang} />
            <TextCompare label={t("leader", lang)} a={lang === "ko" ? a.leader.ko : a.leader.en} b={lang === "ko" ? b.leader.ko : b.leader.en} lang={lang} />
            <TextCompare label={t("established", lang)} a={a.established.date ? formatDate(a.established.date, lang) : null} b={b.established.date ? formatDate(b.established.date, lang) : null} lang={lang} />
            <TextCompare label={t("religionDefault", lang)} a={lang === "ko" ? a.religion.ko : a.religion.en} b={lang === "ko" ? b.religion.ko : b.religion.en} lang={lang} />
            {METRIC_KEYS.map((m) => (
              <NumericCompare key={m} metric={m} a={a} b={b} lang={lang} />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onSwap} className={btn}>{t("swap", lang)}</button>
            <button type="button" onClick={onReset} className={btn}>{t("resetCompare", lang)}</button>
            <button type="button" onClick={onBack} className={btn}>{t("backToDetail", lang)}</button>
          </div>
        </>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={onBack} className={btn}>{t("backToDetail", lang)}</button>
        </div>
      )}
    </section>
  );
}
