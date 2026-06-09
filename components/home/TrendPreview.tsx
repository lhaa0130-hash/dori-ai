import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TrendPost } from "@/lib/trends";

interface TrendPreviewProps { trends: TrendPost[]; }

export default function TrendPreview({ trends }: TrendPreviewProps) {
  if (!trends || trends.length === 0) return null;

  return (
    <section className="py-8">
      <div className="rounded-3xl bg-neutral-950 px-6 pt-10 pb-10">

        {/* 헤더 */}
        <p className="text-[11px] font-bold text-[#F9954E] tracking-[0.22em] uppercase mb-5">
          TREND
        </p>
        <h2 className="text-[36px] sm:text-[44px] font-black text-white leading-[1.0] tracking-[-0.03em] mb-3 break-keep">
          매일 업데이트되는<br />AI 트렌드
        </h2>
        <p className="text-[14px] text-neutral-400 mb-9">
          지금 가장 핫한 AI 소식을 확인하세요.
        </p>

        {/* 리스트 */}
        <div className="divide-y divide-neutral-800">
          {trends.slice(0, 3).map((trend) => (
            <Link
              key={trend.slug}
              href={`/insight/article/${trend.slug}`}
              className="flex items-center gap-4 py-5 first:pt-0 active:opacity-60 transition-opacity"
            >
              {/* 썸네일 */}
              <div className="relative w-[56px] h-[56px] rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0">
                {trend.thumbnail ? (
                  <Image
                    src={trend.thumbnail}
                    alt={trend.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="56px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xl">🤖</div>
                )}
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-[14px] line-clamp-2 leading-snug break-keep">
                  {trend.title}
                </p>
                <p className="text-neutral-500 text-[12px] mt-1.5">
                  {new Date(trend.date).toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />
            </Link>
          ))}
        </div>

        {/* 전체보기 */}
        <Link
          href="/insight"
          className="mt-9 flex items-center gap-1.5 text-[#F9954E] font-bold text-[14px]"
        >
          전체 기사 보기 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
