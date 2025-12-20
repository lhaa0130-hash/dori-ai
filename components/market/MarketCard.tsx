import React from "react";
import { TEXTS } from "@/constants/texts";
import { AiMeta } from "@/types/content";
import { AiBadge } from "@/components/common/AiBadge";

export type MarketProduct = {
  id: string;
  title: string;
  description: string;
  type: "프롬프트" | "이미지" | "영상" | "템플릿" | "워크플로우" | "기타";
  priceLabel: string;
  isFree: boolean;
  rating: number;
  tags: string[];
  imageUrl?: string;
  aiMeta?: AiMeta; // 👈 추가
};

interface MarketCardProps {
  product: MarketProduct;
}

const MarketCard = React.memo(({ product }: MarketCardProps) => {
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  const getTypeBadge = (type: string) => { /* 기존 코드 동일 */ return "bg-gray-100 text-gray-600"; };

  return (
    <div 
      className="relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl group min-h-[300px]" 
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
          {product.type}
        </span>
        <div 
          className="flex items-center gap-1 font-bold text-sm"
          style={{ color: 'var(--accent-color)' }}
        >
          <span>⭐</span> {product.rating}
        </div>
      </div>

      <h3 
        className="text-xl font-black mb-3 truncate"
        style={{ color: 'var(--text-main)' }}
      >
        {product.title}
      </h3>
      
      <div className="mb-4">
        <AiBadge aiMeta={product.aiMeta} />
      </div>

      <p 
        className="text-sm mb-4 line-clamp-2 leading-relaxed" 
        style={{ color: 'var(--text-sub)' }}
      >
        {product.description}
      </p>

      {/* 태그 섹션 */}
      <div className="mb-5">
        <div className="flex flex-wrap gap-2">
          {product.tags.slice(0, 4).map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[10px] font-medium px-2.5 py-1 rounded-md border transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--card-border)',
                color: 'var(--text-sub)',
              }}
            >
              #{tag}
            </span>
          ))}
          {product.tags.length > 4 && (
            <span 
              className="text-[10px] font-medium px-2.5 py-1 rounded-md opacity-60"
              style={{ color: 'var(--text-sub)' }}
            >
              +{product.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto pt-5 border-t border-dashed flex justify-between items-center" style={{ borderColor: 'var(--card-border)' }}>
        <span 
          className={`font-bold text-sm ${product.isFree ? 'text-green-500' : ''}`}
          style={!product.isFree ? { color: 'var(--text-main)' } : {}}
        >
          {product.priceLabel}
        </span>
        <button 
          onClick={() => alert("준비중")} 
          className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105 shadow-sm"
          style={{ 
            backgroundColor: 'var(--text-main)', 
            color: 'var(--card-bg)',
          }}
        >
          구매하기
        </button>
      </div>
    </div>
  );
});

export default MarketCard;