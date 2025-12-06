import React from "react";
import { TEXTS } from "@/constants/texts";

interface AiToolsFiltersProps {
  filters: {
    category: string;
    // price 제거됨
    sort: string;
  };
  setFilters: (newFilters: any) => void;
}

const AiToolsFilters = React.memo(({ filters, setFilters }: AiToolsFiltersProps) => {
  const t = TEXTS.aiTools.filters;

  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const selectClass = "px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition-all cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:border-gray-400 dark:hover:border-gray-500 w-full md:w-auto";

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
      {/* 1. 카테고리 필터 */}
      <select 
        value={filters.category} 
        onChange={(e) => handleChange("category", e.target.value)}
        className={selectClass}
      >
        <option value="All">{t.category.ko}: {t.all.ko}</option>
        <option value="LLM">LLM (Chat)</option>
        <option value="Image">Image Gen</option>
        <option value="Video">Video Gen</option>
        <option value="Voice">Voice / Audio</option>
        <option value="Automation">Automation</option>
        <option value="Search">Search</option>
        <option value="Other">Other</option>
      </select>

      {/* 3. 정렬 */}
      <select 
        value={filters.sort} 
        onChange={(e) => handleChange("sort", e.target.value)}
        className={`${selectClass} md:ml-auto`}
      >
        <option value="rating">{t.sortBy.ko}: 평점순</option>
        <option value="name">{t.sortBy.ko}: 이름순</option>
      </select>
    </div>
  );
});

export default AiToolsFilters;