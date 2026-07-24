"use client";

// My World — 가구 팔레트(카테고리 탭 + 간단 이름 검색 + 그리드). (05-05)
//  외부 debounce/검색 패키지 없이 client-side filter. atLimit 이면 추가 비활성 + 안내.
import { useMemo, useState } from "react";
import { useRoom } from "@/contexts/RoomContext";
import RoomItemCard from "@/components/my-world/room/RoomItemCard";
import { getRoomItemsByCategory } from "@/lib/myWorld/room/registry";
import { MAX_PLACED_ITEMS, ROOM_CATEGORIES } from "@/lib/myWorld/room/constants";
import type { RoomItemCategory } from "@/lib/myWorld/room/types";

export default function RoomItemPalette() {
  const { addItem, atLimit, itemCount } = useRoom();
  const [category, setCategory] = useState<RoomItemCategory | "all">("all");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const base = getRoomItemsByCategory(category);
    const q = query.trim().toLowerCase();
    return q ? base.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) : base;
  }, [category, query]);

  return (
    <div className="flex h-full flex-col">
      {/* 상단: 개수 + 검색 */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[12px] font-bold text-stone-500 dark:text-stone-400">
          가구 <span className={atLimit ? "text-red-500" : "text-stone-800 dark:text-white"}>{itemCount}</span> / {MAX_PLACED_ITEMS}
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 검색"
          aria-label="가구 이름 검색"
          className="h-8 w-28 rounded-lg border border-stone-200 bg-white px-2.5 text-[12px] outline-none focus:border-[#F9954E] dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </div>

      {atLimit && (
        <p className="mb-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 dark:bg-red-500/10">
          최대 {MAX_PLACED_ITEMS}개까지 배치할 수 있어요. 가구를 삭제한 뒤 추가해주세요.
        </p>
      )}

      {/* 카테고리 탭 */}
      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        {ROOM_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            aria-pressed={category === c.key}
            className={[
              "flex-none rounded-full px-3 py-1.5 text-[12px] font-bold transition",
              category === c.key ? "bg-[#F9954E] text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-zinc-800 dark:text-stone-300",
            ].join(" ")}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 그리드 */}
      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl bg-stone-50 py-8 text-[12px] font-semibold text-stone-400 dark:bg-zinc-900/60">
          검색 결과가 없어요
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {items.map((def) => (
            <RoomItemCard key={def.id} def={def} onAdd={addItem} disabled={atLimit} />
          ))}
        </div>
      )}
    </div>
  );
}
