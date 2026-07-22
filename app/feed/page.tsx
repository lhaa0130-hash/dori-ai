"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  listFeed,
  addPost,
  updatePost,
  softDeletePost,
  toggleLike,
  currentUid,
  myFollowingSet,
  watchGroups,
  feedVisibleAudience,
  audienceForGroups,
  listComments,
  addComment,
  deleteComment,
  validatePostInput,
  POST_MAX_LEN,
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
    cancel: "취소",
    composerLabel: "새 게시물 본문",
    addPhotoAria: "사진 또는 영상 첨부",
    posted: "게시되었어요.",
    postFailed: "게시하지 못했어요. 잠시 후 다시 시도해 주세요.",
    discardConfirm: "작성 중인 내용을 지울까요?",
    groupsPickHint: "공유할 범위를 하나 이상 선택하세요.",
    friendsHint: "피드 공개로 설정한 범위의 멤버에게만 보여요.",
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
    manageMenu: "게시물 관리 메뉴 열기",
    edit: "수정",
    editSave: "저장",
    editCancel: "취소",
    editSaved: "수정되었어요.",
    editFailed: "수정하지 못했어요. 잠시 후 다시 시도해 주세요.",
    editDiscardConfirm: "수정 중인 내용을 취소할까요?",
    keepMedia: "기존 첨부 유지",
    replaceMedia: "사진·영상 교체",
    removeMedia: "첨부 제거",
    deleteConfirm: "이 게시물을 삭제할까요?\n삭제하면 피드와 사용자 홈에서 보이지 않습니다.",
    deleted: "삭제되었어요.",
    openDetail: "게시물 자세히 보기",
    deleteFailed: "삭제하지 못했어요. 잠시 후 다시 시도해 주세요.",
    editGroupsKeepHint: "공개 범위를 그대로 두면 기존 공유 대상이 유지돼요. 바꾸려면 범위를 다시 선택하세요.",
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
    cancel: "Cancel",
    composerLabel: "New post body",
    addPhotoAria: "Attach a photo or video",
    posted: "Posted.",
    postFailed: "Couldn't post. Please try again in a moment.",
    discardConfirm: "Discard your draft?",
    groupsPickHint: "Pick at least one group to share with.",
    friendsHint: "Only members of your feed-visible groups can see this.",
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
    manageMenu: "Open post options",
    edit: "Edit",
    editSave: "Save",
    editCancel: "Cancel",
    editSaved: "Post updated.",
    editFailed: "Couldn't update. Please try again in a moment.",
    editDiscardConfirm: "Discard your changes?",
    keepMedia: "Keep current attachment",
    replaceMedia: "Replace photo/video",
    removeMedia: "Remove attachment",
    deleteConfirm: "Delete this post?\nIt will no longer appear in the feed or on user home.",
    deleted: "Deleted.",
    openDetail: "View post detail",
    deleteFailed: "Couldn't delete. Please try again in a moment.",
    editGroupsKeepHint: "Leaving the visibility unchanged keeps the current audience. Re-select groups to change it.",
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
  const [justPosted, setJustPosted] = useState(false); // 실제 저장 성공 후에만 true(가짜 성공 금지)
  const [postError, setPostError] = useState("");

  // 공개범위 상태
  const [visibility, setVisibility] = useState<FeedVisibility>("public");
  const [groups, setGroups] = useState<FriendGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // 04-4 본인 게시물 관리(⋯ 메뉴 / 인라인 수정 / 소프트삭제)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editVis, setEditVis] = useState<FeedVisibility>("public");
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);
  const [editMedia, setEditMedia] = useState<Media | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [manageMsg, setManageMsg] = useState(""); // 수정/삭제 성공 안내(실제 성공 후에만)
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  // 04-5: /post 상세의 '수정'이 ?edit=<postId> 로 들어오면 해당 글을 인라인 수정 모드로 연다.
  //  (수정 폼을 복사하지 않고 기존 /feed 편집 UI 재사용)
  const editReqRef = useRef<string | null>(null);
  useEffect(() => {
    try { editReqRef.current = new URLSearchParams(window.location.search).get("edit"); } catch { editReqRef.current = null; }
  }, []);
  useEffect(() => {
    const want = editReqRef.current;
    if (!want || editingId || !uid || posts.length === 0) return;
    const target = posts.find((p) => p.id === want && p.uid === uid);
    if (target) {
      editReqRef.current = null;
      startEdit(target);
      try { window.history.replaceState(null, "", "/feed"); } catch { /* */ }
    }
  }, [posts, uid, editingId]);

  // 04-4 관리 메뉴(⋯) — 외부 클릭·Escape 로 닫기
  useEffect(() => {
    if (!menuOpenId) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpenId(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menuOpenId]);

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

  // 범위(groups) 공개인데 아무 범위도 고르지 않은 상태 — 게시 차단 대상
  const groupsMissing = visibility === "groups" && selectedGroupIds.length === 0;
  // 작성 중인 내용이 있는지(취소/이탈 확인용)
  const hasDraft = !!text.trim() || !!media || selectedGroupIds.length > 0;

  const handlePost = async () => {
    if (posting || uploading) return;
    const body = text.trim();
    // 빈 본문/길이 정책은 기존 검증 함수 단일 기준 사용
    const v = validatePostInput(body, media ? [media.url] : []);
    if (!v.ok) { setPostError(v.error || t.postFailed); return; }
    if (groupsMissing) { setPostError(t.groupsPickHint); return; }
    setPosting(true);
    setPostError("");
    setJustPosted(false);

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
      // 실제 Firestore 저장 성공 후에만 초기화·성공 안내
      setText("");
      setMedia(null);
      setUploadError("");
      setVisibility("public");
      setSelectedGroupIds([]);
      setJustPosted(true);
      setTimeout(() => setJustPosted(false), 2500);
      await refresh();
    } else {
      // 실패 시 본문 유지 + 실제 오류 안내(가짜 성공 금지)
      setPostError(t.postFailed);
    }
  };

  // 취소: 작성 내용이 있으면 확인 후 폼 초기화(브라우저 종료 방지는 과도하므로 미구현)
  const handleCancel = () => {
    if (hasDraft && !window.confirm(t.discardConfirm)) return;
    setText("");
    setMedia(null);
    setUploadError("");
    setPostError("");
    setVisibility("public");
    setSelectedGroupIds([]);
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

  // 04-4 소프트삭제(하드삭제 아님) — 확인 후 status:deleted 로. 성공 시에만 카드 제거.
  const handleSoftDelete = async (postId: string) => {
    if (deletingId) return;
    setMenuOpenId(null);
    if (!window.confirm(t.deleteConfirm)) return;
    setDeletingId(postId);
    const res = await softDeletePost(postId);
    setDeletingId(null);
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setManageMsg(t.deleted);
      setTimeout(() => setManageMsg(""), 2500);
    } else {
      setManageMsg(res.error || t.deleteFailed);
      setTimeout(() => setManageMsg(""), 3000);
    }
  };

  // 인라인 수정 시작 — 카드 값으로 폼 프리필(그룹ID는 저장값에서 복원 불가 → 빈 선택으로 시작)
  const startEdit = (post: FeedPost) => {
    setMenuOpenId(null);
    setEditingId(post.id);
    setEditText(post.text || "");
    setEditVis(post.visibility);
    setEditGroupIds([]);
    setEditMedia(post.mediaUrl ? { url: post.mediaUrl, type: post.mediaType || "image" } : null);
    setEditError("");
  };

  const cancelEdit = (post: FeedPost) => {
    const changed = editText !== (post.text || "") || editVis !== post.visibility ||
      (editMedia?.url || null) !== (post.mediaUrl || null) || editGroupIds.length > 0;
    if (changed && !window.confirm(t.editDiscardConfirm)) return;
    setEditingId(null);
    setEditError("");
  };

  const onPickEditFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEditError("");
    setEditUploading(true);
    const res = await uploadFeedMedia(file);
    setEditUploading(false);
    if (res.ok) setEditMedia({ url: res.result.url, type: res.result.type });
    else setEditError(res.error);
  };

  const toggleEditGroup = (id: string) => {
    setEditGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const saveEdit = async (post: FeedPost) => {
    if (editSaving || editUploading) return;
    const v = validatePostInput(editText, editMedia ? [editMedia.url] : []);
    if (!v.ok) { setEditError(v.error || t.editFailed); return; }
    // 새로 groups 로 바꾸는데 범위 미선택이면 차단
    const switchingToGroups = editVis === "groups" && post.visibility !== "groups";
    if (switchingToGroups && editGroupIds.length === 0) { setEditError(t.groupsPickHint); return; }
    setEditSaving(true);
    setEditError("");

    // allowedUids: 공개범위 그대로면 유지(undefined). 바뀌면 재계산.
    let allowedUids: string[] | undefined;
    if (editVis === post.visibility) {
      if (editVis === "groups" && editGroupIds.length > 0) allowedUids = await audienceForGroups(editGroupIds);
      else allowedUids = undefined; // 유지
    } else if (editVis === "friends") {
      allowedUids = await feedVisibleAudience();
    } else if (editVis === "groups") {
      allowedUids = await audienceForGroups(editGroupIds);
    } else {
      allowedUids = []; // public
    }

    // 미디어: 그대로면 undefined(유지) / 제거면 null / 다른 URL이면 교체
    let mediaUrl: string | null | undefined;
    let mediaType: "image" | "video" | null | undefined;
    if (!editMedia && post.mediaUrl) { mediaUrl = null; mediaType = null; }
    else if (editMedia && editMedia.url !== post.mediaUrl) { mediaUrl = editMedia.url; mediaType = editMedia.type; }
    else { mediaUrl = undefined; mediaType = undefined; }

    const res = await updatePost(post.id, { text: editText, visibility: editVis, allowedUids, mediaUrl, mediaType });
    setEditSaving(false);
    if (res.ok) {
      // 실제 성공 후에만 카드에 반영 + 수정 종료
      setPosts((prev) => prev.map((p) => p.id === post.id ? {
        ...p, text: editText.trim(), visibility: editVis,
        mediaUrl: mediaUrl === null ? undefined : (typeof mediaUrl === "string" ? mediaUrl : p.mediaUrl),
        mediaType: mediaUrl === null ? undefined : (typeof mediaUrl === "string" ? (mediaType as "image" | "video") : p.mediaType),
      } : p));
      setEditingId(null);
      setManageMsg(t.editSaved);
      setTimeout(() => setManageMsg(""), 2500);
      refresh();
    } else {
      setEditError(res.error || t.editFailed); // 실패 시 입력 유지
    }
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

  const canPost = validatePostInput(text, media ? [media.url] : []).ok && !groupsMissing && !posting && !uploading;

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
              onChange={(e) => { setText(e.target.value); if (postError) setPostError(""); }}
              placeholder={t.composerPlaceholder}
              aria-label={t.composerLabel}
              rows={3}
              maxLength={POST_MAX_LEN}
              className="w-full resize-none bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-600 outline-none"
            />

            {/* 미디어 미리보기 */}
            {uploading && (
              <div role="status" aria-live="polite" className="mt-2 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                <span className="inline-block h-4 w-4 rounded-full border-2 border-stone-300 border-t-[#F9954E] animate-spin" />
                {t.uploading}
              </div>
            )}
            {uploadError && (
              <p role="alert" className="mt-2 text-xs text-red-500">{uploadError}</p>
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
                    aria-pressed={active}
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

            {/* 친구 공개 안내 — friends=피드공개 범위 멤버 대상(친구 서브컬렉션 아님) */}
            {visibility === "friends" && (
              <p className="mt-2 text-[11px] text-stone-400">{t.friendsHint}</p>
            )}

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
                    {selectedGroupIds.length === 0 && (
                      <p className="text-[11px] text-amber-500">{t.groupsPickHint}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 게시 실패/성공 안내 — 실제 결과에만 표시(가짜 성공 금지) */}
            {postError && (
              <p role="alert" className="mt-3 text-xs text-red-500">{postError}</p>
            )}
            {justPosted && (
              <p role="status" aria-live="polite" className="mt-3 text-xs font-semibold" style={{ color: POINT }}>✓ {t.posted}</p>
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
                    aria-label={t.addPhotoAria}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-stone-400" aria-hidden>{text.length}/{POST_MAX_LEN}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasDraft && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={posting}
                    className="text-sm font-semibold rounded-full px-4 py-2 bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 active:opacity-85 disabled:opacity-40 transition"
                  >
                    {t.cancel}
                  </button>
                )}
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
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5 mb-6 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
              {t.loginRequired}
            </p>
            <Link
              href={(pathname || "").startsWith("/en") ? "/en/login" : "/login"}
              className="inline-block bg-[#F9954E] text-white text-sm font-semibold rounded-full px-5 py-2 active:opacity-85"
            >
              {t.loginCta}
            </Link>
          </div>
        )}

        {/* 수정/삭제 결과 안내(실제 성공/실패 후에만) */}
        {manageMsg && (
          <p role="status" aria-live="polite" className="mb-3 text-center text-[13px] font-semibold" style={{ color: POINT }}>{manageMsg}</p>
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
                      {/* 04-5: 작성시간을 상세 링크로(카드 전체를 감싸지 않아 버튼과 충돌 없음) */}
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        <Link href={`/post/${post.id}`} aria-label={t.openDetail} className="hover:underline hover:text-[#F9954E]">
                          {post.at ? new Date(post.at).toLocaleString(t.dateLocale) : t.openDetail}
                        </Link>
                      </p>
                    </div>
                    {mine && post.status !== "deleted" && editingId !== post.id && (
                      <div className="relative flex-shrink-0" ref={menuOpenId === post.id ? menuRef : undefined}>
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(menuOpenId === post.id ? null : post.id)}
                          aria-haspopup="menu"
                          aria-expanded={menuOpenId === post.id}
                          aria-label={t.manageMenu}
                          className="w-9 h-9 -mr-1.5 -mt-1 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-zinc-900 active:opacity-85"
                        >
                          <span aria-hidden className="text-lg leading-none">⋯</span>
                        </button>
                        {menuOpenId === post.id && (
                          <div role="menu" className="absolute right-0 top-9 z-20 w-28 rounded-xl border border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg py-1">
                            <button role="menuitem" type="button" onClick={() => startEdit(post)} className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-zinc-900">{t.edit}</button>
                            <button role="menuitem" type="button" onClick={() => handleSoftDelete(post.id)} disabled={deletingId === post.id} className="w-full text-left px-3.5 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50">{deletingId === post.id ? "..." : t.delete}</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {editingId === post.id ? (
                    /* 04-4 인라인 수정 — 작성 컴포저를 복사하지 않고 카드 내부에서 최소 편집 */
                    <div className="mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => { setEditText(e.target.value); if (editError) setEditError(""); }}
                        aria-label={t.composerLabel}
                        rows={3}
                        maxLength={POST_MAX_LEN}
                        className="w-full resize-none rounded-xl bg-stone-100 dark:bg-zinc-900 px-3 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#F9954E]/40"
                      />
                      {editUploading && (
                        <div role="status" aria-live="polite" className="mt-2 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-stone-300 border-t-[#F9954E] animate-spin" />{t.uploading}
                        </div>
                      )}
                      {editMedia && !editUploading && (
                        <div className="mt-2 relative">
                          {editMedia.type === "video" ? (
                            <video src={editMedia.url} controls className="rounded-xl w-full max-h-72" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={editMedia.url} alt={t.mediaPreviewAlt} className="rounded-xl w-full max-h-72 object-cover" />
                          )}
                          <button type="button" onClick={() => setEditMedia(null)} className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded-full px-2.5 py-1 active:opacity-85">{t.removeMedia}</button>
                        </div>
                      )}
                      {/* 공개범위 칩 */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {(["public", "friends", "groups"] as FeedVisibility[]).map((v) => (
                          <button key={v} type="button" onClick={() => setEditVis(v)} aria-pressed={editVis === v}
                            className={"text-xs font-semibold rounded-full px-3 py-1.5 active:opacity-85 transition " + (editVis === v ? "bg-[#F9954E] text-white" : "bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300")}>
                            {v === "public" ? t.visPublicOption : v === "friends" ? t.visFriendsOption : t.visGroupsOption}
                          </button>
                        ))}
                      </div>
                      {editVis === "friends" && <p className="mt-2 text-[11px] text-stone-400">{t.friendsHint}</p>}
                      {editVis === "groups" && (
                        <div className="mt-2 rounded-xl bg-stone-100 dark:bg-zinc-900 p-3">
                          {groups.length === 0 ? (
                            <p className="text-xs text-stone-500 dark:text-stone-400">{t.noGroupsPrefix}{" "}<Link href="/messages" className="underline" style={{ color: POINT }}>{t.messagesGroupsLink}</Link>{t.noGroupsSuffix}</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {groups.map((g) => (
                                <label key={g.id} className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                                  <input type="checkbox" checked={editGroupIds.includes(g.id)} onChange={() => toggleEditGroup(g.id)} className="h-4 w-4 accent-[#F9954E]" />
                                  <span className="truncate">{g.name}</span>
                                  <span className="text-[11px] text-stone-400">{t.memberCount(g.memberUids.length)}</span>
                                </label>
                              ))}
                              {post.visibility === "groups" && editGroupIds.length === 0 && (
                                <p className="text-[11px] text-stone-400">{t.editGroupsKeepHint}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {editError && <p role="alert" className="mt-2 text-xs text-red-500">{editError}</p>}
                      <div className="mt-3 flex items-center justify-between">
                        <label className="cursor-pointer text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-[#F9954E] active:opacity-85 transition inline-flex items-center gap-1.5">
                          <span aria-hidden>📷</span><span>{editMedia ? t.replaceMedia : t.photoVideo}</span>
                          <input type="file" accept="image/*,video/*" onChange={onPickEditFile} disabled={editUploading} aria-label={t.replaceMedia} className="hidden" />
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-400" aria-hidden>{editText.length}/{POST_MAX_LEN}</span>
                          <button type="button" onClick={() => cancelEdit(post)} disabled={editSaving} className="text-sm font-semibold rounded-full px-4 py-2 bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300 active:opacity-85 disabled:opacity-40 transition">{t.editCancel}</button>
                          <button type="button" onClick={() => saveEdit(post)}
                            disabled={editSaving || editUploading || !validatePostInput(editText, editMedia ? [editMedia.url] : []).ok || (editVis === "groups" && post.visibility !== "groups" && editGroupIds.length === 0)}
                            className="bg-[#F9954E] text-white text-sm font-semibold rounded-full px-5 py-2 active:opacity-85 disabled:opacity-40 transition">{editSaving ? t.posting : t.editSave}</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <>
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
                                  // 04-8: 한글 IME 조합 중 Enter 는 제출하지 않는다(미완성 한글·중복 등록 방지).
                                  //  상세 페이지(/post)와 동일한 가드.
                                  if (
                                    e.key === "Enter" && !e.shiftKey &&
                                    !(e.nativeEvent as unknown as { isComposing?: boolean }).isComposing
                                  ) {
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
                              <Link href={(pathname || "").startsWith("/en") ? "/en/login" : "/login"} className="underline" style={{ color: POINT }}>
                                {t.loginLinkText}
                              </Link>{" "}
                              {t.loginCommentSuffix}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  </>
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
