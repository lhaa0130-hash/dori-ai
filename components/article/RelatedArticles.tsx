import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";

interface RelatedItem {
  slug: string;
  title: string;
  thumbnail?: string;
  thumbnail_url?: string;
  date?: string;
  tags?: string[];
}

interface RelatedArticlesProps {
  currentSlug: string;
  currentTags: string[];
  allPosts: RelatedItem[];
  locale?: "ko" | "en";
}

export default function RelatedArticles({
  currentSlug,
  currentTags,
  allPosts,
  locale = "ko",
}: RelatedArticlesProps) {
  const en = locale === "en";
  const articleBase = en ? "/en/insight/article/" : "/insight/article/";
  // 같은 태그를 가진 다른 기사 필터링 (최대 3개)
  const related = allPosts
    .filter((t) => t.slug !== currentSlug)
    .filter((t) => {
      if (!currentTags || currentTags.length === 0) return true;
      if (!t.tags || t.tags.length === 0) return false;
      return t.tags.some((tag) => currentTags.includes(tag));
    })
    .slice(0, 3);

  // 태그 매칭이 부족하면 최신 기사로 보충
  const fallback = allPosts
    .filter((t) => t.slug !== currentSlug)
    .slice(0, 3 - related.length);

  const articles = [...related, ...fallback].slice(0, 3);

  if (articles.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800">
      <h2 className="text-lg font-extrabold text-foreground mb-5">
        {en ? "You might also like 🤔" : "이런 기사는 어떠세요? 🤔"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`${articleBase}${article.slug}`}
            className="group block bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 overflow-hidden hover:border-[#F9954E] dark:hover:border-[#F9954E] hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* 썸네일 */}
            <div className="relative w-full h-32 bg-gradient-to-br from-[#F9954E]/10 to-[#FF7B54]/5">
              {(article.thumbnail || article.thumbnail_url) ? (
                <Image
                  src={(article.thumbnail || article.thumbnail_url) as string}
                  alt={article.title}
                  fill
                  style={{ objectFit: "cover" }}
                  className="group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl opacity-20">🤖</span>
                </div>
              )}
            </div>

            {/* 콘텐츠 */}
            <div className="p-3">
              <h3 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-2 mb-1.5 group-hover:text-[#F9954E] transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-stone-400">
                <Calendar className="w-3 h-3" />
                <time dateTime={article.date}>
                  {new Date(article.date as string).toLocaleDateString("ko-KR", {
                    month: "short",
                    day: "numeric",
                  })}
                  {/T\d|\d{1,2}:\d{2}/.test(String(article.date)) && (
                    <span className="ml-1 opacity-70">{new Date(article.date as string).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                </time>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
