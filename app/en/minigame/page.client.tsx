"use client";

import Link from "next/link";
import { Hammer, Crown, Trophy, Flame, ImageIcon, BrainCircuit, Gamepad2, Target, Zap, Palette, Brain, Calculator, Bird, Sparkles, PenLine, Shield } from "lucide-react";
import CottonCandy from "@/components/icons/CottonCandy";

// candy: 솜사탕 지급 게임만 표기 / rank: 명예의 전당(TOP5) 운영 게임. 게임 라우트는 한글판과 공용.
const GAMES = [
  { id: "galaxymerge", title: "Galaxy Merge",  desc: "Merge neon animals in the galaxy and evolve! (NEW · Unity)", icon: <Sparkles className="w-5 h-5" />, href: "/minigame/galaxy",     candy: "+50",  rank: true  },
  { id: "clicker",     title: "Boss Clicker",  desc: "Tap to defeat the boss and upgrade!",           icon: <Hammer className="w-5 h-5" />,       href: "/minigame/boss",       candy: "+100", rank: true  },
  { id: "quickdraw",   title: "Quick Draw",    desc: "Draw shapes fast and accurately — 5 rounds.",   icon: <PenLine className="w-5 h-5" />,      href: "/minigame/quick-draw", candy: "",     rank: true  },
  { id: "towerdef",    title: "illo Defense",  desc: "Stop monsters pouring from the center with towers on all four sides!", icon: <Shield className="w-5 h-5" />, href: "/minigame/tower-def", candy: "", rank: true },
  { id: "game2048",    title: "Cute 2048",     desc: "Merge numbers with cute friends to reach 2048!", icon: <Crown className="w-5 h-5" />,       href: "/minigame/cute2048",   candy: "+60",  rank: true  },
  { id: "reaction",    title: "Reaction Time", desc: "Tap like lightning when it turns green!",       icon: <Zap className="w-5 h-5" />,          href: "/minigame/reaction",   candy: "",     rank: true  },
  { id: "whack",       title: "Whack-a-Mole",  desc: "Hit the moles as fast as they pop up!",         icon: <Hammer className="w-5 h-5" />,       href: "/minigame/whack",      candy: "",     rank: true  },
  { id: "simon",       title: "Simon Says",    desc: "Repeat the sequence as it gets longer.",        icon: <Brain className="w-5 h-5" />,        href: "/minigame/simon",      candy: "",     rank: true  },
  { id: "mathsprint",  title: "Math Sprint",   desc: "Solve as many as you can in 60 seconds!",       icon: <Calculator className="w-5 h-5" />,   href: "/minigame/mathsprint", candy: "",     rank: true  },
  { id: "aim",         title: "Aim Trainer",   desc: "Hit the targets quickly and precisely.",        icon: <Target className="w-5 h-5" />,       href: "/minigame/aim",        candy: "",     rank: true  },
  { id: "flappy",      title: "Flappy Dori",   desc: "Tap to fly through the pipes!",                 icon: <Bird className="w-5 h-5" />,         href: "/minigame/flappy",     candy: "",     rank: true  },
  { id: "snake",       title: "Snake",         desc: "The classic — grow your snake as long as you can!", icon: <Trophy className="w-5 h-5" />,   href: "/minigame/snake",      candy: "",     rank: true  },
  { id: "match3",      title: "Gem Match Saga", desc: "Match 3 or more gems to pop them!",            icon: <Flame className="w-5 h-5" />,        href: "/minigame/gem",        candy: "",     rank: true  },
  { id: "puzzle",      title: "Slide Puzzle",  desc: "Slide the tiles to complete the picture!",      icon: <ImageIcon className="w-5 h-5" />,    href: "/minigame/puzzle",     candy: "",     rank: true  },
  { id: "quiz",        title: "AI Quiz",       desc: "Test what you know about AI.",                  icon: <BrainCircuit className="w-5 h-5" />, href: "/minigame/quiz",       candy: "",     rank: true  },
  { id: "memory",      title: "Memory Match",  desc: "Remember the cards and find the pairs.",        icon: <Gamepad2 className="w-5 h-5" />,     href: "/minigame/memory",     candy: "",     rank: false },
  { id: "colormatch",  title: "Color Match",   desc: "Match the colors within 30 seconds!",           icon: <Palette className="w-5 h-5" />,      href: "/minigame/colormatch", candy: "",     rank: true  },
  { id: "guess",       title: "Number Guess",  desc: "Use the hints to find the hidden number.",      icon: <Target className="w-5 h-5" />,       href: "/minigame/guess",      candy: "",     rank: true  },
];

export default function MinigameEnClient() {
  return (
    <main className="min-h-screen">

      {/* 히어로 */}
      <section className="pt-8 pb-10 border-b border-stone-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">Mini Games</p>
        <h1 className="text-[38px] sm:text-[50px] font-extrabold text-stone-950 dark:text-white leading-[1.1] tracking-tight mb-3 break-keep">
          Quick games,<br />anytime
        </h1>
        <p className="text-[14px] text-stone-500 dark:text-stone-400 leading-relaxed">
          🏆 Your scores are saved to the Hall of Fame (TOP 5). Cotton candy rewards come from Galaxy Merge, Boss Clicker and Cute 2048.
        </p>
        {/* 게임 라우트는 한글판과 공용 — 인게임 UI는 아직 한글이라 미리 알려준다. */}
        <p className="mt-3 inline-flex items-start gap-2 rounded-xl bg-stone-50 dark:bg-zinc-900 px-3 py-2 text-[12.5px] text-stone-500 dark:text-stone-400 leading-relaxed">
          <span aria-hidden="true">🈯</span>
          <span>Heads up: these descriptions are in English, but the games themselves are still in Korean. They are simple enough to play without reading — scores and rewards work exactly the same.</span>
        </p>
      </section>

      {/* 게임 리스트 */}
      <section className="py-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-stone-100 dark:border-zinc-900 shadow-sm transition-all duration-200 hover:border-[#F9954E]/50 hover:shadow-md hover:-translate-y-0.5 active:opacity-70"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#FBEEE7] dark:bg-[#F9954E]/10 text-[#F9954E] flex items-center justify-center transition-colors group-hover:bg-[#F9954E] group-hover:text-white">
                {game.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-stone-950 dark:text-white group-hover:text-[#F9954E] transition-colors">
                  {game.title}
                </p>
                <p className="text-[12px] text-stone-400 mt-0.5 truncate">
                  {game.desc}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                {game.candy ? (
                  <span className="text-[11px] font-semibold text-[#F9954E] flex items-center justify-end gap-1">{game.candy} <CottonCandy className="w-3.5 h-3.5" /></span>
                ) : game.rank ? (
                  <span className="text-[11px] font-bold text-[#F9954E] bg-[#FBEEE7] dark:bg-[#F9954E]/10 rounded-full px-2 py-0.5 inline-flex items-center gap-0.5">🏆 Ranked</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
