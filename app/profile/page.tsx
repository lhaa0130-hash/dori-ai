"use client";

// 코지홈(마이페이지)은 2026-08-14 에 폐지되고 **마이월드**로 통합됐다.
// 이 라우트는 지우지 않고 **길잡이**로 남긴다 — 북마크·외부 링크·앱 내부 링크가 아직 여기를 가리킨다.
//
// 왜 폐지했나
//   "내 공간"이 /profile(코지홈 2,018줄) · /my-world(캐릭터·방) · /at(/@핸들 공개 홈) 셋으로
//   갈라져 서로 겹치는데 **하나도 완성되지 않은** 상태였다. 회원 7명이 세 곳으로 흩어지니
//   어디를 가도 비어 보였다. 그래서 편집은 마이월드, 공개는 /@핸들 로 둘만 남겼다.
//
//   옛 코지홈 기능의 행선지
//     이름·아이디(핸들)·소개 편집 → /my-world?tab=profile
//     방명록                      → /my-world?tab=guestbook  (공개 홈 /@핸들 에도 붙는다)
//     게임 기록                   → /my-world?tab=records
//     계정·활동(MyDashboard)      → /my-world?tab=account
//     테마색·배경·프레임·스티커   → 폐기. 마이월드에서는 **방 꾸미기**가 그 역할을 한다.
//     내 동물(MyAnimalsSection)   → 뺐다. 동물도감이 애드센스 때문에 비공개라 되살릴 때 함께 판단.
//
// ⚠️ 분기가 세 갈래인 이유 — 특히 ?uid= 를 반드시 처리해야 한다.
//    피드·탐색·메시지·PostCard 가 남의 프로필을 `/profile?uid=<남의uid>` 로 링크한다(6곳).
//    이걸 무조건 /my-world 로 보내면 **남을 눌렀는데 내 페이지가 열린다**. 그래서 uid 가 오면
//    핸들을 찾아 그 사람의 공개 홈(/@핸들)으로 보낸다. 핸들이 없으면 그 사실을 알려 준다
//    (실측 2026-08-13: 회원 7명 중 핸들 보유 0명 — 아주 흔한 경우라 조용히 실패하면 안 된다).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { currentUid, getProfile } from "@/lib/social";

type State = { kind: "redirecting" } | { kind: "nohandle"; name: string };

export default function ProfileRedirectPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const [state, setState] = useState<State>({ kind: "redirecting" });

  useEffect(() => {
    const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const uid = sp?.get("uid") || "";
    const edit = sp?.has("edit");
    const prefix = isEn ? "/en" : "";

    // ① 남의 프로필 요청 — 공개 홈으로 넘긴다
    if (uid && uid !== currentUid()) {
      let alive = true;
      getProfile(uid)
        .then((p) => {
          if (!alive) return;
          if (p?.handle) router.replace(`/@${p.handle}`);
          else setState({ kind: "nohandle", name: p?.name || "이 회원" });
        })
        .catch(() => { if (alive) setState({ kind: "nohandle", name: "이 회원" }); });
      return () => { alive = false; };
    }

    // ② 편집 진입 ③ 그 외 — 내 마이월드
    router.replace(`${prefix}/my-world${edit ? "?tab=profile" : ""}`);
  }, [router, isEn]);

  if (state.kind === "nohandle") {
    return (
      <main className="flex min-h-[70vh] w-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-3xl dark:bg-zinc-900">🏠</div>
        <h1 className="mb-2 text-[18px] font-extrabold text-stone-900 dark:text-white">
          {state.name}님은 아직 공개 주소가 없어요
        </h1>
        <p className="mb-6 break-keep text-[14px] text-stone-500 dark:text-stone-400">
          아이디를 정하면 illo.im/@아이디 로 공개 홈이 열립니다.
        </p>
        <Link href="/my-world" className="rounded-full bg-[#F9954E] px-5 py-2.5 text-[13px] font-bold text-white transition active:scale-95">
          내 마이월드로
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-stone-100 border-t-[#F9954E] dark:border-zinc-800" />
      <p className="text-[13px] font-semibold text-stone-400">{isEn ? "Redirecting…" : "이동 중…"}</p>
    </main>
  );
}
