"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  listFeed,
  addPost,
  deletePost,
  toggleLike,
  currentUid,
  myFollowingSet,
  watchGroups,
  feedVisibleAudience,
  audienceForGroups,
  listComments,
  addComment,
  deleteComment,
  type FeedPost,
  type FeedVisibility,
  type FriendGroup,
  type Comment,
} from "@/lib/social";
import { uploadFeedMedia } from "@/lib/storage";
import { MARKET_PRODUCTS, SOURCE_META, CATEGORY_EMOJI, buildMarketUrl } from "@/constants/marketData";

const POINT = "#F9954E";

const T = {
  ko: {
    sponsor: "스폰서",
    viewMore: "보기 →",
    visPublic: "전체",
    visFriends: "친구",
    visGroups: "범위",
    title: "피드",
    subtitle: "사진·영상과 함께 소식을 남기고 공개 범위를 골라보세요.",
    tabRecommend: "추천",
    tabFollowing: "팔로잉",
    composerPlaceholder: "무슨 생각을 하고 있나요?",
    uploading: "업로드 중...",
    mediaPreviewAlt: "첨부 미리보기",
    remove: "제거",
    visPublicOption: "전체공개",
    visFriendsOption: "친구공개",
    visGroupsOption: "범위선택",
    noGroupsPrefix: "만든 범위가 없어요.",
    messagesGroupsLink: "메시지 > 범위",
    noGroupsSuffix: "에서 범위를 추가해 보세요.",
    memberCount: (n: number) => `(${n}명)`,
    photoVideo: "사진·영상",
    posting: "올리는 중...",
    post: "올리기",
    loginRequired: "글을 남기려면 로그인이 필요해요.",
    loginCta: "로그인하기",
    emptyFollowingLoggedIn: "아직 팔로우한 사람의 글이 없어요.",
    emptyFollowingLoggedOut: "팔로우한 사람들의 글이 여기에 모여요.",
    browseRecommend: "추천에서 둘러보기",
    emptyFirstPost: "첫 글을 남겨보세요.",
    delete: "삭제",
    feedImageAlt: (name: string) => `${name}님의 피드 이미지`,
    commentsLabel: (n: number) => `댓글 ${n}`,
    loadingComments: "댓글 불러오는 중...",
    noComments: "아직 댓글이 없어요.",
    commentPlaceholder: "댓글을 입력하세요",
    commentSubmit: "등록",
    loginLinkText: "로그인",
    loginCommentSuffix: "후 댓글을 남길 수 있어요.",
    dateLocale: "ko-KR",
  },
  en: {
    sponsor: "Sponsored",
    viewMore: "View →",
    visPublic: "Public",
    visFriends: "Friends",
    visGroups: "Custom",
    title: "Feed",
    subtitle: "Share photos and videos, and choose who gets to see them.",
    tabRecommend: "For You",
    tabFollowing: "Following",
    composerPlaceholder: "What's on your mind?",
    uploading: "Uploading...",
    mediaPreviewAlt: "Attachment preview",
    remove: "Remove",
    visPublicOption: "Public",
    visFriendsOption: "Friends only",
    visGroupsOption: "Custom",
    noGroupsPrefix: "You haven't created a custom group yet. Add one in",
    messagesGroupsLink: "Messages > Groups",
    noGroupsSuffix: ".",
    memberCount: (n: number) => `(${n} members)`,
    photoVideo: "Photo/Video",
    posting: "Posting...",
    post: "Post",
    loginRequired: "Log in to write a post.",
    loginCta: "Log in",
    emptyFollowingLoggedIn: "No posts yet from people you follow.",
    emptyFollowingLoggedOut: "Posts from people you follow will show up here.",
    browseRecommend: "Browse For You",
    emptyFirstPost: "Be the first to post.",
    delete: "Delete",
    feedImageAlt: (name: string) => `${name}'s feed image`,
    commentsLabel: (n: number) => `${n} comments`,
    loadingComments: "Loading comments...",
    noComments: "No comments yet.",
    commentPlaceholder: "Write a comment...",
    commentSubmit: "Post",
    loginLinkText: "Log in",
    loginCommentSuffix: "to leave a comment.",
    dateLocale: "en-US",
  },
} as const;

type Dict = (typeof T)[keyof typeof T];

// 피드 광고용 상품 풀 (hot 우선, 최대 6개 순환)
const AD_PRODUCTS = [...MARKET_PRODUCTS.filter(p => p.hot), ...MARKET_PRODUCTS.filter(p => !p.hot)].slice(0, 6);

function FeedAdCard({ index, t }: { index: number; t: Dict }) {
  const p = AD_PRODUCTS[index % AD_PRODUCTS.length];
  if (!p) return null;
  const src = SOURCE_META[p.source];
  return (
    <li className="rounded-2xl border border-[#F9954E]/20 bg-[#FFF8EE] dark:bg-[#1a0d00] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 tracking-wide">{t.sponsor}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${src.cls}`}>{src.label}</span>
      </div>
      <a href={buildMarketUrl(p)} target="_blank" rel="sponsored noopener noreferrer" className="flex items-center gap-3 group">
        <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-[#F9954E]/20 flex items-center justify-center text-[26px] flex-shrink-0">
          {p.emoji || CATEGORY_EMOJI[p.category] || "🛍️"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-extrabold text-stone-900 dark:text-white truncate group-hover:text-[#F9954E] transition-colors">{p.name}</p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">{p.summary}</p>
        </div>
        <span className="text-[12px] font-bold text-[#F9954E] flex-shrink-0">{t.viewMore}</span>
      </a>
    </li>
  );
}

type Media = { url: string; type: "image" | "video" };

export default function FeedPage() {
  const pathname = usePathname();
  const t = T[(pathname || "").startsWith("/en") ? "en" : "ko"];
  const { session } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  // 탭: 추천(전체 공개) / 팔로잉(내가 팔로우한 사람)
  const [tab, setTab] = useState<"recommend" | "following">("recommend");
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());

  // 댓글 상태 — 글별 독립(열림여부/목록/로딩/입력)
  type CommentState = {
    open: boolean;
    items: Comment[];
    loaded: boolean;
    loading: boolean;
    draft: string;
    submitting: boolean;
  };
  const [commentMap, setCommentMap] = useState<Record<string, CommentState>>({});

  const getCState = (postId: string): CommentState =>
    commentMap[postId] || { open: false, items: [], loaded: false, loading: false, draft: "", submitting: false };

  const patchCState = useCallback((postId: string, patch: Partial<CommentState>) => {
    setCommentMap((prev) => {
      const cur = prev[postId] || { open: false, items: [], loaded: false, loading: false, draft: "", submitting: false };
      return { ...prev, [postId]: { ...cur, ...patch } };
    });
  }, []);

  // 글쓰기 상태
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [media, setMedia] = useState<Media | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // 공개범위 상태
  const [visibility, setVisibility] = useState<FeedVisibility>("public");
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // ⚠️ 로케일에 따라 바꾸지 않는다. 이 값은 addPost/addComment로 Firestore에 작성자 이름으로
  //    저장돼 다른(한글) 사용자에게도 그대로 보인다. 메시지 페이지의 "나"/"상대" 폴백과 같은 기준.
  const myName = session?.user?.name || session?.user?.email?.split("@")[0] || "나";
  const isLoggedIn = !!session?.user;
  const VIS_LABEL: Record<FeedVisibility, string> = {
    public: t.visPublic,
    friends: t.visFriends,
    groups: t.visGroups,
  };

  const refresh = useCallback(async () => {
    const list = await listFeed(60);
    setPosts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    setUid(currentUid());
    refresh();
  }, [refresh, session]);

  // 그룹(범위) 실시간 구독 — 로그인 시
  useEffect(() => {
    if (!isLoggedIn) {
      setGroups([]);
      return;
    }
    const unsub = watchGroups(setGroups);
    return () => unsub();
  }, [isLoggedIn]);

  // 내가 팔로우한 사람 목록(팔로잉 탭 필터용) — 로그인 시
  useEffect(() => {
    if (!isLoggedIn) { setFollowingSet(new Set()); return; }
    let alive = true;
    myFollowingSet().then((s) => { if (alive) setFollowingSet(s); });
    return () => { alive = false; };
  }, [isLoggedIn, session]);

  // 화면에 보일 글 — 추천=전체, 팔로잉=내가 팔로우한 사람(+내 글)
  const shownPosts =
    tab === "following"
      ? posts.filter((p) => followingSet.has(p.uid) || (!!uid && p.uid === uid))
      : posts;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file) return;
    setUploadError("");
    setUploading(true);
    const res = await uploadFeedMedia(file);
    setUploading(false);
    if (res.ok) {
      setMedia({ url: res.result.url, type: res.result.type });
    } else {
      setUploadError(res.error);
    }
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handlePost = async () => {
    const body = text.trim();
    if ((!body && !media) || posting) return;
    setPosting(true);

    let allowedUids: string[] | undefined;
    if (visibility === "friends") {
      allowedUids = await feedVisibleAudience();
    } else if (visibility === "groups") {
      allowedUids = await audienceForGroups(selectedGroupIds);
    }

    const ok = await addPost(myName, body, {
      mediaUrl: media?.url,
      mediaType: media?.type,
      visibility,
      allowedUids,
    });
    setPosting(false);
    if (ok) {
      setText("");
      setMedia(null);
      setUploadError("");
      setVisibility("public");
      setSelectedGroupIds([]);
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

  // 댓글 영역 토글 — 처음 펼칠 때 목록 로드
  const toggleComments = async (post: FeedPost) => {
    const cur = getCState(post.id);
    const nextOpen = !cur.open;
    patchCState(post.id, { open: nextOpen });
    if (nextOpen && !cur.loaded && !cur.loading) {
      patchCState(post.id, { loading: true });
      const items = await listComments(post.id);
      patchCState(post.id, { items, loaded: true, loading: false });
    }
  };

  const handleAddComment = async (post: FeedPost) => {
    const cur = getCState(post.id);
    const body = cur.draft.trim();
    if (!body || cur.submitting) return;
    patchCState(post.id, { submitting: true });
    const ok = await addComment(post.id, post.uid, myName, body);
    if (ok) {
      const items = await listComments(post.id);
      patchCState(post.id, { items, loaded: true, draft: "", submitting: false });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p))
      );
    } else {
      patchCState(post.id, { submitting: false });
    }
  };

  const handleDeleteComment = async (post: FeedPost, commentId: string) => {
    const ok = await deleteComment(post.id, commentId);
    if (ok) {
      setCommentMap((prev) => {
        const cur = prev[post.id];
        if (!cur) return prev;
        return { ...prev, [post.id]: { ...cur, items: cur.items.filter((c) => c.id !== commentId) } };
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p))
      );
    }
  };

  const canPost = (!!text.trim() || !!media) && !posting && !uploading;

  return (
    <main className="w-full min-h-screen">
      <div className="w-full py-6 sm:py-8">
        {/* 헤더 */}
        <div className="mb-5">
          <p className="text-[11px] font-bold tracking-wide" style={{ color: POINT }}>
            FEED
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {t.subtitle}
          </p>
        </div>

        {/* 추천 / 팔로잉 탭 */}
        <div className="mb-5 flex gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-zinc-900">
          {([["recommend", t.tabRecommend], ["following", t.tabFollowing]] as ["recommend" | "following", string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={
                "flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors " +
                (tab === id
                  ? "bg-white dark:bg-zinc-800 text-[#F9954E] shadow-sm"
                  : "text-stone-500 dark:text-stone-400 active:opacity-70")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* 글쓰기 박스 / 로그인 유도 */}
        {isLoggedIn ? (
          <div className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4 mb-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.composerPlaceholder}
              rows={3}
              maxLength={1000}
              className="w-full resize-none bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 outline-none"
            />

            {/* 미디어 미리보기 */}
            {uploading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-stone-300 border-t-[#F9954E] animate-spin" />
                {t.uploading}
              </div>
            )}
            {uploadError && (
              <p className="mt-2 text-xs text-red-500">{uploadError}</p>
            )}
            {media && !uploading && (
              <div className="mt-3 relative">
                {media.type === "video" ? (
                  <video src={media.url} controls className="rounded-xl w-full max-h-80" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.url} alt={t.mediaPreviewAlt} className="rounded-xl w-full max-h-80 object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setMedia(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2.5 py-1 active:opacity-85"
                >
                  {t.remove}
                </button>
              </div>
            )}

            {/* 공개범위 선택 칩 */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(["public", "friends", "groups"] as FeedVisibility[]).map((v) => {
                const active = visibility === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVisibility(v)}
                    className={
                      "text-xs font-semibold rounded-full px-3 py-1.5 active:opacity-85 transition " +
                      (active
                        ? "bg-[#F9954E] text-white"
                        : "bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300")
                    }
                  >
                    {v === "public" ? t.visPublicOption : v === "friends" ? t.visFriendsOption : t.visGroupsOption}
                  </button>
                );
              })}
            </div>

            {/* 범위(그룹) 체크박스 */}
            {visibility === "groups" && (
              <div className="mt-3 rounded-xl bg-stone-100 dark:bg-zinc-900 p-3">
                {groups.length === 0 ? (
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {t.noGroupsPrefix}{" "}
                    <Link href="/messages" className="underline" style={{ color: POINT }}>
                      {t.messagesGroupsLink}
                    </Link>
                    {t.noGroupsSuffix}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {groups.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(g.id)}
                          onChange={() => toggleGroup(g.id)}
                          className="h-4 w-4 accent-[#F9954E]"
                        />
                        <span className="truncate">{g.name}</span>
                        <span className="text-[11px] text-stone-400">{t.memberCount(g.memberUids.length)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 하단 액션 */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-[#F9954E] active:opacity-85 transition inline-flex items-center gap-1.5">
                  <span aria-hidden>📷</span>
                  <span>{t.photoVideo}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={onPickFile}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-stone-400">{text.length}/1000</span>
              </div>
              <button
                type="button"
                onClick={handlePost}
                disabled={!canPost}
                className="bg-[#F9954E] text-white text-sm font-semibold rounded-full px-5 py-2 active:opacity-85 disabled:opacity-40 transition"
              >
                {posting ? t.posting : t.post}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5 mb-6 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
              {t.loginRequired}
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#F9954E] text-white text-sm font-semibold rounded-full px-5 py-2 active:opacity-85"
            >
              {t.loginCta}
            </Link>
          </div>
        )}

        {/* 목록 */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4 animate-pulse h-24"
              />
            ))}
          </div>
        ) : shownPosts.length === 0 ? (
          <div className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-10 text-center">
            {tab === "following" ? (
              <>
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
                  {isLoggedIn ? t.emptyFollowingLoggedIn : t.emptyFollowingLoggedOut}
                </p>
                <button
                  type="button"
                  onClick={() => setTab("recommend")}
                  className="inline-block bg-[#F9954E] text-white text-sm font-semibold rounded-full px-5 py-2 active:opacity-85"
                >
                  {t.browseRecommend}
                </button>
              </>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400">{t.emptyFirstPost}</p>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {shownPosts.map((post, idx) => {
              const mine = !!uid && post.uid === uid;
              return (
                <>
                  {idx > 0 && idx % 5 === 0 && AD_PRODUCTS.length > 0 && (
                    <FeedAdCard key={`ad-${idx}`} index={Math.floor(idx / 5) - 1} t={t} />
                  )}
                <li
                  key={post.id}
                  className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile?uid=${post.uid}`}
                          className="font-bold text-sm text-stone-900 dark:text-white hover:underline truncate inline-block max-w-[160px] align-bottom"
                        >
                          {post.name}
                        </Link>
                        <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-stone-100 dark:bg-zinc-900 text-stone-500 dark:text-stone-400">
                          {VIS_LABEL[post.visibility] || t.visPublic}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {post.at ? new Date(post.at).toLocaleString(t.dateLocale) : ""}
                      </p>
                    </div>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        className="text-[11px] text-stone-400 hover:text-red-500 active:opacity-85 flex-shrink-0"
                      >
                        {t.delete}
                      </button>
                    )}
                  </div>

                  {post.text && (
                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line break-words">
                      {post.text}
                    </p>
                  )}

                  {post.mediaUrl && (
                    <div className="mt-3">
                      {post.mediaType === "video" ? (
                        <video src={post.mediaUrl} controls className="rounded-xl w-full" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={post.mediaUrl} alt={t.feedImageAlt(post.name)} className="rounded-xl w-full" />
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLike(post)}
                      className="inline-flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 bg-stone-100 dark:bg-zinc-900 active:opacity-85 transition"
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

                    <button
                      type="button"
                      onClick={() => toggleComments(post)}
                      className="inline-flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 bg-stone-100 dark:bg-zinc-900 active:opacity-85 transition text-stone-600 dark:text-stone-300"
                      aria-expanded={getCState(post.id).open}
                    >
                      <span aria-hidden>💬</span>
                      <span className="font-semibold">{t.commentsLabel(post.commentCount)}</span>
                    </button>
                  </div>

                  {/* 댓글 영역 — 글별 독립 토글 */}
                  {getCState(post.id).open && (
                    <div className="mt-3 border-t border-stone-100 dark:border-zinc-900 pt-3">
                      {getCState(post.id).loading ? (
                        <p className="text-xs text-stone-400">{t.loadingComments}</p>
                      ) : (
                        <>
                          {getCState(post.id).items.length === 0 ? (
                            <p className="text-xs text-stone-400">{t.noComments}</p>
                          ) : (
                            <ul className="space-y-3">
                              {getCState(post.id).items.map((c) => {
                                const myComment = !!uid && c.uid === uid;
                                return (
                                  <li key={c.id} className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <Link
                                          href={`/profile?uid=${c.uid}`}
                                          className="font-bold text-xs text-stone-900 dark:text-white hover:underline truncate inline-block max-w-[140px] align-bottom"
                                        >
                                          {c.name}
                                        </Link>
                                        <span className="text-[10px] text-stone-400">
                                          {c.at ? new Date(c.at).toLocaleString(t.dateLocale) : ""}
                                        </span>
                                      </div>
                                      <p className="mt-0.5 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line break-words">
                                        {c.text}
                                      </p>
                                    </div>
                                    {myComment && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(post, c.id)}
                                        className="text-[11px] text-stone-400 hover:text-red-500 active:opacity-85 flex-shrink-0"
                                      >
                                        {t.delete}
                                      </button>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}

                          {/* 댓글 입력 / 로그인 유도 */}
                          {isLoggedIn ? (
                            <div className="mt-3 flex items-center gap-2">
                              <input
                                type="text"
                                value={getCState(post.id).draft}
                                onChange={(e) => patchCState(post.id, { draft: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post);
                                  }
                                }}
                                placeholder={t.commentPlaceholder}
                                maxLength={500}
                                className="flex-1 min-w-0 rounded-full bg-stone-100 dark:bg-zinc-900 px-4 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddComment(post)}
                                disabled={!getCState(post.id).draft.trim() || getCState(post.id).submitting}
                                className="bg-[#F9954E] text-white text-sm font-semibold rounded-full px-4 py-2 active:opacity-85 disabled:opacity-40 transition flex-shrink-0"
                              >
                                {getCState(post.id).submitting ? "..." : t.commentSubmit}
                              </button>
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-stone-400">
                              <Link href="/login" className="underline" style={{ color: POINT }}>
                                {t.loginLinkText}
                              </Link>{" "}
                              {t.loginCommentSuffix}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
                </>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
