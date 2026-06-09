"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import { TEXTS } from "@/constants/texts";
import { completeMission, isMissionCompletedToday, markMissionCompletedToday } from "@/lib/missionHelpers";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS } from "@/constants/aiCategories";
import { Wand2 } from "lucide-react";



export default function AiToolsClient() {
  const t = TEXTS.aiTools;
  const { theme } = useTheme();
  const { session } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: "All",
    priceType: "all",
    sortBy: "rating",
  });
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => setMounted(true), []);

  // AI Tools 페이지 방문 미션 자동 완료
  useEffect(() => {
    if (mounted && session?.user) {
      const missionCode = "VISIT_AI_TOOLS";
      if (!isMissionCompletedToday(missionCode)) {
        completeMission(missionCode).then((success) => {
          if (success) {
            markMissionCompletedToday(missionCode);
          }
        });
      }
    }
  }, [mounted, session]);

  // 스크롤 스파이: Intersection Observer를 사용하여 현재 보이는 카테고리 감지
  const scrollSpyItems = DISPLAY_CATEGORIES.map(cat => ({
    sectionId: `category-${cat}`,
    menuId: cat,
  }));

  const activeCategoryFromSpy = useScrollSpy({
    items: scrollSpyItems,
    sectionRefs,
    threshold: 0.5, // 카테고리 섹션이 화면의 50% 이상 보일 때 활성화
    rootMargin: '-20% 0px -20% 0px', // 화면 중앙 60% 영역에서 감지
    mounted,
  });

  // 스크롤 스파이 결과를 activeCategory에 반영 (단, 전체보기 모드일 때만)
  useEffect(() => {
    if (mounted && activeCategoryFromSpy && filters.category === 'All') {
      setActiveCategory(activeCategoryFromSpy);
    }
  }, [mounted, activeCategoryFromSpy, filters.category]);

  const isDark = mounted && theme === 'dark';

  const handleCategoryClick = (category: string) => {
    // 이미 선택된 카테고리 클릭 시 선택 해제 (전체보기로 복귀)
    if (activeCategory === category) {
      setActiveCategory(null);
      setFilters(prev => ({ ...prev, category: "All" }));
      return;
    }

    // 새로운 카테고리 선택 (필터링 적용)
    setActiveCategory(category);
    setFilters(prev => ({ ...prev, category: category }));

    // 필터링된 리스트 상단으로 스크롤 보정 (선택 사항)
    // window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <main className="w-full min-h-screen">

      {/* 히어로 섹션 */}
      <section className="pt-8 pb-8 border-b border-neutral-100 dark:border-zinc-900">
        <div className="flex flex-col">
          <p className="text-[12px] font-semibold text-[#F9954E] mb-3">AI 도구</p>
          <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
            AI 도구 모음
          </h1>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed mb-7 break-keep">
            {t.heroSubtitle.ko}
          </p>

          {/* Quick Category Nav */}
          <div className="flex flex-wrap gap-2 mt-6">
            {DISPLAY_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors ${
                    isActive
                      ? "bg-[#F9954E] border-[#F9954E] text-white"
                      : "bg-white dark:bg-black border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {cat === "agent" && !isActive && <span className="mr-1">🆕</span>}
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>
      </section>



      {/* Tools List */}
      <section className="w-full pb-10 sm:pb-16">
        <AiToolsList filters={filters} sectionRefs={sectionRefs} />
      </section>

    </main>
  );
}
