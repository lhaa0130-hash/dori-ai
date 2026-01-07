import { NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';
import { getAllGuides } from '@/lib/guides';
import { getAllTrends } from '@/lib/trends';
import { InsightItem } from '@/types/content';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const searchQuery = query.toLowerCase().trim();
    const results: any[] = [];

    // 1. 인사이트 글 검색 (posts, guides, trends)
    try {
      const allPosts = getSortedPostsData();
      const guides = getAllGuides();
      const trends = getAllTrends();

      // 가이드 변환
      const guideItems: InsightItem[] = guides.map((guide, index) => {
        const slugNumber = guide.slug.match(/\d+/)?.[0];
        const id = slugNumber ? parseInt(slugNumber) + 1000 : 1000 + index;
        return {
          id: id,
          title: guide.title,
          summary: guide.description || guide.subtitle || '',
          category: '가이드' as const,
          tags: guide.tags || [],
          likes: 0,
          date: guide.date || new Date().toISOString().split('T')[0],
          content: guide.content,
          slug: guide.slug,
          ...(guide.thumbnail && { image: guide.thumbnail }),
        };
      });

      // 트렌드 변환
      const trendItems: InsightItem[] = trends.map((trend, index) => {
        const slugNumber = trend.slug.match(/\d+/)?.[0];
        const id = slugNumber ? parseInt(slugNumber) + 2000 : 2000 + index;
        return {
          id: id,
          title: trend.title,
          summary: trend.description || '',
          category: (trend.category || '트렌드') as const,
          tags: trend.tags || [],
          likes: 0,
          date: trend.date || new Date().toISOString().split('T')[0],
          content: trend.content,
          slug: trend.slug,
          ...(trend.thumbnail && { image: trend.thumbnail }),
        };
      });

      // 모든 인사이트 글 합치기
      const allInsights = [...guideItems, ...trendItems, ...allPosts];

      // 검색 필터링
      const matchedInsights = allInsights
        .filter((item) => {
          const titleMatch = item.title?.toLowerCase().includes(searchQuery);
          const summaryMatch = item.summary?.toLowerCase().includes(searchQuery);
          const tagMatch = item.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery));
          const categoryMatch = item.category?.toLowerCase().includes(searchQuery);
          return titleMatch || summaryMatch || tagMatch || categoryMatch;
        })
        .slice(0, 5)
        .map((item) => {
          let url = `/insight/${item.id}`;
          if (item.slug) {
            if (item.category === '가이드') {
              url = `/insight/guide/${item.slug}`;
            } else if (item.category === '트렌드') {
              url = `/insight/trend/${item.slug}`;
            }
          }
          return {
            type: 'insight',
            icon: item.category === '가이드' ? '📚' : item.category === '트렌드' ? '📈' : '📝',
            title: item.title,
            description: item.summary || '',
            category: item.category,
            url: url,
          };
        });

      results.push(...matchedInsights);
    } catch (e) {
      console.error('Error searching insights:', e);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

