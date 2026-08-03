"use client";

// 세계 랭킹 화면 (지시서 §8).
//
// 원칙:
//   · 순위 숫자만 크게 두지 않는다. 실제 값·단위·기준 연도·출처를 항상 함께 보여준다.
//   · 순위가 우열을 뜻하지 않으므로 트로피·시상대를 쓰지 않는다.
//   · 자료가 없으면 순위에서 빼고, 그 사실을 분모와 함께 알린다.

import { useMemo } from "react";
import type { ContinentCode, CountryDataset, CountryRecord, SupportedLanguage } from "@/lib/worldmap/types";
import { CONTINENTS } from "@/lib/worldmap/types";
import {
  buildRanking, rankOf, RANKING_METRICS, CATEGORY_LABEL,
  type RankingMetricId, type RankingCategory,
} from "@/lib/worldmap/ranking";
import { abbreviate, fullNumber } from "@/lib/worldmap/format";
import { colorFor } from "@/lib/worldmap/comparison";
import { Flag } from "./CountryDetail";

interface Props {
  dataset: CountryDataset;
  lang: SupportedLanguage;
  metricId: RankingMetricId;
  continent: ContinentCode | null;
  order: "desc" | "asc";
  showAll: boolean;
  /** 지도에서 고른 나라 — 목록에서 강조하고, TOP 10 밖이면 하단에 고정 표시한다. */
  selectedIso3: string | null;
  hoveredIso3: string | null;
  onMetric: (id: RankingMetricId) => void;
  onContinent: (c: ContinentCode | null) => void;
  onOrder: (o: "desc" | "asc") => void;
  onShowAll: (v: boolean) => void;
  onPick: (iso3: string) => void;
  onHover: (iso3: string | null) => void;
  onCompare: (iso3: string) => void;
}

/** 지표 성격에 맞게 값을 읽기 좋게 만든다. 축약값 옆에는 전체 숫자를 남긴다. */
function formatValue(v: number, unit: string, lang: SupportedLanguage): { display: string; full: string } {
  if (unit === "US$") return { display: `$${abbreviate(v, lang)}`, full: `$${fullNumber(v, lang)}` };
  if (unit === "명") return { display: lang === "ko" ? `${abbreviate(v, "ko")} 명` : abbreviate(v, "en"), full: fullNumber(v, lang) };
  if (unit === "km²" || unit === "명/km²") return { display: `${fullNumber(v, lang)} ${unit}`, full: `${fullNumber(v, lang)} ${unit}` };
  if (unit === "개국") return { display: `${v}${lang === "ko" ? "개국" : ""}`, full: String(v) };
  // 퍼센트·년·‰·t 처럼 자릿수가 작은 값은 소수 한 자리까지
  const rounded = Math.round(v * 10) / 10;
  return { display: `${rounded}${unit}`, full: `${v}` };
}

export default function RankingPanel({
  dataset, lang, metricId, continent, order, showAll,
  selectedIso3, hoveredIso3, onMetric, onContinent, onOrder, onShowAll, onPick, onHover, onCompare,
}: Props) {
  const result = useMemo(
    () => buildRanking(dataset.countries, metricId, { continent, order }),
    [dataset.countries, metricId, continent, order],
  );

  const metric = result.metric;
  const label = lang === "ko" ? metric.koLabel : metric.enLabel;
  const description = lang === "ko" ? metric.koDescription : metric.enDescription;
  const rows = showAll ? result.rows : result.rows.slice(0, 10);
  const selectedRow = selectedIso3 ? rankOf(result, selectedIso3) : null;
  const selectedOutsideTop = selectedRow && selectedRow.rank > rows.length;
  const maxValue = result.rows.length ? Math.abs(result.rows[0].value) : 0;

  const scopeName = continent
    ? (lang === "ko"
        ? dataset.countries.find((c) => c.continentCode === continent)?.continentKo
        : dataset.countries.find((c) => c.continentCode === continent)?.continentEn) ?? continent
    : (lang === "ko" ? "전 세계" : "World");

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-[13px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9966] ${
      on ? "border-[#ff9966] bg-[#fff0e6] text-[#f47f45]" : "border-[#ece6e0] bg-white text-[#7d746e] hover:border-[#d9d0c8]"
    }`;

  const byCategory = useMemo(() => {
    const m = new Map<RankingCategory, typeof RANKING_METRICS>();
    for (const x of RANKING_METRICS) {
      if (!m.has(x.category)) m.set(x.category, []);
      m.get(x.category)!.push(x);
    }
    return [...m.entries()];
  }, []);

  const source = dataset.sources["world-bank"] ?? Object.values(dataset.sources)[0];

  return (
    <section aria-label={lang === "ko" ? "세계 랭킹" : "World ranking"} className="rounded-2xl border border-[#ece6e0] bg-white p-5">
      {/* 지표 고르기 */}
      <div className="space-y-2">
        {byCategory.map(([cat, list]) => (
          <div key={cat} className="flex flex-wrap items-center gap-1.5">
            <span className="w-20 shrink-0 text-[12px] font-medium text-[#a89f98]">{CATEGORY_LABEL[cat][lang]}</span>
            {list.map((m) => (
              <button key={m.metricId} type="button" onClick={() => onMetric(m.metricId)}
                aria-pressed={m.metricId === metricId} className={chip(m.metricId === metricId)}>
                {lang === "ko" ? m.koLabel : m.enLabel}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 제목·설명·출처 */}
      <header className="mt-4 border-t border-[#f3eee9] pt-4">
        <h2 className="text-[20px] font-extrabold text-[#201b18]">
          {scopeName} · {label} {order === "desc" ? (lang === "ko" ? "높은 순" : "highest") : (lang === "ko" ? "낮은 순" : "lowest")}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#7d746e]">{description}</p>
        <p className="mt-1 text-[11px] text-[#a89f98]">
          {lang === "ko" ? "자료가 있는" : "Based on"} {result.eligibleCountryCount}
          {lang === "ko" ? "개국 기준" : " countries with data"}
          {result.missingIso3.length > 0 && ` · ${lang === "ko" ? "자료 없음" : "no data"} ${result.missingIso3.length}`}
          {result.years.length > 0 && ` · ${lang === "ko" ? "기준" : "as of"} ${result.years.length === 1 ? result.years[0] : `${result.years[0]}–${result.years[result.years.length - 1]}`}`}
          {source && (
            <>
              {" · "}
              <a href={source.url} target="_blank" rel="noreferrer noopener" className="underline decoration-dotted">{source.label}</a>
            </>
          )}
        </p>
        {result.years.length > 1 && (
          <p className="mt-1 text-[11px] font-semibold text-[#b6792e]">
            {lang === "ko"
              ? "나라마다 최신 자료의 연도가 달라 여러 해가 섞여 있어요."
              : "Countries report in different years, so this ranking mixes years."}
          </p>
        )}
      </header>

      {/* 범위·정렬·개수 */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => onContinent(null)} aria-pressed={continent === null} className={chip(continent === null)}>
            {lang === "ko" ? "전 세계" : "World"}
          </button>
          {CONTINENTS.map((code) => {
            const sample = dataset.countries.find((c) => c.continentCode === code);
            return (
              <button key={code} type="button" onClick={() => onContinent(continent === code ? null : code)}
                aria-pressed={continent === code} className={chip(continent === code)}>
                {lang === "ko" ? sample?.continentKo ?? code : sample?.continentEn ?? code}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onOrder(order === "desc" ? "asc" : "desc")} className={chip(false)}>
            {order === "desc" ? (lang === "ko" ? "↓ 높은 순" : "↓ Highest") : (lang === "ko" ? "↑ 낮은 순" : "↑ Lowest")}
          </button>
          <button type="button" onClick={() => onShowAll(!showAll)} aria-pressed={showAll} className={chip(showAll)}>
            {showAll ? (lang === "ko" ? "TOP 10만" : "TOP 10") : (lang === "ko" ? "전체 보기" : "Show all")}
          </button>
        </div>
      </div>

      {/* 순위 목록 */}
      <ol className="mt-4 space-y-1.5">
        {rows.map((row) => {
          const f = formatValue(row.value, metric.unit, lang);
          const width = maxValue > 0 ? Math.max(2, Math.round((Math.abs(row.value) / maxValue) * 100)) : 0;
          const isSel = row.iso3 === selectedIso3;
          const isHover = row.iso3 === hoveredIso3;
          const top3 = row.rank <= 3;
          return (
            <li key={row.iso3}>
              <div
                onMouseEnter={() => onHover(row.iso3)}
                onMouseLeave={() => onHover(null)}
                className={`rounded-xl border p-2.5 transition ${
                  isSel ? "border-[#ff9966] bg-[#fff8f3]" : isHover ? "border-[#d9d0c8] bg-[#faf7f4]" : "border-[#f3eee9] bg-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 shrink-0 text-right tabular-nums ${top3 ? "text-[18px] font-extrabold text-[#f47f45]" : "text-[14px] font-bold text-[#7d746e]"}`}>
                    {row.rank}
                  </span>
                  <Flag country={row.country} size={top3 ? 30 : 24} />
                  <button
                    type="button"
                    onClick={() => onPick(row.iso3)}
                    className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff9966]"
                  >
                    <span className={`block truncate font-bold text-[#201b18] ${top3 ? "text-[16px]" : "text-[14px]"}`}>
                      {lang === "ko" ? row.country.nameKo : row.country.nameEn}
                    </span>
                  </button>
                  <span className="shrink-0 text-right">
                    <span className={`block tabular-nums font-extrabold text-[#201b18] ${top3 ? "text-[17px]" : "text-[14px]"}`} title={f.full}>
                      {f.display}
                    </span>
                    {row.year && <span className="block text-[10px] text-[#a89f98]">{lang === "ko" ? "기준" : "as of"} {row.year}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCompare(row.iso3)}
                    aria-label={`${lang === "ko" ? row.country.nameKo : row.country.nameEn} ${lang === "ko" ? "비교에 추가" : "add to compare"}`}
                    className="shrink-0 rounded-lg border border-[#ece6e0] px-2 py-1 text-[11px] font-semibold text-[#7d746e] transition hover:border-[#ff9966] hover:text-[#f47f45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff9966]"
                  >
                    +
                  </button>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#f3eee9]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${width}%`, backgroundColor: top3 ? colorFor(row.rank - 1).fill : "#d9d0c8" }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {rows.length === 0 && (
        <p className="mt-4 rounded-xl bg-[#f8f4f0] px-4 py-3 text-[13px] text-[#7d746e]">
          {lang === "ko" ? "이 범위에는 자료가 있는 나라가 없어요." : "No countries with data in this scope."}
        </p>
      )}

      {/* 선택 국가가 목록 밖이면 하단에 고정 표시 */}
      {selectedOutsideTop && selectedRow && (
        <div className="mt-3 rounded-xl border border-[#ff9966] bg-[#fff8f3] p-2.5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 shrink-0 text-right text-[14px] font-bold tabular-nums text-[#f47f45]">{selectedRow.rank}</span>
            <Flag country={selectedRow.country} size={24} />
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#201b18]">
              {lang === "ko" ? selectedRow.country.nameKo : selectedRow.country.nameEn}
            </span>
            <span className="shrink-0 text-[14px] font-extrabold tabular-nums text-[#201b18]">
              {formatValue(selectedRow.value, metric.unit, lang).display}
            </span>
          </div>
          <p className="mt-1 pl-[42px] text-[11px] text-[#7d746e]">
            {lang === "ko"
              ? `${scopeName}에서 ${label}이 ${selectedRow.rank}번째예요. (자료가 있는 ${result.eligibleCountryCount}개국 기준)`
              : `${selectedRow.rank} of ${result.eligibleCountryCount} countries with data in ${scopeName}.`}
          </p>
        </div>
      )}

      {/* 자료 없어 제외된 나라 */}
      {selectedIso3 && !selectedRow && (
        <p className="mt-3 rounded-xl bg-[#f8f4f0] px-4 py-3 text-[13px] text-[#7d746e]">
          {lang === "ko"
            ? `선택한 나라는 ${label} 자료가 없어 순위에 넣지 않았어요.`
            : `The selected country has no ${label} data, so it is not ranked.`}
        </p>
      )}
    </section>
  );
}
