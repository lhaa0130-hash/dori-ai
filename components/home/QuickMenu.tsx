"use client";

import Link from "next/link";

// 토스 스타일: 원형 아이콘 + 라벨 그리드
const MENUS = [
  { emoji: "📰", label: "트렌드",   href: "/insight",    bg: "bg-blue-50 dark:bg-blue-900/30" },
  { emoji: "🎮", label: "게임",     href: "/minigame",   bg: "bg-purple-50 dark:bg-purple-900/30" },
  { emoji: "🤖", label: "AI 도구",  href: "/ai-tools",   bg: "bg-orange-50 dark:bg-orange-900/30" },
  { emoji: "💬", label: "커뮤니티", href: "/community",  bg: "bg-green-50 dark:bg-green-900/30" },
  { emoji: "📢", label: "공지",     href: "/notice",     bg: "bg-yellow-50 dark:bg-yellow-900/30" },
  { emoji: "🛒", label: "마켓",     href: "/market",     bg: "bg-pink-50 dark:bg-pink-900/30" },
  { emoji: "🏆", label: "MY",       href: "/my",         bg: "bg-amber-50 dark:bg-amber-900/30" },
  { emoji: "🛍️", label: "상점",     href: "/shop",       bg: "bg-rose-50 dark:bg-rose-900/30" },
];

export default function QuickMenu() {
  return (
    <section className="w-full py-3">
      {/* 흰 카드 컨테이너 */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm overflow-hidden">
        {/* 섹션 헤더 */}
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Quick Menu</p>
            <h2 className="text-[17px] font-black text-neutral-900 dark:text-white">무엇을 찾고 계세요?</h2>
          </div>
        </div>

        {/* 4열 아이콘 그리드 */}
        <div className="grid grid-cols-4 px-3 pb-5">
          {MENUS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-2 py-3 px-2 rounded-2xl active:bg-neutral-50 dark:active:bg-zinc-800 transition-colors"
            >
              {/* 아이콘 원 */}
              <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center text-2xl leading-none`}>
                {item.emoji}
              </div>
              {/* 라벨 */}
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 text-center leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
