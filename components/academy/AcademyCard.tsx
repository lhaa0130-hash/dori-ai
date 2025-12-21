import React from "react";
import Image from "next/image";
import { TEXTS } from "@/constants/texts";
import { AiMeta } from "@/types/content"; // 👈 추가
import { AiBadge } from "@/components/common/AiBadge"; // 👈 추가

export type AcademyItem = {
  id: number;
  title: string;
  description: string;
  level: "초급" | "중급" | "고급";
  category: string;
  thumbnail?: string;
  youtubeId?: string;
  aiMeta?: AiMeta; // 👈 추가
};

interface AcademyCardProps {
  item: AcademyItem;
}

const AcademyCard = React.memo(({ item }: AcademyCardProps) => {
  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };
  const thumbnailSrc = item.thumbnail ? item.thumbnail : item.youtubeId ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` : '/images/placeholder-academy.jpg';
  const [imageError, setImageError] = React.useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className="relative flex flex-col rounded-3xl border overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl group cursor-pointer min-h-[400px]"
      style={cardStyle}
    >
      <div 
        className="relative w-full aspect-video overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-main)',
        }}
      >
        {!imageError ? (
          <Image 
            src={thumbnailSrc} 
            alt={item.title} 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110" 
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
            🎓
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors z-10">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center pl-1 shadow-lg backdrop-blur-sm">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-6 flex-1">

        <h3 
          className="text-xl font-black mb-3 line-clamp-2 leading-snug"
          style={{ color: 'var(--text-main)' }}
        >
          {item.title}
        </h3>
        
        <div className="mb-4">
          <AiBadge aiMeta={item.aiMeta} />
        </div>

        <p 
          className="text-sm line-clamp-2 mb-5 flex-1 leading-relaxed" 
          style={{ color: 'var(--text-sub)' }}
        >
          {item.description}
        </p>

        <div className="mt-auto pt-5 border-t border-dashed w-full" style={{ borderColor: 'var(--card-border)' }}>
          <span 
            className="text-sm font-semibold transition-all duration-200 hover:scale-105 flex items-center gap-1"
            style={{ color: 'var(--accent-color)' }}
          >
            {TEXTS.academy.button.watch.ko} →
          </span>
        </div>
      </div>
    </div>
  );
});

export default AcademyCard;