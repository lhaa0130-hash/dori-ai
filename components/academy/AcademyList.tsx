"use client";

import { useState } from "react";
import AcademyCard, { AcademyItem } from "./AcademyCard";
import { TEXTS } from "@/constants/texts";

// 📌 더미 데이터 (AcademyItem 타입 준수)
// 유튜브 ID는 예시(실제 영상 ID로 교체 가능)
const ACADEMY_DATA: AcademyItem[] = [
  { id: 1, title: "ChatGPT 고급 프롬프트 작성법: 제로샷부터 체인오브소트까지", description: "AI에게 더 똑똑하게 질문하는 방법. 프롬프트 엔지니어링의 핵심 기법을 다룹니다.", level: "중급", category: "프롬프트", youtubeId: "jEnjTq8G5j8" },
  { id: 2, title: "Leonardo.ai 이미지 생성 마스터 클래스", description: "무료로 고퀄리티 이미지를 생성하는 레오나르도 AI의 모든 기능을 파헤칩니다.", level: "초급", category: "이미지", youtubeId: "bZ1W7b5h1s" }, // 임의 ID
  { id: 3, title: "Pika 1.0으로 영화 같은 영상 만들기", description: "텍스트만으로 애니메이션과 실사 영상을 만드는 Pika 사용법 기초.", level: "초급", category: "영상", youtubeId: "M7q_1eH2j3k" }, // 임의 ID
  { id: 4, title: "n8n 자동화 입문: 코딩 없이 업무 자동화하기", description: "반복적인 업무를 n8n 워크플로우로 자동화하여 생산성을 10배 높이는 법.", level: "초급", category: "자동화", youtubeId: "9bZkq8q7j1" }, // 임의 ID
  { id: 5, title: "Runway Gen-2 고급 편집 기술: 모션 브러쉬 활용", description: "영상 내 특정 부분만 움직이게 만드는 런웨이의 고급 기능을 실습합니다.", level: "고급", category: "영상", youtubeId: "kL8j3h2g1f" }, // 임의 ID
  { id: 6, title: "Suno AI로 나만의 노래 작곡하기", description: "음악 이론을 몰라도 AI로 작곡, 작사, 보컬까지 한 번에 해결하는 방법.", level: "초급", category: "음성", youtubeId: "pQ9w2e3r4t" }, // 임의 ID
  { id: 7, title: "Midjourney v6 완벽 가이드: 스타일 레퍼런스 활용", description: "미드저니 최신 버전의 기능을 활용해 일관된 스타일의 이미지를 뽑아내는 팁.", level: "중급", category: "이미지", youtubeId: "xY1z2a3b4c" }, // 임의 ID
  { id: 8, title: "LangChain으로 나만의 AI 챗봇 만들기", description: "파이썬 기초만 있으면 가능한 랭체인 실습. 내 데이터를 학습한 챗봇 구축.", level: "고급", category: "기타", youtubeId: "dV5c6b7n8m" }, // 임의 ID
  { id: 9, title: "ElevenLabs로 자연스러운 AI 성우 만들기", description: "텍스트를 사람처럼 읽어주는 TTS 기술의 끝판왕, 일레븐랩스 활용법.", level: "초급", category: "음성", youtubeId: "fG4h5j6k7l" }, // 임의 ID
];

interface AcademyListProps {
  searchTerm: string;
  filters: {
    level: string;
    category: string;
  };
}

export default function AcademyList({ searchTerm, filters }: AcademyListProps) {
  const [visibleCount, setVisibleCount] = useState(6);

  // 🔍 검색 & 필터링 로직
  const filteredData = ACADEMY_DATA.filter((item) => {
    // 1. 검색어 필터 (제목 or 설명)
    const matchSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. 난이도 필터
    const matchLevel = filters.level === "All" || item.level === filters.level;
    
    // 3. 카테고리 필터
    const matchCategory = filters.category === "All" || item.category === filters.category;

    return matchSearch && matchLevel && matchCategory;
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