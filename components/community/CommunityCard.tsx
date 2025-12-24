"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AiMeta } from "@/types/content";
import { AiBadge } from "@/components/common/AiBadge";
import { addUserScore } from "@/lib/userProfile";

export type CommunityTag = "질문" | "정보" | "자랑" | "잡담";

export type CommunityPost = {
  id: number;
  nickname: string;
  title: string;
  content: string;
  tag: CommunityTag;
  likes: number;
  createdAt: string;
  aiMeta?: AiMeta;
  comments?: number;
  commentsList?: { id: number; text: string; author: string; date: string; }[];
};

interface CommunityCardProps {
  post: CommunityPost;
  onLike: (id: number) => void;
  onPostUpdate?: (updatedPost: CommunityPost) => void;
  onPostDelete?: (postId: number) => void;
}

const CommunityCard = React.memo(({ post, onLike, onPostUpdate, onPostDelete }: CommunityCardProps) => {
  const { data: session } = useSession();
  const user = session?.user || null;
  const [isLiked, setIsLiked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [localPost, setLocalPost] = useState<CommunityPost>(post);
  
  const canManage = user && (user.name === localPost.nickname || user.name === localPost.author || user.name === "관리자");

  useEffect(() => {
    // 좋아요 상태 확인
    const likedPosts = JSON.parse(localStorage.getItem("dori_liked_posts") || "[]");
    setIsLiked(likedPosts.includes(String(post.id)));
    
    // 포스트 데이터 동기화
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const foundPost = savedPosts.find((p: any) => String(p.id) === String(post.id));
    if (foundPost) {
      setLocalPost({ ...post, ...foundPost });
    }
  }, [post.id, post]);

  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return alert("댓글 내용을 입력해주세요.");
    if (!user) return alert("로그인이 필요합니다.");
    
    const newComment = { 
      id: Date.now(), 
      text: comment, 
      author: user.name || user.email?.split('@')[0] || "익명",
      date: new Date().toLocaleDateString() 
    };
    
    const updatedCommentsList = [...(localPost.commentsList || []), newComment];
    const updatedPost = { 
      ...localPost, 
      commentsList: updatedCommentsList, 
      comments: updatedCommentsList.length 
    };
    
    // localStorage 업데이트
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const updatedPosts = savedPosts.map((p: any) => 
      String(p.id) === String(post.id) ? updatedPost : p
    );
    localStorage.setItem("dori_posts", JSON.stringify(updatedPosts));
    
    // 댓글 작성 시 점수 증가
    if (user.email) {
      addUserScore(user.email, "comment");
    }
    
    setLocalPost(updatedPost);
    setComment("");
    if (onPostUpdate) onPostUpdate(updatedPost);
  };

  const handleCommentDelete = (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    const updatedList = (localPost.commentsList || []).filter((c: any) => c.id !== commentId);
    const updatedPost = { 
      ...localPost, 
      commentsList: updatedList, 
      comments: updatedList.length 
    };
    
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const updatedPosts = savedPosts.map((p: any) => 
      String(p.id) === String(post.id) ? updatedPost : p
    );
    localStorage.setItem("dori_posts", JSON.stringify(updatedPosts));
    
    setLocalPost(updatedPost);
    if (onPostUpdate) onPostUpdate(updatedPost);
  };

  const handlePostDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;
    
    const savedPosts = JSON.parse(localStorage.getItem("dori_posts") || "[]");
    const filteredPosts = savedPosts.filter((p: any) => String(p.id) !== String(post.id));
    localStorage.setItem("dori_posts", JSON.stringify(filteredPosts));
    
    if (onPostDelete) {
      onPostDelete(post.id);
    }
    
    alert("삭제되었습니다.");
  };

  const getTagColor = (tag: CommunityTag) => { /* 기존 색상 로직 유지 */ return "bg-gray-100"; };

  return (
    <div className="relative">
      <div 
        className="relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl group min-h-[220px] cursor-pointer" 
        style={cardStyle}
        onClick={() => setIsExpanded(!isExpanded)}
      >
      <div className="flex justify-between items-center mb-4">
        <span 
          className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--card-border)',
            color: 'var(--accent-color)',
          }}
        >
          {post.tag}
        </span>
        <div className="flex items-center gap-2">
          {canManage && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <a 
                href={`/community/edit/${post.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                수정
              </a>
              <button
                onClick={handlePostDelete}
                className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
          <span 
            className="text-xs opacity-60" 
            style={{ color: 'var(--text-sub)' }}
            suppressHydrationWarning={true}
          >
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <h3 
        className="text-lg font-black mb-3 truncate"
        style={{ color: 'var(--text-main)' }}
      >
        {post.title}
      </h3>
      
      <div className="mb-4">
        <AiBadge aiMeta={post.aiMeta} />
      </div>

      <div 
        className={`text-sm mb-5 leading-relaxed break-words ${!isExpanded ? 'line-clamp-3' : ''}`}
        style={{ color: 'var(--text-sub)' }}
        dangerouslySetInnerHTML={{ __html: localPost.content }}
      />

      <div className="mt-auto pt-5 border-t border-dashed flex justify-between items-center" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)',
              color: '#ffffff',
            }}
          >
            {post.nickname[0]}
          </div>
          <span 
            className="text-xs font-medium"
            style={{ color: 'var(--text-sub)' }}
          >
            {post.nickname}
          </span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id);
            setIsLiked(!isLiked);
          }}
          className={`flex items-center gap-1 text-sm font-semibold transition-all duration-200 hover:scale-110 active:scale-95 px-3 py-1.5 rounded-full cursor-pointer`}
          style={{ 
            color: isLiked ? '#ff4d4f' : 'var(--text-main)',
            backgroundColor: isLiked ? 'rgba(255, 77, 79, 0.1)' : 'var(--bg-main)',
          }}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span> {localPost.likes || 0}
        </button>
      </div>
    </div>
    
    {/* 확장된 내용 및 댓글 섹션 */}
    {isExpanded && (
      <div 
        className="mt-4 p-4 rounded-2xl border transition-all duration-300"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--card-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 전체 내용 표시 */}
        <div className="mb-6">
          <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-main)' }}>
            전체 내용
          </h4>
          <div 
            className="text-sm leading-relaxed break-words"
            style={{ 
              color: 'var(--text-sub)',
              maxHeight: '500px',
              overflowY: 'auto',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-soft)'
            }}
            dangerouslySetInnerHTML={{ __html: localPost.content }}
          />
        </div>
        
        <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-main)' }}>
          댓글 {localPost.comments || 0}개
        </h4>
        
        {/* 댓글 목록 */}
        <div className="mb-4 space-y-3 max-h-60 overflow-y-auto">
          {localPost.commentsList && localPost.commentsList.length > 0 ? (
            localPost.commentsList.map((c: any) => (
              <div key={c.id} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-soft)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                    {c.author} <span className="text-xs font-normal opacity-60 ml-2">{c.date}</span>
                  </div>
                  {(user?.name === c.author || user?.name === "관리자") && (
                    <button 
                      onClick={() => handleCommentDelete(c.id)}
                      className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                      style={{ color: '#ff4d4f' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-sub)' }} dangerouslySetInnerHTML={{ __html: c.text }}></div>
              </div>
            ))
          ) : (
            <div className="text-sm text-center py-4 opacity-60" style={{ color: 'var(--text-sub)' }}>
              아직 댓글이 없습니다.
            </div>
          )}
        </div>
        
        {/* 댓글 작성 폼 */}
        <div className="flex gap-2">
          <textarea
            placeholder={user ? "댓글을 입력하세요..." : "로그인 후 작성 가능"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!user}
            className="flex-1 px-3 py-2 rounded-lg border text-sm resize-none"
            style={{
              backgroundColor: 'var(--bg-soft)',
              borderColor: 'var(--card-border)',
              color: 'var(--text-main)',
              minHeight: '60px',
            }}
            rows={2}
          />
          <button
            onClick={handleCommentSubmit}
            disabled={!user || !comment.trim()}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: user && comment.trim() ? '#00baff' : 'var(--bg-soft)',
              color: user && comment.trim() ? '#ffffff' : 'var(--text-sub)',
            }}
          >
            등록
          </button>
        </div>
      </div>
    )}
    </div>
  );
});

export default CommunityCard;