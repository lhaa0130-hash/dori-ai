"use client";

import { useState, useEffect } from "react";
import { AiTool } from "@/types/content";
import { TEXTS } from "@/constants/texts";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from "@/constants/aiCategories";

// ─── 랭킹 스타일 (1~3위 공통) ─────────────────────────────────────
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

  return (
    <div
      className={`rounded-2xl border-2 ${style.border} bg-white dark:bg-zinc-900 shadow-xl ${style.glow} p-5 sm:p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-0.5`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* 순위 배지 */}
          <span
            className={`text-base font-black px-3 py-1 rounded-full ${style.badge} shrink-0`}
          >
            {style.emoji} #{rank}
          </span>
          {/* 로고 */}
          <img
            src={tool.thumbnail}
            alt={tool.name}
            className="w-9 h-9 rounded-xl object-contain bg-white border border-neutral-100 dark:border-zinc-700 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${new URL(tool.website).hostname}&sz=128`;
            }}
          />
          <div>
            <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white leading-tight">
              {tool.name}
            </h3>
            {tool.strength && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{tool.strength}</p>
            )}
          </div>
        </div>
        <a
          href={tool.website}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white text-sm font-bold transition-colors whitespace-nowrap"
        >
          방문하기
        </a>
      </div>

      {/* 장단점 (전체 툴 동일하게 3개 항목 강제 통일) */}
      {(() => {
        const defaultPros = [
          tool.strength || "업계 선도적인 AI 기술력",
          "사용자 친화적인 인터페이스",
          "업무 생산성 획기적 개선"
        ];
        const displayPros = (tool.pros && tool.pros.length > 0)
          ? [...tool.pros, ...defaultPros].slice(0, 3)
          : defaultPros;

        const defaultCons = [
          "고급 기능 사용 시 유료 플랜 필요",
          "초기 학습 곡선이 존재할 수 있음",
          "일부 복잡한 작업에서 수동 검토 권장"
        ];
        const displayCons = (tool.cons && tool.cons.length > 0)
          ? [...tool.cons, ...defaultCons].slice(0, 3)
          : defaultCons;

        return (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400 mb-1 text-xs">
                ✅ 장점
              </p>
              <ul className="space-y-0.5">
                {displayPros.map((p, i) => (
                  <li
                    key={i}
                    className="text-neutral-700 dark:text-neutral-300 flex items-start gap-1 text-xs"
                  >
                    <span className="mt-0.5 text-green-500 shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-red-500 dark:text-red-400 mb-1 text-xs">
                ❌ 단점
              </p>
              <ul className="space-y-0.5">
                {displayCons.map((c, i) => (
                  <li
                    key={i}
                    className="text-neutral-700 dark:text-neutral-300 flex items-start gap-1 text-xs"
                  >
                    <span className="mt-0.5 text-red-400 shrink-0">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── 미니 카드 (4위 이후) ──────────────────────────────────────────
function MiniCard({ tool, rank }: { tool: AiTool; rank: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 px-4 py-3 hover:border-[#F9954E]/50 hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-center gap-3 min-w-0">
        {/* 순위 */}
        <span className="text-xs font-black text-neutral-400 dark:text-neutral-500 w-5 shrink-0 text-center">
          {rank}
        </span>
        {/* 로고 */}
        <img
          src={tool.thumbnail}
          alt={tool.name}
          className="w-8 h-8 rounded-lg object-contain bg-white border border-neutral-100 dark:border-zinc-700 shrink-0"
          onError={(e) => {
            try {
              const domain = new URL(tool.website).hostname;
              (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
            } catch {}
          }}
        />
        {/* 텍스트 */}
        <div className="min-w-0">
          <span className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">
            {tool.name}
          </span>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
            {tool.summary || tool.userReview || ""}
          </p>
        </div>
      </div>
      <a
        href={tool.website}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-[#F9954E] hover:text-white text-neutral-600 dark:text-neutral-300 text-xs font-semibold transition-colors whitespace-nowrap"
      >
        방문
      </a>
    </div>
  );
}

// ─── 카테고리 섹션 (공통) ────────────────────────────────────────
function CategorySection({
  cat,
  tools,
  sectionRef,
}: {
  cat: string;
  tools: AiTool[];
  sectionRef?: (el: HTMLElement | null) => void;
}) {
  // 카테고리별 Top3만 표시
  // 우선순위: topPick(true) > topRank(낮을수록) > rating(높을수록)
  const highlightTools = tools
    .slice()
    .sort((a, b) => {
      const aPick = a.topPick ? 1 : 0;
      const bPick = b.topPick ? 1 : 0;
      if (aPick !== bPick) return bPick - aPick;

      const aRank = a.topRank ?? 99;
      const bRank = b.topRank ?? 99;
      if (aRank !== bRank) return aRank - bRank;

      return b.rating - a.rating;
    })
    .slice(0, 3)
    .map((t, i) => ({ ...t, topRank: i + 1 })); // 순위를 1, 2, 3으로 강제 할당
  return (
    <section
      id={`category-${cat}`}
      ref={sectionRef}
      className="relative flex items-center justify-center px-4 sm:px-6 lg:pl-10 py-10"
      style={{
        minHeight: "100vh",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        scrollMarginTop: "80px",
      }}
    >
      <div className="max-w-3xl mx-auto w-full">
        {/* 카테고리 헤더 */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-3 text-neutral-900 dark:text-white">
            {CATEGORY_LABELS[cat] || cat}
          </h2>
          <p className="text-sm sm:text-base font-medium text-neutral-500 dark:text-neutral-400">
            {CATEGORY_DESCRIPTIONS[cat] ||
              `${CATEGORY_LABELS[cat] || cat} 분야의 주요 AI 툴을 확인하세요.`}
          </p>
        </div>

        {/* Top 3 하이라이트 카드 */}
        <div className="flex flex-col gap-4 mb-5">
          {highlightTools.map((tool) => (
            <HighlightCard key={tool.id} tool={tool} />
          ))}
        </div>

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

  // ── 필터 모드 ──
  const filteredTools = currentTools
    .filter(
      (tool) =>
        filters.category === "All" ||
        tool.category.toLowerCase() === filters.category.toLowerCase()
    )
    .sort((a, b) => b.rating - a.rating);

  if (filteredTools.length === 0) {
    return (
      <div className="text-center py-20 opacity-60">
        <p>조건에 맞는 툴이 없습니다. 😢</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-[fadeInUp_0.5s_ease-out]">
      <CategorySection cat={filters.category} tools={filteredTools} />
    </div>
  );
}
