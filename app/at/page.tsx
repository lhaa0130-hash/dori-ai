"use client";

// 사용자 개인 홈 — illo.im/@<username> (사용자 홈 개발 01단계)
// 정적 export + Cloudflare _redirects(/@* → /at.html 200)로 어떤 @경로든 이 페이지가 받아
// window.location 경로를 파싱해 Firestore에서 공개 프로필을 조회해 그린다.
// (개발/폴백용으로 쿼리 ?h=<handle> 도 지원)
//
// ⚠️ 이번 단계 범위: 최소 공개 프로필(이미지·이름·@아이디·자기소개) + 본인 여부 구분까지만.
//    게시물·타임라인·팔로우·메시지 등은 후속 단계. AI 일기 재구현 안 함(기존 링크만 유지).

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfileByHandle, currentUid, type Profile } from "@/lib/social";

type View =
  | { kind: "loading" }
  | { kind: "notfound"; handle: string }
  | { kind: "profile"; profile: Profile; isOwner: boolean };

export default function AtHomePage() {
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    let handle = "";
    try {
      const sp = new URLSearchParams(window.location.search);
      handle = sp.get("h") || sp.get("u") || "";
      if (!handle) {
        // 경로에서 첫 세그먼트 추출: "/@dori" → "@dori" → "dori"
        const seg = window.location.pathname.split("/").filter(Boolean)[0] || "";
        handle = seg.startsWith("@") ? seg.slice(1) : seg;
      }
    } catch { /* ignore */ }
    try { handle = decodeURIComponent(handle); } catch { /* keep */ }
    handle = handle.replace(/^@+/, "").trim();

    if (!handle) { setView({ kind: "notfound", handle: "" }); return; }

    let alive = true;
    (async () => {
      const p = await getProfileByHandle(handle);
      if (!alive) return;
      // ⚠️ 핸들로만 해석한다. getProfileByHandle의 uid 폴백으로 /@<uid> 가 열리지 않도록,
      //    프로필의 실제 handle이 요청한 아이디와 정확히 일치할 때만 렌더(불일치=404).
      if (!p || !p.handle || p.handle.toLowerCase() !== handle.toLowerCase()) {
        // 존재하지 않는 아이디 → 404(서버 오류 아님)
        setView({ kind: "notfound", handle });
        return;
      }
      const isOwner = currentUid() === p.uid;
      setView({ kind: "profile", profile: p, isOwner });
      // SEO 기본: 존재하는 공개 홈만 제목/설명 구성
      try {
        document.title = `${p.name} (@${p.handle}) | illo`;
        const desc = p.bio?.trim() || `${p.name}님의 illo 홈입니다.`;
        let m = document.querySelector('meta[name="description"]');
        if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
        m.setAttribute("content", desc.slice(0, 160));
      } catch { /* */ }
    })();
    return () => { alive = false; };
  }, []);

  if (view.kind === "loading") {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-6">
        <p className="text-[13px] text-stone-400 animate-pulse">불러오는 중…</p>
      </main>
    );
  }

  if (view.kind === "notfound") {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-3xl mb-5">🔍</div>
        <h1 className="text-[20px] font-extrabold text-stone-900 dark:text-white mb-2">
          {view.handle ? `@${view.handle} 님을 찾을 수 없어요` : "주소가 올바르지 않아요"}
        </h1>
        <p className="text-[14px] text-stone-500 dark:text-stone-400 mb-6 break-keep">
          아이디가 바뀌었거나 아직 설정되지 않았을 수 있어요.
        </p>
        <Link href="/" className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:scale-95 transition">
          홈으로
        </Link>
      </main>
    );
  }

  const { profile: p, isOwner } = view;
  const avatarUrl = p.photoURL || "";

  return (
    <main className="w-full max-w-2xl mx-auto px-6 pt-8 pb-20">
      {/* 프로필 헤더 — 이미지·이름·@아이디·자기소개 (공개 필드만) */}
      <section className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-3xl overflow-hidden bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-4xl mb-4 ring-1 ring-black/5 dark:ring-white/10">
          {avatarUrl
            ? <img src={avatarUrl} alt={p.name} className="w-full h-full object-cover" />
            : <span aria-hidden="true">👤</span>}
        </div>

        <h1 className="text-[22px] font-extrabold text-stone-900 dark:text-white leading-tight break-keep">
          {p.name}
        </h1>
        <p className="mt-0.5 text-[13px] font-mono text-[#E8832E] dark:text-[#FBAA60]">@{p.handle}</p>

        {p.bio?.trim() && (
          <p className="mt-3 text-[14px] text-stone-600 dark:text-stone-300 leading-relaxed break-keep max-w-md whitespace-pre-wrap">
            {p.bio}
          </p>
        )}

        {/* 본인 여부 구분 — 본인이면 내 홈/편집 진입, 남이면 표시만 (팔로우·메시지 등은 후속 단계) */}
        <div className="mt-6 flex items-center gap-2">
          {isOwner ? (
            <>
              <Link href="/profile" className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[12.5px] font-bold active:scale-95 transition">
                내 홈
              </Link>
              <Link href="/my/edit" className="px-4 py-2 rounded-full border border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-stone-300 text-[12.5px] font-bold active:scale-95 transition">
                프로필 편집
              </Link>
            </>
          ) : (
            <span className="px-4 py-2 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-500 dark:text-stone-400 text-[12.5px] font-semibold">
              공개 프로필
            </span>
          )}
        </div>
      </section>

      {/* 기존 AI 소개페이지가 있으면 링크만 유지(재구현 아님). 없으면 표시 안 함. */}
      {Array.isArray(p.myAIs) && p.myAIs.length > 0 && (
        <section className="mt-8">
          <p className="text-[11px] font-bold text-[#F9954E] mb-2">AI</p>
          <Link
            href={`/u/${p.handle}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-stone-600 dark:text-stone-300 hover:text-[#F9954E] transition"
          >
            {p.name}님의 AI {p.myAIs.length}개 보기 →
          </Link>
        </section>
      )}
    </main>
  );
}
