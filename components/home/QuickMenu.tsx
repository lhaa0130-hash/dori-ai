"use client";

import Link from "next/link";

const MENUS = [
  { emoji: "📰", label: "트렌드",  href: "/insight" },
  { emoji: "🤖", label: "AI 도구", href: "/ai-tools" },
  { emoji: "📊", label: "AI 모델", href: "/ai-models" },
  { emoji: "🎮", label: "게임",    href: "/minigame" },
  { emoji: "💬", label: "커뮤니티",href: "/community" },
  { emoji: "📢", label: "공지",    href: "/notice" },
  { emoji: "🛒", label: "마켓",    href: "/market" },
  { emoji: "🏆", label: "MY",      href: "/my" },
  { emoji: "❓", label: "FAQ",     href: "/faq" },
];

export default function QuickMenu() {
  return (
    <section className="py-6 border-b border-neutral-100 dark:border-zinc-900">
      <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-5">
        바로가기
      </p>

      <div className="grid grid-cols-4 gap-y-5">
        {MENUS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-[22px] group-active:bg-[#F9954E]/10 transition-colors">
              {item.emoji}
            </div>
            <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 group-active:text-[#F9954E] transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
