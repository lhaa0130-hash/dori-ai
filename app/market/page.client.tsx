"use client";
import { useState } from "react";
import { TEXTS } from "@/constants/texts";
import MarketList from "@/components/market/MarketList";
import MarketRequestForm from "@/components/market/MarketRequestForm";
import { ShoppingBag, PenTool } from "lucide-react";

export default function MarketClient() {
  const t = TEXTS.market;
  const [activeTab, setActiveTab] = useState<'products' | 'request'>('products');

  return (
    <main className="w-full min-h-screen">

      {/* 히어로 */}
      <section className="pt-8 pb-10 border-b border-neutral-100 dark:border-zinc-900">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-3">마켓</p>
        <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
          {t.heroTitle.ko}
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          {t.heroSubtitle.ko}
        </p>
      </section>

      {/* 탭 네비게이션 */}
      <section className="mb-8 pt-6">
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'products'
                ? 'bg-white dark:bg-neutral-800 text-[#F9954E] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {t.section.productsTitle.ko}
            </button>
            <button
              onClick={() => setActiveTab('request')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'request'
                ? 'bg-white dark:bg-neutral-800 text-[#F9954E] shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                }`}
            >
              <PenTool className="w-4 h-4" />
              {t.section.requestTitle.ko}
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="animate-fade-in">
          {activeTab === 'products' && (
            <div className="flex flex-col gap-8">
              <MarketList />
            </div>
          )}

          {activeTab === 'request' && (
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold mb-3 flex items-center justify-center gap-2 text-neutral-900 dark:text-white">
                  🤝 전문가에게 의뢰하기
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  원하는 AI 자료가 없다면? 전문가에게 직접 의뢰해보세요.
                </p>
              </div>
              <MarketRequestForm />
            </div>
          )}
        </div>
      </section>

    </main>
  );
}