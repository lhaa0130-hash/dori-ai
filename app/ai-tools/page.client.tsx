"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import { TEXTS } from "@/constants/texts";
import { completeMission, isMissionCompletedToday, markMissionCompletedToday } from "@/lib/missionHelpers";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS } from "@/constants/aiCategories";



export default function AiToolsClient() {
  const t = TEXTS.aiTools;
  const { theme } = useTheme();
  const { data: session } = useSession();
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

  // 스크롤 스파이 결과를 activeCategory에 반영
  useEffect(() => {
    if (mounted && activeCategoryFromSpy) {
      setActiveCategory(activeCategoryFromSpy);
    }
  }, [mounted, activeCategoryFromSpy]);

  const isDark = mounted && theme === 'dark';

  const handleCategoryClick = (category: string) => {
    if (category === "all") {
      setActiveCategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveCategory(category === activeCategory ? null : category);

    // ref 키는 "category-{cat}" 형식
    const refKey = `category-${category}`;
    const element = sectionRefs.current[refKey];

    if (element) {
      // 헤더 높이를 고려한 스크롤
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <main
      className="w-full min-h-screen relative overflow-x-hidden bg-white dark:!bg-black transition-colors duration-500"
      style={{
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 배경 그라데이션 (Standard) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:hidden pointer-events-none z-0" />



      {/* 히어로 섹션 (Standard) */}
      <section className="relative pt-32 pb-16 px-6 text-center z-10">
        <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span>AI Tool Collection</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-neutral-900 dark:text-white">
            AI 도구
          </h1>

          <p className={`text-base md:text-lg font-medium break-keep leading-relaxed max-w-xl ${isDark ? "text-white" : "text-neutral-600"}`}>
            {t.heroSubtitle.ko}
          </p>

          {/* Quick Category Nav */}
          <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-4xl">
            {DISPLAY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${activeCategory === cat
                  ? "bg-orange-500 border-orange-500 text-white"
                  : isDark
                    ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-orange-500/50 hover:text-white"
                    : "bg-white border-neutral-200 text-neutral-600 hover:border-orange-500/50 hover:text-neutral-900"
                  }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
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
