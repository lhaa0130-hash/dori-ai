// app/page.tsx
import Link from "next/link";
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import TrendPreview from "@/components/home/TrendPreview";
import MiniGameSection from "@/components/home/MiniGameSection";
import { getAllTrends } from "@/lib/trends";

const MENUS = [
  { emoji: "🔥", label: "트렌드",   href: "/insight"   },
  { emoji: "🤖", label: "AI 도구",  href: "/ai-tools"  },
  { emoji: "🎮", label: "미니게임", href: "/minigame"  },
  { emoji: "⚡", label: "자동화",   href: "/auto"      },
  { emoji: "💬", label: "커뮤니티", href: "/community" },
];

export default async function Home() {
  const latestTrends = getAllTrends().slice(0, 3);

  return (
    <main className="min-h-screen">

      {/* 히어로 */}
      <Hero />

      {/* 퀵 메뉴 */}
      <section className="pb-7 border-b border-neutral-100 dark:border-zinc-900">
        <div className="grid grid-cols-5">
          {MENUS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col items-center gap-2 py-1 active:opacity-55 transition-opacity"
            >
              <div className="w-[50px] h-[50px] rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex items-center justify-center text-[21px] shadow-sm">
                {m.emoji}
              </div>
              <span className="text-[10.5px] font-semibold text-neutral-500 dark:text-neutral-400 text-center">
                {m.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 출석 위젯 */}
      <HomeClient />

      {/* AI 트렌드 */}
      <TrendPreview trends={latestTrends} />

      {/* 미니게임 */}
      <MiniGameSection />

    </main>
  );
}
