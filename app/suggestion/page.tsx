"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { MessageSquarePlus, Send } from "lucide-react";

export default function SuggestionPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && theme === "dark";

    return (
        <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">

            {/* 배경 그라데이션 (Standard) */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:from-orange-900/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

            {/* 히어로 섹션 (Standard) */}
            <section className="relative pt-32 pb-16 px-6 text-center z-10">
                <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
                        <MessageSquarePlus className="w-3 h-3" />
                        <span>Feedback Loop</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            건의함
                        </span>
                    </h1>
                    <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
                        더 나은 서비스를 위한 여러분의 소중한 의견을 들려주세요.
                    </p>
                </div>
            </section>

            {/* Main Content Placeholder */}
            <section className="container max-w-2xl mx-auto px-6 pb-20 relative z-10">
                <div className="p-8 rounded-[2.5rem] bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-neutral-200 dark:border-zinc-800 text-center shadow-xl shadow-orange-500/5">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500">
                        <Send className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">준비 중입니다</h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                        곧 여러분의 의견을 자유롭게 남길 수 있는 공간이 마련될 예정입니다.<br />
                        조금만 기다려주세요!
                    </p>
                    <button className="px-6 py-3 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-400 font-bold text-sm cursor-not-allowed">
                        오픈 예정
                    </button>
                </div>
            </section>
        </main>
    );
}
