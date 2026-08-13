"use client";

// My World 상단 "내 세계 주소" 줄 — 꾸민 결과를 **남에게 보여줄 주소**로 이어 준다.
//
// 왜 필요했나 (2026-08-13)
//   My World 를 /@핸들 공개 홈에 붙이고 나서 실제 데이터를 확인해 보니,
//   **회원 7명 중 핸들을 정한 사람이 0명**이었다. 즉 아무도 /@ 주소가 없어서,
//   방을 아무리 꾸며도 보여줄 곳이 없고 고리가 닫히지 않는다.
//   핸들 설정 UI 자체는 /profile 에 이미 있었다 — 없는 건 기능이 아니라 **연결**이었다.
//
//   그래서 편집기 맨 위에 지금 상태를 그대로 보여 준다.
//     핸들 있음 → illo.im/@핸들 (내 공개 홈으로 바로 가기)
//     핸들 없음 → 주소가 없다는 사실 + 정하러 가는 길
//
// ⚠️ 로그인하지 않았으면 아무것도 그리지 않는다(비로그인 체험 모드에는 주소 개념이 없다).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileByHandle, currentUid } from "@/lib/social";

export default function WorldAddressStrip() {
  const { status } = useAuth();
  const [handle, setHandle] = useState<string | null | undefined>(undefined); // undefined=확인 전
  const loggedIn = status === "authenticated";

  useEffect(() => {
    if (!loggedIn) { setHandle(undefined); return; }
    let alive = true;
    const uid = currentUid();
    if (!uid) { setHandle(null); return; }
    // getProfileByHandle 은 uid 로도 조회된다(handleOrUid).
    getProfileByHandle(uid)
      .then((p) => { if (alive) setHandle(p?.handle || null); })
      .catch(() => { if (alive) setHandle(null); });
    return () => { alive = false; };
  }, [loggedIn]);

  if (!loggedIn || handle === undefined) return null;

  if (!handle) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-[#F9954E]/40 bg-[#F9954E]/[0.04] px-4 py-3">
        <span className="text-[13px] font-semibold text-stone-600 dark:text-stone-300 break-keep">
          아이디를 정하면 <b className="font-mono text-[#E8832E]">illo.im/@아이디</b> 로 내 세계를 보여줄 수 있어요
        </span>
        <Link
          href="/my-world?tab=profile"
          className="shrink-0 rounded-xl bg-[#F9954E] px-3.5 py-1.5 text-[12px] font-black text-white active:scale-95 transition"
        >
          아이디 정하기
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <span className="text-[13px] text-stone-500 dark:text-stone-400">
        내 세계 주소 <b className="font-mono text-[#E8832E] dark:text-[#FBAA60]">illo.im/@{handle}</b>
      </span>
      <Link
        href={`/@${handle}`}
        className="shrink-0 rounded-xl border border-stone-200 px-3.5 py-1.5 text-[12px] font-black text-stone-600 hover:border-[#F9954E]/50 hover:text-[#F9954E] dark:border-zinc-700 dark:text-stone-300"
      >
        공개 홈 보기
      </Link>
    </div>
  );
}
