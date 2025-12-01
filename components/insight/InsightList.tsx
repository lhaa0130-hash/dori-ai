"use client";

import { useState } from "react";
import InsightCard, { InsightItem } from "./InsightCard";
import { TEXTS } from "@/constants/texts";

// 📌 더미 데이터 (InsightItem 타입 준수)
const INSIGHT_DATA: InsightItem[] = [
  { id: 1, title: "AI 시대에 반드시 알아야 할 핵심 개념 10가지", summary: "LLM, RAG, Fine-tuning 등 쏟아지는 AI 용어, 초보자도 이해하기 쉽게 정리했습니다.", category: "개념", tags: ["기초", "용어"], likes: 120, date: "2024-03-20" },
  { id: 2, title: "2024 생성형 AI 트렌드 리포트", summary: "텍스트를 넘어 비디오와 오디오로. 멀티모달 시대의 도래와 비즈니스 기회.", category: "트렌드", tags: ["Trend", "MultiModal"], likes: 245, date: "2024-03-18" },
  { id: 3, title: "AI로 수익화하는 실전 가이드 7선", summary: "단순한 사용을 넘어 실제 돈을 버는 파이프라인 구축 방법.", category: "수익", tags: ["Monetization", "SideProject"], likes: 189, date: "2024-03-15" },
  { id: 4, title: "RAG(검색 증강 생성) 기술의 미래", summary: "할루시네이션을 줄이고 정확도를 높이는 RAG 기술의 원리와 전망.", category: "분석", tags: ["Tech", "RAG"], likes: 98, date: "2024-03-10" },
  { id: 5, title: "프롬프트 엔지니어링: 제로샷 vs 퓨샷", summary: "AI에게 원하는 대답을 듣기 위한 프롬프트 작성의 정석.", category: "개념", tags: ["Prompt", "Skill"], likes: 156, date: "2024-03-05" },
  { id: 6, title: "Sora가 영상 업계에 미칠 영향", summary: "OpenAI의 Sora 공개 이후 영상 제작 시장의 변화 예측.", category: "분석", tags: ["Video", "Sora"], likes: 312, date: "2024-02-28" },
  { id: 7, title: "노코드 툴과 AI의 결합 (n8n, Make)", summary: "코딩 없이 나만의 AI 비서를 만드는 자동화 워크플로우.", category: "기타", tags: ["Automation", "NoCode"], likes: 134, date: "2024-02-20" },
  { id: 8, title: "오픈소스 LLM vs 상용 LLM 비교", summary: "Llama 3와 GPT-4, 내 프로젝트엔 어떤 모델이 적합할까?", category: "분석", tags: ["LLM", "OpenSource"], likes: 88, date: "2024-02-15" },
  { id: 9, title: "AI 저작권 문제, 어디까지 왔나?", summary: "생성형 AI 결과물의 저작권 인정 여부와 법적 쟁점 정리.", category: "트렌드", tags: ["Law", "Copyright"], likes: 210, date: "2024-02-10" },
];

interface InsightListProps {
  filters: {
    category: string;
    tag: string | null;
    sort: string;
  };
  setFilters: (newFilters: any) => void;
}

export default function InsightList({ filters, setFilters }: InsightListProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  // 🏷️ 태그 클릭 핸들러 (필터 상태 업데이트)
  const handleTagClick = (tag: string) => {
    setFilters({ ...filters, tag });
    // 태그 클릭 시 스크롤을 살짝 올려주는 UX 고려 가능
  };

  // 🔍 필터링 & 정렬 로직
  const filteredData = INSIGHT_DATA.filter((item) => {
    const matchCategory = filters.category === "All" || item.category === filters.category;
    const matchTag = filters.tag === null || item.tags.includes(filters.tag);
    return matchCategory && matchTag;
  }).sort((a, b) => {
    if (filters.sort === "popular") return b.likes - a.likes; // 인기순 (좋아요)
    // 기본: 최신순 (날짜 내림차순)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div className="w-full">
      {/* 리스트 그리드 */}
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleData.map((item) => (
            <InsightCard 
              key={item.id} 
              item={item} 
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 opacity-60 flex flex-col items-center">
          <div className="text-4xl mb-4">📭</div>
          <p>조건에 맞는 인사이트가 없습니다.</p>
          {filters.tag && (
            <button 
              onClick={() => setFilters({...filters, tag: null})}
              className="mt-4 text-blue-500 hover:underline"
            >
              태그 필터 해제하기
            </button>
          )}
        </div>
      )}

      {/* 더보기 버튼 */}
      {visibleData.length < filteredData.length && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {TEXTS.insight.button.loadMore.ko} +
          </button>
        </div>
      )}
    </div>
  );
}