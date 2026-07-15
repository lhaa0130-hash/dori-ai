"use client";

// 관리자 전용 게이트 — 로그인(RequireAuth) 통과 후, 관리자 이메일이 아니면 접근 차단.
// 비로그인 → /login 리다이렉트(RequireAuth가 처리), 로그인했지만 관리자 아님 → 안내 화면.
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import RequireAuth from "@/components/auth/RequireAuth";

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (isAdminEmail(session?.user?.email)) return <>{children}</>;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6 bg-white dark:bg-black">
      <div className="w-14 h-14 rounded-2xl bg-[#F9954E]/10 flex items-center justify-center text-[28px]">🔒</div>
      <div>
        <h1 className="text-[18px] font-extrabold text-neutral-900 dark:text-white mb-1.5">관리자 전용 페이지예요</h1>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed break-keep">
          이 기능은 아직 운영자만 사용할 수 있어요.<br />권한이 필요하면 운영자에게 문의해 주세요.
        </p>
      </div>
      <Link href="/" className="mt-1 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[13px] font-extrabold active:opacity-85">
        홈으로 돌아가기
      </Link>
    </div>
  );
}

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminOnly>{children}</AdminOnly>
    </RequireAuth>
  );
}
