"use client";

import { useState, useEffect } from "react";
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
  const [filters, setFilters] = useState<{ category: string; tag: string | null; sort: string }>({
    category: "All",
    tag: null,
    sort: "newest",
  });

  // 1. 받아온 데이터가 있으면 그거 쓰고, 없으면 비상용 데이터 사용
  const postsToDisplay = (initialPosts && initialPosts.length > 0) 
    ? initialPosts 
    : FALLBACK_POSTS;

  return (
    <main className="w-full min-h-screen">
      <section className="pt-32 pb-10 px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-main)' }}>{t.heroTitle.ko}</h1>
        <p className="text-lg opacity-70 max-w-2xl mx-auto break-keep" style={{ color: 'var(--text-main)' }}>{t.heroSubtitle.ko}</p>
      </section>
      
      <section className="container max-w-6xl mx-auto px-4 pb-24">
        <InsightFilters filters={filters} setFilters={setFilters} />
        
        {/* 👇 리스트에 데이터 전달 */}
        <InsightList filters={filters} setFilters={setFilters} posts={postsToDisplay} />
        
      </section>
    </main>
  );
}