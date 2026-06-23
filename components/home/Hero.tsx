import Link from "next/link";
import { ArrowRight } from "lucide-react";

// 토스 풍 미니멀 히어로 — 큰 마케팅 카피 대신 절제된 인사 한 줄.
export default function Hero() {
  return (
    <section className="pt-8 pb-6">
      <p className="text-[11px] font-bold tracking-[0.18em] text-[#F9954E] uppercase mb-2.5 toss-fade-line">
        DORI · AI 커뮤니티
      </p>
      <h1 className="text-[26px] sm:text-[30px] font-extrabold leading-[1.2] tracking-tight text-neutral-950 dark:text-white break-keep mb-4">
        <span className="block toss-fade-line toss-delay-0">AI, 같이 하면</span>
        <span className="block toss-fade-line toss-delay-1 text-[#F9954E]">더 재밌으니까</span>
      </h1>
      <Link
        href="/feed"
        className="toss-fade-up toss-delay-2 inline-flex items-center gap-1 text-[13px] font-bold text-neutral-500 dark:text-neutral-400 active:opacity-60 transition-opacity"
      >
        피드 둘러보기 <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </section>
  );
}
