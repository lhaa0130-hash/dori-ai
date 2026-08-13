"use client";

// 마이페이지·코지홈은 2026-08-14 에 마이월드로 통합됐다 — /my-world 로 리다이렉트.
// (기존 마이페이지 본문은 components/my/MyDashboard.tsx 로 이동, 코지홈 '계정·활동' 탭에서 렌더)
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const T = {
  ko: {
    redirecting: "마이월드로 이동 중…",
  },
  en: {
    redirecting: "Redirecting to My World…",
  },
} as const;

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const t = T[isEn ? "en" : "ko"];
  useEffect(() => {
    router.replace(isEn ? "/en/my-world" : "/my-world");
  }, [router, isEn]);
  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-4" />
      <p className="text-[13px] text-stone-400 font-semibold">{t.redirecting}</p>
    </main>
  );
}
