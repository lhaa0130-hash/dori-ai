// app/page.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import StatsStrip from "@/components/home/StatsStrip";
import TrendPreview from "@/components/home/TrendPreview";
import MiniGameSection from "@/components/home/MiniGameSection";
import SNSBanner from "@/components/home/SNSBanner";
import { getAllTrends } from "@/lib/trends";

export default async function Home() {
  const latestTrends = getAllTrends().slice(0, 3);

  return (
    <main className="min-h-screen">

      {/* 1. 히어로 */}
      <Hero />

      {/* 2. 출석 위젯 */}
      <HomeClient />

      {/* 3. 숫자 통계 */}
      <StatsStrip />

      {/* 4. 트렌드 (다크 카드) */}
      <TrendPreview trends={latestTrends} />

      {/* 5. AI 도구 */}
      <section className="py-16 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[11px] font-bold text-[#F9954E] tracking-[0.22em] uppercase mb-5">
          AI TOOLS
        </p>
        <h2 className="text-[38px] sm:text-[46px] font-black text-neutral-950 dark:text-white leading-[1.0] tracking-[-0.03em] mb-4 break-keep">
          200개 이상의<br />AI 도구
        </h2>
        <p className="text-[15px] text-neutral-400 dark:text-neutral-500 mb-10 leading-relaxed break-keep">
          카테고리별로 정리된 AI 도구를<br />지금 바로 탐색하세요.
        </p>
        <Link
          href="/ai-tools"
          className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 text-neutral-800 dark:text-neutral-200 font-bold text-[15px] active:opacity-70 transition-opacity"
        >
          도구 탐색하기 <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* 6. 미니게임 */}
      <MiniGameSection />

      {/* 7. SNS 팔로우 (다크 카드) */}
      <SNSBanner />

    </main>
  );
}
