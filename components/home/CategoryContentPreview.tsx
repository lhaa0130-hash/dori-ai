"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, Clock, Gamepad2, Lightbulb, Cog, Sparkles, TrendingUp, Star, Globe, BookOpen, Smartphone, Video, Film, ShoppingBag, Timer, Swords, BrainCircuit, MousePointer2, Coins, Target, Dices, Hand, Zap, Palette, Sword } from "lucide-react";

// 프로젝트 미리보기 데이터 (실제로는 API나 파일에서 가져와야 함)
// 프로젝트 미리보기 데이터 (프로젝트 페이지와 동기화)
const projectPreviews = [
    {
        id: "site",
        title: "사이트: DORI-AI",
        description: "AI 정보를 공유하고 소통하는 커뮤니티 플랫폼",
        status: "ACTIVE",
        statusLabel: "진행 중",
        category: "Web Platform",
        icon: <Globe className="w-5 h-5 text-orange-500" />
    },
    {
        id: "animal",
        title: "동물 도감",
        description: "아이들의 상상력을 자극하는 나만의 동물 도감",
        status: "ACTIVE",
        statusLabel: "진행 중",
        category: "AI Service",
        icon: <BookOpen className="w-5 h-5 text-orange-500" />
    },
    {
        id: "app",
        title: "애플리케이션",
        description: "언제 어디서나 접근 가능한 DORI-AI 전용 앱",
        status: "COMING SOON",
        statusLabel: "준비 중",
        category: "Mobile App",
        icon: <Smartphone className="w-5 h-5 text-neutral-400" />
    },
    {
        id: "shorts",
        title: "유튜브 숏츠",
        description: "매일 업데이트되는 최신 AI 뉴스",
        status: "COMING SOON",
        statusLabel: "준비 중",
        category: "Content",
        icon: <Video className="w-5 h-5 text-neutral-400" />
    },
    {
        id: "animation",
        title: "유튜브 애니메이션",
        description: "도리와 라라가 함께하는 교육 애니메이션",
        status: "COMING SOON",
        statusLabel: "준비 중",
        category: "Kids Tech",
        icon: <Film className="w-5 h-5 text-neutral-400" />
    },
    {
        id: "gumroad",
        title: "디지털 마켓",
        description: "AI로 생성한 고품질 디지털 에셋과 교육 자료",
        status: "COMING SOON",
        statusLabel: "준비 중",
        category: "Marketplace",
        icon: <ShoppingBag className="w-5 h-5 text-neutral-400" />
    }
];

// 미니게임 미리보기 데이터 (실제 게임 데이터로 교체)
// 미니게임 미리보기 데이터 (실제 게임 데이터로 교체)
const minigamePreviews = [
    {
        id: "quiz",
        name: "AI 상식 퀴즈",
        icon: <BrainCircuit className="w-5 h-5 text-orange-500" />,
        plays: 1234,
        rating: 4.8,
        description: "AI 관련 상식을 테스트",
        difficulty: "쉬움"
    },
    {
        id: "ladder",
        name: "사다리 타기",
        icon: <Swords className="w-5 h-5 text-orange-500" />,
        plays: 856,
        rating: 4.9,
        description: "스릴 넘치는 사다리 게임",
        difficulty: "보통"
    },
    {
        id: "roulette",
        name: "룰렛",
        icon: <Timer className="w-5 h-5 text-orange-500" />,
        plays: 692,
        rating: 4.7,
        description: "행운의 룰렛을 돌려보세요",
        difficulty: "쉬움"
    },
    {
        id: "memory",
        name: "카드 뒤집기",
        icon: <Gamepad2 className="w-5 h-5 text-orange-500" />,
        plays: 543,
        rating: 4.6,
        description: "카드 짝 맞추기",
        difficulty: "보통"
    },
    {
        id: "coinflip",
        name: "동전 던지기",
        icon: <Coins className="w-5 h-5 text-orange-500" />,
        plays: 478,
        rating: 4.5,
        description: "3D 회전 동전 게임",
        difficulty: "쉬움"
    },
    {
        id: "guess",
        name: "숫자 맞추기",
        icon: <Target className="w-5 h-5 text-orange-500" />,
        plays: 412,
        rating: 4.7,
        description: "힌트로 숫자 찾기",
        difficulty: "보통"
    },
    {
        id: "dice",
        name: "주사위 굴리기",
        icon: <Dices className="w-5 h-5 text-orange-500" />,
        plays: 389,
        rating: 4.6,
        description: "1-6개 주사위 게임",
        difficulty: "쉬움"
    },
    {
        id: "rps",
        name: "가위바위보",
        icon: <Hand className="w-5 h-5 text-orange-500" />,
        plays: 325,
        rating: 4.4,
        description: "AI와 가위바위보 대결",
        difficulty: "쉬움"
    },
    {
        id: "typingspeed",
        name: "타이핑 속도",
        icon: <Zap className="w-5 h-5 text-orange-500" />,
        plays: 298,
        rating: 4.5,
        description: "WPM 타이핑 테스트",
        difficulty: "보통"
    },
    {
        id: "colormatch",
        name: "색깔 맞추기",
        icon: <Palette className="w-5 h-5 text-orange-500" />,
        plays: 267,
        rating: 4.8,
        description: "30초 색깔 도전",
        difficulty: "어려움"
    }
];


// AI 도구 미리보기 데이터 - 카테고리별 TOP 3
const aiToolsByCategory = [
    {
        category: "대화형 AI",
        tools: [
            { rank: 1, name: "ChatGPT", rating: 4.9 },
            { rank: 2, name: "Claude", rating: 4.8 },
            { rank: 3, name: "Gemini", rating: 4.7 }
        ]
    },
    {
        category: "이미지 생성",
        tools: [
            { rank: 1, name: "Midjourney", rating: 4.9 },
            { rank: 2, name: "DALL-E 3", rating: 4.7 },
            { rank: 3, name: "Stable Diffusion", rating: 4.6 }
        ]
    },
    {
        category: "영상 제작",
        tools: [
            { rank: 1, name: "Runway", rating: 4.8 },
            { rank: 2, name: "Pika", rating: 4.6 },
            { rank: 3, name: "Luma Dream", rating: 4.5 }
        ]
    },
    {
        category: "코딩 AI",
        tools: [
            { rank: 1, name: "Cursor", rating: 4.9 },
            { rank: 2, name: "GitHub Copilot", rating: 4.8 },
            { rank: 3, name: "Replit", rating: 4.6 }
        ]
    },
    {
        category: "음악 생성",
        tools: [
            { rank: 1, name: "Suno", rating: 4.8 },
            { rank: 2, name: "Udio", rating: 4.7 },
            { rank: 3, name: "Stable Audio", rating: 4.5 }
        ]
    },
    {
        category: "자동화",
        tools: [
            { rank: 1, name: "n8n", rating: 4.8 },
            { rank: 2, name: "Zapier", rating: 4.7 },
            { rank: 3, name: "Make", rating: 4.6 }
        ]
    }
];

// 인사이트 미리보기 데이터 - 카테고리별 최신글 2개
const insightsByCategory = [
    {
        category: "AI 트렌드",
        articles: [
            { title: "2026년 주목할 AI 기술 트렌드", date: "2026.02.05" },
            { title: "생성형 AI의 새로운 패러다임", date: "2026.02.01" }
        ]
    },
    {
        category: "실전 가이드",
        articles: [
            { title: "ChatGPT 프롬프트 작성 완벽 가이드", date: "2026.02.03" },
            { title: "이미지 생성 AI 활용법", date: "2026.01.28" }
        ]
    },
    {
        category: "도구 리뷰",
        articles: [
            { title: "최신 AI 코딩 도구 비교 분석", date: "2026.02.02" },
            { title: "무료 AI 도구 TOP 10", date: "2026.01.30" }
        ]
    }
];

// 프로젝트 미리보기 컴포넌트 - 확장된 버전
export function ProjectPreview() {
    return (
        <div className="pt-1">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Cog className="w-4 h-4 text-orange-500" />
                    진행 중인 프로젝트
                </h3>
                <Link href="/project" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    전체 보기
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
                {projectPreviews.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/project" className="group block">
                            <div className="py-2 px-3 rounded-lg bg-card/50 border border-strict hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-md">
                                <div className="flex items-start gap-2.5 mb-0.5">
                                    <div className="shrink-0 mt-0.5">
                                        {project.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <h4 className="text-sm font-semibold text-foreground group-hover:text-orange-500 transition-colors line-clamp-1">
                                                {project.title}
                                            </h4>
                                            <span className={`text-[9px] px-1.5 py-0 rounded-full flex-shrink-0 ml-2 border ${project.status === "ACTIVE"
                                                ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30"
                                                : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-neutral-100 dark:border-neutral-700"
                                                }`}>
                                                {project.statusLabel}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                            {project.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 pl-7">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-2.5 h-2.5" />
                                        <span>DORI Team</span>
                                    </span>
                                    <span>{project.category}</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// 미니게임 미리보기 컴포넌트 - 확장된 버전
export function MinigamePreview() {
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "쉬움": return "text-neutral-400 dark:text-neutral-500";
            case "보통": return "text-neutral-600 dark:text-neutral-400";
            case "어려움": return "text-orange-500 dark:text-orange-400";
            default: return "text-neutral-400";
        }
    };

    return (
        <div className="pt-1">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-orange-500" />
                    인기 미니게임
                </h3>
                <Link href="/minigame" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    전체 보기
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
                {minigamePreviews.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.06 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/minigame" className="group block">
                            <div className="py-2 px-3 rounded-lg bg-card border border-strict hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-md">
                                <div className="flex items-start gap-2 mb-1">
                                    <div className="shrink-0 mt-0.5">{game.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-foreground line-clamp-1 mb-0">
                                            {game.name}
                                        </h4>
                                        {game.rating > 0 && (
                                            <div className="flex items-center gap-0.5">
                                                <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                                                <span className="text-[9px] text-muted-foreground">
                                                    {game.rating}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground mb-1.5 line-clamp-1">
                                    {game.description}
                                </p>
                                <div className="flex items-center justify-between text-[9px]">
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                                        {game.plays > 0 ? `🎮 ${game.plays.toLocaleString()}` : "🚧 준비중"}
                                    </span>
                                    <span className={`font-medium ${getDifficultyColor(game.difficulty)}`}>
                                        {game.difficulty}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// AI 도구 미리보기 컴포넌트 - 카테고리별 랭킹
export function AIToolsPreview() {
    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1: return "text-yellow-500"; // 금메달
            case 2: return "text-neutral-400"; // 은메달
            case 3: return "text-orange-600"; // 동메달
            default: return "text-neutral-400";
        }
    };

    const getRankEmoji = (rank: number) => {
        switch (rank) {
            case 1: return "🥇";
            case 2: return "🥈";
            case 3: return "🥉";
            default: return "";
        }
    };

    return (
        <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    카테고리별 TOP 3
                </h3>
                <Link href="/ai-tools" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    전체 보기
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="space-y-1.5">
                {aiToolsByCategory.map((categoryData, categoryIndex) => (
                    <motion.div
                        key={categoryData.category}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: categoryIndex * 0.05 }}
                        viewport={{ once: true }}
                    >
                        <div className="bg-card/30 border border-neutral-200/50 dark:border-zinc-800/50 rounded-lg p-1.5">
                            <h4 className="text-[9px] font-bold text-orange-500 mb-1 flex items-center gap-1 tracking-tight px-1">
                                <span className="w-0.5 h-0.5 bg-orange-500 rounded-full" />
                                {categoryData.category}
                            </h4>
                            <div className="grid grid-cols-3 gap-1">
                                {categoryData.tools.map((tool, toolIndex) => (
                                    <Link
                                        key={tool.rank}
                                        href="/ai-tools"
                                        className="group flex items-center gap-1 p-1.5 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded transition-all"
                                    >
                                        <span className={`text-xs flex-shrink-0 ${getRankColor(tool.rank)}`}>
                                            {getRankEmoji(tool.rank)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-bold text-foreground group-hover:text-orange-500 transition-colors truncate block leading-tight">
                                                {tool.name}
                                            </span>
                                            <div className="flex items-center gap-0.5 mt-0.5">
                                                <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                                                <span className="text-[8px] text-muted-foreground font-semibold">
                                                    {tool.rating}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// 인사이트 미리보기 컴포넌트 - 카테고리별 최신글
export function InsightPreview() {
    return (
        <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-orange-500" />
                    최신 인사이트
                </h3>
                <Link href="/insight" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    전체 보기
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="space-y-1.5">
                {insightsByCategory.map((categoryData, categoryIndex) => (
                    <motion.div
                        key={categoryData.category}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: categoryIndex * 0.05 }}
                        viewport={{ once: true }}
                    >
                        <div className="bg-card/30 border border-neutral-200/50 dark:border-zinc-800/50 rounded-lg p-1.5">
                            <h4 className="text-[9px] font-bold text-orange-500 mb-1 flex items-center gap-1 tracking-tight px-1">
                                <span className="w-0.5 h-0.5 bg-orange-500 rounded-full" />
                                {categoryData.category}
                            </h4>
                            <div className="space-y-1">
                                {categoryData.articles.map((article, articleIndex) => (
                                    <Link
                                        key={articleIndex}
                                        href="/insight"
                                        className="group block p-1.5 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded transition-all"
                                    >
                                        <h5 className="text-[10px] font-bold text-foreground group-hover:text-orange-500 transition-colors line-clamp-1 leading-tight mb-0.5">
                                            {article.title}
                                        </h5>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-2 h-2 text-muted-foreground" />
                                            <span className="text-[8px] text-muted-foreground font-semibold">
                                                {article.date}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
