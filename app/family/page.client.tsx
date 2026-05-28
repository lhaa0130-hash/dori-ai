"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, Calendar, Camera, BookHeart, ClipboardList, Bell, Users, Star } from "lucide-react";

const FEATURES = [
  {
    emoji: "📅",
    icon: Calendar,
    title: "가족 공유 캘린더",
    desc: "학교 행사, 병원 예약, 여행 일정까지 온 가족이 하나의 달력에서 확인해요.",
    color: "from-blue-400 to-sky-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    tag: "일정 관리",
  },
  {
    emoji: "📸",
    icon: Camera,
    title: "추억 앨범",
    desc: "여행, 생일, 일상의 소중한 순간을 가족 모두가 공유하고 댓글로 함께 즐겨요.",
    color: "from-pink-400 to-rose-400",
    bg: "bg-pink-50 dark:bg-pink-900/20",
    border: "border-pink-200 dark:border-pink-800",
    tag: "사진 공유",
  },
  {
    emoji: "📓",
    icon: BookHeart,
    title: "가족 일기장",
    desc: "각자의 하루를 기록하고, 가족이 서로의 일상을 들여다볼 수 있는 공간이에요.",
    color: "from-amber-400 to-orange-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    tag: "일상 기록",
  },
  {
    emoji: "🏥",
    icon: ClipboardList,
    title: "건강 기록 공유",
    desc: "가족 구성원의 복약 일정, 병원 기록, 알레르기 정보를 한눈에 관리해요.",
    color: "from-emerald-400 to-teal-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    tag: "건강 관리",
  },
  {
    emoji: "🔔",
    icon: Bell,
    title: "중요한 날 알림",
    desc: "생일, 기념일, 병원 예약일을 가족 모두에게 자동으로 알려드려요.",
    color: "from-violet-400 to-purple-400",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-800",
    tag: "알림",
  },
  {
    emoji: "✅",
    icon: ClipboardList,
    title: "가족 할 일 목록",
    desc: "장보기 목록, 집안일 분담, 이번 주 할 일을 함께 체크하고 완료해요.",
    color: "from-lime-400 to-green-400",
    bg: "bg-lime-50 dark:bg-lime-900/20",
    border: "border-lime-200 dark:border-lime-800",
    tag: "할 일",
  },
];

const FAMILY_ROLES = [
  { emoji: "👴", role: "할아버지·할머니", desc: "손주 사진을 매일 받아볼 수 있어요", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  { emoji: "👨", role: "아빠·엄마", desc: "아이들 일정과 건강을 한눈에", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  { emoji: "🧒", role: "자녀", desc: "학교 숙제·준비물을 가족과 공유", color: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" },
  { emoji: "👶", role: "영유아", desc: "예방접종·성장 기록을 부모가 관리", color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
];

export default function FamilyPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">

      {/* 배경 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-50/60 via-fuchsia-50/20 to-transparent dark:from-purple-950/20 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24">

        {/* ── 히어로 ── */}
        <section className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 text-xs font-bold mb-6">
              <Heart className="w-3 h-3 fill-current" />
              <span>2nd Project · 개발 예정</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-5 text-neutral-900 dark:text-white">
              가족의 모든 것을<br className="hidden md:block" />
              <span className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                하나의 앱으로
              </span>
            </h1>

            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-8 break-keep">
              일정·사진·건강·추억·할 일까지 —<br className="hidden md:block" />
              가족 모두가 함께 공유하는 디지털 가족 공간이에요.
            </p>

            {/* 상태 뱃지 */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">현재 기획 중 · 아이디어 수집 단계</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 px-4 py-2 rounded-full">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">AI 기반 스마트 추천 포함 예정</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── 핵심 가치 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/20 border border-purple-200 dark:border-purple-800/40 rounded-3xl p-8 md:p-12 text-center mb-12"
          >
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              왜 &ldquo;가족기록&rdquo;인가요?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto break-keep">
              가족 사진은 카카오에 흩어져 있고, 일정은 네이버 캘린더에, 건강 기록은 메모장에 따로 있어요.
              <br className="hidden md:block" />
              <strong className="text-purple-700 dark:text-purple-400">가족기록</strong>은 이 모든 것을 하나로 모아
              온 가족이 어디서든 함께 볼 수 있게 만드는 앱입니다.
            </p>
          </motion.div>
        </section>

        {/* ── 주요 기능 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              ✨ 이런 기능을 담을 거예요
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              가족의 하루부터 소중한 추억까지, 모두 한곳에
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`bg-white dark:bg-zinc-900 border ${feat.border} rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
              >
                {/* 아이콘 배너 */}
                <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center text-2xl mb-4`}>
                  {feat.emoji}
                </div>

                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                    {feat.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${feat.bg} border ${feat.border} text-neutral-600 dark:text-neutral-400 flex-shrink-0 ml-2`}>
                    {feat.tag}
                  </span>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 가족 구성원별 활용 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              👨‍👩‍👧 누가 사용하나요?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              3세대 가족 모두가 함께 쓸 수 있도록 설계해요
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FAMILY_ROLES.map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-2xl p-5 text-center"
              >
                <div className="text-4xl mb-3">{role.emoji}</div>
                <div className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${role.color} mb-2 inline-block`}>
                  {role.role}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug break-keep">
                  {role.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── AI 기능 소개 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl p-8 md:p-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">AI Features</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              AI가 도와주는 가족 기록
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { emoji: "🤖", title: "AI 추억 요약", desc: "이번 달 가족 사진과 기록을 자동으로 정리해 '이번 달 우리 가족' 리포트를 만들어드려요." },
                { emoji: "💊", title: "복약 스마트 알림", desc: "가족 구성원의 복약 시간에 맞춰 개인 맞춤 알림을 자동으로 보내드려요." },
                { emoji: "📊", title: "가족 성장 기록", desc: "아이의 키·몸무게·발달 기록을 시각화하고, 또래와의 성장 비교 차트를 제공해요." },
              ].map((item, i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-5">
                  <div className="text-3xl mb-3">{item.emoji}</div>
                  <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed break-keep">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── 하단 CTA ── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/20 border border-purple-200 dark:border-purple-800/40 rounded-3xl p-10 text-center"
          >
            <div className="text-5xl mb-4">💜</div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
              함께 만들어가는 가족기록
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-lg mx-auto mb-2 break-keep">
              어떤 기능이 있으면 좋겠는지, 가족과 어떤 것을 공유하고 싶은지<br className="hidden md:block" />
              여러분의 아이디어를 기다리고 있어요.
            </p>
            <p className="text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              빠르게 개발하고 있습니다 — 곧 만나요!
            </p>
          </motion.div>
        </section>

      </div>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient { animation: gradient 3s ease infinite; }
      `}</style>
    </main>
  );
}
