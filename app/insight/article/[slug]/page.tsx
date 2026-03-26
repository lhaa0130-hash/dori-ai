import { getPostData } from '@/lib/posts';
import { Suspense } from 'react';
import Header from "@/components/layout/Header"; // Header 컴포넌트 임포트
import Image from 'next/image'; // Image 컴포넌트 임포트
import { MDXRemote } from 'next-mdx-remote/rsc'; // MDXRemote (RSC) 임포트
import rehypeHighlight from 'rehype-highlight'; // 코드 하이라이팅 플러그인 임포트
import rehypeSlug from 'rehype-slug'; // 제목에 id를 붙여주는 플러그인
import rehypeAutolinkHeadings from 'rehype-autolink-headings'; // 제목에 링크를 붙여주는 플러그인
import Link from 'next/link'; // Link 컴포넌트 임포트
import remarkGfm from 'remark-gfm'; // GFM (GitHub Flavored Markdown) 지원
import type { Metadata } from 'next';

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

  // Next.js Link 컴포넌트에는 href 속성이 필수입니다.
  const components = {
    // Link 컴포넌트 사용 예시
    a: ({ href, ...props }: any) => {
      if (href && href.startsWith('/')) {
        return (
          <Link href={href} {...props} />
        );
      }
      return <a href={href} {...props} target="_blank" rel="noopener noreferrer" />;
    },
    // Image 컴포넌트 사용 예시 (Next.js Image 최적화 활용)
    img: ({ src, alt, ...props }: any) => (
      <Image
        src={src || ''}
        alt={alt || ''}
        width={700} // 적절한 width 지정
        height={400} // 적절한 height 지정
        style={{ width: '100%', height: 'auto' }} // Responsive style
        {...props}
      />
    ),
  };

  const mdxOptions = {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeHighlight, // 코드 하이라이팅
      rehypeSlug, // Heading에 id 자동 추가
      // [rehypeAutolinkHeadings, { behavior: 'wrap' }], // Heading에 링크 자동 추가 (User requested removal)
    ],
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
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
          <div className="text-gray-600 dark:text-gray-400 text-sm text-center mb-8">
            <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            {post.author && <span> by {post.author}</span>}
          </div>

          {/* Modified: Apply Premium Prose Styles */}
          <div className="prose-premium max-w-none">
            {/* Server Component version of MDXRemote */}
            <MDXRemote
              source={post.content || ''}
              components={components}
              options={{ mdxOptions }}
            />
          </div>
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

    const posts = getSortedPostsData();
    const trends = getAllTrends();
    const guides = getAllGuides();

    // 빌드 타임 디버깅
    console.log('📝 Found posts:', posts.length);
    console.log('📝 Found trends:', trends.length);
    console.log('📝 Found guides:', guides.length);

    let params: { slug: string }[] = [];

    // 1. 일반 포스트 slugs
    if (posts.length > 0) {
      posts.forEach((post) => {
        params.push({ slug: String(post.id) });
      });
    }

    // 2. 트렌드 slugs
    if (trends.length > 0) {
      trends.forEach((trend) => {
        // slug가 있으면 사용, 없으면 id 사용? id가 없으므로 slug 사용
        // 주의: getPostData에서 slug를 어떻게 찾는지 확인 필요
        params.push({ slug: trend.slug });
      });
    }

    // 3. 가이드 slugs
    if (guides.length > 0) {
      guides.forEach((guide) => {
        params.push({ slug: guide.slug });
      });
    }

    // 포스트가 하나도 없으면 fallback 경로 제공 (빌드 에러 방지)
    if (params.length === 0) {
      console.warn('⚠️ No posts/trends/guides found. Providing fallback params.');
      return [{ slug: 'placeholder' }];
    }

    return params;
  } catch (error) {
    console.error('❌ Error in generateStaticParams:', error);
    // 에러 시에도 fallback 제공
    return [{ slug: 'placeholder' }];
  }
}