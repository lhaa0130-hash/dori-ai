import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Tag } from "lucide-react";

interface PreviewPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category?: string;
  thumbnail?: string;
  tags?: string[];
}

interface CategorySectionProps {
  emoji: string;
  title: string;
  subtitle: string;
  moreHref: string;
  posts: PreviewPost[];
}

export default function CategorySection({
  emoji,
  title,
  subtitle,
  moreHref,
  posts,
}: CategorySectionProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-foreground">
              {emoji} {title}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
              {subtitle}
            </p>
          </div>
          <Link
            href={moreHref}
            className="flex items-center gap-1 text-sm font-bold text-[#F9954E] hover:text-[#E8832E] transition-colors"
          >
            더 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.slug}
              href={`/insight/article/${post.slug}`}
              className="group block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden hover:border-[#F9954E] dark:hover:border-[#F9954E] hover:shadow-lg hover:shadow-[#F9954E]/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* 썸네일 */}
              <div className="relative w-full h-[140px] bg-gradient-to-br from-[#F9954E]/10 to-[#FF7B54]/5 overflow-hidden">
                {post.thumbnail ? (
                  <Image
                    src={post.thumbnail}
                    alt={post.title}
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
                {post.category && (
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-[#F9954E] text-white text-[10px] font-bold tracking-wide">
                    {post.category}
                  </span>
                )}
              </div>

              {/* 콘텐츠 */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-tight mb-2 line-clamp-2 group-hover:text-[#F9954E] transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 mb-3">
                  {post.description}
                </p>

                {/* 메타 정보 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                    <Calendar className="w-3 h-3" />
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-neutral-400" />
                      <span className="text-[10px] text-neutral-400 line-clamp-1 max-w-[120px]">
                        {post.tags.slice(0, 2).join(", ")}
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
