import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TrendPost } from "@/lib/trends";

interface TrendPreviewProps {
  trends: TrendPost[];
}

export default function TrendPreview({ trends }: TrendPreviewProps) {
  if (!trends || trends.length === 0) return null;

  return (
    <section className="w-full py-3">
      {/* 토스 스타일 흰 카드 */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm overflow-hidden">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <p className="text-[11px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Trends</p>
            <h2 className="text-[17px] font-black text-neutral-900 dark:text-white">🔥 오늘의 AI 트렌드</h2>
          </div>
          <Link
            href="/insight"
            className="flex items-center gap-0.5 text-[13px] font-bold text-[#F9954E]"
          >
            전체보기 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 리스트 (토스 스타일 row) */}
        <div className="divide-y divide-neutral-50 dark:divide-zinc-800">
          {trends.slice(0, 3).map((trend, i) => (
            <Link
              key={trend.slug}
              href={`/insight/article/${trend.slug}`}
              className="flex items-center gap-4 px-5 py-4 active:bg-neutral-50 dark:active:bg-zinc-800 transition-colors"
            >
              {/* 썸네일 */}
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 dark:from-zinc-800 dark:to-zinc-700 flex-shrink-0">
                {trend.thumbnail ? (
                  <Image src={trend.thumbnail} alt={trend.title} fill style={{ objectFit: "cover" }} sizes="56px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                {trend.category && (
                  <span className="text-[10px] font-bold text-[#F9954E] mb-0.5 block">
                    {trend.category}
                  </span>
                )}
                <p className="text-[13px] font-bold text-neutral-900 dark:text-white leading-snug line-clamp-2 break-keep">
                  {trend.title}
                </p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                  {new Date(trend.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </p>
              </div>

              {/* 번호 */}
              <span className="text-[22px] font-black text-neutral-100 dark:text-zinc-800 flex-shrink-0 w-7 text-right leading-none">
                {i + 1}
              </span>
            </Link>
          ))}
        </div>

        {/* 더보기 버튼 */}
        <div className="px-5 py-4 border-t border-neutral-50 dark:border-zinc-800">
          <Link
            href="/insight"
            className="flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-800 text-[13px] font-bold text-neutral-600 dark:text-neutral-300 active:scale-[0.98] transition-transform"
          >
            트렌드 더보기
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
