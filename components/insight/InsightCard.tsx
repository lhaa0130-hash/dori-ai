import React from "react";
import { TEXTS } from "@/constants/texts";
import { AiMeta } from "@/types/content"; // 👈 추가
import { AiBadge } from "@/components/common/AiBadge"; // 👈 추가

export type InsightItem = {
  id: number;
  title: string;
  summary: string;
  category: "트렌드" | "큐레이션" | "가이드" | "리포트" | "분석";
  tags: string[];
  likes: number;
  date: string;
  aiMeta?: AiMeta; // 👈 추가
};

interface InsightCardProps {
  item: InsightItem;
  onTagClick: (tag: string) => void;
}

const InsightCard = React.memo(({ item, onTagClick }: InsightCardProps) => {
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  return (
    <div 
      className="relative flex flex-col p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg group cursor-pointer min-h-[300px]"
      style={cardStyle}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-500/20">
          {item.category}
        </span>
        <span className="text-xs opacity-50" style={{ color: 'var(--text-sub)' }}>
          {new Date(item.date).toLocaleDateString()}
        </span>
      </div>

      <h3 className="text-xl font-bold mb-2 leading-snug break-keep">{item.title}</h3>
      
      {/* 👇 AiBadge 추가 */}
      <div className="mb-3">
        <AiBadge aiMeta={item.aiMeta} />
      </div>

      <p className="text-sm opacity-70 mb-6 line-clamp-3 h-[4.5em] leading-relaxed" style={{ color: 'var(--text-sub)' }}>
        {item.summary}
      </p>

      <div className="mt-auto pt-4 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.map((tag) => (
            <span 
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-blue-500 hover:underline">{TEXTS.insight.button.readMore.ko} →</span>
          <div className="flex items-center gap-1 opacity-60 text-xs"><span>❤️</span> {item.likes}</div>
        </div>
      </div>
    </div>
  );
});

export default InsightCard;