"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, Gamepad2, Bot, MessageSquare, Trophy, ShoppingBag } from "lucide-react";

const menuItems = [
  {
    icon: Newspaper,
    emoji: "📰",
    title: "트렌드 뉴스",
    description: "최신 AI 트렌드와 뉴스를 빠르게 확인하세요",
    href: "/insight",
    candy: "+30",
    color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10",
    iconColor: "text-blue-500",
    hoverColor: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  {
    icon: Gamepad2,
    emoji: "🎮",
    title: "미니게임",
    description: "재미있는 게임으로 솜사탕을 획득하세요",
    href: "/minigame",
    candy: "+100",
    color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10",
    iconColor: "text-purple-500",
    hoverColor: "hover:border-purple-300 dark:hover:border-purple-700",
  },
  {
    icon: Bot,
    emoji: "🤖",
    title: "AI 도구",
    description: "최신 AI 도구들을 탐색하고 활용하세요",
    href: "/ai-tools",
    candy: "+20",
    color: "from-[#F9954E]/5 to-[#F9954E]/10 dark:from-[#F9954E]/10 dark:to-[#F9954E]/5",
    iconColor: "text-[#F9954E]",
    hoverColor: "hover:border-[#F9954E]/40",
  },
  {
    icon: MessageSquare,
    emoji: "💬",
    title: "커뮤니티",
    description: "AI 관심사를 공유하고 소통하세요",
    href: "/community",
    candy: "+15",
    color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10",
    iconColor: "text-green-500",
    hoverColor: "hover:border-green-300 dark:hover:border-green-700",
  },
  {
    icon: Trophy,
    emoji: "🏆",
    title: "마이페이지",
    description: "내 활동 내역과 랭킹을 확인하세요",
    href: "/my",
    candy: null,
    color: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10",
    iconColor: "text-yellow-500",
    hoverColor: "hover:border-yellow-300 dark:hover:border-yellow-700",
  },
  {
    icon: ShoppingBag,
    emoji: "🛍️",
    title: "포인트 상점",
    description: "모은 솜사탕으로 아이템을 구매하세요",
    href: "/shop",
    candy: null,
    color: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/10",
    iconColor: "text-pink-500",
    hoverColor: "hover:border-pink-300 dark:hover:border-pink-700",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function QuickMenu() {
  return (
    <section className="w-full px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-extrabold text-foreground">
            DORI-AI에서 무엇을 할 수 있나요?
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            다양한 서비스를 탐색하고 솜사탕을 모아보세요 🍭
          </p>
        </div>

        {/* 메뉴 그리드 */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.href} variants={itemVariants}>
                <Link
                  href={item.href}
                  className={`group relative flex flex-col h-full bg-white dark:bg-neutral-900 rounded-2xl p-4 md:p-5 border border-neutral-100 dark:border-neutral-800 transition-all duration-300 ${item.hoverColor} hover:shadow-md hover:-translate-y-0.5 overflow-hidden`}
                >
                  {/* 배경 그라디언트 */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />

                  {/* 콘텐츠 */}
                  <div className="relative">
                    {/* 아이콘 + 솜사탕 뱃지 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center ${item.iconColor} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      {item.candy && (
                        <span className="text-[10px] font-bold text-[#F9954E] bg-[#F9954E]/10 px-2 py-0.5 rounded-full">
                          {item.candy} 🍭
                        </span>
                      )}
                    </div>

                    {/* 텍스트 */}
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                      {item.emoji} {item.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
