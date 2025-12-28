"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
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
  initialProjects?: Project[];
}

export default function ProjectClient({ initialProjects = [] }: ProjectClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodePositions, setNodePositions] = useState<{ [key: string]: { 
    centerX: number; 
    centerY: number;
    rightX: number;
    leftX: number;
    topY: number;
    bottomY: number;
  } }>({});

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!containerRef.current || !mounted) return;
    
    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const positions: { [key: string]: { 
        centerX: number; 
        centerY: number;
        rightX: number;
        leftX: number;
        topY: number;
        bottomY: number;
      } } = {};
      const nodes = container.querySelectorAll('[data-node-id]');
      
      nodes.forEach((node) => {
        const nodeId = node.getAttribute('data-node-id');
        if (nodeId) {
          const rect = node.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const relativeLeft = rect.left - containerRect.left;
          const relativeTop = rect.top - containerRect.top;
          
          positions[nodeId] = {
            centerX: relativeLeft + rect.width / 2,
            centerY: relativeTop + rect.height / 2,
            rightX: relativeLeft + rect.width,
            leftX: relativeLeft,
            topY: relativeTop,
            bottomY: relativeTop + rect.height,
          };
        }
      });
      
      setNodePositions(positions);
    };
    
    // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 위치 계산
    const timeoutId = setTimeout(updatePositions, 100);
    window.addEventListener('resize', updatePositions);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePositions);
    };
  }, [mounted]);

  const isDark = mounted && theme === 'dark';

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
            {[
              { title: 'SITE : DORI-AI', href: '/project', isActive: true },
              { title: 'APPLICATION : DORI(Android 작업중)', href: null, isActive: false },
              { title: 'YOUTUBE SHORTS : 미정', href: null, isActive: false },
              { title: 'YOUTUBE ANIMATION : 미정', href: null, isActive: false },
              { title: 'MAKE / N8N : 미정', href: null, isActive: false },
              { title: 'GUMROAD : 미정', href: null, isActive: false },
            ].map((item, idx) => {
              const content = (
                <>
                  <div 
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: item.isActive 
                        ? (isDark ? '#ffffff' : '#000000')
                        : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'),
                      transform: item.isActive ? 'scale(1.5)' : 'scale(1)',
                    }}
                  />
                  <span 
                    className="text-xs font-medium transition-all duration-300"
                    style={{
                      color: item.isActive 
                        ? (isDark ? '#ffffff' : '#000000')
                        : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
                      transform: item.isActive ? 'translateX(4px)' : 'translateX(0)',
                    }}
                  >
                    {item.title}
                  </span>
                </>
              );

              if (item.href) {
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer`}
                    style={{
                      backgroundColor: item.isActive 
                        ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
                        : 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={idx}
                  className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 cursor-not-allowed opacity-60"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>

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
            데이터와 인사이트로 더 나은 결정을 내리세요
          </p>
        </div>
      </section>

      {/* 메인 콘텐츠 - 노드 구조 */}
      <section className="w-full px-6 lg:pl-12 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* 노드 컨테이너 */}
          <div 
            ref={containerRef}
            className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center"
            style={{
              minHeight: '500px',
            }}
          >
            {/* 연결선 SVG */}
            {Object.keys(nodePositions).length > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{
                  zIndex: 1,
                  width: '100%',
                  height: '100%',
                }}
              >
                {/* 개요 및 개발 배경 연결선 (곡선) */}
                {nodePositions['center'] && nodePositions['overview'] && (
                  <path
                    d={`M ${nodePositions['center'].rightX} ${nodePositions['center'].centerY} Q ${(nodePositions['center'].rightX + nodePositions['overview'].leftX) / 2} ${nodePositions['overview'].centerY - 20}, ${nodePositions['overview'].leftX} ${nodePositions['overview'].centerY}`}
                    stroke={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                  />
                )}
                {/* 개발 방법 및 제작 구조 연결선 (직선) */}
                {nodePositions['center'] && nodePositions['development'] && (
                  <line
                    x1={nodePositions['center'].rightX}
                    y1={nodePositions['center'].centerY}
                    x2={nodePositions['development'].leftX}
                    y2={nodePositions['development'].centerY}
                    stroke={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                  />
                )}
                {/* 향후 계획 및 확장 방향 연결선 (곡선) */}
                {nodePositions['center'] && nodePositions['future'] && (
                  <path
                    d={`M ${nodePositions['center'].rightX} ${nodePositions['center'].centerY} Q ${(nodePositions['center'].rightX + nodePositions['future'].leftX) / 2} ${nodePositions['future'].centerY + 20}, ${nodePositions['future'].leftX} ${nodePositions['future'].centerY}`}
                    stroke={isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                  />
                )}
              </svg>
            )}

            {/* 좌측 메인 노드 */}
            <div
              data-node-id="center"
              className="absolute left-[15%] top-1/2 -translate-y-1/2 group z-10"
              style={{
                transition: 'all 0.3s ease',
              }}
            >
              <Link
                href="/project"
                className="block"
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="relative rounded-2xl cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                  style={{
                    padding: '28px 36px',
                    border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'}`,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    minWidth: '240px',
                    boxShadow: isDark 
                      ? '0 4px 20px rgba(0, 0, 0, 0.2)'
                      : '0 4px 20px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <h3
                    className="text-center font-bold whitespace-nowrap"
                    style={{
                      fontSize: '18px',
                      color: isDark ? '#ffffff' : '#1d1d1f',
                      letterSpacing: '0.02em',
                      lineHeight: '1.4',
                    }}
                  >
                    SITE : DORI-AI
                  </h3>
                </div>
              </Link>
            </div>

            {/* 우측 노드들 */}
            <div
              className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col gap-10 z-10"
            >
              {[
                { 
                  id: 'overview', 
                  title: '개요 및 개발 배경', 
                  href: '/project/project01-1',
                },
                { 
                  id: 'development', 
                  title: '개발 방법 및 제작 구조', 
                  href: '/project/project01-2',
                },
                { 
                  id: 'future', 
                  title: '향후 계획 및 확장 방향', 
                  href: '/project/project01-3',
                },
              ].map((node, idx) => (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  className="group"
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Link
                    href={node.href}
                    className="block"
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      className="relative rounded-2xl cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg"
                      style={{
                        padding: '22px 32px',
                        border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'}`,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                        minWidth: '260px',
                        boxShadow: isDark 
                          ? '0 2px 15px rgba(0, 0, 0, 0.15)'
                          : '0 2px 15px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <h3
                        className="text-center font-semibold"
                        style={{
                          fontSize: '15px',
                          color: isDark ? '#ffffff' : '#1d1d1f',
                          letterSpacing: '0.01em',
                          lineHeight: '1.5',
                        }}
                      >
                        {node.title}
                      </h3>
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

        @keyframes dashMove {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 10;
          }
        }
      `}</style>
    </main>
  );
}

