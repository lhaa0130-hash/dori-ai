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
    <div className="relative flex flex-col p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg group min-h-[300px]" style={cardStyle}>
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gray-100`}>{product.type}</span>
        <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm"><span>⭐</span> {product.rating}</div>
      </div>

      <h3 className="text-lg font-bold mb-2 truncate">{product.title}</h3>
      
      {/* 👇 AiBadge 추가 */}
      <div className="mb-3">
        <AiBadge aiMeta={product.aiMeta} />
      </div>

      <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10 leading-relaxed" style={{ color: 'var(--text-sub)' }}>{product.description}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {product.tags.slice(0, 3).map((tag, idx) => (<span key={idx} className="text-xs opacity-60">#{tag}</span>))}
      </div>
      <div className="mt-auto pt-4 border-t border-dashed flex justify-between items-center" style={{ borderColor: 'var(--card-border)' }}>
        <span className={`font-bold ${product.isFree ? 'text-green-500' : 'text-[var(--text-main)]'}`}>{product.priceLabel}</span>
        <button onClick={() => alert("준비중")} className="px-4 py-2 rounded-full text-sm font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity">구매하기</button>
      </div>
    </div>
  );
});

export default MarketCard;