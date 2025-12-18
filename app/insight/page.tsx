import Link from 'next/link';
import { getAllGuides } from '@/lib/guides';

export default async function InsightPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // searchParams를 await하여 category를 안전하게 추출
  const resolvedSearchParams = await searchParams;
  const currentCategory = resolvedSearchParams.category || '전체';
  
  // [중요] getAllGuides()는 동기 함수로 가정하지만, 비동기 데이터 처리 환경에 맞게 준비
  const allGuides = getAllGuides();

  // 5개 고정 카테고리 정의
  const categories = ['전체', '큐레이션', '리포트', '분석', '가이드', '트렌드'];

  // 필터링 로직
  const filteredGuides = currentCategory === '전체'
    ? allGuides
    : allGuides.filter((guide) => guide.category === currentCategory);

  return (
    <main
      className="w-full min-h-screen pt-32 pb-20 px-6 transition-colors duration-300"
      style={{
        backgroundColor: "var(--bg-main)",
        color: "var(--text-main)",
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        
        {/* 헤더 섹션 */}
        <div className="mb-12 text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4"
            style={{ color: "var(--text-main)" }}
          >
            인사이트 <span className="text-blue-600">.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            AI 트렌드와 심층 분석을 만나보세요.
          </p>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 animate-fade-in-up delay-100">
          {categories.map((cat) => {
            const isActive = currentCategory === cat;
            return (
              <Link
                key={cat}
                href={cat === '전체' ? '/insight' : `/insight?category=${cat}`}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        {/* 글 목록 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGuides.map((post) => (
            <Link 
              key={post.slug} 
              href={`/insight/guide/${post.slug}`}
              className="group flex flex-col h-full rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
                bg-white border border-gray-200 
                dark:bg-gray-900 dark:border-gray-800"
            >
              <div className="mb-4">
                 {/* 1. 카테고리 뱃지 */}
                 <div className="mb-3">
                   <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400">
                     {post.category}
                   </span>
                 </div>
                 
                 {/* 2. 제목 (title) */}
                 <h2 className="text-2xl font-bold mb-2 transition-colors line-clamp-2 group-hover:text-blue-600 text-black dark:text-white">
                   {post.title}
                 </h2>
                 
                 {/* 3. 설명 (description) */}
                 <p className="line-clamp-3 mb-4 flex-grow text-gray-600 dark:text-gray-400">
                   {post.description}
                 </p>
              </div>
              
              {/* 4. 날짜 (date) */}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
                <span>{post.date}</span>
                <span className="group-hover:translate-x-1 transition-transform text-blue-600 font-semibold">
                  Read more →
                </span>
              </div>
            </Link>
          ))}
          
          {filteredGuides.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p className="text-xl text-gray-500 mb-2">
                '{currentCategory}' 카테고리에 등록된 글이 없습니다.
              </p>
              {currentCategory !== '전체' && (
                <Link href="/insight" className="text-blue-600 hover:underline font-medium">
                  전체 목록 보기
                </Link>
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}