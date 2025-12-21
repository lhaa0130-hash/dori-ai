"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TEXTS } from "@/constants/texts";

interface Guide {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
}

interface InsightPageClientProps {
  guides: Guide[];
  currentCategory: string;
  categories: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  'Curation': '큐레이션',
  'Report': '리포트',
  'Analysis': '분석',
  'Guide': '가이드',
  'Trend': '트렌드',
};

const SIDEBAR_CATEGORIES = ['Curation', 'Report', 'Analysis', 'Guide', 'Trend'];

export default function InsightPageClient({ guides, currentCategory, categories }: InsightPageClientProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const t = TEXTS.insight;

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  const handleCategoryClick = (cat: string) => {
    router.push(`/insight?category=${cat}`);
  };

  return (
    <main
      className="w-full min-h-screen relative overflow-x-hidden"
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 좌측 사이드바 네비게이션 */}
      <aside 
        className="fixed left-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <nav className="ml-6">
          <div 
            className="flex flex-col gap-3 p-4 rounded-2xl backdrop-blur-xl transition-all duration-500 max-h-[80vh] overflow-y-auto"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            }}
          >
            {/* 각 카테고리 */}
            {SIDEBAR_CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`/insight?category=${cat}`}
                className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: currentCategory === cat 
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick(cat);
                }}
              >
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    currentCategory === cat ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: currentCategory === cat 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                  }}
                />
                <span 
                  className="text-xs font-medium transition-all duration-300"
                  style={{
                    color: currentCategory === cat 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    transform: currentCategory === cat ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </span>
              </a>
            ))}
          </div>
        </nav>
      </aside>

      {/* 우측 빈 사이드바 */}
      <aside 
        className="fixed right-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          width: '140px',
        }}
      />

      {/* 배경 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {mounted && theme === "dark" && (
          <>
            <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
            <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}
        {mounted && theme === "light" && (
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), #ffffff',
            }}
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto relative lg:pl-32">
        {/* 히어로 섹션 */}
        <section className="relative pt-20 pb-12 px-6 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
            <h1 
              className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
              style={{ 
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              {t.heroTitle.ko}
            </h1>
            
            {/* 그라데이션 바 */}
            <div 
              className="w-full max-w-2xl mx-auto h-1 md:h-1.5 mb-6 rounded-full overflow-hidden"
              style={{
                boxShadow: isDark 
                  ? '0 0 30px rgba(96, 165, 250, 0.4), 0 4px 20px rgba(96, 165, 250, 0.2)'
                  : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 15px rgba(37, 99, 235, 0.2)',
              }}
            >
              <div 
                className="h-full rounded-full"
                style={{
                  backgroundImage: isDark
                    ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%, #60a5fa 100%)'
                    : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%, #2563eb 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'gradientFlow 4s linear infinite',
                }}
              />
            </div>

            <p 
              className="text-lg md:text-xl font-medium opacity-70 break-keep leading-relaxed"
              style={{ 
                color: isDark ? '#ffffff' : 'rgba(0, 0, 0, 0.7)',
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              {t.heroSubtitle.ko}
            </p>
          </div>
        </section>

        {/* 글 목록 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 md:px-6 pb-24">
          {guides.map((post) => (
            <Link 
              key={post.slug} 
              href={`/insight/guide/${post.slug}`}
              className="group flex flex-col h-full rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl"
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-main)',
              }}
            >
              {/* 썸네일 이미지 */}
              {post.thumbnail && (
                <div className="mb-5 overflow-hidden rounded-2xl">
                  <img 
                    src={post.thumbnail} 
                    alt={post.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              )}
              
              <div className="mb-5">
                 {/* 1. 카테고리 뱃지 */}
                 <div className="mb-4">
                   <span 
                     className="px-3 py-1 rounded-full text-xs font-bold border"
                     style={{
                       backgroundColor: 'var(--bg-main)',
                       borderColor: 'var(--card-border)',
                       color: 'var(--accent-color)',
                     }}
                   >
                     {post.category}
                   </span>
                 </div>
                 
                 {/* 2. 제목 (title) */}
                 <h2 
                   className="text-xl font-black mb-3 transition-colors line-clamp-2 leading-snug"
                   style={{ 
                     color: 'var(--text-main)',
                   }}
                 >
                   {post.title}
                 </h2>
                 
                 {/* 3. 설명 (description) */}
                 <p 
                   className="text-sm line-clamp-3 mb-5 flex-grow leading-relaxed"
                   style={{ 
                     color: 'var(--text-sub)',
                   }}
                 >
                   {post.description}
                 </p>
              </div>
              
              {/* 4. 하단 */}
              <div 
                className="mt-auto pt-5 border-t border-dashed flex items-center justify-between"
                style={{
                  borderColor: 'var(--card-border)',
                }}
              >
                <span 
                  className="text-xs opacity-60"
                  style={{ 
                    color: 'var(--text-sub)',
                  }}
                >
                  {post.date}
                </span>
                <span 
                  className="text-sm font-semibold transition-all duration-200 group-hover:translate-x-1"
                  style={{ color: 'var(--accent-color)' }}
                >
                  더보기 →
                </span>
              </div>
            </Link>
          ))}
          
          {guides.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p 
                className="text-xl mb-2"
                style={{ color: 'var(--text-sub)' }}
              >
                '{currentCategory === 'Curation' ? '큐레이션' : currentCategory === 'Report' ? '리포트' : currentCategory === 'Analysis' ? '분석' : currentCategory === 'Guide' ? '가이드' : currentCategory === 'Trend' ? '트렌드' : currentCategory}' 카테고리에 등록된 글이 없습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </main>
  );
}

