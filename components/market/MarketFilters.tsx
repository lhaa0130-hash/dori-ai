"use client";

import { TEXTS } from "@/constants/texts";
import { ChevronDown, Filter, Tag, DollarSign, ArrowUpDown } from "lucide-react";

interface MarketFiltersProps {
  filters: {
    category: string;
    price: string;
    sort: string;
  };
  setFilters: (newFilters: any) => void;
}

export default function MarketFilters({ filters, setFilters }: MarketFiltersProps) {
  const t = TEXTS.market.filters;

  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const selectWrapperClass = "relative group min-w-[140px]";
  const selectClass = "w-full appearance-none pl-10 pr-10 py-3 rounded-xl border outline-none text-sm font-bold transition-all cursor-pointer bg-white dark:bg-zinc-900/50 border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-200 hover:border-[#F9954E] hover:text-[#F9954E] focus:border-[#F9954E] focus:ring-4 focus:ring-[#F9954E]/10";
  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-hover:text-[#F9954E] transition-colors pointer-events-none";
  const chevronClass = "absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-hover:text-[#F9954E] transition-colors pointer-events-none";

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">

      {/* 1. 카테고리 필터 */}
      <div className={selectWrapperClass}>
        <Tag className={iconClass} />
        <select
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className={selectClass}
        >
          <option value="All">{t.all.ko}</option>
          <option value="프롬프트">프롬프트</option>
          <option value="이미지">이미지</option>
          <option value="영상">영상</option>
          <option value="템플릿">템플릿</option>
          <option value="워크플로우">워크플로우</option>
          <option value="기타">기타</option>
        </select>
        <ChevronDown className={chevronClass} />
      </div>

      {/* 2. 가격 필터 */}
      <div className={selectWrapperClass}>
        <DollarSign className={iconClass} />
        <select
          value={filters.price}
          onChange={(e) => handleChange("price", e.target.value)}
          className={selectClass}
        >
          <option value="All">{t.all.ko}</option>
          <option value="free">무료</option>
          <option value="paid">유료</option>
        </select>
        <ChevronDown className={chevronClass} />
      </div>

      {/* 3. 정렬 */}
      <div className={`${selectWrapperClass} md:ml-auto`}>
        <ArrowUpDown className={iconClass} />
        <select
          value={filters.sort}
          onChange={(e) => handleChange("sort", e.target.value)}
          className={selectClass}
        >
          <option value="newest">최신순</option>
          <option value="rating">평점순</option>
          <option value="name">이름순</option>
        </select>
        <ChevronDown className={chevronClass} />
      </div>
    </div>
  );
}