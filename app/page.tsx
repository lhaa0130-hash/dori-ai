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

const AI_TOOL_CATS = [
  { emoji: "🤖", label: "텍스트 & LLM",  sub: "ChatGPT, Claude…",   href: "/ai-tools" },
  { emoji: "🎨", label: "이미지 생성",    sub: "Midjourney, DALL-E…", href: "/ai-tools" },
  { emoji: "🎬", label: "영상 & 음성",    sub: "Runway, Suno…",       href: "/ai-tools" },
  { emoji: "⚡", label: "자동화",         sub: "Make, Zapier…",       href: "/ai-tools" },
];

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

      {/* 4. 트렌드 카드 */}
      <TrendPreview trends={latestTrends} />

      {/* 5. AI 도구 */}
      <section className="py-12 border-b border-neutral-100 dark:border-zinc-900">
        <div className="scroll-reveal">
          {/* 헤더 */}
          <p className="text-[12px] font-semibold text-[#F9954E] mb-3">AI 도구</p>
          <h2 className="text-[28px] sm:text-[34px] font-extrabold text-neutral-950 dark:text-white leading-[1.2] tracking-tight mb-2 break-keep">
            200개 이상의 AI 도구
          </h2>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-7 leading-relaxed break-keep">
            카테고리별로 정리된 AI 도구를 탐색하세요.
          </p>

          {/* 카테고리 퀵링크 2×2 */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {AI_TOOL_CATS.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="flex items-start gap-3 p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50 dark:bg-zinc-950 active:opacity-70 transition-opacity"
              >
                <span className="text-[22px] leading-none mt-0.5">{cat.emoji}</span>
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white leading-tight">{cat.label}</p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{cat.sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* 전체보기 링크 */}
          <Link
            href="/ai-tools"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#F9954E]"
          >
            전체 도구 보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 6. 미니게임 */}
      <MiniGameSection />

      {/* 7. SNS 팔로우 */}
      <SNSBanner />

    </main>
  );
}
