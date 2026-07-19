import { getPostData } from '@/lib/posts';
import { getAllGuides } from '@/lib/guides';
import { getAllCurations } from '@/lib/curation';
import { getAllAnalyses } from '@/lib/analysis';
import { getAllReports } from '@/lib/reports';
import { Suspense } from 'react';
import Header from "@/components/layout/Header";
import Image from 'next/image';
import type { Metadata } from 'next';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import ShareButtons from '@/components/article/ShareButtons';
import ReadingProgress from '@/components/article/ReadingProgress';
import RelatedArticles from '@/components/article/RelatedArticles';
import ArticleSocial from '@/components/article/ArticleSocial';
import AdminArticleBar from '@/components/admin/AdminArticleBar';

const SITE_URL = "https://illo.im";

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const post = await getPostData(params.slug);
    const title = (post as any).titleEn || post.title || "illo Insights";
    const description = post.summary || post.description || `${title} - the latest AI trends and insights on illo.`;
    const image = post.thumbnail_url || `${SITE_URL}/og-default.png`;
    const url = `${SITE_URL}/en/insight/article/${params.slug}`;
    const tags = post.tags || [];

    return {
      title: `${title} | illo`,
      description,
      keywords: ["AI trends", "artificial intelligence", "illo", "AI insights", ...tags].join(", "),
      alternates: {
        canonical: url,
        languages: {
          "ko-KR": `${SITE_URL}/insight/article/${params.slug.replace(/-en$/, "")}`,
          en: url,
          "x-default": url,
        },
      },
      openGraph: {
        title: `${title} | illo`,
        description,
        url,
        siteName: "illo",
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        locale: "en_US",
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
      title: "illo Insights",
      description: "Discover the latest AI trends and insights.",
    };
  }
}

export default async function EnInsightArticlePage({ params }: { params: { slug: string } }) {
  let post;
  try {
    post = await getPostData(params.slug);
    if ((post as any).titleEn) post.title = (post as any).titleEn; // 영상 등: 영어 제목으로 표시
    if ((post as any).summaryEn) post.summary = (post as any).summaryEn;
  } catch (error) {
    console.error('Error loading insight article:', error);
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Article not found.</h1>
        <p>The article you requested doesn&apos;t exist or couldn&apos;t be loaded.</p>
      </div>
    );
  }

  // 연관 기사 — 영어 콘텐츠끼리 교차 추천(내부링크·색인 강화)
  const safe = (fn: () => any[]) => { try { return fn() || []; } catch { return []; } };
  const isEn = (p: any) => p?.lang === 'en';
  const allPosts = [
    ...safe(getAllCurations),
    ...safe(getAllAnalyses),
    ...safe(getAllReports),
    ...safe(getAllGuides),
  ].filter(isEn).map((p: any) => ({
    slug: p.slug,
    title: p.title,
    thumbnail: p.thumbnail || p.thumbnail_url,
    date: p.date,
    tags: p.tags,
  }));
  const articleUrl = `${SITE_URL}/en/insight/article/${params.slug}`;
  const postTags: string[] = Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "description": post.summary || post.description || post.title,
    "image": [post.thumbnail_url || `${SITE_URL}/og-default.png`],
    "datePublished": post.date,
    "dateModified": post.date,
    "inLanguage": "en",
    "author": { "@type": "Organization", "name": "illo", "url": SITE_URL },
    "publisher": {
      "@type": "Organization",
      "name": "illo",
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon.svg`, "width": 512, "height": 512 },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": articleUrl },
    "isAccessibleForFree": true,
    ...(postTags.length > 0 ? { "keywords": postTags.join(", ") } : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/en` },
      { "@type": "ListItem", "position": 2, "name": "AI Insights", "item": `${SITE_URL}/en/insight` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": articleUrl },
    ],
  };

  const contentHtml = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(post.content || '')
    .then((f) => String(f));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ReadingProgress />

      <main style={{ minHeight: '100vh', paddingTop: '70px' }}>
        <Header />
        <article className="max-w-4xl mx-auto p-4 md:p-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">
            {post.title}
          </h1>
          {post.thumbnail_url && (
            <div className="mb-8 rounded-lg overflow-hidden relative w-full h-[400px]">
              <Image src={post.thumbnail_url} alt={post.title || 'thumbnail'} fill style={{ objectFit: 'cover' }} priority />
            </div>
          )}
          <div className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            {post.author && <span> by {post.author}</span>}
          </div>

          <div className="flex justify-center mb-8">
            <ShareButtons url={articleUrl} title={post.title || 'illo article'} />
          </div>

          <div className="prose-premium max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />

          <div className="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800">
            <ShareButtons url={articleUrl} title={post.title || 'illo article'} />
          </div>

          <ArticleSocial slug={params.slug} title={post.title || params.slug} locale="en" />

          <RelatedArticles currentSlug={params.slug} currentTags={postTags} allPosts={allPosts} locale="en" />
        </article>
      </main>

      <AdminArticleBar slug={params.slug} title={post.title || params.slug} />
    </Suspense>
  );
}

// 영어(lang:en) 콘텐츠만 정적 생성 — 트렌드는 영어 미생성이라 제외
export async function generateStaticParams() {
  try {
    const { getAllGuides } = await import('@/lib/guides');
    const { getAllAnalyses } = await import('@/lib/analysis');
    const { getAllReports } = await import('@/lib/reports');
    const { getAllCurations } = await import('@/lib/curation');

    // ⚠️영어 기사 라우트는 영어로 쓴 글만 — 영상·트렌드 제외(사용자 방침)
    const isEn = (p: any) => p?.lang === 'en' && p?.category !== '영상';
    const params: { slug: string }[] = [];
    [
      ...getAllGuides().filter(isEn),
      ...getAllAnalyses().filter(isEn),
      ...getAllReports().filter(isEn),
      ...getAllCurations().filter(isEn),
    ].forEach((item) => params.push({ slug: item.slug }));

    if (params.length === 0) return [{ slug: 'placeholder' }];
    return params;
  } catch (error) {
    console.error('❌ Error in EN generateStaticParams:', error);
    return [{ slug: 'placeholder' }];
  }
}
