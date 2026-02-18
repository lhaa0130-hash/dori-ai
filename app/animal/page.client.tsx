"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Database, Image as ImageIcon, Layout, BookOpen, Sparkles, ArrowRight, Search, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AnimalPageClient() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const workflowSteps = [
    {
      id: "collect",
      label: "STEP 1",
      title: "동물 데이터 수집",
      description: "전 세계의 다양한 동물 데이터를 AI가 실시간으로 분석하고 수집합니다.",
      icon: Database,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      id: "generate",
      label: "STEP 2",
      title: "AI 이미지 생성",
      description: "사용자의 상상력을 바탕으로 고품질의 동물 이미지를 생성합니다.",
      icon: ImageIcon,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      id: "layout",
      label: "STEP 3",
      title: "도감 레이아웃",
      description: "생성된 이미지와 정보를 보기 좋은 도감 형태로 자동 구성합니다.",
      icon: Layout,
      color: "text-pink-500",
      bg: "bg-pink-50 dark:bg-pink-900/20",
    },
    {
      id: "complete",
      label: "STEP 4",
      title: "나만의 도감 완성",
      description: "세상에 하나뿐인 나만의 동물 도감이 완성됩니다.",
      icon: BookOpen,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
  ];

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">

      {/* Background Gradients (Unified Style) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">

        {/* Header Section (Unified Style) */}
        <section className="text-center mb-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            {/* Standard Badge Style */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
              <BookOpen className="w-3 h-3" />
              <span>Animal Encyclopedia</span>
            </div>

            {/* Title with Gradient */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6 text-neutral-900 dark:text-white">
              상상이 현실이 되는<br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                AI 동물 도감
              </span>
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-12 break-keep">
              아이들이 꿈꾸는 동물을 텍스트로 설명하면, <br className="hidden md:block" />
              AI가 즉시 생생한 이미지와 정보가 담긴 도감으로 만들어줍니다.
            </p>

            {/* Search Bar Placeholder (Refined Style) */}
            <div className="w-full max-w-lg relative group mb-8">
              <div className="relative bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-full p-1.5 pl-6 flex items-center shadow-sm transition-all duration-300 group-hover:border-[#F9954E] group-hover:shadow-md group-hover:shadow-[#F9954E]/5">
                <Search className="w-5 h-5 text-neutral-400 mr-3" />
                <input
                  type="text"
                  placeholder="어떤 동물을 찾고 있나요?"
                  className="w-full bg-transparent border-none focus:ring-0 text-neutral-900 dark:text-white placeholder:text-neutral-400 text-sm md:text-base outline-none"
                  disabled
                />
                <button className="bg-[#F9954E] hover:bg-[#E8832E] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg shadow-[#F9954E]/20 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2">
                  <span>Search</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-1.5 bg-neutral-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-zinc-800">
              <Loader2 className="w-3 h-3 animate-spin text-[#F9954E]" />
              <span>현재 AI 모델 연동 준비 중입니다</span>
            </p>

          </motion.div>
        </section>


        {/* Workflow Section (Clean Card Style) */}
        <section className="mb-40 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-neutral-900 dark:text-white">How it Works</h2>
            <p className="text-neutral-500 dark:text-neutral-400">DORI AI가상상 속 동물을 현실로 만드는 과정입니다.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">

            {/* Connecting Line (Desktop) - Adjusted Color */}
            <div className="hidden lg:block absolute top-[22%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-zinc-800 to-transparent -z-10" />

            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative h-full"
              >
                <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 h-full border border-neutral-200 dark:border-zinc-800 relative group-hover:border-[#F9954E] dark:group-hover:border-[#F9954E] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#F9954E]/5 flex flex-col items-center text-center">

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl ${step.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} strokeWidth={1.5} />
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 group-hover:text-[#F9954E] transition-colors">
                      {step.label}
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">{step.title}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium break-keep">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Gallery Preview Section (Clean Card Style) */}
        <section className="relative z-10">
          <div className="flex items-end justify-between mb-12 px-2">
            <div>
              <div className="text-[#F9954E] text-xs font-bold tracking-widest uppercase mb-2">Portfolio</div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">Recent Discoveries</h2>
            </div>
            <Link href="#" className="hidden md:flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] transition-colors px-4 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800">
              View All Collection <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group aspect-[3/4] bg-neutral-100 dark:bg-zinc-900 rounded-3xl border border-neutral-200 dark:border-zinc-800 relative overflow-hidden hover:border-[#F9954E] dark:hover:border-[#F9954E] transition-all duration-300 hover:shadow-xl hover:shadow-[#F9954E]/10"
              >
                {/* Placeholder Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center mb-4 border border-neutral-200 dark:border-zinc-700 group-hover:scale-110 transition-transform duration-300 group-hover:border-[#F9954E]/30">
                    <Sparkles className="w-6 h-6 text-neutral-400 dark:text-neutral-500 group-hover:text-[#F9954E] transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Coming Soon</p>
                </div>

                {/* Shimmer Effect - Adjusted for light mode */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer z-0" style={{ animationDuration: '1.5s' }} />

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-t border-neutral-100 dark:border-zinc-800 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">Mystic Creature #{item}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">AI Generated • 2024</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="#" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] transition-colors px-6 py-3 rounded-full bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800">
              View All Collection <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
            animation: shimmer 1.5s infinite;
        }
      `}</style>
    </main>
  );
}
