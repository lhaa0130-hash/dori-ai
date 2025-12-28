import { TEXTS } from "@/constants/texts";

interface SuggestionFiltersProps {
  filters: {
    type: string;
    priority: string;
    sort: string;
  };
  setFilters: (newFilters: any) => void;
}

export default function SuggestionFilters({ filters, setFilters }: SuggestionFiltersProps) {
  const t = (TEXTS && TEXTS.suggestions && TEXTS.suggestions.filters) ? TEXTS.suggestions.filters : {
    type: { ko: "유형" },
    priority: { ko: "우선순위" },
    sort: { ko: "정렬" },
    all: { ko: "전체" }
  };

  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const selectClass = "px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition-all cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:border-gray-400 dark:hover:border-gray-500 w-full md:w-auto";

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      
      {/* 1. 유형 필터 */}
      <select 
        value={filters.type} 
        onChange={(e) => handleChange("type", e.target.value)}
        className={selectClass}
      >
        <option value="All">{t.type.ko}: {t.all.ko}</option>
        <option value="버그 제보">버그 제보</option>
        <option value="기능 요청">기능 요청</option>
        <option value="UI/디자인">UI/디자인</option>
        <option value="기타">기타</option>
      </select>

      {/* 2. 우선순위 필터 */}
      <select 
        value={filters.priority} 
        onChange={(e) => handleChange("priority", e.target.value)}
        className={selectClass}
      >
        <option value="All">{t.priority.ko}: {t.all.ko}</option>
        <option value="높음">높음</option>
        <option value="보통">보통</option>
        <option value="낮음">낮음</option>
      </select>

      {/* 3. 정렬 */}
      <select 
        value={filters.sort} 
        onChange={(e) => handleChange("sort", e.target.value)}
        className={`${selectClass} md:ml-auto`}
      >
        <option value="newest">{t.sort.ko}: 최신순</option>
        <option value="priority">{t.sort.ko}: 우선순위 높은순</option>
      </select>
    </div>
  );
}