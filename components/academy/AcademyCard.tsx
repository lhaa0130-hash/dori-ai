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

  return (
    <div 
      className="relative flex flex-col rounded-[1.5rem] border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg group cursor-pointer min-h-[400px]"
      style={cardStyle}
    >
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <Image src={thumbnailSrc} alt={item.title} layout="fill" objectFit="cover" placeholder="empty" className="transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors z-10">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center pl-1 shadow-lg backdrop-blur-sm">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md border border-white/20 z-20">{item.level}</div>
      </div>

      <div className="flex flex-col p-6 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border border-green-100 dark:border-green-500/20">{item.category}</span>
        </div>

        <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-snug">{item.title}</h3>
        
        {/* 👇 AiBadge 추가 */}
        <div className="mb-2">
          <AiBadge aiMeta={item.aiMeta} />
        </div>

        <p className="text-sm opacity-70 line-clamp-2 mb-4 flex-1 h-10 leading-relaxed" style={{ color: 'var(--text-sub)' }}>{item.description}</p>

        <div className="mt-auto pt-4 border-t border-dashed w-full" style={{ borderColor: 'var(--card-border)' }}>
          <span className="text-sm font-semibold text-green-500 hover:underline flex items-center gap-1">{TEXTS.academy.button.watch.ko} →</span>
        </div>
      </div>
    </div>
  );
});

export default AcademyCard;