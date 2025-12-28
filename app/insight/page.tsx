import { getSortedPostsData } from '@/lib/posts';
import { getAllGuides } from '@/lib/guides';
import InsightClient from './page.client';
import { InsightItem } from '@/types/content';

export default async function InsightPage() {
  try {
    // posts 폴더에서 모든 인사이트 글 가져오기
    const allPosts = getSortedPostsData();
    
    // content/guides 폴더에서 가이드 글 가져오기
    const guides = getAllGuides();
    
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
    
    // 가이드 글은 옛날순으로 정렬 (날짜 오름차순)
    const sortedGuides = guideItems.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB; // 옛날순 (오름차순)
    });
    
    // 일반 인사이트 글은 최신순으로 정렬 (날짜 내림차순)
    const sortedPosts = allPosts.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // 최신순 (내림차순)
    });
    
    // 가이드 글을 앞쪽에 배치
    const combinedPosts = [...sortedGuides, ...sortedPosts];
    
    return <InsightClient initialPosts={combinedPosts || []} />;
  } catch (error) {
    console.error('Error loading insight posts:', error);
    return <InsightClient initialPosts={[]} />;
  }
}