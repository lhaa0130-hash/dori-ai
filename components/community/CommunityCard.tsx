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
};

interface CommunityCardProps {
  post: CommunityPost;
  onLike: (id: number) => void;
}

const CommunityCard = React.memo(({ post, onLike }: CommunityCardProps) => {
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  const getTagColor = (tag: CommunityTag) => { /* 기존 색상 로직 유지 */ return "bg-gray-100"; };

  return (
    <div 
      className="relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl group min-h-[220px]" 
      style={cardStyle}
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
        <span 
          className="text-xs opacity-60" 
          style={{ color: 'var(--text-sub)' }}
          suppressHydrationWarning={true}
        >
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
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

      <p 
        className="text-sm mb-5 line-clamp-3 leading-relaxed break-words" 
        style={{ color: 'var(--text-sub)' }}
      >
        {post.content}
      </p>

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
          onClick={() => onLike(post.id)} 
          className="flex items-center gap-1 text-sm font-semibold transition-all duration-200 hover:scale-110 active:scale-95 px-3 py-1.5 rounded-full"
          style={{ 
            color: 'var(--text-main)',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          <span>❤️</span> {post.likes}
        </button>
      </div>
    </div>
  );
});

export default CommunityCard;