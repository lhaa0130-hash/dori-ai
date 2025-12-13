"use client";

import { useState, useEffect } from "react";
import AiToolsCard, { AiTool } from "./AiToolsCard";
import { TEXTS } from "@/constants/texts";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";

// 📌 표시할 카테고리 순서 정의 (6줄)
const DISPLAY_CATEGORIES = ["llm", "image", "video", "voice", "automation", "search"];

interface AiToolsListProps {
  filters: {
    category: string;
    price: string;
    sort: string;
  };
}

export default function AiToolsList({ filters }: AiToolsListProps) {
  const [tools, setTools] = useState<AiTool[]>(AI_TOOLS_DATA);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(9);
  const [isLoaded, setIsLoaded] = useState(false);

  // -----------------------------------------------------
  // ⭐ 로컬 저장된 평점 데이터 불러오기 → 적용
  // -----------------------------------------------------
  useEffect(() => {
    const savedRatings = JSON.parse(localStorage.getItem("dori_tool_ratings") || "{}");

    const updatedTools = AI_TOOLS_DATA.map(tool => {
      const saved = savedRatings[tool.id];
      if (saved) {
        const avg = saved.count > 0 ? Number((saved.totalScore / saved.count).toFixed(1)) : 0;
        return { ...tool, rating: avg, ratingCount: saved.count };
      }
      return tool;
    });

    setTools(updatedTools);
    setIsLoaded(true);
  }, []);

  const isOverviewMode =
    filters.category === "All" &&
    filters.price === "All" &&
    filters.sort === "rating";

  const toggleExpand = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const currentTools = isLoaded ? tools : AI_TOOLS_DATA;

  // -----------------------------------------------------
  // ⭐ [핵심] 평점순 내림차순 정렬 (전역 정렬)
  // -----------------------------------------------------
  const sortedTools = currentTools
    .slice()
    .sort((a, b) => b.rating - a.rating);

  // -----------------------------------------------------
  // ⭐ [1] “전체 개요 모드” — 카테고리별 TOP 3 + 펼치기
  // -----------------------------------------------------
  if (isOverviewMode) {
    return (
      <div className="w-full flex flex-col gap-16 animate-[fadeInUp_0.5s_ease-out]">
        {DISPLAY_CATEGORIES.map((cat) => {
          const catTools = sortedTools.filter(
            t => t.category.toLowerCase() === cat.toLowerCase()
          );

          if (catTools.length === 0) return null;

          const top3 = catTools.slice(0, 3);
          const rest = catTools.slice(3);
          const isExpanded = expandedCats[cat];

          return (
            <div
              key={cat}
              className="flex flex-col md:flex-row gap-6 items-start border-b border-dashed border-[var(--card-border)] pb-12 last:border-0"
            >
              {/* 좌측 타이틀 */}
              <div className="w-full md:w-48 flex-shrink-0 sticky top-24">
                <div className="flex md:flex-col items-baseline md:items-start gap-3">
                  <h2 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tighter">
                    {cat}
                  </h2>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30 px-2 py-1 rounded">
                    Top Ranking
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 hidden md:block leading-relaxed font-medium">
                    {cat.toUpperCase()} 분야의 주요 AI 툴을 확인하세요.
                  </p>
                </div>
              </div>

              {/* 우측 리스트 */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {top3.map((tool, idx) => (
                    <AiToolsCard key={tool.id} tool={tool} rank={idx + 1} />
                  ))}

                  {isExpanded &&
                    rest.map((tool, idx) => (
                      <AiToolsCard key={tool.id} tool={tool} rank={idx + 4} />
                    ))}
                </div>

                {rest.length > 0 && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => toggleExpand(cat)}
                      className="px-6 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 bg-[var(--bg-soft)] text-[var(--text-main)] border border-[var(--card-border)] hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 mx-auto"
                    >
                      {isExpanded
                        ? "접기 ▲"
                        : `+ ${cat.toUpperCase()} 툴 더보기 (${rest.length})`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // -----------------------------------------------------
  // ⭐ [2] 필터 모드 렌더링
  // -----------------------------------------------------
  const filteredTools = sortedTools
    .filter((tool) => {
      const matchCat =
        filters.category === "All" ||
        tool.category.toLowerCase() === filters.category.toLowerCase();
      return matchCat;
    })
    .sort((a, b) => {
      if (filters.sort === "rating") return b.rating - a.rating;
      if (filters.sort === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const visibleTools = filteredTools.slice(0, visibleCount);

  return (
    <div className="w-full animate-[fadeInUp_0.5s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTools.map((tool) => (
          <AiToolsCard key={tool.id} tool={tool} />
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-20 opacity-60">
          <p>조건에 맞는 툴이 없습니다. 😢</p>
        </div>
      )}

      {visibleTools.length < filteredTools.length && (
        <div className="flex justify-center mt-16 mb-10">
          <button
            onClick={() => setVisibleCount((prev) => prev + 9)}
            className="px-10 py-4 rounded-full font-bold text-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] shadow-md hover:shadow-lg"
          >
            {TEXTS.aiTools.button.loadMore.ko} +
          </button>
        </div>
      )}
    </div>
  );
}
