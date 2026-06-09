import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TrendPost } from "@/lib/trends";

export default function TrendPreview({ trends }: { trends: TrendPost[] }) {
  if (!trends || trends.length === 0) return null;

  return (
    <section className="py-5 border-b border-neutral-100 dark:border-zinc-900">
      <div className="scroll-reveal rounded-2xl bg-white dark:bg-zinc-950 border border-neutral-100 dark:border-zinc-900 px-5 pt-5 pb-2">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[14px] font-extrabold text-neutral-950 dark:text-white">AI 트렌드</p>
          <Link
            href="/insight"
            className="flex items-center gap-1 text-[13px] font-semibold text-[#F9954E]"
          >
            전체 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 리스트 */}
        <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
          {trends.slice(0, 3).map((trend, i) => (
            <div key={trend.slug} className={`scroll-reveal-item scroll-delay-${i + 1}`}>
              <Link
                href={`/insight/article/${trend.slug}`}
                className={`flex items-center gap-3 ${i === 0 ? "pb-4" : "py-4"} active:opacity-60 transition-opacity`}
              >
                {/* 썸네일 */}
                <div className="relative w-[46px] h-[46px] rounded-xl overflow-hidden bg-neutral-100 dark:bg-white/10 flex-shrink-0">
                  {trend.thumbnail ? (
                    <Image src={trend.thumbnail} alt={trend.title} fill style={{ objectFit: "cover" }} sizes="46px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-lg">🤖</div>
                  )}
                </div>

                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-900 dark:text-white font-semibold text-[13px] line-clamp-2 leading-snug break-keep">
                    {trend.title}
                  </p>
                  <p className="text-neutral-400 text-[11px] mt-1">
                    {new Date(trend.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                  </p>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-white/20 flex-shrink-0" />
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
