import { Instagram, Youtube } from "lucide-react";
import { SOCIAL_LINKS } from "@/constants/socialLinks";

// 브랜드 아이콘(라이드는 인스타/유튜브만, 나머지는 인라인 SVG)
function BrandIcon({ k }: { k: string }) {
  switch (k) {
    case "instagram":
      return <Instagram className="w-[18px] h-[18px]" />;
    case "youtube":
      return <Youtube className="w-[19px] h-[19px]" />;
    case "x":
      return (
        <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "naver":
      return (
        <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="currentColor" aria-hidden>
          <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727z" />
        </svg>
      );
    case "reddit":
      return (
        <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="currentColor" aria-hidden>
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12c-.688 0-1.25.561-1.25 1.249 0 .688.562 1.249 1.25 1.249s1.249-.561 1.249-1.249S9.938 12 9.25 12zm5.5 0c-.687 0-1.249.561-1.249 1.249 0 .688.562 1.249 1.25 1.249s1.249-.561 1.249-1.249S15.438 12 14.75 12zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      );
    default:
      return null;
  }
}

// 브랜드별 배경/텍스트 색 (정적 클래스 — Tailwind purge 안전)
const STYLE: Record<string, string> = {
  instagram: "bg-[#E4405F] text-white",
  x: "bg-black text-white dark:bg-white dark:text-black",
  naver: "bg-[#03C75A] text-white",
  reddit: "bg-[#FF4500] text-white",
  youtube: "bg-[#FF0000] text-white",
};

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {SOCIAL_LINKS.map((s) => (
        <a
          key={s.key}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          title={s.name}
          className={`w-10 h-10 flex items-center justify-center rounded-full shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95 ${STYLE[s.key] || "bg-neutral-700 text-white"}`}
        >
          <BrandIcon k={s.key} />
        </a>
      ))}
    </div>
  );
}
