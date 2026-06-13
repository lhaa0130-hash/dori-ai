"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  listFeed, getProfile, currentUid, myFollowingSet, getSuggestedUsers,
  type FeedPost, type SuggestedUser,
} from "@/lib/social";
import PostCard from "@/components/social/PostCard";
import FollowButton from "@/components/social/FollowButton";

type Tab = "hot" | "new" | "following";

// 핫 스코어: 좋아요·댓글 가중 + 시간 감쇠
function hotScore(p: FeedPost): number {
  const ageH = Math.max(0, (Date.now() - p.at) / 3_600_000);
  const engagement = p.likeCount * 2 + p.commentCount * 3 + 1;
  return engagement / Math.pow(ageH + 2, 1.5);
}

export default function ExplorePage() {
  const { session } = useAuth();
  const myName = session?.user?.name || "사용자";
  const loggedIn = !!session?.user;

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("hot");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    try { setTag(new URLSearchParams(window.location.search).get("tag")); } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feed, fset] = await Promise.all([listFeed(60), myFollowingSet()]);
      setPosts(feed);
      setFollowingSet(fset);
      // 추천 팔로우: 이미 가져온 피드/팔로잉을 재사용(중복 읽기 방지)
      const uid = currentUid();
      let interests: string[] = [];
      if (uid) { try { interests = (await getProfile(uid)).interests || []; } catch {} }
      setSuggested(await getSuggestedUsers(interests, 12, { feed, following: fset }));
    } catch { /* noop */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mounted) void load(); }, [mounted, load]);

  const list = useMemo(() => {
    let arr = posts;
    if (tag) arr = arr.filter((p) => p.text.toLowerCase().includes(`#${tag.toLowerCase()}`));
    if (tab === "following") arr = arr.filter((p) => followingSet.has(p.uid));
    if (tab === "hot") arr = [...arr].sort((a, b) => hotScore(b) - hotScore(a));
    else arr = [...arr].sort((a, b) => b.at - a.at); // new / following → 최신순
    return arr.slice(0, 60);
  }, [posts, tab, followingSet, tag]);

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "hot", label: "인기", emoji: "🔥" },
    { id: "new", label: "최신", emoji: "🆕" },
    { id: "following", label: "팔로잉", emoji: "👥" },
  ];

  return (
    <main className="w-full min-h-screen pb-24">
      <section className="max-w-2xl mx-auto px-5 pt-7">
        {/* 히어로 */}
        <p className="text-[12px] font-semibold text-[#F9954E] mb-2">탐색</p>
        <h1 className="text-[30px] sm:text-[38px] font-extrabold text-neutral-950 dark:text-white leading-[1.12] tracking-tight mb-2">
          {tag ? <>#{tag}</> : <>지금 뜨는 <span className="text-[#F9954E]">AI 이야기</span></>}
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-5 break-keep">
          {tag ? "이 태그가 달린 글" : "인기 글과 사람들을 발견하고 팔로우해보세요."}
        </p>

        {/* 추천 팔로우 */}
        {!tag && suggested.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white">추천 팔로우</p>
              <span className="text-[11px] text-neutral-400">관심사 기반</span>
            </div>
            <div className="-mx-5 px-5 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2.5 w-max pb-1">
                {suggested.map((u) => (
                  <div key={u.uid} className="w-40 shrink-0 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-3.5 text-center">
                    <Link href={`/profile?uid=${u.uid}`} className="block">
                      <span className="w-12 h-12 mx-auto rounded-full bg-[#F9954E]/15 text-[#F9954E] flex items-center justify-center font-extrabold text-[18px] mb-2">
                        {(u.name || "?").trim().charAt(0) || "?"}
                      </span>
                      <p className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate min-h-[15px]">{u.bio || (u.interests[0] ? `#${u.interests[0]}` : "AI 메이트")}</p>
                    </Link>
                    <div className="mt-2.5 flex justify-center">
                      <FollowButton uid={u.uid} name={u.name} myName={myName} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-4 border-b border-neutral-100 dark:border-zinc-900 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                tab === t.id ? "bg-[#F9954E] text-white" : "bg-neutral-100 dark:bg-zinc-900 text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* 피드 */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-neutral-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[28px] mb-2">🌱</p>
            <p className="text-[14px] font-bold text-neutral-600 dark:text-neutral-300">
              {tab === "following" ? "팔로우한 사람의 글이 아직 없어요" : tag ? "이 태그의 글이 아직 없어요" : "아직 글이 없어요"}
            </p>
            <p className="text-[12px] text-neutral-400 mt-1">
              {tab === "following" ? "추천 팔로우에서 마음에 드는 사람을 팔로우해보세요" : "첫 글을 남겨보세요!"}
            </p>
            <Link href="/feed" className="inline-block mt-4 px-5 py-2.5 rounded-full bg-[#F9954E] text-white text-[13px] font-bold">피드로 가기</Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {list.map((p) => <PostCard key={p.id} post={p} myName={myName} />)}
          </div>
        )}

        {!loggedIn && (
          <div className="mt-6 p-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/60 dark:bg-zinc-950 flex items-center justify-between">
            <span className="text-[13px] font-medium text-neutral-500 dark:text-neutral-400 break-keep">로그인하면 팔로우하고 글을 남길 수 있어요</span>
            <Link href="/login" className="px-4 py-2.5 rounded-xl bg-[#F9954E] text-white text-[12px] font-bold flex-shrink-0">로그인</Link>
          </div>
        )}
      </section>
    </main>
  );
}
