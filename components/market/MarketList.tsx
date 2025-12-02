"use client";

import { useState } from "react";
import MarketCard, { MarketProduct } from "./MarketCard";
import { TEXTS } from "@/constants/texts";

// 📌 더미 데이터
const MARKET_DATA: MarketProduct[] = [
  { id: "1", title: "블로그용 GPT 프롬프트 패키지", description: "SEO 최적화된 블로그 글쓰기를 위한 프롬프트 모음집입니다.", type: "프롬프트", priceLabel: "₩9,900", isFree: false, rating: 4.8, tags: ["GPT", "Blog", "SEO"] },
  { id: "2", title: "유튜브 썸네일 이미지 번들", description: "클릭률을 높이는 고퀄리티 AI 이미지 소스 50종.", type: "이미지", priceLabel: "무료", isFree: true, rating: 4.5, tags: ["YouTube", "Thumbnail"] },
  { id: "3", title: "Pika 영상 생성 프리셋", description: "영화 같은 연출을 위한 Pika 카메라 무빙 프리셋.", type: "영상", priceLabel: "₩15,000", isFree: false, rating: 4.9, tags: ["Pika", "Video", "Preset"] },
  { id: "4", title: "n8n 자동화 워크플로우 스타터 킷", description: "이메일 마케팅 자동화를 위한 n8n 템플릿.", type: "워크플로우", priceLabel: "무료", isFree: true, rating: 4.7, tags: ["n8n", "Automation"] },
  { id: "5", title: "노션 AI 업무 템플릿", description: "회의록 요약 및 일정 관리를 위한 노션 템플릿.", type: "템플릿", priceLabel: "₩5,000", isFree: false, rating: 4.6, tags: ["Notion", "Productivity"] },
  { id: "6", title: "미드저니 실사 스타일 프롬프트", description: "사진 같은 퀄리티를 뽑아내는 미드저니 비법 프롬프트.", type: "프롬프트", priceLabel: "₩12,000", isFree: false, rating: 4.8, tags: ["Midjourney", "Photo"] },
  { id: "7", title: "Suno AI 작곡 가이드북", description: "원하는 장르와 분위기를 완벽하게 구현하는 작곡 팁.", type: "기타", priceLabel: "무료", isFree: true, rating: 4.4, tags: ["Music", "Suno"] },
  { id: "8", title: "상세페이지 디자인 템플릿", description: "스마트스토어용 상세페이지 기획 및 디자인 템플릿.", type: "템플릿", priceLabel: "₩29,000", isFree: false, rating: 4.9, tags: ["Design", "Commerce"] },
  { id: "9", title: "ComfyUI 워크플로우 (인물 보정)", description: "스테이블 디퓨전 ComfyUI 인물 피부 보정 워크플로우.", type: "워크플로우", priceLabel: "₩30,000", isFree: false, rating: 4.7, tags: ["StableDiffusion", "ComfyUI"] },
];

interface MarketListProps {
  filters: {
    category: string;
    price: string;
    sort: string;
  };
}

export default function MarketList({ filters }: MarketListProps) {
  const [visibleCount, setVisibleCount] = useState(6);
  const tButton = TEXTS.aiTools.button; // Load More 버튼 텍스트 재사용

  // 🔍 필터링 & 정렬
  const filteredData = MARKET_DATA.filter((item) => {
    const matchCategory = filters.category === "All" || item.type === filters.category;
    const matchPrice = filters.price === "All" || (filters.price === "free" ? item.isFree : !item.isFree);
    return matchCategory && matchPrice;
  }).sort((a, b) => {
    if (filters.sort === "rating") return b.rating - a.rating;
    if (filters.sort === "name") return a.title.localeCompare(b.title);
    return 0; // 최신순 (기본값, id 역순 가정)
  });

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div className="w-full">
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleData.map((product) => (
            <MarketCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 opacity-60">
          <p>조건에 맞는 상품이 없습니다.</p>
        </div>
      )}

      {visibleData.length < filteredData.length && (
        <div className="flex justify-center mt-12">
          <button 
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-8 py-3 rounded-full font-bold transition-all hover:scale-105 border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)]"
          >
            {tButton.loadMore.ko} +
          </button>
        </div>
      )}
    </div>
  );
}