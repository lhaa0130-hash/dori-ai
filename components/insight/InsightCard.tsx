import React from "react";
import { TEXTS } from "@/constants/texts";
import { InsightItem } from "@/types/content";
import { AiBadge } from "@/components/common/AiBadge";

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
      className="relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl group cursor-pointer min-h-[300px]"
      style={cardStyle}
    >
      <div className="flex justify-between items-start mb-5">
        <span 
          className="px-3 py-1 text-xs font-bold rounded-full border"
          style={{
            backgroundColor: 'var(--bg-main)',
            borderColor: 'var(--card-border)',
            color: 'var(--accent-color)',
          }}
        >
          {item.category}
        </span>
        
        <span 
          className="text-xs opacity-60" 
          style={{ color: 'var(--text-sub)' }}
          suppressHydrationWarning={true}
        >
          {new Date(item.date).toLocaleDateString()}
        </span>
      </div>

      <h3 
        className="text-xl font-black mb-3 leading-snug break-keep"
        style={{ color: 'var(--text-main)' }}
      >
        {item.title}
      </h3>
      
      <div className="mb-4">
        <AiBadge aiMeta={item.aiMeta} />
      </div>

      <p 
        className="text-sm mb-4 line-clamp-2 leading-relaxed" 
        style={{ color: 'var(--text-sub)' }}
      >
        {item.summary}
      </p>

      {/* 태그 섹션 */}
      <div className="mb-5">
        <div className="flex flex-wrap gap-2">
          {item.tags.slice(0, 4).map((tag) => (
            <span 
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
              className="text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all duration-200 hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-sub)',
              }}
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 4 && (
            <span 
              className="text-[10px] font-medium px-2.5 py-1 rounded-md opacity-60"
              style={{ color: 'var(--text-sub)' }}
            >
              +{item.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-5 border-t border-dashed flex items-center justify-between" style={{ borderColor: 'var(--card-border)' }}>
        <span 
          className="font-semibold text-sm transition-all duration-200 hover:scale-105"
          style={{ color: 'var(--accent-color)' }}
        >
          {TEXTS.insight.button.readMore.ko} →
        </span>
        <div 
          className="flex items-center gap-1 text-xs opacity-60"
          style={{ color: 'var(--text-sub)' }}
        >
          <span>❤️</span> {item.likes}
        </div>
      </div>
    </div>
  );
});

export default InsightCard;