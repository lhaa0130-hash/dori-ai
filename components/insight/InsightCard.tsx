import { TEXTS } from "@/constants/texts";

export type InsightItem = {
  id: number;
  title: string;
  summary: string;
  category: "개념" | "트렌드" | "분석" | "수익" | "기타";
  tags: string[];
  likes: number;
  date: string; // ISO String
};

interface InsightCardProps {
  item: InsightItem;
  onTagClick: (tag: string) => void;
}

export default function InsightCard({ item, onTagClick }: InsightCardProps) {
  // 카드 스타일 (globals.css 변수 활용)
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  return (
    <div 
      className="relative flex flex-col p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg group cursor-pointer"
      style={cardStyle}
    >
      {/* 상단: 카테고리 & 날짜 */}
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20">
          {item.category}
        </span>
        <span className="text-xs opacity-50" style={{ color: 'var(--text-sub)' }}>
          {new Date(item.date).toLocaleDateString()}
        </span>
      </div>

      {/* 타이틀 & 요약 */}
      <h3 className="text-xl font-bold mb-3 leading-snug break-keep">
        {item.title}
      </h3>
      <p className="text-sm opacity-70 mb-6 line-clamp-3 h-[4.5em] leading-relaxed" style={{ color: 'var(--text-sub)' }}>
        {item.summary}
      </p>

      {/* 하단: 태그 & 좋아요 */}
      <div className="mt-auto pt-4 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.map((tag) => (
            <span 
              key={tag}
              onClick={(e) => {
                e.stopPropagation(); // 카드 클릭 방지
                onTagClick(tag);
              }}
              className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-blue-500 hover:underline">
            {TEXTS.insight.button.readMore.ko} →
          </span>
          <div className="flex items-center gap-1 opacity-60 text-xs">
            <span>❤️</span> {item.likes}
          </div>
        </div>
      </div>
    </div>
  );
}