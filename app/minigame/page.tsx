"use client";

import Link from "next/link";
import { Merge, Hammer, Crown, Trophy, Flame, ImageIcon, BrainCircuit, Gamepad2, Target, Zap, Palette, Brain, Calculator, Bird, Sparkles } from "lucide-react";
import CottonCandy from "@/components/icons/CottonCandy";

// candy: 솜사탕 지급 게임(동물합치기·보스클릭커·2048)만 표기 / rank: 명예의 전당(TOP5) 운영 게임
const GAMES = [
  { id: "galaxymerge", title: "갤럭시 머지",   desc: "은하수 속 네온 동물을 합쳐 진화! (NEW · Unity)", icon: <Sparkles className="w-5 h-5" />,  href: "/minigame/galaxy",      candy: "+50",  rank: true  },
  { id: "merge",       title: "동물 합치기",   desc: "같은 동물이 만나면 합쳐져요! (12단계 진화)", icon: <Merge className="w-5 h-5" />,       href: "/minigame/animal",      candy: "+80",  rank: true  },
  { id: "clicker",     title: "보스 클릭커",   desc: "보스를 탭해 처치하고 업그레이드!",        icon: <Hammer className="w-5 h-5" />,        href: "/minigame/boss",        candy: "+100", rank: true  },
  { id: "game2048",    title: "Cute 2048",     desc: "귀여운 친구들과 숫자를 합쳐 2048!",      icon: <Crown className="w-5 h-5" />,         href: "/minigame/cute2048",    candy: "+60",  rank: true  },
  { id: "reaction",    title: "반응속도",      desc: "초록불에 번개처럼 탭하세요!",            icon: <Zap className="w-5 h-5" />,           href: "/minigame/reaction",    candy: "",     rank: true  },
  { id: "whack",       title: "두더지 잡기",   desc: "튀어나오는 두더지를 빠르게!",            icon: <Hammer className="w-5 h-5" />,        href: "/minigame/whack",       candy: "",     rank: true  },
  { id: "simon",       title: "순서 기억",     desc: "점점 길어지는 순서를 따라치세요.",       icon: <Brain className="w-5 h-5" />,         href: "/minigame/simon",       candy: "",     rank: true  },
  { id: "mathsprint",  title: "빠른 계산",     desc: "60초 안에 최대한 많이 풀기!",           icon: <Calculator className="w-5 h-5" />,    href: "/minigame/mathsprint",  candy: "",     rank: true  },
  { id: "aim",         title: "과녁 클릭",     desc: "과녁을 정확하고 빠르게 맞히세요.",       icon: <Target className="w-5 h-5" />,        href: "/minigame/aim",         candy: "",     rank: true  },
  { id: "flappy",      title: "플래피 도리",   desc: "탭해서 파이프를 통과하세요!",            icon: <Bird className="w-5 h-5" />,          href: "/minigame/flappy",      candy: "",     rank: true  },
  { id: "snake",       title: "스네이크",      desc: "뱀을 길게 키우는 고전 게임!",            icon: <Trophy className="w-5 h-5" />,        href: "/minigame/snake",       candy: "",     rank: true  },
  { id: "match3",      title: "젬 매치 사가",  desc: "보석 3개 이상 맞춰 터뜨리는 매치3!",     icon: <Flame className="w-5 h-5" />,         href: "/minigame/gem",         candy: "",     rank: true  },
  { id: "puzzle",      title: "슬라이드 퍼즐", desc: "조각을 움직여 그림을 완성하세요!",       icon: <ImageIcon className="w-5 h-5" />,     href: "/minigame/puzzle",      candy: "",     rank: true  },
  { id: "quiz",        title: "AI 상식 퀴즈",  desc: "AI 관련 상식을 테스트하세요.",           icon: <BrainCircuit className="w-5 h-5" />,  href: "/minigame/quiz",        candy: "",     rank: true  },
  { id: "memory",      title: "카드 뒤집기",   desc: "카드 위치를 기억해 짝을 맞추세요.",      icon: <Gamepad2 className="w-5 h-5" />,      href: "/minigame/memory",      candy: "",     rank: false },
  { id: "colormatch",  title: "색깔 맞추기",   desc: "30초 안에 색깔을 맞추세요!",             icon: <Palette className="w-5 h-5" />,       href: "/minigame/colormatch",  candy: "",     rank: true  },
  { id: "guess",       title: "숫자 맞추기",   desc: "힌트로 숨겨진 숫자를 찾아보세요.",       icon: <Target className="w-5 h-5" />,        href: "/minigame/guess",       candy: "",     rank: true  },
];

export default function MinigamePage() {
  return (
    <main className="min-h-screen">

      {/* 히어로 */}
      <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">미니게임</p>
        <h1 className="text-[38px] sm:text-[50px] font-extrabold text-neutral-950 dark:text-white leading-[1.1] tracking-tight mb-3 break-keep">
          가볍게 즐기는<br />게임 모음
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
          🏆 게임은 명예의 전당(TOP 5)에 기록이 남아요. 솜사탕은 동물 합치기·보스 클릭커·2048에서 받을 수 있어요.
        </p>
      </section>

      {/* 게임 리스트 */}
      <section className="py-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 shadow-sm transition-all duration-200 hover:border-[#F9954E]/50 hover:shadow-md hover:-translate-y-0.5 active:opacity-70"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 text-[#F9954E] flex items-center justify-center transition-colors group-hover:bg-[#F9954E] group-hover:text-white">
                {game.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-neutral-950 dark:text-white group-hover:text-[#F9954E] transition-colors">
                  {game.title}
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5 truncate">
                  {game.desc}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                {game.candy ? (
                  <span className="text-[11px] font-semibold text-[#F9954E] flex items-center justify-end gap-1">{game.candy} <CottonCandy className="w-3.5 h-3.5" /></span>
                ) : game.rank ? (
                  <span className="text-[11px] font-bold text-[#F9954E] bg-[#FFF5EB] dark:bg-[#F9954E]/10 rounded-full px-2 py-0.5 inline-flex items-center gap-0.5">🏆 랭킹</span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
