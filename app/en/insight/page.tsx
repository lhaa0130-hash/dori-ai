import { Suspense } from 'react';
import { getAllGuides } from '@/lib/guides';
import { getAllAnalyses } from '@/lib/analysis';
import { getAllReports } from '@/lib/reports';
import { getAllCurations } from '@/lib/curation';
import InsightPageClient from '../../insight/page.client';
import { createMetadata } from '@/lib/seo';

// 영어 인사이트 목록 — 영어(lang:en) 콘텐츠만. 트렌드는 영어 미생성이라 제외.
export const metadata = createMetadata({
  title: 'AI Insights — the latest AI trends, analysis, reports and curation',
  description: 'AI analysis, reports, guides and curation — English AI insights collected by illo.im.',
  path: '/en/insight',
  locale: 'en',
  hreflang: { ko: '/insight', en: '/en/insight' },
});

export default async function EnInsightPage() {
  const en = <T extends { lang?: string }>(arr: T[]) => arr.filter((x) => x.lang === 'en');
  let filePosts: any[] = [];
  try {
    const guides = en(getAllGuides());
    const analyses = en(getAllAnalyses());
    const reports = en(getAllReports());
    // ⚠️영어 목록은 영어로 쓴 글만 — 영상·트렌드 제외(사용자 방침)
    const curations = en(getAllCurations()).filter((x: any) => x.category !== '영상');

    const map = (arr: any[], prefix: string, fallbackCat: string) =>
      arr.map((item, index) => ({
        id: `${prefix}-${index}`,
        title: item.titleEn || item.title,
        summary: item.summaryEn || item.description || '',
        category: item.category || fallbackCat,
        tags: item.tags || [],
        likes: 0,
        created_at: item.date || new Date().toISOString(),
        content: '',
        thumbnail_url: item.thumbnail,
        slug: item.slug,
      }));

    filePosts = [
      ...map(guides, 'guide', '가이드'),
      ...map(analyses, 'analysis', '분석'),
      ...map(reports, 'report', '리포트'),
      ...map(curations, 'curation', '큐레이션'),
    ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  } catch (error) {
    console.error('Error loading EN insight posts:', error);
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InsightPageClient initialPosts={filePosts} locale="en" />
    </Suspense>
  );
}
