import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// 프로젝트 내부 화면 공통 상단바.
// 좌측: illo 로고(→메인). 우측: 프로젝트명. 모든 프로젝트가 같은 컨셉을 공유.
export default function ProjectTopBar({ name, emoji }: { name: string; emoji?: string }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-12 flex items-center gap-3 px-4 sm:px-6 bg-card/95 backdrop-blur border-b border-border">
      <Link
        href="/"
        aria-label="illo 메인으로"
        className="flex items-center gap-1 flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        <span className="font-bold text-[15px] whitespace-nowrap bg-[linear-gradient(to_right,#FBAA60,#F9954E_30%,#F9954E_70%,#E8832E)] bg-clip-text text-transparent">
          illo
        </span>
      </Link>
      <span className="text-muted-foreground/50">/</span>
      <span className="text-[13px] font-bold text-foreground truncate">
        {emoji ? `${emoji} ` : ""}{name}
      </span>
    </div>
  );
}
