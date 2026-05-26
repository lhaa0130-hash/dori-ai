"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const projects = [
  {
    id: "animal",
    name: "동물도감",
    emoji: "🐾",
    tag: "1st Project",
    tagColor: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    desc: "포켓몬처럼, 진짜 동물을 배워요",
    longDesc:
      "요즘 아이들이 접하는 동물의 수는 점점 줄고 있어요. 동물도감은 아이들이 다양한 동물을 포켓몬처럼 친숙하게 알아가고, 그 동물이 무엇을 먹고 어떻게 사는지 자연스럽게 배울 수 있도록 만든 교육 프로젝트입니다.",
    href: "/animal",
    gradient: "from-emerald-400 via-teal-400 to-cyan-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    tags: ["어린이 교육", "동물 생태", "도감"],
    status: "준비 중",
    statusColor: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  },
  // 추가 프로젝트는 이곳에
];

export default function ProjectsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">

      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24">

        {/* Hero */}
        <section className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
              <Sparkles className="w-3 h-3" />
              <span>DORI-AI Projects</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5 text-neutral-900 dark:text-white">
              AI가 만드는<br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                특별한 프로젝트
              </span>
            </h1>

            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed break-keep">
              DORI-AI가 개발 중인 AI 기반 인터랙티브 프로젝트들을 만나보세요.
            </p>
          </motion.div>
        </section>

        {/* Projects Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={project.href}
                  className="group block h-full bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl overflow-hidden hover:border-[#F9954E] dark:hover:border-[#F9954E] transition-all duration-300 hover:shadow-2xl hover:shadow-[#F9954E]/10 hover:-translate-y-1"
                >
                  {/* Gradient Banner */}
                  <div className={`h-36 bg-gradient-to-br ${project.gradient} relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-white/10 group-hover:bg-white/5 transition-colors" />
                    {/* 격자 패턴 */}
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />
                    <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                      {project.emoji}
                    </span>
                    {/* 1st Project 뱃지 */}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${project.tagColor}`}>
                        {project.tag}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-xl font-bold text-neutral-900 dark:text-white group-hover:text-[#E8832E] dark:group-hover:text-[#F9954E] transition-colors">
                        {project.name}
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${project.statusColor} flex-shrink-0 ml-2`}>
                        {project.status}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#F9954E] mb-3">{project.desc}</p>

                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-5 break-keep">
                      {project.longDesc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {project.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#F9954E] group-hover:gap-3 transition-all duration-300">
                      <span>자세히 보기</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* Coming Soon 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: projects.length * 0.1 }}
              className="bg-neutral-50 dark:bg-zinc-900/50 border border-dashed border-neutral-300 dark:border-zinc-700 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-10 text-center min-h-[320px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-neutral-300 dark:text-zinc-600" />
              </div>
              <p className="text-sm font-bold text-neutral-400 dark:text-zinc-500 mb-1">Coming Soon</p>
              <p className="text-xs text-neutral-400 dark:text-zinc-600">새로운 프로젝트를 준비 중입니다</p>
            </motion.div>

          </div>
        </section>

      </div>
    </main>
  );
}
