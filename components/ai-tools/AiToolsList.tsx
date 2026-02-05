"use client";

import { useState, useEffect } from "react";
import AiToolsCard from "./AiToolsCard";
import { AiTool } from "@/types/content";
import { TEXTS } from "@/constants/texts";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from "@/constants/aiCategories";



interface AiToolsListProps {
  filters: {
    category: string;
  };
  sectionRefs?: React.MutableRefObject<{ [key: string]: HTMLElement | null }>;
}

export default function AiToolsList({ filters, sectionRefs }: AiToolsListProps) {
  const [tools, setTools] = useState<AiTool[]>([]);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, number>>({});

  // 초기 표시 개수를 6개로 설정
  useEffect(() => {
    const initialExpanded: Record<string, number> = {};
    DISPLAY_CATEGORIES.forEach(cat => {
      initialExpanded[cat] = 10;
    });
    setExpandedTools(initialExpanded);
  }, []);

  useEffect(() => {
    console.log('AI_TOOLS_DATA length:', AI_TOOLS_DATA.length);
    console.log('AI_TOOLS_DATA sample:', AI_TOOLS_DATA.slice(0, 3));

    const savedRatings = JSON.parse(localStorage.getItem("dori_tool_ratings") || "{}");

    const updatedTools = AI_TOOLS_DATA.map(tool => {
      const saved = savedRatings[tool.id];
      if (saved) {
        const avg = saved.count > 0 ? Number((saved.totalScore / saved.count).toFixed(1)) : 0;
        return { ...tool, rating: avg, ratingCount: saved.count };
      }
      return tool;
    });

    console.log('Updated tools length:', updatedTools.length);
    setTools(updatedTools);
    setIsLoaded(true);
  }, []);

  const isOverviewMode = filters.category === "All";

  const toggleExpand = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const loadMoreTools = (cat: string) => {
    const catTools = currentTools
      .filter(t => t.category === cat)
      .sort((a, b) => b.rating - a.rating);

    setExpandedTools(prev => ({
      ...prev,
      [cat]: catTools.length
    }));
  };

  const currentTools = isLoaded && tools.length > 0 ? tools : AI_TOOLS_DATA;

  console.log('Current tools length:', currentTools.length);
  console.log('Filters:', filters);
  console.log('Is overview mode:', isOverviewMode);

  // --- [1] 개요 모드 렌더링 (카테고리별 랭킹 섹션) ---
  if (isOverviewMode) {
    return (
      <div className="w-full flex flex-col animate-[fadeInUp_0.5s_ease-out]">
        {DISPLAY_CATEGORIES.map((cat, catIdx) => {
          // 필터링: 정확한 문자열 매칭
          const catTools = currentTools
            .filter(t => String(t.category) === String(cat))
            .sort((a, b) => b.rating - a.rating);

          if (catTools.length === 0) {
            return null;
          }

          // 각 카테고리에서 표시할 개수 (최소 6개, 더보기 클릭 시 증가)
          const displayCount = Math.max(expandedTools[cat] || 10, 10);
          const displayTools = catTools.slice(0, displayCount);
          const top3 = displayTools.slice(0, 3);
          const rest = displayTools.slice(3);
          const hasMore = catTools.length > displayCount;

          return (
            <section
              key={cat}
              id={`category-${cat}`}
              ref={(el) => {
                if (sectionRefs) {
                  sectionRefs.current[`category-${cat}`] = el;
                }
              }}
              className="relative flex items-center justify-center px-6 lg:pl-10 py-20"
              style={{
                minHeight: '100vh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                scrollMarginTop: '80px',
              }}
            >
              <div className="max-w-7xl mx-auto w-full">
                {/* 카테고리 헤더 */}
                <div className="mb-12 text-center">
                  <h2
                    className="text-4xl md:text-5xl font-black tracking-tighter mb-4"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </h2>
                  <p
                    className="text-base md:text-lg font-medium opacity-70"
                    style={{ color: 'var(--text-sub)' }}
                  >
                    {CATEGORY_DESCRIPTIONS[cat] || `${cat.toUpperCase()} 분야의 주요 AI 툴을 확인하세요.`}
                  </p>
                </div>

                {/* 카드 그리드 */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 gap-3 w-full max-w-5xl px-4 md:px-0">
                    {/* 1-3위 (rank 표시) */}
                    {top3.map((tool, idx) => (
                      <AiToolsCard key={tool.id} tool={tool} rank={idx + 1} />
                    ))}

                    {/* 4위 이후 (rank 없음) */}
                    {rest.map((tool) => (
                      <AiToolsCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>

                {/* 더보기 버튼 */}
                {hasMore && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={() => loadMoreTools(cat)}
                      className="px-8 py-4 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95 bg-[var(--card-bg)] text-[var(--text-main)] border-2 border-[var(--card-border)] hover:bg-gray-100 dark:hover:bg-white/10 shadow-md hover:shadow-lg"
                    >
                      + {cat.toUpperCase()} 툴 더보기 ({catTools.length - displayCount}개 남음)
                    </button>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // --- [2] 필터 모드 렌더링 ---
  const filteredTools = currentTools.filter((tool) => {
    const matchCat = filters.category === "All" || tool.category.toLowerCase() === filters.category.toLowerCase();
    return matchCat;
  }).sort((a, b) => b.rating - a.rating); // 기본적으로 평점순 정렬

  const visibleTools = filteredTools.slice(0, visibleCount);

  return (
    <div className="w-full animate-[fadeInUp_0.5s_ease-out]">
      <div className="flex justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 w-full max-w-full px-4">
          {visibleTools.map((tool) => (
            <AiToolsCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-20 opacity-60">
          <p>조건에 맞는 툴이 없습니다. 😢</p>
        </div>
      )}

      {visibleTools.length < filteredTools.length && (
        <div className="flex justify-center mt-16 mb-10">
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="px-10 py-4 rounded-full font-bold text-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] shadow-md hover:shadow-lg"
          >
            {TEXTS.aiTools.button.loadMore.ko} +
          </button>
        </div>
      )}
    </div>
  );
}