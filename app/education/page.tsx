"use client";

import { GraduationCap, Play, BookOpen, Users, Star } from "lucide-react";
import Link from "next/link";
import { TEXTS } from "@/constants/texts";

export default function EducationPage() {
  const t = TEXTS.academy;

  const guides = [
    {
      id: 1,
      tag: "오리엔테이션",
      title: "시작하기 가이드",
      desc: "5분 만에 배우는 DORI-AI 기본 기능 완전 정복",
      icon: <Star className="w-5 h-5" />,
      color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      thumbnail: "bg-neutral-800",
    },
    {
      id: 2,
      tag: "프롬프트",
      title: "프롬프트 마스터 클래스",
      desc: "원하는 스타일을 정확히 뽑아내는 프롬프트 작성 비결",
      icon: <BookOpen className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      thumbnail: "bg-neutral-700",
    },
    {
      id: 3,
      tag: "커뮤니티",
      title: "커뮤니티 활용법",
      desc: "전 세계 크리에이터와 소통하며 성장하는 방법",
      icon: <Users className="w-5 h-5" />,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      thumbnail: "bg-neutral-600",
    },
  ];

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden">
      {/* 배경 그라데이션 (Standard) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      {/* 히어로 섹션 */}
      <section className="relative pt-32 pb-16 px-6 text-center z-10">
        <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
            <GraduationCap className="w-3 h-3" />
            <span>Academy Center</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              {t.heroTitle.ko}
            </span>
          </h1>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>

      {/* 카드 그리드 */}
      <section className="container max-w-5xl mx-auto px-6 pb-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="group cursor-pointer rounded-[1.5rem] border border-neutral-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#F9954E]/10 hover:border-[#F9954E]/30 dark:hover:border-[#F9954E]/30"
            >
              <div className={`h-40 ${guide.thumbnail} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 transition-transform duration-300 group-hover:scale-110">
                  <Play className="w-5 h-5 fill-white" />
                </div>
              </div>
              <div className="p-6">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-3 ${guide.color}`}>
                  {guide.icon}
                  <span>{guide.tag}</span>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-[#F9954E] transition-colors">
                  {guide.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {guide.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </main>
  );
}