"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Search } from "lucide-react";

// ── 동물 분류 카테고리 ────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "mammal",
    emoji: "🦁",
    name: "포유류",
    desc: "새끼를 낳고 젖을 먹여 키워요",
    color: "from-amber-400 to-orange-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    examples: ["사자", "코끼리", "고래", "토끼", "박쥐"],
    count: 0,
  },
  {
    id: "bird",
    emoji: "🦅",
    name: "조류",
    desc: "깃털이 있고 알을 낳아요",
    color: "from-sky-400 to-blue-400",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800",
    examples: ["독수리", "펭귄", "앵무새", "공작", "올빼미"],
    count: 0,
  },
  {
    id: "reptile",
    emoji: "🦎",
    name: "파충류",
    desc: "비늘이 있고 변온동물이에요",
    color: "from-green-400 to-emerald-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-200 dark:border-green-800",
    examples: ["악어", "거북", "카멜레온", "왕도마뱀", "코모도드래곤"],
    count: 0,
  },
  {
    id: "fish",
    emoji: "🐟",
    name: "어류",
    desc: "아가미로 숨 쉬며 물속에 살아요",
    color: "from-cyan-400 to-teal-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    border: "border-cyan-200 dark:border-cyan-800",
    examples: ["상어", "만타가오리", "해마", "피라냐", "흰동가리"],
    count: 0,
  },
  {
    id: "amphibian",
    emoji: "🐸",
    name: "양서류",
    desc: "물과 육지 두 곳에서 살아요",
    color: "from-lime-400 to-green-400",
    bg: "bg-lime-50 dark:bg-lime-900/20",
    border: "border-lime-200 dark:border-lime-800",
    examples: ["청개구리", "도롱뇽", "두꺼비", "아홀로틀", "독화살개구리"],
    count: 0,
  },
  {
    id: "insect",
    emoji: "🦋",
    name: "곤충 & 절지류",
    desc: "다리가 6개 이상이에요",
    color: "from-purple-400 to-pink-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    examples: ["나비", "사마귀", "장수풍뎅이", "전갈", "타란툴라"],
    count: 0,
  },
];

// ── 도감에서 배울 수 있는 정보 ──────────────────────────────────────
const LEARN_ITEMS = [
  { emoji: "🍖", title: "무엇을 먹나요?", desc: "초식·육식·잡식으로 나뉘는 동물의 먹이와 사냥 방식을 배워요." },
  { emoji: "🌍", title: "어디에 사나요?", desc: "열대우림, 사막, 바다, 극지방 등 서식지 환경을 알아봐요." },
  { emoji: "🐣", title: "어떻게 새끼를 낳나요?", desc: "알을 낳는 동물, 새끼를 낳는 동물의 번식 방법을 비교해요." },
  { emoji: "🛡️", title: "어떻게 자신을 지키나요?", desc: "보호색, 독, 갑옷, 빠른 도주 등 생존 전략을 살펴봐요." },
  { emoji: "📏", title: "얼마나 크나요?", desc: "세상에서 가장 작은 동물과 가장 큰 동물을 비교해봐요." },
  { emoji: "💡", title: "재미있는 사실", desc: "각 동물만의 독특한 능력과 놀라운 생태 특징을 소개해요." },
];

// ── 주목할 만한 동물 미리보기 ──────────────────────────────────────
const SPOTLIGHT = [
  { emoji: "🦁", name: "아프리카사자", latin: "Panthera leo", tag: "포유류", fact: "하루 최대 20시간 잠을 자요" },
  { emoji: "🦋", name: "모나크나비", latin: "Danaus plexippus", tag: "곤충", fact: "무려 4,500km를 이동해요" },
  { emoji: "🐙", name: "문어", latin: "Octopus vulgaris", tag: "연체동물", fact: "심장이 3개예요" },
  { emoji: "🦒", name: "기린", latin: "Giraffa camelopardalis", tag: "포유류", fact: "혀의 길이가 45cm예요" },
  { emoji: "🐧", name: "황제펭귄", latin: "Aptenodytes forsteri", tag: "조류", fact: "영하 60°C에서도 살아요" },
  { emoji: "🦈", name: "백상아리", latin: "Carcharodon carcharias", tag: "어류", fact: "이빨이 평생 계속 자라요" },
];

export default function AnimalPageClient() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden font-sans">

      {/* 배경 그라디언트 */}
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
            {/* 뱃지 */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
              <BookOpen className="w-3 h-3" />
              <span>DORI'S 동물도감</span>
            </div>

            {/* 타이틀 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-5 text-neutral-900 dark:text-white">
              세상의 동물을<br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                포켓몬처럼 배워요
              </span>
            </h1>

            {/* 설명 */}
            <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed mb-10 break-keep">
              요즘 아이들이 직접 접하는 동물이 점점 줄고 있어요.<br className="hidden md:block" />
              다양한 동물들이 무엇을 먹고, 어디에 살고, 어떻게 자라는지<br className="hidden md:block" />
              쉽고 재미있게 알아가는 진짜 동물 백과사전이에요.
            </p>

            {/* 검색바 (준비 중) */}
            <div className="w-full max-w-md relative mb-5">
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-full px-5 py-3 shadow-sm gap-3">
                <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="동물 이름을 검색해보세요..."
                  className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none"
                  disabled
                />
              </div>
            </div>

            {/* 준비 중 안내 */}
            <div className="inline-flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-zinc-900 px-4 py-2 rounded-full border border-neutral-200 dark:border-zinc-800">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              콘텐츠를 열심히 채우는 중이에요 — 빠르게 만나볼 수 있어요!
            </div>
          </motion.div>
        </section>

        {/* ── 동물 분류 카테고리 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              🐾 어떤 동물들이 있나요?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              6가지 분류로 지구의 모든 동물을 탐험해보세요
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`group relative bg-white dark:bg-zinc-900 border ${cat.border} rounded-2xl p-5 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
              >
                {/* 배경 그라디언트 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                <div className="flex items-start gap-4 relative">
                  {/* 아이콘 */}
                  <div className={`w-14 h-14 rounded-2xl ${cat.bg} flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {cat.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">{cat.name}</h3>
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">준비 중</span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{cat.desc}</p>
                    {/* 예시 동물 태그 */}
                    <div className="flex flex-wrap gap-1">
                      {cat.examples.map((ex) => (
                        <span key={ex} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cat.bg} ${cat.border} border text-neutral-600 dark:text-neutral-300`}>
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 도감에서 배울 수 있는 정보 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              📖 동물마다 이런 걸 배워요
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              각 동물 카드에는 6가지 핵심 정보가 담겨 있어요
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LEARN_ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex items-start gap-4 bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-2xl p-5"
              >
                <div className="text-3xl flex-shrink-0">{item.emoji}</div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 주목할 동물 스포트라이트 ── */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-2">
              ✨ 이런 동물들이 기다리고 있어요
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
              도감에 수록될 동물들을 미리 만나보세요
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SPOTLIGHT.map((animal, i) => (
              <motion.div
                key={animal.name}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-2xl p-4 text-center hover:border-[#F9954E] dark:hover:border-[#F9954E] hover:shadow-md hover:shadow-[#F9954E]/5 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">{animal.emoji}</div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white mb-0.5">{animal.name}</div>
                <div className="text-[10px] italic text-neutral-400 dark:text-neutral-500 mb-2 truncate">{animal.latin}</div>
                <div className="text-[10px] font-medium text-[#F9954E] bg-[#F9954E]/10 px-2 py-0.5 rounded-full inline-block mb-2">{animal.tag}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{animal.fact}</div>
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
              동물도감, 함께 만들어가요
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed max-w-md mx-auto mb-2 break-keep">
              포유류부터 곤충까지, 지구의 다양한 생명체를 아이들이<br className="hidden md:block" />
              쉽고 재미있게 만나볼 수 있도록 차근차근 채워가고 있어요.
            </p>
            <p className="text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              콘텐츠 업로드가 시작되면 알림으로 알려드릴게요
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
