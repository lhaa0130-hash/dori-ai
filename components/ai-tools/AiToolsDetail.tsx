"use client";

import { useState } from "react";
import Image from "next/image";
import { AiTool } from "@/types/content";
import AiToolsRating from "./AiToolsRating";
import AiToolsComments from "./AiToolsComments";
import { AiBadge } from "@/components/common/AiBadge";

interface AiToolsDetailProps {
  tool: AiTool;
}

export default function AiToolsDetail({ tool }: AiToolsDetailProps) {
  // 실시간 평점 반영을 위한 상태
  const [currentRating, setCurrentRating] = useState(tool.rating);
  const [currentCount, setCurrentCount] = useState(tool.ratingCount);

  const handleRatingUpdate = (newRating: number, newCount: number) => {
    setCurrentRating(newRating);
    setCurrentCount(newCount);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 animate-[fadeInUp_0.5s_ease-out]">
      
      {/* 1. 헤더: 로고 & 핵심 정보 */}
      <div className="flex flex-col md:flex-row gap-8 mb-12 items-start">
        {/* 로고 (썸네일) */}
        <div className="relative w-full md:w-[300px] aspect-video rounded-3xl overflow-hidden border border-[var(--card-border)] shadow-lg bg-white dark:bg-gray-800 flex items-center justify-center">
           {/* 외부 이미지(유튜브 썸네일 등)일 경우 Image 컴포넌트 사용, 아니면 텍스트 로고 대체 */}
           {tool.thumbnail.startsWith("http") ? (
              <Image 
                src={tool.thumbnail} 
                alt={tool.name} 
                layout="fill" 
                objectFit="cover" 
                className="hover:scale-105 transition-transform duration-700"
              />
           ) : (
             <span className="text-4xl font-bold text-gray-400">{tool.name[0]}</span>
           )}
        </div>
        
        {/* 정보 */}
        <div className="flex-1 flex flex-col justify-center w-full">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
              {tool.category}
            </span>
            <AiBadge aiMeta={tool.aiMeta} />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-[var(--text-main)]">{tool.name}</h1>
          <p className="text-xl opacity-80 mb-6 leading-relaxed text-[var(--text-main)]">{tool.summary}</p>
          
          {/* 태그 */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tool.tags.map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-lg bg-[var(--bg-soft)] border border-[var(--card-border)] text-sm font-medium text-[var(--text-sub)]">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href={tool.website} 
              target="_blank" 
              rel="noreferrer"
              className="flex-1 py-4 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-center font-bold text-lg hover:opacity-80 transition-opacity shadow-md"
            >
              공식 웹사이트 방문 ↗
            </a>
          </div>
        </div>
      </div>

      {/* 2. 상세 정보 및 평점 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* 왼쪽: 설명 */}
        <div className="md:col-span-2 space-y-8">
          <section className="p-6 rounded-[2rem] bg-[var(--bg-soft)] border border-[var(--card-border)]">
            <h3 className="text-xl font-bold mb-4 text-[var(--text-main)]">주요 기능 및 소개</h3>
            <p className="text-lg leading-8 opacity-80 whitespace-pre-line text-[var(--text-main)]">
              {tool.description}
            </p>
          </section>
          
          {/* 댓글 시스템 */}
          <AiToolsComments toolId={tool.id} />
        </div>

        {/* 오른쪽: 스펙 및 평점 */}
        <div className="space-y-6">
          {/* 스펙 박스 */}
          <div className="p-6 rounded-[2rem] bg-[var(--bg-soft)] border border-[var(--card-border)] space-y-4">
            <div>
              <span className="text-xs font-bold opacity-50 block mb-1">출시일</span>
              <span className="text-lg font-medium text-[var(--text-main)]">{tool.releaseDate}</span>
            </div>
            <div>
              <span className="text-xs font-bold opacity-50 block mb-1">가격 정책</span>
              <span className="text-lg font-medium text-blue-500">{tool.pricing}</span>
            </div>
            <div>
              <span className="text-xs font-bold opacity-50 block mb-1">유저 평점</span>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-extrabold text-yellow-400">
                  {currentRating > 0 ? currentRating : "0.0"}
                </span>
                <div className="flex flex-col text-xs opacity-60">
                  <span>/ 5.0</span>
                  <span>({currentCount}명 참여)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 평점 컴포넌트 */}
          <AiToolsRating 
            toolId={tool.id} 
            initialRating={tool.rating} 
            initialCount={tool.ratingCount}
            onRatingUpdate={handleRatingUpdate}
          />
        </div>
      </div>

    </div>
  );
}