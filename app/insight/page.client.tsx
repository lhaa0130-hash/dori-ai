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

  // 카테고리 목록 정의
  const CATEGORIES = ['전체', '트렌드', '가이드', '분석', '리포트', '큐레이션'];
  const [selectedCategory, setSelectedCategory] = useState('전체');

  // 카테고리별 색상 (주황색 테마 기반)
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case '트렌드':
      case 'trend':
        return { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316' }; // Orange-500
      case '가이드':
        return { bg: 'rgba(234, 88, 12, 0.1)', text: '#ea580c' }; // Orange-600
      case '분석':
        return { bg: 'rgba(251, 146, 60, 0.1)', text: '#fb923c' }; // Orange-400
      case '리포트':
        return { bg: 'rgba(194, 65, 12, 0.1)', text: '#c2410c' }; // Orange-700
      case '큐레이션':
        return { bg: 'rgba(253, 186, 116, 0.1)', text: '#fdba74' }; // Orange-300
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
      /^---\s*title:[\s\S]*?---\s*/,
      /^#+\s*title:[\s\S]*?\n/,
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

  const filteredPosts = initialPosts.filter(post => {
    if (selectedCategory === '전체') return true;
    const cat = getCategoryDisplay(post.category);
    return cat === selectedCategory;
  });

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative overflow-x-hidden" style={{ paddingTop: '70px' }}>
      <Header />

      {/* 배경 그라데이션 (Standard) */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-100/40 via-orange-50/20 to-transparent dark:from-orange-900/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      {/* 인사이트 페이지 콘텐츠 */}
      <section className="relative z-10" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem',
        minHeight: 'calc(100vh - 70px)',
      }}>
        {/* 헤더 (Standard) */}
        <div className="max-w-3xl mx-auto mb-12 text-center pt-20 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            <span>Insight Center</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-orange-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
              인사이트
            </span>
          </h1>
          <p className="text-base md:text-lg font-medium text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed max-w-xl">
            AI 업계 속보와 심층 칼럼을 만나보세요
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${selectedCategory === cat
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white dark:bg-black border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-neutral-400 hover:border-orange-500/50 hover:text-orange-500 dark:hover:text-orange-400'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 리스트 레이아웃 */}
        {filteredPosts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredPosts.map((post) => {
              const categoryColor = getCategoryColor(post.category);
              const summary = getSummary(post.content);
              const categoryDisplay = getCategoryDisplay(post.category);
              const postId = String(post.id || '');
              const isPostLiked = likedPosts.includes(parseInt(postId));
              const currentLikes = likesData[postId] !== undefined ? likesData[postId] : (post.likes || 0);

              let href = `/insight/article/${post.slug || post.id}`;

              return (
                <Link
                  key={postId}
                  href={href}
                  className="group block"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    className="flex gap-4 p-4 rounded-[2rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-neutral-200 dark:border-zinc-800 hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:shadow-orange-500/10"
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
                        className="text-base font-bold leading-tight break-keep line-clamp-1 group-hover:text-orange-500 transition-colors"
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
