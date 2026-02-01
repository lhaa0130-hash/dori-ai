"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData";

// AI 도구 카테고리별로 그룹화
const groupedTools = AI_TOOLS_DATA.reduce((acc: Record<string, typeof AI_TOOLS_DATA>, tool) => {
    const category = tool.category;
    if (!acc[category]) {
        acc[category] = [];
    }
    acc[category].push(tool);
    return acc;
}, {});

const categoryLabels: Record<string, string> = {
    "llm": "대화형 AI",
    "image-generation": "이미지 생성",
    "image-editing": "이미지 편집",
    "video-generation": "영상 생성",
    "video-editing": "영상 편집",
    "voice-tts": "음성 변환",
    "music": "음악 생성",
    "automation": "자동화",
    "search": "검색",
    "agent": "AI 에이전트",
    "coding": "코딩 보조",
    "design": "디자인",
    "3d": "3D 생성",
    "writing": "글쓰기",
    "translation": "번역",
    "presentation": "프레젠테이션"
};

// AI 도구 캐러셀 컴포넌트 - 작고 깔끔한 디자인
function ToolCarousel({ category, tools }: { category: string; tools: typeof AI_TOOLS_DATA }) {
    const containerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (containerRef.current) {
            const scrollAmount = 240;
            containerRef.current.scrollBy({
                left: direction === "right" ? scrollAmount : -scrollAmount,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                    {categoryLabels[category]}
                </h3>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => scroll("left")}
                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                        aria-label="이전"
                    >
                        <ChevronLeft className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                        aria-label="다음"
                    >
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{ scrollbarWidth: "none" }}
            >
                {tools.map((tool, index) => (
                    <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        viewport={{ once: true }}
                        className="flex-shrink-0 w-48"
                    >
                        <Link href="/ai-tools" className="group block h-full">
                            <div className="h-full bg-white dark:bg-zinc-900 rounded-lg p-3.5 border border-neutral-200 dark:border-zinc-800 hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-200 hover:shadow-md">

                                {/* 헤더: 아이콘 + 이름 + 태그 */}
                                <div className="flex items-start gap-2.5 mb-2">
                                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {tool.thumbnail ? (
                                            <img
                                                src={tool.thumbnail}
                                                alt={tool.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = "none";
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `<span class="text-white text-[10px] font-bold">${tool.name[0]}</span>`;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span className="text-white text-[10px] font-bold">{tool.name[0]}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-orange-500 transition-colors line-clamp-1 leading-tight">
                                            {tool.name}
                                        </h4>
                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 inline-block mt-1">
                                            {tool.tags?.[0] || "AI"}
                                        </span>
                                    </div>
                                </div>

                                {/* 설명 */}
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-2">
                                    {tool.summary}
                                </p>

                                {/* 하단: 가격 */}
                                {tool.pricing && (
                                    <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800">
                                        <p className="text-[10px] text-neutral-500 dark:text-neutral-500 font-medium">
                                            💰 {tool.pricing}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    );
}

export function ContentPreview() {
    // 더 많은 카테고리 표시
    const displayCategories = [
        "llm",
        "image-generation",
        "video-generation",
        "coding",
        "design",
        "automation",
        "voice-tts"
    ];

    return (
        <section className="w-full px-6 py-16 bg-neutral-50 dark:bg-zinc-950">
            <div className="max-w-7xl mx-auto">
                {/* AI 도구 섹션 - 카테고리별 캐러셀 */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-1">
                                추천 AI 도구
                            </h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                카테고리별로 엄선된 AI 도구를 살펴보세요
                            </p>
                        </div>
                        <Link
                            href="/ai-tools"
                            className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 transition-colors font-medium"
                        >
                            전체 보기
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {displayCategories.map(category => (
                            groupedTools[category] && groupedTools[category].length > 0 && (
                                <ToolCarousel
                                    key={category}
                                    category={category}
                                    tools={groupedTools[category].slice(0, 12)}
                                />
                            )
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
