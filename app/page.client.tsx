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
  const [comingSoonModal, setComingSoonModal] = useState<{ open: boolean; title: string }>({ open: false, title: '' });
  const [notificationEmail, setNotificationEmail] = useState('');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const rootContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = useRef(false);
  const currentSectionIndexRef = useRef(0);
  const isWheelingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    
    // 스크롤 스냅 강제 활성화
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      
      // html에 스크롤 스냅 설정 (스크롤이 html에서 일어남)
      html.style.setProperty('scroll-snap-type', 'y mandatory', 'important');
      html.style.setProperty('scroll-behavior', 'smooth', 'important');
      
      // 모든 섹션에 스크롤 스냅 정렬 강제 적용
      const applyScrollSnap = () => {
        const sections = ['hero', 'features', 'gallery', 'testimonials', 'faq'];
        sections.forEach(sectionId => {
          const section = document.getElementById(sectionId);
          if (section) {
            section.style.setProperty('scroll-snap-align', 'center', 'important');
            section.style.setProperty('scroll-snap-stop', 'always', 'important');
            section.style.setProperty('scroll-margin-top', '0', 'important');
            section.style.setProperty('scroll-margin-bottom', '0', 'important');
          }
        });
        
        // 모든 section 태그에도 적용
        const allSections = document.querySelectorAll('section[id]');
        allSections.forEach(section => {
          (section as HTMLElement).style.setProperty('scroll-snap-align', 'center', 'important');
          (section as HTMLElement).style.setProperty('scroll-snap-stop', 'always', 'important');
        });
      };
      
      // 즉시 적용
      applyScrollSnap();
      
      // DOM이 완전히 로드된 후 다시 적용
      setTimeout(applyScrollSnap, 100);
      setTimeout(applyScrollSnap, 500);
    }
    
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
      
      // 스크롤 스냅 구현 - 스크롤이 멈출 때 가장 가까운 섹션으로 이동
      const handleScrollSnap = () => {
        if (isScrolling || isUserScrollingRef.current) return;
        
        const sections = ['hero', 'features', 'gallery', 'testimonials', 'faq'];
        const viewportCenter = window.innerHeight / 2;
        let closestSection: string | null = null;
        let closestDistance = Infinity;
        let closestElement: HTMLElement | null = null;
        
        sections.forEach(sectionId => {
          const el = document.getElementById(sectionId);
          if (!el) return;
          
          const rect = el.getBoundingClientRect();
          const sectionCenter = rect.top + rect.height / 2;
          const distance = Math.abs(sectionCenter - viewportCenter);
          
          // 섹션이 화면에 보이는 경우
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            if (distance < closestDistance) {
              closestDistance = distance;
              closestSection = sectionId;
              closestElement = el;
            }
          }
        });
        
        // 가장 가까운 섹션이 있고, 중앙에서 일정 거리 이상 떨어져 있으면 스냅
        if (closestElement && closestDistance > 50) {
          setIsScrolling(true);
          isUserScrollingRef.current = true;
          
          const targetY = closestElement.offsetTop + closestElement.offsetHeight / 2 - window.innerHeight / 2;
          
          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: 'smooth'
          });
          
          setTimeout(() => {
            setIsScrolling(false);
            isUserScrollingRef.current = false;
          }, 500);
        }
      };
      
      const handleScrollWithDebounce = () => {
        handleScroll();
        
        // 스크롤 스냅 트리거
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
          handleScroll();
          handleScrollSnap();
        }, 150);
      };
      
      // 휠 이벤트 가로채서 섹션 단위로 스크롤
      let wheelTimeout: NodeJS.Timeout;
      const handleWheel = (e: WheelEvent) => {
        if (isScrolling || isWheelingRef.current) {
          e.preventDefault();
          return;
        }
        
        const sections = ['hero', 'features', 'gallery', 'testimonials', 'faq'];
        const currentScroll = window.scrollY;
        const viewportHeight = window.innerHeight;
        
        // 현재 섹션 찾기
        let currentIndex = 0;
        sections.forEach((sectionId, index) => {
          const el = document.getElementById(sectionId);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= viewportHeight / 2 && rect.bottom >= viewportHeight / 2) {
              currentIndex = index;
            }
          }
        });
        
        // 스크롤 방향에 따라 다음/이전 섹션으로 이동
        if (e.deltaY > 0 && currentIndex < sections.length - 1) {
          // 아래로 스크롤
          isWheelingRef.current = true;
          setIsScrolling(true);
          const nextSection = document.getElementById(sections[currentIndex + 1]);
          if (nextSection) {
            const targetY = nextSection.offsetTop + nextSection.offsetHeight / 2 - viewportHeight / 2;
            window.scrollTo({
              top: Math.max(0, targetY),
              behavior: 'smooth'
            });
            currentSectionIndexRef.current = currentIndex + 1;
          }
          setTimeout(() => {
            isWheelingRef.current = false;
            setIsScrolling(false);
          }, 800);
          e.preventDefault();
        } else if (e.deltaY < 0 && currentIndex > 0) {
          // 위로 스크롤
          isWheelingRef.current = true;
          setIsScrolling(true);
          const prevSection = document.getElementById(sections[currentIndex - 1]);
          if (prevSection) {
            const targetY = prevSection.offsetTop + prevSection.offsetHeight / 2 - viewportHeight / 2;
            window.scrollTo({
              top: Math.max(0, targetY),
              behavior: 'smooth'
            });
            currentSectionIndexRef.current = currentIndex - 1;
          }
          setTimeout(() => {
            isWheelingRef.current = false;
            setIsScrolling(false);
          }, 800);
          e.preventDefault();
        }
      };
      
      window.addEventListener("scroll", handleScrollWithDebounce, { passive: true });
      window.addEventListener("wheel", handleWheel, { passive: false });
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
        window.removeEventListener("wheel", handleWheel);
        window.removeEventListener("mousemove", handleMouseMove);
        clearTimeout(timeoutId);
        clearTimeout(scrollTimeout);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        if (wheelTimeout) clearTimeout(wheelTimeout);
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
        scrollSnapType: 'y mandatory',
      }}
    >
      {/* 좌측 사이드바 네비게이션 */}
      <aside 
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden lg:block"
        style={{
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
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 pb-12 overflow-hidden"
        ref={(el) => { sectionRefs.current['hero'] = el; }}
        data-section-id="hero"
        style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always' }}
      >
        {/* 배경 그라데이션 애니메이션 */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.3), transparent 70%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(139, 92, 246, 0.3), transparent 70%)'
                : 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37, 99, 235, 0.15), transparent 70%), radial-gradient(ellipse 80% 50% at 50% 100%, rgba(124, 58, 237, 0.15), transparent 70%)',
            }}
          />
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] animate-pulse"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)'
                : 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 70%)',
              animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto text-center w-full relative z-10">
          {/* 메인 카피 */}
          <h1 
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-6 leading-[1.1] tracking-[-0.03em] transition-all duration-1000 px-2 ${
              visibleSections.has('hero')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: '1.1',
            }}
          >
            AI와 함께하는 작은 시작,<br className="hidden sm:block" />
            <span 
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(90deg, #60a5fa 0%, #818cf8 25%, #a78bfa 50%, #818cf8 75%, #60a5fa 100%)'
                  : 'linear-gradient(90deg, #2563eb 0%, #4f46e5 25%, #7c3aed 50%, #4f46e5 75%, #2563eb 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DORI-AI
            </span>
            가 앞당깁니다.
          </h1>

          {/* 서브 카피 */}
          <p 
            className={`text-base sm:text-lg md:text-xl lg:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-100 px-4 ${
              visibleSections.has('hero')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
              fontWeight: 400,
              letterSpacing: '-0.01em',
              lineHeight: '1.7',
            }}
          >
            당신에게 꼭 필요한 AI 도구 탐색부터 실무 활용 인사이트까지,<br className="hidden md:block" />
            입문자를 위한 가장 친절한 가이드.
          </p>

          {/* CTA 버튼 */}
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-200 ${
              visibleSections.has('hero')
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <Link
              href="/ai-tools"
              className="group relative px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#ffffff',
                boxShadow: isDark
                  ? '0 4px 20px rgba(59, 130, 246, 0.4)'
                  : '0 4px 20px rgba(37, 99, 235, 0.3)',
              }}
            >
              <span className="relative z-10">AI 도구 탐색하기</span>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #60a5fa, #a78bfa)'
                    : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                }}
              />
            </Link>
            
            <Link
              href="/community"
              className="group px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'transparent',
                border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                color: isDark ? '#ffffff' : '#1d1d1f',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)';
                e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              커뮤니티 참여
            </Link>
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

      {/* AI 도구 큐레이션 TOP 3 섹션 */}
      <section 
        id="ai-tools-curation"
        className="relative py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6"
        style={{
          backgroundColor: isDark ? '#000000' : '#ffffff',
          fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl mb-4 font-bold"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: '1.1',
              }}
            >
              인기 AI 도구 TOP 3
            </h2>
            <p 
              className="text-base sm:text-lg max-w-2xl mx-auto"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                lineHeight: '1.6',
              }}
            >
              가장 많이 사용되는 AI 도구들을 만나보세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Midjourney',
                category: '이미지 생성',
                description: '텍스트로부터 고품질 이미지를 생성하는 AI 도구',
                tags: ['#이미지', '#생산성', '#디자인'],
                icon: '🎨',
                color: '#10b981',
                link: '/ai-tools',
              },
              {
                name: 'ChatGPT',
                category: '텍스트',
                description: '대화형 AI 어시스턴트로 다양한 작업을 도와주는 도구',
                tags: ['#텍스트', '#생산성', '#자동화'],
                icon: '💬',
                color: '#3b82f6',
                link: '/ai-tools',
              },
              {
                name: 'n8n',
                category: '자동화',
                description: '워크플로우 자동화를 위한 강력한 노코드 플랫폼',
                tags: ['#자동화', '#워크플로우', '#생산성'],
                icon: '⚙️',
                color: '#8b5cf6',
                link: '/ai-tools',
              },
            ].map((tool, idx) => (
              <Link
                key={idx}
                href={tool.link}
                className="group relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: isDark 
                    ? 'rgba(255, 255, 255, 0.02)'
                    : '#ffffff',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                  boxShadow: isDark
                    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                    : '0 4px 20px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: isDark
                        ? `rgba(${tool.color === '#10b981' ? '16, 185, 129' : tool.color === '#3b82f6' ? '59, 130, 246' : '139, 92, 246'}, 0.15)`
                        : `${tool.color}15`,
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : `${tool.color}20`}`,
                    }}
                  >
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-xs font-medium mb-1"
                      style={{
                        color: tool.color,
                        fontWeight: 600,
                      }}
                    >
                      {tool.category}
                    </div>
                    <h3 
                      className="text-lg font-bold mb-1"
                      style={{
                        color: isDark ? '#ffffff' : '#1d1d1f',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {tool.name}
                    </h3>
                  </div>
                </div>
                
                <p 
                  className="text-sm mb-4 leading-relaxed"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 400,
                    letterSpacing: '-0.01em',
                    lineHeight: '1.6',
                  }}
                >
                  {tool.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {tool.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="px-2.5 py-1 rounded-md text-[10px] font-medium"
                      style={{
                        background: isDark 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        color: isDark 
                          ? 'rgba(255, 255, 255, 0.6)'
                          : 'rgba(0, 0, 0, 0.5)',
                        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
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
                className={`group relative rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                  visibleSections.has('features')
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${idx * 50}ms`,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e5e5e7'}`,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                  boxShadow: isDark
                    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                    : '0 4px 20px rgba(0, 0, 0, 0.08)',
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
              { icon: "🌐", title: "SITE", desc: "DORI-AI", status: "진행중", color: "#3b82f6", span: 2, isComingSoon: false },
              { icon: "📱", title: "APPLICATION", desc: "DORI (Android 작업중)", status: "작업중", color: "#8b5cf6", span: 1, isComingSoon: false },
              { icon: "🎬", title: "YOUTUBE SHORTS", desc: "Coming Soon", status: "Coming Soon", color: "#06b6d4", span: 1, isComingSoon: true },
              { icon: "🎨", title: "YOUTUBE ANIMATION", desc: "Coming Soon", status: "Coming Soon", color: "#10b981", span: 2, isComingSoon: true },
              { icon: "⚙️", title: "MAKE / N8N", desc: "Coming Soon", status: "Coming Soon", color: "#f59e0b", span: 2, isComingSoon: true },
              { icon: "🛒", title: "GUMROAD", desc: "Coming Soon", status: "Coming Soon", color: "#ec4899", span: 1, isComingSoon: true },
            ].map((item, idx) => {
              const CardContent = (
                <div
                  className={`group relative rounded-3xl overflow-hidden transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02] ${
                    visibleSections.has('gallery')
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  } ${item.span === 2 ? 'md:col-span-2' : ''}`}
                  style={{
                    transitionDelay: `${idx * 50}ms`,
                    border: item.isComingSoon 
                      ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`
                      : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
                    backgroundColor: item.isComingSoon
                      ? isDark 
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(255, 255, 255, 0.8)'
                      : isDark ? 'rgba(255, 255, 255, 0.015)' : '#ffffff',
                    backdropFilter: item.isComingSoon ? 'blur(20px)' : 'none',
                    WebkitBackdropFilter: item.isComingSoon ? 'blur(20px)' : 'none',
                    boxShadow: item.isComingSoon
                      ? isDark
                        ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                        : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                      : isDark 
                        ? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
                        : '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
                  }}
                  onClick={() => {
                    if (item.isComingSoon) {
                      setComingSoonModal({ open: true, title: item.title });
                    }
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
                        : item.status === 'Coming Soon'
                        ? (isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)')
                        : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'),
                      color: item.status === '완료'
                        ? '#10b981'
                        : item.status === '작업중' || item.status === '진행중'
                        ? '#3b82f6'
                        : item.status === 'Coming Soon'
                        ? '#a78bfa'
                        : (isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.45)'),
                      border: `1px solid ${item.status === '완료' 
                        ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)')
                        : item.status === '작업중' || item.status === '진행중'
                        ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)')
                        : item.status === 'Coming Soon'
                        ? (isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)')
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
                      color: item.isComingSoon ? (isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)') : item.color,
                    }}
                  >
                    <span className="tracking-wide">{item.isComingSoon ? '오픈 알림 신청' : '자세히 보기'}</span>
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

          <div className="text-center">
            <p 
              className="text-base sm:text-lg"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 400,
                letterSpacing: '-0.01em',
              }}
            >
              커뮤니티에서 다양한 이야기를 나눠보세요
            </p>
            <Link 
              href="/community"
              className="inline-block mt-6 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: isDark ? '#ffffff' : '#1d1d1f',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}
            >
              커뮤니티로 이동 →
            </Link>
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


      {/* Coming Soon 모달 */}
      {comingSoonModal.open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setComingSoonModal({ open: false, title: '' })}
        >
          <div 
            className="relative w-full max-w-md rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: isDark 
                ? 'rgba(15, 15, 15, 0.95)'
                : 'rgba(255, 255, 255, 0.98)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              boxShadow: isDark
                ? '0 20px 60px rgba(0, 0, 0, 0.5)'
                : '0 20px 60px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setComingSoonModal({ open: false, title: '' })}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-110"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              }}
            >
              ✕
            </button>
            
            <h3 
              className="text-2xl font-bold mb-2"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {comingSoonModal.title} 오픈 알림
            </h3>
            
            <p 
              className="text-sm mb-6"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                lineHeight: '1.6',
              }}
            >
              서비스가 오픈되면 이메일로 알려드리겠습니다.
            </p>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (notificationEmail) {
                  // 이메일 저장 로직 (localStorage 또는 API)
                  const notifications = JSON.parse(localStorage.getItem('dori_notifications') || '[]');
                  notifications.push({
                    email: notificationEmail,
                    service: comingSoonModal.title,
                    date: new Date().toISOString(),
                  });
                  localStorage.setItem('dori_notifications', JSON.stringify(notifications));
                  alert('알림 신청이 완료되었습니다!');
                  setComingSoonModal({ open: false, title: '' });
                  setNotificationEmail('');
                }
              }}
              className="space-y-4"
            >
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="이메일 주소를 입력하세요"
                required
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  color: isDark ? '#ffffff' : '#1d1d1f',
                  fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                }}
              />
              
              <button
                type="submit"
                className="w-full px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                    : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  color: '#ffffff',
                  boxShadow: isDark
                    ? '0 4px 20px rgba(59, 130, 246, 0.4)'
                    : '0 4px 20px rgba(37, 99, 235, 0.3)',
                }}
              >
                알림 받기
              </button>
            </form>
          </div>
        </div>
      )}

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

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-scroll {
          animation: scroll 2s ease-in-out infinite;
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }

        details summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </div>
  );
}
