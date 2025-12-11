import { getPostData, getSortedPostsData } from "@/lib/posts";
import { AiBadge } from "@/components/common/AiBadge";
import { notFound } from "next/navigation";
import Link from "next/link";

// 정적 경로 생성 (빌드 최적화)
export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    id: post.id.toString(),
  }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InsightDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    // 👇 이제 폴더가 어디에 있든 ID만 맞으면 찾아옵니다.
    const post = await getPostData(id);

    // 🎨 스타일 정의 (다크모드/라이트모드 강제 적용)
    const pageStyle = {
      backgroundColor: 'var(--bg-main)', 
      color: 'var(--text-main)',         
    };

    return (
      <main 
        className="w-full min-h-screen pt-32 pb-24 px-6 transition-colors duration-300"
        style={pageStyle} 
      >
        <article className="max-w-3xl mx-auto">
          
          <header className="mb-12 pb-8 border-b border-[var(--card-border)]">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 text-xs font-bold uppercase tracking-wide border border-purple-200 dark:border-purple-800">
                {post.category}
              </span>
              <span className="text-sm opacity-60 font-medium">
                {new Date(post.date).toLocaleDateString()}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight break-keep tracking-tight" style={{ color: 'var(--text-main)' }}>
              {post.title}
            </h1>
  
            <div className="flex items-center justify-between">
              <AiBadge aiMeta={post.aiMeta} />
              <div className="flex items-center gap-2 text-sm opacity-60 font-medium">
                <span>❤️ {post.likes}명이 좋아함</span>
              </div>
            </div>
          </header>
  
          {/* 본문 영역 (HTML) */}
          <div 
            className="
              prose prose-lg max-w-none
              dark:prose-invert
              
              prose-headings:text-[var(--text-main)]
              prose-p:text-[var(--text-main)] prose-p:opacity-90
              prose-strong:text-[var(--text-main)]
              prose-li:text-[var(--text-main)]
              
              /* 스타일 디테일 */
              prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-10 prose-img:border prose-img:border-[var(--card-border)]
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-hr:border-[var(--card-border)] prose-hr:my-12
            "
            dangerouslySetInnerHTML={{ __html: post.contentHtml }} 
          />
  
          <div className="mt-24 pt-10 border-t border-[var(--card-border)] flex justify-center">
            <Link 
              href="/insight" 
              className="px-8 py-4 rounded-full border hover:opacity-70 transition-all text-sm font-bold shadow-sm"
              style={{ 
                borderColor: 'var(--card-border)',
                color: 'var(--text-main)',
                backgroundColor: 'var(--card-bg)'
              }}
            >
              ← 목록으로 돌아가기
            </Link>
          </div>
  
        </article>
      </main>
    );
  } catch (error) {
    // 파일을 못 찾으면 404
    return notFound();
  }
}