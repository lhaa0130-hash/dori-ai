"use client";

import { useState } from "react";
import MarketCard, { MarketProduct } from "./MarketCard";
import { TEXTS } from "@/constants/texts";

// 마켓 데이터 (현재 비어있음)
const MARKET_DATA: MarketProduct[] = [];

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
        <div className="max-w-4xl mx-auto py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DORI-AI 비전 카드 */}
            <div 
              className="p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
              }}
            >
              <div className="text-4xl mb-4">🤖</div>
              <h3 
                className="text-xl font-bold mb-3"
                style={{ color: 'var(--text-main)' }}
              >
                AI 교육 플랫폼
              </h3>
              <p 
                className="text-sm leading-relaxed opacity-80"
                style={{ color: 'var(--text-sub)' }}
              >
                DORI-AI는 AI가 처음인 분들도 쉽게 배우고 성장할 수 있는 교육 플랫폼입니다. 프롬프트 작성부터 자동화 워크플로우까지, 실전 중심의 가이드를 제공합니다.
              </p>
            </div>

            {/* 캐릭터 제작 비전 카드 */}
            <div 
              className="p-8 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--card-border)',
              }}
            >
              <div className="text-4xl mb-4">🎨</div>
              <h3 
                className="text-xl font-bold mb-3"
                style={{ color: 'var(--text-main)' }}
              >
                프레리독 애니메이션
              </h3>
              <p 
                className="text-sm leading-relaxed opacity-80"
                style={{ color: 'var(--text-sub)' }}
              >
                AI를 활용한 캐릭터 제작과 애니메이션 제작 가이드를 제공합니다. 도리 캐릭터를 통해 AI 기반 콘텐츠 제작의 모든 과정을 배울 수 있습니다.
              </p>
            </div>
          </div>
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