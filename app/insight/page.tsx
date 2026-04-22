import { Suspense } from 'react';
import { sql } from "@vercel/postgres";
import { getSortedPostsData } from '@/lib/posts';
import { getAllGuides } from '@/lib/guides';
import { getAllTrends } from '@/lib/trends';
import { getAllAnalyses } from '@/lib/analysis';
import { getAllReports } from '@/lib/reports';
import { getAllCurations } from '@/lib/curation';
import InsightPageClient from './page.client';
import { getFirebaseFirestore } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Revalidate 설정 (새 글이 올라오면 60초마다 갱신 or 온디맨드 리밸리데이트)
export const revalidate = 60;

export default async function InsightPage() {
  try {
    // 0. Firestore 데이터 가져오기 (n8n 자동화 글)
    let firestorePosts: any[] = [];
    try {
      const db = getFirebaseFirestore();
      // 엣지 런타임 등의 이슈로 로컬/빌드 환경에 따라 db 접속이 안될 수 있음 (예외 처리 필수)
      if (db) {
        const q = query(collection(db, "posts"), orderBy("created_at", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        firestorePosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
    } catch (firebaseError) {
      console.error('Error loading Firestore posts:', firebaseError);
      // Firebase 에러가 나도 페이지는 떠야 함
    }

    // 1. Vercel Postgres 데이터 (레거시/백업)
    let dbPosts: any[] = [];
    try {
      const { rows } = await sql`
        SELECT * FROM posts 
        ORDER BY created_at DESC
      `;
      dbPosts = rows || [];
    } catch (dbError) {
      // console.error('Error loading DB posts:', dbError);
    }

    // 2. 파일 시스템 데이터
    let filePosts: any[] = [];
    try {
      const allPosts = getSortedPostsData();
      const guides = getAllGuides();
      const trends = getAllTrends();
      const analyses = getAllAnalyses();
      const reports = getAllReports();
      const curations = getAllCurations();

      const guideItems = guides.map((guide, index) => ({
        id: `guide-${index}`,
        title: guide.title,
        summary: guide.description || guide.subtitle || '',
        category: guide.category || '가이드',
        tags: guide.tags || [],
        likes: 0,
        created_at: guide.date || new Date().toISOString(),
        content: guide.content || '',
        thumbnail_url: guide.thumbnail,
        slug: guide.slug,
      }));

      const trendItems = trends.map((trend, index) => ({
        id: `trend-${index}`,
        title: trend.title,
        summary: trend.description || '',
        category: trend.category || '트렌드',
        tags: trend.tags || [],
        likes: 0,
        created_at: trend.date || new Date().toISOString(),
        content: trend.content || '',
        thumbnail_url: trend.thumbnail,
        slug: trend.slug,
      }));

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
        slug: String(post.id),
      }));

      const analysisItems = analyses.map((item, index) => ({
        id: `analysis-${index}`,
        title: item.title,
        summary: item.description || '',
        category: item.category || '분석',
        tags: item.tags || [],
        likes: 0,
        created_at: item.date || new Date().toISOString(),
        content: item.content || '',
        thumbnail_url: item.thumbnail,
        slug: item.slug,
      }));

      const reportItems = reports.map((item, index) => ({
        id: `report-${index}`,
        title: item.title,
        summary: item.description || '',
        category: item.category || '리포트',
        tags: item.tags || [],
        likes: 0,
        created_at: item.date || new Date().toISOString(),
        content: item.content || '',
        thumbnail_url: item.thumbnail,
        slug: item.slug,
      }));

      const curationItems = curations.map((item, index) => ({
        id: `curation-${index}`,
        title: item.title,
        summary: item.description || '',
        category: item.category || '큐레이션',
        tags: item.tags || [],
        likes: 0,
        created_at: item.date || new Date().toISOString(),
        content: item.content || '',
        thumbnail_url: item.thumbnail,
        slug: item.slug,
      }));

      filePosts = [...guideItems, ...trendItems, ...analysisItems, ...reportItems, ...curationItems, ...insightItems];
    } catch (fileError) {
      console.error('Error loading file posts:', fileError);
    }

    // 3. DB 데이터 변환 (Postgres)
    const transformedDbPosts = dbPosts.map((post) => {
      let cleanContent = post.content || '';
      if (cleanContent) {
        cleanContent = cleanContent.replace(/<[^>]*>/g, '');
        // ... (Cleanup logic same as before)
        cleanContent = cleanContent.trim();
      }
      return {
        id: String(post.id),
        title: post.title || '',
        summary: cleanContent ? (cleanContent.length > 150 ? cleanContent.substring(0, 150) + '...' : cleanContent) : '',
        category: post.category || '기타',
        tags: post.tags ? (Array.isArray(post.tags) ? post.tags : JSON.parse(post.tags || '[]')) : [],
        likes: post.likes || 0,
        created_at: post.created_at || new Date().toISOString(),
        content: cleanContent,
        thumbnail_url: post.thumbnail_url,
        slug: String(post.id),
      };
    });

    // 4. Firestore 데이터 변환
    const transformedFirestorePosts = firestorePosts.map((post) => ({
      id: post.id, // Firestore ID
      title: post.title,
      summary: post.summary,
      category: post.category,
      tags: post.tags,
      likes: post.likes || 0,
      created_at: post.created_at,
      content: post.content,
      thumbnail_url: post.thumbnail_url,
      slug: post.slug || post.id,
      isNew: true // UI에서 구분 가능하게 표시 가능
    }));

    // 5. 통합 및 정렬
    const allPosts = [...transformedFirestorePosts, ...transformedDbPosts, ...filePosts].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
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
