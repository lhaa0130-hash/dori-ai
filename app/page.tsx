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
      <section className="py-12 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">AI 도구</p>
        <h2 className="text-[28px] sm:text-[34px] font-extrabold text-neutral-950 dark:text-white leading-[1.2] tracking-tight mb-3 break-keep">
          200개 이상의 AI 도구를<br />한눈에
        </h2>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed break-keep">
          카테고리별로 정리된 AI 도구를 지금 바로 탐색하세요.
        </p>
        <Link
          href="/ai-tools"
          className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-300 font-semibold text-[14px] active:opacity-70 transition-opacity"
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
