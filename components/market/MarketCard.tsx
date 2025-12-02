export type MarketProduct = {
  id: string;
  title: string;
  description: string;
  type: "프롬프트" | "이미지" | "영상" | "템플릿" | "워크플로우" | "기타";
  priceLabel: string;
  isFree: boolean;
  rating: number;
  tags: string[];
};

interface MarketCardProps {
  product: MarketProduct;
}

export default function MarketCard({ product }: MarketCardProps) {
  // 카드 스타일 (CSS 변수 활용)
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  const handleBuy = () => {
    alert("결제 기능은 추후 제공 예정입니다.");
  };

  // 타입별 아이콘/색상
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "프롬프트": return "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300";
      case "이미지": return "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300";
      case "워크플로우": return "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300";
      default: return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
    }
  };

  return (
    <div 
      className="relative flex flex-col p-6 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
      style={cardStyle}
    >
      {/* 상단: 타입 & 평점 */}
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getTypeBadge(product.type)}`}>
          {product.type}
        </span>
        <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
          <span>⭐</span> {product.rating}
        </div>
      </div>

      {/* 타이틀 & 설명 */}
      <h3 className="text-lg font-bold mb-2 truncate">{product.title}</h3>
      <p className="text-sm opacity-70 mb-4 line-clamp-2 h-10 leading-relaxed" style={{ color: 'var(--text-sub)' }}>
        {product.description}
      </p>

      {/* 태그 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {product.tags.slice(0, 3).map((tag, idx) => (
          <span key={idx} className="text-xs opacity-60">#{tag}</span>
        ))}
        {product.tags.length > 3 && <span className="text-xs opacity-40">+{product.tags.length - 3}</span>}
      </div>

      {/* 하단: 가격 & 버튼 */}
      <div className="mt-auto pt-4 border-t border-dashed flex justify-between items-center" style={{ borderColor: 'var(--card-border)' }}>
        <span className={`font-bold ${product.isFree ? 'text-green-500' : 'text-[var(--text-main)]'}`}>
          {product.priceLabel}
        </span>
        
        <button 
          onClick={handleBuy}
          className="px-4 py-2 rounded-full text-sm font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity"
        >
          구매하기
        </button>
      </div>
    </div>
  );
}