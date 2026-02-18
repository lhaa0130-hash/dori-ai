"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, Smartphone, Video, Film, ShoppingBag } from "lucide-react";

// 프로젝트 데이터
const projects = [
    {
        id: "animal",
        title: "나만의 동물 도감",
        description: "아이들의 상상력을 자극하는 AI 기반 동물 도감 서비스. 텍스트 설명으로 나만의 동물을 만들어보세요.",
        status: "ACTIVE",
        category: "AI Service",
        icon: BookOpen,
        href: "/animal",
        tags: ["GenAI", "Kids", "Education"]
    },
    {
        id: "animal-bot",
        title: "Animal Bot Tactics",
        description: "나만의 봇을 조립하고 전략을 펼치는 모바일 택틱스 게임.",
        status: "ACTIVE",
        category: "Mobile Game",
        icon: Smartphone,
        href: "#",
        tags: ["Unity", "Strategy", "Game"]
    },
    {
        id: "app",
        title: "DORI-AI App",
        description: "언제 어디서나 접근 가능한 DORI-AI 전용 모바일 애플리케이션.",
        status: "COMING SOON",
        category: "Mobile App",
        icon: Smartphone,
        href: "#",
        tags: ["Flutter", "Cross Platform"]
    },
    {
        id: "shorts",
        title: "AI News Shorts",
        description: "1분 안에 파악하는 글로벌 AI 트렌드 뉴스.",
        status: "COMING SOON",
        category: "Content",
        icon: Video,
        href: "#",
        tags: ["YouTube", "Trend"]
    },
    {
        id: "animation",
        title: "Dori & Lara Animation",
        description: "쉽고 재미있게 배우는 인공지능 기초 교육 애니메이션.",
        status: "COMING SOON",
        category: "Kids Tech",
        icon: Film,
        href: "#",
        tags: ["Education", "Character"]
    },
    {
        id: "gumroad",
        title: "DORI Digital Market",
        description: "AI로 생성한 고품질 디지털 에셋과 프롬프트 마켓플레이스.",
        status: "COMING SOON",
        category: "Marketplace",
        icon: ShoppingBag,
        href: "#",
        tags: ["Commerce", "Asset"]
    }
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

export function ProjectListSection() {
    // Filter projects
    const activeProjects = projects.filter(p => p.status === "ACTIVE");
    const upcomingProjects = projects.filter(p => p.status === "COMING SOON");

    return (
        <section className="w-full relative pb-20 px-6">
            <div className="max-w-7xl mx-auto">

                {/* 1. Active Projects */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-12"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F9954E] animate-pulse" />
                        <span className="text-xs font-bold tracking-widest text-[#F9954E] uppercase">
                            Live Service
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activeProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                variants={itemVariants}
                                className="group"
                            >
                                <Link href={project.href} className="flex flex-col h-full">
                                    <div className="relative h-full bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 
                                        border border-neutral-200 dark:border-neutral-800 
                                        transition-all duration-300 
                                        hover:border-[#F9954E] dark:hover:border-[#F9954E] 
                                        hover:shadow-lg hover:shadow-[#F9954E]/5
                                        group-hover:-translate-y-1">

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 text-[#F9954E] flex items-center justify-center transition-colors group-hover:bg-[#F9954E] group-hover:text-white">
                                                <project.icon className="w-6 h-6" strokeWidth={1.5} />
                                            </div>
                                            <ArrowUpRight className="w-5 h-5 text-neutral-300 group-hover:text-[#F9954E] transition-colors" />
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-[10px] font-bold tracking-widest uppercase text-[#F9954E] opacity-80">
                                                {project.category}
                                            </span>

                                            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                                {project.title}
                                            </h3>

                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* 2. Coming Soon Projects */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex items-center gap-3 mb-6 mt-12">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                        <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                            Coming Soon
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {upcomingProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                variants={itemVariants}
                                className="group opacity-70 hover:opacity-100 transition-opacity duration-300"
                            >
                                <div className="h-full bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-6 
                                    border border-neutral-100 dark:border-neutral-800 
                                    transition-colors hover:bg-white dark:hover:bg-neutral-900">

                                    <div className="mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center group-hover:text-[#F9954E] transition-colors">
                                            <project.icon className="w-5 h-5" strokeWidth={1.5} />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-base font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                                            {project.title}
                                        </h3>
                                        <p className="text-xs text-neutral-400 leading-relaxed">
                                            {project.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
