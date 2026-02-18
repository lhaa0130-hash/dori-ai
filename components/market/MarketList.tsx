"use client";

import { useState } from "react";
import MarketCard, { MarketProduct } from "./MarketCard";
import { TEXTS } from "@/constants/texts";
import { Plus, ShoppingBag } from "lucide-react";

// 마켓 데이터 (현재 비어있음)
const MARKET_DATA: MarketProduct[] = [];

export default function MarketList() {
  const [visibleCount, setVisibleCount] = useState(6);
  const tButton = TEXTS.aiTools.button;

  // 데이터가 없으므로 필터링 로직 제거하고 바로 빈 배열 사용
  const visibleData = MARKET_DATA.slice(0, visibleCount);

  return (
    <div className="w-full">
      {MARKET_DATA.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleData.map((product) => (
            <MarketCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-20 h-20 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">
            아직 등록된 상품이 없습니다.
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            더 좋은 콘텐츠를 준비 중입니다.<br />
            조금만 기다려주세요!
          </p>
        </div>
      )}

      {visibleData.length < MARKET_DATA.length && (
        <div className="flex justify-center mt-12">
          <button
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all hover:scale-105 border bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-800 text-neutral-900 dark:text-white hover:border-[#F9954E] hover:text-[#F9954E]"
          >
            {tButton.loadMore.ko} <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}