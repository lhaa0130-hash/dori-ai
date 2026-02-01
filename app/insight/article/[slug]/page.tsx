import { getPostData } from '@/lib/posts';
import { Suspense } from 'react';
import Header from "@/components/layout/Header"; // Header 컴포넌트 임포트
import Image from 'next/image'; // Image 컴포넌트 임포트
import { useTheme } from 'next-themes'; // useTheme 훅 임포트
import { MDXRemote } from 'next-mdx-remote'; // MDXRemote 임포트
import { serialize } from 'next-mdx-remote/serialize'; // serialize 임포트
import rehypeHighlight from 'rehype-highlight'; // 코드 하이라이팅 플러그인 임포트
import rehypeSlug from 'rehype-slug'; // 제목에 id를 붙여주는 플러그인
import rehypeAutolinkHeadings from 'rehype-autolink-headings'; // 제목에 링크를 붙여주는 플러그인
import remarkGfm from 'remark-gfm'; // GFM (GitHub Flavored Markdown) 지원

export default async function InsightArticlePage({ params }: { params: { slug: string } }) {
  let post;
  let mdxSource;

  try {
    // getPostData는 id(slug)를 기반으로 post 데이터를 가져옵니다.
    // contentHtml 필드를 가지고 있습니다.
    post = await getPostData(params.slug);

    // MDXRemote를 사용하여 마크다운을 렌더링하기 위해 contentHtml을 직렬화합니다.
    mdxSource = await serialize(post.contentHtml || post.content || '', {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeHighlight, // 코드 하이라이팅
          rehypeSlug, // Heading에 id 자동 추가
          [rehypeAutolinkHeadings, { behavior: 'wrap' }], // Heading에 링크 자동 추가
        ],
      },
      // scope: post.data, // frontmatter 데이터를 스코프로 전달
    });


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
      if (href.startsWith('/')) {
        return (
          <Link href={href} {...props} />
        );
      }
      return <a href={href} {...props} target="_blank" rel="noopener noreferrer" />;
    },
    // Image 컴포넌트 사용 예시 (Next.js Image 최적화 활용)
    img: ({ src, alt, ...props }: any) => (
      <Image
        src={src}
        alt={alt || ''}
        width={700} // 적절한 width 지정
        height={400} // 적절한 height 지정
        layout="responsive" // 반응형 레이아웃
        {...props}
      />
    ),
    // 커스텀 컴포넌트를 여기에 추가할 수 있습니다.
    // h1: (props: any) => <h1 className="text-3xl font-bold my-4" {...props} />,
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
            <div className="mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.thumbnail_url}
                alt={post.title || '썸네일 이미지'}
                width={1200} // 썸네일에 맞는 적절한 width
                height={600} // 썸네일에 맞는 적절한 height
                layout="responsive"
                objectFit="cover" // 이미지가 컨테이너를 채우도록
              />
            </div>
          )}
          <div className="text-gray-600 dark:text-gray-400 text-sm text-center mb-8">
            <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            {post.author && <span> by {post.author}</span>}
          </div>
          <div className="prose dark:prose-invert max-w-none">
            {/* {post.contentHtml && <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />} */}
            {mdxSource && <MDXRemote {...mdxSource} components={components} />}
          </div>
        </article>
      </main>
    </Suspense>
  );
}

// 동적 라우트 세그먼트를 위한 generateStaticParams 함수
// 이 함수는 빌드 시점에 어떤 slug 값을 미리 렌더링할지 Next.js에 알려줍니다.
export async function generateStaticParams() {
  try {
    const { getSortedPostsData } = await import('@/lib/posts');
    const posts = getSortedPostsData();

    // 빌드 타임 디버깅
    console.log('📝 Found posts for static generation:', posts.length);

    // 포스트가 없으면 fallback 경로 제공
    if (posts.length === 0) {
      console.warn('⚠️ No posts found. Providing fallback params.');
      return [{ slug: 'placeholder' }];
    }

    // 각 포스트의 id를 slug로 사용하여 params 객체 배열을 반환
    return posts.map((post) => ({
      slug: String(post.id),
    }));
  } catch (error) {
    console.error('❌ Error in generateStaticParams:', error);
    // 에러 시에도 fallback 제공
    return [{ slug: 'placeholder' }];
  }
}