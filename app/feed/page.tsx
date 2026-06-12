"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { listFeed, addPost, deletePost, toggleLike, currentUid, type FeedPost } from "@/lib/social";

const POINT = "#F9954E";

export default function FeedPage() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const myName = session?.user?.name || session?.user?.email?.split("@")[0] || "나";
  const isLoggedIn = !!session?.user;

  const refresh = useCallback(async () => {
    const list = await listFeed(60);
    setPosts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    setUid(currentUid());
    refresh();
  }, [refresh, session]);

  const handlePost = async () => {
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    const ok = await addPost(myName, body);
    setPosting(false);
    if (ok) {
      setText("");
      await refresh();
    }
  };

  const handleLike = async (post: FeedPost) => {
    // 낙관적 토글
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: Math.max(0, p.likeCount + (p.likedByMe ? -1 : 1)) }
          : p
      )
    );
    const ok = await toggleLike(post.id, post.likedByMe);
    if (!ok) await refresh();
  };

  const handleDelete = async (postId: string) => {
    const ok = await deletePost(postId);
    if (ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <main className="w-full min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* 헤더 */}
        <div className="mb-5">
          <p className="text-[11px] font-bold tracking-wide" style={{ color: POINT }}>
            FEED
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            피드
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            짧은 생각과 소식을 자유롭게 남겨보세요.
          </p>
        </div>

        {/* 글쓰기 박스 / 로그인 유도 */}
        {isLoggedIn ? (
          <div className="rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4 mb-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="무슨 생각을 하고 있나요?"
              rows={3}
              maxLength={1000}
              className="w-full resize-none bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 outline-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-neutral-400">{text.length}/1000</span>
              <button
                type="button"
                onClick={handlePost}
                disabled={!text.trim() || posting}
                className="bg-[#F9954E] text-white text-sm font-semibold rounded-full px-5 py-2 active:opacity-85 disabled:opacity-40 transition"
              >
                {posting ? "올리는 중..." : "올리기"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5 mb-6 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              글을 남기려면 로그인이 필요해요.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#F9954E] text-white text-sm font-semibold rounded-full px-5 py-2 active:opacity-85"
            >
              로그인하기
            </Link>
          </div>
        )}

        {/* 목록 */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4 animate-pulse h-24"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-10 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">첫 글을 남겨보세요.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => {
              const mine = !!uid && post.uid === uid;
              return (
                <li
                  key={post.id}
                  className="rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/profile?uid=${post.uid}`}
                        className="font-bold text-sm text-neutral-900 dark:text-white hover:underline truncate inline-block max-w-[180px] align-bottom"
                      >
                        {post.name}
                      </Link>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {post.at ? new Date(post.at).toLocaleString("ko-KR") : ""}
                      </p>
                    </div>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="text-[11px] text-neutral-400 hover:text-red-500 active:opacity-85 flex-shrink-0"
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line break-words">
                    {post.text}
                  </p>

                  <div className="mt-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => handleLike(post)}
                      className="inline-flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 bg-neutral-100 dark:bg-zinc-900 active:opacity-85 transition"
                      aria-pressed={post.likedByMe}
                    >
                      <span style={{ color: post.likedByMe ? POINT : undefined }}>
                        {post.likedByMe ? "♥" : "♡"}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: post.likedByMe ? POINT : undefined }}
                      >
                        {post.likeCount}
                      </span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
