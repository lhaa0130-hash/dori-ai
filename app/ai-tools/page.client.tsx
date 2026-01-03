"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import { TEXTS } from "@/constants/texts";

const DISPLAY_CATEGORIES = [
  "llm", 
  "image-generation",
  "image-editing",
  "video-generation",
  "video-editing",
  "voice-tts",
  "music",
  "automation", 
  "search", 
  "agent",
  "coding",
  "design",
  "3d",
  "writing",
  "translation",
  "presentation"
];

const CATEGORY_LABELS: Record<string, string> = {
  llm: "LLM",
  "image-generation": "Image Gen",
  "image-editing": "Image Edit",
  "video-generation": "Video Gen",
  "video-editing": "Video Edit",
  "voice-tts": "Voice TTS",
  music: "Music",
  automation: "Automation",
  search: "Search",
  agent: "Agent",
  coding: "Coding",
  design: "Design",
  "3d": "3D",
  writing: "Writing",
  translation: "Translation",
  presentation: "Presentation",
};

export default function AiToolsClient() {
  const t = TEXTS.aiTools;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeCategory, setActiveCategory] = useState("llm");
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [filters, setFilters] = useState({
    category: "All",
  });

  useEffect(() => setMounted(true), []);

  // 스크롤 감지 및 활성 카테고리 업데이트
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // 현재 보이는 섹션 찾기
      const categories = DISPLAY_CATEGORIES;
      for (const cat of categories) {
        const section = sectionRefs.current[`category-${cat}`];
        if (!section) continue;
        
        const rect = section.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
          setActiveCategory(cat);
          break;
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // 스크롤 스냅 설정
  useEffect(() => {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const html = document.documentElement;
      
      html.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
      html.style.setProperty('scroll-behavior', 'smooth', 'important');
      
      return () => {
        html.style.removeProperty('scroll-snap-type');
        html.style.removeProperty('scroll-behavior');
      };
    }
  }, []);

  const isDark = mounted && theme === 'dark';

  const handleCategoryClick = (cat: string) => {
    const section = sectionRefs.current[`category-${cat}`];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActiveCategory(cat);
    }
  };

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 좌측 사이드바 네비게이션 */}
      <aside 
        className="fixed left-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <nav className="ml-4 lg:ml-8">
          <div 
            className="flex flex-col gap-2 lg:gap-3 p-3 lg:p-4 rounded-2xl backdrop-blur-xl transition-all duration-500"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              maxHeight: 'calc(90vh - 20px)',
            }}
          >
            {DISPLAY_CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`#category-${cat}`}
                className="group relative flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: activeCategory === cat 
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleCategoryClick(cat);
                }}
              >
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                    activeCategory === cat ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: activeCategory === cat 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                  }}
                />
                <span 
                  className="text-[10px] lg:text-xs font-medium transition-all duration-300"
                  style={{
                    color: activeCategory === cat 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                    transform: activeCategory === cat ? 'translateX(4px)' : 'translateX(0)',
                  }}
                >
                  {CATEGORY_LABELS[cat] || cat.toUpperCase()}
                </span>
              </a>
            ))}
          </div>
        </nav>
      </aside>

      {/* 우측 빈 사이드바 */}
      <aside 
        className="fixed right-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          width: '120px',
        }}
      />

      {/* 배경 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {mounted && theme === "dark" && (
          <>
            <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
            <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}
        {mounted && theme === "light" && (
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), #ffffff',
            }}
          />
        )}
      </div>

      {/* 히어로 섹션 */}
      <section className="relative pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 xl:pl-10 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight leading-tight px-2"
            style={{ 
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            {t.heroTitle.ko}
          </h1>
          
          {/* 그라데이션 바 */}
          <div 
            className="w-full max-w-2xl mx-auto h-1 sm:h-1.5 mb-4 sm:mb-6 rounded-full overflow-hidden"
            style={{
              boxShadow: isDark 
                ? '0 0 30px rgba(96, 165, 250, 0.4), 0 4px 20px rgba(96, 165, 250, 0.2)'
                : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 15px rgba(37, 99, 235, 0.2)',
            }}
          >
            <div 
              className="gradient-flow h-full rounded-full"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%, #60a5fa 100%)'
                  : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%, #2563eb 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradientFlow 4s linear infinite',
              }}
            />
          </div>

          <p 
            className="text-base sm:text-lg md:text-xl font-medium opacity-70 break-keep leading-relaxed px-4"
            style={{ 
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            {t.heroSubtitle.ko}
          </p>
        </div>
      </section>

      {/* 모바일/태블릿 카테고리 필터 (상단) */}
      <div 
        className="lg:hidden sticky top-[70px] z-[99] mb-4"
        style={{ 
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="relative overflow-x-auto scrollbar-hide">
          {/* 좌측 그라데이션 인디케이터 */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.98)'}, transparent)`,
            }}
          />
          {/* 우측 그라데이션 인디케이터 */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
            style={{
              background: `linear-gradient(to left, ${isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.98)'}, transparent)`,
            }}
          />
          <div className="flex gap-2.5 min-w-max px-4 py-3.5">
            {DISPLAY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] flex items-center ${
                  activeCategory === cat ? 'opacity-100 scale-105' : 'opacity-70'
                }`}
                style={{
                  backgroundColor: activeCategory === cat 
                    ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)')
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                  color: isDark ? '#ffffff' : '#000000',
                  border: `1px solid ${activeCategory === cat 
                    ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')
                    : 'transparent'}`,
                  boxShadow: activeCategory === cat 
                    ? (isDark ? '0 2px 8px rgba(255, 255, 255, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)')
                    : 'none',
                }}
              >
                {CATEGORY_LABELS[cat] || cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 relative lg:pl-10">
        <AiToolsList filters={filters} sectionRefs={sectionRefs} />
      </div>

      {/* 스타일 */}
      <style jsx global>{`
        html {
          scroll-snap-type: y mandatory !important;
          scroll-behavior: smooth !important;
        }
        body {
          scroll-snap-type: y mandatory !important;
          scroll-behavior: smooth !important;
        }
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