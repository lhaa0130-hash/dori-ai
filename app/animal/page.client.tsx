"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, SlidersHorizontal } from "lucide-react";

// ── 필터 카테고리 ─────────────────────────────────────────────────
// 각 카테고리는 하나의 "검색 축"
const FILTER_CATEGORIES = [
  {
    id: "diet",
    emoji: "🍽️",
    title: "먹이로 찾기",
    desc: "이 동물은 무엇을 먹나요?",
    color: "from-orange-400 to-red-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    tags: ["곤충을 먹는", "물고기를 먹는", "초식", "육식", "잡식", "썩은 것을 먹는", "꿀을 먹는", "씨앗을 먹는"],
  },
  {
    id: "color",
    emoji: "🎨",
    title: "색깔로 찾기",
    desc: "어떤 색깔의 동물을 찾고 있나요?",
    color: "from-pink-400 to-purple-400",
    bg: "bg-pink-50 dark:bg-pink-900/20",
    border: "border-pink-200 dark:border-pink-800",
    tags: ["분홍색", "파란색", "빨간색", "초록색", "검정색", "흰색", "투명한", "알록달록한"],
  },
  {
    id: "size",
    emoji: "📏",
    title: "크기로 찾기",
    desc: "얼마나 큰 동물을 찾나요?",
    color: "from-sky-400 to-blue-400",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800",
    tags: ["손보다 작은", "손바닥만한", "고양이만한", "사람만한", "코끼리만한", "버스만한", "세상에서 가장 작은", "세상에서 가장 큰"],
  },
  {
    id: "habitat",
    emoji: "🌍",
    title: "사는 곳으로 찾기",
    desc: "어떤 환경에 사는 동물인가요?",
    color: "from-emerald-400 to-teal-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    tags: ["바다", "강·호수", "사막", "열대우림", "극지방", "초원", "동굴", "도시 근처"],
  },
  {
    id: "feature",
    emoji: "⚡",
    title: "특징으로 찾기",
    desc: "어떤 능력이나 특징을 가졌나요?",
    color: "from-yellow-400 to-amber-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    tags: ["날 수 있는", "독이 있는", "야행성", "보호색", "변장하는", "엄청 빠른", "엄청 느린", "빛을 내는"],
  },
  {
    id: "body",
    emoji: "🔬",
    title: "몸 구조로 찾기",
    desc: "몸이 어떻게 생겼나요?",
    color: "from-violet-400 to-purple-400",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-800",
    tags: ["다리가 없는", "다리가 4개인", "다리가 6개 이상인", "날개가 있는", "딱딱한 껍질", "뿔이 있는", "긴 꼬리", "긴 목"],
  },
  {
    id: "behavior",
    emoji: "🤝",
    title: "생활 방식으로 찾기",
    desc: "어떻게 살아가나요?",
    color: "from-cyan-400 to-blue-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    border: "border-cyan-200 dark:border-cyan-800",
    tags: ["혼자 사는", "무리지어 사는", "겨울잠을 자는", "철새처럼 이동하는", "알을 낳는", "새끼를 낳는", "동굴에 사는", "나무 위에 사는"],
  },
  {
    id: "taxonomy",
    emoji: "🗂️",
    title: "종류로 찾기",
    desc: "어떤 동물 종류인가요?",
    color: "from-lime-400 to-green-400",
    bg: "bg-lime-50 dark:bg-lime-900/20",
    border: "border-lime-200 dark:border-lime-800",
    tags: ["포유류", "조류", "파충류", "어류", "양서류", "곤충", "갑각류", "연체동물"],
  },
];

// ── 복합 필터 검색 예시 ────────────────────────────────────────────
const EXAMPLE_SEARCHES = [
  {
    query: "분홍색이면서 작은 동물은?",
    filters: ["분홍색", "손보다 작은"],
    result: "홍학 새끼, 분홍색 돌고래, 핑크 아르마딜로 등",
    emoji: "🦩",
  },
  {
    query: "곤충을 먹는 야행성 동물은?",
    filters: ["곤충을 먹는", "야행성"],
    result: "박쥐, 고슴도치, 올빼미, 아르마딜로 등",
    emoji: "🦇",
  },
  {
    query: "독이 있는 파란색 동물은?",
    filters: ["독이 있는", "파란색"],
    result: "파란고리문어, 독화살개구리, 파란 전갈 등",
    emoji: "🐙",
  },
  {
    query: "극지방에 사는 흰색 동물은?",
    filters: ["극지방", "흰색"],
    result: "북극곰, 흰올빼미, 흰여우, 벨루가 등",
    emoji: "🐻‍❄️",
  },
];

export default function AnimalPageClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">

      {/* 배경 */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24">

        {/* ── 히어로 ── */}
        <section className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
              <BookOpen className="w-3 h-3" />
              <span>DORI'S 동물도감</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-5 text-neutral-900 dark:text-white">
              원하는 조건으로<br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                동물을 찾아보세요
              </span>
            </h1>

            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-6 break-keep">
              색깔·크기·먹이·사는 곳 등 여러 조건을 조합해서<br className="hidden md:block" />
              내가 원하는 동물을 직접 찾는 어린이 동물 백과사전이에요.
            </p>

            {/* 핵심 개념 강조 */}
            <div className="inline-flex items-center gap-2.5 bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl px-5 py-3 mb-6">
              <SlidersHorizontal className="w-4 h-4 text-[#F9954E] flex-shrink-0" />
              <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                <span className="text-[#F9954E]">"분홍색이면서 손보다 작은 동물은?"</span>
                {" "}처럼 여러 조건을 동시에 검색할 수 있어요
              </span>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-zinc-900 px-4 py-2 rounded-full border border-neutral-200 dark:border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              동물 데이터를 열심히 채우는 중이에요
            </div>
          </motion.div>
        </section>

        {/* ── 검색 축 (필터 카테고리) ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              🗂️ 어떤 기준으로 찾을 수 있나요?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              8가지 축으로 동물을 분류해요 — 여러 조건을 동시에 적용할 수 있어요
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {FILTER_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`group bg-white dark:bg-zinc-900 border ${cat.border} rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                    {cat.emoji}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{cat.title}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{cat.desc}</p>
                  </div>
                </div>
                {/* 태그들 */}
                <div className="flex flex-wrap gap-1.5">
                  {cat.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${cat.bg} border ${cat.border} text-neutral-700 dark:text-neutral-300`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 복합 검색 예시 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              🔍 이런 식으로 찾을 수 있어요
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              조건을 조합할수록 더 정확한 동물을 찾을 수 있어요
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXAMPLE_SEARCHES.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-2xl p-5"
              >
                {/* 질문 */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">{ex.emoji}</span>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">{ex.query}</p>
                </div>
                {/* 사용한 필터 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {ex.filters.map((f) => (
                    <span key={f} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#F9954E]/15 text-[#E8832E] dark:text-[#FBAA60] border border-[#F9954E]/30">
                      # {f}
                    </span>
                  ))}
                </div>
                {/* 결과 미리보기 */}
                <div className="bg-neutral-50 dark:bg-zinc-800/60 rounded-xl px-3 py-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200">결과 예시 → </span>
                    {ex.result}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 하단 CTA ── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-[#FFF5EB] to-[#FEEBD0] dark:from-orange-950/30 dark:to-orange-900/10 border border-[#FDD5A5] dark:border-orange-800/30 rounded-3xl p-10 text-center"
          >
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
              동물도감을 함께 만들어가요
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-lg mx-auto mb-2 break-keep">
              색깔부터 먹이, 크기, 사는 곳까지 — 아이들이 스스로<br className="hidden md:block" />
              궁금한 동물을 직접 찾아갈 수 있도록 데이터를 채우고 있어요.
            </p>
            <p className="text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              동물 카드가 업로드되면 바로 검색해볼 수 있어요
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
