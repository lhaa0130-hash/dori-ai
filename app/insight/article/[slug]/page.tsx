import { getPostData } from '@/lib/posts';
import { getAllTrends } from '@/lib/trends';
import { Suspense } from 'react';
import Header from "@/components/layout/Header";
import Image from 'next/image';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import ShareButtons from '@/components/article/ShareButtons';
import ReadingProgress from '@/components/article/ReadingProgress';
import RelatedArticles from '@/components/article/RelatedArticles';

const SITE_URL = "https://dori-ai.com";

// ✅ 아티클별 개별 메타데이터 생성 (SEO 핵심)
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const post = await getPostData(params.slug);
    const title = post.title || "DORI-AI 인사이트";
    const description = post.summary || post.description || `${title} - DORI-AI에서 최신 AI 트렌드와 인사이트를 확인하세요.`;
    const image = post.thumbnail_url || `${SITE_URL}/og-default.png`;
    const url = `${SITE_URL}/insight/article/${params.slug}`;
    const tags = post.tags || [];

    return {
      title: `${title} | DORI-AI`,
      description,
      keywords: ["AI 트렌드", "인공지능", "DORI-AI", "AI 인사이트", ...tags].join(", "),
      alternates: { canonical: url },
      openGraph: {
        title: `${title} | DORI-AI`,
        description,
        url,
        siteName: "DORI-AI",
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        locale: "ko_KR",
        type: "article",
        publishedTime: post.date,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | DORI-AI`,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "DORI-AI 인사이트",
      description: "AI 트렌드와 인사이트를 확인하세요.",
    };
  }
}

export default async function InsightArticlePage({ params }: { params: { slug: string } }) {
  let post;

  try {
    post = await getPostData(params.slug);
  } catch (error) {
    console.error('Error loading insight article:', error);
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>게시글을 찾을 수 없습니다.</h1>
        <p>요청하신 게시글이 존재하지 않거나 로드할 수 없습니다.</p>
      </div>
    );
  }

  // 연관 기사용 전체 트렌드 가져오기
  const allTrends = getAllTrends();
  const articleUrl = `${SITE_URL}/insight/article/${params.slug}`;
  const postTags: string[] = Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : []);

  // Next.js Link 컴포넌트에는 href 속성이 필수입니다.
  const components = {
    a: ({ href, ...props }: any) => {
      if (href && href.startsWith('/')) {
        return (
          <Link href={href} {...props} />
        );
      }
      return <a href={href} {...props} target="_blank" rel="noopener noreferrer" />;
    },
    img: ({ src, alt, ...props }: any) => (
      <Image
        src={src || ''}
        alt={alt || ''}
        width={700}
        height={400}
        style={{ width: '100%', height: 'auto' }}
        {...props}
      />
    ),
  };

  const mdxOptions = {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeHighlight,
      rehypeSlug,
    ],
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* 읽기 진행 바 (상단 고정) */}
      <ReadingProgress />

      <main style={{ minHeight: '100vh', paddingTop: '70px' }}>
        <Header />
        <article className="max-w-4xl mx-auto p-4 md:p-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">
            {post.title}
          </h1>
          {post.thumbnail_url && (
            <div className="mb-8 rounded-lg overflow-hidden relative w-full h-[400px]">
              <Image
                src={post.thumbnail_url}
                alt={post.title || '썸네일 이미지'}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>
          )}
          <div className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
            <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            {post.author && <span> by {post.author}</span>}
          </div>

          {/* 소셜 공유 버튼 */}
          <div className="flex justify-center mb-8">
            <ShareButtons url={articleUrl} title={post.title || 'DORI-AI 기사'} />
          </div>

          {/* 기사 본문 */}
          <div className="prose-premium max-w-none">
            <MDXRemote
              source={post.content || ''}
              components={components}
              options={{ mdxOptions }}
            />
          </div>

          {/* 하단 공유 버튼 */}
          <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <ShareButtons url={articleUrl} title={post.title || 'DORI-AI 기사'} />
          </div>

          {/* 연관 기사 추천 */}
          <RelatedArticles
            currentSlug={params.slug}
            currentTags={postTags}
            allTrends={allTrends}
          />
        </article>
      </main>
    </Suspense>
  );
}

// 동적 라우트 세그먼트를 위한 generateStaticParams 함수
export async function generateStaticParams() {
  try {
    const { getSortedPostsData } = await import('@/lib/posts');
    const { getAllTrends } = await import('@/lib/trends');
    const { getAllGuides } = await import('@/lib/guides');
    const { getAllAnalyses } = await import('@/lib/analysis');
    const { getAllReports } = await import('@/lib/reports');
    const { getAllCurations } = await import('@/lib/curation');

    const posts = getSortedPostsData();
    const trends = getAllTrends();
    const guides = getAllGuides();
    const analyses = getAllAnalyses();
    const reports = getAllReports();
    const curations = getAllCurations();

    let params: { slug: string }[] = [];

    posts.forEach((post) => params.push({ slug: String(post.id) }));
    trends.forEach((trend) => params.push({ slug: trend.slug }));
    guides.forEach((guide) => params.push({ slug: guide.slug }));
    analyses.forEach((item) => params.push({ slug: item.slug }));
    reports.forEach((item) => params.push({ slug: item.slug }));
    curations.forEach((item) => params.push({ slug: item.slug }));

    if (params.length === 0) {
      return [{ slug: 'placeholder' }];
    }

    return params;
  } catch (error) {
    console.error('❌ Error in generateStaticParams:', error);
    return [{ slug: 'placeholder' }];
  }
}