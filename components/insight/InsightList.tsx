"use client";

import { useState } from "react";
import Link from "next/link";
import InsightCard from "./InsightCard";
import { TEXTS } from "@/constants/texts";
import { InsightItem } from "@/types/content";

// ❌ 기존에 있던 const INSIGHT_DATA = [...] 부분은 삭제했습니다!
// 이제 이 컴포넌트는 오직 '받아온 데이터'만 보여줍니다.

interface InsightListProps {
  filters: { category: string; tag: string | null; sort: string; };
  setFilters: (newFilters: any) => void;
  posts: InsightItem[]; // 👈 부모(Page)에서 읽어온 파일 데이터를 여기서 받습니다.
}

export default function InsightList({ filters, setFilters, posts }: InsightListProps) {
  const [visibleCount, setVisibleCount] = useState(6);
  const handleTagClick = (tag: string) => setFilters({ ...filters, tag });

  // 받아온 posts 데이터를 필터링
  const filteredData = posts.filter((item) => {
    const matchCategory = filters.category === "All" || item.category === filters.category;
    const matchTag = filters.tag === null || item.tags.includes(filters.tag);
    return matchCategory && matchTag;
  }).sort((a, b) => {
    if (filters.sort === "popular") return b.likes - a.likes;
    
    // 가이드 글은 옛날순으로 정렬 (날짜 오름차순)
    if (a.category === '가이드' && b.category === '가이드') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    // 가이드 글은 항상 앞에 배치
    if (a.category === '가이드' && b.category !== '가이드') return -1;
    if (a.category !== '가이드' && b.category === '가이드') return 1;
    
    // 일반 글은 날짜 최신순 (내림차순)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div className="w-full">
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleData.map((item) => {
            // 가이드 글은 /insight/guide/[slug] 경로 사용
            const href = item.category === '가이드' && item.slug 
              ? `/insight/guide/${item.slug}` 
              : `/insight/${item.id}`;
            
            return (
              <Link key={item.id} href={href} className="block group">
                <InsightCard item={item} onTagClick={handleTagClick} />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 opacity-60 flex flex-col items-center">
          <div className="text-4xl mb-4">📭</div>
          <p>조건에 맞는 인사이트가 없습니다.</p>
          {filters.tag && (
            <button onClick={() => setFilters({...filters, tag: null})} className="mt-4 text-blue-500 hover:underline">
              태그 필터 해제하기
            </button>
          )}
        </div>
      )}

      {visibleData.length < filteredData.length && (
        <div className="flex justify-center mt-12">
           <button 
             onClick={() => setVisibleCount(p => p+6)} 
             className="px-8 py-3 rounded-full font-bold transition-all hover:scale-105 border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)]"
           >
             {TEXTS.insight.button.loadMore.ko} +
           </button>
        </div>
      )}
    </div>
  );
}