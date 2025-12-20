import { getAllGuides } from '@/lib/guides';
import InsightPageClient from './InsightPageClient';

export default async function InsightPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentCategory = resolvedSearchParams.category || 'Guide';
  
  const allGuides = getAllGuides();
  // 카테고리 매핑: 한글 -> 영어
  const categoryMap: { [key: string]: string } = {
    'Curation': '큐레이션',
    'Report': '리포트',
    'Analysis': '분석',
    'Guide': '가이드',
    'Trend': '트렌드',
  };
  const categories = ['Curation', 'Report', 'Analysis', 'Guide', 'Trend'];
  const koreanCategory = categoryMap[currentCategory] || '가이드';
  const filteredGuides = allGuides.filter((guide) => guide.category === koreanCategory);

  return (
    <InsightPageClient 
      guides={filteredGuides}
      currentCategory={currentCategory}
      categories={categories}
    />
  );
}