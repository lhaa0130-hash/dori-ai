import React from "react";
import { TEXTS } from "@/constants/texts";
import { AiMeta } from "@/types/content"; // 👈 추가
import { AiBadge } from "@/components/common/AiBadge"; // 👈 추가

export type AiTool = {
  id: number;
  name: string;
  category: "LLM" | "Image" | "Video" | "Audio" | "Automation" | "Other";
  description: string;
  website: string;
  priceType: "무료" | "부분 유료" | "완전 유료";
  rating: number;
  tags: string[];
  aiMeta?: AiMeta; // 👈 추가
};

interface AiToolsCardProps {
  tool: AiTool;
}

const AiToolsCard = React.memo(({ tool }: AiToolsCardProps) => {
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  return (
    <div 
      className="relative flex flex-col p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg group min-h-[280px]"
      style={cardStyle}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5">
          {tool.category}
        </span>
        <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
          <span>⭐</span> {tool.rating}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2">{tool.name}</h3>
      
      {/* 👇 AiBadge 추가 */}
      <div className="mb-3">
        <AiBadge aiMeta={tool.aiMeta} />
      </div>

      <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10 leading-relaxed">
        {tool.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {tool.tags.slice(0, 3).map((tag, idx) => (
          <span key={idx} className="text-xs opacity-60">#{tag}</span>
        ))}
        {tool.tags.length > 3 && <span className="text-xs opacity-40">+{tool.tags.length - 3}</span>}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-dashed" style={{ borderColor: 'var(--card-border)' }}>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
          tool.priceType === '무료' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' :
          tool.priceType === '부분 유료' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' :
          'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
        }`}>
          {tool.priceType}
        </span>
        
        <a 
          href={tool.website} 
          target="_blank" 
          rel="noreferrer"
          className="text-sm font-semibold hover:underline flex items-center gap-1 transition-colors hover:text-blue-500"
        >
          {TEXTS.aiTools.button.visit.ko} ↗
        </a>
      </div>
    </div>
  );
});

export default AiToolsCard;