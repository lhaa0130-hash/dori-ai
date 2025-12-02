import { TEXTS } from "@/constants/texts";

interface AcademyFiltersProps {
  filters: {
    level: string;
    category: string;
  };
  setFilters: (newFilters: any) => void;
}

export default function AcademyFilters({ filters, setFilters }: AcademyFiltersProps) {
  const t = TEXTS.academy.filters;

  const handleChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const selectClass = "px-4 py-2.5 rounded-xl border outline-none text-sm font-medium transition-all cursor-pointer bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:border-gray-400 dark:hover:border-gray-500 w-full md:w-auto";

  return (
    <div className="flex flex-col md:flex-row justify-center gap-4 mb-10">
      
      {/* 1. 난이도 필터 */}
      <select 
        value={filters.level} 
        onChange={(e) => handleChange("level", e.target.value)}
        className={selectClass}
      >
        <option value="All">{t.level.ko}: {t.all.ko}</option>
        <option value="초급">초급 (Beginner)</option>
        <option value="중급">중급 (Intermediate)</option>
        <option value="고급">고급 (Advanced)</option>
      </select>

      {/* 2. 카테고리 필터 */}
      <select 
        value={filters.category} 
        onChange={(e) => handleChange("category", e.target.value)}
        className={selectClass}
      >
        <option value="All">{t.category.ko}: {t.all.ko}</option>
        <option value="프롬프트">프롬프트 (Prompt)</option>
        <option value="이미지">이미지 (Image)</option>
        <option value="영상">영상 (Video)</option>
        <option value="자동화">자동화 (Automation)</option>
        <option value="음성">음성 (Voice)</option>
        <option value="기타">기타 (Other)</option>
      </select>

    </div>
  );
}