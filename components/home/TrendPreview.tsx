import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import type { TrendPost } from "@/lib/trends";

interface TrendPreviewProps {
  trends: TrendPost[];
}

export default function TrendPreview({ trends }: TrendPreviewProps) {
  if (!trends || trends.length === 0) return null;

  return (
    <section className="w-full px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground">
              🔥 오늘의 AI 트렌드
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              최신 AI 뉴스와 트렌드를 한눈에 확인하세요
            </p>
          </div>
          <Link
            href="/insight"
            className="flex items-center gap-1 text-sm font-bold text-[#F9954E] hover:text-[#E8832E] transition-colors"
          >
            더 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {trends.map((trend) => (
            <Link
              key={trend.slug}
              href={`/insight/article/${trend.slug}`}
              className="group block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:border-[#F9954E] dark:hover:border-[#F9954E] hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* 썸네일 */}
              <div className="relative w-full h-44 bg-gradient-to-br from-[#F9954E]/10 to-[#FF7B54]/5 overflow-hidden">
                {trend.thumbnail ? (
                  <Image
                    src={trend.thumbnail}
                    alt={trend.title}
                    fill
                    style={{ objectFit: "cover" }}
                    className="group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl opacity-30">🤖</span>
                  </div>
                )}
                {/* 카테고리 뱃지 */}
                {trend.category && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-[#F9954E] text-white text-[10px] font-bold tracking-wide">
                    {trend.category}
                  </span>
                )}
              </div>

              {/* 콘텐츠 */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-[#F9954E] transition-colors">
                  {trend.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 mb-3">
                  {trend.description}
                </p>

                {/* 메타 정보 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <Calendar className="w-3 h-3" />
                    <time dateTime={trend.date}>
                      {new Date(trend.date).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  {trend.tags && trend.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 line-clamp-1 max-w-[120px]">
                        {trend.tags.slice(0, 2).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
