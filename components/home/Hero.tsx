"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Cpu } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-10 pb-8 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center md:text-left flex-1 min-w-0"
          >
            {/* 로고 & 뱃지 */}
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#F9954E] text-white font-bold text-xs">
                D.
              </span>
              <span className="px-2.5 py-0.5 rounded-full border border-[#F9954E]/30 bg-[#FFF5EB] dark:bg-[#F9954E]/10 text-[11px] font-bold tracking-wider uppercase text-[#F9954E]">
                Limitless Possibility
              </span>
            </div>

            {/* 메인 타이틀 */}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground mb-4">
              상상이 현실이 되는 곳,<br className="hidden md:block" />
              <span className="text-[#F9954E]">Anything is Possible.</span>
            </h1>

            {/* 서브 설명 */}
            <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed max-w-2xl mx-auto md:mx-0 break-keep">
              DORI-AI는 아이디어만 있다면 무엇이든 만들어내는 AI Creative Studio입니다.
              <br className="hidden sm:block" />
              교육, 게임, 유틸리티까지 - AI 기술로 확장되는 무한한 가능성을 경험하세요.
            </p>

            {/* 정보 태그 (PC 전용) */}
            <div className="hidden md:flex flex-wrap gap-2 mt-6">
              {['#AI_Native', '#Education', '#Game', '#Utility'].map((tag) => (
                <span key={tag} className="text-xs text-neutral-400 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: CTA & Info Cards (오른쪽 영역을 활용해 정보 전달) */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="shrink-0 flex flex-col items-center md:items-end gap-3"
          >
            <button
              onClick={() => alert("현재 AI 서비스 기능은 준비 중입니다. 조금만 기다려주세요! 🚀")}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F9954E] text-white text-sm font-bold shadow-lg shadow-[#F9954E]/20 hover:bg-[#E8832E] hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 fill-white/20" />
              <span>AI 서비스 시작하기</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="text-[10px] text-neutral-400 font-medium flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#F9954E]" />
              <span>Powered by Advanced AI Models</span>
            </p>
          </motion.div>

        </div>

        {/* Safe divider */}
        <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-neutral-200 dark:via-white/10 to-transparent opacity-50" />
      </div>
    </section>
  );
}