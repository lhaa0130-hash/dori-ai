"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function IntroSection() {
    return (
        <section className="relative w-full py-20 px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-background">
            {/* Background - 다크모드 그라데이션 강화 */}
            {/* Background - semantic gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-background to-background dark:from-zinc-950 dark:via-background dark:to-background" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-5xl mx-auto relative z-10"
            >
                {/* 배지 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-950/50 dark:to-pink-950/50 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-300 rounded-full text-sm font-semibold mb-8 shadow-sm"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>AI 커뮤니티 플랫폼</span>
                </motion.div>

                {/* 메인 타이틀 */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-5xl md:text-7xl font-bold mb-6"
                >
                    <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                        DORI-AI
                    </span>
                </motion.h1>

                {/* 서브 타이틀 */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-xl md:text-2xl font-medium text-foreground/80 mb-4"
                >
                    Design Of Real Intelligence
                </motion.p>

                {/* 설명 */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                    AI라는 새로운 영역 앞에서 주저하는 당신에게,
                    <br />
                    <span className="font-semibold text-orange-600 dark:text-orange-400">가능성으로 향하는 길</span>을 함께 만들어갑니다
                    <br />
                    <span className="text-sm mt-3 block opacity-80 text-neutral-600 dark:text-neutral-400">지식이 아닌 경험을, 도구가 아닌 연결을, 결과가 아닌 과정을 나누는 공간</span>
                </motion.p>

                {/* 포인트 강조 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-neutral-700 dark:text-neutral-300"
                >
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        50+ AI 도구
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                        100+ 인사이트
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        1.2K+ 멤버
                    </span>
                </motion.div>
            </motion.div>

            {/* CSS for gradient animation */}
            <style jsx>{`
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
