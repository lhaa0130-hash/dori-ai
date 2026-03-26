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
    <main
      className="w-full min-h-screen relative overflow-x-hidden bg-white dark:!bg-black transition-colors duration-500"
      style={{
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 배경 그라데이션 (Standard) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:hidden pointer-events-none z-0" />



      {/* 히어로 섹션 (Standard) */}
      <section className="relative pt-20 pb-8 px-6 text-center z-10">
        <div className="max-w-xl mx-auto animate-fade-in flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
            <Wand2 className="w-3 h-3" />
            <span>AI Tool Collection</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              AI 도구
            </span>
          </h1>

          <p className={`text-base md:text-lg font-medium break-keep leading-relaxed max-w-xl ${isDark ? "text-white" : "text-neutral-600"}`}>
            {t.heroSubtitle.ko}
          </p>

          {/* Quick Category Nav */}
          <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-4xl">
            {DISPLAY_CATEGORIES.map((cat) => {
              const isAgent = cat === "agent";
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                    isActive
                      ? "bg-[#F9954E] border-[#F9954E] text-white"
                      : isAgent
                        ? isDark
                          ? "bg-orange-950/40 border-orange-500/60 text-orange-400 hover:bg-orange-500 hover:border-orange-500 hover:text-white"
                          : "bg-orange-50 border-orange-400 text-orange-600 hover:bg-[#F9954E] hover:border-[#F9954E] hover:text-white"
                        : isDark
                          ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-[#F9954E]/50 hover:text-white"
                          : "bg-white border-neutral-200 text-neutral-600 hover:border-[#F9954E]/50 hover:text-neutral-900"
                  }`}
                >
                  {isAgent && !isActive && <span className="mr-1">🆕</span>}
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>
      </section>



      {/* Tools List */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-16">
        <AiToolsList filters={filters} sectionRefs={sectionRefs} />
      </section>

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main >
  );
}
