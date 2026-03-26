// app/page.tsx
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import TrendPreview from "@/components/home/TrendPreview";
import QuickMenu from "@/components/home/QuickMenu";
import MiniGameSection from "@/components/home/MiniGameSection";
import SNSBanner from "@/components/home/SNSBanner";
import { getAllTrends } from "@/lib/trends";

export default async function Home() {
  // 서버 컴포넌트에서 최신 트렌드 6개 가져오기
  const allTrends = getAllTrends();
  const latestTrends = allTrends.slice(0, 6);

  return (
    <main className="min-h-screen bg-background">
      {/* 1. 히어로 섹션 */}
      <Hero />

      {/* 2. 출석 체크 위젯 (클라이언트) */}
      <HomeClient />

      {/* 3. 최신 트렌드 기사 */}
      <TrendPreview trends={latestTrends} />

      {/* 4. 빠른 접근 메뉴 */}
      <QuickMenu />

      {/* 5. 인기 미니게임 */}
      <MiniGameSection />

      {/* 6. SNS 팔로우 배너 */}
      <SNSBanner />
    </main>
  );
}
