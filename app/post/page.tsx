"use client";

// 게시물 상세 — illo.im/post/<postId> (게시물 04-5단계)
// 정적 export + Cloudflare _redirects(/post/* → /post 200)로 어떤 postId 경로든 이 페이지가 받아
// window.location 경로를 파싱해 Firestore에서 게시물을 불러온다(/@handle 렌더러와 동일 방식).
//
// ⚠️ 범위: 상세 조회 + 작성자 정보 + 본인 삭제만. 좋아요·댓글·공유·신고는 만들지 않는다.
//   수정은 기존 폼 복사를 피해 /feed?edit=<id> 로 이동시켜 기존 인라인 수정 UI를 재사용한다.
//   비공개(friends/groups) 판단은 Firestore 규칙이 1차 차단하고 getPost 가 동일 조건을 재확인한다.

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPost, getProfile, currentUid, softDeletePost, toggleLike,
  listComments, addComment, deleteComment,
  type FeedPost, type Profile, type FeedVisibility, type Comment,
} from "@/lib/social";
import { useAuth } from "@/contexts/AuthContext";

type View =
  | { kind: "loading" }
  | { kind: "denied" }              // 없음/삭제됨/권한없음 — 구분하지 않고 동일 화면(존재 여부 비노출)
  | { kind: "error" }
  | { kind: "ok"; post: FeedPost };

const POINT = "#F9954E";

const VIS_LABEL: Record<FeedVisibility, string> = {
  public: "전체 공개",
  friends: "친구 공개",
  groups: "그룹 공개",
};

function fmtDateTime(ms?: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function PostDetailPage() {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "loading" });
  const [author, setAuthor] = useState<Profile | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  // 04-6 좋아요 — 기존 feed.likeCount/likedBy 구조와 toggleLike 재사용(새 컬렉션·새 API 없음)
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeError, setLikeError] = useState("");
  // 04-7 댓글 — feed/{postId}/comments 서브컬렉션 + 기존 listComments/addComment/deleteComment 재사용
  const { session } = useAuth();
  const [comments, setComments] = useState<Comment[] | null>(null); // null=아직 로드 전
  const [commentCount, setCommentCount] = useState(0);
  const [commentsError, setCommentsError] = useState("");
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentActionError, setCommentActionError] = useState("");
  const [commentsRetrying, setCommentsRetrying] = useState(false); // 04-9 재시도 중(중복 클릭 방지)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const composingRef = useRef(false); // 한글 IME 조합 중 Enter 제출 방지

  // 경로에서 postId 파싱 (/post/<id>) — 쿼리스트링 방식은 쓰지 않지만 ?id= 는 로컬 검증용 폴백
  useEffect(() => {
    let id = "";
    try {
      const segs = window.location.pathname.split("/").filter(Boolean); // ["post", "<id>"]
      if (segs[0] === "post" && segs[1]) id = decodeURIComponent(segs[1]);
      if (!id) id = new URLSearchParams(window.location.search).get("id") || "";
    } catch { /* ignore */ }
    setPostId(id.trim() || null);
  }, []);

  const load = useCallback(async (id: string, alive: () => boolean) => {
    setView({ kind: "loading" });
    setAuthor(null);
    try {
      const p = await getPost(id);
      if (!alive()) return;
      if (!p) { setView({ kind: "denied" }); return; }
      setView({ kind: "ok", post: p });
      // 좋아요 초기 상태 — 잘못된 데이터에도 UI가 깨지지 않도록 방어적으로 해석
      setLiked(!!p.likedByMe);
      setLikeCount(Math.max(0, Number(p.likeCount) || 0));
      setLikeError("");
      // 댓글 초기화 후 별도 로드(실패해도 게시물 본문은 유지)
      setComments(null);
      setCommentCount(Math.max(0, Number(p.commentCount) || 0));
      setCommentsError(""); setCommentActionError(""); setDraft("");
      try {
        const list = await listComments(id);
        if (alive()) setComments(list);
      } catch {
        // 04-9: 조회 실패는 '댓글 0개'가 아니다. comments 는 null 로 두고 오류 상태로 표시한다.
        //  (내부 오류 코드·uid 는 사용자에게 노출하지 않는다)
        if (alive()) { setComments(null); setCommentsError("댓글을 불러오지 못했습니다."); }
      }
      // 작성자 공개 프로필(users/{uid})을 우선 사용. userPrivate 는 절대 읽지 않는다.
      try {
        const prof = await getProfile(p.uid);
        if (alive()) setAuthor(prof);
      } catch { /* 스냅샷 이름으로 폴백 */ }
    } catch {
      if (alive()) setView({ kind: "error" });
    }
  }, []);

  // ⚠️ Firebase 세션 복원은 비동기라 최초 렌더에는 currentUid() 가 null 이다.
  //    한 번만 읽으면 로그인 사용자가 비로그인으로 취급돼 좋아요·댓글 입력·작성자 관리 메뉴가
  //    모두 막힌다(04-8B 에뮬레이터 로그인 검증에서 재현). session 확정 시마다 재평가한다(/feed 와 동일).
  useEffect(() => { setMe(currentUid()); }, [session]);

  useEffect(() => {
    setMe(currentUid());
    if (postId === null) return;
    if (!postId) { setView({ kind: "denied" }); return; }
    let ok = true;
    load(postId, () => ok);
    return () => { ok = false; };
  }, [postId, load]);

  // 공개글일 때만 제목/설명을 넣는다(비공개 글 내용이 문서 제목에 새지 않도록).
  useEffect(() => {
    if (view.kind !== "ok") return;
    const p = view.post;
    try {
      if (p.isPublic) {
        const who = author?.name || p.name;
        document.title = `${who}님의 게시물 | illo`;
        const desc = (p.text || "").replace(/\s+/g, " ").trim().slice(0, 120);
        if (desc) {
          let m = document.querySelector('meta[name="description"]');
          if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
          m.setAttribute("content", desc);
        }
      } else {
        document.title = "게시물 | illo";
      }
    } catch { /* */ }
  }, [view, author]);

  // 관리 메뉴 — 외부 클릭·Escape 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpen]);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/feed");
  };

  // 좋아요 토글 — /feed 와 동일한 낙관적 업데이트 정책(실패 시 rollback + 안내).
  //  비로그인은 실제 쓰기를 시도하지 않고 로그인 안내만 표시(likeCount/likedBy 변경 없음).
  const handleLike = async () => {
    if (view.kind !== "ok" || likeBusy) return;
    if (!me) { setLikeError("로그인이 필요합니다."); return; }
    const wasLiked = liked;
    const prevCount = likeCount;
    setLikeBusy(true);
    setLikeError("");
    // 낙관적 반영
    setLiked(!wasLiked);
    setLikeCount(Math.max(0, prevCount + (wasLiked ? -1 : 1)));
    const ok = await toggleLike(view.post.id, wasLiked);
    setLikeBusy(false);
    if (!ok) {
      // 실패 → 이전 상태 복구(삭제·권한 변경 등으로 규칙이 막은 경우 포함)
      setLiked(wasLiked);
      setLikeCount(prevCount);
      setLikeError("좋아요 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  // ⚠️ 작성자 이름은 로케일과 무관하게 저장된다(/feed 와 동일 기준).
  const myName = session?.user?.name || session?.user?.email?.split("@")[0] || "나";

  // 04-9 댓글 목록 재조회(초기 실패 후 '다시 시도') — 중복 클릭은 commentsRetrying 로 막는다
  const retryComments = async () => {
    if (view.kind !== "ok" || commentsRetrying) return;
    setCommentsRetrying(true);
    try {
      const list = await listComments(view.post.id);
      setComments(list);
      setCommentsError(""); // 성공하면 오류 제거
    } catch {
      setComments(null);
      setCommentsError("댓글을 불러오지 못했습니다.");
    }
    setCommentsRetrying(false);
  };

  // 댓글 등록 — /feed 와 동일하게 '실제 저장 성공 후 반영'(낙관적 추가 아님)
  //  04-9: addComment 는 댓글+count 를 원자 커밋하고 실패하면 throw 한다.
  const handleAddComment = async () => {
    if (view.kind !== "ok" || submitting) return;
    if (!me) { setCommentActionError("로그인이 필요합니다."); return; }
    const body = draft.trim();
    if (!body) return;
    setSubmitting(true);
    setCommentActionError("");
    try {
      await addComment(view.post.id, view.post.uid, myName, body);
      // 여기 도달 = 댓글 문서와 commentCount +1 이 함께 커밋된 상태
      setCommentCount((n) => Math.max(0, n + 1));
      setDraft("");
      try {
        const list = await listComments(view.post.id);
        setComments(list);
        setCommentsError("");
      } catch {
        // 저장은 성공했는데 재조회만 실패 — 저장을 실패로 표시하지 않고 목록만 오류 처리
        setComments(null);
        setCommentsError("댓글을 불러오지 못했습니다.");
      }
    } catch {
      // 실패 → 입력값·목록·count 유지 + 안내(가짜 성공 금지)
      setCommentActionError("댓글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
    setSubmitting(false);
  };

  // 본인 댓글 삭제 — 성공 후에만 목록·카운트 반영
  const handleDeleteComment = async (c: Comment) => {
    if (view.kind !== "ok" || deletingCommentId) return;
    if (!window.confirm("이 댓글을 삭제할까요?")) return;
    setDeletingCommentId(c.id);
    setCommentActionError("");
    try {
      // 04-9: 댓글 삭제와 commentCount -1 이 하나의 트랜잭션. 실패하면 둘 다 그대로다.
      await deleteComment(view.post.id, c.id);
      setComments((prev) => (prev || []).filter((x) => x.id !== c.id));
      setCommentCount((n) => Math.max(0, n - 1));
    } catch {
      setCommentActionError("댓글 삭제에 실패했습니다."); // 목록·count 유지
    }
    setDeletingCommentId(null);
  };

  const handleDelete = async () => {
    if (view.kind !== "ok" || deleting) return;
    setMenuOpen(false);
    if (!window.confirm("이 게시물을 삭제할까요?\n삭제하면 피드와 사용자 홈에서 보이지 않습니다.")) return;
    setDeleting(true);
    const res = await softDeletePost(view.post.id);
    setDeleting(false);
    if (res.ok) router.push("/feed"); // 실제 성공 후에만 이동
    else setActionError(res.error || "삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
  };

  // ── 상태 화면 ───────────────────────────────────────────────
  if (view.kind === "loading") {
    return (
      <main className="w-full max-w-2xl mx-auto px-5 py-16 text-center">
        <p role="status" aria-live="polite" className="text-[13px] text-stone-400 animate-pulse">게시물을 불러오는 중…</p>
      </main>
    );
  }

  if (view.kind === "error") {
    return (
      <main className="w-full max-w-2xl mx-auto px-5 py-16 text-center">
        <p role="alert" className="text-[14px] font-bold text-stone-700 dark:text-stone-200 mb-1">게시물을 불러오지 못했습니다.</p>
        <p className="text-[13px] text-stone-500 dark:text-stone-400 mb-5">잠시 후 다시 시도해 주세요.</p>
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={() => postId && load(postId, () => true)} className="px-4 py-2.5 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:scale-95 transition">다시 시도</button>
          <Link href="/feed" className="px-4 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 text-[13px] font-bold text-stone-600 dark:text-stone-300">피드로 가기</Link>
        </div>
      </main>
    );
  }

  if (view.kind === "denied") {
    return (
      <main className="w-full max-w-2xl mx-auto px-5 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-3xl mb-5 mx-auto" aria-hidden>🔒</div>
        <h1 className="text-[18px] font-extrabold text-stone-900 dark:text-white mb-2">게시물을 볼 수 없습니다.</h1>
        <p className="text-[13.5px] text-stone-500 dark:text-stone-400 mb-6 break-keep">삭제되었거나 공개 범위가 제한된 게시물입니다.</p>
        <div className="flex items-center justify-center gap-2">
          <button type="button" onClick={goBack} className="px-4 py-2.5 rounded-full border border-stone-200 dark:border-zinc-700 text-[13px] font-bold text-stone-600 dark:text-stone-300">뒤로</button>
          <Link href="/feed" className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:scale-95 transition">피드로 가기</Link>
        </div>
      </main>
    );
  }

  const p = view.post;
  const mine = !!me && me === p.uid;
  const displayName = author?.name || p.name || "사용자";
  const handle = author?.handle || "";
  const photo = author?.photoURL || "";
  const edited = !!p.updatedAt && !!p.at && p.updatedAt > p.at + 1000; // 1초 이상 차이면 수정으로 간주

  return (
    <main className="w-full max-w-2xl mx-auto px-5 pt-4 pb-24">
      {/* 상단 — 뒤로가기 / 관리 메뉴 */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button type="button" onClick={goBack} aria-label="이전 화면으로 돌아가기"
          className="inline-flex items-center gap-1.5 h-9 px-3 -ml-2 rounded-full text-[13px] font-bold text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-900 active:opacity-85">
          <span aria-hidden>←</span> 뒤로
        </button>
        {mine && (
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu" aria-expanded={menuOpen} aria-label="게시물 관리 메뉴 열기"
              className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-zinc-900 active:opacity-85">
              <span aria-hidden className="text-lg leading-none">⋯</span>
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-10 z-20 w-28 rounded-xl border border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg py-1">
                {/* 수정 폼을 복사하지 않고 /feed 인라인 수정 UI 재사용 */}
                <Link role="menuitem" href={`/feed?edit=${encodeURIComponent(p.id)}`} onClick={() => setMenuOpen(false)}
                  className="block w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-zinc-900">수정</Link>
                <button role="menuitem" type="button" onClick={handleDelete} disabled={deleting}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50">{deleting ? "..." : "삭제"}</button>
              </div>
            )}
          </div>
        )}
      </div>

      {actionError && <p role="alert" className="mb-3 text-xs text-red-500">{actionError}</p>}

      <article className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
        {/* 작성자 */}
        <header className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-100 dark:bg-zinc-900 flex items-center justify-center text-lg font-extrabold text-[#E8832E] shrink-0">
            {photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photo} alt={`${displayName} 프로필 이미지`} className="w-full h-full object-cover" />
              : <span aria-hidden>{(displayName || "?").trim().charAt(0) || "?"}</span>}
          </div>
          <div className="min-w-0 flex-1">
            {handle ? (
              <Link href={`/@${handle}`} aria-label={`${displayName}님의 홈으로 이동`} className="block min-w-0 group">
                <p className="text-[14px] font-extrabold text-stone-900 dark:text-white truncate group-hover:underline">{displayName}</p>
                <p className="text-[12px] font-mono text-[#E8832E] dark:text-[#FBAA60] truncate">@{handle}</p>
              </Link>
            ) : (
              <p className="text-[14px] font-extrabold text-stone-900 dark:text-white truncate">{displayName}</p>
            )}
          </div>
          <span className="shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-stone-100 dark:bg-zinc-900 text-stone-500 dark:text-stone-400">
            {VIS_LABEL[p.visibility] || VIS_LABEL.public}
          </span>
        </header>

        <p className="text-[11.5px] text-stone-400 mb-3">
          {fmtDateTime(p.at)}
          {edited && <span className="ml-1.5">· 수정됨 {fmtDateTime(p.updatedAt)}</span>}
        </p>

        {/* 본문 — 전체 표시(clamp 없음), 줄바꿈 유지, 긴 단어·URL 줄바꿈 */}
        {p.text && (
          <p className="text-[15px] leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
            {p.text}
          </p>
        )}

        {/* 미디어 */}
        {p.mediaUrl && (
          <div className="mt-4">
            {p.mediaType === "video" ? (
              <video src={p.mediaUrl} controls className="rounded-xl w-full max-w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.mediaUrl} alt="게시물 이미지" loading="lazy" className="rounded-xl w-full max-w-full h-auto" />
            )}
          </div>
        )}

        {/* 04-6 좋아요 — /feed 와 같은 표현·같은 함수(toggleLike). 좋아요한 사람 목록은 노출하지 않음 */}
        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-900 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLike}
            disabled={likeBusy}
            aria-pressed={liked}
            aria-label={liked ? "좋아요 취소" : "좋아요 추가"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-stone-100 dark:bg-zinc-900 text-sm active:opacity-85 disabled:opacity-50 transition"
          >
            <span aria-hidden style={{ color: liked ? POINT : undefined }}>{liked ? "♥" : "♡"}</span>
            <span className="font-semibold" style={{ color: liked ? POINT : undefined }}>
              좋아요 <span className="tabular-nums">{likeCount}</span>
            </span>
          </button>
          {!me && (
            <span className="text-[12px] text-stone-400">
              <Link href="/login" className="underline font-semibold" style={{ color: POINT }}>로그인</Link> 후 좋아요를 남길 수 있어요.
            </span>
          )}
        </div>
        {likeError && <p role="alert" className="mt-2 text-xs text-red-500">{likeError}</p>}
      </article>

      {/* 04-7 댓글 — feed/{postId}/comments 재사용. 대댓글·댓글수정·댓글좋아요 없음 */}
      <section aria-labelledby="comments-heading" className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
        <h2 id="comments-heading" className="text-[13px] font-extrabold text-stone-900 dark:text-white mb-3">
          댓글 <span className="tabular-nums" style={{ color: POINT }}>{commentCount}</span>
        </h2>

        {/* 입력 — 로그인 시에만 활성. 비로그인은 안내만(쓰기 시도 없음) */}
        {me ? (
          <div className="flex items-start gap-2">
            <label htmlFor="comment-input" className="sr-only">댓글 입력</label>
            <input
              id="comment-input"
              type="text"
              value={draft}
              onChange={(e) => { setDraft(e.target.value); if (commentActionError) setCommentActionError(""); }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              onKeyDown={(e) => {
                // 한글 IME 조합 중 Enter 는 제출하지 않는다(중복 등록 방지)
                if (e.key === "Enter" && !e.shiftKey && !composingRef.current && !(e.nativeEvent as unknown as { isComposing?: boolean }).isComposing) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              placeholder="댓글을 입력하세요"
              maxLength={500}
              disabled={submitting}
              className="flex-1 min-w-0 rounded-full bg-stone-100 dark:bg-zinc-900 px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#F9954E]/40 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!draft.trim() || submitting}
              aria-label="댓글 등록"
              className="shrink-0 bg-[#F9954E] text-white text-sm font-semibold rounded-full px-4 py-2.5 active:opacity-85 disabled:opacity-40 transition"
            >
              {submitting ? "..." : "등록"}
            </button>
          </div>
        ) : (
          <p className="text-[12.5px] text-stone-400">
            <Link href="/login" className="underline font-semibold" style={{ color: POINT }}>로그인</Link> 후 댓글을 남길 수 있어요.
          </p>
        )}
        {draft.length > 0 && <p className="mt-1 text-[11px] text-stone-400 text-right" aria-hidden>{draft.length}/500</p>}
        {commentActionError && <p role="alert" className="mt-2 text-xs text-red-500">{commentActionError}</p>}

        {/* 목록 — 기존 정렬(오래된 순) 유지.
            04-9: 조회 실패 / 로딩 / 0건을 서로 다른 상태로 표시한다(실패를 '댓글 없음'으로 보이지 않게). */}
        <div className="mt-4">
          {commentsError ? (
            <div className="rounded-xl bg-stone-50 dark:bg-zinc-900 px-4 py-3">
              <p role="alert" className="text-[13px] text-red-500 break-words">{commentsError}</p>
              <button
                type="button"
                onClick={retryComments}
                disabled={commentsRetrying}
                aria-label="댓글 다시 불러오기"
                className="mt-2 rounded-full bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-stone-100 text-xs font-semibold px-4 py-2 active:opacity-85 disabled:opacity-50 transition"
              >
                {commentsRetrying ? "불러오는 중…" : "다시 시도"}
              </button>
              {commentsRetrying && (
                <p role="status" aria-live="polite" className="sr-only">댓글을 다시 불러오는 중입니다.</p>
              )}
            </div>
          ) : comments === null ? (
            <p role="status" aria-live="polite" className="text-[13px] text-stone-400 animate-pulse">댓글을 불러오는 중…</p>
          ) : comments.length === 0 ? (
            <p className="text-[13px] text-stone-400">아직 댓글이 없습니다.{me ? " 첫 댓글을 남겨보세요." : ""}</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => {
                const mineComment = !!me && c.uid === me;
                return (
                  <li key={c.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[12.5px] text-stone-900 dark:text-white truncate max-w-[160px]">{c.name}</span>
                        <span className="text-[11px] text-stone-400">{fmtDateTime(c.at)}</span>
                      </div>
                      <p className="mt-0.5 text-[13.5px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{c.text}</p>
                    </div>
                    {mineComment && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c)}
                        disabled={deletingCommentId === c.id}
                        aria-label="내 댓글 삭제"
                        className="shrink-0 text-[11px] text-stone-400 hover:text-red-500 active:opacity-85 disabled:opacity-50 px-2 py-1"
                      >
                        {deletingCommentId === c.id ? "..." : "삭제"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <div className="mt-4 text-center">
        <Link href="/feed" className="text-[12.5px] font-bold text-[#F9954E]">피드로 가기 →</Link>
      </div>
    </main>
  );
}
