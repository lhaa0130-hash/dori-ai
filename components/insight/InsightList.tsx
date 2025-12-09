"use client";

import { useState } from "react";
import Link from "next/link";
import InsightCard from "./InsightCard";
import { TEXTS } from "@/constants/texts";
// 👇 [중요] 내부에 데이터를 적지 않고, 아까 만든 데이터 파일에서 불러옵니다.
import { INSIGHT_DATA } from "@/constants/insightData"; 

interface InsightListProps {
  filters: { category: string; tag: string | null; sort: string; };
  setFilters: (newFilters: any) => void;
}

export default function InsightList({ filters, setFilters }: InsightListProps) {
  const [visibleCount, setVisibleCount] = useState(6);
  const handleTagClick = (tag: string) => setFilters({ ...filters, tag });

  // 🔍 필터링 & 정렬 로직
  // (이제 INSIGHT_DATA는 외부 파일에서 가져온 것을 씁니다)
  const filteredData = INSIGHT_DATA.filter((item) => {
    const matchCategory = filters.category === "All" || item.category === filters.category;
    const matchTag = filters.tag === null || item.tags.includes(filters.tag);
    return matchCategory && matchTag;
  }).sort((a, b) => {
    if (filters.sort === "popular") return b.likes - a.likes;
    // 최신순 정렬
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div className="w-full">
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleData.map((item) => (
            // 👇 클릭하면 상세 페이지(/insight/아이디)로 이동
            <Link key={item.id} href={`/insight/${item.id}`} className="block group">
              <InsightCard item={item} onTagClick={handleTagClick} />
            </Link>
          ))}
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

      {/* 더보기 버튼 */}
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