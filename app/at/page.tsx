"use client";

// 사용자 개인 홈 — illo.im/@<username> (사용자 홈 개발 02단계: 기본 화면 골격)
// 정적 export + Cloudflare _redirects(/@* → /at 200)로 어떤 @경로든 이 페이지가 받아
// window.location 경로를 파싱해 Firestore에서 공개 프로필을 조회해 그린다.
//
// ⚠️ 02단계 범위: SNS 프로필 + 미니홈피 중간 느낌의 '골격'.
//   커버·프로필·통계·액션·탭·소개·대표작품·최근게시물·AI영역까지 화면만 완성.
//   게시물/작품/팔로우/친구/메시지의 실제 CRUD·소셜 동작은 만들지 않음(준비 중/빈 상태).
//   기존 함수 재사용: getProfileByHandle·getSocialCounts·getVisitStats·listFriends·listUserFeed.
//   AI 일기(diary)는 본인 전용(비공개)이라 isOwner 일 때만 노출.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getProfileByHandle, currentUid, getSocialCounts, getVisitStats, listFriends, listUserFeed,
  type Profile, type FeedPost,
} from "@/lib/social";
import { bgGradOf } from "@/lib/shopItems";

type Stats = { followers: number; following: number; posts: number; friends: number; visitors: number; works: number };
type View =
  | { kind: "loading" }
  | { kind: "notfound"; handle: string }
  | { kind: "profile"; profile: Profile; isOwner: boolean };

type HomeTab = "home" | "posts" | "works" | "ai" | "guestbook";
const TABS: { id: HomeTab; label: string }[] = [
  { id: "home", label: "홈" },
  { id: "posts", label: "게시물" },
  { id: "works", label: "작품" },
  { id: "ai", label: "AI" },
  { id: "guestbook", label: "방명록" },
];

function fmtDate(ms?: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function AtHomePage() {
  const [view, setView] = useState<View>({ kind: "loading" });
  const [tab, setTab] = useState<HomeTab>("home");
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<FeedPost[] | null>(null);

  useEffect(() => {
    let handle = "";
    try {
      const sp = new URLSearchParams(window.location.search);
      handle = sp.get("h") || sp.get("u") || "";
      if (!handle) {
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
      // 핸들 정확 일치만 렌더(uid로 /@접근 차단)
      if (!p || !p.handle || p.handle.toLowerCase() !== handle.toLowerCase()) {
        setView({ kind: "notfound", handle });
        return;
      }
      const isOwner = currentUid() === p.uid;
      setView({ kind: "profile", profile: p, isOwner });
      try {
        document.title = `${p.name} (@${p.handle}) | illo`;
        const desc = p.bio?.trim() || `${p.name}님의 illo 홈입니다.`;
        let m = document.querySelector('meta[name="description"]');
        if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
        m.setAttribute("content", desc.slice(0, 160));
      } catch { /* */ }

      // 통계·게시물은 기존 집계 함수로 비동기 로드(실패해도 홈은 유지)
      const [counts, visits, friends] = await Promise.all([
        getSocialCounts(p.uid).catch(() => ({ followers: 0, following: 0, posts: 0 })),
        getVisitStats(p.uid).catch(() => ({ total: 0, today: 0 })),
        listFriends(p.uid).catch(() => []),
      ]);
      if (!alive) return;
      setStats({
        followers: counts.followers, following: counts.following, posts: counts.posts,
        friends: friends.length, visitors: visits.total, works: (p.myAIs || []).length,
      });
      const feed = await listUserFeed(p.uid, 3).catch(() => []);
      if (alive) setPosts(feed);
    })();
    return () => { alive = false; };
  }, []);

  // ── 상태별 화면 ──────────────────────────────────────────────
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
        <Link href="/" className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:scale-95 transition">홈으로</Link>
      </main>
    );
  }

  const { profile: p, isOwner } = view;
  const cover = bgGradOf(p.bg) || "bg-gradient-to-br from-[#F9954E]/25 to-sky-400/15";
  const soon = "곧 추가될 예정이에요"; // 준비 중 공통 문구

  return (
    <div className="w-full max-w-2xl mx-auto pb-24">
      {/* 1) 커버 — 과도하지 않은 높이, 아바타와 자연 연결 */}
      <div className="relative">
        <div className={`h-28 sm:h-36 w-full rounded-b-3xl ${cover}`} aria-hidden="true" />
        {/* 아바타(커버 하단에 겹침) */}
        <div className="absolute left-5 -bottom-10">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-3xl ring-4 ring-white dark:ring-black shadow-sm">
            {p.photoURL
              ? <img src={p.photoURL} alt={`${p.name} 프로필 이미지`} className="w-full h-full object-cover" />
              : <span aria-hidden="true">👤</span>}
          </div>
        </div>
      </div>

      {/* 2) 프로필 정보 */}
      <section className="px-5 pt-12">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[20px] font-extrabold text-stone-900 dark:text-white leading-tight break-keep flex items-center gap-1.5">
              {p.mood && <span aria-hidden="true">{p.mood}</span>}
              <span className="truncate">{p.name}</span>
            </h1>
            <p className="mt-0.5 text-[13px] font-mono text-[#E8832E] dark:text-[#FBAA60]">@{p.handle}</p>
          </div>
          {/* 등급·레벨 배지 */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-[#F9954E]/10 text-[#E8832E] dark:text-[#FBAA60] text-[11px] font-bold">Lv.{p.level}</span>
            {p.title && <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 text-[11px] font-bold max-w-[140px] truncate">{p.title}</span>}
          </div>
        </div>

        {p.statusMsg?.trim() && (
          <p className="mt-2 text-[13.5px] text-stone-600 dark:text-stone-300 break-keep">💬 {p.statusMsg}</p>
        )}
        {p.createdAt && (
          <p className="mt-1.5 text-[11.5px] text-stone-400">{fmtDate(p.createdAt)}부터 함께하고 있어요</p>
        )}

        {/* 3) 통계 — 버튼처럼 과하게 꾸미지 않음. 데이터 없으면 0 */}
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-y-3 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 py-3">
          {[
            { k: "게시물", v: stats?.posts },
            { k: "작품", v: stats?.works },
            { k: "팔로워", v: stats?.followers },
            { k: "팔로잉", v: stats?.following },
            { k: "친구", v: stats?.friends },
            { k: "방문자", v: stats?.visitors },
          ].map((s) => (
            <div key={s.k} className="flex flex-col items-center">
              <span className="text-[15px] font-extrabold text-stone-900 dark:text-white tabular-nums">{stats ? (s.v ?? 0) : "–"}</span>
              <span className="text-[11px] text-stone-400 mt-0.5">{s.k}</span>
            </div>
          ))}
        </div>

        {/* 4) 주요 액션 — 본인/타인 구분. 가짜 동작 없음 */}
        <div className="mt-4 flex items-center gap-2">
          {isOwner ? (
            <>
              <Link href="/profile?edit=1" className="flex-1 text-center px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[13px] font-bold active:scale-95 transition">프로필 편집</Link>
              <button type="button" disabled title={soon} className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-400 text-[13px] font-bold cursor-not-allowed">홈 꾸미기 · 준비 중</button>
            </>
          ) : (
            <>
              <button type="button" disabled title={soon} aria-label="팔로우 준비 중" className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-stone-400 text-[13px] font-bold cursor-not-allowed">팔로우</button>
              <button type="button" disabled title={soon} aria-label="친구 추가 준비 중" className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-stone-400 text-[13px] font-bold cursor-not-allowed">친구</button>
              <button type="button" disabled title={soon} aria-label="메시지 준비 중" className="flex-1 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-stone-400 text-[13px] font-bold cursor-not-allowed">메시지</button>
            </>
          )}
        </div>
        {!isOwner && <p className="mt-1.5 text-[11px] text-stone-400 text-center">팔로우·친구·메시지는 {soon}</p>}
      </section>

      {/* 5) 홈 탭 — 홈만 실제. 나머지는 준비 중(상세 페이지 이동 없음). 모바일 가로 스크롤 */}
      <nav className="mt-5 border-b border-stone-100 dark:border-zinc-900 sticky top-16 bg-white/90 dark:bg-black/90 backdrop-blur z-10" aria-label="사용자 홈 탭">
        <div className="flex gap-1 px-3 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 px-3.5 py-2.5 text-[13px] font-bold border-b-2 transition-colors ${active ? "border-[#F9954E] text-[#E8832E] dark:text-[#FBAA60]" : "border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 탭 콘텐츠 */}
      {tab !== "home" ? (
        <section className="px-5 py-16 text-center">
          <div className="text-3xl mb-3 opacity-30">🚧</div>
          <p className="text-[14px] font-bold text-stone-500 dark:text-stone-400">{TABS.find((t) => t.id === tab)?.label} 탭은 {soon}</p>
        </section>
      ) : (
        <div className="px-5 pt-5 space-y-6">
          {/* 6) 소개 */}
          <section>
            <p className="text-[11px] font-bold text-[#F9954E] mb-2">소개</p>
            {p.bio?.trim() ? (
              <p className="text-[14px] text-stone-700 dark:text-stone-300 leading-relaxed break-keep whitespace-pre-wrap">{p.bio}</p>
            ) : isOwner ? (
              <div className="rounded-2xl border border-dashed border-stone-200 dark:border-zinc-800 p-4 text-center">
                <p className="text-[13px] text-stone-500 dark:text-stone-400">아직 소개가 없습니다.<br />나를 소개하는 글을 작성해보세요.</p>
                <Link href="/profile?edit=1" className="inline-block mt-2 text-[12px] font-bold text-[#F9954E]">소개 작성 →</Link>
              </div>
            ) : (
              <p className="text-[13px] text-stone-400">아직 소개가 없습니다.</p>
            )}
          </section>

          {/* 7) 나의 AI — myAIs(AI 캐릭터) 재사용(공개). 작품 포트폴리오와는 별개(후속 단계). 없으면 빈 상태 */}
          <section>
            <p className="text-[11px] font-bold text-[#F9954E] mb-2">나의 AI</p>
            {p.myAIs && p.myAIs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {p.myAIs.slice(0, 4).map((ai) => (
                  <Link key={ai.id} href={`/u/${p.handle}/${encodeURIComponent(ai.slug)}`} className="rounded-xl border border-stone-100 dark:border-zinc-800 p-3 hover:border-[#F9954E]/50 transition">
                    <div className="text-2xl mb-1.5" aria-hidden="true">{ai.emoji || "🤖"}</div>
                    <p className="text-[12.5px] font-bold text-stone-900 dark:text-white truncate">{ai.name}</p>
                    {ai.category && <p className="text-[11px] text-stone-400 truncate">{ai.category}</p>}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-stone-400">{isOwner ? "아직 만든 AI가 없어요. 작품 포트폴리오는 곧 추가될 예정이에요." : "아직 공개된 AI가 없습니다."}</p>
            )}
          </section>

          {/* 8) 최근 게시물 — listUserFeed(공개글). 없으면 빈 상태. CRUD 없음 */}
          <section>
            <p className="text-[11px] font-bold text-[#F9954E] mb-2">최근 게시물</p>
            {posts === null ? (
              <p className="text-[13px] text-stone-400 animate-pulse">불러오는 중…</p>
            ) : posts.length > 0 ? (
              <ul className="space-y-2.5">
                {posts.map((post) => (
                  <li key={post.id} className="rounded-2xl border border-stone-100 dark:border-zinc-800 p-3.5">
                    <p className="text-[11px] text-stone-400 mb-1">{fmtDate(post.at)}</p>
                    <p className="text-[13.5px] text-stone-700 dark:text-stone-300 break-keep line-clamp-3 whitespace-pre-wrap">{post.text}</p>
                    {post.mediaUrl && post.mediaType === "image" && (
                      <img src={post.mediaUrl} alt="게시물 이미지" className="mt-2 w-full max-h-52 object-cover rounded-xl" loading="lazy" />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-stone-400">{isOwner ? "아직 작성한 게시물이 없습니다." : "아직 공개된 게시물이 없습니다."}</p>
            )}
          </section>

          {/* 9) AI 영역 — AI 일기는 본인 전용(비공개). 타인에겐 노출 안 함 */}
          <section>
            <p className="text-[11px] font-bold text-[#F9954E] mb-2">AI</p>
            {isOwner ? (
              p.diary && p.diary.length > 0 ? (
                <ul className="space-y-2">
                  {p.diary.slice(0, 3).map((e) => (
                    <li key={e.at} className="rounded-xl bg-stone-50 dark:bg-zinc-900 p-3 border-l-2 border-[#F9954E]/40">
                      <p className="text-[11px] text-stone-400 mb-0.5">{e.mood && <span className="mr-1">{e.mood}</span>}{fmtDate(e.at)}</p>
                      <p className="text-[13px] text-stone-700 dark:text-stone-300 break-keep line-clamp-2 whitespace-pre-wrap">{e.text}</p>
                    </li>
                  ))}
                  <li>
                    <Link href="/profile" className="text-[12px] font-bold text-[#F9954E]">내 코지홈에서 전체 보기 →</Link>
                  </li>
                </ul>
              ) : (
                <p className="text-[13px] text-stone-400">아직 AI 일기가 없어요. <Link href="/profile" className="font-bold text-[#F9954E]">코지홈</Link>에서 오늘 하루를 정리해보세요.</p>
              )
            ) : (
              <p className="text-[13px] text-stone-400">AI 일기는 본인에게만 보여요.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
