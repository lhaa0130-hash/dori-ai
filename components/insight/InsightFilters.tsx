import { TEXTS } from "@/constants/texts";

interface InsightFiltersProps {
  filters: {
    category: string;
    tag: string | null;
    sort: string;
  };
  setFilters: (newFilters: any) => void;
}

export default function InsightFilters({ filters, setFilters }: InsightFiltersProps) {
  const t = TEXTS.insight.filters;
  const tSort = TEXTS.insight.sortOptions;

  const handleChange = (key: string, value: string | null) => {
    setFilters({ ...filters, [key]: value });
  };

  const selectClass = "px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition-all cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:border-gray-400 dark:hover:border-gray-500";

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center">
      
      {/* 1. 카테고리 필터 */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <select 
          value={filters.category} 
          onChange={(e) => handleChange("category", e.target.value)}
          className={`w-full md:w-auto ${selectClass}`}
        >
          <option value="All">{t.category.ko}: {t.all.ko}</option>
          <option value="트렌드">트렌드</option>
          <option value="큐레이션">큐레이션</option>
          <option value="가이드">가이드</option>
          <option value="리포트">리포트</option>
          <option value="분석">분석</option>
        </select>
      </div>

      {/* 2. 활성화된 태그 표시 (태그가 선택되었을 때만 보임) */}
      {filters.tag && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 animate-fadeIn">
          <span className="text-sm text-blue-600 dark:text-blue-300 font-bold">
            #{filters.tag}
          </span>
          <button 
            onClick={() => handleChange("tag", null)}
            className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
            title={t.resetTag.ko}
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. 정렬 (우측 정렬) */}
      <select 
        value={filters.sort} 
        onChange={(e) => handleChange("sort", e.target.value)}
        className={`${selectClass} md:ml-auto w-full md:w-auto`}
      >
        <option value="newest">{t.sort.ko}: {tSort.newest.ko}</option>
        <option value="popular">{t.sort.ko}: {tSort.popular.ko}</option>
      </select>
    </div>
  );
}