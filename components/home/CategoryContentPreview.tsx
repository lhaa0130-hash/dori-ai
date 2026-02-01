"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, Clock, Gamepad2, Lightbulb, Cog, Sparkles, TrendingUp, Star } from "lucide-react";

// 프로젝트 미리보기 데이터 (실제로는 API나 파일에서 가져와야 함)
const projectPreviews = [
    {
        id: 1,
        title: "DORI 캐릭터 생성 프로젝트",
        status: "진행중",
        participants: 12,
        progress: 65,
        description: "AI를 활용한 DORI 브랜드 캐릭터 디자인 및 생성",
        category: "이미지 생성",
        daysLeft: 12
    },
    {
        id: 2,
        title: "AI 자동화 워크플로우",
        status: "모집중",
        participants: 8,
        progress: 30,
        description: "n8n을 활용한 업무 자동화 시스템 구축",
        category: "자동화",
        daysLeft: 25
    },
    {
        id: 3,
        title: "프롬프트 템플릿 라이브러리",
        status: "진행중",
        participants: 15,
        progress: 85,
        description: "다양한 시나리오별 고품질 프롬프트 템플릿 큐레이션",
        category: "글쓰기",
        daysLeft: 5
    },
    {
        id: 4,
        title: "AI 음성 콘텐츠 제작",
        status: "모집중",
        participants: 6,
        progress: 20,
        description: "ElevenLabs를 활용한 팟캐스트 자동 생성",
        category: "음성",
        daysLeft: 30
    }
];

// 미니게임 미리보기 데이터
const minigamePreviews = [
    {
        id: 1,
        name: "AI 퀴즈 챌린지",
        icon: "🎯",
        plays: 1234,
        rating: 4.8,
        description: "AI 지식을 테스트하세요",
        difficulty: "쉬움"
    },
    {
        id: 2,
        name: "프롬프트 배틀",
        icon: "⚔️",
        plays: 856,
        rating: 4.6,
        description: "최고의 프롬프트를 겨루세요",
        difficulty: "보통"
    },
    {
        id: 3,
        name: "이미지 추리 게임",
        icon: "🎨",
        plays: 2103,
        rating: 4.9,
        description: "AI가 생성한 이미지 맞추기",
        difficulty: "어려움"
    },
    {
        id: 4,
        name: "AI 음악 맞추기",
        icon: "🎵",
        plays: 542,
        rating: 4.5,
        description: "AI가 작곡한 음악 장르 맞추기",
        difficulty: "보통"
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
        title: "2024년 AI 트렌드: 생성형 AI의 진화",
        date: "2일 전",
        views: 1240,
        category: "트렌드",
        readTime: "5분"
    },
    {
        title: "프롬프트 엔지니어링 마스터 가이드",
        date: "5일 전",
        views: 2103,
        category: "가이드",
        readTime: "8분"
    },
    {
        title: "AI 이미지 생성 도구 비교 분석",
        date: "1주일 전",
        views: 856,
        category: "분석",
        readTime: "12분"
    },
    {
        title: "AI 자동화로 생산성 10배 높이기",
        date: "2주일 전",
        views: 3421,
        category: "튜토리얼",
        readTime: "15분"
    }
];

// 프로젝트 미리보기 컴포넌트 - 확장된 버전
export function ProjectPreview() {
    return (
        <div className="mt-6 pt-6 border-t border-strict">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Cog className="w-4 h-4 text-orange-500" />
                    진행 중인 프로젝트
                </h3>
                <Link href="/project" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    전체 보기
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {projectPreviews.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/project" className="group block">
                            <div className="p-3.5 rounded-lg bg-card/50 border border-strict hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-md">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-foreground group-hover:text-orange-500 transition-colors line-clamp-1 mb-1">
                                            {project.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                            {project.description}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${project.status === "진행중"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-muted-foreground">
                                            <Users className="w-3 h-3" />
                                            {project.participants}명
                                        </span>
                                        <span className="text-muted-foreground">
                                            {project.category}
                                        </span>
                                    </div>
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                                        D-{project.daysLeft}
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

// 미니게임 미리보기 컴포넌트 - 확장된 버전
export function MinigamePreview() {
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "쉬움": return "text-green-600 dark:text-green-400";
            case "보통": return "text-yellow-600 dark:text-yellow-400";
            case "어려움": return "text-red-600 dark:text-red-400";
            default: return "text-neutral-600 dark:text-neutral-400";
        }
    };

    return (
        <div className="mt-6 pt-6 border-t border-strict">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-orange-500" />
                    인기 미니게임
                </h3>
                <Link href="/minigame" className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                    전체 보기
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                {minigamePreviews.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.06 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/minigame" className="group block">
                            <div className="p-3 rounded-lg bg-card border border-strict hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-md">
                                <div className="flex items-start gap-2 mb-2">
                                    <div className="text-2xl">{game.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-foreground line-clamp-1 mb-0.5">
                                            {game.name}
                                        </h4>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-[10px] text-muted-foreground">
                                                {game.rating}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1">
                                    {game.description}
                                </p>
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                                        🎮 {game.plays.toLocaleString()}회
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
    const getBadgeColor = (color: string) => {
        switch (color) {
            case "green": return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400";
            case "purple": return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400";
            case "blue": return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";
            case "orange": return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400";
            case "pink": return "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400";
            default: return "bg-neutral-100 dark:bg-black text-neutral-600 dark:text-neutral-400";
        }
    };

    return (
        <div className="mt-6 pt-6 border-t border-strict">
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
                            <div className="px-3 py-2 rounded-lg bg-card border border-strict hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-foreground group-hover:text-orange-500 transition-colors">
                                        {tool.name}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${getBadgeColor(tool.color)}`}>
                                        {tool.badge}
                                    </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">
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
        <div className="mt-6 pt-6 border-t border-strict">
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
                        <Link href="/insight" className="group block p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="text-xs font-medium text-foreground group-hover:text-orange-500 transition-colors line-clamp-1 flex-1">
                                    {insight.title}
                                </h4>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex-shrink-0">
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
