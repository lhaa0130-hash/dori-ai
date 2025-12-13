"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AiTool } from "@/types/content";
import { AiBadge } from "@/components/common/AiBadge";
import AiToolsRating from "./AiToolsRating";
import AiToolsComments from "./AiToolsComments";

interface AiToolsCardProps {
  tool: AiTool;
  rank?: number;
}

export default function AiToolsCard({ tool, rank }: AiToolsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(tool.rating);
  const [currentCount, setCurrentCount] = useState(tool.ratingCount);

  useEffect(() => {
    setCurrentRating(tool.rating);
    setCurrentCount(tool.ratingCount);
  }, [tool.rating, tool.ratingCount]);

  const handleRatingUpdate = (newRating: number, newCount: number) => {
    setCurrentRating(newRating);
    setCurrentCount(newCount);
  };

  const getRankBadge = (r: number) => {
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
  };

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--card-border)",
        color: "var(--text-main)",
      }}
      className={`relative flex flex-col rounded-3xl border transition-all duration-300 group hover:shadow-lg hover:-translate-y-1`}
    >
      {/* ⭐ 전체 클릭 오버레이 */}
      <a
        href={tool.website}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute inset-0 z-10"
      />

      {/* ⭐ 콘텐츠는 z-20로 올려서 버튼 클릭 정상 작동 */}
      <div className="p-6 flex flex-col h-full relative z-20">
        {rank && getRankBadge(rank)}

        {/* 상단 헤더 */}
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white flex-shrink-0">
            <Image
              src={tool.thumbnail}
              alt={tool.name}
              layout="fill"
              objectFit="cover"
              className="transition-transform duration-500 group-hover:scale-110"
              placeholder="empty"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/10 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-300 uppercase tracking-wider">
              {tool.category}
            </span>
            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-xs">★</span>
              <span className="text-xs font-bold text-black dark:text-white">
                {currentRating > 0 ? currentRating.toFixed(1) : "0.0"}
              </span>
              <span className="text-[10px] text-black dark:text-white opacity-60">
                ({currentCount})
              </span>
            </div>
          </div>
        </div>

        {/* 타이틀 */}
        <div className="mb-3">
          <h3 className="text-2xl font-black leading-tight break-words group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {tool.name}
          </h3>
          <div className="mt-2">
            <AiBadge aiMeta={tool.aiMeta} />
          </div>
        </div>

        {/* 설명 */}
        <p className="text-sm opacity-70 leading-relaxed mb-5 line-clamp-2">
          {tool.summary}
        </p>

        {/* 태그 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tool.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md border opacity-80"
              style={{
                backgroundColor: "var(--bg-main)",
                borderColor: "var(--card-border)",
                color: "var(--text-main)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* 하단 액션 */}
        <div
          className="mt-auto pt-4 border-t border-dashed flex items-center justify-between"
          style={{ borderColor: "var(--card-border)" }}
        >
          {/* 리뷰 버튼 - 링크 방지 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--card-border)",
              color: "var(--text-main)",
              backgroundColor: "transparent",
            }}
          >
            {isOpen ? "닫기" : "리뷰/평가"}
          </button>

          {/* 바로가기 버튼 - 링크 방해 방지 */}
          <a
            href={tool.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity shadow-sm"
            style={{ backgroundColor: "var(--text-main)", color: "var(--card-bg)" }}
          >
            바로가기 →
          </a>
        </div>

        {/* 확장 영역 */}
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
            <AiToolsComments toolId={tool.id} compact={true} />
          </div>
        )}
      </div>
    </div>
  );
}
