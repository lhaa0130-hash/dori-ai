"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { AiTool, AiToolComment } from "@/types/content";
import { CATEGORY_LABELS } from "@/constants/aiCategories";
import { AiBadge } from "@/components/common/AiBadge";
import AiToolsRating from "./AiToolsRating";
import AiToolsComments from "./AiToolsComments";

interface AiToolsCardProps {
  tool: AiTool;
  rank?: number;
}

const AiToolsCard = React.memo(function AiToolsCard({ tool, rank }: AiToolsCardProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';

  const [currentRating, setCurrentRating] = useState(tool.rating);
  const [currentCount, setCurrentCount] = useState(tool.ratingCount);
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(tool.thumbnail);
  const [bestComments, setBestComments] = useState<AiToolComment[]>([]);



  useEffect(() => {
    setCurrentRating(tool.rating);
    setCurrentCount(tool.ratingCount);
    setImageSrc(tool.thumbnail);
    setImageError(false);

    // 베스트 댓글 3개 로드 (최신순)
    const savedData = JSON.parse(localStorage.getItem("dori_tool_comments") || "{}");
    if (savedData[tool.id]) {
      const comments = savedData[tool.id] as AiToolComment[];
      // 최신순으로 정렬하여 상위 3개만
      const sorted = [...comments].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBestComments(sorted.slice(0, 3));
    }
  }, [tool.rating, tool.ratingCount, tool.thumbnail, tool.id]);

  // 이미지 URL 생성 함수 (useMemo로 최적화)
  const imageUrl = useMemo(() => {
    if (imageError || !imageSrc) {
      // Fallback: 도메인에서 직접 로고 가져오기 시도
      try {
        const url = new URL(tool.website);
        const domain = url.hostname.replace('www.', '');
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch {
        return '/images/placeholder-tool.png';
      }
    }
    return imageSrc;
  }, [imageError, imageSrc, tool.website]);

  const handleImageError = useCallback(() => {
    if (!imageError) {
      setImageError(true);
      // clearbit 실패 시 Google favicon 시도
      try {
        const url = new URL(tool.website);
        const domain = url.hostname.replace('www.', '');
        setImageSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
      } catch {
        setImageSrc('/images/placeholder-tool.png');
      }
    }
  }, [imageError, tool.website]);

  const handleRatingUpdate = useCallback((newRating: number, newCount: number) => {
    setCurrentRating(newRating);
    setCurrentCount(newCount);
  }, []);

  const handleCommentUpdate = useCallback(() => {
    // 댓글이 업데이트되면 베스트 댓글 다시 로드
    const savedData = JSON.parse(localStorage.getItem("dori_tool_comments") || "{}");
    if (savedData[tool.id]) {
      const comments = savedData[tool.id] as AiToolComment[];
      const sorted = [...comments].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBestComments(sorted.slice(0, 3));
    }
  }, [tool.id]);

  const rankBadge = useMemo(() => {
    if (!rank) return null;
    const r = rank;
    if (r === 1)
      return (
        <div className="absolute -top-3 -left-3 w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-full flex items-center justify-center font-black text-base shadow-lg border-4 border-white dark:border-black z-30 transform -rotate-12">
          1위
        </div>
      );
    if (r === 2)
      return (
        <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg border-4 border-white dark:border-black z-30 transform -rotate-12">
          2위
        </div>
      );
    if (r === 3)
      return (
        <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg border-4 border-white dark:border-black z-30 transform -rotate-12">
          3위
        </div>
      );
    return null;
  }, [rank]);

  return (
    <div
      className={`relative flex flex-col rounded-lg bg-card border border-strict transition-all duration-300 group hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md overflow-hidden`}
    >
      {/* ⭐ 전체 클릭 오버레이 (웹사이트 이동) */}
      <a
        href={tool.website}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10 cursor-pointer"
      />

      {/* ⭐ 상단 행 (항상 보임) - Single Line Layout */}
      <div className="flex flex-row items-center px-4 py-2 gap-3 relative z-20 h-14 sm:h-16">
        {rankBadge}

        {/* 1. 이미지 (작게) */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border flex-shrink-0 bg-orange-50/50 dark:bg-orange-900/10 border-orange-100/50 dark:border-orange-900/20">
          {imageSrc ? (
            <Image
              src={imageUrl}
              alt={tool.name}
              fill
              sizes="48px"
              className="object-cover"
              onError={handleImageError}
              unoptimized={imageSrc.includes('google.com/s2/favicons')}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">🤖</div>
          )}
        </div>

        {/* 2. 정보 섹션 (Single Line Layout) */}
        <div className="flex items-center flex-1 min-w-0 gap-3">
          {/* 이름 & 카테고리 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <h3 className={`text-sm sm:text-base font-bold truncate max-w-[120px] sm:max-w-[200px] transition-colors group-hover:text-orange-500 ${isDark ? "text-white" : "text-neutral-900"}`}>
              {tool.name}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap hidden sm:inline-block bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30`}>
              {CATEGORY_LABELS[tool.category] || tool.category}
            </span>
          </div>

          {/* 설명 (가장 넓게 차지, 한 줄 말줄임) */}
          <p className={`text-xs truncate flex-1 opacity-60 hidden md:block ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
            {tool.summary}
          </p>

          {/* 평점 (우측 정렬 전) */}
          <div className="flex items-center gap-0.5 ml-auto sm:ml-0 bg-orange-50 dark:bg-orange-900/20 px-1.5 rounded-sm flex-shrink-0 border border-orange-100/50 dark:border-orange-900/30">
            <span className="text-orange-400 text-[10px]">★</span>
            <span className={`text-[10px] font-bold ${isDark ? "text-orange-400" : "text-orange-600"}`}>
              {currentRating > 0 ? currentRating.toFixed(1) : "0.0"}
            </span>
          </div>
        </div>

        {/* 3. 우측 액션 (리뷰 펼치기 + 바로가기 버튼) */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isOpen ? "text-orange-500 bg-orange-50 dark:bg-orange-900/20" : "text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900"}`}
            title="리뷰 보기"
          >
            <span>평가하기</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white ${isDark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-600"}`}
          >
            <span className="whitespace-nowrap">바로가기</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          </a>
        </div>
      </div>

      {/* ⭐ 확장 영역: 리뷰 및 상세 (애니메이션) */}
      <div
        className={`transition-all duration-300 ease-in-out bg-neutral-50 dark:bg-neutral-900/50 border-t border-dashed border-neutral-200 dark:border-neutral-800 overflow-hidden ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-4 flex flex-col gap-4 relative z-20">
          {/* 베스트 댓글 3개 */}
          <div className="flex-1">
            <h4 className={`text-[10px] font-bold mb-2 uppercase tracking-wider ${isDark ? "text-neutral-400" : "text-neutral-500"}`}>
              베스트 댓글
            </h4>
            <div className="flex flex-col gap-2">
              {bestComments.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-2">아직 댓글이 없습니다.</p>
              ) : (
                bestComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border p-2.5 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-black"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold ${isDark ? "text-neutral-200" : "text-neutral-900"}`}>{comment.userName}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed opacity-90 ${isDark ? "text-neutral-300" : "text-neutral-700"}`}>
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 인터랙티브 컴포넌트 */}
          <div className="flex flex-col gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <AiToolsRating
              toolId={tool.id}
              initialRating={tool.rating}
              initialCount={tool.ratingCount}
              onRatingUpdate={handleRatingUpdate}
              compact={true}
            />
            <AiToolsComments
              toolId={tool.id}
              compact={true}
              onCommentUpdate={handleCommentUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default AiToolsCard;
