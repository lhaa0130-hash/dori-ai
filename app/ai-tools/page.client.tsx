"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import OpenRouterRanking from "@/components/ai-tools/OpenRouterRanking";
import { completeMission, isMissionCompletedToday, markMissionCompletedToday } from "@/lib/missionHelpers";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { DISPLAY_CATEGORIES, CATEGORY_LABELS, CATEGORY_LABELS_EN } from "@/constants/aiCategories";
import type { AiTool } from "@/types/content";

type Locale = "ko" | "en";
const CLIENT_T = {
  ko: { h1: "AI 도구 모음", sub: "카테고리별로 엄선된 340개+ AI 도구", compare: "전체 모델 비교 · 비용 계산기 →", all: "전체" },
  en: { h1: "AI Tools Directory", sub: "340+ hand-picked AI tools by category", compare: "Compare all models · cost calculator →", all: "All" },
};

export default function AiToolsClient({ locale = "ko", toolsData }: { locale?: Locale; toolsData?: AiTool[] }) {
  const { session } = useAuth();
  const tt = CLIENT_T[locale];
  const LABELS = locale === "en" ? CATEGORY_LABELS_EN : CATEGORY_LABELS;
  const modelsHref = locale === "en" ? "/en/ai-models" : "/ai-models";
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
      <section className="pt-6 pb-5 border-b border-stone-100 dark:border-zinc-900">
        <h1 className="text-[28px] sm:text-[36px] font-extrabold text-stone-950 dark:text-white leading-[1.12] tracking-tight mb-1.5 break-keep">
          {tt.h1}
        </h1>
        <p className="text-[13px] text-stone-400 dark:text-stone-500 break-keep">
          {tt.sub}
        </p>

        {/* ⚠️ 이 도입부는 장식이 아니다. 2026-08-13 Search Console 실측에서 이 페이지가
            "ai 도구" 19위 · "ai 툴" 44위로 **사이트에서 가장 높은 순위**였는데, H1 바로 뒤에
            카테고리 버튼만 있고 이 페이지가 무엇인지 설명하는 문장이 하나도 없었다.
            검색엔진에도 사람에게도 첫 문단이 필요하다. 표현은 실제 검색어를 그대로 쓴다. */}
        {locale === "en" ? (
          <div className="mt-4 space-y-3 text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed break-keep">
            <p>
              The hard part of choosing an AI tool is that there are simply too many of them. This
              directory sorts <strong>340+ AI tools by what you are trying to do</strong> — writing,
              images, coding, video, voice, automation — and notes what each one is actually good at,
              how far its free tier goes, and whether it offers an API.
            </p>
            <p>
              If you want to start without paying, begin with the <strong>free AI picks</strong> below;
              each entry lists the real daily limit. If cost is the deciding factor, the{" "}
              <Link href={modelsHref} className="text-[#F9954E] hover:underline">model comparison and cost calculator</Link>{" "}
              works out what each model would actually bill you per month.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed break-keep">
            <p>
              어떤 <strong>AI 도구</strong>를 써야 할지 고를 때 가장 어려운 건 종류가 너무 많다는
              점입니다. 이 페이지는 <strong>글쓰기·이미지·코딩·영상·목소리·자동화</strong>처럼{" "}
              <strong>하려는 일을 기준으로</strong> AI 툴 340개를 분류해 두었습니다. 도구마다 무엇을
              잘하는지, 무료로 어디까지 되는지, API가 있는지를 함께 적었습니다.
            </p>
            <p>
              돈을 안 쓰고 시작하고 싶다면 아래 <strong>무료 AI</strong>부터 보세요 — 항목마다 하루
              사용 한도를 실제 수치로 적어 뒀습니다. 요금이 판단 기준이라면{" "}
              <Link href={modelsHref} className="text-[#F9954E] hover:underline">AI 모델 비교·비용 계산기</Link>
              에서 모델별 월 청구액을 계산해 볼 수 있습니다.
            </p>
          </div>
        )}
      </section>

      {/* ── AI 모델 랭킹 (사용량/지능/가격 3열 동시) ── */}
      <section className="w-full pt-4 pb-1">
        <OpenRouterRanking locale={locale} />
        <Link href={modelsHref} className="mt-2 flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-[#F9954E] transition-colors">
          {tt.compare}
        </Link>
      </section>

      {/* ── 카테고리 필터 (랭킹 하위) ── */}
      <section className="pt-4 pb-0 border-b border-stone-100 dark:border-zinc-900">
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max pb-4">
            <button
              onClick={() => { setActiveCategory(null); setFilters({ category: "All" }); }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                filters.category === "All"
                  ? "bg-stone-950 dark:bg-white border-stone-950 dark:border-white text-white dark:text-stone-950"
                  : "bg-white dark:bg-zinc-950 border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-stone-400"
              }`}
            >
              {tt.all}
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
                      : "bg-white dark:bg-zinc-950 border-stone-200 dark:border-zinc-700 text-stone-500 dark:text-stone-400"
                  }`}
                >
                  {cat === "agent" && <span className="mr-1 text-[10px] bg-[#F9954E] text-white px-1.5 py-0.5 rounded-full font-black">NEW</span>}
                  {LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 도구 목록 ── */}
      <section className="w-full pb-16">
        <AiToolsList filters={filters} sectionRefs={sectionRefs} locale={locale} toolsData={toolsData} />
      </section>

    </main>
  );
}
