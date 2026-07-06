"use client";

// 프로젝트 보호 게이트 — 비로그인 시 로그인 화면(/login?next=...)으로 전환.
// 로그인된 경우에만 children 렌더. (몽글로 동물도감은 공개라 미적용)
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [status, router]);

  if (status === "authenticated") return <>{children}</>;

  // 확인/리다이렉트 중 — 전체화면 플레이스홀더
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6 bg-white dark:bg-black">
      <div className="w-7 h-7 rounded-full border-2 border-neutral-200 dark:border-zinc-700 border-t-[#F9954E] animate-spin" />
      <p className="text-[13px] text-neutral-400">
        {status === "loading" ? "확인 중…" : "로그인이 필요한 프로젝트예요. 로그인 화면으로 이동합니다…"}
      </p>
    </div>
  );
}
