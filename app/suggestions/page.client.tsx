"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { TEXTS } from "@/constants/texts";
import SuggestionForm from "@/components/suggestions/SuggestionForm";
import SuggestionList from "@/components/suggestions/SuggestionList";
import SuggestionFilters from "@/components/suggestions/SuggestionFilters";
import { SuggestionItem } from "@/components/suggestions/SuggestionCard";

// 작성자 ID 생성 및 관리 유틸리티
const getAuthorId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let authorId = sessionStorage.getItem('dori_author_id');
  if (!authorId) {
    authorId = crypto.randomUUID();
    sessionStorage.setItem('dori_author_id', authorId);
  }
  return authorId;
};

// 본인이 작성한 건의사항 ID 목록 가져오기
const getMySuggestionIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  
  const saved = localStorage.getItem('dori_my_suggestions');
  if (saved) {
    try {
      return new Set(JSON.parse(saved));
    } catch (e) {
      return new Set();
    }
  }
  return new Set();
};

// 본인이 작성한 건의사항 ID 목록에 추가
const addMySuggestionId = (id: string) => {
  if (typeof window === 'undefined') return;
  
  const myIds = getMySuggestionIds();
  myIds.add(id);
  localStorage.setItem('dori_my_suggestions', JSON.stringify(Array.from(myIds)));
};

// 본인이 작성한 건의사항 ID 목록에서 제거
const removeMySuggestionId = (id: string) => {
  if (typeof window === 'undefined') return;
  
  const myIds = getMySuggestionIds();
  myIds.delete(id);
  localStorage.setItem('dori_my_suggestions', JSON.stringify(Array.from(myIds)));
};

export default function SuggestionsClient() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [editingItem, setEditingItem] = useState<SuggestionItem | null>(null);
  const [filters, setFilters] = useState<{ type: string; priority: string; sort: string }>({
    type: "All",
    priority: "All",
    sort: "newest",
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const savedSuggestions = localStorage.getItem("dori_suggestions");
    if (savedSuggestions) {
      try {
        const parsed = JSON.parse(savedSuggestions);
        setSuggestions(parsed);
      } catch (e) {
        console.error("Error parsing suggestions:", e);
        setSuggestions([]);
      }
    }
  }, []);

  // 작성자 ID 가져오기
  const authorId = mounted ? getAuthorId() : '';
  const mySuggestionIds = mounted ? getMySuggestionIds() : new Set<string>();

  // 본인 글인지 확인
  const isOwner = (item: SuggestionItem): boolean => {
    if (!mounted) return false;
    // authorId가 있으면 authorId로 확인, 없으면 mySuggestionIds로 확인 (기존 데이터 호환성)
    if (item.authorId) {
      return item.authorId === authorId;
    }
    return mySuggestionIds.has(item.id);
  };

  const handleAddSuggestion = (newItem: SuggestionItem) => {
    // 작성자 ID 추가
    const itemWithAuthor: SuggestionItem = {
      ...newItem,
      authorId: authorId,
    };
    
    const updated = [itemWithAuthor, ...suggestions];
    setSuggestions(updated);
    localStorage.setItem("dori_suggestions", JSON.stringify(updated));
    
    // 본인 작성 목록에 추가
    addMySuggestionId(newItem.id);
  };

  const handleUpdateSuggestion = (updatedItem: SuggestionItem) => {
    const updated = suggestions.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    setSuggestions(updated);
    localStorage.setItem("dori_suggestions", JSON.stringify(updated));
    setEditingItem(null);
  };

  const handleDeleteSuggestion = (id: string) => {
    const updated = suggestions.filter(item => item.id !== id);
    setSuggestions(updated);
    localStorage.setItem("dori_suggestions", JSON.stringify(updated));
    removeMySuggestionId(id);
  };

  const handleEditSuggestion = (item: SuggestionItem) => {
    setEditingItem(item);
    // 폼으로 스크롤
    setTimeout(() => {
      const formElement = document.querySelector('[data-suggestion-form]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const filteredSuggestions = suggestions
    .filter((item) => {
      const matchType = filters.type === "All" || item.type === filters.type;
      const matchPriority = filters.priority === "All" || item.priority === filters.priority;
      return matchType && matchPriority;
    })
    .sort((a, b) => {
      if (filters.sort === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (filters.sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return 0;
    });

  const isDark = mounted && theme === 'dark';

  return (
    <main 
      className="w-full min-h-screen relative overflow-x-hidden" 
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
        fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
      }}
    >
      {/* 배경 효과 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {mounted && theme === "dark" && (
          <>
            <div className="absolute top-[-200px] left-[20%] w-[500px] h-[500px] rounded-full blur-[100px] opacity-40 bg-blue-900 mix-blend-screen animate-pulse" />
            <div className="absolute top-[100px] right-[20%] w-[450px] h-[450px] rounded-full blur-[100px] opacity-40 bg-purple-900 mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}
        {mounted && theme === "light" && (
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), #ffffff',
            }}
          />
        )}
      </div>

      {/* 히어로 섹션 */}
      <section className="relative pt-20 pb-12 px-6 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight leading-tight"
            style={{ 
              color: isDark ? '#ffffff' : '#1d1d1f',
              fontWeight: 700,
              letterSpacing: '-0.03em',
            }}
          >
            {TEXTS.suggestions.heroTitle.ko}
          </h1>
          
          {/* 그라데이션 바 */}
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
            {TEXTS.suggestions.heroSubtitle.ko}
          </p>
        </div>
      </section>
      
      {/* 메인 콘텐츠 */}
      <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-24">
        {/* 건의사항 폼 */}
        <div data-suggestion-form>
          <SuggestionForm 
            onAddSuggestion={handleAddSuggestion}
            initialData={editingItem}
            onCancel={() => setEditingItem(null)}
            onUpdate={handleUpdateSuggestion}
          />
        </div>

        {/* 필터 */}
        <div className="mb-8">
          <SuggestionFilters filters={filters} setFilters={setFilters} />
        </div>

        {/* 건의사항 목록 */}
        <SuggestionList 
          suggestions={filteredSuggestions}
          isOwner={isOwner}
          onEdit={handleEditSuggestion}
          onDelete={handleDeleteSuggestion}
        />
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

