"use client";

// 회원 AI 호스팅 페이지 — illo.im/u/<handle>/<slug>
// 정적 export + Cloudflare _redirects(/u/* → /u.html 200)로 어떤 경로든 이 페이지가 받아
// window.location 경로를 파싱해 Firestore에서 해당 회원의 AI 소개페이지를 그린다.
// (개발/폴백용으로 쿼리 ?h=<handle>&a=<slug> 도 지원)

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  getAIPage, getProfileByHandle, bumpAIView, getAIStats, likeAI, hasLikedAI,
  type Profile, type AIShowcase,
} from "@/lib/social";

type View =
  | { kind: "loading" }
  | { kind: "notfound" }
  | { kind: "ai"; profile: Profile; ai: AIShowcase }
  | { kind: "dir"; profile: Profile };

const CAT_EMOJI: Record<string, string> = {
  챗봇: "💬", 그림: "🎨", 글쓰기: "✍️", 게임: "🎮", 교육: "📚", 음악: "🎵", 기타: "✨",
};

function shareBase(p: Profile): string {
  return p.handle ? p.handle : p.uid;
}

export default function AIHostPage() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [stats, setStats] = useState({ views: 0, likes: 0 });
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let handle = "", slug = "";
    try {
      const sp = new URLSearchParams(window.location.search);
      handle = sp.get("h") || sp.get("u") || "";
      slug = sp.get("a") || sp.get("ai") || "";
      if (!handle) {
        const parts = window.location.pathname.split("/").filter(Boolean); // ["u","handle","slug"]
        const ui = parts.indexOf("u");
        if (ui >= 0) { handle = parts[ui + 1] || ""; slug = parts.slice(ui + 2).join("/"); }
      }
    } catch { /* ignore */ }
    try { handle = decodeURIComponent(handle); } catch { /* keep */ }
    if (!handle) { setView({ kind: "notfound" }); return; }

    (async () => {
      if (slug) {
        const res = await getAIPage(handle, slug);
        if (!res) { setView({ kind: "notfound" }); return; }
        setView({ kind: "ai", profile: res.profile, ai: res.ai });
        setLiked(hasLikedAI(res.profile.uid, res.ai.id));
        try { document.title = `${res.ai.name} · ${res.profile.name}의 AI | illo`; } catch { /* */ }
        void bumpAIView(res.profile.uid, res.ai.id);
        setStats(await getAIStats(res.profile.uid, res.ai.id));
      } else {
        const p = await getProfileByHandle(handle);
        if (!p) { setView({ kind: "notfound" }); return; }
        setView({ kind: "dir", profile: p });
        try { document.title = `${p.name}의 AI 모음 | illo`; } catch { /* */ }
      }
    })();
  }, []);

  const handleLike = useCallback(async () => {
    if (view.kind !== "ai" || liked) return;
    const n = await likeAI(view.profile.uid, view.ai.id);
    if (n != null) { setStats((s) => ({ ...s, likes: n })); setLiked(true); }
  }, [view, liked]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true); setTimeout(() => setCopied(false), 1600);
    } catch { /* ignore */ }
  }, []);

  // ── 로딩 ──
  if (view.kind === "loading") {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black">
        <div className="w-10 h-10 border-4 border-neutral-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-4" />
        <p className="text-[13px] text-neutral-400 font-semibold">AI 페이지를 불러오는 중…</p>
      </main>
    );
  }

  // ── 못 찾음 ──
  if (view.kind === "notfound") {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black px-6 text-center">
        <div className="text-[56px] mb-3">🔍</div>
        <h1 className="text-[20px] font-black text-neutral-900 dark:text-white mb-1.5">AI 페이지를 찾을 수 없어요</h1>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
          주소가 바뀌었거나 삭제된 AI일 수 있어요.<br />나만의 AI를 만들어 자랑해보세요!
        </p>
        <Link href="/profile" className="px-5 py-3 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85">
          🤖 내 AI 자랑하러 가기
        </Link>
      </main>
    );
  }

  // ── 회원 AI 모음(슬러그 없는 /u/<handle>) ──
  if (view.kind === "dir") {
    const p = view.profile;
    const base = shareBase(p);
    return (
      <main className="w-full min-h-screen bg-white dark:bg-black pb-24">
        <section className="max-w-2xl mx-auto px-5 pt-24">
          <div className="flex items-center gap-3 mb-6">
            {p.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photoURL} alt={p.name} className="w-12 h-12 rounded-full object-cover shadow" />
            ) : (
              <span className="w-12 h-12 rounded-full bg-[#F9954E]/15 text-[#F9954E] flex items-center justify-center text-[20px] font-black">
                {(p.name || "?").charAt(0)}
              </span>
            )}
            <div>
              <h1 className="text-[18px] font-black text-neutral-900 dark:text-white leading-tight">{p.name}의 AI 모음</h1>
              <Link href={`/profile?uid=${p.uid}`} className="text-[12px] font-semibold text-[#F9954E]">코지홈 가기 →</Link>
            </div>
          </div>
          {p.myAIs.length === 0 ? (
            <p className="text-[13px] text-neutral-400 text-center py-16">아직 공개한 AI가 없어요</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {p.myAIs.map((ai, i) => (
                <a
                  key={ai.id || ai.slug || i}
                  href={`/u/${base}/${encodeURIComponent(ai.slug)}`}
                  className="block p-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:border-[#F9954E]/50 hover:shadow-md transition-all"
                >
                  <div className="text-[34px] mb-2">{ai.emoji}</div>
                  <p className="text-[15px] font-extrabold text-neutral-900 dark:text-white truncate">{ai.name}</p>
                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">{ai.desc || "소개 준비중"}</p>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  }

  // ── 개별 AI 소개 페이지 ──
  const { profile: p, ai } = view;
  const base = shareBase(p);
  const catEmoji = ai.category ? (CAT_EMOJI[ai.category] || "✨") : "";

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black pb-28">
      {/* 히어로 */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FBAA60]/20 via-[#F9954E]/5 to-transparent dark:from-[#F9954E]/15" aria-hidden />
        <div className="relative max-w-2xl mx-auto px-5 pt-24 pb-8 text-center">
          <div className="text-[72px] leading-none mb-3 drop-shadow-sm select-none">{ai.emoji}</div>
          <h1 className="text-[26px] sm:text-[30px] font-black text-neutral-900 dark:text-white leading-tight break-keep">{ai.name}</h1>
          {ai.desc && <p className="mt-2 text-[14px] text-neutral-600 dark:text-neutral-300 break-keep leading-relaxed">{ai.desc}</p>}

          {/* 배지 */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
            {ai.category && (
              <span className="px-2.5 py-1 rounded-full bg-[#F9954E]/10 text-[#F9954E] text-[11px] font-bold">{catEmoji} {ai.category}</span>
            )}
            {ai.tool && (
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300 text-[11px] font-bold">🛠 {ai.tool}</span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-500 dark:text-neutral-400 text-[11px] font-bold">👀 {stats.views.toLocaleString()}</span>
          </div>

          {/* 만든이 — /u/<handle> 는 정적 라우트가 아니라 _redirects rewrite로만 도달하므로 풀 페이지 이동(<a>) */}
          <a href={p.handle ? `/u/${p.handle}` : `/profile?uid=${p.uid}`} className="inline-flex items-center gap-2 mt-5 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-zinc-800 hover:border-[#F9954E]/50 transition-colors">
            {p.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photoURL} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-[#F9954E]/15 text-[#F9954E] flex items-center justify-center text-[10px] font-black">{(p.name || "?").charAt(0)}</span>
            )}
            <span className="text-[12px] font-bold text-neutral-700 dark:text-neutral-200">{p.name}</span>
            <span className="text-[11px] text-neutral-400">만든 AI</span>
          </a>

          {/* 액션 */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {ai.url && (
              <a
                href={ai.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full bg-[#F9954E] text-white font-bold text-[14px] shadow-sm shadow-[#F9954E]/30 active:opacity-85 transition-opacity"
              >
                🚀 체험하러 가기
              </a>
            )}
            <button
              onClick={handleLike}
              disabled={liked}
              className={`px-4 py-3 rounded-full font-bold text-[14px] border transition-colors ${
                liked
                  ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-500"
                  : "bg-white dark:bg-zinc-950 border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-neutral-200 active:opacity-70"
              }`}
            >
              {liked ? "❤️" : "🤍"} {stats.likes.toLocaleString()}
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-3 rounded-full font-bold text-[14px] border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-neutral-700 dark:text-neutral-200 active:opacity-70 transition-opacity"
            >
              {copied ? "✓ 복사됨" : "🔗 공유"}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-5 space-y-5">
        {/* 스크린샷 */}
        {ai.images && ai.images.length > 0 && (
          <div className="grid grid-cols-1 gap-3">
            {ai.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`${ai.name} 스크린샷 ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl border border-neutral-100 dark:border-zinc-900 object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ))}
          </div>
        )}

        {/* 소개 본문 */}
        {ai.body && (
          <section className="p-6 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
            <h2 className="text-[13px] font-extrabold text-[#F9954E] mb-3">소개</h2>
            <p className="text-[14px] text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed break-keep">{ai.body}</p>
          </section>
        )}

        {/* 사용법 */}
        {ai.howto && (
          <section className="p-6 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
            <h2 className="text-[13px] font-extrabold text-[#F9954E] mb-3">이렇게 써보세요</h2>
            <p className="text-[14px] text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed break-keep">{ai.howto}</p>
          </section>
        )}

        {/* 태그 */}
        {ai.tags && ai.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ai.tags.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-zinc-900 text-neutral-500 dark:text-neutral-400 text-[11px] font-medium">#{t}</span>
            ))}
          </div>
        )}

        {/* 푸터 CTA */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-[#FBAA60]/15 to-[#F9954E]/5 border border-[#F9954E]/20 text-center">
          <p className="text-[14px] font-extrabold text-neutral-900 dark:text-white mb-1">나도 내가 만든 AI 자랑하기 🤖</p>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-4">illo에서 무료로 나만의 AI 소개 페이지를 만들어요</p>
          <Link href="/profile" className="inline-block px-5 py-2.5 rounded-full bg-[#F9954E] text-white font-bold text-[13px] active:opacity-85">
            내 AI 페이지 만들기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
