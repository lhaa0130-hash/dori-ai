"use client";

import { motion } from "framer-motion";

export function IntroSection() {
    return (
        <section className="relative w-full py-20 px-6 flex flex-col items-center justify-center text-center">
            <div
                className="max-w-4xl mx-auto space-y-6"
            >
                <h2 className="text-xl md:text-2xl font-medium text-orange-500 tracking-wide uppercase">
                    Creative Studio
                </h2>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
                    DORI-AI
                </h1>
                <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                    상상을 현실로 만드는 AI 에이전트 스튜디오.<br className="hidden md:inline" />
                    우리는 AI와 함께 새로운 미래를 그려나갑니다.
                </p>
            </div>
        </section>
    );
}
