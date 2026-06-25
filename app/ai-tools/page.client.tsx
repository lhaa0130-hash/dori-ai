"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import OpenRouterRanking from "@/components/ai-tools/OpenRouterRanking";
import { completeMission, isMissionCompletedToday, markMissionCompletedToday } from "@/lib/missionHelpers";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS } from "@/constants/aiCategories";

export default function AiToolsClient() {
  const { session } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState({ category: "All" });
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && session?.user) {
      const code = "VISIT_AI_TOOLS";
      if (!isMissionCompletedToday(code)) {
        completeMission(code).then((ok) => { if (ok) markMissionCompletedToday(code); });
      }
    }
  }, [mounted, session]);

  const scrollSpyItems = DISPLAY_CATEGORIES.map((cat) => ({
    sectionId: `category-${cat}`,
    menuId: cat,
  }));
  const activeCategoryFromSpy = useScrollSpy({
    items: scrollSpyItems,
    sectionRefs,
    threshold: 0.5,
    rootMargin: "-20% 0px -20% 0px",
    mounted,
  });

  useEffect(() => {
    if (mounted && activeCategoryFromSpy && filters.category === "All") {
      setActiveCategory(activeCategoryFromSpy);
    }
  }, [mounted, activeCategoryFromSpy, filters.category]);

  const handleCategoryClick = (cat: string) => {
    if (activeCategory === cat) {
      setActiveCategory(null);
      setFilters({ category: "All" });
      return;
    }
    setActiveCategory(cat);
    setFilters({ category: cat });
  };

  return (
    <main className="w-full min-h-screen">

      {/* ── 히어로 ── */}
      <section className="pt-6 pb-5 border-b border-neutral-100 dark:border-zinc-900">
        <h1 className="text-[28px] sm:text-[36px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-1.5 break-keep">
          AI 도구 모음
        </h1>
        <p className="text-[13px] text-neutral-400 dark:text-neutral-500 break-keep">
          카테고리별로 엄선된 200개+ AI 도구
        </p>
      </section>

      {/* ── AI 모델 랭킹 (사용량/지능/가격 3열 동시) ── */}
      <section className="w-full pt-4 pb-1">
        <OpenRouterRanking />
        <Link href="/ai-models" className="mt-2 flex items-center gap-1.5 text-[12px] text-neutral-400 hover:text-[#F9954E] transition-colors">
          전체 모델 비교 · 비용 계산기 →
        </Link>
      </section>

      {/* ── 카테고리 필터 (랭킹 하위) ── */}
      <section className="pt-4 pb-0 border-b border-neutral-100 dark:border-zinc-900">
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max pb-4">
            <button
              onClick={() => { setActiveCategory(null); setFilters({ category: "All" }); }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                filters.category === "All"
                  ? "bg-neutral-950 dark:bg-white border-neutral-950 dark:border-white text-white dark:text-neutral-950"
                  : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              전체
            </button>
            {DISPLAY_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat && filters.category !== "All";
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-[#F9954E] border-[#F9954E] text-white"
                      : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {cat === "agent" && <span className="mr-1 text-[10px] bg-[#F9954E] text-white px-1.5 py-0.5 rounded-full font-black">NEW</span>}
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 도구 목록 ── */}
      <section className="w-full pb-16">
        <AiToolsList filters={filters} sectionRefs={sectionRefs} />
      </section>

    </main>
  );
}
