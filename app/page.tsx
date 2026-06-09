// app/page.tsx
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
      {/* 1. 히어로 + 카테고리 칩 */}
      <Hero />

      {/* 2. 출석 / 솜사탕 위젯 */}
      <HomeClient />

      {/* 3. 숫자 통계 */}
      <StatsStrip />

      {/* 4. AI 트렌드 카드 */}
      <TrendPreview trends={latestTrends} />

      {/* 5. 미니게임 */}
      <MiniGameSection />

      {/* 6. SNS 팔로우 */}
      <SNSBanner />
    </main>
  );
}
