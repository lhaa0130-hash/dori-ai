"use client";

import { useState, useEffect } from "react";
import { TEXTS } from "@/constants/texts";
import SuggestionForm from "@/components/suggestions/SuggestionForm";
import SuggestionFilters from "@/components/suggestions/SuggestionFilters";
import SuggestionList from "@/components/suggestions/SuggestionList";
import { SuggestionItem } from "@/components/suggestions/SuggestionCard";

export default function SuggestionPage() {
  const t = TEXTS.suggestions;

  // 상태 관리
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [filters, setFilters] = useState({
    type: "All",
    priority: "All",
    sort: "newest",
  });

  // 📌 로컬 스토리지 초기화
  useEffect(() => {
    const saved = localStorage.getItem("dori_suggestions");
    if (saved) {
      setSuggestions(JSON.parse(saved));
    } else {
      // 초기 더미 데이터 (처음 방문 시 비어있으면 심심하니까)
      const dummy: SuggestionItem[] = [
        { id: "1", name: "DORI", type: "기능 요청", priority: "높음", message: "다크모드 버튼 디자인을 더 예쁘게 바꿔주세요!", needsReply: true, createdAt: new Date().toISOString() },
        { id: "2", name: "Tester", type: "버그 제보", priority: "보통", message: "모바일에서 메뉴가 가끔 안 열립니다.", needsReply: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];
      setSuggestions(dummy);
      localStorage.setItem("dori_suggestions", JSON.stringify(dummy));
    }
    setIsLoaded(true);
  }, []);

  // 📌 데이터 변경 시 저장
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("dori_suggestions", JSON.stringify(suggestions));
    }
  }, [suggestions, isLoaded]);

  // 📌 건의 등록 핸들러
  const handleAddSuggestion = (newItem: SuggestionItem) => {
    setSuggestions([newItem, ...suggestions]);
  };

  // 🔍 필터링 & 정렬 로직
  const filteredSuggestions = suggestions
    .filter(item => {
      const matchType = filters.type === "All" || item.type === filters.type;
      const matchPriority = filters.priority === "All" || item.priority === filters.priority;
      return matchType && matchPriority;
    })
    .sort((a, b) => {
      if (filters.sort === "priority") {
        const priorityScore = { "높음": 3, "보통": 2, "낮음": 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      // 최신순 (기본값)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <main className="w-full min-h-screen">
      
      {/* 1. Hero 섹션 */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 
          className="text-3xl md:text-5xl font-extrabold mb-4" 
          style={{ color: 'var(--text-main)' }}
        >
          {t.heroTitle.ko}
        </h1>
        <p 
          className="text-lg opacity-70 max-w-2xl mx-auto break-keep" 
          style={{ color: 'var(--text-main)' }}
        >
          {t.heroSubtitle.ko}
        </p>
      </section>

      {/* 2. 메인 컨텐츠 */}
      <section className="container max-w-5xl mx-auto px-4 pb-24">
        
        {/* 등록 폼 */}
        <SuggestionForm onAddSuggestion={handleAddSuggestion} />

        {/* 필터 및 리스트 */}
        <div className="border-t border-dashed pt-12" style={{ borderColor: 'var(--card-border)' }}>
          <SuggestionFilters filters={filters} setFilters={setFilters} />
          <SuggestionList suggestions={filteredSuggestions} />
        </div>
        
      </section>

    </main>
  );
}