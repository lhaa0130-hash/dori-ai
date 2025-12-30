import React from "react";
import { AiMeta } from "@/types/content";
import { AiBadge } from "@/components/common/AiBadge"; // 👈 추가

export type CommunityTag = "질문" | "정보" | "자랑" | "잡담";

export type CommunityPost = {
  id: number;
  nickname: string;
  title: string;
  content: string;
  tag: CommunityTag;
  likes: number;
  createdAt: string;
  aiMeta?: AiMeta; // 👈 추가
  authorId?: string; // 작성자 식별자 (선택적, 기존 데이터 호환성)
};

interface CommunityCardProps {
  post: CommunityPost;
  onLike: (id: number) => void;
  isOwner?: boolean; // 본인 글인지 여부
  onEdit?: (post: CommunityPost) => void;
  onDelete?: (id: number) => void;
}

const CommunityCard = React.memo(({ post, onLike, isOwner = false, onEdit, onDelete }: CommunityCardProps) => {
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  const getTagColor = (tag: CommunityTag) => { /* 기존 색상 로직 유지 */ return "bg-gray-100"; };

  return (
    <div className="relative flex flex-col p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group min-h-[220px]" style={cardStyle}>
      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-md bg-gray-100`}>{post.tag}</span>
        <span className="text-xs opacity-50" style={{ color: 'var(--text-sub)' }}>{new Date(post.createdAt).toLocaleDateString()}</span>
      </div>

      <h3 className="text-lg font-bold mb-2 truncate">{post.title}</h3>
      
      {/* 👇 AiBadge 추가 */}
      <div className="mb-2">
        <AiBadge aiMeta={post.aiMeta} />
      </div>

      <p className="text-sm opacity-70 mb-4 line-clamp-3 h-[4.5em] leading-relaxed break-words" style={{ color: 'var(--text-sub)' }}>{post.content}</p>

      <div className="mt-auto pt-4 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{post.nickname[0]}</div>
            <span className="text-xs font-medium opacity-80">{post.nickname}</span>
          </div>
          <button onClick={() => onLike(post.id)} className="flex items-center gap-1 text-sm font-semibold hover:scale-110 transition-transform active:scale-95 px-2 py-1 rounded-full hover:bg-gray-100" style={{ color: 'var(--text-main)' }}><span>❤️</span> {post.likes}</button>
        </div>
        
        {/* 본인 글인 경우 수정/삭제 버튼 */}
        {isOwner && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-3 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(post);
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
                  e.stopPropagation();
                  if (confirm('정말 삭제하시겠습니까?')) {
                    onDelete(post.id);
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

export default CommunityCard;