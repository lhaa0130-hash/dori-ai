"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowLeft, ShoppingBag } from "lucide-react";
import {
  MARKET_CATEGORIES,
  MARKET_PRODUCTS,
  SOURCE_META,
  CATEGORY_EMOJI,
  buildMarketUrl,
  countByCategory,
  type MarketProduct,
  type MarketCategory,
} from "@/constants/marketData";

function ProductCard({ p }: { p: MarketProduct }) {
  const src = SOURCE_META[p.source];
  return (
    <a
      href={buildMarketUrl(p)}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="group flex flex-col p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 flex items-center justify-center text-[22px] leading-none">
          {p.emoji || CATEGORY_EMOJI[p.category] || "🛍️"}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${src.cls}`}>{src.label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <h3 className="text-[14px] font-extrabold text-neutral-900 dark:text-white leading-tight truncate group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">{p.name}</h3>
        {p.hot && <span className="text-[9px] font-black text-white bg-[#F9954E] rounded-full px-1.5 py-0.5 flex-shrink-0">HOT</span>}
      </div>
      <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2 break-keep">{p.summary}</p>
      <div className="flex items-center justify-between mt-auto pt-3">
        {p.priceHint ? <span className="text-[11px] font-bold text-neutral-400">{p.priceHint}</span> : <span />}
        <span className="flex items-center gap-0.5 text-[12px] font-bold text-[#F9954E]">보러가기 <ArrowUpRight className="w-3.5 h-3.5" /></span>
      </div>
    </a>
  );
}

export default function MarketClient() {
  const [active, setActive] = useState<MarketCategory | null>(null);

  // ── 카테고리 상세 (선택 시) ──
  if (active) {
    const items = MARKET_PRODUCTS.filter((p) => p.category === active.key);
    return (
      <main className="w-full min-h-screen">
        <div className="pt-6">
          <button onClick={() => setActive(null)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-400 hover:text-[#F9954E] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> 전체 카테고리
          </button>
        </div>
        <section className="pt-5 pb-6 border-b border-neutral-100 dark:border-zinc-900">
          <h1 className="text-[30px] sm:text-[40px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-1">
            {active.emoji} {active.label}
          </h1>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-500 break-keep">{active.desc}</p>
        </section>

        <section className="py-6 pb-20">
          {items.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-3xl mb-3">🛒</p>
              <p className="text-[15px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">곧 추천 제품을 올릴게요</p>
              <p className="text-[13px] text-neutral-400">아마존·쿠팡·알리에서 엄선한 {active.label} 아이템을 준비 중이에요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {items.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </section>
      </main>
    );
  }

  // ── 카테고리 디렉토리 (기본) ──
  return (
    <main className="w-full min-h-screen">
      <section className="pt-8 pb-6 border-b border-neutral-100 dark:border-zinc-900">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 mb-4">
          <ShoppingBag className="w-3.5 h-3.5 text-[#F9954E]" />
          <span className="text-[11px] font-bold text-[#F9954E]">DORI 마켓</span>
        </div>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          무엇을 찾고 있나요?
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-500 leading-relaxed break-keep">
          제품군을 골라보세요. 아마존·쿠팡·알리에서 하나씩 엄선한 추천 아이템을 올려드려요.
        </p>
      </section>

      <section className="py-6 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MARKET_CATEGORIES.map((c) => {
            const n = countByCategory(c.key);
            return (
              <button
                key={c.key}
                onClick={() => setActive(c)}
                className="group text-left flex flex-col p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-[#F9954E]/40 hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-200 min-h-[128px]"
              >
                <span className="text-[30px] leading-none mb-3">{c.emoji}</span>
                <span className="text-[15px] font-extrabold text-neutral-900 dark:text-white group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">{c.label}</span>
                <span className="text-[12px] text-neutral-400 dark:text-neutral-500 mt-0.5 leading-snug break-keep line-clamp-2">{c.desc}</span>
                <span className="mt-auto pt-3 text-[11px] font-bold text-neutral-300 dark:text-zinc-600">
                  {n > 0 ? `${n}개 추천` : "준비 중"}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-[11px] text-neutral-400 dark:text-zinc-600 leading-relaxed break-keep">
          ⚠️ 마켓의 제품 링크는 어필리에이트(제휴) 링크로, 구매 시 일정 수수료를 받을 수 있습니다.
        </p>
      </section>
    </main>
  );
}
