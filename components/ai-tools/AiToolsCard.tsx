"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { AiTool, AiToolComment } from "@/types/content";
import { AiBadge } from "@/components/common/AiBadge";
import AiToolsRating from "./AiToolsRating";
import AiToolsComments from "./AiToolsComments";

interface AiToolsCardProps {
  tool: AiTool;
  rank?: number;
}

const AiToolsCard = React.memo(function AiToolsCard({ tool, rank }: AiToolsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
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
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
        color: "var(--text-main)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}
      className={`relative flex flex-col rounded-3xl border-2 transition-all duration-300 group hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] min-h-[300px]`}
    >
      {/* ⭐ 전체 클릭 오버레이 */}
      <a
        href={tool.website}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10"
      />

      {/* ⭐ 콘텐츠는 z-20로 올려서 버튼 클릭 정상 작동 */}
      <div className="p-5 flex flex-col h-full relative z-20">
        {rankBadge}

        {/* 상단: 이미지 옆에 카테고리와 평점 */}
        <div className="flex items-start gap-3 mb-4">
          {/* 이미지 */}
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            {imageSrc ? (
              <Image
                src={imageUrl}
                alt={tool.name}
                fill
                sizes="64px"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                onError={handleImageError}
                unoptimized={imageSrc.includes('google.com/s2/favicons')}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                🤖
              </div>
            )}
          </div>

          {/* 카테고리와 평점 네모박스 */}
          <div className="flex items-center gap-3 flex-1">
            {/* 카테고리 네모박스 */}
            <span 
              className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-md border"
              style={{
                backgroundColor: "var(--bg-main)",
                borderColor: "var(--card-border)",
                color: "var(--accent-color)",
              }}
            >
              {tool.category}
            </span>
            
            {/* 평점 */}
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-sm">★</span>
              <span 
                className="text-sm font-bold"
                style={{
                  color: "var(--text-main)",
                }}
              >
                {currentRating > 0 ? currentRating.toFixed(1) : "0.0"}
              </span>
            </div>
          </div>
        </div>

        {/* AI 이름 */}
        <div className="mb-3">
          <h3 
            className="text-xl md:text-2xl font-black leading-tight break-words transition-colors duration-300"
            style={{
              color: "var(--text-main)",
              lineHeight: '1.2',
            }}
          >
            {tool.name}
            {tool.company && (
              <span 
                className="text-sm md:text-base font-normal ml-2 opacity-70"
                style={{
                  color: "var(--text-sub)",
                }}
              >
                ({tool.company})
              </span>
            )}
          </h3>
        </div>

        {/* AI 강점 (한 줄) */}
        {tool.strength && (
          <div className="mb-3">
            <p 
              className="text-sm font-medium opacity-80 leading-relaxed"
              style={{
                color: "var(--text-sub)",
              }}
            >
              {tool.strength}
            </p>
          </div>
        )}

        {/* 베스트 댓글 3개 */}
        <div className="mb-4 flex-1">
          <h4 className="text-[10px] font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wider">
            베스트 댓글
          </h4>
          <div className="flex flex-col gap-1.5">
            {bestComments.length === 0 ? (
              <div className="text-center py-2 border border-dashed border-[var(--card-border)] rounded-lg">
                <p className="text-[10px] text-gray-400">아직 댓글이 없습니다.</p>
              </div>
            ) : (
              bestComments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="rounded-md border border-[var(--card-border)] bg-[var(--bg-main)] p-2"
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-[var(--text-main)]">{comment.userName}</span>
                      <span className="text-[8px] opacity-50 text-[var(--text-sub)]">
                        {new Date(comment.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-90 whitespace-pre-wrap text-[var(--text-main)] line-clamp-2">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 하단 액션 버튼: 리뷰쓰기와 바로가기 */}
        <div
          className="mt-auto pt-3 border-t border-dashed flex items-center gap-2"
          style={{ borderColor: "var(--card-border)" }}
        >
          {/* 리뷰쓰기 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-200 hover:scale-105"
            style={{
              borderColor: "var(--card-border)",
              color: "var(--text-main)",
              backgroundColor: "transparent",
            }}
          >
            {isOpen ? "닫기" : "리뷰쓰기"}
          </button>

          {/* 바로가기 버튼 */}
          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 shadow-md text-center"
            style={{ 
              backgroundColor: "var(--text-main)", 
              color: "var(--card-bg)",
            }}
          >
            바로가기 →
          </a>
        </div>

        {/* 확장 영역: 리뷰 작성 및 전체 댓글 */}
        {isOpen && (
          <div
            className="mt-5 pt-5 border-t animate-[fadeInUp_0.2s_ease-out]"
            style={{ borderColor: "var(--card-border)" }}
          >
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
        )}
      </div>
    </div>
  );
});

AiToolsCard.displayName = 'AiToolsCard';

export default AiToolsCard;
