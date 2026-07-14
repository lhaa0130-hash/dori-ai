"use client";

// 인사이트 글 좋아요 + 댓글. slug 기준 Firestore 저장.
//   articleLikes/{slug} { count }, articleLikes/{slug}/likers/{uid}
//   articleComments/{slug}/items/{id} { uid, name, text, createdAt }
// 좋아요/댓글 작성은 로그인 필수(비로그인은 /login?next=로 유도). 읽기는 공개.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Trash2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, deleteDoc, collection, addDoc, query, orderBy, limit,
  getDocs, increment, writeBatch, serverTimestamp,
} from "firebase/firestore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cmt = { id: string; uid: string; name: string; text: string; createdAt?: any };

const db = () => getFirebaseFirestore();
const myUid = () => { try { return getFirebaseAuth().currentUser?.uid || null; } catch { return null; } };

export default function ArticleSocial({ slug, compact = false, locale = "ko" }: { slug: string; title?: string; compact?: boolean; locale?: "ko" | "en" }) {
  const en = locale === "en";
  const { status, session } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState<Cmt[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const goLogin = () => { window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`; };

  const loadComments = useCallback(async () => {
    try {
      const qs = await getDocs(query(collection(db(), "articleComments", slug, "items"), orderBy("createdAt", "desc"), limit(100)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setComments(qs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } catch { /* noop */ }
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db(), "articleLikes", slug));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!cancelled) setLikeCount(snap.exists() ? Math.max(0, Number((snap.data() as any).count || 0)) : 0);
      } catch { /* noop */ }
      const u = myUid();
      if (u) { try { const ls = await getDoc(doc(db(), "articleLikes", slug, "likers", u)); if (!cancelled) setLiked(ls.exists()); } catch { /* noop */ } }
      if (!cancelled) await loadComments();
    })();
    return () => { cancelled = true; };
  }, [slug, status, loadComments]);

  const toggleLike = useCallback(async () => {
    const u = myUid();
    if (!u) return goLogin();
    if (busy) return;
    setBusy(true);
    const willLike = !liked;
    setLiked(willLike);
    setLikeCount((c) => Math.max(0, c + (willLike ? 1 : -1)));
    try {
      const batch = writeBatch(db());
      const likerRef = doc(db(), "articleLikes", slug, "likers", u);
      const countRef = doc(db(), "articleLikes", slug);
      if (willLike) { batch.set(likerRef, { at: serverTimestamp() }); batch.set(countRef, { count: increment(1) }, { merge: true }); }
      else { batch.delete(likerRef); batch.set(countRef, { count: increment(-1) }, { merge: true }); }
      await batch.commit();
    } catch {
      setLiked(!willLike);
      setLikeCount((c) => Math.max(0, c + (willLike ? -1 : 1)));
    }
    setBusy(false);
  }, [liked, busy, slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = myUid();
    if (!u) return goLogin();
    const t = text.trim();
    if (!t || posting) return;
    setPosting(true);
    const name = session?.user?.name || session?.user?.email?.split("@")[0] || "익명";
    try {
      await addDoc(collection(db(), "articleComments", slug, "items"), {
        uid: u, name, text: t.slice(0, 1000), createdAt: serverTimestamp(),
      });
      setText("");
      await loadComments();
    } catch { /* noop */ }
    setPosting(false);
  };

  const remove = async (c: Cmt) => {
    const u = myUid();
    if (!u || u !== c.uid) return;
    try { await deleteDoc(doc(db(), "articleComments", slug, "items", c.id)); setComments((cur) => cur.filter((x) => x.id !== c.id)); } catch { /* noop */ }
  };

  const authed = status === "authenticated";
  const fmt = (ts: { seconds?: number } | undefined) => {
    if (!ts?.seconds) return "방금";
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className={compact
      ? "mt-6 pt-6 border-t border-neutral-100 dark:border-zinc-800"
      : "mt-10 pt-8 border-t border-neutral-200 dark:border-neutral-800 max-w-2xl mx-auto"}>
      {/* 좋아요 */}
      <div className={`flex justify-center ${compact ? "mb-5" : "mb-8"}`}>
        <button
          onClick={toggleLike}
          disabled={busy}
          aria-pressed={liked}
          className={`inline-flex items-center gap-2 ${compact ? "px-4 py-2 text-[13px]" : "px-5 py-2.5 text-[14px]"} rounded-full border font-bold transition-colors
            ${liked
              ? "bg-[#F9954E] border-[#F9954E] text-white"
              : "bg-white dark:bg-zinc-900 border-neutral-200 dark:border-zinc-700 text-neutral-600 dark:text-neutral-300 hover:border-[#F9954E]"}`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
          {en ? "Like" : "좋아요"} {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
        </button>
      </div>

      {/* 댓글 */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-[#F9954E]" />
        <h3 className="text-[15px] font-extrabold text-neutral-900 dark:text-white">{en ? "Comments" : "댓글"} {comments.length > 0 && <span className="text-[#F9954E]">{comments.length}</span>}</h3>
      </div>

      {/* 작성 폼 */}
      {authed ? (
        <form onSubmit={submit} className="flex gap-2 mb-6">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={en ? "Leave a kind comment" : "따뜻한 댓글을 남겨주세요"}
            className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none focus:border-[#F9954E]"
          />
          <button type="submit" disabled={posting || !text.trim()} className="px-4 rounded-xl bg-[#F9954E] text-white font-bold text-[13px] disabled:opacity-50 flex items-center gap-1">
            <Send className="w-3.5 h-3.5" /> {en ? "Post" : "등록"}
          </button>
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900/40 text-center">
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
            <Link href={`/login`} className="font-bold text-[#E8832E] dark:text-[#F9954E] hover:underline">{en ? "Sign in" : "로그인"}</Link>{en ? " to leave a comment." : "하면 댓글을 남길 수 있어요."}
          </p>
        </div>
      )}

      {/* 목록 */}
      {comments.length === 0 ? (
        <p className="text-center text-[13px] text-neutral-400 py-8">{en ? "Be the first to comment ✍️" : "첫 댓글을 남겨보세요 ✍️"}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3 p-3.5 rounded-xl border border-neutral-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <div className="w-8 h-8 rounded-full bg-[#FFF1E3] dark:bg-[#F9954E]/15 flex items-center justify-center text-[13px] font-bold text-[#E8832E] dark:text-[#F9954E] flex-shrink-0">
                {(c.name || (en ? "A" : "익"))[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-bold text-neutral-800 dark:text-neutral-100">{c.name || (en ? "Anonymous" : "익명")}</span>
                  <span className="text-[11px] text-neutral-400">{fmt(c.createdAt)}</span>
                  {myUid() === c.uid && (
                    <button onClick={() => remove(c)} aria-label={en ? "Delete" : "삭제"} className="ml-auto text-neutral-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[13.5px] text-neutral-700 dark:text-neutral-300 mt-0.5 break-words whitespace-pre-wrap">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
