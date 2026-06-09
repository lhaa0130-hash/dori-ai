// app/page.tsx
import Link from "next/link";
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import StatsStrip from "@/components/home/StatsStrip";
import TrendPreview from "@/components/home/TrendPreview";
import MiniGameSection from "@/components/home/MiniGameSection";
import SNSBanner from "@/components/home/SNSBanner";
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

      {/* 1. 히어로 */}
      <Hero />

      {/* 2. 퀵 메뉴 — Toss 앱 스타일 아이콘 그리드 */}
      <section className="pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <div className="grid grid-cols-5">
          {MENUS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex flex-col items-center gap-2.5 py-2 active:opacity-55 transition-opacity"
            >
              {/* 아이콘 박스 */}
              <div className="w-[52px] h-[52px] rounded-2xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex items-center justify-center text-[22px] shadow-sm">
                {m.emoji}
              </div>
              {/* 라벨 */}
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 text-center leading-tight">
                {m.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. 출석 / 솜사탕 */}
      <HomeClient />

      {/* 4. 숫자 통계 */}
      <StatsStrip />

      {/* 5. AI 트렌드 */}
      <TrendPreview trends={latestTrends} />

      {/* 6. 미니게임 */}
      <MiniGameSection />

      {/* 7. SNS */}
      <SNSBanner />

    </main>
  );
}
