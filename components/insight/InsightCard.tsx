"use client";

import React, { useState, useEffect } from "react";
import { TEXTS } from "@/constants/texts";
import { InsightItem } from "@/types/content";
import { AiBadge } from "@/components/common/AiBadge";

interface InsightCardProps {
  item: InsightItem;
  onTagClick: (tag: string) => void;
  onLikeChange?: (id: number, newLikes: number) => void;
  isOwner?: boolean; // 본인 글인지 여부
  onEdit?: (item: InsightItem) => void;
  onDelete?: (id: number) => void;
}

const InsightCard = React.memo(({ item, onTagClick, onLikeChange, isOwner = false, onEdit, onDelete }: InsightCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 로컬스토리지에서 좋아요 상태 확인
    const likedPosts = JSON.parse(localStorage.getItem('dori_liked_insights') || '[]');
    setIsLiked(likedPosts.includes(item.id));
    
    // 로컬스토리지에서 좋아요 수 확인
    const likesData = JSON.parse(localStorage.getItem('dori_insight_likes') || '{}');
    if (likesData[item.id] !== undefined) {
      setLikes(likesData[item.id]);
    }
  }, [item.id]);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!mounted) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    
    // 좋아요한 글 ID 목록 업데이트
    const likedPosts = JSON.parse(localStorage.getItem('dori_liked_insights') || '[]');
    if (newIsLiked) {
      if (!likedPosts.includes(item.id)) {
        likedPosts.push(item.id);
      }
    } else {
      const index = likedPosts.indexOf(item.id);
      if (index > -1) {
        likedPosts.splice(index, 1);
      }
    }
    localStorage.setItem('dori_liked_insights', JSON.stringify(likedPosts));
    
    // 좋아요 수 업데이트
    const newLikes = newIsLiked ? likes + 1 : Math.max(0, likes - 1);
    setLikes(newLikes);
    
    // 로컬스토리지에 좋아요 수 저장
    const likesData = JSON.parse(localStorage.getItem('dori_insight_likes') || '{}');
    likesData[item.id] = newLikes;
    localStorage.setItem('dori_insight_likes', JSON.stringify(likesData));
    
    // 좋아요를 누를 때만 작성자 포인트 증가
    if (newIsLiked && item.author) {
      // 모든 사용자 프로필에서 작성자 찾기
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.startsWith('dori_profile_')) {
          try {
            const profile = JSON.parse(localStorage.getItem(key) || '{}');
            if (profile.nickname === item.author) {
              // 포인트 증가 (좋아요 받을 때 1포인트)
              const updatedProfile = {
                ...profile,
                point: (profile.point || 0) + 1,
              };
              localStorage.setItem(key, JSON.stringify(updatedProfile));
              
              // 포인트 추가 이벤트 발생
              import('@/lib/missionProgress').then(({ addPoints }) => {
                addPoints(1, '글 좋아요 받음');
              });
              break;
            }
          } catch (e) {
            console.error('Failed to parse profile:', e);
          }
        }
      }
      
      // 좋아요 미션 진행도 업데이트
      import('@/lib/missionProgress').then(({ handleLikeMission }) => {
        handleLikeMission().catch(err => console.error('좋아요 미션 오류:', err));
      });
    }
    
    // 부모 컴포넌트에 변경 알림
    if (onLikeChange) {
      onLikeChange(item.id, newLikes);
    }
  };

  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  return (
    <div
      className="relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl group cursor-pointer min-h-[300px] overflow-hidden"
      style={cardStyle}
    >
      {/* 상단 주황 포인트 라인 (hover 시) */}
      <span className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FBAA60] via-[#F9954E] to-[#E8832E] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />

      {/* 썸네일 이미지 */}
      {item.image && (
        <div className="w-full h-48 mb-4 rounded-2xl overflow-hidden relative">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            width={400}
            height={192}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              // 이미지 로드 실패 시 숨김
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-5">
        <span 
          className="px-3 py-1 text-xs font-bold rounded-full border"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--card-border)',
            color: 'var(--accent-color)',
          }}
        >
          {item.category}
        </span>
        
        <span 
          className="text-xs opacity-60" 
          style={{ color: 'var(--text-sub)' }}
          suppressHydrationWarning={true}
        >
          {new Date(item.date).toLocaleDateString()}
        </span>
      </div>

      <h3 
        className="text-xl font-black mb-3 leading-snug break-keep"
        style={{ color: 'var(--text-main)' }}
      >
        {item.title}
      </h3>
      
      <div className="mb-4">
        <AiBadge aiMeta={item.aiMeta} />
      </div>

      <p 
        className="text-sm mb-4 line-clamp-2 leading-relaxed" 
        style={{ color: 'var(--text-sub)' }}
      >
        {item.summary}
      </p>

      {/* 태그 섹션 */}
      <div className="mb-5">
        <div className="flex flex-wrap gap-2">
          {item.tags.slice(0, 4).map((tag) => (
            <span 
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              className="text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all duration-200 hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-sub)',
              }}
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 4 && (
            <span 
              className="text-[10px] font-medium px-2.5 py-1 rounded-md opacity-60"
              style={{ color: 'var(--text-sub)' }}
            >
              +{item.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-5 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <span 
            className="font-semibold text-sm transition-all duration-200 hover:scale-105"
            style={{ color: 'var(--accent-color)' }}
          >
            {TEXTS.insight.button.readMore.ko} →
          </span>
          <button
            onClick={handleLikeClick}
            className="flex items-center gap-1.5 text-xs transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ 
              color: isLiked ? '#ef4444' : 'var(--text-sub)',
              opacity: isLiked ? 1 : 0.6,
            }}
          >
            <span className="text-base transition-transform duration-200" style={{ transform: isLiked ? 'scale(1.2)' : 'scale(1)' }}>
              {isLiked ? '❤️' : '🤍'}
            </span>
            <span>{likes}</span>
          </button>
        </div>
        
        {/* 본인 글인 경우 수정/삭제 버튼 */}
        {isOwner && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-3 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: 'var(--card-border)',
                  color: 'var(--text-main)',
                }}
              >
                ✏️ 수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm('정말 삭제하시겠습니까?')) {
                    onDelete(item.id);
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                }}
              >
                🗑️ 삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default InsightCard;