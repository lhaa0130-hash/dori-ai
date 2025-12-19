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
    <main className="w-full min-h-screen relative" style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
    }}>
      {/* 다크모드 배경 효과 */}
      {mounted && theme === "dark" && (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <section className="relative pt-4 pb-2 px-6 text-center overflow-hidden" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-2 tracking-tight leading-tight"
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            {t.heroTitle.ko}
          </h1>
          <p 
            className="text-lg md:text-xl font-medium opacity-70 break-keep"
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>
      
      <section className="container max-w-6xl mx-auto px-4 pb-24 relative" style={{ zIndex: 1 }}>
        <InsightFilters filters={filters} setFilters={setFilters} />
        
        {/* 👇 리스트에 데이터 전달 */}
        <InsightList filters={filters} setFilters={setFilters} posts={postsToDisplay} />
        
      </section>
    </main>
  );
}