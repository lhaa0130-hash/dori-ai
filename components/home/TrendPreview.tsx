import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TrendPost } from "@/lib/trends";

interface TrendPreviewProps { trends: TrendPost[]; }

export default function TrendPreview({ trends }: TrendPreviewProps) {
  if (!trends || trends.length === 0) return null;

  return (
    <section className="py-6 border-b border-neutral-100 dark:border-zinc-900">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">트렌드</p>
        <Link href="/insight" className="flex items-center gap-0.5 text-[12px] font-bold text-[#F9954E]">
          전체보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 리스트 */}
      <div className="divide-y divide-neutral-100 dark:divide-zinc-900">
        {trends.slice(0, 3).map((trend) => (
          <Link
            key={trend.slug}
            href={`/insight/article/${trend.slug}`}
            className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 active:opacity-60 transition-opacity"
          >
            {/* 썸네일 */}
            <div className="relative w-[60px] h-[60px] rounded-xl overflow-hidden bg-neutral-100 dark:bg-zinc-800 flex-shrink-0">
              {trend.thumbnail ? (
                <Image src={trend.thumbnail} alt={trend.title} fill style={{ objectFit: "cover" }} sizes="60px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
              )}
            </div>

            {/* 텍스트 */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-neutral-900 dark:text-white line-clamp-2 leading-snug break-keep">
                {trend.title}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                {new Date(trend.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
