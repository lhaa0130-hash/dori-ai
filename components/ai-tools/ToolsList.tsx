"use client";

import { useState } from "react";
import ToolCard, { AiTool } from "./ToolCard";
import { TEXTS } from "@/constants/texts";

// 📌 더미 데이터 정의
const TOOLS_DATA: AiTool[] = [
  { id: 1, name: "ChatGPT", category: "LLM", description: "OpenAI가 개발한 가장 대중적인 대화형 AI.", website: "https://chat.openai.com", priceType: "부분 유료", rating: 4.9, tags: ["Chat", "Coding", "Writing"] },
  { id: 2, name: "Midjourney", category: "Image", description: "예술적인 이미지를 생성하는 최고의 AI 도구.", website: "https://midjourney.com", priceType: "완전 유료", rating: 4.8, tags: ["Art", "High-Quality"] },
  { id: 3, name: "Claude 3", category: "LLM", description: "Anthropic의 안전하고 자연스러운 대화형 AI.", website: "https://claude.ai", priceType: "부분 유료", rating: 4.7, tags: ["Writing", "Analysis"] },
  { id: 4, name: "Runway", category: "Video", description: "텍스트나 이미지로 비디오를 생성하는 AI.", website: "https://runwayml.com", priceType: "부분 유료", rating: 4.6, tags: ["Video", "Editing"] },
  { id: 5, name: "n8n", category: "Automation", description: "워크플로우 자동화를 위한 오픈소스 툴.", website: "https://n8n.io", priceType: "무료", rating: 4.8, tags: ["Workflow", "No-code"] },
  { id: 6, name: "Suno", category: "Audio", description: "누구나 쉽게 고퀄리티 음악을 만드는 AI.", website: "https://suno.ai", priceType: "부분 유료", rating: 4.7, tags: ["Music", "Song"] },
  { id: 7, name: "Perplexity", category: "LLM", description: "실시간 검색 기반의 AI 검색 엔진.", website: "https://perplexity.ai", priceType: "부분 유료", rating: 4.8, tags: ["Search", "Research"] },
  { id: 8, name: "Leonardo.ai", category: "Image", description: "게임 에셋 및 아트 생성에 특화된 AI.", website: "https://leonardo.ai", priceType: "부분 유료", rating: 4.6, tags: ["Game Asset", "Art"] },
  { id: 9, name: "Make", category: "Automation", description: "다양한 앱을 연결하는 시각적 자동화 도구.", website: "https://make.com", priceType: "부분 유료", rating: 4.5, tags: ["Workflow", "Integration"] },
];

interface ToolsListProps {
  filters: {
    category: string;
    price: string;
    sort: string;
  };
}

export default function ToolsList({ filters }: ToolsListProps) {
  const [visibleCount, setVisibleCount] = useState(6); // 초기 6개 표시

  // 🔍 필터링 및 정렬 로직
  const filteredTools = TOOLS_DATA.filter((tool) => {
    const matchCat = filters.category === "All" || tool.category === filters.category;
    const matchPrice = filters.price === "All" || tool.priceType === filters.price;
    return matchCat && matchPrice;
  }).sort((a, b) => {
    if (filters.sort === "rating") return b.rating - a.rating; // 평점 내림차순
    if (filters.sort === "name") return a.name.localeCompare(b.name); // 이름 오름차순
    return 0;
  });

  const visibleTools = filteredTools.slice(0, visibleCount);

  return (
    <div className="w-full">
      {/* 툴 리스트 그리드 */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 opacity-60">
          조건에 맞는 툴이 없습니다. 😢
        </div>
      )}

      {/* 더보기 버튼 */}
      {visibleTools.length < filteredTools.length && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {TEXTS.aiTools.button.loadMore.ko} +
          </button>
        </div>
      )}
    </div>
  );
}