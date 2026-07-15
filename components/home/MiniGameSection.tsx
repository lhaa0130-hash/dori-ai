"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GAMES = [
  { emoji: "🎯", title: "보스 클릭커", desc: "보스를 탭해 처치·업그레이드", href: "/minigame/boss"        },
  { emoji: "🐍", title: "스네이크",    desc: "뱀을 길게 키우는 아케이드", href: "/minigame/snake"       },
  { emoji: "🔢", title: "Cute 2048",   desc: "숫자를 합쳐 2048 달성",    href: "/minigame/cute2048"    },
  { emoji: "⌨️", title: "타이핑",      desc: "AI 용어로 손가락 훈련",    href: "/minigame/typingspeed" },
];

export default function MiniGameSection() {
  return (
    <section className="py-6 pb-12">

      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] font-extrabold text-stone-950 dark:text-white">미니게임</p>
        <Link href="/minigame" className="flex items-center gap-1 text-[13px] font-semibold text-[#F9954E]">
          전체 <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {GAMES.map((game, i) => (
          <div key={game.href} className={`scroll-reveal-item scroll-delay-${i + 1}`}>
            <Link
              href={game.href}
              className="toss-card flex flex-col p-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 active:opacity-75"
            >
              <span className="text-[26px] mb-3 leading-none">{game.emoji}</span>
              <p className="text-[13px] font-bold text-stone-900 dark:text-white mb-1">{game.title}</p>
              <p className="text-[11px] text-stone-400 leading-snug break-keep">{game.desc}</p>
            </Link>
          </div>
        ))}
      </div>

    </section>
  );
}
