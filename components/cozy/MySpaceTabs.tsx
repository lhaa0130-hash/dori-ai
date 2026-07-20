"use client";

// "내 공간" 세그먼트 탭 — 코지홈 ↔ 상점을 한 묶음처럼 자유 이동
// 영어 라우트(/en/*)에서는 라벨·링크 모두 영어판으로 전환한다.
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MySpaceTabs({ active }: { active: "home" | "shop" }) {
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const tabs = [
    { id: "home", label: isEn ? "Cozy Home" : "코지홈", emoji: "🏠", href: isEn ? "/en/profile" : "/profile" },
    { id: "shop", label: isEn ? "Shop" : "상점", emoji: "🛍", href: isEn ? "/en/shop" : "/shop" },
  ] as const;
  return (
    <div className="max-w-2xl mx-auto px-5 pt-4">
      <div className="flex gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-zinc-900">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors ${
              active === t.id
                ? "bg-white dark:bg-zinc-800 text-[#F9954E] shadow-sm"
                : "text-stone-500 dark:text-stone-400 active:opacity-70"
            }`}
          >
            {t.emoji} {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
