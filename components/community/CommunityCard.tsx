import { TEXTS } from "@/constants/texts";

export type CommunityTag = "질문" | "정보" | "자랑" | "잡담";

export type CommunityPost = {
  id: number;
  nickname: string;
  title: string;
  content: string;
  tag: CommunityTag;
  likes: number;
  createdAt: string;
};

interface CommunityCardProps {
  post: CommunityPost;
  onLike: (id: number) => void;
}

export default function CommunityCard({ post, onLike }: CommunityCardProps) {
  // 카드 스타일 (CSS 변수 활용)
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  // 태그별 색상 (다크모드 대응)
  const getTagColor = (tag: CommunityTag) => {
    switch (tag) {
      case "질문": return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300";
      case "정보": return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300";
      case "자랑": return "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
    }
  };

  return (
    <div 
      className="relative flex flex-col p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
      style={cardStyle}
    >
      {/* 상단: 태그 & 날짜 */}
      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${getTagColor(post.tag)}`}>
          {post.tag}
        </span>
        <span className="text-xs opacity-50" style={{ color: 'var(--text-sub)' }}>
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* 내용 */}
      <h3 className="text-lg font-bold mb-2 truncate">{post.title}</h3>
      <p className="text-sm opacity-70 mb-4 line-clamp-3 h-[4.5em] leading-relaxed break-words" style={{ color: 'var(--text-sub)' }}>
        {post.content}
      </p>

      {/* 하단: 작성자 & 좋아요 */}
      <div className="mt-auto pt-4 border-t border-dashed flex justify-between items-center" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/20 flex items-center justify-center text-xs font-bold">
            {post.nickname[0]}
          </div>
          <span className="text-xs font-medium opacity-80">{post.nickname}</span>
        </div>

        <button 
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1 text-sm font-semibold hover:scale-110 transition-transform active:scale-95 px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
          style={{ color: 'var(--text-main)' }}
        >
          <span>❤️</span> {post.likes}
        </button>
      </div>
    </div>
  );
}