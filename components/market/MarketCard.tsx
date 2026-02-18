import React, { useState, useRef } from "react";
import { MarketProduct } from "./MarketList"; // Import type from MarketList if needed, or keep local
import { AiBadge } from "@/components/common/AiBadge";
import { MessageCircle } from "lucide-react";

interface MarketCardProps {
  product: MarketProduct;
}

const MarketCard = React.memo(({ product }: MarketCardProps) => {
  // 스포트라이트 효과를 위한 상태
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col p-6 rounded-[2rem] border border-neutral-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:shadow-none"
    >
      {/* Spotlight Border Effect */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(249, 149, 78, 0.15), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(249, 149, 78, 0.1), transparent 40%)`,
          maskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      {/* Header: Type & Rating */}
      <div className="relative flex justify-between items-start mb-5 z-10">
        <span className="px-3 py-1 text-[10px] font-bold rounded-full border border-neutral-200 dark:border-zinc-700 bg-white/50 dark:bg-black/20 text-neutral-600 dark:text-neutral-300 backdrop-blur-sm">
          {product.type}
        </span>
        <div className="flex items-center gap-1 font-bold text-sm text-[#F9954E]">
          <span>⭐</span> {product.rating}
        </div>
      </div>

      {/* Title */}
      <h3 className="relative text-xl font-bold mb-3 truncate text-neutral-900 dark:text-white transition-colors group-hover:text-[#F9954E] z-10">
        {product.title}
      </h3>

      {/* Meta (Badge) */}
      <div className="relative mb-4 z-10">
        <AiBadge aiMeta={product.aiMeta} />
      </div>

      {/* Description */}
      <p className="relative text-sm mb-6 line-clamp-2 leading-relaxed text-neutral-500 dark:text-neutral-400 z-10">
        {product.description}
      </p>

      {/* Tags */}
      <div className="relative mb-6 z-10">
        <div className="flex flex-wrap gap-2">
          {product.tags.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-zinc-800/50 text-neutral-500 dark:text-neutral-400 transition-colors group-hover:bg-[#FFF5EB] group-hover:text-[#F9954E] dark:group-hover:bg-[#8F4B10]/20 dark:group-hover:text-[#FBAA60]"
            >
              #{tag}
            </span>
          ))}
          {product.tags.length > 4 && (
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-md text-neutral-400">
              +{product.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Price & Action */}
      <div className="relative mt-auto pt-5 border-t border-dashed border-neutral-200 dark:border-zinc-800 flex justify-between items-center z-10">
        <span className={`font-bold text-sm ${product.isFree ? 'text-[#F9954E]' : 'text-neutral-900 dark:text-white'}`}>
          {product.priceLabel}
        </span>
        <button
          onClick={() => window.location.href = '/suggestions'}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 bg-neutral-900 text-white hover:bg-[#F9954E] hover:shadow-lg hover:shadow-[#F9954E]/20 dark:bg-white dark:text-black dark:hover:bg-[#F9954E] dark:hover:text-white"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          문의하기
        </button>
      </div>
    </div>
  );
});

export default MarketCard;