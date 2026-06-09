import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TrendPost } from "@/lib/trends";

interface TrendPreviewProps { trends: TrendPost[]; }

export default function TrendPreview({ trends }: TrendPreviewProps) {
  if (!trends || trends.length === 0) return null;

  return (
    <section className="py-6">
      <div className="rounded-3xl bg-neutral-950 px-6 pt-9 pb-9">

        {/* 헤더 */}
        <div className="mb-7">
          <p className="text-[12px] font-semibold text-[#F9954E] mb-3">AI 트렌드</p>
          <h2 className="text-[28px] sm:text-[34px] font-extrabold text-white leading-[1.15] tracking-tight break-keep">
            매일 업데이트되는<br />AI 트렌드
          </h2>
        </div>

        {/* 리스트 */}
        <div className="divide-y divide-white/[0.06]">
          {trends.slice(0, 3).map((trend) => (
            <Link
              key={trend.slug}
              href={`/insight/article/${trend.slug}`}
              className="flex items-center gap-4 py-4 first:pt-0 active:opacity-60 transition-opacity"
            >
              {/* 썸네일 */}
              <div className="relative w-[52px] h-[52px] rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                {trend.thumbnail ? (
                  <Image src={trend.thumbnail} alt={trend.title} fill style={{ objectFit: "cover" }} sizes="52px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-lg">🤖</div>
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-[14px] line-clamp-2 leading-snug break-keep">
                  {trend.title}
                </p>
                <p className="text-white/40 text-[12px] mt-1.5">
                  {new Date(trend.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* 전체보기 */}
        <Link
          href="/insight"
          className="mt-7 flex items-center gap-1.5 text-[#F9954E] font-semibold text-[13px]"
        >
          전체 기사 보기 <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
