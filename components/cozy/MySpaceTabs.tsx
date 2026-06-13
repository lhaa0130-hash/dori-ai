"use client";

// "내 공간" 세그먼트 탭 — 코지홈 ↔ 상점을 한 묶음처럼 자유 이동
import Link from "next/link";

export default function MySpaceTabs({ active }: { active: "home" | "shop" }) {
  const tabs = [
    { id: "home", label: "코지홈", emoji: "🏠", href: "/profile" },
    { id: "shop", label: "상점", emoji: "🛍", href: "/shop" },
  ] as const;
  return (
    <div className="max-w-2xl mx-auto px-5 pt-4">
      <div className="flex gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-zinc-900">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors ${
              active === t.id
                ? "bg-white dark:bg-zinc-800 text-[#F9954E] shadow-sm"
                : "text-neutral-500 dark:text-neutral-400 active:opacity-70"
            }`}
          >
            {t.emoji} {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
