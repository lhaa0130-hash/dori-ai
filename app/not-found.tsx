import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 | illo",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-7xl font-black text-[#F9954E]">404</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        앗, 페이지를 찾을 수 없어요
      </h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400">
        주소가 바뀌었거나 삭제된 페이지일 수 있어요. 아래에서 원하는 곳으로 이동해 보세요.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white text-sm font-bold hover:bg-[#E8832E] transition-colors"
        >
          홈으로
        </Link>
        <Link
          href="/insight"
          className="px-5 py-2.5 rounded-full border border-stone-300 dark:border-stone-700 text-sm font-bold hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
        >
          AI 인사이트
        </Link>
        <Link
          href="/ai-tools"
          className="px-5 py-2.5 rounded-full border border-stone-300 dark:border-stone-700 text-sm font-bold hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
        >
          AI 도구 모음
        </Link>
      </div>
    </main>
  );
}
