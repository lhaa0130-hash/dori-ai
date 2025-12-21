"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export default function PremiumDesignPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("hero");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // 활성 섹션 감지
      const sections = ['hero', 'features', 'gallery', 'testimonials', 'faq'];
      const current = sections.find(section => {
        const el = sectionRefs.current[section];
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 200 && rect.bottom >= 200;
      });
      if (current) setActiveSection(current);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("mousemove", handleMouseMove);
      
      // Intersection Observer
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId = entry.target.getAttribute('data-section-id');
              if (sectionId) {
                setVisibleSections((prev) => new Set(prev).add(sectionId));
              }
            }
          });
        },
        { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
      );

      const observeSections = () => {
        Object.values(sectionRefs.current).forEach((ref) => {
          if (ref) observer.observe(ref);
        });
      };

      observeSections();
      const timeoutId = setTimeout(observeSections, 100);

      return () => {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("mousemove", handleMouseMove);
        clearTimeout(timeoutId);
        observer.disconnect();
      };
    }
  }, []);

  const isDark = mounted && theme === 'dark';

  const navItems = [
    { id: 'hero', label: '홈' },
    { id: 'features', label: '기능' },
    { id: 'gallery', label: '갤러리' },
    { id: 'testimonials', label: '커뮤니티' },
    { id: 'faq', label: 'FAQ' },
  ];

  useEffect(() => {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const html = document.documentElement;
      const body = document.body;
      
      // CSS 스크롤 스냅 설정
      html.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
      html.style.setProperty('scroll-behavior', 'smooth', 'important');
      
      body.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
      body.style.setProperty('scroll-behavior', 'smooth', 'important');
      
      // JavaScript로 스크롤 스냅 강제 구현
      let isScrolling = false;
      let scrollTimeout: NodeJS.Timeout;
      
      const handleWheel = (e: WheelEvent) => {
        if (isScrolling) {
    e.preventDefault();
          return;
        }
        
        const sections = ['hero', 'features', 'gallery', 'testimonials', 'faq'];
        const currentScroll = window.scrollY;
        const viewportHeight = window.innerHeight;
        
        let targetSection: string | null = null;
        let targetScroll = 0;
        
        // 현재 보이는 섹션 찾기
        for (let i = 0; i < sections.length; i++) {
          const section = sectionRefs.current[sections[i]];
          if (!section) continue;
          
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + currentScroll;
          const sectionBottom = sectionTop + rect.height;
          
          // 현재 뷰포트 중앙이 섹션 내에 있는지 확인
          const viewportCenter = currentScroll + viewportHeight / 2;
          
          if (viewportCenter >= sectionTop && viewportCenter <= sectionBottom) {
            // 아래로 스크롤
            if (e.deltaY > 0 && i < sections.length - 1) {
              const nextSection = sectionRefs.current[sections[i + 1]];
              if (nextSection) {
                targetSection = sections[i + 1];
                targetScroll = nextSection.offsetTop;
              }
            }
            // 위로 스크롤
            else if (e.deltaY < 0 && i > 0) {
              const prevSection = sectionRefs.current[sections[i - 1]];
              if (prevSection) {
                targetSection = sections[i - 1];
                targetScroll = prevSection.offsetTop;
              }
            }
            break;
          }
        }
        
        // 섹션 경계 근처에서 스크롤할 때
        if (!targetSection) {
          for (let i = 0; i < sections.length; i++) {
            const section = sectionRefs.current[sections[i]];
            if (!section) continue;
            
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + currentScroll;
            
            // 아래로 스크롤하고 섹션 상단 근처에 있을 때
            if (e.deltaY > 0 && rect.top < viewportHeight * 0.3 && rect.top > -viewportHeight * 0.3) {
              if (i < sections.length - 1) {
                const nextSection = sectionRefs.current[sections[i + 1]];
                if (nextSection) {
                  targetSection = sections[i + 1];
                  targetScroll = nextSection.offsetTop;
                }
              }
              break;
            }
            // 위로 스크롤하고 섹션 하단 근처에 있을 때
            else if (e.deltaY < 0 && rect.bottom > viewportHeight * 0.7 && rect.bottom < viewportHeight * 1.3) {
              if (i > 0) {
                const prevSection = sectionRefs.current[sections[i - 1]];
                if (prevSection) {
                  targetSection = sections[i - 1];
                  targetScroll = prevSection.offsetTop;
                }
              }
              break;
            }
          }
        }
        
        if (targetSection && targetScroll !== currentScroll) {
          e.preventDefault();
          isScrolling = true;
          
          window.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
          
          scrollTimeout = setTimeout(() => {
            isScrolling = false;
          }, 800);
        }
      };
      
      window.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        window.removeEventListener('wheel', handleWheel);
        clearTimeout(scrollTimeout);
        html.style.removeProperty('scroll-snap-type');
        html.style.removeProperty('scroll-behavior');
        body.style.removeProperty('scroll-snap-type');
        body.style.removeProperty('scroll-behavior');
      };
    }
  }, []);

  return (
    <div 
      className="relative min-h-screen overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 좌측 사이드바 네비게이션 */}
      <aside 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
      >
        <nav className="ml-6">
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
                className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: activeSection === item.id 
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    activeSection === item.id ? 'scale-150' : 'scale-100'
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

      {/* 우측 빈 사이드바 */}
      <aside 
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
        style={{
          width: '140px',
        }}
      />

      {/* 배경 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse at top, rgba(30, 58, 138, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(88, 28, 135, 0.1) 0%, transparent 50%), #000000'
              : 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), #ffffff',
          }}
        />
        
        {/* 마우스 추적 그라데이션 */}
        {mounted && (
          <div 
            className="absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000 ease-out opacity-30"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
              left: `${mousePosition.x - 300}px`,
              top: `${mousePosition.y - 300}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>

      {/* 히어로 섹션 */}
      <section 
        id="hero"
        className="relative flex items-center justify-center px-6 lg:pl-32"
        ref={(el) => { sectionRefs.current['hero'] = el; }}
        data-section-id="hero"
        style={{
          height: 'calc(100vh - 80px)',
          minHeight: 'calc(100vh - 80px)',
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always',
          scrollMarginTop: '80px',
        }}
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* 메인 타이틀 */}
          <h1 
            className={`text-5xl md:text-6xl lg:text-7xl mb-4 leading-[1.05] tracking-[-0.03em] transition-all duration-1000 ${
              visibleSections.has('hero')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Creative Studio
          </h1>
          
          {/* DORI-AI 그라데이션 바 */}
          <div 
            className={`w-full max-w-2xl mx-auto h-1 md:h-1.5 mb-4 rounded-full overflow-hidden ${
              visibleSections.has('hero')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{
              boxShadow: isDark 
                ? '0 0 30px rgba(96, 165, 250, 0.4), 0 4px 20px rgba(96, 165, 250, 0.2)'
                : '0 0 20px rgba(37, 99, 235, 0.3), 0 4px 15px rgba(37, 99, 235, 0.2)',
              transition: 'opacity 1s ease, transform 1s ease',
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
          
          {/* 서브타이틀 */}
          <div 
            className={`mb-8 max-w-2xl mx-auto space-y-2 transition-all duration-1000 delay-100 ${
              visibleSections.has('hero')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <p 
              className="text-lg md:text-xl leading-relaxed"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              작은 시작을 함께 만들어갑니다. <span className={`gradient-text ${isDark ? 'gradient-dark' : 'gradient-light'}`}>DORI-AI</span>
            </p>
            <p 
              className="text-sm md:text-base leading-relaxed"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              AI가 처음이어도, 누구나 배우고 성장할 수 있는 공간
            </p>
          </div>


          {/* 스크롤 인디케이터 */}
          <div 
            className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-all duration-500 ${
              scrollY > 100 ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div 
              className="w-px h-16 flex items-start justify-center"
              style={{
                borderLeft: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
              }}
            >
              <div 
                className="w-1 h-12 rounded-full animate-scroll"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section 
        id="features"
        className="relative flex items-center justify-center px-6 lg:pl-32"
        ref={(el) => { sectionRefs.current['features'] = el; }}
        data-section-id="features"
        style={{
          height: '100vh',
          minHeight: '100vh',
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always',
          scrollMarginTop: '0px',
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🚀", title: "AI 도구", desc: "최신 AI 도구를 탐색하고 비교하여 여러분의 작업에 가장 적합한 도구를 찾아보세요", color: "#3b82f6" },
              { icon: "🧠", title: "인사이트", desc: "AI 트렌드와 분석을 통해 최신 동향을 파악하세요", color: "#8b5cf6" },
              { icon: "🎓", title: "아카데미", desc: "교육 자료와 강의를 통해 지식을 습득하세요", color: "#06b6d4" },
              { icon: "🛒", title: "마켓", desc: "다양한 제품과 서비스를 만나보세요", color: "#10b981" },
              { icon: "💬", title: "커뮤니티", desc: "소통과 공유를 통해 함께 성장하세요", color: "#f59e0b" },
              { icon: "📊", title: "분석", desc: "데이터와 인사이트로 더 나은 결정을 내리세요", color: "#ec4899" },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-500 ${
                  visibleSections.has('features')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${idx * 50}ms`,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#e5e5e7'}`,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                }}
              >
                <div className="p-6 h-full flex flex-col">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      backgroundColor: isDark 
                        ? `rgba(${item.color === '#3b82f6' ? '59, 130, 246' : item.color === '#8b5cf6' ? '139, 92, 246' : '6, 182, 212'}, 0.1)`
                        : `${item.color}15`,
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3 
                    className="text-xl mb-2"
                    style={{
                      color: isDark ? '#ffffff' : '#1d1d1f',
                      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p 
                    className="text-sm leading-relaxed flex-grow"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: '1.6',
                    }}
                  >
                    {item.desc}
                  </p>
                  <div 
                    className="flex items-center gap-2 mt-4 text-sm font-medium transition-all duration-300 group-hover:gap-3"
                    style={{
                      color: item.color,
                    }}
                  >
                    <span>자세히 보기</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </div>
                </div>
                
                {/* 호버 효과 */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${item.color}10 0%, transparent 70%)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 갤러리 섹션 */}
      <section 
        id="gallery"
        className="relative flex items-center justify-center px-6 lg:pl-32"
        ref={(el) => { sectionRefs.current['gallery'] = el; }}
        data-section-id="gallery"
        style={{
          height: '100vh',
          minHeight: '100vh',
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always',
          scrollMarginTop: '0px',
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div 
            className={`text-center mb-6 transition-all duration-1000 ${
              visibleSections.has('gallery')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 
              className="text-4xl md:text-5xl mb-3"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: '1.1',
              }}
            >
              갤러리
            </h2>
            <p 
              className="text-lg"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              우리의 작업을 확인해보세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((item, idx) => (
              <div
                key={idx}
                className={`group relative aspect-[5/3] rounded-2xl overflow-hidden transition-all duration-700 ${
                  visibleSections.has('gallery')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${idx * 50}ms`,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#e5e5e7'}`,
                }}
              >
                <div 
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${isDark ? '#1e3a8a' : '#3b82f6'} 0%, ${isDark ? '#581c87' : '#8b5cf6'} 100%)`,
                    opacity: 0.8,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="text-5xl opacity-50 transition-transform duration-700 group-hover:scale-125"
                    style={{
                      transform: `rotate(${idx * 15}deg)`,
                    }}
                  >
                    ✨
                  </div>
                </div>
                <div 
                  className="absolute bottom-0 left-0 right-0 p-4 transition-transform duration-700 group-hover:translate-y-0 translate-y-full"
                  style={{
                    background: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <h3 
                    className="text-base mb-1.5"
                    style={{
                      color: isDark ? '#ffffff' : '#1d1d1f',
                      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    프로젝트 {item}
                  </h3>
                  <p 
                    className="text-xs"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                      fontWeight: 400,
                      letterSpacing: '0',
                    }}
                  >
                    세련된 디자인과 혁신적인 솔루션
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 커뮤니티 섹션 */}
      <section 
        id="testimonials"
        className="relative flex items-center justify-center px-6 lg:pl-32"
        ref={(el) => { sectionRefs.current['testimonials'] = el; }}
        data-section-id="testimonials"
        style={{
          height: '100vh',
          minHeight: '100vh',
          backgroundColor: isDark ? '#000000' : '#f5f5f7',
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always',
          scrollMarginTop: '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="max-w-6xl mx-auto w-full">
          <div 
            className={`text-center mb-6 transition-all duration-1000 ${
              visibleSections.has('testimonials')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 
              className="text-4xl md:text-5xl mb-3"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: '1.1',
              }}
            >
              커뮤니티
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "김철수", role: "디자이너", text: "정말 놀라운 경험이었습니다. 직관적이고 세련된 인터페이스가 인상적이에요." },
              { name: "이영희", role: "개발자", text: "AI 도구 탐색이 이렇게 쉬울 줄 몰랐어요. 정말 유용한 플랫폼입니다." },
              { name: "박민수", role: "기획자", text: "커뮤니티가 활발하고 정보가 풍부해서 정말 만족스럽습니다." },
              { name: "최지영", role: "마케터", text: "다양한 AI 도구를 한 곳에서 비교할 수 있어서 업무 효율이 크게 향상되었어요." },
              { name: "정수진", role: "콘텐츠 크리에이터", text: "인사이트 섹션이 정말 도움이 됩니다. 최신 트렌드를 빠르게 파악할 수 있어요." },
              { name: "한동욱", role: "프로덕트 매니저", text: "커뮤니티에서 얻은 정보로 프로젝트를 성공적으로 완료할 수 있었습니다." },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-3xl transition-all duration-700 ${
                  visibleSections.has('testimonials')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${idx * 100}ms`,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#e5e5e7'}`,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{
                      background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`,
                    }}
                  >
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div 
                      className=""
                      style={{
                        color: isDark ? '#ffffff' : '#1d1d1f',
                        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {testimonial.name}
                    </div>
                    <div 
                      className="text-sm"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                        fontWeight: 400,
                      }}
                    >
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <p 
                  className="leading-relaxed"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                    fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: '1.6',
                  }}
                >
                  {testimonial.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section 
        id="faq"
        className="relative px-6 lg:pl-32"
        ref={(el) => { sectionRefs.current['faq'] = el; }}
        data-section-id="faq"
        style={{
          minHeight: '100vh',
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always',
          scrollMarginTop: '0px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div className="max-w-4xl mx-auto w-full py-12">
          <div 
            className={`text-center mb-8 transition-all duration-1000 ${
              visibleSections.has('faq')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 
              className="text-4xl md:text-5xl mb-3"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: '1.1',
              }}
            >
              자주 묻는 질문
            </h2>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { q: "어떤 AI 도구를 추천하시나요?", a: "사용 목적에 따라 다릅니다. 텍스트 생성에는 ChatGPT, 이미지 생성에는 Midjourney를 추천합니다." },
              { q: "무료로 사용할 수 있나요?", a: "네, 기본 기능은 무료로 사용하실 수 있습니다. 프리미엄 기능은 유료 플랜을 이용하시면 됩니다." },
              { q: "커뮤니티에 어떻게 참여하나요?", a: "회원가입 후 바로 참여하실 수 있습니다. 다양한 주제로 토론하고 정보를 공유할 수 있습니다." },
            ].map((faq, idx) => (
              <details
                key={idx}
                className={`group rounded-2xl overflow-hidden transition-all duration-500 ${
                  visibleSections.has('faq')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${idx * 100}ms`,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#e5e5e7'}`,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                }}
              >
                <summary 
                  className="p-5 cursor-pointer list-none flex items-center justify-between"
                  style={{
                    color: isDark ? '#ffffff' : '#1d1d1f',
                    fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                  }}
                >
                  <span>{faq.q}</span>
                  <span className="text-xl transition-transform duration-300 group-open:rotate-180">▼</span>
                </summary>
                <div 
                  className="px-5 pb-5 leading-relaxed"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: '1.6',
                  }}
                >
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          {/* Footer */}
          <div 
            className={`mt-8 transition-all duration-1000 ${
              visibleSections.has('faq')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <Footer />
          </div>
      </div>
      </section>


      {/* 스타일 */}
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(20px);
            opacity: 0.3;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }

        .animate-scroll {
          animation: scroll 2s ease-in-out infinite;
        }

        details summary::-webkit-details-marker {
          display: none;
        }

        .gradient-text {
          background-position: 0% 50%;
          background-size: 100% 100%;
          background-repeat: no-repeat;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          display: inline-block;
          position: relative;
          z-index: 1;
          font-weight: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        .gradient-text.gradient-dark {
          background-image: linear-gradient(90deg, #60a5fa 0%, #818cf8 12.5%, #a78bfa 25%, #c084fc 37.5%, #ec4899 50%, #f472b6 62.5%, #f59e0b 75%, #fbbf24 87.5%, #10b981 100%);
        }

        .gradient-text.gradient-light {
          background-image: linear-gradient(90deg, #2563eb 0%, #4f46e5 12.5%, #7c3aed 25%, #9333ea 37.5%, #db2777 50%, #e11d48 62.5%, #d97706 75%, #f59e0b 87.5%, #059669 100%);
        }
      `}</style>
    </div>
  );
}
