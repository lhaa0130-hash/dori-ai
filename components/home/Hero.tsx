"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, TrendingUp, Wrench, Gamepad2 } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "트렌드 기사", value: "46+", icon: TrendingUp },
  { label: "AI 도구", value: "100+", icon: Wrench },
  { label: "미니게임", value: "23+", icon: Gamepad2 },
];

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

            {/* 실시간 통계 뱃지 */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-5">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#F9954E]" />
                    <span className="text-xs font-bold text-[#F9954E]">{stat.value}</span>
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{stat.label}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* 정보 태그 (PC 전용) */}
            <div className="hidden md:flex flex-wrap gap-2 mt-4">
              {['#AI_Native', '#Education', '#Game', '#Utility'].map((tag) => (
                <span key={tag} className="text-xs text-neutral-400 font-medium bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: CTA */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="shrink-0 flex flex-col items-center md:items-end gap-3"
          >
            {/* 최신 트렌드 보기 */}
            <Link
              href="/insight"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F9954E] text-white text-sm font-bold shadow-lg shadow-[#F9954E]/20 hover:bg-[#E8832E] hover:scale-105 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 fill-white/20" />
              <span>최신 트렌드 보기</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            {/* AI 도구 탐색 */}
            <Link
              href="/ai-tools"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-sm font-bold border border-neutral-200 dark:border-neutral-700 hover:border-[#F9954E] dark:hover:border-[#F9954E] hover:text-[#F9954E] hover:scale-105 transition-all duration-300"
            >
              <span>AI 도구 탐색</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

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