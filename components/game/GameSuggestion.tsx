import Link from "next/link";

// 게임 하단 건의/버그 제보 링크 (다크 아케이드 테마)
export default function GameSuggestion() {
  return (
    <div className="w-full max-w-md mx-auto mt-4 px-4">
      <Link
        href="/suggestion"
        className="block w-full text-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[12px] font-medium text-neutral-400 hover:text-white hover:border-[#F9954E]/40 transition-colors"
      >
        🛠️ 이 게임 건의 · 버그 제보하기
      </Link>
    </div>
  );
}
