"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { TEXTS } from "@/constants/texts";
import MarketFilters from "@/components/market/MarketFilters";
import MarketList from "@/components/market/MarketList";
import MarketRequestForm from "@/components/market/MarketRequestForm";

export default function MarketClient() {
  const t = TEXTS.market;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({ category: "All", price: "All", sort: "newest" });

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  return (
    <main className="w-full min-h-screen relative" style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
    }}>
      {/* 다크모드 배경 효과 */}
      {mounted && theme === "dark" && (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <section className="relative pt-4 pb-2 px-6 text-center overflow-hidden" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-2 tracking-tight leading-tight"
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            {t.heroTitle.ko}
          </h1>
          <p 
            className="text-lg md:text-xl font-medium opacity-70 break-keep"
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>
      <section className="container max-w-6xl mx-auto px-4 pb-24 border-b border-dashed relative" style={{ 
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7',
        zIndex: 1 
      }}>
        <h2 
          className="text-2xl font-bold mb-8 flex items-center gap-2" 
          style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
        >
          🛒 {t.section.productsTitle.ko}
        </h2>
        <MarketFilters filters={filters} setFilters={setFilters} />
        <MarketList filters={filters} />
      </section>
      <section className="container max-w-4xl mx-auto px-4 py-24 relative" style={{ zIndex: 1 }}>
        <div className="text-center mb-10">
          <h2 
            className="text-2xl font-bold mb-2 flex items-center justify-center gap-2" 
            style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
          >
            🤝 {t.section.requestTitle.ko}
          </h2>
          <p 
            className="opacity-70" 
            style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
          >
            원하는 AI 자료가 없다면? 전문가에게 직접 의뢰해보세요.
          </p>
        </div>
        <MarketRequestForm />
      </section>
    </main>
  );
}