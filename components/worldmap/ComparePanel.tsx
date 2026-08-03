"use client";

// 2~4개국 비교 (후속 지시서 §3.4 · §6).
//
// 원칙:
//   · 선택한 **모든** 나라에 값이 있는 항목만 기본 표에 보여준다. 빈칸 표는 만들지 않는다.
//   · 우승·1등·왕관 같은 우열 표현을 쓰지 않는다. 숫자와 막대만 보여준다.
//   · 색상만으로 구분하지 않고 항상 1~4 번호와 나라 이름을 함께 둔다.

import { useMemo, useState } from "react";
import type { CountryRecord, CountryDataset, SupportedLanguage, MetricKey } from "@/lib/worldmap/types";
import { type ComparisonSelection, colorFor, MAX_COMPARISON } from "@/lib/worldmap/comparison";
import { formatMetric, formatDate, abbreviate, NO_DATA } from "@/lib/worldmap/format";
import { t } from "@/lib/worldmap/i18n";
import { Flag } from "./CountryDetail";
import { formatYear } from "@/lib/worldmap/display";

type FieldKey =
  | "continent" | "subregion" | "capital" | "established" | "leader" | "religion"
  | "languages" | "currencies" | MetricKey;

const COMMON_COMPARE_FIELDS: FieldKey[] = [
  "continent", "subregion", "capital", "established", "leader", "religion",
  "languages", "currencies", "population", "area", "gdp", "gdpPerCapita",
];

const NUMERIC: FieldKey[] = ["population", "area", "gdp", "gdpPerCapita"];

/** 화면에 쓸 값. 없으면 null 을 돌려주고, 그 항목은 기본 표에서 빠진다. */
function textValue(c: CountryRecord, field: FieldKey, lang: SupportedLanguage): string | null {
  const pick = (ko: string | null, en: string | null) => (lang === "ko" ? ko : en) || null;
  switch (field) {
    case "continent": return pick(c.continentKo, c.continentEn);
    case "subregion": return pick(c.subregionKo, c.subregionEn);
    case "capital": return pick(c.capitalKo, c.capitalEn);
    case "established": return c.established.date ? formatDate(c.established.date, lang) : null;
    case "leader": return c.leader.s === "ok" ? pick(c.leader.ko, c.leader.en) : null;
    case "religion": return c.religion.s === "ok" ? pick(c.religion.ko, c.religion.en) : null;
    case "languages": return c.languages.length ? c.languages.map((l) => (lang === "ko" ? l.ko : l.en)).join(", ") : null;
    case "currencies": return c.currencies.length ? c.currencies.map((x) => `${lang === "ko" ? x.ko : x.en} (${x.code})`).join(", ") : null;
    default: return null;
  }
}

/** 이 항목에 쓸 만한 값이 있는가. null·빈 문자열·빈 배열·missing 은 없는 값이다. */
export function hasComparableValue(c: CountryRecord, field: FieldKey, lang: SupportedLanguage): boolean {
  if (NUMERIC.includes(field)) {
    const m = c[field as MetricKey];
    return m.s !== "missing" && m.v != null;
  }
  const v = textValue(c, field, lang);
  return typeof v === "string" && v.trim().length > 0;
}

const FIELD_LABEL: Record<FieldKey, { ko: string; en: string }> = {
  continent: { ko: "대륙", en: "Continent" },
  subregion: { ko: "지역", en: "Region" },
  capital: { ko: "수도", en: "Capital" },
  established: { ko: "국가 수립일", en: "Established" },
  leader: { ko: "대표 지도자", en: "Leader" },
  religion: { ko: "주요 종교", en: "Main religion" },
  languages: { ko: "언어", en: "Languages" },
  currencies: { ko: "통화", en: "Currency" },
  population: { ko: "인구", en: "Population" },
  area: { ko: "국토 면적", en: "Area" },
  gdp: { ko: "GDP", en: "GDP" },
  gdpPerCapita: { ko: "1인당 GDP", en: "GDP per capita" },
};

interface Props {
  countries: CountryRecord[];               // 순서 = 색상 번호
  selections: ComparisonSelection[];
  dataset: CountryDataset;
  lang: SupportedLanguage;
  /** 방금 중복으로 누른 나라 — 잠깐 강조한다 */
  flashIso3: string | null;
  onRemove: (iso3: string) => void;
  onMove: (iso3: string, direction: -1 | 1) => void;
  onClear: () => void;
  onExit: () => void;
}

export default function ComparePanel({
  countries, selections, dataset, lang, flashIso3, onRemove, onMove, onClear, onExit,
}: Props) {
  const [showPartial, setShowPartial] = useState(false);

  // 선택한 모든 나라에 값이 있는 항목만 기본 표에 남긴다.
  const { common, partial } = useMemo(() => {
    if (countries.length < 2) return { common: [] as FieldKey[], partial: [] as FieldKey[] };
    const common: FieldKey[] = [];
    const partial: FieldKey[] = [];
    for (const field of COMMON_COMPARE_FIELDS) {
      const have = countries.filter((c) => hasComparableValue(c, field, lang)).length;
      if (have === countries.length) common.push(field);
      else if (have > 0) partial.push(field);
    }
    return { common, partial };
  }, [countries, lang]);

  const btn =
    "rounded-lg border border-[#ece6e0] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#40382f] transition hover:border-[#ff9966] hover:text-[#f47f45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9966]";

  return (
    <section aria-label={t("compare", lang)} className="rounded-2xl border border-[#ece6e0] bg-white p-5">
      {/* ── 선택 tray ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-[#40382f]">
          {lang === "ko" ? `${selections.length}/${MAX_COMPARISON} 선택됨` : `${selections.length}/${MAX_COMPARISON} selected`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onClear} className={btn}>{lang === "ko" ? "모두 지우기" : "Clear all"}</button>
          <button type="button" onClick={onExit} className={btn}>{lang === "ko" ? "비교 끝내기" : "Exit compare"}</button>
        </div>
      </div>

      <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: MAX_COMPARISON }, (_, i) => {
          const sel = selections[i];
          const c = sel ? countries.find((x) => x.iso3 === sel.iso3) : null;
          if (!sel || !c) {
            return (
              <li key={`empty-${i}`} className="flex h-[68px] items-center justify-center rounded-xl border border-dashed border-[#ded5cc] text-[12px] text-[#a89f98]">
                {i + 1}
              </li>
            );
          }
          const color = colorFor(i);
          const flash = flashIso3 === c.iso3;
          return (
            <li
              key={c.iso3}
              className={`rounded-xl border p-2 transition ${flash ? "ring-2 ring-offset-1" : ""}`}
              style={{ borderColor: color.fill, backgroundColor: color.soft, ...(flash ? { boxShadow: `0 0 0 2px ${color.fill}` } : {}) }}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: color.fill }}>
                  {i + 1}
                </span>
                <Flag country={c} size={22} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-[#201b18]">
                  {lang === "ko" ? c.nameKo : c.nameEn}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1">
                <button
                  type="button" onClick={() => onMove(c.iso3, -1)} disabled={i === 0}
                  aria-label={lang === "ko" ? `${c.nameKo} 앞으로` : `Move ${c.nameEn} earlier`}
                  className="rounded px-1.5 text-[13px] font-bold text-[#7d746e] disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff9966]"
                >←</button>
                <button
                  type="button" onClick={() => onMove(c.iso3, 1)} disabled={i === selections.length - 1}
                  aria-label={lang === "ko" ? `${c.nameKo} 뒤로` : `Move ${c.nameEn} later`}
                  className="rounded px-1.5 text-[13px] font-bold text-[#7d746e] disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff9966]"
                >→</button>
                <button
                  type="button" onClick={() => onRemove(c.iso3)}
                  aria-label={lang === "ko" ? `${c.nameKo} 빼기` : `Remove ${c.nameEn}`}
                  className="ml-auto rounded px-1.5 text-[12px] font-bold text-[#c64e4e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff9966]"
                >✕</button>
              </div>
            </li>
          );
        })}
      </ol>

      {/* ── 안내 또는 비교 표 ──────────────────────────────────── */}
      {countries.length < 2 ? (
        <p className="mt-4 rounded-xl bg-[#f8f4f0] px-4 py-3 text-[14px] text-[#40382f]">
          {lang === "ko"
            ? "지도나 검색에서 비교할 나라를 2개 이상 선택하세요."
            : "Pick at least two countries from the map or search."}
        </p>
      ) : (
        <>
          <CompareTable countries={countries} fields={common} lang={lang} />
          {partial.length > 0 && (
            <div className="mt-3">
              <button
                type="button" onClick={() => setShowPartial((v) => !v)} aria-expanded={showPartial}
                className="text-[12px] font-semibold text-[#7d746e] underline decoration-dotted hover:text-[#201b18]"
              >
                {lang === "ko" ? `한쪽만 있는 정보도 보기 (${partial.length})` : `Show partial data (${partial.length})`}
              </button>
              {showPartial && <CompareTable countries={countries} fields={partial} lang={lang} allowMissing />}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CompareTable({
  countries, fields, lang, allowMissing = false,
}: { countries: CountryRecord[]; fields: FieldKey[]; lang: SupportedLanguage; allowMissing?: boolean }) {
  if (!fields.length) {
    return (
      <p className="mt-4 rounded-xl bg-[#f8f4f0] px-4 py-3 text-[13px] text-[#7d746e]">
        {t("noComparison", lang)}
      </p>
    );
  }

  return (
    // 모바일에서는 항목 열을 고정하고 나라 열을 옆으로 넘겨 본다
    <div className="mt-4 -mx-1 overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-white">
          <tr>
            <th scope="col" className="sticky left-0 z-10 w-24 bg-white px-2 py-2 text-[12px] font-medium text-[#a89f98]">
              {lang === "ko" ? "항목" : "Field"}
            </th>
            {countries.map((c, i) => {
              const color = colorFor(i);
              return (
                <th key={c.iso3} scope="col" className="min-w-[130px] px-2 py-2 align-bottom">
                  <span className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: color.fill }}>
                      {i + 1}
                    </span>
                    <Flag country={c} size={20} />
                    <span className="truncate text-[13px] font-extrabold text-[#201b18]">
                      {lang === "ko" ? c.nameKo : c.nameEn}
                    </span>
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <Row key={field} field={field} countries={countries} lang={lang} allowMissing={allowMissing} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  field, countries, lang, allowMissing,
}: { field: FieldKey; countries: CountryRecord[]; lang: SupportedLanguage; allowMissing: boolean }) {
  const isNumeric = NUMERIC.includes(field);
  const label = FIELD_LABEL[field][lang];

  if (!isNumeric) {
    return (
      <tr className="border-t border-[#f3eee9]">
        <th scope="row" className="sticky left-0 bg-white px-2 py-2.5 text-[12px] font-medium text-[#7d746e]">{label}</th>
        {countries.map((c) => {
          const v = textValue(c, field, lang);
          return (
            <td key={c.iso3} className="px-2 py-2.5 text-[13px] font-semibold text-[#201b18]">
              {v ?? <span className="font-normal text-[#a89f98]">{NO_DATA[lang]}</span>}
            </td>
          );
        })}
      </tr>
    );
  }

  const metrics = countries.map((c) => c[field as MetricKey]);
  const values = metrics.map((m) => (m.s !== "missing" && m.v != null ? m.v : null));
  const present = values.filter((v): v is number => v != null);
  const max = present.length ? Math.max(...present) : 0;
  const min = present.length ? Math.min(...present) : 0;
  const unit = field === "area" ? " km²" : "";
  const money = field === "gdp" || field === "gdpPerCapita" ? "$" : "";

  return (
    <>
      <tr className="border-t border-[#f3eee9]">
        <th scope="row" className="sticky left-0 bg-white px-2 py-2.5 align-top text-[12px] font-medium text-[#7d746e]">{label}</th>
        {countries.map((c, i) => {
          const f = formatMetric(c[field as MetricKey], lang);
          const v = values[i];
          const color = colorFor(i);
          return (
            <td key={c.iso3} className="px-2 py-2.5 align-top">
              <p className="text-[14px] font-extrabold tabular-nums text-[#201b18]" title={f.full ?? undefined}>
                {f.display}
                {f.full && <span className="sr-only"> ({f.full})</span>}
              </p>
              {f.year && <p className="text-[10px] text-[#a89f98]">{formatYear(f.year, lang)}</p>}
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f3eee9]">
                <div
                  className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${max > 0 && v != null ? Math.round((v / max) * 100) : 0}%`, backgroundColor: color.fill }}
                />
              </div>
            </td>
          );
        })}
      </tr>
      {/* 2개국이면 차이와 배율, 3~4개국이면 범위. 우열 표현은 쓰지 않는다. */}
      {present.length === countries.length && countries.length >= 2 && (
        <tr>
          <td />
          <td colSpan={countries.length} className="px-2 pb-2 text-[11px] text-[#a89f98]">
            {countries.length === 2
              ? `${t("difference", lang)} ${money}${abbreviate(Math.abs(present[0] - present[1]), lang)}${unit}` +
                (min > 0 ? ` · ${(max / min).toFixed(1)}${lang === "ko" ? "배" : "×"}` : "")
              : `${lang === "ko" ? "범위" : "Range"} ${money}${abbreviate(min, lang)}${unit} ~ ${money}${abbreviate(max, lang)}${unit}`}
          </td>
        </tr>
      )}
      {allowMissing && present.length < countries.length && (
        <tr>
          <td />
          <td colSpan={countries.length} className="px-2 pb-2 text-[11px] text-[#a89f98]">{t("noComparison", lang)}</td>
        </tr>
      )}
    </>
  );
}
