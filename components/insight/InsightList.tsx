"use client";

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
  const handleTagClick = (tag: string) => setFilters({ ...filters, tag });

  // 받아온 posts 데이터를 필터링
  const filteredData = posts.filter((item) => {
    const matchCategory = filters.category === "All" || item.category === filters.category;
    const matchTag = filters.tag === null || item.tags.includes(filters.tag);
    return matchCategory && matchTag;
  }).sort((a, b) => {
    if (filters.sort === "popular") return b.likes - a.likes;
    
    // 전체 필터일 때는 모든 글을 최신순으로 정렬
    if (filters.category === "All") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    
    // 특정 카테고리 필터일 때만 가이드는 옛날순으로 정렬
    if (filters.category === "가이드") {
      if (a.category === '가이드' && b.category === '가이드') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    }
    
    // 가이드가 아닌 카테고리 필터일 때는 최신순
    if (a.category !== '가이드' && b.category !== '가이드') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    
    // 가이드와 다른 카테고리 섞일 때는 가이드 우선 배치
    if (a.category === '가이드' && b.category !== '가이드') return -1;
    if (a.category !== '가이드' && b.category === '가이드') return 1;
    
    // 기본적으로 최신순
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="w-full">
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            
            return (
              <div key={item.id} className="relative group">
                <Link href={href} className="block">
                  <InsightCard 
                    item={item} 
                    onTagClick={handleTagClick}
                    isOwner={isOwner ? isOwner(item) : false}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 opacity-60 flex flex-col items-center">
          <div className="text-4xl mb-4">📭</div>
          <p>조건에 맞는 인사이트가 없습니다.</p>
          {filters.tag && (
            <button onClick={() => setFilters({...filters, tag: null})} className="mt-4 text-blue-500 hover:underline">
              태그 필터 해제하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}