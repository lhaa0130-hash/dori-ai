import { INSIGHT_DATA } from "@/constants/insightData";
import { AiBadge } from "@/components/common/AiBadge";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateStaticParams() {
  return INSIGHT_DATA.map((item) => ({
    id: item.id.toString(),
  }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InsightDetailPage({ params }: Props) {
  const { id } = await params;
  const post = INSIGHT_DATA.find((p) => p.id.toString() === id);

  if (!post) {
    return notFound();
  }

  return (
    // 1. 메인 배경: 라이트(흰색) / 다크(검정)
    <main className="w-full min-h-screen pt-32 pb-24 px-6 bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      
      <article className="max-w-3xl mx-auto">
        
        {/* 헤더 영역 */}
        <header className="mb-12 pb-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 text-xs font-bold uppercase tracking-wide border border-purple-200 dark:border-purple-800">
              {post.category}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {new Date(post.date).toLocaleDateString()}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight break-keep tracking-tight text-gray-900 dark:text-white">
            {post.title}
          </h1>

          <div className="flex items-center justify-between">
            <AiBadge aiMeta={post.aiMeta} />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <span>❤️ {post.likes}명이 좋아함</span>
            </div>
          </div>
        </header>

        {/* 2. 본문 영역 */}
        <div 
          className="
            prose prose-lg max-w-none
            
            /* 🌞 라이트 모드 기본 텍스트 */
            text-gray-900
            prose-headings:text-gray-900
            prose-p:text-gray-800
            prose-strong:text-gray-900
            prose-li:text-gray-800
            prose-blockquote:text-gray-700
            
            /* 🌙 다크 모드 텍스트 반전 */
            dark:text-gray-100
            dark:prose-invert
            dark:prose-headings:text-white
            dark:prose-p:text-gray-300
            dark:prose-strong:text-white
            dark:prose-li:text-gray-300
            dark:prose-blockquote:text-gray-400
            dark:prose-blockquote:border-gray-700
            
            /* 🚨 [핵심 수정] 내부 HTML 스타일 강제 오버라이딩 (다크모드) 🚨 */
            
            /* (1) 회색 박스(bg-gray-50) -> 다크 그레이(#111)로 변경 */
            dark:[&_.bg-gray-50]:!bg-[#111111] 
            dark:[&_.bg-gray-50]:!border-gray-800
            dark:[&_.bg-gray-50]:!text-gray-200

            /* (2) 파란색 박스(bg-blue-50) -> 어두운 파랑 투명 배경으로 변경 */
            dark:[&_.bg-blue-50]:!bg-blue-950/30
            dark:[&_.bg-blue-50]:!text-blue-100
            
            /* (3) 이미지 테두리 어둡게 */
            dark:[&_img]:!border-gray-800
            
            /* 공통 스타일 디테일 */
            prose-headings:font-bold prose-headings:tracking-tight
            prose-p:leading-8 prose-p:mb-6
            prose-img:rounded-3xl prose-img:shadow-xl prose-img:my-10 prose-img:border prose-img:border-gray-100
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-hr:border-gray-200 dark:prose-hr:border-gray-800 prose-hr:my-12
          "
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        {/* 3. 하단 네비게이션 */}
        <div className="mt-24 pt-10 border-t border-gray-200 dark:border-gray-800 flex justify-center">
          <Link 
            href="/insight" 
            className="px-8 py-4 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-sm font-bold text-gray-900 dark:text-white hover:scale-105 active:scale-95 shadow-sm"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>

      </article>
    </main>
  );
}