"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: "easeOut", // Safe fallback for easing
    },
  }),
};

export const HeroSection = () => {
  const title = "Creative Studio DORI-AI";
  const words = title.split(" ");

  return (
    <section className="relative flex flex-col items-center justify-center w-full min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center p-4 max-w-5xl mx-auto text-center">

        {/* Animated Title */}
        <div className="flex flex-wrap justify-center gap-x-3 md:gap-x-5 mb-6 overflow-hidden">
          {words.map((word, i) => (
            <motion.h1
              key={i}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={textVariants}
              className="text-5xl md:text-8xl font-bold tracking-tight text-neutral-900 dark:text-white"
            >
              {word === "DORI-AI" ? (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600">
                  {word}
                </span>
              ) : (
                word
              )}{" "}
            </motion.h1>
          ))}
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="text-neutral-500 dark:text-neutral-400 text-lg md:text-2xl max-w-2xl leading-relaxed mb-12"
        >
          당신의 아이디어를 현실로 만드는<br className="md:hidden" /> 창의적인 AI 에이전트 스튜디오
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex gap-4"
        >
          <button className="px-8 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-semibold text-sm hover:scale-105 transition-transform">
            시작하기
          </button>
          <button className="px-8 py-3 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
            더 알아보기
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 flex flex-col items-center gap-2"
      >
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-4 h-4 text-neutral-400" />
        </motion.div>
      </motion.div>
    </section>
  );
};