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