"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CompanyLogoBadge from "@/components/CompanyLogoBadge";

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

const CATEGORIES = ['전체', '트렌드', '가이드', '분석', '리포트', '큐레이션', '영상'];

function getCategoryDisplay(cat?: string) {
  if (!cat) return '';
  if (cat.toLowerCase() === 'trend') return '트렌드';
  return cat;
}

function getSummary(content?: string, summary?: string) {
  if (summary) return summary;
  if (!content) return '';
  let text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  text = text.replace(/^물론입니다\.\s*/i, '').replace(/^---[\s\S]*?---\s*/, '').replace(/^#+\s+/gm, '').trim();
  if (text.length < 20) return '';
  return text.length > 120 ? text.slice(0, 120) + '…' : text;
}

export default function InsightPageClient({ initialPosts = [] }: InsightPageClientProps) {
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [likesData, setLikesData] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState('전체');

  useEffect(() => {
    try {
      setLikedPosts(JSON.parse(localStorage.getItem('dori_liked_insights') || '[]'));
      setLikesData(JSON.parse(localStorage.getItem('dori_insight_likes') || '{}'));
    } catch { /* noop */ }
  }, []);

  const handleLike = useCallback((e: React.MouseEvent, postId: string, currentLikes: number) => {
    e.preventDefault();
    e.stopPropagation();
    const num = parseInt(postId);
    const isLiked = likedPosts.includes(num);
    const updated = isLiked ? likedPosts.filter(id => id !== num) : [...likedPosts, num];
    setLikedPosts(updated);
    localStorage.setItem('dori_liked_insights', JSON.stringify(updated));
    const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;
    const updatedLikesData = { ...likesData, [postId]: newLikes };
    setLikesData(updatedLikesData);
    localStorage.setItem('dori_insight_likes', JSON.stringify(updatedLikesData));
  }, [likedPosts, likesData]);

  const filtered = initialPosts.filter(p =>
    selectedCategory === '전체' || getCategoryDisplay(p.category) === selectedCategory
  );

  return (
    <div className="w-full min-h-screen">

      {/* 헤더 */}
      <section className="pt-6 pb-5 border-b border-neutral-100 dark:border-zinc-900">
        <h1 className="text-[28px] sm:text-[36px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-1.5 break-keep">
          AI 인사이트
        </h1>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 break-keep">
          AI 업계 속보와 심층 칼럼
        </p>
      </section>

      {/* 카테고리 필터 */}
      <section className="pt-4 pb-0 border-b border-neutral-100 dark:border-zinc-900">
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max pb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-neutral-950 dark:bg-white border-neutral-950 dark:border-white text-white dark:text-neutral-950'
                    : 'bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 글 목록 */}
      <section className="py-4">
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((post) => {
              const postId = String(post.id || '');
              const isLiked = likedPosts.includes(parseInt(postId));
              const likes = likesData[postId] ?? (post.likes || 0);
              const category = getCategoryDisplay(post.category);
              const summary = getSummary(post.content, post.summary);

              return (
                <Link key={postId} href={`/insight/article/${post.slug || post.id}`} className="group block">
                  <div className="flex gap-3 p-3 md:p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-neutral-200 dark:hover:border-zinc-700 transition-colors">

                    {/* 썸네일 */}
                    <div className="w-[88px] md:w-[130px] h-[64px] md:h-[76px] rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-zinc-800 relative">
                      {post.thumbnail_url ? (
                        <img
                          src={post.thumbnail_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">📝</div>
                      )}
                      {post.thumbnail_url && (
                        <CompanyLogoBadge text={`${post.title || ""} ${(post.tags || []).join(" ")}`} />
                      )}
                    </div>

                    {/* 텍스트 */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {category && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F9954E]/10 text-[#F9954E]">
                            {category}
                          </span>
                        )}
                        {post.created_at && (
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-500" suppressHydrationWarning>
                            {new Date(post.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <h3 className="text-[13px] md:text-[14px] font-bold text-neutral-900 dark:text-white leading-snug break-keep line-clamp-2 group-hover:text-[#F9954E] transition-colors">
                        {post.title || '제목 없음'}
                      </h3>

                      {summary && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 leading-relaxed">
                          {summary}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-0.5">
                        <div className="flex gap-1">
                          {post.tags?.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleLike(e, postId, likes)}
                          className="flex items-center gap-1 text-[11px] transition-all hover:scale-110 active:scale-95"
                        >
                          <span className="text-sm">{isLiked ? '❤️' : '🤍'}</span>
                          <span className={isLiked ? 'text-[#F9954E] font-bold' : 'text-neutral-400 dark:text-neutral-500'}>{likes}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="py-20 text-center text-[13px] text-neutral-400 dark:text-neutral-500">아직 게시글이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
