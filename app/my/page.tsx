"use client";

// 마이페이지는 코지홈으로 통합됨 — /profile 로 리다이렉트.
// (기존 마이페이지 본문은 components/my/MyDashboard.tsx 로 이동, 코지홈 '계정·활동' 탭에서 렌더)
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile");
  }, [router]);
  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-4" />
      <p className="text-[13px] text-stone-400 font-semibold">코지홈으로 이동 중…</p>
    </main>
  );
}
