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
            {DISPLAY_CATEGORIES.map((cat) => (
              <a
                key={cat}
                href={`#category-${cat}`}
                className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer"
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
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    activeCategory === cat ? 'scale-150' : 'scale-100'
                  }`}
                  style={{
                    backgroundColor: activeCategory === cat 
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                  }}
                />
                <span 
                  className="text-xs font-medium transition-all duration-300"
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
          width: '180px',
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
      <section className="relative pt-20 pb-12 px-6 lg:pl-10 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
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
            className="w-full max-w-2xl mx-auto h-1 md:h-1.5 mb-6 rounded-full overflow-hidden"
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
            className="text-lg md:text-xl font-medium opacity-70 break-keep leading-relaxed"
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

      {/* 메인 콘텐츠 */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 pb-24 relative lg:pl-10">
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