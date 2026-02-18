"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function IntroSection() {
    return (
        <section className="relative w-full py-20 px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-background">
            {/* Background - 다크모드 그라데이션 강화 */}
            {/* Background - semantic gradient - Darker for dark mode */}
            <div className="absolute inset-0 intro-gradient" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-3xl mx-auto relative z-10 flex flex-col items-center gap-4"
            >
                {/* 1. Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight"
                >
                    <span className="bg-gradient-to-r from-[#FBAA60] via-[#F9954E] to-[#E8832E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                        DORI-AI
                    </span>
                </motion.h1>

                {/* 2. Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-xl md:text-2xl font-medium text-foreground/80 mb-2"
                >
                    Design Of Real Intelligence
                </motion.p>

                {/* 3. Description Line 1 */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-base md:text-lg text-muted-foreground leading-relaxed"
                >
                    AI라는 새로운 영역 앞에서 주저하는 당신에게, <span className="font-semibold text-[#E8832E] dark:text-[#FBAA60]">가능성으로 향하는 길</span>을 함께 만들어갑니다
                </motion.p>

                {/* 4. Description Line 2 */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-sm md:text-base text-muted-foreground/80"
                >
                    지식이 아닌 경험을, 도구가 아닌 연결을, 결과가 아닌 과정을 나누는 공간
                </motion.p>

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
