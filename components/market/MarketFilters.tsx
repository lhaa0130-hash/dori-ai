import { TEXTS } from "@/constants/texts";

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

  const selectClass = "px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition-all cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:border-gray-400 dark:hover:border-gray-500 w-full md:w-auto";

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      
      {/* 1. 카테고리 필터 */}
      <select 
        value={filters.category} 
        onChange={(e) => handleChange("category", e.target.value)}
        className={selectClass}
      >
        <option value="All">{t.category.ko}: {t.all.ko}</option>
        <option value="프롬프트">프롬프트</option>
        <option value="이미지">이미지</option>
        <option value="영상">영상</option>
        <option value="템플릿">템플릿</option>
        <option value="워크플로우">워크플로우</option>
        <option value="기타">기타</option>
      </select>

      {/* 2. 가격 필터 */}
      <select 
        value={filters.price} 
        onChange={(e) => handleChange("price", e.target.value)}
        className={selectClass}
      >
        <option value="All">{t.price.ko}: {t.all.ko}</option>
        <option value="free">무료</option>
        <option value="paid">유료</option>
      </select>

      {/* 3. 정렬 */}
      <select 
        value={filters.sort} 
        onChange={(e) => handleChange("sort", e.target.value)}
        className={`${selectClass} md:ml-auto`}
      >
        <option value="newest">{t.sort.ko}: 최신순</option>
        <option value="rating">{t.sort.ko}: 평점순</option>
        <option value="name">{t.sort.ko}: 이름순</option>
      </select>
    </div>
  );
}