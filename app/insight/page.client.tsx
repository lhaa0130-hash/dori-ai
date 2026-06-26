"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

const CATEGORIES = ['전체', '트렌드', '가이드', '분석', '리포트', '큐레이션', '영상'];

function getCat(cat?: string) {
  if (!cat) return '';
  if (cat.toLowerCase() === 'trend') return '트렌드';
  return cat;
}

function getDesc(content?: string, summary?: string) {
  if (summary) return summary.slice(0, 100);
  if (!content) return '';
  const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')
    .replace(/^물론입니다\.\s*/i, '').replace(/^---[\s\S]*?---\s*/, '').trim();
  return text.length > 100 ? text.slice(0, 100) + '…' : text;
}

function fmtDate(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function InsightPageClient({ initialPosts = [] }: { initialPosts: Post[] }) {
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [likesData, setLikesData] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState('전체');

  useEffect(() => {
    try {
      setLikedPosts(JSON.parse(localStorage.getItem('dori_liked_insights') || '[]'));
      setLikesData(JSON.parse(localStorage.getItem('dori_insight_likes') || '{}'));
    } catch { /* noop */ }
  }, []);

  const handleLike = useCallback((e: React.MouseEvent, postId: string, cur: number) => {
    e.preventDefault();
    e.stopPropagation();
    const liked = likedPosts.includes(postId);
    const next = liked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId];
    setLikedPosts(next);
    localStorage.setItem('dori_liked_insights', JSON.stringify(next));
    const nextLikes = { ...likesData, [postId]: liked ? Math.max(0, cur - 1) : cur + 1 };
    setLikesData(nextLikes);
    localStorage.setItem('dori_insight_likes', JSON.stringify(nextLikes));
  }, [likedPosts, likesData]);

  const posts = initialPosts.filter(p =>
    selected === '전체' || getCat(p.category) === selected
  );

  return (
    <div className="w-full min-h-screen">

      {/* 헤더 */}
      <section className="pt-6 pb-5 border-b border-neutral-100 dark:border-zinc-900">
        <h1 className="text-[28px] sm:text-[36px] font-extrabold text-neutral-950 dark:text-white tracking-tight break-keep">
          AI 인사이트
        </h1>
      </section>

      {/* 카테고리 */}
      <div className="-mx-6 px-6 overflow-x-auto scrollbar-hide border-b border-neutral-100 dark:border-zinc-900">
        <div className="flex gap-1 w-max py-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap ${
                selected === cat
                  ? 'bg-neutral-950 dark:bg-white text-white dark:text-neutral-950'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 글 목록 */}
      {posts.length > 0 ? (
        <ul>
          {posts.map((post) => {
            const pid = String(post.id || '');
            const isLiked = likedPosts.includes(pid);
            const likes = likesData[pid] ?? (post.likes || 0);
            const cat = getCat(post.category);
            const desc = getDesc(post.content, post.summary);

            return (
              <li key={pid} className="border-b border-neutral-100 dark:border-zinc-900 last:border-0">
                <Link href={`/insight/article/${post.slug || post.id}`} className="group flex items-start gap-3 py-3">

                  {/* 썸네일 */}
                  {post.thumbnail_url && (
                    <div className="w-[60px] h-[46px] rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-zinc-800">
                      <img
                        src={post.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {cat && <span className="text-[10px] font-bold text-[#F9954E]">{cat}</span>}
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500" suppressHydrationWarning>
                        {fmtDate(post.created_at)}
                      </span>
                    </div>
                    <h3 className="text-[13.5px] sm:text-[14.5px] font-bold text-neutral-900 dark:text-white leading-snug break-keep line-clamp-2 group-hover:text-[#F9954E] transition-colors">
                      {post.title || '제목 없음'}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => handleLike(e, pid, likes)}
                      className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500 hover:text-[#F9954E] transition-colors"
                    >
                      <span>{isLiked ? '❤️' : '♡'}</span>
                      <span className={isLiked ? 'text-[#F9954E]' : ''}>{likes}</span>
                    </button>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-20 text-center text-[13px] text-neutral-400 dark:text-neutral-500">아직 게시글이 없습니다.</p>
      )}
    </div>
  );
}
