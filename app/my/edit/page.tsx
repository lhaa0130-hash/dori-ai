"use client";

// 03-A단계: 프로필 편집은 코지홈(/profile)으로 일원화됨.
//  기존 /my/edit(로컬 저장 중심)와 /profile(Firestore 중심)로 나뉘어 있던 편집 화면을
//  공식 편집화면 = /profile 하나로 통합했다. 이 경로는 하위호환을 위해 리다이렉트만 유지한다.
//  (표시 이름·아이디·소개·상태·프로필 사진·배경·색을 모두 /profile 꾸미기 패널에서 관리)
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const T = {
  ko: { redirecting: "프로필 편집으로 이동 중…" },
  en: { redirecting: "Redirecting to profile editor…" },
} as const;

export default function EditRedirectPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const t = T[isEn ? "en" : "ko"];
  useEffect(() => {
    // ?edit=1 → 코지홈이 열리면서 꾸미기(편집) 패널을 자동으로 펼친다.
    router.replace(isEn ? "/en/profile?edit=1" : "/profile?edit=1");
  }, [router, isEn]);
  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-4" />
      <p className="text-[13px] text-stone-400 font-semibold">{t.redirecting}</p>
    </main>
  );
}
