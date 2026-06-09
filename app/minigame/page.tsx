"use client";

import Link from "next/link";
import { ArrowRight, Merge, Hammer, Crown, Trophy, Flame, ImageIcon, BrainCircuit, Gamepad2, Swords, Coins, Target, Dices, Hand, Zap, Palette, Star, Sword, Sparkles, TrendingUp, MousePointer2 } from "lucide-react";

const GAMES = [
  { id: "merge",       title: "동물 합치기",   desc: "같은 동물이 만나면 합쳐져요!",           icon: <Merge className="w-5 h-5" />,         href: "/minigame/merge",       candy: "+80"  },
  { id: "clicker",     title: "보스 클릭커",   desc: "클릭으로 몬스터를 처치하세요!",          icon: <Hammer className="w-5 h-5" />,        href: "/minigame/clicker",     candy: "+100" },
  { id: "game2048",    title: "2048",          desc: "숫자를 합쳐 2048을 만드세요!",           icon: <Crown className="w-5 h-5" />,         href: "/minigame/2048",        candy: "+60"  },
  { id: "snake",       title: "스네이크",      desc: "뱀을 길게 키우는 고전 게임!",            icon: <Trophy className="w-5 h-5" />,        href: "/minigame/snake",       candy: "+50"  },
  { id: "match3",      title: "매치 3 퍼즐",   desc: "3개의 블록을 맞춰 터뜨리세요!",         icon: <Flame className="w-5 h-5" />,         href: "/minigame/match3",      candy: "+50"  },
  { id: "puzzle",      title: "슬라이드 퍼즐", desc: "조각을 움직여 그림을 완성하세요!",       icon: <ImageIcon className="w-5 h-5" />,     href: "/minigame/puzzle",      candy: "+40"  },
  { id: "quiz",        title: "AI 상식 퀴즈",  desc: "AI 관련 상식을 테스트하세요.",           icon: <BrainCircuit className="w-5 h-5" />,  href: "/minigame/quiz",        candy: "+30"  },
  { id: "memory",      title: "카드 뒤집기",   desc: "카드 위치를 기억해 짝을 맞추세요.",      icon: <Gamepad2 className="w-5 h-5" />,      href: "/minigame/memory",      candy: "+40"  },
  { id: "ladder",      title: "사다리 타기",   desc: "스릴 넘치는 사다리 게임!",               icon: <Swords className="w-5 h-5" />,        href: "/minigame/ladder",      candy: "+20"  },
  { id: "coinflip",    title: "동전 던지기",   desc: "3D 회전의 짜릿한 동전 던지기!",          icon: <Coins className="w-5 h-5" />,         href: "/minigame/coinflip",    candy: "+20"  },
  { id: "guess",       title: "숫자 맞추기",   desc: "힌트로 숨겨진 숫자를 찾아보세요.",       icon: <Target className="w-5 h-5" />,        href: "/minigame/guess",       candy: "+20"  },
  { id: "dice",        title: "주사위 굴리기", desc: "주사위를 굴려 행운을 시험하세요!",        icon: <Dices className="w-5 h-5" />,         href: "/minigame/dice",        candy: "+20"  },
  { id: "roulette",    title: "룰렛",          desc: "룰렛을 돌려 행운을 시험하세요!",          icon: <Trophy className="w-5 h-5" />,        href: "/minigame/roulette",    candy: "+20"  },
  { id: "rps",         title: "가위바위보",    desc: "컴퓨터와 가위바위보 대결!",               icon: <Hand className="w-5 h-5" />,          href: "/minigame/rps",         candy: "+20"  },
  { id: "typingspeed", title: "타이핑 속도",   desc: "당신의 타이핑 실력을 측정하세요.",        icon: <Zap className="w-5 h-5" />,           href: "/minigame/typingspeed", candy: "+40"  },
  { id: "colormatch",  title: "색깔 맞추기",   desc: "30초 안에 색깔을 맞추세요!",             icon: <Palette className="w-5 h-5" />,       href: "/minigame/colormatch",  candy: "+30"  },
  { id: "slot",        title: "슬롯머신",      desc: "가상 코인으로 즐기는 3릴 슬롯!",         icon: <Star className="w-5 h-5" />,          href: "/minigame/slot",        candy: "+30"  },
  { id: "blackjack",   title: "블랙잭",        desc: "딜러와 21점을 겨루는 카드 게임!",         icon: <Sword className="w-5 h-5" />,         href: "/minigame/blackjack",   candy: "+30"  },
  { id: "highlow",     title: "하이로우",      desc: "다음 카드 숫자를 예측하세요!",            icon: <Sparkles className="w-5 h-5" />,      href: "/minigame/highlow",     candy: "+30"  },
  { id: "crash",       title: "크래시",        desc: "배수가 터지기 전에 캐시아웃!",            icon: <TrendingUp className="w-5 h-5" />,    href: "/minigame/crash",       candy: "+30"  },
  { id: "baccarat",    title: "바카라",        desc: "플레이어 vs 뱅커, 진짜 룰의 바카라!",    icon: <MousePointer2 className="w-5 h-5" />, href: "/minigame/baccarat",    candy: "+30"  },
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
          솜사탕을 모으며 즐겨보세요.
        </p>
      </section>

      {/* 게임 리스트 */}
      <section className="py-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={game.href}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 shadow-sm active:opacity-70 transition-opacity"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-neutral-50 dark:bg-zinc-900 text-neutral-500 dark:text-neutral-400 flex items-center justify-center">
                {game.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-neutral-950 dark:text-white">
                  {game.title}
                </p>
                <p className="text-[12px] text-neutral-400 mt-0.5 truncate">
                  {game.desc}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-[11px] font-semibold text-[#F9954E] block">{game.candy} 🍭</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
