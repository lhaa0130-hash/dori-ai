"use client";

import { useState, useEffect } from "react";
import { AiTool } from "@/types/content";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from "@/constants/aiCategories";

// ─── 랭킹 스타일 (1~3위) ─────────────────────────────────────────
const RANK_STYLES: Record<number, { border: string; badge: string; emoji: string; glow: string }> = {
  1: {
    border: "border-yellow-400/60 dark:border-yellow-500/40",
    badge: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900",
    emoji: "🥇",
    glow: "shadow-yellow-400/10",
  },
  2: {
    border: "border-slate-400/60 dark:border-slate-500/40",
    badge: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900",
    emoji: "🥈",
    glow: "shadow-slate-400/10",
  },
  3: {
    border: "border-amber-600/60 dark:border-amber-700/40",
    badge: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
    emoji: "🥉",
    glow: "shadow-amber-500/10",
  },
};

// ─── Top3 하이라이트 카드 ─────────────────────────────────────────
function HighlightCard({ tool }: { tool: AiTool }) {
  const rank = tool.topRank ?? 1;
  const style = RANK_STYLES[rank] ?? RANK_STYLES[1];

  const defaultPros = [
    tool.strength || "업계 선도적인 AI 기술력",
    "사용자 친화적인 인터페이스",
    "업무 생산성 획기적 개선",
  ];
  const displayPros = tool.pros && tool.pros.length > 0
    ? tool.pros.slice(0, 3)
    : defaultPros.slice(0, 3);

  const defaultCons = [
    "고급 기능 사용 시 유료 플랜 필요",
    "초기 학습 곡선이 존재할 수 있음",
  ];
  const displayCons = tool.cons && tool.cons.length > 0
    ? tool.cons.slice(0, 2)
    : defaultCons.slice(0, 2);

  return (
    <div
      className={`rounded-2xl border-2 ${style.border} bg-white dark:bg-zinc-900 shadow-xl ${style.glow} p-4 sm:p-5 flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-sm font-black px-2.5 py-1 rounded-full ${style.badge} shrink-0`}>
            {style.emoji} #{rank}
          </span>
          <img
            src={tool.thumbnail}
            alt={tool.name}
            className="w-8 h-8 rounded-xl object-contain bg-white border border-neutral-100 dark:border-zinc-700 shrink-0"
            onError={(e) => {
              try {
                (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${new URL(tool.website).hostname}&sz=128`;
              } catch {}
            }}
          />
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white leading-tight truncate">
              {tool.name}
            </h3>
            {tool.strength && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{tool.strength}</p>
            )}
          </div>
        </div>
        {/* 버튼 그룹 */}
        <div className="flex gap-1.5 shrink-0">
          {tool.apiUrl && (
            <a
              href={tool.apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-neutral-600 dark:text-neutral-300 hover:text-purple-700 dark:hover:text-purple-300 text-xs font-bold transition-colors border border-neutral-200 dark:border-zinc-700"
              title="API 문서"
            >
              API
            </a>
          )}
          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#F9954E] hover:bg-[#E8832E] text-white text-xs font-bold transition-colors whitespace-nowrap"
          >
            방문하기
          </a>
        </div>
      </div>

      {/* 요약 */}
      {tool.summary && (
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">{tool.summary}</p>
      )}

      {/* 장단점 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-2.5">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-1.5 text-[10px] uppercase tracking-wide">✅ 장점</p>
          <ul className="space-y-1">
            {displayPros.map((p, i) => (
              <li key={i} className="text-neutral-700 dark:text-neutral-300 flex items-start gap-1 text-[11px]">
                <span className="mt-0.5 text-green-500 shrink-0">•</span>
                <span className="leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-2.5">
          <p className="font-semibold text-red-600 dark:text-red-400 mb-1.5 text-[10px] uppercase tracking-wide">❌ 단점</p>
          <ul className="space-y-1">
            {displayCons.map((c, i) => (
              <li key={i} className="text-neutral-700 dark:text-neutral-300 flex items-start gap-1 text-[11px]">
                <span className="mt-0.5 text-red-400 shrink-0">•</span>
                <span className="leading-snug">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── 미니 카드 (4~5위 및 나머지) ────────────────────────────────────
function MiniCard({ tool, rank }: { tool: AiTool; rank: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 px-3 py-2.5 hover:border-[#F9954E]/50 hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 w-4 shrink-0 text-center">
          {rank}
        </span>
        <img
          src={tool.thumbnail}
          alt={tool.name}
          className="w-7 h-7 rounded-lg object-contain bg-white border border-neutral-100 dark:border-zinc-700 shrink-0"
          onError={(e) => {
            try {
              (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${new URL(tool.website).hostname}&sz=128`;
            } catch {}
          }}
        />
        <div className="min-w-0">
          <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">
            {tool.name}
          </span>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 hidden sm:block">
            {tool.summary || ""}
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {tool.apiUrl && (
          <a
            href={tool.apiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-zinc-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-neutral-500 dark:text-neutral-400 hover:text-purple-700 dark:hover:text-purple-300 text-[10px] font-bold transition-colors"
            title="API 문서"
          >
            API
          </a>
        )}
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-zinc-800 hover:bg-[#F9954E] hover:text-white text-neutral-600 dark:text-neutral-300 text-xs font-semibold transition-colors whitespace-nowrap"
        >
          방문
        </a>
      </div>
    </div>
  );
}

// ─── 카테고리 섹션 ─────────────────────────────────────────────────
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
  // 인기순 정렬: topPick > topRank > rating
  const sortedTools = tools.slice().sort((a, b) => {
    const aPick = a.topPick ? 1 : 0;
    const bPick = b.topPick ? 1 : 0;
    if (aPick !== bPick) return bPick - aPick;
    const aRank = a.topRank ?? 99;
    const bRank = b.topRank ?? 99;
    if (aRank !== bRank) return aRank - bRank;
    return b.rating - a.rating;
  });

  // TOP 5 분류
  const top5 = sortedTools.slice(0, 5).map((t, i) => ({ ...t, topRank: i + 1 }));
  const top3 = top5.slice(0, 3);         // HighlightCard
  const rank45 = top5.slice(3, 5);       // MiniCard (4, 5위)
  const rest = sortedTools.slice(5);     // 필터 모드에서만 표시

  return (
    <section
      id={`category-${cat}`}
      ref={sectionRef}
      className="relative py-8 sm:py-12"
      style={{
        scrollMarginTop: "80px",
      }}
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* 카테고리 헤더 */}
        <div className="mb-6 sm:mb-10 border-b border-neutral-100 dark:border-zinc-800 pb-4 sm:pb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2 text-neutral-900 dark:text-white">
            {CATEGORY_LABELS[cat] || cat}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
            {CATEGORY_DESCRIPTIONS[cat] || `${CATEGORY_LABELS[cat] || cat} 분야의 주요 AI 툴을 확인하세요.`}
          </p>
        </div>

        {/* TOP 3 하이라이트 카드 */}
        <div className="flex flex-col gap-4 mb-4">
          {top3.map((tool) => (
            <HighlightCard key={tool.id} tool={tool} />
          ))}
        </div>

        {/* 4~5위 미니 카드 */}
        {rank45.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-zinc-600 uppercase tracking-widest px-1 mb-1">
              Top 5
            </p>
            {rank45.map((tool) => (
              <MiniCard key={tool.id} tool={tool} rank={tool.topRank ?? 4} />
            ))}
          </div>
        )}

        {/* 나머지 전체 목록 (필터 모드에서만) */}
        {isFiltered && rest.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-neutral-200 dark:bg-zinc-800" />
              <p className="text-[11px] font-bold text-neutral-400 dark:text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                전체 목록 ({rest.length + 5}개)
              </p>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-zinc-800" />
            </div>
            <div className="flex flex-col gap-2">
              {rest.map((tool, i) => (
                <MiniCard key={tool.id} tool={tool} rank={i + 6} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────
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
    const savedRatings = JSON.parse(
      localStorage.getItem("dori_tool_ratings") || "{}"
    );
    const updatedTools = AI_TOOLS_DATA.map((tool) => {
      const saved = savedRatings[tool.id];
      if (saved) {
        const avg =
          saved.count > 0
            ? Number((saved.totalScore / saved.count).toFixed(1))
            : 0;
        return { ...tool, rating: avg, ratingCount: saved.count };
      }
      return tool;
    });
    setTools(updatedTools);
    setIsLoaded(true);
  }, []);

  const currentTools = isLoaded && tools.length > 0 ? tools : AI_TOOLS_DATA;
  const isOverviewMode = filters.category === "All";

  // ── 전체보기 모드 ──
  if (isOverviewMode) {
    return (
      <div className="w-full flex flex-col animate-[fadeInUp_0.5s_ease-out]">
        {DISPLAY_CATEGORIES.map((cat) => {
          const catTools = currentTools.filter(
            (t) => String(t.category) === String(cat)
          );
          if (catTools.length === 0) return null;

          return (
            <CategorySection
              key={cat}
              cat={cat}
              tools={catTools}
              isFiltered={false}
              sectionRef={(el) => {
                if (sectionRefs) {
                  sectionRefs.current[`category-${cat}`] = el;
                }
              }}
            />
          );
        })}
      </div>
    );
  }

  // ── 필터 모드 (카테고리 선택) ──
  const filteredTools = currentTools.filter(
    (tool) => tool.category.toLowerCase() === filters.category.toLowerCase()
  );

  if (filteredTools.length === 0) {
    return (
      <div className="text-center py-20 opacity-60">
        <p>조건에 맞는 툴이 없습니다. 😢</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-[fadeInUp_0.5s_ease-out]">
      <CategorySection
        cat={filters.category}
        tools={filteredTools}
        isFiltered={true}
      />
    </div>
  );
}
