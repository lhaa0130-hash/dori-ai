"use client";

// 국가 검색 (명세서 §8.1 · §15). ARIA combobox/listbox 패턴을 따르고 키보드만으로 완결된다.

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ContinentCode, CountryRecord, SupportedLanguage } from "@/lib/worldmap/types";
import { buildSearchIndex, searchCountries } from "@/lib/worldmap/search";
import { t } from "@/lib/worldmap/i18n";

interface Props {
  countries: CountryRecord[];
  lang: SupportedLanguage;
  continent: ContinentCode | null;
  onSelect: (iso3: string) => void;
  /** 비교 국가를 고르는 중이면 문구가 달라진다. */
  mode?: "select" | "compare";
}

export default function SearchBox({ countries, lang, continent, onSelect, mode = "select" }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  // 입력마다 index 를 다시 만들지 않는다(명세서 §14).
  const index = useMemo(() => buildSearchIndex(countries), [countries]);
  const byIso = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchCountries(index, query, continent).map((iso3) => byIso.get(iso3)!).filter(Boolean);
  }, [index, query, continent, byIso]);

  useEffect(() => { setActive(0); }, [query, continent]);

  // 바깥을 누르면 닫는다
  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const choose = (iso3: string) => {
    onSelect(iso3);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => (i + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setActive((i) => (i - 1 + results.length) % results.length); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const picked = results[active];
      if (picked) choose(picked.iso3);
    }
  };

  const label = mode === "compare" ? t("compareWith", lang) : t("searchLabel", lang);
  const showList = open && query.trim().length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">{label}</label>
      <input
        id={`${listId}-input`}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${listId}-list`}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-opt-${results[active].iso3}` : undefined}
        autoComplete="off"
        value={query}
        placeholder={mode === "compare" ? t("compareWith", lang) : t("searchPlaceholder", lang)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-xl border border-[#ece6e0] bg-white px-4 py-3 text-[15px] text-[#201b18] outline-none transition placeholder:text-[#a89f98] focus-visible:border-[#ff9966] focus-visible:ring-2 focus-visible:ring-[#ff9966]/40"
      />

      {showList && (
        <ul
          id={`${listId}-list`}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-[#ece6e0] bg-white py-1 shadow-lg"
        >
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-[#7d746e]">{t("noResults", lang)}</li>
          )}
          {results.map((c, i) => (
            <li
              key={c.iso3}
              id={`${listId}-opt-${c.iso3}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              // mousedown 은 입력 포커스만 지키고, 선택은 click 에서 한다.
              // mousedown 에서 바로 고르면 목록이 그 자리에서 사라져 click 이 끝나지 못한다.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(c.iso3)}
              className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 text-[15px] ${
                i === active ? "bg-[#fff0e6] text-[#201b18]" : "text-[#40382f]"
              }`}
            >
              <span className="font-medium">{lang === "ko" ? c.nameKo : c.nameEn}</span>
              <span className="text-xs text-[#7d746e]">{lang === "ko" ? c.nameEn : c.nameKo}</span>
              <span className="ml-auto font-mono text-[11px] text-[#a89f98]">{c.iso3}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
