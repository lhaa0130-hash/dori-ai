"use client";

import { useState, useEffect } from "react";
import AiToolsCard from "./AiToolsCard";
import { AiTool } from "@/types/content";
import { TEXTS } from "@/constants/texts";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from "@/constants/aiCategories";

// ─── 에이전트 Top3 하이라이트 카드 ───────────────────────────────
const RANK_STYLES: Record<number, { border: string; badge: string; emoji: string }> = {
  1: { border: "border-yellow-400 shadow-yellow-400/20", badge: "bg-yellow-400 text-yellow-900", emoji: "🥇" },
  2: { border: "border-slate-400 shadow-slate-400/20", badge: "bg-slate-400 text-slate-900", emoji: "🥈" },
  3: { border: "border-amber-600 shadow-amber-600/20", badge: "bg-amber-600 text-white", emoji: "🥉" },
};

function AgentHighlightCard({ tool }: { tool: AiTool }) {
  const rank = tool.topRank ?? 1;
  const style = RANK_STYLES[rank] ?? RANK_STYLES[1];
  return (
    <div className={`rounded-2xl border-2 ${style.border} bg-white dark:bg-zinc-900 shadow-xl p-6 flex flex-col gap-4`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`text-xl font-black px-3 py-1 rounded-full ${style.badge}`}>
            {style.emoji} #{rank}
          </span>
          <img
            src={tool.thumbnail}
            alt={tool.name}
            className="w-9 h-9 rounded-lg object-contain bg-white border border-neutral-100"
            onError={(e) => { (e.target as HTMLImageElement).src = "/icons/default-tool.png"; }}
          />
          <div>
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">{tool.name}</h3>
            {tool.strength && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{tool.strength}</p>
            )}
          </div>
        </div>
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white text-sm font-bold transition-colors"
        >
          방문하기
        </a>
      </div>

      {/* 장단점 */}
      {(tool.pros || tool.cons) && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {tool.pros && (
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400 mb-1">✅ 장점</p>
              <ul className="space-y-0.5">
                {tool.pros.map((p, i) => (
                  <li key={i} className="text-neutral-700 dark:text-neutral-300 flex items-start gap-1">
                    <span className="mt-0.5 text-green-500 shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tool.cons && (
            <div>
              <p className="font-semibold text-red-500 dark:text-red-400 mb-1">❌ 단점</p>
              <ul className="space-y-0.5">
                {tool.cons.map((c, i) => (
                  <li key={i} className="text-neutral-700 dark:text-neutral-300 flex items-start gap-1">
                    <span className="mt-0.5 text-red-400 shrink-0">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 실사용 후기 */}
      {tool.userReview && (
        <div className="bg-neutral-50 dark:bg-zinc-800 rounded-xl px-4 py-3 border border-neutral-100 dark:border-zinc-700">
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-1">💬 실사용 후기</p>
          <p className="text-sm text-neutral-700 dark:text-neutral-200 italic">"{tool.userReview}"</p>
        </div>
      )}
    </div>
  );
}

// ─── 에이전트 미니 카드 ─────────────────────────────────────────
function AgentMiniCard({ tool }: { tool: AiTool }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-700 px-4 py-3 hover:border-[#F9954E]/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={tool.thumbnail}
          alt={tool.name}
          className="w-8 h-8 rounded-lg object-contain bg-white border border-neutral-100 shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).src = "/icons/default-tool.png"; }}
        />
        <div className="min-w-0">
          <span className="font-semibold text-sm text-neutral-900 dark:text-white">{tool.name}</span>
          {tool.userReview && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">"{tool.userReview}"</p>
          )}
        </div>
      </div>
      <a
        href={tool.website}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-[#F9954E] hover:text-white text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors"
      >
        방문
      </a>
    </div>
  );
}

// ─── 에이전트 섹션 (전체) ─────────────────────────────────────────
function AgentSection({
  tools,
  sectionRef,
}: {
  tools: AiTool[];
  sectionRef?: (el: HTMLElement | null) => void;
}) {
  const top3 = tools.filter(t => t.topPick).sort((a, b) => (a.topRank ?? 99) - (b.topRank ?? 99));
  const rest = tools.filter(t => !t.topPick);

  return (
    <section
      id="category-agent"
      ref={sectionRef}
      className="relative flex items-center justify-center px-6 lg:pl-10 py-10"
      style={{ minHeight: "100vh", scrollSnapAlign: "start", scrollSnapStop: "always", scrollMarginTop: "80px" }}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* 카테고리 헤더 */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4" style={{ color: "var(--text-main)" }}>
            {CATEGORY_LABELS["agent"]}
          </h2>
          <p className="text-base md:text-lg font-medium opacity-70" style={{ color: "var(--text-sub)" }}>
            {CATEGORY_DESCRIPTIONS["agent"]}
          </p>
        </div>

        {/* Top 3 하이라이트 카드 */}
        <div className="grid grid-cols-1 gap-5 w-full max-w-3xl mx-auto mb-8">
          {top3.map(tool => (
            <AgentHighlightCard key={tool.id} tool={tool} />
          ))}
        </div>

        {/* 나머지 미니 카드 */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 gap-2 w-full max-w-3xl mx-auto">
            {rest.map(tool => (
              <AgentMiniCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}



interface AiToolsListProps {
  filters: {
    category: string;
  };
  sectionRefs?: React.MutableRefObject<{ [key: string]: HTMLElement | null }>;
}

export default function AiToolsList({ filters, sectionRefs }: AiToolsListProps) {
  const [tools, setTools] = useState<AiTool[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const currentTools = isLoaded && tools.length > 0 ? tools : AI_TOOLS_DATA;

  console.log('Current tools length:', currentTools.length);
  console.log('Filters:', filters);
  console.log('Is overview mode:', isOverviewMode);

  // --- [1] 개요 모드 렌더링 (카테고리별 랭킹 섹션) ---
  if (isOverviewMode) {
    return (
      <div className="w-full flex flex-col animate-[fadeInUp_0.5s_ease-out]">
        {DISPLAY_CATEGORIES.map((cat) => {
          // 필터링: 정확한 문자열 매칭
          const catTools = currentTools
            .filter(t => String(t.category) === String(cat))
            .sort((a, b) => b.rating - a.rating);

          if (catTools.length === 0) {
            return null;
          }

          // 에이전트 카테고리는 특별 처리
          if (cat === "agent") {
            return (
              <AgentSection
                key={cat}
                tools={catTools}
                sectionRef={(el) => {
                  if (sectionRefs) {
                    sectionRefs.current[`category-${cat}`] = el;
                  }
                }}
              />
            );
          }

          // 모든 아이템 표시 (더보기 제거)
          const displayTools = catTools;
          const top3 = displayTools.slice(0, 3);
          const rest = displayTools.slice(3);

          return (
            <section
              key={cat}
              id={`category-${cat}`}
              ref={(el) => {
                if (sectionRefs) {
                  sectionRefs.current[`category-${cat}`] = el;
                }
              }}
              className="relative flex items-center justify-center px-6 lg:pl-10 py-10"
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
                {/* 더보기 버튼 제거됨 */}
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

  // 에이전트 단독 필터인 경우 AgentSection으로 렌더링
  if (filters.category.toLowerCase() === "agent" && filteredTools.length > 0) {
    return (
      <div className="w-full animate-[fadeInUp_0.5s_ease-out]">
        <AgentSection tools={filteredTools} />
      </div>
    );
  }

  const visibleTools = filteredTools; // 전체 표시

  return (
    <div className="w-full animate-[fadeInUp_0.5s_ease-out]">
      <div className="flex justify-center">
        <div className="grid grid-cols-1 gap-3 w-full max-w-5xl px-4 md:px-0">
          {visibleTools.map((tool, idx) => (
            <AiToolsCard key={tool.id} tool={tool} rank={idx + 1} />
          ))}
        </div>
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-20 opacity-60">
          <p>조건에 맞는 툴이 없습니다. 😢</p>
        </div>
      )}


    </div>
  );
}