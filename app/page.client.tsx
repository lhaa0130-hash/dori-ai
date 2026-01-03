"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function PremiumDesignPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState("hero");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [isScrolling, setIsScrolling] = useState(false);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const rootContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // 프로그래밍 방식 스크롤 중이면 감지하지 않음
      if (isScrolling) return;
      
      // 활성 섹션 감지 - 화면 중앙에 가장 가까운 섹션 찾기 (스크롤스냅 center와 호환)
      const sections = ['hero', 'features', 'gallery', 'testimonials', 'faq'];
      const viewportCenter = window.innerHeight / 2;
      let closestSection = null;
      let closestDistance = Infinity;
      
      sections.forEach(section => {
        const el = sectionRefs.current[section];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        
        // 섹션이 화면에 보이고 중앙에 가장 가까운 경우 (중앙에서 40% 이내)
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
        const isNearCenter = distance < window.innerHeight * 0.4;
        
        if (isInViewport && isNearCenter && distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      });
      
      if (closestSection) {
        setActiveSection(closestSection);
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    if (typeof window !== 'undefined') {
      let scrollTimeout: NodeJS.Timeout;
      
      const handleScrollWithDebounce = () => {
        handleScroll();
        // 스크롤이 멈춘 후에도 한 번 더 체크
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          handleScroll();
        }, 150);
      };
      
      window.addEventListener("scroll", handleScrollWithDebounce, { passive: true });
      window.addEventListener("mousemove", handleMouseMove);
      
      // Intersection Observer - 활성 섹션 감지용 (스크롤스냅 center와 호환)
      const activeObserver = new IntersectionObserver(
        (entries) => {
          // 프로그래밍 방식 스크롤 중이면 감지하지 않음
          if (isScrolling) return;
          
          // 화면 중앙에 가장 가까운 섹션 찾기
          let bestSection = null;
          let bestScore = 0;
          
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionId = entry.target.getAttribute('data-section-id');
              if (!sectionId) return;
              
              const rect = entry.boundingClientRect;
              const viewportCenter = window.innerHeight / 2;
              const sectionCenter = rect.top + rect.height / 2;
              const distanceFromCenter = Math.abs(sectionCenter - viewportCenter);
              
              // 중앙에 가까울수록, 많이 보일수록 높은 점수
              // 화면 중앙 40% 영역 내에 있으면 우선순위 높음
              const isInCenterZone = distanceFromCenter < window.innerHeight * 0.2;
              const centerScore = isInCenterZone ? 2 : 1;
              const visibilityScore = entry.intersectionRatio;
              const distanceScore = 1 / (1 + distanceFromCenter / 100);
              
              const totalScore = centerScore * visibilityScore * distanceScore;
              
              if (totalScore > bestScore) {
                bestScore = totalScore;
                bestSection = sectionId;
              }
            }
          });
          
          if (bestSection) {
            setActiveSection(bestSection);
          }
        },
        { 
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
          rootMargin: '-30% 0px -30% 0px' // 화면 상하 30% 제외한 중앙 40% 영역만 감지
        }
      );

      // Intersection Observer - 가시성 감지용
      const visibilityObserver = new IntersectionObserver(
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
          if (ref) {
            activeObserver.observe(ref);
            visibilityObserver.observe(ref);
          }
        });
      };

      observeSections();
      const timeoutId = setTimeout(observeSections, 100);

      return () => {
        window.removeEventListener("scroll", handleScrollWithDebounce);
        window.removeEventListener("mousemove", handleMouseMove);
        clearTimeout(timeoutId);
        clearTimeout(scrollTimeout);
        activeObserver.disconnect();
        visibilityObserver.disconnect();
      };
    }
  }, [isScrolling]);

  const isDark = mounted && theme === 'dark';

  const navItems = [
    { id: 'hero', label: '홈' },
    { id: 'features', label: '기능' },
    { id: 'gallery', label: '프로젝트' },
    { id: 'testimonials', label: '커뮤니티' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <div 
      ref={(el) => { rootContainerRef.current = el; }}
      className="relative min-h-screen"
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
        scrollSnapType: isScrolling ? 'none' : 'y mandatory',
      }}
    >
      {/* 좌측 사이드바 네비게이션 */}
      <aside 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
        style={{
          transform: `translateY(calc(-50% + ${scrollY * 0.1}px))`,
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
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group relative flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl transition-all duration-300 whitespace-nowrap"
                style={{
                  backgroundColor: activeSection === item.id 
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                    : 'transparent',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const targetElement = document.getElementById(item.id);
                  if (!targetElement) return;
                  
                  // 루트 컨테이너의 스크롤스냅 직접 비활성화
                  if (rootContainerRef.current) {
                    rootContainerRef.current.style.scrollSnapType = 'none';
                  }
                  
                  // 스크롤 상태 설정
                  setIsScrolling(true);
                  setActiveSection(item.id);
                  
                  // 섹션을 화면 정중앙에 오도록 scrollIntoView 사용
                  targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                  });
                  
                  // 스크롤 완료 확인
                  const checkComplete = () => {
                    const rect = targetElement.getBoundingClientRect();
                    const viewportCenter = window.innerHeight / 2;
                    const sectionCenter = rect.top + rect.height / 2;
                    const distance = Math.abs(sectionCenter - viewportCenter);
                    
                    if (distance < 50) {
                      // 스크롤 완료
                      setIsScrolling(false);
                      setActiveSection(item.id);
                      // 스크롤스냅 다시 활성화
                      if (rootContainerRef.current) {
                        rootContainerRef.current.style.scrollSnapType = 'y mandatory';
                      }
                    } else {
                      // 아직 스크롤 중
                      requestAnimationFrame(checkComplete);
                    }
                  };
                  
                  // 스크롤 시작 후 확인 시작
                  setTimeout(() => {
                    checkComplete();
                  }, 200);
                  
                  // 타임아웃 안전장치
                  setTimeout(() => {
                    setIsScrolling(false);
                    setActiveSection(item.id);
                    if (rootContainerRef.current) {
                      rootContainerRef.current.style.scrollSnapType = 'y mandatory';
                    }
                  }, 2000);
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
                  className="text-[10px] lg:text-xs font-medium transition-all duration-300"
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
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 pb-12"
        ref={(el) => { sectionRefs.current['hero'] = el; }}
        data-section-id="hero"
        style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always' }}
      >
        <div className="max-w-6xl mx-auto text-center w-full">
          {/* 메인 타이틀 */}
          <h1 
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 leading-[1.05] tracking-[-0.03em] transition-all duration-1000 px-2 ${
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
          
          <div 
            className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-6 transition-all duration-1000 px-2 ${
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
            className={`mb-8 max-w-2xl mx-auto space-y-2 transition-all duration-1000 delay-100 px-4 ${
              visibleSections.has('hero')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <p 
              className="text-base sm:text-lg md:text-xl leading-relaxed"
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
              className="text-sm sm:text-base leading-relaxed"
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
        className="relative py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 min-h-screen flex items-center"
        ref={(el) => { sectionRefs.current['features'] = el; }}
        data-section-id="features"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'center',
          scrollSnapStop: 'always',
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

      {/* 프로젝트 섹션 */}
      <section 
        id="gallery"
        className="relative py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 min-h-screen flex items-center"
        ref={(el) => { sectionRefs.current['gallery'] = el; }}
        data-section-id="gallery"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'center',
          scrollSnapStop: 'always',
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div 
            className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${
              visibleSections.has('gallery')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl mb-3"
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
              className="text-base sm:text-lg"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {[
              { icon: "🌐", title: "SITE", desc: "DORI-AI", status: "진행중", color: "#3b82f6", span: 2 },
              { icon: "📱", title: "APPLICATION", desc: "DORI (Android 작업중)", status: "작업중", color: "#8b5cf6", span: 1 },
              { icon: "🎬", title: "YOUTUBE SHORTS", desc: "미정", status: "미정", color: "#06b6d4", span: 1 },
              { icon: "🎨", title: "YOUTUBE ANIMATION", desc: "미정", status: "미정", color: "#10b981", span: 2 },
              { icon: "⚙️", title: "MAKE / N8N", desc: "미정", status: "미정", color: "#f59e0b", span: 2 },
              { icon: "🛒", title: "GUMROAD", desc: "미정", status: "미정", color: "#ec4899", span: 1 },
            ].map((item, idx) => {
              const CardContent = (
                <div
                  className={`group relative rounded-3xl overflow-hidden transition-all duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-2 ${
                    visibleSections.has('gallery')
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  } ${item.span === 2 ? 'md:col-span-2' : ''}`}
                  style={{
                    transitionDelay: `${idx * 50}ms`,
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : '#ffffff',
                    boxShadow: isDark 
                      ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
                      : '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                >
                {/* 좌측 세로 액센트 라인 */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                    background: `linear-gradient(180deg, ${item.color}, ${item.color}80)`,
                  }}
                />
                
                {/* 배경 그라데이션 - 우측 하단에서 시작 */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 85% 85%, ${item.color}10 0%, transparent 50%)`,
                  }}
                />

                <div className="p-7 h-full flex flex-col relative z-10">
                  {/* 상태 태그 - 우측 상단 */}
                  <div 
                    className="absolute top-5 right-5 px-3 py-1 rounded-full text-[10px] font-medium tracking-wide backdrop-blur-md transition-all duration-400"
                    style={{
                      background: item.status === '완료' 
                        ? (isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)')
                        : item.status === '작업중' || item.status === '진행중'
                        ? (isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.1)')
                        : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
                      color: item.status === '완료'
                        ? '#10b981'
                        : item.status === '작업중' || item.status === '진행중'
                        ? '#3b82f6'
                        : (isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)'),
                      border: `1px solid ${item.status === '완료' 
                        ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)')
                        : item.status === '작업중' || item.status === '진행중'
                        ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)')
                        : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')}`,
                    }}
                  >
                    {item.status}
                  </div>

                  {/* 아이콘과 제목을 한 줄에 */}
                  <div className="flex items-start gap-4 mb-5">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-500 group-hover:scale-105 group-hover:rotate-3"
                      style={{
                        background: isDark 
                          ? `rgba(${item.color === '#3b82f6' ? '59, 130, 246' : item.color === '#8b5cf6' ? '139, 92, 246' : item.color === '#06b6d4' ? '6, 182, 212' : item.color === '#10b981' ? '16, 185, 129' : item.color === '#f59e0b' ? '245, 158, 11' : '236, 72, 153'}, 0.1)`
                          : `${item.color}0d`,
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : `${item.color}15`}`,
                      }}
                    >
                      {item.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-lg mb-1 font-bold leading-tight"
                        style={{
                          color: isDark ? '#ffffff' : '#1d1d1f',
                          fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {item.title}
                      </h3>
                    </div>
                  </div>
                  
                  <p 
                    className="text-sm leading-relaxed flex-grow mb-5"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.55)',
                      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                      fontWeight: 400,
                      letterSpacing: '-0.01em',
                      lineHeight: '1.65',
                    }}
                  >
                    {item.desc}
                  </p>
                  
                  <div 
                    className="flex items-center gap-2 mt-auto text-xs font-medium transition-all duration-400 group-hover:gap-2.5"
                    style={{
                      color: item.color,
                    }}
                  >
                    <span className="tracking-wide">자세히 보기</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-400 text-base">→</span>
                  </div>
                </div>
                
                {/* 호버 시 부드러운 그림자 */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none rounded-3xl"
                  style={{
                    boxShadow: isDark 
                      ? `0 12px 40px rgba(${item.color === '#3b82f6' ? '59, 130, 246' : item.color === '#8b5cf6' ? '139, 92, 246' : item.color === '#06b6d4' ? '6, 182, 212' : item.color === '#10b981' ? '16, 185, 129' : item.color === '#f59e0b' ? '245, 158, 11' : '236, 72, 153'}, 0.2)`
                      : `0 12px 40px ${item.color}18`,
                  }}
                />
                </div>
              );

              // 첫 번째 항목(SITE: DORI-AI)만 클릭 가능하도록
              if (idx === 0) {
                return (
                  <div 
                    key={idx}
                    onClick={() => window.location.href = '/project'}
                    style={{ cursor: 'pointer' }}
                  >
                    {CardContent}
                  </div>
                );
              }

              return <div key={idx}>{CardContent}</div>;
            })}
          </div>
        </div>
      </section>

      {/* 커뮤니티 섹션 */}
      <section 
        id="testimonials"
        className="relative py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 min-h-screen flex items-center"
        ref={(el) => { sectionRefs.current['testimonials'] = el; }}
        data-section-id="testimonials"
        style={{
          backgroundColor: isDark ? '#000000' : '#f5f5f7',
          scrollSnapAlign: 'center',
          scrollSnapStop: 'always',
        }}
      >
        <div className="max-w-6xl mx-auto w-full">
          <div 
            className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${
              visibleSections.has('testimonials')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl mb-3"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: "김철수", role: "디자이너", text: "정말 놀라운 경험이었습니다. 직관적이고 세련된 인터페이스가 인상적이에요." },
              { name: "이영희", role: "개발자", text: "AI 도구 탐색이 이렇게 쉬울 줄 몰랐어요. 정말 유용한 플랫폼입니다." },
              { name: "박민수", role: "기획자", text: "커뮤니티가 활발하고 정보가 풍부해서 정말 만족스럽습니다." },
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
        className="relative py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 min-h-screen flex items-center"
        ref={(el) => { sectionRefs.current['faq'] = el; }}
        data-section-id="faq"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          scrollSnapAlign: 'center',
          scrollSnapStop: 'always',
        }}
      >
        <div className="max-w-4xl mx-auto w-full">
          <div 
            className={`text-center mb-8 sm:mb-12 transition-all duration-1000 ${
              visibleSections.has('faq')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl mb-3"
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

          <div className="space-y-3">
            {[
              { q: "DORI-AI는 어떤 서비스인가요?", a: "DORI-AI는 AI 도구 탐색, 인사이트 제공, 교육 자료, 커뮤니티 등 AI 관련 정보를 한 곳에서 제공하는 통합 플랫폼입니다. AI가 처음이어도 쉽게 시작할 수 있도록 도와드립니다." },
              { q: "회원가입이 필요한가요?", a: "기본 기능은 회원가입 없이도 이용 가능합니다. 커뮤니티 참여, 건의사항 제출, 개인화된 추천 등의 기능을 이용하려면 회원가입이 필요합니다." },
              { q: "어떤 AI 도구를 추천하시나요?", a: "사용 목적에 따라 다릅니다. 텍스트 생성에는 ChatGPT, 이미지 생성에는 Midjourney나 DALL-E, 코딩에는 GitHub Copilot을 추천합니다. 각 도구의 상세 정보는 AI 도구 페이지에서 확인하실 수 있습니다." },
              { q: "무료로 사용할 수 있나요?", a: "네, DORI-AI 플랫폼 자체는 완전 무료입니다. 다만 일부 추천하는 외부 AI 도구들은 유료 플랜이 있을 수 있으며, 각 도구의 가격 정보는 해당 페이지에서 확인하실 수 있습니다." },
              { q: "건의사항이나 버그를 제보하려면 어떻게 하나요?", a: "건의사항 페이지에서 자유롭게 의견을 남겨주실 수 있습니다. 버그 제보, 기능 요청, UI/디자인 개선 등 모든 의견을 환영합니다. 빠른 검토 후 반영하도록 노력하겠습니다." },
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
      `}</style>
    </div>
  );
}
