"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    Rocket,
    Gamepad2,
    Wrench,
    Lightbulb,
    Users,
    ShoppingBag
} from "lucide-react";

const categories = [
    {
        title: "프로젝트",
        description: "DORI-AI가 진행하는 다양한 AI 프로젝트",
        href: "/project",
        icon: Rocket,
        color: "bg-blue-500",
    },
    {
        title: "미니게임",
        description: "AI와 함께 즐기는 인터랙티브 게임",
        href: "/minigame",
        icon: Gamepad2,
        color: "bg-purple-500",
    },
    {
        title: "AI 도구",
        description: "실전에서 유용한 최고의 AI 툴 모음",
        href: "/ai-tools",
        icon: Wrench,
        color: "bg-emerald-500",
    },
    {
        title: "인사이트",
        description: "최신 AI 트렌드와 기술 분석 아티클",
        href: "/insight",
        icon: Lightbulb,
        color: "bg-yellow-500",
    },
    {
        title: "커뮤니티",
        description: "함께 성장하는 AI 크리에이터들의 모임",
        href: "/community",
        icon: Users,
        color: "bg-pink-500",
    },
    {
        title: "마켓",
        description: "프롬프트, 에셋 등 AI 리소스 마켓플레이스",
        href: "/market",
        icon: ShoppingBag,
        color: "bg-orange-500",
    },
];

export function CategoryGrid() {
    return (
        <section className="w-full px-6 pb-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                    <Link
                        key={category.title}
                        href={category.href}
                        className="group relative"
                    >
                        <div
                            className="h-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl dark:hover:shadow-orange-500/10 transition-all duration-300 group-hover:-translate-y-1"
                        >
                            <div className={`w-12 h-12 rounded-xl ${category.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <category.icon className={`w-6 h-6 ${category.color.replace('bg-', 'text-')}`} />
                            </div>

                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-orange-500 transition-colors">
                                {category.title}
                            </h3>

                            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {category.description}
                            </p>

                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                <span className="text-neutral-300 dark:text-neutral-600">↗</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
