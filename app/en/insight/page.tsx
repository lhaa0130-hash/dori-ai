import { Suspense } from 'react';
import { getAllGuides } from '@/lib/guides';
import { getAllAnalyses } from '@/lib/analysis';
import { getAllReports } from '@/lib/reports';
import { getAllCurations } from '@/lib/curation';
import InsightPageClient from '../../insight/page.client';
import { createMetadata } from '@/lib/seo';

// 영어 인사이트 목록 — 영어(lang:en) 콘텐츠만. 트렌드는 영어 미생성이라 제외.
// ⚠️ 2026-08-13 정정 — 예전 문구는 "trends ... and curation"이었는데 트렌드·큐레이션은
//    2026-07-26 에 삭제한 카테고리다. 없는 걸 약속하면 안 된다(한글판도 같이 고쳤다).
export const metadata = createMetadata({
  title: 'AI Insights — in-depth analysis and market reports on AI',
  description: 'In-depth analysis and market reports on how AI technology and the AI market are actually moving, written and sourced by illo.im.',
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

  // ⚠️ 이 소개문은 장식이 아니라 필수다. 이 허브는 영어 글이 8편뿐이라 목록만 렌더하면
  //    서버 HTML 이 110단어짜리 제목 나열이 된다(2026-08-13 품질 게이트 적발).
  //    사이트맵에 제출하는 페이지는 "이 섹션이 무엇이고 어떻게 만들어지는지"를 스스로 설명해야 한다.
  return (
    <>
      <section className="mb-8">
        <h1 className="text-[22px] font-extrabold text-stone-950 dark:text-white leading-tight break-keep">
          AI Insights
        </h1>
        <p className="mt-3 text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed break-keep">
          Long-form analysis of how AI technology and the AI market are actually moving — written,
          sourced and edited by the illo team. Every piece names the companies, numbers and dates it
          relies on, and lists the outlet, headline and publication date for each source at the end
          so you can check the claim yourself.
        </p>
        <p className="mt-3 text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed break-keep">
          Two kinds of article live here. <strong>Analysis</strong> takes a single shift — an export
          control, a pricing change, a compute deal — and works through what it means for the people
          building on top of these tools. <strong>Reports</strong> track where money and infrastructure
          are going across the industry over a period, so you can see the direction rather than the
          headline. We publish when there is something worth explaining rather than on a fixed
          schedule, and we correct pieces after publication when we get something wrong.
        </p>
        <p className="mt-3 text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed break-keep">
          Looking for the Korean edition? It is larger and updated more often —{" "}
          <a href="/insight" className="text-[#F9954E] hover:underline">read the Korean insights</a>.
        </p>
      </section>
      <Suspense fallback={<div>Loading...</div>}>
        <InsightPageClient initialPosts={filePosts} locale="en" />
      </Suspense>
    </>
  );
}
