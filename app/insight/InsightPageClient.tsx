"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
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

export default function InsightPageClient({ guides, currentCategory, categories }: InsightPageClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = TEXTS.insight;

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  return (
    <main
      className="w-full min-h-screen relative"
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 다크모드 배경 효과 */}
      {mounted && theme === "dark" && (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <div className="max-w-[1200px] mx-auto relative" style={{ zIndex: 1 }}>
        {/* 헤더 섹션 */}
        <section className="relative pt-4 pb-2 px-6 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
            <h1 
              className="text-4xl md:text-6xl font-extrabold mb-2 tracking-tight leading-tight"
              style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
            >
              {t.heroTitle.en}
            </h1>
            <p 
              className="text-lg md:text-xl font-medium opacity-70 break-keep"
              style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
            >
              {t.heroSubtitle.en}
            </p>
          </div>
        </section>

        {/* 카테고리 탭 */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 px-6 animate-[fadeInUp_0.8s_ease-out_forwards]">
          {categories.map((cat) => {
            const isActive = currentCategory === cat;
            return (
              <Link
                key={cat}
                href={cat === 'All' ? '/insight' : `/insight?category=${cat}`}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200
                  ${isActive 
                    ? 'text-white shadow-lg scale-105' 
                    : 'border'
                  }`}
                style={{
                  backgroundColor: isActive 
                    ? (isDark ? 'rgba(96, 165, 250, 0.3)' : '#2563eb')
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                  borderColor: isActive 
                    ? 'transparent'
                    : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'),
                  color: isActive 
                    ? '#ffffff'
                    : (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'),
                }}
              >
                {cat === 'All' ? '전체' : cat === 'Curation' ? '큐레이션' : cat === 'Report' ? '리포트' : cat === 'Analysis' ? '분석' : cat === 'Guide' ? '가이드' : cat === 'Trend' ? '트렌드' : cat}
              </Link>
            );
          })}
        </div>

        {/* 글 목록 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-6 pb-24">
          {guides.map((post) => (
            <Link 
              key={post.slug} 
              href={`/insight/guide/${post.slug}`}
              className="group flex flex-col h-full rounded-[1.5rem] p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
                boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isDark 
                  ? '0 8px 24px rgba(0, 0, 0, 0.5)' 
                  : '0 8px 24px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = isDark 
                  ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
                  : '0 4px 20px rgba(0, 0, 0, 0.05)';
              }}
            >
              <div className="mb-4">
                 {/* 1. 카테고리 뱃지 */}
                 <div className="mb-3">
                   <span 
                     className="px-3 py-1 rounded-full text-xs font-bold"
                     style={{
                       backgroundColor: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                       color: isDark ? '#60a5fa' : '#2563eb',
                     }}
                   >
                     {post.category}
                   </span>
                 </div>
                 
                 {/* 2. 제목 (title) */}
                 <h2 
                   className="text-2xl font-bold mb-2 transition-colors line-clamp-2"
                   style={{ 
                     color: isDark ? '#ffffff' : '#1d1d1f',
                   }}
                 >
                   {post.title}
                 </h2>
                 
                 {/* 3. 설명 (description) */}
                 <p 
                   className="line-clamp-3 mb-4 flex-grow"
                   style={{ 
                     color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                   }}
                 >
                   {post.description}
                 </p>
              </div>
              
              {/* 4. 날짜 (date) */}
              <div 
                className="pt-6 border-t flex items-center justify-between text-sm"
                style={{
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <span>{post.date}</span>
                <span 
                  className="group-hover:translate-x-1 transition-transform font-semibold"
                  style={{ color: isDark ? '#60a5fa' : '#2563eb' }}
                >
                  Read more →
                </span>
              </div>
            </Link>
          ))}
          
          {guides.length === 0 && (
            <div className="col-span-full text-center py-20">
              <p 
                className="text-xl mb-2"
                style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
              >
                '{currentCategory === 'All' ? '전체' : currentCategory === 'Curation' ? '큐레이션' : currentCategory === 'Report' ? '리포트' : currentCategory === 'Analysis' ? '분석' : currentCategory === 'Guide' ? '가이드' : currentCategory === 'Trend' ? '트렌드' : currentCategory}' 카테고리에 등록된 글이 없습니다.
              </p>
              {currentCategory !== 'All' && (
                <Link 
                  href="/insight" 
                  style={{ 
                    color: isDark ? '#60a5fa' : '#2563eb',
                    textDecoration: 'underline',
                  }}
                >
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

