"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Sparkles } from "lucide-react";

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
  const CATEGORIES = ['전체', '트렌드', '가이드', '분석', '리포트', '큐레이션', '스튜디오'];
  const [selectedCategory, setSelectedCategory] = useState('전체');

  // 카테고리별 색상 (주황색 테마 기반 톤온톤)
  const getCategoryColor = (category?: string) => {
    if (!category) return { bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', text: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' };
    return { bg: isDark ? 'rgba(249,149,78,0.15)' : 'rgba(249,149,78,0.12)', text: '#F9954E' };
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
    <div className="w-full min-h-screen">

      {/* 인사이트 페이지 콘텐츠 */}
      <section className="py-4 sm:py-6 min-h-[50vh]">
        {/* 헤더 */}
        <div className="mb-7 pt-2 border-b border-neutral-100 dark:border-zinc-900 pb-8">
          <p className="text-[12px] font-semibold text-[#F9954E] mb-3">인사이트</p>
          <h1 className="text-[36px] sm:text-[48px] font-extrabold text-neutral-950 dark:text-white leading-[1.15] tracking-tight mb-3 break-keep">
            AI 인사이트
          </h1>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
            AI 업계 속보와 심층 칼럼을 만나보세요
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold transition-colors border ${
                selectedCategory === cat
                  ? 'bg-[#F9954E] border-[#F9954E] text-white'
                  : 'bg-white dark:bg-black border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-neutral-400'
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
                    className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-black transition-colors active:bg-neutral-50 dark:active:bg-zinc-900/50"
                  >
                    {/* 좌측 이미지 */}
                    <div
                      className="w-[100px] md:w-[160px] h-[70px] md:h-[80px] rounded-lg md:rounded-xl overflow-hidden flex-shrink-0 relative"
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
                        className="text-sm md:text-base font-bold leading-tight break-keep line-clamp-2 md:line-clamp-1 group-hover:text-[#F9954E] transition-colors"
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
                            color: isPostLiked ? '#F9954E' : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
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

    </div>
  );
}
