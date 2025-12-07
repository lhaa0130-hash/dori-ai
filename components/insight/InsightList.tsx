"use client";

import { useState } from "react";
import InsightCard, { InsightItem } from "./InsightCard";
import { TEXTS } from "@/constants/texts";
import { AiMeta } from "@/types/content"; // 👈 추가

// 📌 더미 데이터 (aiMeta 추가)
const INSIGHT_DATA: (InsightItem & { aiMeta?: AiMeta })[] = [
  { 
    id: 1, title: "AI 시대에 반드시 알아야 할 핵심 개념 10가지", summary: "LLM, RAG, Fine-tuning 등 쏟아지는 AI 용어 정리.", category: "가이드", tags: ["기초", "용어"], likes: 0, date: "2024-03-20",
    aiMeta: { creationType: "ai_assisted", tools: ["Claude 3"] } 
  },
  { 
    id: 2, title: "2024 생성형 AI 트렌드 리포트", summary: "텍스트를 넘어 비디오와 오디오로. 멀티모달 시대의 도래.", category: "가이드", tags: ["Trend", "MultiModal"], likes: 0, date: "2024-03-18",
    aiMeta: { creationType: "human_only" }
  },
  // ... 나머지 데이터 생략 (동일 패턴으로 추가 가능) ...
];

// ... (나머지 필터링/정렬 로직 기존 유지) ...
// (지면 관계상 List 컴포넌트 로직은 생략하고, 데이터 구조만 보여드립니다. 기존 코드에 aiMeta 필드만 채우시면 됩니다.)

// 편의를 위해 전체 코드를 드립니다.
interface InsightListProps {
  filters: { category: string; tag: string | null; sort: string; };
  setFilters: (newFilters: any) => void;
}

export default function InsightList({ filters, setFilters }: InsightListProps) {
  const [visibleCount, setVisibleCount] = useState(6);
  const handleTagClick = (tag: string) => setFilters({ ...filters, tag });

  const filteredData = INSIGHT_DATA.filter((item) => {
    const matchCategory = filters.category === "All" || item.category === filters.category;
    const matchTag = filters.tag === null || item.tags.includes(filters.tag);
    return matchCategory && matchTag;
  }).sort((a, b) => {
    if (filters.sort === "popular") return b.likes - a.likes;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div className="w-full">
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleData.map((item) => (
            <InsightCard key={item.id} item={item} onTagClick={handleTagClick} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 opacity-60">📭 조건에 맞는 인사이트가 없습니다.</div>
      )}
      {visibleData.length < filteredData.length && (
        <div className="flex justify-center mt-12">
           <button onClick={() => setVisibleCount(p => p+6)} className="px-8 py-3 border rounded-full font-bold">더보기 +</button>
        </div>
      )}
    </div>
  );
}