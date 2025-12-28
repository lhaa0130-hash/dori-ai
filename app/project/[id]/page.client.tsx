"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import dynamic from 'next/dynamic';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: true,
  loading: () => <div className="animate-pulse">로딩 중...</div>,
});

interface Project {
  id: string;
  title: string;
  contentHtml: string;
  contentMarkdown?: string;
  date?: string;
  description?: string;
  [key: string]: any;
}

interface ProjectDetailClientProps {
  project: Project;
}

export default function ProjectDetailClient({ project }: ProjectDetailClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
            <Link
              href="/project"
              className="group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <div 
                className="w-1.5 h-1.5 rounded-full transition-all duration-300 scale-150"
                style={{
                  backgroundColor: isDark ? '#ffffff' : '#000000',
                }}
              />
              <span 
                className="text-xs font-medium transition-all duration-300 translate-x-1"
                style={{
                  color: isDark ? '#ffffff' : '#000000',
                }}
              >
                목록
              </span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <section className="w-full min-h-screen flex items-center justify-center px-6 lg:pl-12 pt-20 pb-20">
        <article className="max-w-4xl mx-auto w-full">
          {/* 헤더 */}
          <div className="mb-12">
            <Link
              href="/project"
              className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
              style={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
              }}
            >
              ← 프로젝트 목록으로
            </Link>
            
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl mb-4 leading-[1.05] tracking-[-0.03em]"
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.03em',
              }}
            >
              {project.title}
            </h1>
            
            {project.description && (
              <p 
                className="text-lg md:text-xl mb-6"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                }}
              >
                {project.description}
              </p>
            )}

            {/* DORI-AI 그라데이션 바 */}
            <div 
              className="w-full max-w-2xl h-1 md:h-1.5 mb-6 rounded-full overflow-hidden"
              style={{
                boxShadow: isDark 
                  ? '0 0 30px rgba(236, 72, 153, 0.4), 0 4px 20px rgba(236, 72, 153, 0.2)'
                  : '0 0 20px rgba(236, 72, 153, 0.3), 0 4px 15px rgba(236, 72, 153, 0.2)',
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
          </div>

          {/* 본문 영역 */}
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            style={{
              color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
            }}
          >
            {project.contentMarkdown ? (
              <ReactMarkdown
                components={{
                  h1: (props) => <h1 className="mt-12 mb-6 text-3xl font-bold" style={{ color: isDark ? '#ffffff' : '#1d1d1f' }} {...props} />,
                  h2: (props) => <h2 className="mt-10 mb-5 pb-2 text-2xl font-bold border-b" style={{ color: isDark ? '#ffffff' : '#1d1d1f', borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }} {...props} />,
                  h3: (props) => <h3 className="mt-8 mb-4 text-xl font-bold" style={{ color: isDark ? '#ffffff' : '#1d1d1f' }} {...props} />,
                  p: (props) => <p className="mb-6 text-lg leading-8" style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }} {...props} />,
                  strong: (props) => <strong className="font-bold" style={{ color: isDark ? '#ffffff' : '#1d1d1f' }} {...props} />,
                  ul: (props) => <ul className="mb-6 space-y-2" style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }} {...props} />,
                  ol: (props) => <ol className="mb-6 space-y-2" style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }} {...props} />,
                  li: (props) => <li className="ml-4" {...props} />,
                  code: (props) => <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-sm" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }} {...props} />,
                  pre: (props) => <pre className="p-4 rounded-lg overflow-x-auto mb-6" style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }} {...props} />,
                  a: (props) => <a className="text-blue-600 dark:text-blue-400 hover:underline" style={{ color: isDark ? '#60a5fa' : '#2563eb' }} {...props} />,
                  img: (props) => <img className="rounded-3xl my-10 w-full" {...props} />,
                  blockquote: (props) => <blockquote className="border-l-4 pl-4 italic my-6" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' }} {...props} />,
                  hr: (props) => <hr className="my-8" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }} {...props} />,
                }}
              >
                {project.contentMarkdown}
              </ReactMarkdown>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: project.contentHtml }} />
            )}
          </div>
        </article>
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

