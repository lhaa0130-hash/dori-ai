"use client";

import { Sparkles, Gamepad2, Play, Star, Trophy, Swords, BrainCircuit, MousePointer2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const GAMES = [
    {
        id: "quiz",
        title: "AI 상식 퀴즈",
        description: "AI 관련 상식을 테스트하고 지식을 넓혀보세요.",
        icon: <BrainCircuit className="w-8 h-8" />,
        color: "#f59e0b",
        status: "PLAY",
        href: "/minigame/quiz"
    },
    {
        id: "memory",
        title: "카드 뒤집기",
        description: "카드의 위치를 기억해 짝을 맞추는 두뇌 게임.",
        icon: <Gamepad2 className="w-8 h-8" />,
        color: "#a855f7",
        status: "PLAY",
        href: "/minigame/memory"
    },
    {
        id: "reaction",
        title: "반응속도 테스트",
        description: "당신의 순발력을 테스트해보세요. (준비 중)",
        icon: <MousePointer2 className="w-8 h-8" />,
        color: "#ef4444",
        status: "COMING SOON",
        href: "#"
    }
];

export default function MinigamePage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-white dark:!bg-black text-neutral-900 dark:text-white transition-colors duration-500 relative overflow-hidden">

            {/* 배경 그라데이션 (Standard) */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:hidden pointer-events-none z-0" />

            {/* 히어로 섹션 */}
            <section className="relative pt-32 pb-16 px-6 text-center z-10">
                <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
                        <Gamepad2 className="w-3 h-3" />
                        <span>Arcade Center</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            미니게임
                        </span>
                    </h1>
                    <p className={`text-base md:text-lg font-medium break-keep leading-relaxed max-w-xl ${isDark ? "text-white" : "text-neutral-600"}`}>
                        잠시 쉬어가는 즐거움, <span className="text-orange-500">AI와 함께하는</span> 미니게임 천국
                    </p>
                </div>
            </section>

            {/* 게임 그리드 */}
            <section className="container max-w-6xl mx-auto px-6 pb-32 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GAMES.map((game, index) => (
                        <div
                            key={game.id}
                            className="group relative flex flex-col p-6 rounded-[2rem] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-neutral-200 dark:border-zinc-800 hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300"
                            style={{
                                animation: `slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`
                            }}
                        >
                            {/* Icon */}
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border transition-all duration-300 group-hover:scale-105"
                                style={{
                                    borderColor: game.color,
                                    backgroundColor: isDark ? "#000000" : `${game.color}15`,
                                    color: game.color,
                                    boxShadow: isDark ? `0 0 20px ${game.color}30` : 'none'
                                }}
                            >
                                {game.icon}
                            </div>

                            <h3 className={`text-xl font-bold mb-2 transition-colors group-hover:text-orange-500 ${isDark ? "text-white" : "text-neutral-900"}`}>
                                {game.title}
                            </h3>
                            <p className={`text-sm mb-6 flex-1 ${isDark ? "text-white" : "text-neutral-500"}`}>
                                {game.description}
                            </p>

                            <Link href={game.href} className="mt-auto">
                                <button
                                    disabled={game.status !== "PLAY"}
                                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 
                                ${game.status === "PLAY"
                                            ? "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white"
                                            : "bg-neutral-100 dark:bg-zinc-800 text-neutral-400 cursor-not-allowed"
                                        }`}
                                >
                                    {game.status === "PLAY" ? (
                                        <>
                                            <Play className="w-4 h-4 fill-current" />
                                            Play Now
                                        </>
                                    ) : (
                                        "Coming Soon"
                                    )}
                                </button>
                            </Link>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
