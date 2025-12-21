"use client";

import { useState } from "react";
import AcademyCard, { AcademyItem } from "./AcademyCard";
import { TEXTS } from "@/constants/texts";

// 📌 더미 데이터 삭제됨
const ACADEMY_DATA: AcademyItem[] = [];

interface AcademyListProps {
  searchTerm: string;
}

export default function AcademyList({ searchTerm }: AcademyListProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  // 🔍 검색 로직
  const filteredData = ACADEMY_DATA.filter((item) => {
    // 검색어 필터 (제목 or 설명)
    return item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           item.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const visibleData = filteredData.slice(0, visibleCount);

  return (
    <div className="w-full">
      {/* 리스트 그리드 */}
      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {visibleData.map((item) => (
            <AcademyCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 opacity-60 flex flex-col items-center">
          <div className="text-4xl mb-4">🎓</div>
          <p>조건에 맞는 강의가 없습니다.</p>
        </div>
      )}

      {/* 더보기 버튼 */}
      {visibleData.length < filteredData.length && (
        <div className="flex justify-center mt-16">
          <button 
            onClick={() => setVisibleCount((prev) => prev + 6)}
            className="px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-main)] hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {TEXTS.academy.button.loadMore.ko} +
          </button>
        </div>
      )}
    </div>
  );
}