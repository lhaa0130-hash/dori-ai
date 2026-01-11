import { Suspense } from 'react';
import { getSortedPostsData } from '@/lib/posts';
import { getAllGuides } from '@/lib/guides';
import { getAllTrends } from '@/lib/trends';
import InsightClient from './page.client';
import { InsightItem } from '@/types/content';

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic';

export default async function InsightPage() {
  try {
    // posts 폴더에서 모든 인사이트 글 가져오기
    const allPosts = getSortedPostsData();
    
    // content/guides 폴더에서 가이드 글 가져오기
    const guides = getAllGuides();
    
    // content/trend 폴더에서 트렌드 글 가져오기
    const trends = getAllTrends();
    
    // 가이드를 InsightItem 형식으로 변환
    const guideItems: InsightItem[] = guides.map((guide, index) => {
      // slug에서 숫자 추출 (예: "guide-01" -> 1) 또는 인덱스 기반 ID 생성
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
        slug: guide.slug, // 가이드 slug 추가
        ...(guide.thumbnail && { image: guide.thumbnail }),
      };
    });
    
    // 트렌드를 InsightItem 형식으로 변환
    const trendItems: InsightItem[] = trends.map((trend, index) => {
      // slug에서 숫자 추출 (예: "trend-01" -> 1) 또는 인덱스 기반 ID 생성
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
        slug: trend.slug, // 트렌드 slug 추가
        ...(trend.thumbnail && { image: trend.thumbnail }),
      };
    });
    
    // 모든 글을 합치고 날짜 기준으로 최신순 정렬 (최신 글이 최상단에)
    const combinedPosts = [...guideItems, ...trendItems, ...allPosts].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // 최신순 (내림차순)
    });
    
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <InsightClient initialPosts={combinedPosts || []} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading insight posts:', error);
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <InsightClient initialPosts={[]} />
      </Suspense>
    );
  }
}
