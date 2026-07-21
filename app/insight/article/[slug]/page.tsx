import { getPostData } from '@/lib/posts';
import { getAllTrends } from '@/lib/trends';
import { getAllCurations } from '@/lib/curation';
import { getAllAnalyses } from '@/lib/analysis';
import { getAllReports } from '@/lib/reports';
import { Suspense } from 'react';
import Header from "@/components/layout/Header";
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import ShareButtons from '@/components/article/ShareButtons';
import ReadingProgress from '@/components/article/ReadingProgress';
import RelatedArticles from '@/components/article/RelatedArticles';
import ArticleSocial from '@/components/article/ArticleSocial';
import AdminArticleBar from '@/components/admin/AdminArticleBar';
import fs from 'fs';
import path from 'path';

// slug → 로컬 마크다운 파일 원본 읽기
function getRawMarkdown(slug: string): string {
  const candidates = [
    path.join(process.cwd(), 'content/trend', `${slug}.md`),
    path.join(process.cwd(), 'content/analysis', `${slug}.md`),
    path.join(process.cwd(), 'content/curation', `${slug}.md`),
    path.join(process.cwd(), 'content/reports', `${slug}.md`),
    path.join(process.cwd(), 'content/studio', `${slug}.md`),
    path.join(process.cwd(), 'content/market', `${slug}.md`),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  }
  return '';
}

// 영어판(-en) 존재 여부 — 있을 때만 hreflang 상호 연결(없는 URL 가리키지 않게)
function hasEnglishVersion(slug: string): boolean {
  const s = `${slug}-en`;
  return [
    path.join(process.cwd(), 'content/analysis', `${s}.md`),
    path.join(process.cwd(), 'content/curation', `${s}.md`),
    path.join(process.cwd(), 'content/reports', `${s}.md`),
    path.join(process.cwd(), 'content/guides', `${s}.md`),
  ].some((p) => fs.existsSync(p));
}

const SITE_URL = "https://illo.im";

// ✅ 아티클별 개별 메타데이터 생성 (SEO 핵심)
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const post = await getPostData(params.slug);
    const title = post.title || "illo 인사이트";
    const description = post.summary || post.description || `${title} - illo에서 최신 AI 트렌드와 인사이트를 확인하세요.`;
    const image = post.thumbnail_url || `${SITE_URL}/og-default.png`;
    const url = `${SITE_URL}/insight/article/${params.slug}`;
    const tags = post.tags || [];

    // ⚠️ 트렌드 기사 색인 경계: 사실 근거 규칙(2026-07) 이전 구버전(≤189번)은 허구 통계·
    //    가짜 인용 위험 → 임시 noindex(follow 유지). 190번부터는 고쳐진 봇의 근거 기반 기사 →
    //    정상 index. 삭제하지 않고 사이트엔 그대로 남김. (봇이 190+ 발행하면 자동 색인)
    const TREND_INDEX_FROM = 190;
    const trendNum = params.slug.startsWith("trend-") ? parseInt(params.slug.slice(6), 10) : NaN;
    const isLegacyTrend = Number.isFinite(trendNum) && trendNum < TREND_INDEX_FROM;
    // 개별 기사 frontmatter에 noindex:true 를 달면 그 글만 색인 제외(허구 통계 등 개별 대응).
    const flaggedNoindex = post.noindex === true || post.noindex === "true";
    const noIndexThis = isLegacyTrend || flaggedNoindex;

    return {
      title: `${title} | illo`,
      description,
      keywords: ["AI 트렌드", "인공지능", "illo", "AI 인사이트", ...tags].join(", "),
      ...(noIndexThis ? { robots: { index: false, follow: true } } : {}),
      alternates: {
        canonical: url,
        ...(hasEnglishVersion(params.slug)
          ? { languages: { "ko-KR": url, en: `${SITE_URL}/en/insight/article/${params.slug}-en`, "x-default": url } }
          : {}),
      },
      openGraph: {
        title: `${title} | illo`,
        description,
        url,
        siteName: "illo",
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        locale: "ko_KR",
        type: "article",
        publishedTime: post.date,
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | illo`,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "illo 인사이트",
      description: "AI 트렌드와 인사이트를 확인하세요.",
    };
  }
}

export default async function InsightArticlePage({ params }: { params: { slug: string } }) {
  let post;
  const rawMarkdown = getRawMarkdown(params.slug);
  const videoId = (rawMarkdown.match(/^videoId:\s*([\w-]+)/m) || [])[1] || '';

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

  // 연관 기사용 — 트렌드·큐레이션·분석·리포트 전체 교차 추천(내부링크 강화·색인 촉진)
  const safe = (fn: () => any[]) => { try { return fn() || []; } catch { return []; } };
  const allPosts = [
    ...safe(getAllTrends),
    ...safe(getAllCurations),
    ...safe(getAllAnalyses),
    ...safe(getAllReports),
  ].map((p: any) => ({
    slug: p.slug,
    title: p.title,
    thumbnail: p.thumbnail || p.thumbnail_url,
    date: p.date,
    tags: p.tags,
  }));
  const articleUrl = `${SITE_URL}/insight/article/${params.slug}`;
  const postTags: string[] = Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : []);

  // ✅ JSON-LD 구조화 데이터 (NewsArticle — 구글 뉴스·Discover·리치결과)
  const SECTION: Record<string, string> = { trend: "AI 트렌드", curation: "AI 큐레이션", analysis: "심층 분석", report: "리포트", market: "마켓", studio: "스튜디오" };
  const articleSection = SECTION[String(params.slug).split("-")[0]] || "인사이트";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.summary || post.description || post.title,
    "image": [post.thumbnail_url || `${SITE_URL}/og-default.png`],
    "datePublished": post.date,
    "dateModified": post.date,
    "author": { "@type": "Organization", "name": "illo", "url": SITE_URL },
    "publisher": {
      "@type": "Organization",
      "name": "illo",
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon.svg`, "width": 512, "height": 512 },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": articleUrl },
    "articleSection": articleSection,
    "isAccessibleForFree": true,
    ...(postTags.length > 0 ? { "keywords": postTags.join(", ") } : {}),
  };

  // ✅ BreadcrumbList (구글 검색결과에 경로 노출 → 클릭률↑)
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "홈", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "AI 인사이트", "item": `${SITE_URL}/insight` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": articleUrl },
    ],
  };

  // 마크다운 → HTML 변환 (next-mdx-remote/rsc 대신 remark 사용 — 정적 export 호환)
  const contentHtml = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(post.content || '')
    .then((f) => String(f));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* 읽기 진행 바 (상단 고정) */}
      <ReadingProgress />

      <main style={{ minHeight: '100vh', paddingTop: '70px' }}>
        <Header />
        <article className="max-w-4xl mx-auto p-4 md:p-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">
            {post.title}
          </h1>
          {post.thumbnail_url && (videoId ? (
            <a href={"https://www.youtube.com/watch?v=" + videoId} target="_blank" rel="noopener noreferrer" aria-label="영상 보기" className="block mb-8 rounded-lg overflow-hidden relative w-full h-[400px] group">
              <Image src={post.thumbnail_url} alt={post.title || '썸네일 이미지'} fill style={{ objectFit: 'cover' }} priority />
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <span className="flex items-center justify-center w-16 h-16 rounded-full bg-red-600 text-white text-2xl shadow-lg">▶</span>
              </span>
            </a>
          ) : (
            <div className="mb-8 rounded-lg overflow-hidden relative w-full h-[400px]">
              <Image src={post.thumbnail_url} alt={post.title || '썸네일 이미지'} fill style={{ objectFit: 'cover' }} priority />
            </div>
          ))}
          <div className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              {/T\d|\d{1,2}:\d{2}/.test(String(post.date)) && (
                <span className="ml-1 text-xs opacity-60">{new Date(post.date).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </time>
            {post.author && <span> by {post.author}</span>}
          </div>

          {/* 소셜 공유 버튼 */}
          <div className="flex justify-center mb-8">
            <ShareButtons url={articleUrl} title={post.title || 'illo 기사'} />
          </div>

          {/* 기사 본문 */}
          <div
            className="prose-premium max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* 하단 공유 버튼 */}
          <div className="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800">
            <ShareButtons url={articleUrl} title={post.title || 'illo 기사'} />
          </div>

          {/* 좋아요 + 댓글 (댓글은 로그인 필수) */}
          <ArticleSocial slug={params.slug} title={post.title || params.slug} />

          {/* 연관 기사 추천 */}
          <RelatedArticles
            currentSlug={params.slug}
            currentTags={postTags}
            allPosts={allPosts}
          />
        </article>
      </main>

      {/* 관리자 전용 편집/삭제 바 */}
      <AdminArticleBar
        slug={params.slug}
        title={post.title || params.slug}
      />
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
    const { getAllStudios } = await import('@/lib/studio');
    const { getAllMarketPosts } = await import('@/lib/market-posts');

    const posts = getSortedPostsData();
    const trends = getAllTrends();
    const guides = getAllGuides();
    const analyses = getAllAnalyses();
    const reports = getAllReports();
    const curations = getAllCurations();
    const studios = getAllStudios();
    const marketPosts = getAllMarketPosts();

    let params: { slug: string }[] = [];

    // 영어(lang:en) 콘텐츠는 /en/insight 전용 — 한글 라우트에서 제외(중복 색인 방지)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isKo = (p: any) => ((p?.lang as string) || "ko") !== "en";

    posts.forEach((post) => params.push({ slug: String(post.id) }));
    trends.filter(isKo).forEach((trend) => params.push({ slug: trend.slug }));
    guides.filter(isKo).forEach((guide) => params.push({ slug: guide.slug }));
    analyses.filter(isKo).forEach((item) => params.push({ slug: item.slug }));
    reports.filter(isKo).forEach((item) => params.push({ slug: item.slug }));
    curations.filter(isKo).forEach((item) => params.push({ slug: item.slug }));
    studios.forEach((item) => params.push({ slug: item.slug }));
    marketPosts.forEach((item) => params.push({ slug: item.slug }));

    if (params.length === 0) {
      return [{ slug: 'placeholder' }];
    }

    return params;
  } catch (error) {
    console.error('❌ Error in generateStaticParams:', error);
    return [{ slug: 'placeholder' }];
  }
}