"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import InsightFilters from "@/components/insight/InsightFilters";
import InsightList from "@/components/insight/InsightList";
import { TEXTS } from "@/constants/texts";
import { InsightItem } from "@/types/content";

// 📌 [비상용] 파일이 없을 때 보여줄 임시 데이터
const FALLBACK_POSTS: InsightItem[] = [
  {
    id: 999,
    title: "📢 게시글을 불러오지 못했습니다.",
    summary: "posts 폴더에 .md 파일이 없거나, 서버가 파일을 찾지 못했습니다. 터미널을 껐다가 다시 켜보세요!",
    category: "기타", // 있는 카테고리 중 하나여야 함
    tags: ["System", "Check"],
    likes: 0,
    date: new Date().toISOString(),
    content: "<p>폴더 위치를 다시 확인해주세요: 프로젝트최상위/posts/insight/...</p>",
    aiMeta: { creationType: "human_only" }
  }
];

export default function InsightClient({ initialPosts }: { initialPosts: InsightItem[] }) {
  const t = TEXTS.insight;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<{ category: string; tag: string | null; sort: string }>({
    category: "All",
    tag: null,
    sort: "newest",
  });

  useEffect(() => setMounted(true), []);

  // 1. 받아온 데이터가 있으면 그거 쓰고, 없으면 비상용 데이터 사용
  const postsToDisplay = (initialPosts && initialPosts.length > 0) 
    ? initialPosts 
    : FALLBACK_POSTS;

  const isDark = mounted && theme === 'dark';

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
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
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>
      
      {/* 메인 콘텐츠 */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-24 relative">
        <InsightFilters filters={filters} setFilters={setFilters} />
        
        {/* 👇 리스트에 데이터 전달 */}
        <InsightList filters={filters} setFilters={setFilters} posts={postsToDisplay} />
      </section>

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