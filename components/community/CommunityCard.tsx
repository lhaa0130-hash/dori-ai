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

      <div className="mt-auto pt-4 border-t border-dashed flex justify-between items-center" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">{post.nickname[0]}</div>
          <span className="text-xs font-medium opacity-80">{post.nickname}</span>
        </div>
        <button onClick={() => onLike(post.id)} className="flex items-center gap-1 text-sm font-semibold hover:scale-110 transition-transform active:scale-95 px-2 py-1 rounded-full hover:bg-gray-100" style={{ color: 'var(--text-main)' }}><span>❤️</span> {post.likes}</button>
      </div>
    </div>
  );
});

export default CommunityCard;