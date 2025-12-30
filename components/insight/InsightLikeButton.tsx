"use client";

import { useState, useEffect } from "react";

interface InsightLikeButtonProps {
  postId: number;
  initialLikes: number;
}

export default function InsightLikeButton({ postId, initialLikes }: InsightLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 로컬스토리지에서 좋아요 상태 확인
    const likedPosts = JSON.parse(localStorage.getItem('dori_liked_insights') || '[]');
    setIsLiked(likedPosts.includes(postId));
    
    // 로컬스토리지에서 좋아요 수 확인
    const likesData = JSON.parse(localStorage.getItem('dori_insight_likes') || '{}');
    if (likesData[postId] !== undefined) {
      setLikes(likesData[postId]);
    }
  }, [postId]);

  const handleLikeClick = () => {
    if (!mounted) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    
    // 좋아요한 글 ID 목록 업데이트
    const likedPosts = JSON.parse(localStorage.getItem('dori_liked_insights') || '[]');
    if (newIsLiked) {
      if (!likedPosts.includes(postId)) {
        likedPosts.push(postId);
      }
    } else {
      const index = likedPosts.indexOf(postId);
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
    likesData[postId] = newLikes;
    localStorage.setItem('dori_insight_likes', JSON.stringify(likesData));
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm opacity-60 font-medium dark:text-white">
        <span>❤️ {initialLikes}명이 좋아함</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleLikeClick}
      className="flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-110 active:scale-95"
      style={{ 
        color: isLiked ? '#ef4444' : 'rgba(0, 0, 0, 0.6)',
        opacity: isLiked ? 1 : 0.6,
      }}
    >
      <span className="text-lg transition-transform duration-200" style={{ transform: isLiked ? 'scale(1.2)' : 'scale(1)' }}>
        {isLiked ? '❤️' : '🤍'}
      </span>
      <span>{likes}명이 좋아함</span>
    </button>
  );
}

