"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
    Rocket,
    Gamepad2,
    Wrench,
    Lightbulb,
    Users,
    ShoppingBag,
    TrendingUp,
    Star
} from "lucide-react";
import {
    ProjectPreview,
    MinigamePreview,
    AIToolsPreview,
    InsightPreview
} from "./CategoryContentPreview";

const categories = [
    {
        title: "프로젝트",
        description: "DORI-AI가 진행하는 다양한 AI 프로젝트",
        href: "/project",
        icon: Rocket,
        gradient: "from-orange-400 to-orange-500",
        previewComponent: ProjectPreview,
        stats: {
            count: "12+",
            label: "진행 중인 프로젝트",
            trend: "+3 이번 달"
        }
    },
    {
        title: "미니게임",
        description: "AI와 함께 즐기는 인터랙티브 게임",
        href: "/minigame",
        icon: Gamepad2,
        gradient: "from-orange-500 to-orange-600",
        previewComponent: MinigamePreview,
        stats: {
            count: "8+",
            label: "플레이 가능한 게임",
            trend: "신규 게임 출시"
        }
    },
    {
        title: "AI 도구",
        description: "실전에서 유용한 최고의 AI 툴 모음",
        href: "/ai-tools",
        icon: Wrench,
        gradient: "from-orange-300 to-orange-500",
        previewComponent: AIToolsPreview,
        stats: {
            count: "50+",
            label: "큐레이션된 도구",
            trend: "매주 업데이트"
        }
    },
    {
        title: "인사이트",
        description: "최신 AI 트렌드와 기술 분석 아티클",
        href: "/insight",
        icon: Lightbulb,
        gradient: "from-amber-400 to-orange-500",
        previewComponent: InsightPreview,
        stats: {
            count: "100+",
            label: "인사이트 아티클",
            trend: "주간 업데이트"
        }
    },
    {
        title: "커뮤니티",
        description: "함께 성장하는 AI 크리에이터들의 모임",
        href: "/community",
        icon: Users,
        gradient: "from-orange-500 to-red-500",
        previewComponent: null, // 커뮤니티는 미리보기 없음
        stats: {
            count: "1.2K+",
            label: "활성 멤버",
            trend: "+250 이번 달"
        }
    },
    {
        title: "마켓",
        description: "프롬프트, 에셋 등 AI 리소스 마켓플레이스",
        href: "/market",
        icon: ShoppingBag,
        gradient: "from-orange-600 to-red-600",
        previewComponent: null, // 마켓은 미리보기 없음
        stats: {
            count: "200+",
            label: "리소스 아이템",
            trend: "신규 입점"
        }
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const cardVariants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 15,
            mass: 1
        }
    }
};

export function CategoryGrid() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <section className="w-full px-6 py-16 bg-background">
            <div className="max-w-7xl mx-auto">

                {/* 카테고리 그리드 */}
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {categories.map((category) => {
                        const PreviewComponent = category.previewComponent;

                        return (
                            <motion.div
                                key={category.title}
                                variants={cardVariants}
                                whileHover={{
                                    y: -8,
                                    transition: { duration: 0.3 }
                                }}
                                className="flex flex-col"
                            >
                                {/* 메인 카드 */}
                                <Link href={category.href} className="group relative block">
                                    <div className="relative bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl dark:hover:shadow-orange-500/10">
                                        {/* Gradient Background Effect - Reduced opacity */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-5 blur-3xl transition-opacity duration-500 rounded-full`} />

                                        {/* Icon Container - Outline Style */}
                                        <div className="relative mb-4">
                                            <div className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 flex items-center justify-center group-hover:border-orange-500 dark:group-hover:border-orange-500 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                                                <category.icon className={`w-7 h-7 text-neutral-700 dark:text-neutral-300 group-hover:text-orange-500 transition-colors`} />
                                            </div>

                                            {/* Arrow Icon */}
                                            <motion.div
                                                className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                                                initial={{ rotate: 0, scale: 0 }}
                                                whileHover={{ rotate: 45, scale: 1 }}
                                            >
                                                <span className="text-white text-sm font-bold">→</span>
                                            </motion.div>
                                        </div>

                                        {/* Content */}
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-card-foreground mb-2 group-hover:text-orange-500 transition-colors duration-300">
                                                {category.title}
                                            </h3>

                                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                                {category.description}
                                            </p>

                                            {/* Divider */}
                                            <div className="h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-zinc-700 to-transparent mb-4" />

                                            {/* Stats Section */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                                                            {category.stats.count}
                                                        </span>
                                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            {category.stats.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {category.stats.trend}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shine Effect on Hover */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                        </div>
                                    </div>
                                </Link>

                                {/* 콘텐츠 미리보기 (카드 하단에 배치) */}
                                {PreviewComponent && (
                                    <div className="bg-muted/50 border border-t-0 border-border rounded-b-2xl p-6 -mt-2">
                                        <PreviewComponent />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
