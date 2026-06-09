"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GAMES = [
  {
    emoji: "🎯",
    title: "보스 클릭커",
    desc: "클릭으로 몬스터를 처치하세요",
    href: "/minigame/clicker",
    candy: "+100",
  },
  {
    emoji: "🐍",
    title: "스네이크",
    desc: "뱀을 길게 키우는 아케이드",
    href: "/minigame/snake",
    candy: "+50",
  },
  {
    emoji: "🔢",
    title: "2048",
    desc: "숫자를 합쳐 2048을 달성하세요",
    href: "/minigame/2048",
    candy: "+60",
  },
  {
    emoji: "⌨️",
    title: "타이핑 게임",
    desc: "AI 용어로 손가락을 훈련하세요",
    href: "/minigame/typingspeed",
    candy: "+40",
  },
];

export default function MiniGameSection() {
  return (
    <section className="py-14 border-b border-neutral-100 dark:border-zinc-900">
      <p className="text-[11px] font-bold text-[#F9954E] tracking-[0.22em] uppercase mb-5">
        MINI GAME
      </p>

      <div className="flex items-end justify-between mb-8">
        <h2 className="text-[38px] font-black text-neutral-950 dark:text-white leading-[1.0] tracking-[-0.03em] break-keep">
          잠깐,<br />쉬어가요
        </h2>
        <Link
          href="/minigame"
          className="flex items-center gap-1 text-[13px] font-bold text-[#F9954E] flex-shrink-0 mb-1"
        >
          전체 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="flex flex-col p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 active:bg-neutral-50 dark:active:bg-zinc-900/50 transition-colors"
          >
            <span className="text-[30px] mb-4 leading-none">{game.emoji}</span>
            <p className="text-[15px] font-black text-neutral-950 dark:text-white mb-1">
              {game.title}
            </p>
            <p className="text-[12px] text-neutral-400 leading-relaxed mb-4 break-keep">
              {game.desc}
            </p>
            <span className="text-[12px] font-bold text-[#F9954E]">
              {game.candy} 🍭
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
