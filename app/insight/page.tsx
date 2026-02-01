import { Suspense } from 'react';
import { sql } from "@vercel/postgres";
import { getSortedPostsData } from '@/lib/posts';
import { getAllGuides } from '@/lib/guides';
import { getAllTrends } from '@/lib/trends';
import InsightPageClient from './page.client';



export default async function InsightPage() {
  try {
    // 1. Vercel Postgres에서 모든 포스트를 최신순으로 가져오기
    let dbPosts: any[] = [];
    try {
      const { rows } = await sql`
        SELECT * FROM posts 
        ORDER BY created_at DESC
      `;
      dbPosts = rows || [];
    } catch (dbError) {
      console.error('Error loading DB posts:', dbError);
    }

    // 2. 파일 시스템에서 데이터 가져오기
    let filePosts: any[] = [];
    try {
      const allPosts = getSortedPostsData();
      const guides = getAllGuides();
      const trends = getAllTrends();

      // 가이드를 변환
      const guideItems = guides.map((guide, index) => {
        const slugNumber = guide.slug.match(/\d+/)?.[0];
        const id = slugNumber ? parseInt(slugNumber) + 1000 : 1000 + index;
        return {
          id: String(id),
          title: guide.title,
          summary: guide.description || guide.subtitle || '',
          category: guide.category || '가이드',
          tags: guide.tags || [],
          likes: 0,
          created_at: guide.date || new Date().toISOString(),
          content: guide.content || '',
          thumbnail_url: guide.thumbnail,
          slug: guide.slug,
        };
      });

      // 트렌드를 변환
      const trendItems = trends.map((trend, index) => {
        const slugNumber = trend.slug.match(/\d+/)?.[0];
        const id = slugNumber ? parseInt(slugNumber) + 2000 : 2000 + index;
        return {
          id: String(id),
          title: trend.title,
          summary: trend.description || '',
          category: trend.category || '트렌드',
          tags: trend.tags || [],
          likes: 0,
          created_at: trend.date || new Date().toISOString(),
          content: trend.content || '',
          thumbnail_url: trend.thumbnail,
          slug: trend.slug,
        };
      });

      // 일반 인사이트 글 변환
      const insightItems = allPosts.map((post) => ({
        id: String(post.id),
        title: post.title,
        summary: post.summary || '',
        category: post.category || '기타',
        tags: post.tags || [],
        likes: post.likes || 0,
        created_at: post.date || new Date().toISOString(),
        content: '',
        thumbnail_url: post.image,
        slug: String(post.id), // Add slug based on id
      }));

      filePosts = [...guideItems, ...trendItems, ...insightItems];
    } catch (fileError) {
      console.error('Error loading file posts:', fileError);
    }

    // 3. DB 데이터를 파일 시스템 형식에 맞게 변환
    const transformedDbPosts = dbPosts.map((post) => {
      // 본문에서 시스템 메시지 제거
      let cleanContent = post.content || '';
      if (cleanContent) {
        cleanContent = cleanContent.replace(/<[^>]*>/g, '');
        // 시스템 메시지 패턴 제거
        const systemPatterns = [
          /^물론입니다\.\s*/i,
          /^---\s*title:.*?---\s*/s,
          /^#+\s*title:.*?\n/s,
          /^AI 전문 블로그.*?\n/i,
          /^---\s*[\s\S]*?---\s*/,
        ];
        systemPatterns.forEach(pattern => {
          cleanContent = cleanContent.replace(pattern, '');
        });
        cleanContent = cleanContent.trim();
      }
      
      // 카테고리 정규화 (trend → 트렌드)
      let normalizedCategory = post.category || '기타';
      if (normalizedCategory.toLowerCase() === 'trend') {
        normalizedCategory = '트렌드';
      }
      
      return {
        id: String(post.id),
        title: post.title || '',
        summary: cleanContent ? (cleanContent.length > 150 ? cleanContent.substring(0, 150) + '...' : cleanContent) : '',
        category: normalizedCategory,
        tags: post.tags ? (Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags || '[]')) : [],
        likes: post.likes || 0,
        created_at: post.created_at || new Date().toISOString(),
        content: cleanContent,
        thumbnail_url: post.thumbnail_url,
        slug: String(post.id), // Add slug based on id
      };
    });

    // 4. 모든 데이터 통합 및 최신순 정렬
    const allPosts = [...transformedDbPosts, ...filePosts].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // 최신순
    });

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <InsightPageClient initialPosts={allPosts} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading insight posts:', error);
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <InsightPageClient initialPosts={[]} />
      </Suspense>
    );
  }
}
