"use client";

import { useRef, useState, useEffect, MouseEvent } from "react";
import Link from "next/link";
import { TEXTS } from "@/constants/texts";

export default function CommunityPreview() {
  const tTitle = TEXTS.home.sectionTitles.community.ko;
  const tDesc = TEXTS.home.sectionTitles.communityDesc.ko;
  const tViewAll = TEXTS.home.sectionTitles.viewAll.ko;

  // 📌 요청된 더미 데이터 (스크롤 테스트용)
  const dummyPosts = [
    { id: 1, title: "방금 Leonardo로 만든 이미지", author: "user1", likes: 12 },
    { id: 2, title: "Gemini랑 자동화 짜봤다", author: "user9", likes: 30 },
    { id: 3, title: "내 프롬프트 공유합니다", author: "user7", likes: 18 },
    { id: 4, title: "Runway vs Pika 비교", author: "user4", likes: 22 },
    // 스크롤 효과를 위해 데이터 반복
    { id: 5, title: "AI 뉴스 요약봇 만들기", author: "user2", likes: 15 },
    { id: 6, title: "Stable Diffusion 설치 질문", author: "user5", likes: 8 }
  ];

  // 📌 드래그 스크롤 로직 복원
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조절
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // 화살표 버튼 이동 함수
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="max-w-[1200px] mx-auto px-6 mb-24 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ color: 'var(--text-main)' }}>{tTitle}</h2>
          <p style={{ color: 'var(--text-sub)' }}>{tDesc}</p>
        </div>
        
        {/* 화살표 버튼 및 전체보기 */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            <button onClick={() => scroll('left')} className="p-2 rounded-full border hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" style={{ borderColor: 'var(--card-border)', color: 'var(--text-main)' }}>←</button>
            <button onClick={() => scroll('right')} className="p-2 rounded-full border hover:bg-gray-100 dark:hover:bg-white/10 transition-colors" style={{ borderColor: 'var(--card-border)', color: 'var(--text-main)' }}>→</button>
          </div>
          <Link href="/community" className="font-semibold text-sm hover:underline text-blue-600">
            {tViewAll}
          </Link>
        </div>
      </div>

      <div 
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar select-none cursor-grab active:cursor-grabbing"
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {dummyPosts.map((post) => (
          <Link href={`/community/${post.id}`} key={post.id} 
            className="flex-none w-[280px] md:w-[320px] rounded-[2rem] border overflow-hidden shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderColor: 'var(--card-border)',
              color: 'var(--text-main)'
            }}
          >
            <div className="relative w-full aspect-[16/10] bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
               <span className="text-4xl">💬</span>
            </div>
            <div className="p-6">
              <div className="font-bold text-lg mb-2 truncate">{post.title}</div>
              <div className="flex justify-between items-center text-sm opacity-60">
                <span>{post.author}</span>
                <span>❤️ {post.likes}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}