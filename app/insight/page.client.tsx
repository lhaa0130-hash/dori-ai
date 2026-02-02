"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface Post {
  id: string;
  title: string;
  thumbnail_url?: string;
  content?: string;
  created_at?: string;
  category?: string;
  tags?: string[];
  likes?: number;
  slug?: string;
  summary?: string;
}

interface InsightPageClientProps {
  initialPosts: Post[];
}

export default function InsightPageClient({ initialPosts = [] }: InsightPageClientProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [likesData, setLikesData] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const liked = JSON.parse(localStorage.getItem('dori_liked_insights') || '[]');
        const likes = JSON.parse(localStorage.getItem('dori_insight_likes') || '{}');
        setLikedPosts(liked);
        setLikesData(likes);
      } catch (e) {
        console.error("Failed to parse localStorage for likes:", e);
      }
    }
  }, []);

  const isDark = mounted && theme === 'dark';

  // 하트 클릭 핸들러
  const handleLikeClick = useCallback((e: React.MouseEvent, postId: string, currentLikes: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!mounted) return;

    const postIdNum = parseInt(postId);
    const newIsLiked = !likedPosts.includes(postIdNum);
    const updatedLikedPosts = newIsLiked
      ? [...likedPosts, postIdNum]
      : likedPosts.filter(id => id !== postIdNum);

    setLikedPosts(updatedLikedPosts);
    localStorage.setItem('dori_liked_insights', JSON.stringify(updatedLikedPosts));

    const newLikes = newIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    const updatedLikesData = { ...likesData, [postId]: newLikes };
    setLikesData(updatedLikesData);
    localStorage.setItem('dori_insight_likes', JSON.stringify(updatedLikesData));
  }, [mounted, likedPosts, likesData]);

  // 카테고리별 색상
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case '트렌드':
      case 'trend':
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
      case '가이드':
        return { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' };
      case '큐레이션':
        return { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899' };
      case '분석':
        return { bg: 'rgba(6, 182, 212, 0.1)', text: '#06b6d4' };
      case '리포트':
        return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' };
      default:
        return { bg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', text: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' };
    }
  };

  // 본문 요약 추출 (HTML 태그 제거 및 시스템 메시지 필터링)
  const getSummary = (content?: string) => {
    if (!content) return '';

    // HTML 태그 제거
    let text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    // 시스템 메시지 및 마크다운 메타데이터 제거
    const systemPatterns = [
      /^물론입니다\.\s*/i,
      /^---\s*title:.*?---\s*/s,
      /^#+\s*title:.*?\n/s,
      /^AI 전문 블로그.*?\n/i,
      /^---\s*[\s\S]*?---\s*/,
      /^```[\s\S]*?```\s*/,
      /^\[.*?\]\(.*?\)\s*/g,
      /^#+\s+/gm,
    ];

    systemPatterns.forEach(pattern => {
      text = text.replace(pattern, '');
    });

    // 실제 본문 시작점 찾기 (첫 번째 문장이 의미있는 내용인지 확인)
    const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      text = sentences.join('. ');
    }

    text = text.trim();

    // 최종 정제: 너무 짧거나 의미없는 텍스트 제거
    if (text.length < 20) return '';

    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  // 카테고리 표시명 변환 (trend → 트렌드)
  const getCategoryDisplay = (category?: string) => {
    if (!category) return '';
    if (category.toLowerCase() === 'trend') return '트렌드';
    return category;
  };

  return (
    <main style={{
      backgroundColor: isDark ? '#000000' : '#ffffff',
      fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      minHeight: '100vh',
      paddingTop: '70px',
    }}>
      <Header />

      {/* 다크모드 배경 효과 */}
      {isDark && (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
          <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      {/* 인사이트 페이지 콘텐츠 */}
      <section className="relative z-10" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        minHeight: 'calc(100vh - 70px)',
      }}>
        {/* 헤더 */}
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h1
            className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
            style={{
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            인사이트
          </h1>

          {/* 그라데이션 구분선 */}
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
            AI 업계 속보와 심층 칼럼을 만나보세요
          </p>
        </div>

        {/* 리스트 레이아웃 - InsightList.tsx와 동일한 구조 */}
        {initialPosts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {initialPosts.map((post) => {
              const categoryColor = getCategoryColor(post.category);
              const summary = getSummary(post.content);
              const categoryDisplay = getCategoryDisplay(post.category);
              const postId = String(post.id || '');
              const isPostLiked = likedPosts.includes(parseInt(postId));
              const currentLikes = likesData[postId] !== undefined ? likesData[postId] : (post.likes || 0);

              // 경로 결정: slug가 있으면 가이드/트렌드 경로 사용, 없으면 DB 포스트 경로 사용
              let href = `/insight/article/${post.slug || post.id}`; // Always route to article to avoid 404
              // Separate folders for guide/trend do not exist, so we unify routing.
              /*
              if (post.slug) {
                if (post.category === '가이드') {
                  href = `/insight/guide/${post.slug}`;
                } else if (post.category === '트렌드' || post.category?.toLowerCase() === 'trend') {
                  href = `/insight/trend/${post.slug}`;
                }
              }
              */

              return (
                <Link
                  key={postId}
                  href={href}
                  className="group block"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="flex gap-4 p-3 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{
                      backgroundColor: isDark ? '#000000' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#e5e5e7',
                    }}
                  >
                    {/* 좌측 이미지 */}
                    <div
                      className="w-[160px] h-[80px] rounded-xl overflow-hidden flex-shrink-0 relative"
                      style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f0f0f0',
                      }}
                    >
                      {post.thumbnail_url ? (
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
                          📝
                        </div>
                      )}
                    </div>

                    {/* 우측 내용 */}
                    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                      {/* 카테고리 & 날짜 */}
                      <div className="flex items-center gap-3">
                        {categoryDisplay && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              backgroundColor: categoryColor.bg,
                              color: categoryColor.text,
                            }}
                          >
                            {categoryDisplay}
                          </span>
                        )}
                        {post.created_at && (
                          <span
                            className="text-xs opacity-60"
                            style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                            suppressHydrationWarning={true}
                          >
                            {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {/* 제목 */}
                      <h3
                        className="text-base font-bold leading-tight break-keep line-clamp-1"
                        style={{
                          color: isDark ? '#ffffff' : '#1d1d1f',
                        }}
                      >
                        {post.title || '제목 없음'}
                      </h3>

                      {/* 요약 */}
                      <p
                        className="text-xs leading-relaxed line-clamp-1"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        {summary || post.summary || ''}
                      </p>

                      {/* 태그 & 좋아요 */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex gap-1.5 flex-wrap">
                          {post.tags && post.tags.length > 0 && post.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded-md border"
                              style={{
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags && post.tags.length > 3 && (
                            <span
                              className="text-[10px] opacity-60"
                              style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}
                            >
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleLikeClick(e, postId, currentLikes)}
                          className="flex items-center gap-1 text-xs cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
                          style={{
                            color: isPostLiked ? '#ef4444' : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
                            opacity: isPostLiked ? 1 : 0.6,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            margin: 0,
                          }}
                        >
                          <span className="text-sm transition-transform duration-200" style={{ transform: isPostLiked ? 'scale(1.2)' : 'scale(1)' }}>
                            {isPostLiked ? '❤️' : '🤍'}
                          </span>
                          <span>{currentLikes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '4rem 0',
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          }}>
            아직 게시글이 없습니다.
          </div>
        )}
      </section>

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
