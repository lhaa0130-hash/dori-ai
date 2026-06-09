"use client";

import { useState, useEffect } from "react";
import { AiTool } from "@/types/content";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from "@/constants/aiCategories";

// ── favicon fallback ──────────────────────────────────────────────
function toolFavicon(tool: AiTool) {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(tool.website).hostname}&sz=128`; }
  catch { return ""; }
}

// ── TOP 3 하이라이트 카드 ─────────────────────────────────────────
function HighlightCard({ tool, rank }: { tool: AiTool; rank: number }) {
  return (
    <a
      href={tool.website}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-950
        border border-neutral-100 dark:border-zinc-900
        hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5
        transition-all duration-200"
    >
      {/* 랭크 번호 */}
      <span className={`text-[13px] font-black w-5 text-center mt-0.5 flex-shrink-0 ${
        rank === 1 ? "text-[#F9954E]" : "text-neutral-300 dark:text-zinc-600"
      }`}>
        {rank}
      </span>

      {/* 로고 */}
      <img
        src={tool.thumbnail || toolFavicon(tool)}
        alt={tool.name}
        className="w-11 h-11 rounded-xl object-contain bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = toolFavicon(tool); }}
      />

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-extrabold text-neutral-900 dark:text-white leading-tight">
              {tool.name}
            </h3>
            <p className="text-[12px] text-neutral-400 dark:text-neutral-500 mt-0.5 line-clamp-1 break-keep">
              {tool.strength || tool.summary || ""}
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-1.5 flex-shrink-0">
            {tool.apiUrl && (
              <a
                href={tool.apiUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-neutral-200 dark:border-zinc-800
                  text-neutral-500 dark:text-neutral-400 hover:border-[#F9954E]/40 hover:text-[#F9954E] transition-colors"
              >
                API
              </a>
            )}
            <span
              className="px-3 py-1.5 rounded-lg bg-[#F9954E] text-white text-[12px] font-bold
                group-hover:bg-[#E8832E] transition-colors whitespace-nowrap"
            >
              방문하기
            </span>
          </div>
        </div>

        {/* 핵심 특징 태그 */}
        {tool.pros && tool.pros.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {tool.pros.slice(0, 3).map((p, i) => (
              <span
                key={i}
                className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-zinc-900
                  px-2 py-0.5 rounded-full border border-neutral-100 dark:border-zinc-800 leading-snug"
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

// ── 미니 카드 (4위 이하) ──────────────────────────────────────────
function MiniCard({ tool, rank }: { tool: AiTool; rank: number }) {
  return (
    <a
      href={tool.website}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-zinc-950
        border border-neutral-100 dark:border-zinc-900
        hover:border-[#F9954E]/30 transition-all duration-150"
    >
      {/* 랭크 */}
      <span className="text-[11px] font-black text-neutral-300 dark:text-zinc-600 w-4 text-center flex-shrink-0">
        {rank}
      </span>

      {/* 로고 */}
      <img
        src={tool.thumbnail || toolFavicon(tool)}
        alt={tool.name}
        className="w-[30px] h-[30px] rounded-lg object-contain bg-neutral-50 dark:bg-zinc-900
          border border-neutral-100 dark:border-zinc-800 flex-shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).src = toolFavicon(tool); }}
      />

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-semibold text-neutral-900 dark:text-white
          group-hover:text-[#F9954E] transition-colors">
          {tool.name}
        </span>
        <p className="text-[11px] text-neutral-400 truncate hidden sm:block mt-0.5">
          {tool.summary || ""}
        </p>
      </div>

      {/* 방문 */}
      <div className="flex gap-1.5 flex-shrink-0">
        {tool.apiUrl && (
          <a
            href={tool.apiUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 rounded-md text-[10px] font-bold border border-neutral-200 dark:border-zinc-800
              text-neutral-400 hover:text-[#F9954E] hover:border-[#F9954E]/30 transition-colors"
          >
            API
          </a>
        )}
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold
          text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-zinc-800
          group-hover:bg-[#F9954E] group-hover:border-[#F9954E] group-hover:text-white transition-colors">
          방문
        </span>
      </div>
    </a>
  );
}

// ── 카테고리 섹션 ─────────────────────────────────────────────────
function CategorySection({
  cat,
  tools,
  sectionRef,
  isFiltered = false,
}: {
  cat: string;
  tools: AiTool[];
  sectionRef?: (el: HTMLElement | null) => void;
  isFiltered?: boolean;
}) {
  const sortedTools = tools.slice().sort((a, b) => {
    if ((a.topPick ? 1 : 0) !== (b.topPick ? 1 : 0)) return (b.topPick ? 1 : 0) - (a.topPick ? 1 : 0);
    if ((a.topRank ?? 99) !== (b.topRank ?? 99)) return (a.topRank ?? 99) - (b.topRank ?? 99);
    return b.rating - a.rating;
  });

  const top3   = sortedTools.slice(0, 3).map((t, i) => ({ ...t, topRank: i + 1 }));
  const rank45 = sortedTools.slice(3, 5).map((t, i) => ({ ...t, topRank: i + 4 }));
  const rest   = sortedTools.slice(5);

  return (
    <section
      id={`category-${cat}`}
      ref={sectionRef}
      className="py-10 border-b border-neutral-100 dark:border-zinc-900 last:border-0"
      style={{ scrollMarginTop: "80px" }}
    >
      {/* 카테고리 헤더 */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold text-[#F9954E] mb-1.5 uppercase tracking-wide">
            {cat === "agent" ? "🆕 신규" : "Top 5"}
          </p>
          <h2 className="text-[22px] font-extrabold text-neutral-950 dark:text-white tracking-tight leading-tight">
            {CATEGORY_LABELS[cat] || cat}
          </h2>
          <p className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-1 leading-relaxed break-keep max-w-xs">
            {CATEGORY_DESCRIPTIONS[cat]}
          </p>
        </div>
        <span className="text-[12px] font-semibold text-neutral-400 flex-shrink-0">
          {sortedTools.length}개
        </span>
      </div>

      {/* Top 3 카드 */}
      <div className="flex flex-col gap-2 mb-3">
        {top3.map((tool) => (
          <HighlightCard key={tool.id} tool={tool} rank={tool.topRank ?? 1} />
        ))}
      </div>

      {/* 4~5위 */}
      {rank45.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2">
          {rank45.map((tool) => (
            <MiniCard key={tool.id} tool={tool} rank={tool.topRank ?? 4} />
          ))}
        </div>
      )}

      {/* 필터 모드: 전체 목록 */}
      {isFiltered && rest.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-neutral-100 dark:bg-zinc-900" />
            <span className="text-[11px] font-bold text-neutral-300 dark:text-zinc-600 uppercase tracking-widest whitespace-nowrap">
              전체 {rest.length + 5}개
            </span>
            <div className="h-px flex-1 bg-neutral-100 dark:bg-zinc-900" />
          </div>
          <div className="flex flex-col gap-1.5">
            {rest.map((tool, i) => (
              <MiniCard key={tool.id} tool={tool} rank={i + 6} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
interface AiToolsListProps {
  filters: { category: string };
  sectionRefs?: React.MutableRefObject<{ [key: string]: HTMLElement | null }>;
}

export default function AiToolsList({ filters, sectionRefs }: AiToolsListProps) {
  const [tools, setTools] = useState<AiTool[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedRatings = JSON.parse(localStorage.getItem("dori_tool_ratings") || "{}");
    const updated = AI_TOOLS_DATA.map((tool) => {
      const saved = savedRatings[tool.id];
      if (saved) {
        const avg = saved.count > 0 ? Number((saved.totalScore / saved.count).toFixed(1)) : 0;
        return { ...tool, rating: avg, ratingCount: saved.count };
      }
      return tool;
    });
    setTools(updated);
    setIsLoaded(true);
  }, []);

  const currentTools = isLoaded && tools.length > 0 ? tools : AI_TOOLS_DATA;
  const isOverviewMode = filters.category === "All";

  if (isOverviewMode) {
    return (
      <div className="w-full flex flex-col">
        {DISPLAY_CATEGORIES.map((cat) => {
          const catTools = currentTools.filter((t) => String(t.category) === String(cat));
          if (catTools.length === 0) return null;
          return (
            <CategorySection
              key={cat}
              cat={cat}
              tools={catTools}
              isFiltered={false}
              sectionRef={(el) => { if (sectionRefs) sectionRefs.current[`category-${cat}`] = el; }}
            />
          );
        })}
      </div>
    );
  }

  const filteredTools = currentTools.filter(
    (t) => t.category.toLowerCase() === filters.category.toLowerCase()
  );

  if (filteredTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[32px] mb-3">🔍</p>
        <p className="text-[15px] font-semibold text-neutral-500">조건에 맞는 도구가 없어요</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <CategorySection cat={filters.category} tools={filteredTools} isFiltered={true} />
    </div>
  );
}
