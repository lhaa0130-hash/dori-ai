import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TrendPost } from "@/lib/trends";

export default function TrendPreview({ trends }: { trends: TrendPost[] }) {
  if (!trends || trends.length === 0) return null;

  const [featured, ...rest] = trends.slice(0, 3);

  return (
    <section className="py-5 border-b border-neutral-100 dark:border-zinc-900">

      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] font-extrabold text-neutral-950 dark:text-white">AI 트렌드</p>
        <Link href="/insight" className="flex items-center gap-1 text-[13px] font-semibold text-[#F9954E]">
          전체 <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 피처드 아티클 — 큰 이미지 카드 */}
      <Link
        href={`/insight/article/${featured.slug}`}
        className="scroll-reveal block rounded-2xl overflow-hidden mb-3 active:opacity-80 transition-opacity"
      >
        <div className="relative w-full h-[190px] bg-neutral-100 dark:bg-zinc-900">
          {featured.thumbnail ? (
            <Image
              src={featured.thumbnail}
              alt={featured.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 640px) 100vw, 600px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl">🤖</div>
          )}
          {/* 그라디언트 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* 텍스트 */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-[11px] font-bold text-[#F9954E] mb-1.5">최신 트렌드</p>
            <p className="text-white font-extrabold text-[15px] leading-snug line-clamp-2 break-keep">
              {featured.title}
            </p>
            <p className="text-white/50 text-[11px] mt-2">
              {new Date(featured.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
      </Link>

      {/* 나머지 2개 — 컴팩트 리스트 */}
      <div className="divide-y divide-neutral-100 dark:divide-white/[0.06]">
        {rest.map((trend, i) => (
          <Link
            key={trend.slug}
            href={`/insight/article/${trend.slug}`}
            className={`flex items-center gap-3 ${i === 0 ? "pb-3.5" : "pt-3.5"} active:opacity-60 transition-opacity`}
          >
            <div className="relative w-[42px] h-[42px] rounded-xl overflow-hidden bg-neutral-100 dark:bg-white/10 flex-shrink-0">
              {trend.thumbnail ? (
                <Image src={trend.thumbnail} alt={trend.title} fill style={{ objectFit: "cover" }} sizes="42px" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-lg">🤖</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-neutral-900 dark:text-white font-semibold text-[13px] line-clamp-1 break-keep">
                {trend.title}
              </p>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                {new Date(trend.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-white/20 flex-shrink-0" />
          </Link>
        ))}
      </div>

    </section>
  );
}
