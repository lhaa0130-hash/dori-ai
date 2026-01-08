"use client";

import { useState, useEffect } from "react";
import AiToolsCard, { AiTool } from "./AiToolsCard";
import { TEXTS } from "@/constants/texts";
import { AI_TOOLS_DATA } from "@/constants/aiToolsData"; 

// 📌 [수정] 세분화된 카테고리 모두 표시
const DISPLAY_CATEGORIES = [
  "llm", 
  "image-generation",
  "image-editing",
  "video-generation",
  "video-editing",
  "voice-tts",
  "music",
  "automation", 
  "search", 
  "agent",
  "coding",
  "design",
  "3d",
  "writing",
  "translation",
  "presentation"
];

// 카테고리별 레이블
const CATEGORY_LABELS: Record<string, string> = {
  "llm": "LLM",
  "image-generation": "이미지 생성",
  "image-editing": "이미지 편집",
  "video-generation": "영상 생성",
  "video-editing": "영상 편집",
  "voice-tts": "음성/TTS",
  "music": "음악",
  "automation": "자동화",
  "search": "검색",
  "agent": "에이전트",
  "coding": "코딩",
  "design": "디자인",
  "3d": "3D",
  "writing": "글쓰기",
  "translation": "번역",
  "presentation": "프레젠테이션"
};

// 카테고리별 주요 기능 설명
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "llm": "대화형 AI, 텍스트 생성, 코딩 지원, 번역, 문서 분석, 질문 답변",
  "image-generation": "텍스트로 이미지 생성, 프롬프트 기반 아트 제작, 로고 및 일러스트 생성",
  "image-editing": "배경 제거, 이미지 향상, 필터 적용, 자동 편집, 포토샵 대체",
  "video-generation": "텍스트 투 비디오, 이미지 투 비디오, 애니메이션 생성, 영상 제작",
  "video-editing": "자동 자막 생성, 컷 편집, 텍스트 기반 편집, 영상 합성",
  "voice-tts": "텍스트 음성 변환, 보이스 클로닝, 감정 표현, 내레이션 생성",
  "music": "AI 작곡, 음악 생성, 배경음악 제작, 노래 생성, 멜로디 생성",
  "automation": "워크플로우 자동화, 앱 연동, 반복 작업 자동화, 스크래핑",
  "search": "AI 검색, 실시간 정보 검색, 출처 제공, 대화형 검색",
  "agent": "자율 AI 에이전트, 작업 자동 실행, 목표 달성, 페르소나 챗봇",
  "coding": "코드 자동 완성, 코드 리뷰, 디버깅, 코드 생성, 개발 지원",
  "design": "UI/UX 디자인, 로고 생성, 그래픽 디자인, 프로토타입 제작",
  "3d": "3D 모델 생성, 텍스트 투 3D, 이미지 투 3D, 3D 자산 제작",
  "writing": "글쓰기 지원, 마케팅 콘텐츠, 문법 교정, 패러프레이징, 카피라이팅",
  "translation": "다국어 번역, 뉘앙스 보존, 실시간 번역, 문서 번역",
  "presentation": "슬라이드 자동 생성, 프레젠테이션 디자인, 스토리텔링, PPT 제작"
};

interface AiToolsListProps {
  filters: {
    category: string;
  };
  sectionRefs?: React.MutableRefObject<{ [key: string]: HTMLElement | null }>;
}

export default function AiToolsList({ filters, sectionRefs }: AiToolsListProps) {
  const [tools, setTools] = useState<AiTool[]>([]); 
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(9); 
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, number>>({});
  
  // 초기 표시 개수를 6개로 설정
  useEffect(() => {
    const initialExpanded: Record<string, number> = {};
    DISPLAY_CATEGORIES.forEach(cat => {
      initialExpanded[cat] = 6;
    });
    setExpandedTools(initialExpanded);
  }, []);

  useEffect(() => {
    console.log('AI_TOOLS_DATA length:', AI_TOOLS_DATA.length);
    console.log('AI_TOOLS_DATA sample:', AI_TOOLS_DATA.slice(0, 3));
    
    const savedRatings = JSON.parse(localStorage.getItem("dori_tool_ratings") || "{}");
    
    const updatedTools = AI_TOOLS_DATA.map(tool => {
      const saved = savedRatings[tool.id];
      if (saved) {
        const avg = saved.count > 0 ? Number((saved.totalScore / saved.count).toFixed(1)) : 0;
        return { ...tool, rating: avg, ratingCount: saved.count };
      }
      return tool; 
    });

    console.log('Updated tools length:', updatedTools.length);
    setTools(updatedTools);
    setIsLoaded(true);
  }, []);

  const isOverviewMode = filters.category === "All";

  const toggleExpand = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const loadMoreTools = (cat: string) => {
    const catTools = currentTools
      .filter(t => t.category === cat)
      .sort((a, b) => b.rating - a.rating);
    
    setExpandedTools(prev => ({
      ...prev,
      [cat]: catTools.length
    }));
  };

  const currentTools = isLoaded && tools.length > 0 ? tools : AI_TOOLS_DATA;
  
  console.log('Current tools length:', currentTools.length);
  console.log('Filters:', filters);
  console.log('Is overview mode:', isOverviewMode);

  // --- [1] 개요 모드 렌더링 (카테고리별 랭킹 섹션) ---
  if (isOverviewMode) {
    return (
      <div className="w-full flex flex-col animate-[fadeInUp_0.5s_ease-out]">
        {DISPLAY_CATEGORIES.map((cat, catIdx) => {
          // 필터링: 정확한 문자열 매칭
          const catTools = currentTools
            .filter(t => String(t.category) === String(cat))
            .sort((a, b) => b.rating - a.rating); 

          if (catTools.length === 0) {
            return null;
          }

          // 각 카테고리에서 표시할 개수 (최소 6개, 더보기 클릭 시 증가)
          const displayCount = Math.max(expandedTools[cat] || 6, 6);
          const displayTools = catTools.slice(0, displayCount);
          const top3 = displayTools.slice(0, 3);
          const rest = displayTools.slice(3);
          const hasMore = catTools.length > displayCount;

          return (
            <section
              key={cat}
              id={`category-${cat}`}
              ref={(el) => {
                if (sectionRefs) {
                  sectionRefs.current[`category-${cat}`] = el;
                }
              }}
              className="relative flex items-center justify-center px-6 lg:pl-10 py-20"
              style={{
                minHeight: '100vh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                scrollMarginTop: '80px',
              }}
            >
              <div className="max-w-7xl mx-auto w-full">
                {/* 카테고리 헤더 */}
                <div className="mb-12 text-center">
                  <h2 
                    className="text-4xl md:text-5xl font-black tracking-tighter mb-4"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </h2>
                  <p 
                    className="text-base md:text-lg font-medium opacity-70"
                    style={{ color: 'var(--text-sub)' }}
                  >
                    {CATEGORY_DESCRIPTIONS[cat] || `${cat.toUpperCase()} 분야의 주요 AI 툴을 확인하세요.`}
                  </p>
                </div>

                {/* 카드 그리드 */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                    {/* 1-3위 (rank 표시) */}
                    {top3.map((tool, idx) => (
                      <AiToolsCard key={tool.id} tool={tool} rank={idx + 1} />
                    ))}
                    
                    {/* 4위 이후 (rank 없음) */}
                    {rest.map((tool) => (
                      <AiToolsCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>

                {/* 더보기 버튼 */}
                {hasMore && (
                  <div className="mt-12 text-center">
                    <button 
                      onClick={() => loadMoreTools(cat)}
                      className="px-8 py-4 rounded-full font-bold text-base transition-all hover:scale-105 active:scale-95 bg-[var(--card-bg)] text-[var(--text-main)] border-2 border-[var(--card-border)] hover:bg-gray-100 dark:hover:bg-white/10 shadow-md hover:shadow-lg"
                    >
                      + {cat.toUpperCase()} 툴 더보기 ({catTools.length - displayCount}개 남음)
                    </button>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  // --- [2] 필터 모드 렌더링 ---
  const filteredTools = currentTools.filter((tool) => {
    const matchCat = filters.category === "All" || tool.category.toLowerCase() === filters.category.toLowerCase();
    return matchCat;
  }).sort((a, b) => b.rating - a.rating); // 기본적으로 평점순 정렬

  const visibleTools = filteredTools.slice(0, visibleCount);

  return (
    <div className="w-full animate-[fadeInUp_0.5s_ease-out]">
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
          {visibleTools.map((tool) => (
            <AiToolsCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-20 opacity-60">
          <p>조건에 맞는 툴이 없습니다. 😢</p>
        </div>
      )}

      {visibleTools.length < filteredTools.length && (
        <div className="flex justify-center mt-16 mb-10">
          <button 
            onClick={() => setVisibleCount((prev) => prev + 9)}
            className="px-10 py-4 rounded-full font-bold text-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-main)] shadow-md hover:shadow-lg"
          >
            {TEXTS.aiTools.button.loadMore.ko} +
          </button>
        </div>
      )}
    </div>
  );
}