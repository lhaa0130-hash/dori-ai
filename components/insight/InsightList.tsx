"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import InsightCard from "./InsightCard";
import { TEXTS } from "@/constants/texts";
import { InsightItem } from "@/types/content";

// ❌ 기존에 있던 const INSIGHT_DATA = [...] 부분은 삭제했습니다!
// 이제 이 컴포넌트는 오직 '받아온 데이터'만 보여줍니다.

interface InsightListProps {
  filters: { category: string; tag: string | null; sort: string; };
  setFilters: (newFilters: any) => void;
  posts: InsightItem[]; // 👈 부모(Page)에서 읽어온 파일 데이터를 여기서 받습니다.
  isOwner?: (item: InsightItem) => boolean;
  onEdit?: (item: InsightItem) => void;
  onDelete?: (id: number) => void;
}

export default function InsightList({ filters, setFilters, posts, isOwner, onEdit, onDelete }: InsightListProps) {
  // 받아온 posts 데이터를 필터링 및 정렬 (useMemo로 최적화)
  const filteredData = useMemo(() => {
    return posts.filter((item) => {
      const matchCategory = filters.category === "All" || item.category === filters.category;
      const matchTag = filters.tag === null || item.tags.includes(filters.tag);
      return matchCategory && matchTag;
    }).sort((a, b) => {
      // 인기순 정렬
      if (filters.sort === "popular") {
        return b.likes - a.likes;
      }
      
      // 가이드 카테고리 필터일 때만 옛날순으로 정렬
      if (filters.category === "가이드") {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB; // 옛날순 (오름차순)
      }
      
      // 그 외의 경우는 모두 최신순으로 정렬 (최신 글이 최상단)
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // 최신순 (내림차순)
    });
  }, [posts, filters.category, filters.tag, filters.sort]);

  // 태그 클릭 핸들러 (useCallback으로 최적화)
  const handleTagClick = useCallback((tag: string) => {
    setFilters({ ...filters, tag });
  }, [filters, setFilters]);

  // 태그 필터 해제 핸들러
  const handleTagFilterRemove = useCallback(() => {
    setFilters({ ...filters, tag: null });
  }, [filters, setFilters]);

  // 카테고리별 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '트렌드':
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
      case '가이드':
        return { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' };
      case '인사이트':
        return { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899' };
      default:
        return { bg: 'rgba(0, 0, 0, 0.05)', text: 'rgba(0, 0, 0, 0.7)' };
    }
  };

  return (
    <div className="w-full">
      {filteredData.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredData.map((item) => {
            // 가이드 글은 /insight/guide/[slug] 경로 사용
            // 트렌드 글은 /insight/trend/[slug] 경로 사용
            let href = `/insight/${item.id}`;
            if (item.slug) {
              if (item.category === '가이드') {
                href = `/insight/guide/${item.slug}`;
              } else if (item.category === '트렌드') {
                href = `/insight/trend/${item.slug}`;
              }
            }

            const categoryColor = getCategoryColor(item.category);
            const likedPosts = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dori_liked_insights') || '[]') : [];
            const likesData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dori_insight_likes') || '{}') : {};
            const isLiked = likedPosts.includes(item.id);
            const likes = likesData[item.id] !== undefined ? likesData[item.id] : item.likes;

            return (
              <Link 
                key={item.id} 
                href={href}
                className="group block"
              >
                <div
                  className="flex gap-4 p-3 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--card-border)',
                  }}
                >
                  {/* 좌측 이미지 */}
                  <div
                    className="w-[160px] h-[80px] rounded-xl overflow-hidden flex-shrink-0 relative"
                    style={{
                      backgroundColor: 'var(--card-border)',
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
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
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          backgroundColor: categoryColor.bg,
                          color: categoryColor.text,
                        }}
                      >
                        {item.category}
                      </span>
                      <span 
                        className="text-xs opacity-60"
                        style={{ color: 'var(--text-sub)' }}
                        suppressHydrationWarning={true}
                      >
                        {new Date(item.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </span>
                    </div>

                    {/* 제목 */}
                    <h3
                      className="text-base font-bold leading-tight break-keep line-clamp-1"
                      style={{ color: 'var(--text-main)' }}
                    >
                      {item.title}
                    </h3>

                    {/* 요약 */}
                    <p
                      className="text-xs leading-relaxed line-clamp-1"
                      style={{ color: 'var(--text-sub)' }}
                    >
                      {item.summary}
                    </p>

                    {/* 태그 & 좋아요 */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex gap-1.5 flex-wrap">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleTagClick(tag);
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded-md border cursor-pointer transition-all hover:scale-105"
                            style={{
                              backgroundColor: 'var(--bg-main)',
                              borderColor: 'var(--card-border)',
                              color: 'var(--text-sub)',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span 
                            className="text-[10px] opacity-60"
                            style={{ color: 'var(--text-sub)' }}
                          >
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                      <div 
                        className="flex items-center gap-1 text-xs"
                        style={{ 
                          color: isLiked ? '#ef4444' : 'var(--text-sub)',
                          opacity: isLiked ? 1 : 0.6,
                        }}
                      >
                        <span className="text-sm">{isLiked ? '❤️' : '🤍'}</span>
                        <span>{likes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 opacity-60 flex flex-col items-center">
          <div className="text-4xl mb-4">📭</div>
          <p>조건에 맞는 인사이트가 없습니다.</p>
          {filters.tag && (
            <button onClick={handleTagFilterRemove} className="mt-4 text-blue-500 hover:underline">
              태그 필터 해제하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}