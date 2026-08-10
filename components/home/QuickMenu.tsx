"use client";

import Link from "next/link";
import { SHOW_COMMUNITY } from "@/lib/publicFlags";

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
  // 커뮤니티 비공개 시 바로가기에서 제외(스텁이라 로그아웃 방문자엔 빈 화면)
].filter((m) => SHOW_COMMUNITY || m.href !== "/community");

export default function QuickMenu() {
  return (
    <section className="py-6 border-b border-stone-100 dark:border-zinc-900">
      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-5">
        바로가기
      </p>

      <div className="grid grid-cols-4 gap-y-5">
        {MENUS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-[22px] group-active:bg-[#F9954E]/10 transition-colors">
              {item.emoji}
            </div>
            <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 group-active:text-[#F9954E] transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
