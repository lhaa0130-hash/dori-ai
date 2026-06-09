"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GAMES = [
  { emoji: "🎯", title: "보스 클릭커", desc: "클릭으로 몬스터를 처치하세요",    href: "/minigame/clicker",     candy: "+100" },
  { emoji: "🐍", title: "스네이크",    desc: "뱀을 길게 키우는 아케이드",       href: "/minigame/snake",       candy: "+50"  },
  { emoji: "🔢", title: "2048",        desc: "숫자를 합쳐 2048을 달성하세요",   href: "/minigame/2048",        candy: "+60"  },
  { emoji: "⌨️", title: "타이핑",      desc: "AI 용어로 손가락을 훈련하세요",  href: "/minigame/typingspeed", candy: "+40"  },
];

export default function MiniGameSection() {
  return (
    <section className="py-12 border-b border-neutral-100 dark:border-zinc-900">
      {/* 헤더 */}
      <div className="scroll-reveal flex items-center justify-between mb-7">
        <h2 className="text-[24px] font-extrabold text-neutral-950 dark:text-white tracking-tight">
          잠깐, 쉬어가요 🎮
        </h2>
        <Link href="/minigame" className="flex items-center gap-1 text-[13px] font-semibold text-[#F9954E]">
          전체 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2×2 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((game, i: number) => (
          /* 래퍼 div: scroll-reveal(진입 페이드), Link: toss-card(호버 리프트) */
          <div key={game.href} className={`scroll-reveal scroll-reveal-delay-${i + 1}`}>
            <Link
              href={game.href}
              className="toss-card flex flex-col p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-sm active:opacity-75"
            >
              <span className="text-[26px] mb-3 leading-none">{game.emoji}</span>
              <p className="text-[14px] font-bold text-neutral-900 dark:text-white mb-1">{game.title}</p>
              <p className="text-[11px] text-neutral-400 leading-relaxed mb-3 break-keep">{game.desc}</p>
              <span className="text-[11px] font-semibold text-[#F9954E]">{game.candy} 🍭</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
