"use client";

// My World — 대표 캐릭터 선택 모달(공용). (05-03)
//  ⚠️ 잠금 정책 없음 — 12종 모두 선택 가능. 검색·정렬·희귀도·설명·선택표시·선택 애니메이션.
//     선택만 담당(성장/의상/표정/포즈/AI 없음).
import { useEffect, useMemo, useState } from "react";
import type { Character } from "@/lib/myWorld/character/types";
import { getAllCharacters, getCharacter } from "@/lib/myWorld/character/registry";
import {
  RARITY_STYLE,
  searchCharacters,
  sortCharacters,
  themeTint,
  type CharacterSort,
} from "@/lib/myWorld/character/utils";
import CharacterAvatar from "@/components/my-world/CharacterAvatar";

const SORTS: { key: CharacterSort; label: string }[] = [
  { key: "default", label: "기본" },
  { key: "name", label: "이름" },
  { key: "rarity", label: "희귀도" },
];

export default function CharacterSelectModal({
  open,
  onClose,
  selectedId,
  saving,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  selectedId: string;
  saving?: boolean;
  onSelect: (characterId: string) => void; // 12종 모두 선택 가능
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CharacterSort>("default");

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  useEffect(() => { if (open) { setQuery(""); setSort("default"); } }, [open]);

  const list: Character[] = useMemo(
    () => sortCharacters(searchCharacters(getAllCharacters(), query), sort),
    [query, sort]
  );
  const selected = getCharacter(selectedId);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="대표 캐릭터 선택"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-white dark:bg-zinc-950 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-[17px] font-extrabold text-stone-900 dark:text-white">대표 캐릭터 선택</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 dark:bg-zinc-800 dark:text-stone-400"
          >
            ✕
          </button>
        </div>

        {/* 검색 + 정렬 */}
        <div className="flex items-center gap-2 px-5 pt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="캐릭터 검색 (이름·종)"
            aria-label="캐릭터 검색"
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-[13px] outline-none focus:border-[#F9954E] dark:border-zinc-700 dark:bg-zinc-900 dark:text-stone-200"
          />
          <div className="flex flex-shrink-0 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-zinc-800">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                  sort === s.key ? "bg-white text-[#F9954E] shadow-sm dark:bg-zinc-950" : "text-stone-400"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 그리드 */}
        <div className="grid grid-cols-3 gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-4">
          {list.map((c) => {
            const isSel = c.id === selectedId;
            const rarity = RARITY_STYLE[c.rarity];
            return (
              <button
                key={c.id}
                type="button"
                disabled={saving}
                onClick={() => onSelect(c.id)}
                aria-label={`${c.name} 선택${isSel ? " (현재 대표)" : ""}`}
                aria-pressed={isSel}
                className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-all duration-200 active:scale-95 ${
                  isSel
                    ? "border-2 shadow-md"
                    : "border-stone-100 bg-stone-50 hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900/60"
                }`}
                style={isSel ? { borderColor: c.themeColor, backgroundColor: themeTint(c.themeColor, "14") } : undefined}
              >
                <span className="absolute left-2 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: rarity.color }} title={rarity.label} />
                {isSel && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white" style={{ backgroundColor: c.themeColor }}>✓</span>
                )}
                <CharacterAvatar character={c} size={56} />
                <span className="text-[12px] font-bold text-stone-800 dark:text-stone-200">{c.name}</span>
                <span className="text-[10px]" style={{ color: rarity.color }}>{rarity.label}</span>
              </button>
            );
          })}
          {list.length === 0 && (
            <div className="col-span-full py-8 text-center text-[13px] text-stone-400">검색 결과가 없어요.</div>
          )}
        </div>

        {/* 선택 캐릭터 설명 */}
        <div className="border-t border-stone-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <CharacterAvatar character={selected} size={44} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-extrabold text-stone-900 dark:text-white">{selected.name}</span>
                <span className="text-[11px] font-bold" style={{ color: RARITY_STYLE[selected.rarity].color }}>
                  {RARITY_STYLE[selected.rarity].label}
                </span>
              </div>
              <p className="truncate text-[12px] text-stone-500 dark:text-stone-400">{selected.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
