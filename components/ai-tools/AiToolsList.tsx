"use client";

import { useState } from "react";
import AiToolsCard, { AiTool } from "./AiToolsCard"; // AiTool 타입 수정 필요 (아래 3-1 참고)
import { TEXTS } from "@/constants/texts";
import { AiMeta } from "@/types/content"; // 👈 추가

// 📌 AiToolsCard.tsx의 AiTool 타입도 수정해야 함 (3-1번 파일 참고)
// 여기서는 데이터만 먼저 수정

const TOOLS_DATA: (AiTool & { aiMeta?: AiMeta })[] = [
  { 
    id: 1, name: "ChatGPT", category: "LLM", description: "OpenAI가 개발한 가장 대중적인 대화형 AI.", website: "https://chat.openai.com", priceType: "부분 유료", rating: 4.9, tags: ["Chat", "Coding", "Writing"],
    aiMeta: { creationType: "ai_generated", tools: ["GPT-4"] } // 예시: 설명문 자체를 AI로 썼다는 컨셉
  },
  { 
    id: 2, name: "Midjourney", category: "Image", description: "예술적인 이미지를 생성하는 최고의 AI 도구.", website: "https://midjourney.com", priceType: "완전 유료", rating: 4.8, tags: ["Art", "High-Quality"],
    aiMeta: { creationType: "human_only" }
  },
  // ... 나머지 데이터는 생략 (기존 유지하거나 추가) ...
  // (파일 길이상 전체 데이터 생략, 기존 데이터에 aiMeta 필드만 추가하면 됨)
  { id: 3, name: "Claude 3", category: "LLM", description: "Anthropic의 안전하고 자연스러운 대화형 AI.", website: "https://claude.ai", priceType: "부분 유료", rating: 4.7, tags: ["Writing", "Analysis"] },
  { id: 4, name: "Runway", category: "Video", description: "텍스트나 이미지로 비디오를 생성하는 AI.", website: "https://runwayml.com", priceType: "부분 유료", rating: 4.6, tags: ["Video", "Editing"] },
  { id: 5, name: "n8n", category: "Automation", description: "워크플로우 자동화를 위한 오픈소스 툴.", website: "https://n8n.io", priceType: "무료", rating: 4.8, tags: ["Workflow", "No-code"] },
  { id: 6, name: "Suno", category: "Audio", description: "누구나 쉽게 고퀄리티 음악을 만드는 AI.", website: "https://suno.ai", priceType: "부분 유료", rating: 4.7, tags: ["Music", "Song"] },
  { id: 7, name: "Perplexity", category: "LLM", description: "실시간 검색 기반의 AI 검색 엔진.", website: "https://perplexity.ai", priceType: "부분 유료", rating: 4.8, tags: ["Search", "Research"] },
  { id: 8, name: "Leonardo.ai", category: "Image", description: "게임 에셋 및 아트 생성에 특화된 AI.", website: "https://leonardo.ai", priceType: "부분 유료", rating: 4.6, tags: ["Game Asset", "Art"] },
  { id: 9, name: "Make", category: "Automation", description: "다양한 앱을 연결하는 시각적 자동화 도구.", website: "https://make.com", priceType: "부분 유료", rating: 4.5, tags: ["Workflow", "Integration"] },
];

interface AiToolsListProps {
  filters: {
    category: string;
    price: string;
    sort: string;
  };
}

export default function AiToolsList({ filters }: AiToolsListProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredTools = TOOLS_DATA.filter((tool) => {
    const matchCat = filters.category === "All" || tool.category === filters.category;
    const matchPrice = filters.price === "All" || tool.priceType === filters.price;
    return matchCat && matchPrice;
  }).sort((a, b) => {
    if (filters.sort === "rating") return b.rating - a.rating;
    if (filters.sort === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const visibleTools = filteredTools.slice(0, visibleCount);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTools.map((tool) => (
          <AiToolsCard key={tool.id} tool={tool} />
        ))}
      </div>
      
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