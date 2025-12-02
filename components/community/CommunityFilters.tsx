import { TEXTS } from "@/constants/texts";
import { CommunityTag } from "./CommunityCard";

interface CommunityFiltersProps {
  filterTag: CommunityTag | "All";
  setFilterTag: (tag: CommunityTag | "All") => void;
  sort: "newest" | "likes";
  setSort: (sort: "newest" | "likes") => void;
}

export default function CommunityFilters({ filterTag, setFilterTag, sort, setSort }: CommunityFiltersProps) {
  const t = TEXTS.communityPage.filters;
  const tSort = TEXTS.communityPage.sortOptions;

  const tags: (CommunityTag | "All")[] = ["All", "질문", "정보", "자랑", "잡담"];

  const selectClass = "px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition-all cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:border-gray-400 dark:hover:border-gray-500";

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
      
      {/* 태그 필터 (버튼형) */}
      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setFilterTag(tag)}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
              filterTag === tag 
                ? "bg-blue-500 border-blue-500 text-white" 
                : "bg-transparent border-[var(--card-border)] text-[var(--text-sub)] hover:bg-gray-100 dark:hover:bg-white/10"
            }`}
          >
            {tag === "All" ? t.all.ko : tag}
          </button>
        ))}
      </div>

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