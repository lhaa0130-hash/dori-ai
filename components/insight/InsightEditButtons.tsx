"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface InsightEditButtonsProps {
  postId: number;
}

// 작성자 ID 생성 및 관리 유틸리티
const getAuthorId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let authorId = sessionStorage.getItem('dori_insight_author_id');
  if (!authorId) {
    authorId = crypto.randomUUID();
    sessionStorage.setItem('dori_insight_author_id', authorId);
  }
  return authorId;
};

// 본인이 작성한 인사이트 글 ID 목록 가져오기
const getMyInsightIds = (): Set<number> => {
  if (typeof window === 'undefined') return new Set();
  
  const saved = localStorage.getItem('dori_my_insights');
  if (saved) {
    try {
      return new Set(JSON.parse(saved));
    } catch (e) {
      return new Set();
    }
  }
  return new Set();
};

export default function InsightEditButtons({ postId }: InsightEditButtonsProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 로컬스토리지에서 사용자가 작성한 글 확인
    const savedUserPosts = localStorage.getItem("dori_user_insights");
    if (savedUserPosts) {
      try {
        const userPosts = JSON.parse(savedUserPosts);
        const post = userPosts.find((p: any) => p.id === postId);
        
        if (post) {
          // authorId로 확인
          const authorId = getAuthorId();
          if (post.authorId === authorId) {
            setIsOwner(true);
            return;
          }
          
          // myInsightIds로 확인 (기존 데이터 호환성)
          const myIds = getMyInsightIds();
          if (myIds.has(postId)) {
            setIsOwner(true);
          }
        }
      } catch (e) {
        console.error('Failed to parse user insights:', e);
      }
    }
  }, [postId]);

  const handleDelete = () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    const savedUserPosts = localStorage.getItem("dori_user_insights");
    if (savedUserPosts) {
      try {
        const userPosts = JSON.parse(savedUserPosts);
        const updated = userPosts.filter((p: any) => p.id !== postId);
        localStorage.setItem("dori_user_insights", JSON.stringify(updated));
        
        // 본인 작성 목록에서 제거
        const myIds = getMyInsightIds();
        myIds.delete(postId);
        localStorage.setItem('dori_my_insights', JSON.stringify(Array.from(myIds)));
        
        router.push('/insight');
      } catch (e) {
        console.error('Failed to delete insight:', e);
      }
    }
  };

  const handleEdit = () => {
    router.push('/insight');
    // 목록 페이지에서 수정 모드로 전환하기 위해 sessionStorage 사용
    sessionStorage.setItem('dori_edit_insight_post', postId.toString());
  };

  if (!mounted || !isOwner) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={handleEdit}
        className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
        style={{
          backgroundColor: 'var(--card-border)',
          color: 'var(--text-main)',
        }}
      >
        ✏️ 수정
      </button>
      <button
        onClick={handleDelete}
        className="px-4 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
        }}
      >
        🗑️ 삭제
      </button>
    </div>
  );
}













