"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, Clock, Gamepad2, Lightbulb, Cog, Sparkles, TrendingUp, Star, Globe, BookOpen, Smartphone, Video, Film, ShoppingBag, Timer, Swords, BrainCircuit, MousePointer2 } from "lucide-react";

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
        description: "AI 관련 상식을 테스트하는 퀴즈",
        difficulty: "쉬움"
    },
    {
        id: "memory",
        name: "카드 뒤집기",
        icon: <Gamepad2 className="w-5 h-5 text-orange-500" />,
        plays: 0,
        rating: 0,
        description: "Dori 캐릭터 카드 짝 맞추기",
        difficulty: "보통"
    },
    {
        id: "reaction",
        name: "반응속도 테스트",
        icon: <MousePointer2 className="w-5 h-5 text-neutral-400" />,
        plays: 0,
        rating: 0,
        description: "당신의 반사신경을 테스트하세요 (준비중)",
        difficulty: "준비중"
    }
];

// AI 도구 미리보기 데이터
const aiToolsPreviews = [
    { name: "ChatGPT", category: "대화형", badge: "인기", color: "green" },
    { name: "Midjourney", category: "이미지", badge: "추천", color: "purple" },
    { name: "Runway", category: "영상", badge: "신규", color: "blue" },
    { name: "ElevenLabs", category: "음성", badge: "Hot", color: "orange" },
    { name: "Claude", category: "대화형", badge: "최신", color: "blue" },
    { name: "Suno", category: "음악", badge: "트렌딩", color: "pink" }
];

// 인사이트 미리보기 데이터
const insightPreviews = [
    {
        title: "한국의 국가대표 AI 모델 'K-AI GPT' 공개와 미래 전략",
        date: "2025.12.31",
        views: 5120,
        category: "트렌드",
        readTime: "10분"
    },
    {
        title: "메타, $20억 규모의 AI 에이전트 스타트업 '마누스' 인수",
        date: "2025.12.31",
        views: 4150,
        category: "트렌드",
        readTime: "12분"
    },
    {
        title: "머스크의 승부수: 2026년 ‘뉴럴링크’ 양산과 뇌-컴퓨터 시대",
        date: "2026.01.05",
        views: 6720,
        category: "트렌드",
        readTime: "15분"
    },
    {
        title: "AI가 처음인 사람을 위한 인공지능 기초 안내서",
        date: "2025.12.01",
        views: 3240,
        category: "가이드",
        readTime: "7분"
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

// AI 도구 미리보기 컴포넌트 - 확장된 버전
export function AIToolsPreview() {
    const getBadgeColor = (badge: string) => {
        if (["HOT", "인기", "추천", "트렌딩"].includes(badge)) {
            return "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30";
        }
        return "bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-100 dark:border-neutral-700";
    };

    return (
        <div className="pt-1">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    추천 AI 도구
                </h3>
                <Link href="/ai-tools" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    전체 보기
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="flex flex-wrap gap-2">
                {aiToolsPreviews.map((tool, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/ai-tools" className="group">
                            <div className="px-3 py-1.5 rounded-lg bg-card border border-strict hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-sm">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-foreground group-hover:text-orange-500 transition-colors">
                                        {tool.name}
                                    </span>
                                    <span className={`text-[8px] px-1 py-0 rounded font-medium ${getBadgeColor(tool.badge)}`}>
                                        {tool.badge}
                                    </span>
                                </div>
                                <span className="text-[9px] text-muted-foreground block">
                                    {tool.category}
                                </span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// 인사이트 미리보기 컴포넌트 - 확장된 버전
export function InsightPreview() {
    return (
        <div className="pt-1">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-orange-500" />
                    최신 인사이트
                </h3>
                <Link href="/insight" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    전체 보기
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="space-y-2">
                {insightPreviews.map((insight, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/insight" className="group block p-3 rounded-lg bg-card border border-strict hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-md">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                <h4 className="text-xs font-semibold text-foreground group-hover:text-orange-500 transition-colors line-clamp-1 flex-1">
                                    {insight.title}
                                </h4>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex-shrink-0 border border-orange-200 dark:border-orange-800">
                                    {insight.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {insight.date}
                                </span>
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {insight.views.toLocaleString()} 조회
                                </span>
                                <span>📖 {insight.readTime}</span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
