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
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // 활성 섹션 감지
      const sections = ['hero', 'features', 'gallery', 'faq'];
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
  }, [mounted]);

  useEffect(() => {
    if (!mounted || typeof document === 'undefined' || typeof window === 'undefined') return;

    // 스크롤 스냅 설정
    const html = document.documentElement;
    const body = document.body;
    
    html.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
    html.style.setProperty('scroll-behavior', 'smooth', 'important');
    body.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
    body.style.setProperty('scroll-behavior', 'smooth', 'important');
    
    return () => {
      html.style.removeProperty('scroll-snap-type');
      html.style.removeProperty('scroll-behavior');
      body.style.removeProperty('scroll-snap-type');
      body.style.removeProperty('scroll-behavior');
    };
  }, [mounted]);

  const isDark = mounted && theme === 'dark';

  const navItems = [
    { id: 'hero', label: '홈' },
    { id: 'features', label: '기능' },
    { id: 'gallery', label: '프로젝트' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <div className="relative min-h-screen" style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
    }}>
      {/* 좌측 정 중앙 사이드바 네비게이션 */}
      <aside 
        className="fixed left-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: `translateY(-50%)`,
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
                className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: activeSection === item.id 
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  const targetElement = document.getElementById(item.id);
                  if (targetElement) {
                    // 스크롤 스냅을 일시적으로 비활성화
                    const html = document.documentElement;
                    const body = document.body;
                    html.style.setProperty('scroll-snap-type', 'none', 'important');
                    body.style.setProperty('scroll-snap-type', 'none', 'important');
                    
                    // 스크롤 실행
                    const targetPosition = targetElement.offsetTop;
                    window.scrollTo({
                      top: targetPosition,
                      behavior: 'smooth'
                    });
                    
                    // 스크롤 완료 후 스크롤 스냅 복원
                    setTimeout(() => {
                      html.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
                      body.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
                    }, 1000);
                  }
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
        className="relative min-h-screen flex items-center justify-center px-6 lg:pl-12"
        ref={(el) => { sectionRefs.current['hero'] = el; }}
        data-section-id="hero"
        style={{ scrollSnapAlign: 'center' }}
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
            className={`w-full max-w-2xl mx-auto h-1 md:h-1.5 mb-6 rounded-full overflow-hidden ${
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
          
          <div 
            className={`text-3xl md:text-4xl lg:text-5xl mb-6 transition-all duration-1000 ${
              visibleSections.has('hero')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            DORI-AI
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
              작은 시작을 함께 만들어갑니다
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
        className="relative min-h-screen flex items-center justify-center py-20 md:py-28 px-6 lg:pl-12"
        ref={(el) => { sectionRefs.current['features'] = el; }}
        data-section-id="features"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🚀", title: "AI 도구", desc: "최신 AI 도구를 탐색하고 비교하여 여러분의 작업에 가장 적합한 도구를 찾아보세요", color: "#3b82f6", href: "/ai-tools", isAnchor: false },
              { icon: "🧠", title: "인사이트", desc: "AI 트렌드와 분석을 통해 최신 동향을 파악하세요", color: "#8b5cf6", href: "/insight", isAnchor: false },
              { icon: "📊", title: "프로젝트", desc: "데이터와 인사이트로 더 나은 결정을 내리세요", color: "#ec4899", href: "/project", isAnchor: false },
              { icon: "💬", title: "커뮤니티", desc: "소통과 공유를 통해 함께 성장하세요", color: "#f59e0b", href: "/community", isAnchor: false },
              { icon: "🛒", title: "마켓", desc: "다양한 제품과 서비스를 만나보세요", color: "#10b981", href: "/market", isAnchor: false },
            ].map((item, idx) => {
              const handleClick = (e: React.MouseEvent) => {
                if (item.isAnchor) {
                  e.preventDefault();
                  const element = document.getElementById(item.href.replace('#', ''));
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              };
              
              return (
              <Link
                key={idx}
                href={item.href}
                onClick={handleClick}
                className={`group relative rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer ${
                  visibleSections.has('features')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${idx * 50}ms`,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#e5e5e7'}`,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                  textDecoration: 'none',
                }}
              >
                <div className="p-6 h-full flex flex-col">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      backgroundColor: isDark 
                        ? `rgba(${item.color === '#3b82f6' ? '59, 130, 246' : item.color === '#8b5cf6' ? '139, 92, 246' : item.color === '#10b981' ? '16, 185, 129' : item.color === '#f59e0b' ? '245, 158, 11' : '236, 72, 153'}, 0.1)`
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
              </Link>
            );
            })}
          </div>
        </div>
      </section>

      {/* 프로젝트 섹션 */}
      <section 
        id="gallery"
        className="relative min-h-screen flex items-center justify-center py-20 md:py-28 px-6 lg:pl-12"
        ref={(el) => { sectionRefs.current['gallery'] = el; }}
        data-section-id="gallery"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div 
            className={`text-center mb-12 transition-all duration-1000 ${
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
              프로젝트
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { id: 1, title: "프로젝트 1", desc: "세련된 디자인과 혁신적인 솔루션", isSite: false },
              { id: 2, title: "프로젝트 2", desc: "세련된 디자인과 혁신적인 솔루션", isSite: false },
              { id: 3, title: "프로젝트 3", desc: "세련된 디자인과 혁신적인 솔루션", isSite: false },
              { id: 4, title: "프로젝트 4", desc: "세련된 디자인과 혁신적인 솔루션", isSite: false },
              { id: 5, title: "프로젝트 5", desc: "세련된 디자인과 혁신적인 솔루션", isSite: false },
              { id: 6, title: "사이트", desc: "외부 사이트로 이동", isSite: true, url: "https://example.com" },
            ].map((item, idx) => {
              const CardContent = (
                <div
                  className={`group relative aspect-[4/3] rounded-3xl overflow-hidden transition-all duration-700 cursor-pointer ${
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
                      className="text-6xl opacity-50 transition-transform duration-700 group-hover:scale-125"
                      style={{
                        transform: `rotate(${idx * 15}deg)`,
                      }}
                    >
                      {item.isSite ? '🌐' : '✨'}
                    </div>
                  </div>
                  <div 
                    className="absolute bottom-0 left-0 right-0 p-6 transition-transform duration-700 group-hover:translate-y-0 translate-y-full"
                    style={{
                      background: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    <h3 
                      className="text-lg mb-2"
                      style={{
                        color: isDark ? '#ffffff' : '#1d1d1f',
                        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p 
                      className="text-sm"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                        fontWeight: 400,
                        letterSpacing: '0',
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              );

              if (item.isSite) {
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {CardContent}
                  </a>
                );
              }

              return (
                <div key={item.id}>
                  {CardContent}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ 섹션 */}
      <section 
        id="faq"
        className="relative min-h-screen flex items-center justify-center py-24 md:py-32 px-6"
        ref={(el) => { sectionRefs.current['faq'] = el; }}
        data-section-id="faq"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'center',
        }}
      >
        <div className="max-w-5xl mx-auto w-full">
          <div>
            <h2 
              className="text-3xl md:text-4xl font-medium mb-16 text-center"
              style={{
                color: isDark ? '#ffffff' : '#000000',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: 500,
                letterSpacing: '-0.03em',
              }}
            >
              자주 묻는 질문
            </h2>
            <div className="space-y-1">
              {[
                { 
                  q: "DORI-AI는 어떤 서비스인가요?", 
                  a: "DORI-AI는 AI 도구 탐색, 인사이트 제공, 커뮤니티 소통을 한 곳에서 제공하는 플랫폼입니다. 수천 개의 AI 도구를 카테고리별로 탐색하고 비교할 수 있으며, 최신 AI 트렌드와 분석을 확인하고, 다른 사용자들과 정보를 공유할 수 있습니다." 
                },
                { 
                  q: "회원가입 없이 사용할 수 있나요?", 
                  a: "네, AI 도구 탐색과 인사이트 읽기는 회원가입 없이도 이용하실 수 있습니다. 다만 커뮤니티 글 작성, 좋아요, 댓글 등 일부 기능은 회원가입이 필요합니다." 
                },
                { 
                  q: "AI 도구 정보는 어떻게 업데이트되나요?", 
                  a: "AI 도구 정보는 정기적으로 업데이트되며, 사용자들의 리뷰와 평점을 통해 실시간으로 반영됩니다. 새로운 AI 도구가 출시되면 빠르게 추가됩니다." 
                },
                { 
                  q: "인사이트는 누가 작성하나요?", 
                  a: "인사이트는 DORI-AI 운영진이 매일 최신 AI 트렌드와 심층 분석을 정리하여 제공합니다. 큐레이션, 리포트, 가이드, 분석, 트렌드 등 다양한 형식으로 제공됩니다." 
                },
                { 
                  q: "커뮤니티에서 부적절한 글을 발견하면 어떻게 하나요?", 
                  a: "커뮤니티에서 부적절한 내용을 발견하시면 건의사항 페이지를 통해 신고해주세요. 자동 필터링 시스템과 함께 운영진이 검토하여 적절한 조치를 취하겠습니다." 
                },
              ].map((faq, idx) => (
                <details
                  key={idx}
                  className="group"
                  style={{
                    backgroundColor: 'transparent',
                    borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                    padding: '24px 0',
                    marginBottom: '0',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderBottomColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderBottomColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <summary 
                    className="cursor-pointer list-none flex items-center justify-between gap-6 py-0"
                    style={{
                      color: isDark ? '#ffffff' : '#000000',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontWeight: 500,
                      fontSize: '17px',
                      letterSpacing: '-0.02em',
                      lineHeight: '1.5',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    <span className="group-hover:opacity-70 transition-opacity duration-200">{faq.q}</span>
                    <span 
                      className="text-xl transition-all duration-300 group-open:rotate-45 flex-shrink-0 flex items-center justify-center w-5 h-5"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        fontSize: '18px',
                        fontWeight: 300,
                      }}
                    >
                      +
                    </span>
                  </summary>
                  <div 
                    className="pt-6 pb-2 leading-relaxed"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.65)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontWeight: 400,
                      fontSize: '15px',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.8',
                    }}
                  >
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-16">
            <Footer />
          </div>
        </div>
      </section>

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

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(-8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes nodePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }


        .animate-scroll {
          animation: scroll 2s ease-in-out infinite;
        }

        details summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </div>
  );
}
