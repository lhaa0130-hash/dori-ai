"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import AiToolsList from "@/components/ai-tools/AiToolsList";
import { TEXTS } from "@/constants/texts";
import { completeMission, isMissionCompletedToday, markMissionCompletedToday } from "@/lib/missionHelpers";

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
  "image-generation": "이미지 생성",
  "image-editing": "이미지 편집",
  "video-generation": "영상 생성",
  "video-editing": "영상 편집",
  "voice-tts": "음성/TTS",
  music: "음악",
  automation: "자동화",
  search: "검색",
  agent: "에이전트",
  coding: "코딩",
  design: "디자인",
  "3d": "3D",
  writing: "글쓰기",
  translation: "번역",
  presentation: "프레젠테이션",
};

export default function AiToolsClient() {
  const t = TEXTS.aiTools;
  const { theme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: "All",
    priceType: "all",
    sortBy: "rating",
  });
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => setMounted(true), []);

  // AI Tools 페이지 방문 미션 자동 완료
  useEffect(() => {
    if (mounted && session?.user) {
      const missionCode = "VISIT_AI_TOOLS";
      if (!isMissionCompletedToday(missionCode)) {
        completeMission(missionCode).then((success) => {
          if (success) {
            markMissionCompletedToday(missionCode);
          }
        });
      }
    }
  }, [mounted, session]);

  const isDark = mounted && theme === 'dark';

  const handleCategoryClick = (category: string) => {
    if (category === "all") {
      setActiveCategory(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setActiveCategory(category === activeCategory ? null : category);
    
    // ref 키는 "category-{cat}" 형식
    const refKey = `category-${category}`;
    const element = sectionRefs.current[refKey];
    
    if (element) {
      // 헤더 높이를 고려한 스크롤
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
        paddingTop: '70px',
      }}
    >
      {/* 좌측 사이드바 카테고리 필터 */}
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
            <button
              onClick={() => handleCategoryClick("all")}
              className="group relative flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl transition-all duration-300 text-left whitespace-nowrap"
              style={{
                backgroundColor: activeCategory === null
                  ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                  : 'transparent',
              }}
            >
              <div 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                  activeCategory === null ? 'scale-150' : 'scale-100'
                }`}
                style={{
                  backgroundColor: activeCategory === null
                    ? (isDark ? '#ffffff' : '#000000')
                    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                }}
              />
              <span 
                className="text-[10px] lg:text-xs font-medium transition-all duration-300"
                style={{
                  color: activeCategory === null
                    ? (isDark ? '#ffffff' : '#000000')
                    : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                  transform: activeCategory === null ? 'translateX(4px)' : 'translateX(0)',
                }}
              >
                전체
              </span>
            </button>
            {DISPLAY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="group relative flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl transition-all duration-300 text-left whitespace-nowrap"
                style={{
                  backgroundColor: activeCategory === cat
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
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
                  {CATEGORY_LABELS[cat]}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

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
      <section className="relative pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 xl:pl-12 text-center overflow-hidden">
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

      {/* 모바일용 필터 (lg 이상에서는 숨김) */}
      <section className="w-full max-w-7xl mx-auto px-6 mb-8 lg:hidden">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <button
            onClick={() => handleCategoryClick("all")}
            className={`px-4 py-2 rounded-lg transition-all text-sm ${
              activeCategory === null
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'bg-white/10 text-white/70 hover:bg-white/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {DISPLAY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 rounded-lg transition-all text-sm ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-white/10 text-white/70 hover:bg-white/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </section>

      {/* Tools List */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-16">
        <AiToolsList filters={filters} sectionRefs={sectionRefs} />
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
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
