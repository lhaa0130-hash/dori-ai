"use client";

import { useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import {
  MARKET_CATEGORIES,
  MARKET_PRODUCTS,
  SOURCE_META,
  CATEGORY_EMOJI,
  buildMarketUrl,
  type MarketProduct,
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
        <h3 className="text-[14px] font-extrabold text-neutral-900 dark:text-white leading-tight truncate group-hover:text-[#E8832E] dark:group-hover:text-[#FBAA60] transition-colors">
          {p.name}
        </h3>
        {p.hot && <span className="text-[9px] font-black text-white bg-[#F9954E] rounded-full px-1.5 py-0.5 flex-shrink-0">HOT</span>}
      </div>
      <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed line-clamp-2 break-keep">{p.summary}</p>

      <div className="flex items-center justify-between mt-auto pt-3">
        {p.priceHint
          ? <span className="text-[11px] font-bold text-neutral-400">{p.priceHint}</span>
          : <span />}
        <span className="flex items-center gap-0.5 text-[12px] font-bold text-[#F9954E]">
          보러가기 <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </a>
  );
}

function CategorySection({ catKey }: { catKey: string }) {
  const cat = MARKET_CATEGORIES.find((c) => c.key === catKey);
  if (!cat) return null;
  const items = MARKET_PRODUCTS.filter((p) => p.category === catKey);
  if (items.length === 0) return null;

  return (
    <section className="py-8 border-b border-neutral-100 dark:border-zinc-900 last:border-0">
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[20px] font-extrabold text-neutral-950 dark:text-white tracking-tight leading-tight">
            {cat.emoji} {cat.label}
          </p>
          <p className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-1 break-keep">{cat.desc}</p>
        </div>
        <span className="text-[12px] font-semibold text-neutral-400 flex-shrink-0">{items.length}개</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

export default function MarketClient() {
  const [active, setActive] = useState<string>("all");

  return (
    <main className="w-full min-h-screen">

      {/* 히어로 */}
      <section className="pt-8 pb-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10 mb-4">
          <ShoppingBag className="w-3.5 h-3.5 text-[#F9954E]" />
          <span className="text-[11px] font-bold text-[#F9954E]">DORI 마켓</span>
        </div>
        <h1 className="text-[34px] sm:text-[44px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2 break-keep">
          오늘의 추천 아이템
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-500 leading-relaxed mb-6 break-keep">
          아마존 · 쿠팡 · 알리에서 고른 제품을 카테고리별로 모았어요.
        </p>

        {/* 카테고리 필터 */}
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide border-b border-neutral-100 dark:border-zinc-900">
          <div className="flex gap-2 w-max pb-4">
            <button
              onClick={() => setActive("all")}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                active === "all"
                  ? "bg-neutral-950 dark:bg-white border-neutral-950 dark:border-white text-white dark:text-neutral-950"
                  : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              전체
            </button>
            {MARKET_CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setActive(c.key)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                  active === c.key
                    ? "bg-[#F9954E] border-[#F9954E] text-white"
                    : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 목록 */}
      <section className="pb-16">
        {active === "all"
          ? MARKET_CATEGORIES.map((c) => <CategorySection key={c.key} catKey={c.key} />)
          : <CategorySection catKey={active} />}

        {/* 어필리에이트 고지 */}
        <p className="mt-8 text-[11px] text-neutral-400 dark:text-zinc-600 leading-relaxed break-keep">
          ⚠️ 본 페이지의 링크는 어필리에이트(제휴) 링크로, 구매 시 일정 수수료를 받을 수 있습니다. 표시 가격대는 참고용이며 실제 가격은 각 플랫폼에서 확인해주세요.
        </p>
      </section>
    </main>
  );
}
