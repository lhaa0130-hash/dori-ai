import { TEXTS } from "@/constants/texts";

interface CommunityFiltersProps {
  sort: "newest" | "likes";
  setSort: (sort: "newest" | "likes") => void;
}

export default function CommunityFilters({ sort, setSort }: CommunityFiltersProps) {
  const t = TEXTS.communityPage.filters;
  const tSort = TEXTS.communityPage.sortOptions;

  const selectClass = "px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition-all cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:border-gray-400 dark:hover:border-gray-500";

  return (
    <div className="flex flex-col md:flex-row justify-end items-center gap-4 mb-8">
      {/* 정렬 셀렉트 */}
      <select 
        value={sort} 
        onChange={(e) => setSort(e.target.value as "newest" | "likes")}
        className={selectClass}
      >
        <option value="newest">{t.sort.ko}: {tSort.newest.ko}</option>
        <option value="likes">{t.sort.ko}: {tSort.likes.ko}</option>
      </select>
    </div>
  );
}