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
  const [activeSection, setActiveSection] = useState("products");
  const [filters, setFilters] = useState({ category: "All", price: "All", sort: "newest" });

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === 'dark';

  const navItems = [
    { id: 'products', label: 'AI 자료 마켓' },
    { id: 'request', label: 'AI 작업 의뢰' },
  ];

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveSection(id);
  };

  return (
    <main
      className="w-full min-h-screen relative overflow-x-hidden bg-white dark:bg-black transition-colors duration-500"
      style={{
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 배경 그라데이션 (Standard) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:from-orange-900/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      {/* 좌측 사이드바 네비게이션 */}
      <aside
        className="fixed left-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <nav className="ml-8">
          <div
            className="flex flex-col gap-3 p-4 rounded-2xl backdrop-blur-xl transition-all duration-500"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            }}
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer"
                style={{
                  backgroundColor: activeSection === item.id
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeSection === item.id ? 'scale-150' : 'scale-100'
                    }`}
                  style={{
                    backgroundColor: activeSection === item.id
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                  }}
                />
                <span
                  className="text-xs font-medium transition-all duration-300"
                  style={{
                    color: activeSection === item.id
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    transform: activeSection === item.id ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </div>
        </nav>
      </aside>

      {/* 히어로 섹션 (Standard) */}
      <section className="relative pt-32 pb-16 px-6 lg:pl-12 text-center overflow-hidden z-10">
        <div className="max-w-3xl mx-auto animate-fade-in flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span>Digital Market</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              {t.heroTitle.ko}
            </span>
          </h1>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>
      {/* 메인 콘텐츠 */}
      <section
        id="products"
        className="container max-w-7xl mx-auto px-4 md:px-6 lg:pl-12 pb-24 border-b border-dashed relative"
        style={{
          borderColor: 'var(--card-border)',
        }}
      >
        <h2
          className="text-2xl font-bold mb-8 flex items-center gap-2"
          style={{ color: 'var(--text-main)' }}
        >
          🛒 {t.section.productsTitle.ko}
        </h2>
        <MarketFilters filters={filters} setFilters={setFilters} />
        <MarketList filters={filters} />
      </section>

      <section id="request" className="container max-w-4xl mx-auto px-4 md:px-6 lg:pl-12 py-24 relative">
        <div className="text-center mb-10">
          <h2
            className="text-2xl font-bold mb-2 flex items-center justify-center gap-2"
            style={{ color: 'var(--text-main)' }}
          >
            🤝 {t.section.requestTitle.ko}
          </h2>
          <p
            className="opacity-70"
            style={{ color: 'var(--text-sub)' }}
          >
            원하는 AI 자료가 없다면? 전문가에게 직접 의뢰해보세요.
          </p>
        </div>
        <MarketRequestForm />
      </section>

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </main>
  );
}