// app/page.tsx
import Hero from "@/components/home/Hero";
import HomeClient from "@/components/home/HomeClient";
import TrendPreview from "@/components/home/TrendPreview";
import CategorySection from "@/components/home/CategorySection";
import QuickMenu from "@/components/home/QuickMenu";
import MiniGameSection from "@/components/home/MiniGameSection";
import SNSBanner from "@/components/home/SNSBanner";
import { getAllTrends } from "@/lib/trends";
import { getAllCurations } from "@/lib/curation";
import { getAllAnalyses } from "@/lib/analysis";
import { getAllReports } from "@/lib/reports";

export default async function Home() {
  // 서버 컴포넌트에서 카테고리별 최신 글 가져오기
  const latestTrends = getAllTrends().slice(0, 3);
  const latestCurations = getAllCurations().slice(0, 3);
  const latestAnalyses = getAllAnalyses().slice(0, 3);
  const latestReports = getAllReports().slice(0, 3);

  return (
    <main className="min-h-screen bg-background">
      {/* 1. 히어로 섹션 */}
      <Hero />

      {/* 2. 출석 체크 위젯 (클라이언트) */}
      <HomeClient />

      {/* 3. 최신 트렌드 기사 */}
      <TrendPreview trends={latestTrends} />

      {/* 4. 큐레이션 */}
      <CategorySection
        emoji="📚"
        title="이번 주 AI 큐레이션"
        subtitle="당장 써볼 수 있는 AI 도구와 서비스를 골라드려요"
        moreHref="/insight"
        posts={latestCurations}
      />

      {/* 5. 심층 분석 */}
      <CategorySection
        emoji="🔍"
        title="AI 심층 분석"
        subtitle="표면 뒤의 구조와 흐름을 깊이 있게 풀어드려요"
        moreHref="/insight"
        posts={latestAnalyses}
      />

      {/* 6. 산업 리포트 */}
      <CategorySection
        emoji="📊"
        title="AI 산업 리포트"
        subtitle="투자, 시장, 기업 동향을 데이터로 정리했어요"
        moreHref="/insight"
        posts={latestReports}
      />

      {/* 7. 빠른 접근 메뉴 */}
      <QuickMenu />

      {/* 8. 인기 미니게임 */}
      <MiniGameSection />

      {/* 9. SNS 팔로우 배너 */}
      <SNSBanner />
    </main>
  );
}
