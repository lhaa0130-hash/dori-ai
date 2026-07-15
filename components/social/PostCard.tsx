"use client";

// 공용 피드 포스트 카드 (탐색·피드 공용). 좋아요 토글 + 카운트 + 작성자 링크 + 미디어.
import { useState } from "react";
import Link from "next/link";
import { toggleLike, type FeedPost } from "@/lib/social";

function timeAgo(at: number): string {
  if (!at) return "";
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return "방금";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  try { return new Date(at).toLocaleDateString("ko-KR"); } catch { return ""; }
}

// #해시태그를 칩 링크로, 본문 줄바꿈 유지
function renderText(text: string) {
  const parts = text.split(/(#[\p{L}\p{N}_]+)/u);
  return parts.map((p, i) =>
    p.startsWith("#") && p.length > 1 ? (
      <Link key={i} href={`/explore?tag=${encodeURIComponent(p.slice(1))}`} className="text-[#F9954E] font-semibold hover:underline">
        {p}
      </Link>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function PostCard({ post, myName }: { post: FeedPost; myName: string }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [busy, setBusy] = useState(false);

  const onLike = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const ok = await toggleLike(post.id, liked, myName);
    if (!ok) { setLiked(liked); setLikeCount((c) => Math.max(0, c + (next ? -1 : 1))); }
    setBusy(false);
  };

  const letter = (post.name || "?").trim().charAt(0) || "?";

  return (
    <article className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <Link href={`/profile?uid=${post.uid}`} className="w-9 h-9 rounded-full bg-[#F9954E]/15 text-[#F9954E] flex items-center justify-center font-extrabold text-[15px] shrink-0">
          {letter}
        </Link>
        <div className="min-w-0">
          <Link href={`/profile?uid=${post.uid}`} className="text-[13px] font-bold text-stone-900 dark:text-white hover:underline truncate block">
            {post.name}
          </Link>
          <p className="text-[11px] text-stone-400 leading-none">{timeAgo(post.at)}</p>
        </div>
      </div>

      {post.text && (
        <p className="text-[14px] leading-relaxed text-stone-700 dark:text-stone-200 whitespace-pre-wrap break-words">
          {renderText(post.text)}
        </p>
      )}

      {post.mediaUrl && post.mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mediaUrl} alt="" className="mt-3 rounded-xl w-full object-cover max-h-[420px]" />
      )}
      {post.mediaUrl && post.mediaType === "video" && (
        <video src={post.mediaUrl} controls className="mt-3 rounded-xl w-full max-h-[420px]" />
      )}

      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-stone-50 dark:border-zinc-900/60">
        <button onClick={onLike} disabled={busy} className="flex items-center gap-1.5 text-[13px] font-bold active:opacity-70 disabled:opacity-50">
          <span className={liked ? "" : "grayscale opacity-60"}>{liked ? "❤️" : "🤍"}</span>
          <span className={liked ? "text-[#F9954E]" : "text-stone-500 dark:text-stone-400"}>{likeCount.toLocaleString()}</span>
        </button>
        <Link href={`/feed?post=${post.id}`} className="flex items-center gap-1.5 text-[13px] font-bold text-stone-500 dark:text-stone-400 active:opacity-70">
          💬 <span>{post.commentCount.toLocaleString()}</span>
        </Link>
      </div>
    </article>
  );
}
