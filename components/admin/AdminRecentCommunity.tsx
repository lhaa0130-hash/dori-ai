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

interface AdminRecentCommunityProps {
  posts: CommunityPost[];
}

export default function AdminRecentCommunity({ posts }: AdminRecentCommunityProps) {
  const t = TEXTS.admin.sections;

  // 카드 스타일 (globals.css 변수 활용)
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  const getTagColor = (tag: CommunityTag) => {
    switch (tag) {
      case "질문": return "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300";
      case "정보": return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300";
      case "자랑": return "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
    }
  };

  return (
    <div className="p-6 rounded-[1.5rem] border shadow-sm" style={cardStyle}>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        💬 {t.recentCommunity.ko}
      </h3>
      
      {posts.length === 0 ? (
        <p className="opacity-50 text-center py-10">데이터가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getTagColor(post.tag)}`}>
                    {post.tag}
                  </span>
                  <span className="text-xs opacity-50">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h4 className="font-bold text-sm truncate">{post.title}</h4>
              </div>
              <div className="flex items-center gap-4 mt-2 sm:mt-0 text-xs opacity-70 sm:ml-4 flex-shrink-0">
                <span>{post.nickname}</span>
                <span>❤️ {post.likes}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}