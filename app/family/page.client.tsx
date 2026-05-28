"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, Sparkles, Calendar, Camera, BookHeart, ClipboardList, Bell, Users, Star, ExternalLink, ArrowRight, CheckCircle2 } from "lucide-react";

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
              <span>2nd Project</span>
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

            {/* CTA 버튼 */}
            <div className="flex items-center gap-4 flex-wrap justify-center mb-6">
              <Link
                href="https://family-94b12.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white text-sm font-black shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
              >
                <span>앱 열기</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <div className="inline-flex items-center gap-1.5 bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 px-4 py-3.5 rounded-full">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">AI 기능 업데이트 예정</span>
              </div>
            </div>

            {/* 상태 뱃지 */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">서비스 운영 중 · 지금 바로 사용 가능</span>
            </div>
          </motion.div>
        </section>

        {/* ── 지금 사용 가능한 기능 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">지금 바로 사용 가능</span>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              현재 구현된 기능
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              가족기록 앱에서 지금 바로 사용할 수 있는 기능들이에요
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                emoji: "📸",
                title: "사진·앨범 공유",
                desc: "가족의 소중한 순간을 사진으로 기록하고, 앨범으로 묶어 온 가족이 함께 볼 수 있어요. 여행, 생일, 일상의 사진을 한곳에서 공유해 보세요.",
                color: "from-pink-400 to-rose-400",
                bg: "bg-pink-50 dark:bg-pink-900/20",
                border: "border-pink-200 dark:border-pink-800",
                features: ["사진 업로드 및 앨범 생성", "가족 구성원 공유", "사진 모아보기"],
              },
              {
                emoji: "📅",
                title: "일정·캘린더",
                desc: "가족 모두의 일정을 하나의 달력에서 확인하세요. 학교 행사, 병원 예약, 여행 계획까지 온 가족이 실시간으로 공유해요.",
                color: "from-blue-400 to-sky-400",
                bg: "bg-blue-50 dark:bg-blue-900/20",
                border: "border-blue-200 dark:border-blue-800",
                features: ["가족 공유 캘린더", "일정 등록 및 알림", "월별·일별 보기"],
              },
              {
                emoji: "📓",
                title: "일기·게시글",
                desc: "각자의 하루를 글로 기록하고 가족과 나눠요. 서로의 일상을 들여다보고 댓글로 소통하는 우리 가족만의 공간이에요.",
                color: "from-amber-400 to-orange-400",
                bg: "bg-amber-50 dark:bg-amber-900/20",
                border: "border-amber-200 dark:border-amber-800",
                features: ["가족 일기 작성", "댓글로 소통", "날짜별 기록 조회"],
              },
              {
                emoji: "🏥",
                title: "건강 기록",
                desc: "가족 구성원의 복약 일정, 병원 방문 기록, 알레르기 정보를 한눈에 관리해요. 소중한 가족의 건강을 빠짐없이 챙길 수 있어요.",
                color: "from-emerald-400 to-teal-400",
                bg: "bg-emerald-50 dark:bg-emerald-900/20",
                border: "border-emerald-200 dark:border-emerald-800",
                features: ["복약 일정 관리", "병원 기록 저장", "건강 정보 공유"],
              },
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`bg-white dark:bg-zinc-900 border ${feat.border} rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
              >
                {/* 아이콘 + 제목 */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                    {feat.emoji}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-snug">
                      {feat.title}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${feat.bg} ${feat.border} border text-neutral-600 dark:text-neutral-300 mt-1 inline-block`}>
                      구현 완료
                    </span>
                  </div>
                </div>

                {/* 설명 */}
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 break-keep">
                  {feat.desc}
                </p>

                {/* 세부 기능 */}
                <ul className="space-y-1.5">
                  {feat.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* 앱 바로가기 버튼 */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-center mt-8"
          >
            <Link
              href="https://family-94b12.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400 text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <span>위 기능들 직접 써보기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
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
              🚀 업데이트 예정 기능
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              빠르게 추가되고 있는 기능들이에요
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
              지금 바로 시작해보세요
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-lg mx-auto mb-6 break-keep">
              가족기록 앱은 현재 서비스 중이에요.<br className="hidden md:block" />
              지금 열어보고, 가족과 함께 첫 번째 기록을 남겨보세요.
            </p>
            <Link
              href="https://family-94b12.web.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white text-sm font-black shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
            >
              <span>가족기록 앱 열기</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
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
