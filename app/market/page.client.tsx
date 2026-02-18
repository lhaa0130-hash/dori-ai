"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { TEXTS } from "@/constants/texts";
import MarketList from "@/components/market/MarketList";
import MarketRequestForm from "@/components/market/MarketRequestForm";
import { ShoppingBag, PenTool } from "lucide-react";

export default function MarketClient() {
  const t = TEXTS.market;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'request'>('products'); // 탭 상태 관리

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  return (
    <main
      className="w-full min-h-screen relative overflow-x-hidden bg-white dark:bg-black transition-colors duration-500"
      style={{
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 배경 그라데이션 (Standard) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      {/* 히어로 섹션 (Standard) */}
      <section className="relative pt-32 pb-12 px-6 text-center z-10">
        <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-orange-950/30 border border-[#FDD5A5] dark:border-[#B35E15] text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold mb-6">
            <ShoppingBag className="w-3 h-3" />
            <span>Marketplace</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-[#F9954E] via-[#FBAA60] to-[#F9954E] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              {t.heroTitle.ko}
            </span>
          </h1>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>

      {/* 탭 네비게이션 */}
      <section className="container max-w-5xl mx-auto px-6 mb-12 relative z-10">
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

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .animate-gradient {
          animation: gradientFlow 3s linear infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}