"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

const games = [
  {
    emoji: "⚔️",
    title: "던전 RPG",
    description: "AI 던전을 탐험하고 몬스터를 처치하세요",
    href: "/minigame/dungeon-rpg",
    candy: "+100",
    color: "from-red-500/10 to-orange-500/10",
    border: "hover:border-red-300 dark:hover:border-red-700",
    badge: "인기",
    badgeColor: "bg-red-500",
  },
  {
    emoji: "🟦",
    title: "테트리스",
    description: "클래식 블록 퍼즐로 집중력을 높이세요",
    href: "/minigame/tetris",
    candy: "+50",
    color: "from-blue-500/10 to-cyan-500/10",
    border: "hover:border-blue-300 dark:hover:border-blue-700",
    badge: null,
    badgeColor: "",
  },
  {
    emoji: "🔢",
    title: "2048",
    description: "숫자를 합쳐 2048을 달성하세요",
    href: "/minigame/2048",
    candy: "+60",
    color: "from-yellow-500/10 to-orange-500/10",
    border: "hover:border-yellow-300 dark:hover:border-yellow-700",
    badge: "도전",
    badgeColor: "bg-yellow-500",
  },
  {
    emoji: "⌨️",
    title: "타이핑 게임",
    description: "AI 용어 타이핑으로 빠른 손가락을 만드세요",
    href: "/minigame/typing",
    candy: "+40",
    color: "from-green-500/10 to-teal-500/10",
    border: "hover:border-green-300 dark:hover:border-green-700",
    badge: "추천",
    badgeColor: "bg-green-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function MiniGameSection() {
  return (
    <section className="w-full px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground">
              🎮 지금 바로 플레이
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              게임을 하면서 솜사탕을 획득하세요!
            </p>
          </div>
          <Link
            href="/minigame"
            className="flex items-center gap-1 text-sm font-bold text-[#F9954E] hover:text-[#E8832E] transition-colors"
          >
            전체 게임
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 게임 카드 그리드 */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {games.map((game) => (
            <motion.div key={game.href} variants={itemVariants}>
              <Link
                href={game.href}
                className={`group relative flex flex-col h-full bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 transition-all duration-300 ${game.border} hover:shadow-md hover:-translate-y-0.5 overflow-hidden`}
              >
                {/* 배경 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative">
                  {/* 뱃지 */}
                  {game.badge && (
                    <span className={`absolute -top-1 -right-1 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                  )}

                  {/* 이모지 아이콘 */}
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                    {game.emoji}
                  </div>

                  {/* 텍스트 */}
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                    {game.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                    {game.description}
                  </p>

                  {/* 하단: 솜사탕 + 플레이 버튼 */}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-[#F9954E] bg-[#F9954E]/10 px-2 py-0.5 rounded-full">
                      {game.candy} 🍭
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-neutral-400 group-hover:text-[#F9954E] transition-colors">
                      <Play className="w-3 h-3 fill-current" />
                      플레이
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
