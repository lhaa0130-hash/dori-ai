"use client";

import { Sparkles, Gamepad2, Play, Star, Trophy, Swords, BrainCircuit, MousePointer2, Coins, Target, Dices, Hand, Zap, Palette, Sword, ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

const GAMES = [
    {
        id: "quiz",
        title: "AI 상식 퀴즈",
        description: "AI 관련 상식을 테스트하고 지식을 넓혀보세요.",
        icon: <BrainCircuit className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/quiz"
    },
    {
        id: "memory",
        title: "카드 뒤집기",
        description: "카드의 위치를 기억해 짝을 맞추는 두뇌 게임.",
        icon: <Gamepad2 className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/memory"
    },
    {
        id: "ladder",
        title: "사다리 타기",
        description: "내기를 할 때 필수! 스릴 넘치는 사다리 게임.",
        icon: <Swords className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/ladder"
    },
    {
        id: "coinflip",
        title: "동전 던지기",
        description: "3D 회전으로 짜릿한 동전 던지기 게임!",
        icon: <Coins className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/coinflip"
    },
    {
        id: "guess",
        title: "숫자 맞추기",
        description: "힌트를 받으며 숨겨진 숫자를 찾아보세요.",
        icon: <Target className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/guess"
    },
    {
        id: "dice",
        title: "주사위 굴리기",
        description: "1-6개의 주사위를 굴려 행운을 시험하세요!",
        icon: <Dices className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/dice"
    },
    {
        id: "roulette",
        title: "룰렛",
        description: "룰렛을 돌려 행운을 시험해보세요!",
        icon: <Trophy className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/roulette"
    },
    {
        id: "rps",
        title: "가위바위보",
        description: "컴퓨터와 대결하는 가위바위보 게임!",
        icon: <Hand className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/rps"
    },
    {
        id: "typingspeed",
        title: "타이핑 속도",
        description: "당신의 타이핑 실력을 측정해보세요.",
        icon: <Zap className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/typingspeed"
    },
    {
        id: "colormatch",
        title: "색깔 맞추기",
        description: "30초 안에 색깔을 맞춰보세요!",
        icon: <Palette className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/colormatch"
    },
    {
        id: "slot",
        title: "🎰 슬롯머신",
        description: "가상 코인으로 즐기는 3릴 슬롯머신!",
        icon: <Star className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/slot"
    },
    {
        id: "blackjack",
        title: "🃏 블랙잭",
        description: "딜러와 21점을 겨루는 카드 게임!",
        icon: <Sword className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/blackjack"
    },
    {
        id: "highlow",
        title: "🔮 하이로우",
        description: "다음 카드의 숫자를 예측하세요!",
        icon: <Sparkles className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/highlow"
    },
    {
        id: "crash",
        title: "📈 크래시",
        description: "배수가 터지기 전에 캐시아웃하세요!",
        icon: <TrendingUp className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/crash"
    },
    {
        id: "baccarat",
        title: "🃏 바카라",
        description: "플레이어 vs 뱅커, 실제 룰의 바카라!",
        icon: <MousePointer2 className="w-5 h-5" />,
        status: "PLAY",
        href: "/minigame/baccarat"
    },
];

export default function MinigamePage() {
    return (
        <main className="min-h-screen bg-background relative overflow-hidden">

            {/* Background Gradient */}
            <div className="absolute inset-0 intro-gradient -z-10" />

            {/* Header Section */}
            <section className="relative pt-32 pb-10 px-6 text-center z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-3xl mx-auto flex flex-col items-center"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-950/40 dark:to-pink-950/40 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-300 rounded-full text-[10px] font-bold mb-4 shadow-sm uppercase tracking-wider">
                        <Gamepad2 className="w-3 h-3" />
                        <span>Arcade Center</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight text-foreground">
                        Mini Games
                    </h1>

                    <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        가볍게 즐기며 AI의 원리를 체험해보세요
                    </p>
                </motion.div>
            </section>

            {/* Game Grid - Compact Design */}
            <section className="container max-w-5xl mx-auto px-6 pb-32 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {GAMES.map((game, index) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.4 }}
                            className="group"
                        >
                            <Link href={game.href} className="block h-full">
                                <div className="h-full flex items-center gap-5 p-5 
                                    bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md 
                                    border border-neutral-200/60 dark:border-white/5 
                                    rounded-2xl 
                                    hover:bg-white/80 dark:hover:bg-zinc-800/60 
                                    hover:border-orange-500/30 dark:hover:border-orange-500/30
                                    hover:shadow-lg hover:shadow-orange-500/5 
                                    transition-all duration-300 transform hover:-translate-y-0.5">

                                    {/* Icon Box */}
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-50 dark:bg-zinc-800 border border-orange-100 dark:border-zinc-700 text-orange-500 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500">
                                        {game.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-base font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                                                {game.title}
                                            </h3>
                                            <ArrowUpRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-orange-500 transition-colors" />
                                        </div>
                                        <p className="text-xs text-muted-foreground/80 line-clamp-1 group-hover:text-foreground/70 transition-colors">
                                            {game.description}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

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
        </main>
    );
}
