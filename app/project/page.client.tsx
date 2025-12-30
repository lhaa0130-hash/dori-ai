"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  date?: string;
  description?: string;
  [key: string]: any;
}

interface ProjectClientProps {
  initialProjects: Project[];
}

const PROJECTS = [
  { id: 'site', title: 'SITE: DORI-AI(진행중)', status: 'active' },
  { id: 'app', title: 'APPLICATION: DORI(Android 작업중)', status: 'progress' },
  { id: 'shorts', title: 'YOUTUBE SHORTS: 미정', status: 'pending' },
  { id: 'animation', title: 'YOUTUBE ANIMATION : 미정', status: 'pending' },
  { id: 'make', title: 'MAKE / N8N: 미정', status: 'pending' },
  { id: 'gumroad', title: 'GUMROAD: 미정', status: 'pending' },
];

// 프로젝트별 마인드맵 설정
const MINDMAP_CONFIG: {
  [key: string]: {
    centerTitle: string;
    centerSubtitle: string;
    centerStatus: string;
    centerStatusColor: string;
    centerTech: string[];
    items: Array<{
      id: string;
      title: string;
      projectId: string;
      category: string;
    }>;
  };
} = {
  site: {
    centerTitle: 'SITE: DORI-AI',
    centerSubtitle: 'PROJECT',
    centerStatus: '진행중',
    centerStatusColor: '#10b981',
    centerTech: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    items: [
      { id: 'overview', title: '개요 및 개발 배경', projectId: 'project01-1', category: 'OVERVIEW' },
      { id: 'method', title: '개발 방법 및 제작 구조', projectId: 'project01-2', category: 'DEVELOPMENT' },
      { id: 'future', title: '향후 계획 및 확장 방향', projectId: 'project01-3', category: 'ROADMAP' },
    ],
  },
  app: {
    centerTitle: 'APPLICATION: DORI',
    centerSubtitle: 'PROJECT',
    centerStatus: 'Android 작업중',
    centerStatusColor: '#3b82f6',
    centerTech: ['Android', 'Kotlin', 'Jetpack Compose'],
    items: [
      { id: 'overview', title: '개요 및 개발 배경', projectId: 'project02-1', category: 'OVERVIEW' },
      { id: 'method', title: '개발 방법 및 제작 구조', projectId: 'project02-2', category: 'DEVELOPMENT' },
      { id: 'future', title: '향후 계획 및 확장 방향', projectId: 'project02-3', category: 'ROADMAP' },
    ],
  },
};

export default function ProjectClient({ initialProjects }: ProjectClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeProject, setActiveProject] = useState('site');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // 연결선 그리기 함수
    const drawConnections = () => {
      if (typeof window === 'undefined') return;
      
      requestAnimationFrame(() => {
        const container = document.getElementById('mindmap-container');
        const centerBox = document.getElementById('center-box');
        const svg = document.getElementById('connection-svg');
        
        if (!container || !centerBox || !svg) return;
        
        const containerRect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const centerRect = centerBox.getBoundingClientRect();
        
        // 중앙 박스의 오른쪽 중앙점 (SVG 좌표계 기준)
        const centerX = centerRect.right - svgRect.left;
        const centerY = centerRect.top - svgRect.top + centerRect.height / 2;
        
        const currentConfig = MINDMAP_CONFIG[activeProject];
        if (!currentConfig) return;
        
        currentConfig.items.forEach((item) => {
          const box = document.getElementById(`box-${item.id}`);
          if (!box) return;
          
          const boxRect = box.getBoundingClientRect();
          // 오른쪽 박스의 왼쪽 중앙점 (SVG 좌표계 기준)
          const boxX = boxRect.left - svgRect.left;
          const boxY = boxRect.top - svgRect.top + boxRect.height / 2;
          
          // SVG 경로 계산
          const startX = centerX;
          const startY = centerY;
          const endX = boxX;
          const endY = boxY;
          
          // 곡선 제어점 (부드러운 곡선)
          const dx = endX - startX;
          const controlX1 = startX + Math.abs(dx) * 0.5;
          const controlY1 = startY;
          const controlX2 = endX - Math.abs(dx) * 0.15;
          const controlY2 = endY;
          
          const path = document.getElementById(`line-${item.id}`);
          if (path) {
            path.setAttribute('d', `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`);
          }
        });
      });
    };
    
    // 초기 그리기 (여러 번 시도하여 DOM이 완전히 렌더링된 후 그리기)
    const timeouts = [
      setTimeout(drawConnections, 100),
      setTimeout(drawConnections, 300),
      setTimeout(drawConnections, 500),
      setTimeout(drawConnections, 800),
      setTimeout(drawConnections, 1200),
      setTimeout(drawConnections, 2000),
    ];
    
    // IntersectionObserver로 컨테이너가 보일 때 다시 그리기
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(drawConnections, 50);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    const container = document.getElementById('mindmap-container');
    if (container) {
      observer.observe(container);
    }
    
    const handleResize = () => {
      setTimeout(drawConnections, 100);
    };
    
    const handleScroll = () => {
      requestAnimationFrame(drawConnections);
    };
    
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        timeouts.forEach(clearTimeout);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
        if (container) {
          observer.unobserve(container);
        }
      };
    }, [mounted, activeProject]);

  const isDark = mounted && theme === 'dark';
  const currentMindmap = MINDMAP_CONFIG[activeProject] || MINDMAP_CONFIG.site;

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 좌측 사이드바 */}
      <aside 
        className="fixed left-0 z-50 hidden lg:block"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <nav className="ml-8">
          <div 
            className="flex flex-col gap-2 p-4 rounded-2xl backdrop-blur-xl transition-all duration-500 min-w-[200px]"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            }}
          >
            {PROJECTS.map((project) => {
              const isActive = activeProject === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => setActiveProject(project.id)}
                  className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 text-left"
                  style={{
                    backgroundColor: isActive
                      ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                      : 'transparent',
                  }}
                >
                  <div 
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                      isActive ? 'scale-150' : 'scale-100'
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? (isDark ? '#ffffff' : '#000000')
                        : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                    }}
                  />
                  <span 
                    className="text-xs font-medium transition-all duration-300"
                    style={{
                      color: isActive
                        ? (isDark ? '#ffffff' : '#000000')
                        : (isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                      transform: isActive ? 'translateX(4px)' : 'translateX(0)',
                    }}
                  >
                    {project.title}
                  </span>
                </button>
              );
            })}
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
      <section className="relative pt-20 pb-12 px-6 lg:pl-12 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto animate-[fadeInUp_0.8s_ease-out_forwards]">
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
            style={{ 
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            Project
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
            데이터와 인사이트로 더 나은 결정을 내리세요.
          </p>
        </div>
      </section>
      
      {/* 마인드맵 섹션 */}
      <section 
        className="container max-w-7xl mx-auto px-4 md:px-6 lg:pl-12 pb-24 relative"
      >
        <div className="flex items-center justify-center min-h-[600px] pt-20">
          <div className="relative w-full" style={{ maxWidth: '1200px', height: '600px' }} id="mindmap-container">
            {/* 중앙 박스 - 동적 표시 */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10" id="center-box">
              <div 
                className="relative px-10 py-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] group"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                  border: `2px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)'}`,
                  boxShadow: isDark 
                    ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                    : '0 8px 32px rgba(99, 102, 241, 0.1), 0 0 0 1px rgba(99, 102, 241, 0.05)',
                }}
              >
                {/* 상태 배지 */}
                <div 
                  className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: currentMindmap.centerStatusColor,
                    color: '#ffffff',
                    boxShadow: `0 2px 8px ${currentMindmap.centerStatusColor}40`,
                  }}
                >
                  {currentMindmap.centerStatus}
                </div>
                
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: '#6366f1',
                      boxShadow: '0 0 8px rgba(99, 102, 241, 0.6)',
                    }}
                  />
                  <span 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: isDark ? 'rgba(99, 102, 241, 0.8)' : 'rgba(99, 102, 241, 0.7)',
                    }}
                  >
                    {currentMindmap.centerSubtitle}
                  </span>
                </div>
                
                <h2 
                  className="text-2xl md:text-3xl font-bold"
                  style={{
                    color: isDark ? '#ffffff' : '#1d1d1f',
                    fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: '1.2',
                  }}
                >
                  {currentMindmap.centerTitle}
                </h2>
                
                <div className="mt-4 flex items-center gap-4 text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                  {currentMindmap.centerTech.map((tech, idx) => (
                    <span key={tech}>
                      {tech}
                      {idx < currentMindmap.centerTech.length - 1 && <span className="mx-2">•</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 연결선 SVG - 동적 위치 계산 */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              style={{ overflow: 'visible' }}
              id="connection-svg"
              preserveAspectRatio="none"
            >
              {currentMindmap.items.map((item, index) => (
                <path
                  key={item.id}
                  id={`line-${item.id}`}
                  fill="none"
                  stroke={isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {/* 오른쪽 박스들 */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 flex flex-col gap-8">
              {currentMindmap.items.map((item, index) => (
                <div
                  key={item.id}
                  className="relative group"
                  id={`box-${item.id}`}
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                    width: '380px',
                  }}
                >
                  <Link href={`/project/${item.projectId}`}>
                    <div 
                      className="relative px-5 py-3.5 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer border-l-4"
                      style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                        borderLeftColor: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.4)',
                        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                        borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                        boxShadow: isDark 
                          ? '0 2px 12px rgba(0, 0, 0, 0.15)'
                          : '0 2px 12px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      {/* 카테고리 라벨 */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.5)',
                          }}
                        />
                        <span 
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            color: isDark ? 'rgba(99, 102, 241, 0.7)' : 'rgba(99, 102, 241, 0.6)',
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                      
                      <p 
                        className="text-sm font-semibold leading-tight"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
                          fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                          fontWeight: 600,
                          letterSpacing: '-0.02em',
                          lineHeight: '1.3',
                        }}
                      >
                        {item.title}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
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
