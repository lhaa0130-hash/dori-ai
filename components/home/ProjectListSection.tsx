"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Globe, BookOpen, Smartphone, Video, Film, ShoppingBag, Sparkles, Code2, Cpu, Rocket } from "lucide-react";

// 프로젝트 데이터 (한국어 복원)
const projects = [
    {
        id: "animal",
        title: "나만의 동물 도감",
        description: "아이들의 상상력을 자극하는 AI 기반 동물 도감 서비스. 텍스트 설명으로 나만의 동물을 만들어보세요.",
        status: "ACTIVE",
        category: "AI Service",
        icon: BookOpen,
        color: "green", // UI handles orange override
        href: "/animal",
        tags: ["GenAI", "Kids", "Education"]
    },
    {
        id: "animal-bot",
        title: "Animal Bot Tactics",
        description: "모바일 게임 : 조립을... 잘 못했어요!! 나만의 봇을 조립하고 전략을 펼치는 모바일 택틱스 게임.",
        status: "ACTIVE",
        category: "Mobile Game",
        icon: Smartphone,
        color: "indigo",
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
        color: "blue",
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
        color: "red",
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
        color: "purple",
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
        color: "pink",
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
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
    }
};

export function ProjectListSection() {
    // Filter projects
    const activeProjects = projects.filter(p => p.status === "ACTIVE");
    const upcomingProjects = projects.filter(p => p.status === "COMING SOON");

    return (
        <section className="w-full min-h-screen relative overflow-hidden flex flex-col items-center">

            {/* Background: Original Intro Gradient */}
            <div className="absolute inset-0 intro-gradient -z-10" />

            <div className="max-w-6xl w-full px-6 pb-20 pt-4 relative z-10">

                {/* 2. LIVE SERVICE SECTION */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-30" />
                        <span className="text-sm font-bold tracking-widest text-orange-500 uppercase flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            Live Service
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-30" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {activeProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                variants={itemVariants}
                                className="group"
                            >
                                <Link href={project.href} className="flex flex-col h-full relative">
                                    {/* Card Body - Medium Size */}
                                    <div className="relative h-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl rounded-[2.2rem] p-8 
                                        border border-white/40 dark:border-white/10 
                                        shadow-[0_6px_25px_rgb(0,0,0,0.04)] dark:shadow-none 
                                        hover:shadow-[0_18px_45px_rgba(249,115,22,0.22)] dark:hover:shadow-[0_18px_35px_rgba(249,115,22,0.12)] 
                                        hover:border-orange-500/40 
                                        hover:bg-gradient-to-br hover:from-white/80 hover:to-orange-50/40 dark:hover:from-zinc-900 dark:hover:to-orange-900/10
                                        transition-all duration-500 transform group-hover:-translate-y-1.5 group-hover:scale-[1.015]">

                                        <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 text-orange-500">
                                            <ArrowUpRight className="w-7 h-7" />
                                        </div>

                                        <div className="mb-6">
                                            <div className="w-16 h-16 rounded-[1.8rem] bg-orange-50 dark:bg-orange-900/10 text-orange-500 dark:text-orange-400 flex items-center justify-center transition-all duration-500 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_8px_22px_rgba(249,115,22,0.35)] group-hover:scale-110 group-hover:rotate-3 border border-orange-100 dark:border-orange-500/10">
                                                <project.icon className="w-8 h-8 transition-transform duration-500 group-hover:rotate-[-3deg]" strokeWidth={1.5} />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 w-fit backdrop-blur-sm border border-orange-100 dark:border-orange-500/10">
                                                <span className="text-[11px] font-bold tracking-widest uppercase text-orange-600 dark:text-orange-400">{project.category}</span>
                                            </div>

                                            <h3 className="text-2xl font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors tracking-tight">
                                                {project.title}
                                            </h3>

                                            <p className="text-base text-muted-foreground/90 leading-relaxed break-keep font-normal group-hover:text-foreground/80 transition-colors">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* 3. COMING SOON SECTION */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-500/20 to-transparent opacity-30" />
                        <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">Coming Soon</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-500/20 to-transparent opacity-30" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 hover:opacity-100 transition-opacity duration-300">
                        {upcomingProjects.map((project) => (
                            <motion.div
                                key={project.id}
                                variants={itemVariants}
                                className="group opacity-80 hover:opacity-100 transition-all duration-500"
                            >
                                <div className="flex flex-col h-full relative cursor-default">
                                    <div className="relative h-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl rounded-[2rem] p-6 
                                        border border-white/20 dark:border-white/5 
                                        shadow-none hover:shadow-[0_6px_20px_rgb(0,0,0,0.04)]
                                        hover:bg-white/60 dark:hover:bg-zinc-900/60 transition-all duration-500">

                                        <div className="mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <div className="w-12 h-12 rounded-[1.2rem] bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center transition-all duration-500 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/10 group-hover:text-orange-500">
                                                <project.icon className="w-6 h-6" strokeWidth={1.5} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="hidden md:inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-neutral-100/50 dark:bg-zinc-800/50 w-fit backdrop-blur-sm">
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">{project.category}</span>
                                            </div>

                                            <h3 className="text-lg font-bold text-neutral-600 dark:text-neutral-400 group-hover:text-foreground transition-colors tracking-tight line-clamp-1">
                                                {project.title}
                                            </h3>

                                            <p className="text-sm text-neutral-400 dark:text-neutral-500 leading-relaxed break-keep font-light line-clamp-2">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* CSS for gradient animation */}
            <style jsx global>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </section>
    );
}
