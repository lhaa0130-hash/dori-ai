"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  currentUid,
  sendFriendRequest,
  isFriend,
  getProfile,
  saveMyProfile,
  listGuestbook,
  addGuestbookEntry,
  deleteGuestbookEntry,
  listUserFeed,
  getUserRecords,
  bumpVisit,
  getVisitStats,
  followUser,
  unfollowUser,
  isFollowing,
  getSocialCounts,
  listFollowers,
  listFollowing,
  addDiaryEntry,
  deleteDiaryEntry,
  addMyAI,
  updateMyAI,
  deleteMyAI,
  setMyHandle,
  checkHandle,
  type Profile,
  type AIInput,
  type BgStyle,
  type GuestEntry,
  type FeedPost,
  type GameRecord,
} from "@/lib/social";
import { uploadAvatar } from "@/lib/storage";
import { TIER_INFO, type UserTier } from "@/lib/userProfile";
import { getOwnedShopItems } from "@/lib/cottonCandy";
import {
  bgGradOf,
  frameRingOf,
  nameClassOf,
  petEmojiOf,
  itemsBySlot,
  itemKey,
  FREE_STICKERS,
  type ShopItem,
} from "@/lib/shopItems";
import BannerFx from "@/components/cozy/BannerFx";
import MyDashboard from "@/components/my/MyDashboard";

// 배경/테두리/이름효과/배너효과/스티커는 lib/shopItems.ts 카탈로그에서 가져온다.
// (무료 기본 + 상점에서 구매한 프리미엄 아이템)

// 대표색 팔레트
const COLOR_PRESETS = ["#F9954E", "#22c55e", "#3b82f6", "#a855f7", "#ef4444", "#14b8a6", "#ec4899", "#eab308", "#6366f1", "#f97316"];

// 무드 이모지 / 무료 스티커 / 관심사 후보
const MOODS = ["😎", "🥰", "😴", "🔥", "🎮", "✨", "😌", "🤔", "💪", "🍀", "🌙", "☕"];
const STICKER_CHOICES = FREE_STICKERS; // 무료 기본 스티커(lib/shopItems 단일 출처)
const INTEREST_SUGGESTIONS = ["AI", "코딩", "게임", "음악", "영화", "그림", "글쓰기", "사진", "독서", "운동", "요리", "여행", "주식", "디자인", "반려동물"];

function fmtDate(at: number): string {
  if (!at) return "";
  try {
    return new Date(at).toLocaleDateString("ko-KR");
  } catch {
    return "";
  }
}

// 꾸미기 패널의 아이템 타일 — 보유 시 선택 가능, 미보유 시 자물쇠+가격으로 상점 연결
function PickTile({
  owned, selected, price, label, onSelect, children,
}: {
  owned: boolean; selected: boolean; price: number; label: string; onSelect: () => void; children: ReactNode;
}) {
  const cls = `relative h-16 rounded-xl border overflow-hidden flex flex-col text-left transition-all ${
    selected ? "border-[#F9954E] ring-1 ring-[#F9954E]/50" : "border-neutral-100 dark:border-zinc-900"
  } ${!owned ? "opacity-80 hover:opacity-100" : ""}`;
  const inner = (
    <>
      <div className="relative flex-1 min-h-0">{children}</div>
      <span className="relative z-10 block text-[10px] font-bold text-center py-0.5 bg-white/75 dark:bg-black/45 text-neutral-700 dark:text-neutral-200 truncate px-1">
        {label}
      </span>
      {!owned && (
        <span className="absolute top-1 right-1 z-20 inline-flex items-center gap-0.5 rounded-full bg-black/55 text-white text-[9px] font-bold px-1.5 py-0.5">
          🔒 {price}
        </span>
      )}
      {selected && owned && (
        <span className="absolute top-1 right-1 z-20 w-4 h-4 rounded-full bg-[#F9954E] text-white text-[10px] font-bold flex items-center justify-center">✓</span>
      )}
    </>
  );
  return owned ? (
    <button type="button" onClick={onSelect} className={cls}>{inner}</button>
  ) : (
    <Link href="/shop" className={cls} title="상점에서 구매">{inner}</Link>
  );
}

export default function ProfilePage() {
  const { session, status } = useAuth();
  const myName = session?.user?.name || "사용자";

  const [mounted, setMounted] = useState(false);
  const [myUid, setMyUid] = useState<string | null>(null);
  const [targetUid, setTargetUid] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [guestbook, setGuestbook] = useState<GuestEntry[]>([]);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 꾸미기(편집) 상태
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editColor, setEditColor] = useState("#F9954E");
  const [editBg, setEditBg] = useState<BgStyle>("aurora");
  const [editMood, setEditMood] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editFrame, setEditFrame] = useState("none");
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editStickers, setEditStickers] = useState<string[]>([]);
  const [editNameEffect, setEditNameEffect] = useState("none");
  const [editBannerEffect, setEditBannerEffect] = useState("none");
  const [editPet, setEditPet] = useState("");
  const [editGreeting, setEditGreeting] = useState("");
  const [interestInput, setInterestInput] = useState("");

  // 다이어리(일기장)
  const [diaryInput, setDiaryInput] = useState("");
  const [diaryMood, setDiaryMood] = useState("");
  const [diaryBusy, setDiaryBusy] = useState(false);

  // 내가 만든 AI 자랑 (호스팅 페이지)
  const EMPTY_AI = { name: "", desc: "", body: "", howto: "", tool: "", category: "", tags: "", url: "", images: "", emoji: "🤖" };
  const [aiFormOpen, setAiFormOpen] = useState(false);
  const [aiForm, setAiForm] = useState({ ...EMPTY_AI });
  const [aiEditId, setAiEditId] = useState<string | null>(null); // null=신규, id=수정
  const [aiBusy, setAiBusy] = useState(false);
  const [aiCopied, setAiCopied] = useState<string | null>(null); // 공유 복사된 ai.id

  // 핸들(공유 주소)
  const [handleInput, setHandleInput] = useState("");
  const [handleMsg, setHandleMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [handleBusy, setHandleBusy] = useState(false);

  const toggleInterest = (tag: string) => {
    const t = tag.trim().replace(/^#/, "").slice(0, 12);
    if (!t) return;
    setEditInterests((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= 8 ? prev : [...prev, t]
    );
  };
  const toggleSticker = (s: string) => {
    setEditStickers((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length >= 6 ? prev : [...prev, s]
    );
  };
  const [saving, setSaving] = useState(false);

  // 방명록 입력
  const [gbMsg, setGbMsg] = useState("");
  const [gbSending, setGbSending] = useState(false);

  // 친구 상태: "loading" | "none" | "friend" | "requested"
  const [friendState, setFriendState] = useState<"loading" | "none" | "friend" | "requested">("none");

  // 팔로우 상태 + 소셜 카운트
  const [followState, setFollowState] = useState<"loading" | "following" | "none">("none");
  const [counts, setCounts] = useState<{ followers: number; following: number; posts: number }>({ followers: 0, following: 0, posts: 0 });
  const [followBusy, setFollowBusy] = useState(false);
  const [followModal, setFollowModal] = useState<null | { title: string; users: { uid: string; name: string }[] }>(null);
  const [homeTab, setHomeTab] = useState<"home" | "account">("home");

  // 방문자 카운터(투데이/투탈)
  const [visit, setVisit] = useState<{ total: number; today: number } | null>(null);

  // 프로필 사진 업로드
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // 코지홈 공유(초대) — 링크 복사
  const [shared, setShared] = useState(false);

  // URL ?uid= 로 대상 결정(없으면 내 uid) — 정적 export 안전하게 window에서 직접 읽음
  useEffect(() => {
    setMounted(true);
    const mine = currentUid();
    setMyUid(mine);
    let fromUrl: string | null = null;
    try {
      fromUrl = new URLSearchParams(window.location.search).get("uid");
    } catch {
      fromUrl = null;
    }
    setTargetUid(fromUrl && fromUrl.trim() ? fromUrl.trim() : mine);
  }, [status]);

  const isOwner = !!myUid && !!targetUid && myUid === targetUid;

  const loadAll = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [p, recs, gb, uf, c] = await Promise.all([
        getProfile(uid),
        getUserRecords(uid),
        listGuestbook(uid, 50),
        listUserFeed(uid, 10),
        getSocialCounts(uid),
      ]);
      setProfile(p);
      setRecords(recs);
      setGuestbook(gb);
      setFeed(uf);
      setCounts(c);
      setEditBio(p.bio);
      setEditStatus(p.statusMsg);
      setEditColor(p.themeColor || "#F9954E");
      setEditBg(p.bg || "aurora");
      setEditMood(p.mood || "");
      setEditTitle(p.title || "");
      setEditFrame(p.frame || "none");
      setEditInterests(p.interests || []);
      setEditStickers(p.stickers || []);
      setEditNameEffect(p.nameEffect || "none");
      setEditBannerEffect(p.bannerEffect || "none");
      setEditPet(p.pet || "");
      setEditGreeting(p.greeting || "");
      setHandleInput(p.handle || "");
    } catch {
      // getProfile 등은 내부에서 안전 처리됨
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!targetUid) {
      setLoading(false);
      return;
    }
    void loadAll(targetUid);
  }, [mounted, targetUid, loadAll]);

  // 다른 사람 프로필이면 친구 여부 확인
  useEffect(() => {
    if (!mounted) return;
    if (!targetUid || !myUid || isOwner) {
      setFriendState("none");
      return;
    }
    let active = true;
    setFriendState("loading");
    isFriend(targetUid)
      .then((yes) => {
        if (active) setFriendState(yes ? "friend" : "none");
      })
      .catch(() => {
        if (active) setFriendState("none");
      });
    return () => {
      active = false;
    };
  }, [mounted, targetUid, myUid, isOwner]);

  // 팔로우 여부 확인
  useEffect(() => {
    if (!mounted) return;
    if (!targetUid || !myUid || isOwner) { setFollowState("none"); return; }
    let active = true;
    setFollowState("loading");
    isFollowing(targetUid)
      .then((yes) => { if (active) setFollowState(yes ? "following" : "none"); })
      .catch(() => { if (active) setFollowState("none"); });
    return () => { active = false; };
  }, [mounted, targetUid, myUid, isOwner]);

  // 방문자 카운터: 대상 결정 후 1회 집계 + 통계 조회
  useEffect(() => {
    if (!mounted || !targetUid) return;
    let active = true;
    (async () => {
      try {
        await bumpVisit(targetUid); // 본인/세션중복은 내부에서 무시
      } catch {
        // 무시
      }
      try {
        const stats = await getVisitStats(targetUid);
        if (active) setVisit(stats);
      } catch {
        // 무시
      }
    })();
    return () => {
      active = false;
    };
  }, [mounted, targetUid]);

  const handleChangePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file || !isOwner || !targetUid) return;
    setPhotoError("");
    setPhotoUploading(true);
    const res = await uploadAvatar(file);
    if (res.ok) {
      // photoURL은 Profile에 존재하지만 saveMyProfile의 patch 타입엔 빠져있어 타입 안전하게 전달
      await saveMyProfile({ photoURL: res.url } as Parameters<typeof saveMyProfile>[0]);
      await loadAll(targetUid);
    } else {
      setPhotoError(res.error || "사진 업로드에 실패했습니다.");
    }
    setPhotoUploading(false);
  };

  const handleAddFriend = async () => {
    if (!targetUid || isOwner) return;
    setFriendState("requested");
    const ok = await sendFriendRequest(targetUid, myName);
    if (!ok) {
      setFriendState("none");
      alert("친구 요청에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleToggleFollow = async () => {
    if (!targetUid || isOwner || followBusy) return;
    if (!myUid) { alert("로그인이 필요해요."); return; }
    setFollowBusy(true);
    const wasFollowing = followState === "following";
    // 낙관적 업데이트
    setFollowState(wasFollowing ? "none" : "following");
    setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (wasFollowing ? -1 : 1)) }));
    const ok = wasFollowing ? await unfollowUser(targetUid) : await followUser(targetUid, profile?.name || "사용자", myName);
    if (!ok) {
      setFollowState(wasFollowing ? "following" : "none");
      setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (wasFollowing ? 1 : -1)) }));
    }
    setFollowBusy(false);
  };

  const handleShare = async () => {
    if (!targetUid) return;
    const url = `${window.location.origin}/profile?uid=${targetUid}`;
    const title = `${profile?.name || "코지홈"} 님의 코지홈`;
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
    } catch { /* 사용자가 공유 취소 → 무시 */ }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      window.prompt("이 링크를 복사해 공유하세요", url);
    }
  };

  const openFollowList = async (type: "followers" | "following") => {
    if (!targetUid) return;
    setFollowModal({ title: type === "followers" ? "팔로워" : "팔로잉", users: [] });
    const users = type === "followers" ? await listFollowers(targetUid) : await listFollowing(targetUid);
    setFollowModal({ title: type === "followers" ? "팔로워" : "팔로잉", users: users.map((u) => ({ uid: u.uid, name: u.name })) });
  };

  const handleSave = async () => {
    if (!isOwner || !targetUid) return;
    setSaving(true);
    const ok = await saveMyProfile({
      bio: editBio.slice(0, 300),
      statusMsg: editStatus.slice(0, 80),
      themeColor: editColor,
      bg: editBg,
      mood: editMood,
      title: editTitle.slice(0, 24),
      frame: editFrame,
      interests: editInterests.slice(0, 8),
      stickers: editStickers.slice(0, 6),
      nameEffect: editNameEffect,
      bannerEffect: editBannerEffect,
      pet: editPet,
      greeting: editGreeting.slice(0, 60),
    });
    setSaving(false);
    if (ok) {
      setEditing(false);
      await loadAll(targetUid);
    } else {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleAddGuestbook = async () => {
    if (!targetUid || !gbMsg.trim()) return;
    setGbSending(true);
    const ok = await addGuestbookEntry(targetUid, myName, gbMsg.trim());
    setGbSending(false);
    if (ok) {
      setGbMsg("");
      const gb = await listGuestbook(targetUid, 50);
      setGuestbook(gb);
    } else {
      alert("방명록 작성에 실패했습니다.");
    }
  };

  const handleDeleteGuestbook = async (entryId: string) => {
    if (!isOwner || !targetUid) return;
    const ok = await deleteGuestbookEntry(targetUid, entryId);
    if (ok) {
      setGuestbook((prev) => prev.filter((g) => g.id !== entryId));
    }
  };

  // ── 다이어리(주인 본인만 작성) ──
  const handleAddDiary = async () => {
    if (!isOwner || !diaryInput.trim() || diaryBusy) return;
    setDiaryBusy(true);
    const next = await addDiaryEntry(diaryInput.trim(), diaryMood);
    setDiaryBusy(false);
    if (next) {
      setDiaryInput("");
      setDiaryMood("");
      setProfile((p) => (p ? { ...p, diary: next } : p));
    } else {
      alert("다이어리 저장에 실패했습니다.");
    }
  };

  const handleDeleteDiary = async (at: number) => {
    if (!isOwner) return;
    const ok = await deleteDiaryEntry(at);
    if (ok) setProfile((p) => (p ? { ...p, diary: (p.diary || []).filter((e) => e.at !== at) } : p));
  };

  // ── 내가 만든 AI 자랑 (호스팅 페이지) ──
  const handleSubmitAI = async () => {
    if (!isOwner || !aiForm.name.trim() || aiBusy) return;
    setAiBusy(true);
    const payload: AIInput = { ...aiForm };
    const next = aiEditId ? await updateMyAI(aiEditId, payload) : await addMyAI(payload);
    setAiBusy(false);
    if (next) {
      setProfile((p) => (p ? { ...p, myAIs: next } : p));
      setAiForm({ ...EMPTY_AI });
      setAiEditId(null);
      setAiFormOpen(false);
    } else {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const startEditAI = (ai: Profile["myAIs"][number]) => {
    setAiEditId(ai.id);
    setAiForm({
      name: ai.name || "", desc: ai.desc || "", body: ai.body || "", howto: ai.howto || "",
      tool: ai.tool || "", category: ai.category || "", tags: (ai.tags || []).join(", "),
      url: ai.url || "", images: (ai.images || []).join("\n"), emoji: ai.emoji || "🤖",
    });
    setAiFormOpen(true);
  };

  const handleDeleteAI = async (id: string) => {
    if (!isOwner) return;
    if (!confirm("이 AI 페이지를 삭제할까요?")) return;
    const ok = await deleteMyAI(id);
    if (ok) setProfile((p) => (p ? { ...p, myAIs: (p.myAIs || []).filter((a) => a.id !== id) } : p));
  };

  const aiShareUrl = (ai: Profile["myAIs"][number]): string => {
    const base = profile?.handle || profile?.uid || "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.dori-ai.com";
    return `${origin}/u/${base}/${encodeURIComponent(ai.slug)}`;
  };
  const copyAiShare = async (ai: Profile["myAIs"][number]) => {
    try {
      await navigator.clipboard.writeText(aiShareUrl(ai));
      setAiCopied(ai.id);
      setTimeout(() => setAiCopied((c) => (c === ai.id ? null : c)), 1600);
    } catch { /* ignore */ }
  };

  // ── 핸들(공유 주소) ──
  const handleSaveHandle = async () => {
    if (!isOwner || handleBusy) return;
    const v = handleInput.trim().toLowerCase();
    if (!v) return;
    setHandleBusy(true);
    const res = await setMyHandle(v);
    setHandleBusy(false);
    if (res.ok) {
      setProfile((p) => (p ? { ...p, handle: res.handle || v } : p));
      setHandleMsg(res.warn ? { ok: false, text: res.warn } : { ok: true, text: "저장됐어요! 이제 내 AI 주소가 깔끔해져요." });
    } else {
      setHandleMsg({ ok: false, text: res.error || "저장 실패" });
    }
  };
  // 입력마다 비동기 중복확인 — 마지막 입력의 응답만 반영(out-of-order/스테일 방지)
  const handleReqRef = useRef("");
  const handleCheckHandle = async (v: string) => {
    setHandleInput(v);
    const t = v.trim().toLowerCase();
    handleReqRef.current = t;
    setHandleMsg(null); // 입력 변경 즉시 이전 결과 제거(저장 버튼이 스테일 ok로 켜지는 것 방지)
    if (!t) return;
    const res = await checkHandle(t);
    if (handleReqRef.current !== t) return; // 더 최신 입력이 있으면 무시
    setHandleMsg(res.ok ? { ok: true, text: "사용 가능한 이름이에요 ✓" } : { ok: false, text: res.reason || "사용 불가" });
  };

  // 뱃지(전적 기반 단순 산출)
  const gamerLevel = records.length;
  const accent = profile?.themeColor || "#F9954E";

  // 보유 아이템(무료 기본 + 구매한 프리미엄) — Firestore 프로필 + 로컬 캐시 병합
  const myEmail = session?.user?.email || "";
  const ownedSet = useMemo(
    () => new Set<string>([...(profile?.ownedItems || []), ...(mounted && myEmail ? getOwnedShopItems(myEmail) : [])]),
    [profile?.ownedItems, myEmail, mounted]
  );
  const isItemOwned = (it: ShopItem) => it.price === 0 || ownedSet.has(itemKey(it.slot, it.id));

  const messageHref = useMemo(() => {
    if (!targetUid || !profile) return "/login";
    return `/messages?to=${encodeURIComponent(targetUid)}&name=${encodeURIComponent(profile.name)}`;
  }, [targetUid, profile]);

  // ── 비로그인 + 대상 미지정 → 로그인 유도 ───────────────────────
  if (mounted && !targetUid) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className="rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-2xl mb-5">
            🏠
          </div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">
            코지홈을 보려면 로그인하세요
          </h2>
          <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-7 leading-relaxed">
            로그인하면 나만의 코지홈을
            <br />
            꾸미고 방명록을 받을 수 있어요.
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 text-center"
          >
            로그인하러 가기
          </Link>
        </div>
      </main>
    );
  }

  // ── 로딩 ───────────────────────────────────────────────────────
  if (!mounted || loading || !profile) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-neutral-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-5" />
        <p className="text-[14px] text-neutral-400 font-semibold">코지홈을 불러오는 중입니다</p>
      </main>
    );
  }

  const avatarLetter = (profile.name || "?").trim().charAt(0) || "?";
  const canMessage = !!myUid && !isOwner;

  return (
    <main className="relative w-full min-h-screen pb-24 overflow-hidden">
      {/* 🎨 페이지 전체 배경 스킨 — 코지홈 한 페이지 전체가 꾸며짐(배너만이 아니라) */}
      <div className={`absolute inset-0 ${bgGradOf(profile.bg)}`} aria-hidden />
      {profile.bannerEffect && profile.bannerEffect !== "none" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <BannerFx id={profile.bannerEffect} count={18} />
        </div>
      )}

      <div className="relative">
      {/* 팔로워/팔로잉 목록 모달 */}
      {followModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setFollowModal(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm max-h-[70vh] overflow-hidden shadow-2xl border border-neutral-200 dark:border-zinc-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-zinc-800">
              <p className="text-[14px] font-extrabold text-neutral-900 dark:text-white">{followModal.title}</p>
              <button onClick={() => setFollowModal(null)} className="text-neutral-400 text-[18px] leading-none">×</button>
            </div>
            <div className="overflow-y-auto p-2">
              {followModal.users.length === 0 ? (
                <p className="text-[13px] text-neutral-400 text-center py-8">아직 없어요</p>
              ) : (
                followModal.users.map((u) => (
                  <Link
                    key={u.uid}
                    href={`/profile?uid=${u.uid}`}
                    onClick={() => setFollowModal(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-zinc-800"
                  >
                    <span className="w-9 h-9 rounded-full bg-[#F9954E]/15 text-[#F9954E] flex items-center justify-center font-extrabold">
                      {(u.name || "?").trim().charAt(0) || "?"}
                    </span>
                    <span className="text-[14px] font-bold text-neutral-800 dark:text-neutral-100 truncate">{u.name}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 내 공간 탭(코지홈 / 계정·활동 / 상점) — 본인 코지홈에서만 */}
      {isOwner && (
        <div className="max-w-2xl mx-auto px-5 pt-4">
          <div className="flex gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setHomeTab("home")}
              className={`flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors ${
                homeTab === "home"
                  ? "bg-white dark:bg-zinc-800 text-[#F9954E] shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 active:opacity-70"
              }`}
            >
              🏠 코지홈
            </button>
            <button
              type="button"
              onClick={() => setHomeTab("account")}
              className={`flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors ${
                homeTab === "account"
                  ? "bg-white dark:bg-zinc-800 text-[#F9954E] shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 active:opacity-70"
              }`}
            >
              ⚙️ 계정·활동
            </button>
            <Link
              href="/shop"
              className="flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors text-neutral-500 dark:text-neutral-400 active:opacity-70"
            >
              🛍 상점
            </Link>
          </div>
        </div>
      )}

      {/* 계정·활동 탭: 마이페이지 대시보드(출석·미션·업적·포인트·활동 흡수) */}
      {isOwner && homeTab === "account" ? (
        <MyDashboard />
      ) : (
      <section className="max-w-2xl mx-auto px-5 pt-6">
        {/* 1) 코지홈 배너 */}
        <div className="relative rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden">
          <div className={`absolute inset-0 ${bgGradOf(profile.bg)}`} aria-hidden />
          {profile.bannerEffect && profile.bannerEffect !== "none" && (
            <BannerFx id={profile.bannerEffect} />
          )}
          {/* 펫/캐릭터 — 배너 우하단에 둥실둥실 */}
          {petEmojiOf(profile.pet) && (
            <span className="absolute bottom-3 right-4 text-[44px] leading-none arcade-float drop-shadow-md select-none z-[1]" aria-hidden>
              {petEmojiOf(profile.pet)}
            </span>
          )}
          <div className="relative p-6">
            <div className="flex items-start gap-4">
              {/* 아바타 */}
              <div className="relative w-16 h-16 shrink-0">
                {profile.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className={`w-16 h-16 rounded-full object-cover shadow ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ${frameRingOf(profile.frame)}`}
                  />
                ) : (
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-extrabold shadow ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ${frameRingOf(profile.frame)}`}
                    style={{ backgroundColor: accent }}
                  >
                    {avatarLetter}
                  </div>
                )}

                {isOwner && (
                  <label
                    className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer bg-black/0 hover:bg-black/40 active:bg-black/40 transition-colors group"
                    aria-label="프로필 사진 변경"
                  >
                    {photoUploading ? (
                      <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/45">
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight px-1">
                        사진<br />변경
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChangePhoto}
                      disabled={photoUploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-[22px] font-extrabold tracking-tight truncate">
                  {profile.mood && <span className="mr-1">{profile.mood}</span>}
                  <span className={nameClassOf(profile.nameEffect) || "text-neutral-900 dark:text-white"}>
                    {profile.name}
                  </span>
                </h1>
                {profile.title && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 mt-1 text-[11px] font-bold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {profile.title}
                  </span>
                )}
                {/* 등급(티어) + 레벨 */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{ color: accent, backgroundColor: `${accent}1A` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                    {TIER_INFO[profile.tier as UserTier]?.name || `등급 ${profile.tier}`}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 tabular-nums">
                    Lv.{profile.level}
                  </span>
                </div>
                {profile.statusMsg ? (
                  <p className="text-[13px] mt-0.5 font-semibold" style={{ color: accent }}>
                    {profile.statusMsg}
                  </p>
                ) : (
                  <p className="text-[13px] mt-0.5 text-neutral-400 dark:text-neutral-500">상태메시지가 없어요</p>
                )}
              </div>

              {/* 방문자 카운터(투데이/투탈) — 싸이월드 감성 */}
              {visit && (
                <div className="shrink-0 self-start text-right">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-2.5 py-1 text-[10px] font-bold tracking-tight ring-1 ring-black/5 dark:ring-white/10">
                    <span className="text-[#F9954E]">TODAY</span>
                    <span className="text-neutral-800 dark:text-neutral-100 tabular-nums">
                      {visit.today.toLocaleString()}
                    </span>
                    <span className="text-neutral-300 dark:text-zinc-700">·</span>
                    <span className="text-neutral-400 dark:text-neutral-500">TOTAL</span>
                    <span className="text-neutral-600 dark:text-neutral-300 tabular-nums">
                      {visit.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isOwner && photoError && (
              <p className="mt-3 text-[12px] font-semibold text-red-500">{photoError}</p>
            )}

            {/* 대문 인사말 */}
            {profile.greeting && (
              <div className="mt-4 rounded-2xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur ring-1 ring-[#F9954E]/30 px-4 py-3">
                <p className="text-[10px] font-bold text-[#F9954E] mb-1 tracking-wide">대문</p>
                <p className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-100 leading-relaxed break-keep">
                  “{profile.greeting}”
                </p>
              </div>
            )}

            {profile.bio && (
              <p className="mt-4 text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400 whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* 관심사 칩 */}
            {profile.interests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.interests.map((it) => (
                  <span
                    key={it}
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold bg-white/70 dark:bg-zinc-900/70 backdrop-blur text-neutral-700 dark:text-neutral-200 ring-1 ring-black/5 dark:ring-white/10"
                  >
                    #{it}
                  </span>
                ))}
              </div>
            )}

            {/* 배너 스티커 */}
            {profile.stickers.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5 text-[26px] leading-none select-none">
                {profile.stickers.map((s, i) => (
                  <span key={`${s}-${i}`} className="drop-shadow-sm">{s}</span>
                ))}
              </div>
            )}

            {/* 소셜 카운트 */}
            <div className="mt-4 flex items-center gap-5">
              <div className="text-center">
                <p className="text-[16px] font-extrabold text-neutral-900 dark:text-white tabular-nums leading-none">{counts.posts.toLocaleString()}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">게시물</p>
              </div>
              <button onClick={() => openFollowList("followers")} className="text-center active:opacity-70">
                <p className="text-[16px] font-extrabold text-neutral-900 dark:text-white tabular-nums leading-none">{counts.followers.toLocaleString()}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">팔로워</p>
              </button>
              <button onClick={() => openFollowList("following")} className="text-center active:opacity-70">
                <p className="text-[16px] font-extrabold text-neutral-900 dark:text-white tabular-nums leading-none">{counts.following.toLocaleString()}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">팔로잉</p>
              </button>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-5 flex flex-wrap gap-2">
              {isOwner && (
                <button
                  onClick={() => setEditing((v) => !v)}
                  className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85"
                >
                  {editing ? "꾸미기 닫기" : "✏️ 꾸미기"}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={handleShare}
                  className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 text-[13px] font-bold active:opacity-85"
                >
                  {shared ? "✓ 링크 복사됨" : "🔗 공유"}
                </button>
              )}
              {canMessage && (
                <button
                  onClick={handleToggleFollow}
                  disabled={followBusy || followState === "loading"}
                  className={`px-5 py-2 rounded-full text-[13px] font-bold active:opacity-85 disabled:opacity-50 transition-colors ${
                    followState === "following"
                      ? "bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200"
                      : "bg-[#F9954E] text-white"
                  }`}
                >
                  {followState === "following" ? "팔로잉" : "+ 팔로우"}
                </button>
              )}
              {canMessage && (
                <Link
                  href={messageHref}
                  className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 text-[13px] font-bold active:opacity-85"
                >
                  💬 메시지
                </Link>
              )}
              {canMessage && (
                friendState === "friend" ? (
                  <span className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 text-[13px] font-bold">
                    ✓ 친구
                  </span>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={friendState === "requested" || friendState === "loading"}
                    className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200 text-[13px] font-bold active:opacity-85 disabled:opacity-50"
                  >
                    {friendState === "requested" ? "요청됨" : "친구 추가"}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* 2) 꾸미기 패널 */}
        {isOwner && editing && (
          <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[#F9954E] font-bold">코지홈 꾸미기</p>
              <Link href="/shop" className="text-[11px] font-bold text-[#F9954E] inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#F9954E]/10">
                🍬 상점에서 아이템 받기 →
              </Link>
            </div>

            {/* 공유 주소(핸들) — 내 AI 페이지/코지홈 주소 */}
            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              공유 주소 (영문 핸들) <span className="font-normal text-neutral-400">내 AI 페이지 주소가 깔끔해져요</span>
            </label>
            <div className="flex items-stretch gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[12px] text-neutral-400 font-mono shrink-0">dori-ai.com/u/</span>
              <input
                value={handleInput}
                onChange={(e) => handleCheckHandle(e.target.value)}
                maxLength={20}
                placeholder="user04"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40 font-mono lowercase"
              />
              <button
                onClick={handleSaveHandle}
                disabled={handleBusy || !handleInput.trim() || !(handleMsg && handleMsg.ok)}
                className="px-4 rounded-xl bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85 disabled:opacity-50 shrink-0"
              >
                {handleBusy ? "..." : "저장"}
              </button>
            </div>
            {handleMsg && (
              <p className={`text-[11px] mb-1 ${handleMsg.ok ? "text-emerald-500" : "text-red-500"}`}>{handleMsg.text}</p>
            )}
            <p className="text-[11px] text-neutral-400 mb-4">영문 소문자·숫자·밑줄(_) 3~20자 · 미설정 시 임시 주소가 쓰여요</p>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              대문 인사말 <span className="font-normal text-neutral-400">방문자에게 보이는 한마디</span>
            </label>
            <input
              value={editGreeting}
              onChange={(e) => setEditGreeting(e.target.value)}
              maxLength={60}
              placeholder="예) 놀러와줘서 고마워요! 방명록 남겨주세요 :)"
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
            />

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              상태메시지
            </label>
            <input
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              maxLength={80}
              placeholder="한 줄 상태메시지"
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
            />

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              소개
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="자기소개를 적어보세요"
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40"
            />

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              오늘의 기분 <span className="font-normal text-neutral-400">이름 옆에 표시돼요</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => setEditMood("")}
                className={`w-9 h-9 rounded-xl text-[12px] font-bold flex items-center justify-center transition-colors ${
                  editMood === "" ? "bg-[#F9954E] text-white" : "bg-neutral-100 dark:bg-zinc-900 text-neutral-400"
                }`}
              >
                없음
              </button>
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setEditMood(m)}
                  className={`w-9 h-9 rounded-xl text-[18px] flex items-center justify-center transition-transform ${
                    editMood === m ? "bg-[#F9954E]/15 ring-2 ring-[#F9954E] scale-105" : "bg-neutral-100 dark:bg-zinc-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              칭호 <span className="font-normal text-neutral-400">이름 아래 표시돼요</span>
            </label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={24}
              placeholder="예) 도리 덕후 · AI 탐험가"
              className="w-full mb-2 px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
            />
            {itemsBySlot("title").some((t) => isItemOwned(t)) && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {itemsBySlot("title").filter((t) => isItemOwned(t)).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setEditTitle(t.text || "")}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-bold transition-colors ${
                      editTitle === t.text ? "bg-[#F9954E] text-white" : "bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    {t.text}
                  </button>
                ))}
              </div>
            )}
            {!itemsBySlot("title").some((t) => isItemOwned(t)) && <div className="mb-2" />}

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              대표색
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  aria-label={`색상 ${c}`}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    editColor === c ? "ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-zinc-950 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              아바타 테두리
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {itemsBySlot("frame").map((f) => (
                <PickTile key={f.id} owned={isItemOwned(f)} selected={editFrame === f.id} price={f.price} label={f.name} onSelect={() => setEditFrame(f.id)}>
                  <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-zinc-900/50">
                    <div className={`w-8 h-8 rounded-full bg-neutral-200 dark:bg-zinc-700 ring-offset-2 ring-offset-neutral-50 dark:ring-offset-zinc-900 ${frameRingOf(f.id)}`} />
                  </div>
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              배경
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {itemsBySlot("bg").map((p) => (
                <PickTile key={p.id} owned={isItemOwned(p)} selected={editBg === p.id} price={p.price} label={p.name} onSelect={() => setEditBg(p.id)}>
                  <span className={`absolute inset-0 ${p.grad || ""}`} aria-hidden />
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              이름 효과 <span className="font-normal text-neutral-400">이름 글씨에 적용돼요</span>
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {itemsBySlot("nameEffect").map((n) => (
                <PickTile key={n.id} owned={isItemOwned(n)} selected={editNameEffect === n.id} price={n.price} label={n.name} onSelect={() => setEditNameEffect(n.id)}>
                  <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-zinc-900/50">
                    <span className={`text-[17px] font-extrabold ${n.nameClass || "text-neutral-700 dark:text-white"}`}>도리</span>
                  </div>
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              배너 효과 <span className="font-normal text-neutral-400">배너에 움직이는 효과</span>
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {itemsBySlot("bannerEffect").map((b) => (
                <PickTile key={b.id} owned={isItemOwned(b)} selected={editBannerEffect === b.id} price={b.price} label={b.name} onSelect={() => setEditBannerEffect(b.id)}>
                  <span className="absolute inset-0 bg-gradient-to-br from-[#F9954E]/15 to-sky-400/10" aria-hidden />
                  {b.fx && b.fx !== "none" ? (
                    <BannerFx fx={b.fx} count={5} />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-400">없음</span>
                  )}
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              펫 · 캐릭터 <span className="font-normal text-neutral-400">코지홈에 함께 살아요</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setEditPet("")}
                className={`relative h-16 rounded-xl border overflow-hidden flex items-center justify-center text-[11px] font-bold transition-all ${
                  editPet === "" ? "border-[#F9954E] ring-1 ring-[#F9954E]/50 text-[#F9954E]" : "border-neutral-100 dark:border-zinc-900 text-neutral-400"
                }`}
              >
                없음
              </button>
              {itemsBySlot("pet").map((p) => (
                <PickTile key={p.id} owned={isItemOwned(p)} selected={editPet === p.id} price={p.price} label={p.name} onSelect={() => setEditPet(p.id)}>
                  <div className="w-full h-full flex items-center justify-center text-[28px] bg-neutral-50 dark:bg-zinc-900/50">{p.emoji}</div>
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              관심사 <span className="font-normal text-neutral-400">최대 8개</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    toggleInterest(interestInput);
                    setInterestInput("");
                  }
                }}
                maxLength={12}
                placeholder="직접 추가 (예: 그림)"
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
              />
              <button
                onClick={() => { toggleInterest(interestInput); setInterestInput(""); }}
                className="px-4 rounded-xl bg-neutral-200 dark:bg-zinc-800 text-neutral-700 dark:text-neutral-200 text-[13px] font-bold active:opacity-85"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {Array.from(new Set([...editInterests, ...INTEREST_SUGGESTIONS])).map((tag) => {
                const on = editInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                      on ? "bg-[#F9954E] text-white" : "bg-neutral-100 dark:bg-zinc-900 text-neutral-600 dark:text-neutral-300"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            <label className="block text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              배너 스티커 <span className="font-normal text-neutral-400">최대 6개</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {Array.from(new Set([...STICKER_CHOICES, ...itemsBySlot("sticker").filter((s) => isItemOwned(s)).map((s) => s.emoji!)])).map((s) => {
                const on = editStickers.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSticker(s)}
                    className={`w-9 h-9 rounded-xl text-[18px] flex items-center justify-center transition-transform ${
                      on ? "bg-[#F9954E]/15 ring-2 ring-[#F9954E] scale-105" : "bg-neutral-100 dark:bg-zinc-900"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
              <Link
                href="/shop"
                className="w-9 h-9 rounded-xl text-[16px] flex items-center justify-center bg-neutral-100 dark:bg-zinc-900 text-neutral-400 border border-dashed border-neutral-300 dark:border-zinc-700"
                title="상점에서 스티커 더 받기"
              >
                +
              </Link>
            </div>
            <p className="text-[11px] text-neutral-400 mb-5">상점에서 동물·우주·디저트 스티커를 더 받을 수 있어요</p>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        )}

        {/* 3.3) 내가 만든 AI 자랑 */}
        {(isOwner || profile.myAIs.length > 0) && (
          <div className="mt-4 rounded-2xl border border-[#F9954E]/30 dark:border-[#F9954E]/20 bg-white dark:bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-extrabold text-neutral-900 dark:text-white">🤖 내가 만든 AI {profile.myAIs.length > 0 && <span className="text-[#F9954E]">{profile.myAIs.length}</span>}</p>
              {isOwner && (
                <button
                  onClick={() => { setAiEditId(null); setAiForm({ ...EMPTY_AI }); setAiFormOpen((v) => !v); }}
                  className="text-[11px] font-bold text-white bg-[#F9954E] rounded-full px-3 py-1 active:opacity-85"
                >
                  {aiFormOpen ? "닫기" : "+ AI 자랑하기"}
                </button>
              )}
            </div>

            {/* 공유 주소(핸들) 안내 — 미설정 시 노출 */}
            {isOwner && !profile.handle && (
              <div className="mb-3 rounded-xl bg-[#FFF5EB] dark:bg-[#F9954E]/5 px-3.5 py-3 text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                💡 아래 <button onClick={() => setEditing(true)} className="font-bold text-[#F9954E] underline underline-offset-2">코지홈 꾸미기</button>에서 <b>영문 주소(핸들)</b>를 정하면
                <br /><span className="font-mono text-[11px]">dori-ai.com/u/<b>내이름</b>/AI</span> 처럼 깔끔한 주소로 공유돼요.
              </div>
            )}

            {isOwner && aiFormOpen && (
              <div className="mb-4 rounded-2xl bg-[#FFF5EB] dark:bg-[#F9954E]/5 p-4 space-y-2.5">
                {aiEditId && <p className="text-[11px] font-bold text-[#F9954E]">✏️ 수정 중</p>}
                <div className="flex flex-wrap gap-1.5">
                  {["🤖", "🧠", "💬", "🎨", "🎮", "📷", "🎵", "🔢", "🦾", "✨", "📝", "🐱"].map((em) => (
                    <button
                      key={em}
                      onClick={() => setAiForm((f) => ({ ...f, emoji: em }))}
                      className={`w-9 h-9 rounded-xl text-[18px] flex items-center justify-center transition-transform ${aiForm.emoji === em ? "bg-[#F9954E]/20 ring-2 ring-[#F9954E] scale-105" : "bg-white dark:bg-zinc-900"}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <input value={aiForm.name} onChange={(e) => setAiForm((f) => ({ ...f, name: e.target.value }))} maxLength={40} placeholder="AI 이름 (예: 우리집 강아지 알려주는 AI)"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <input value={aiForm.desc} onChange={(e) => setAiForm((f) => ({ ...f, desc: e.target.value }))} maxLength={300} placeholder="한 줄 소개 (예: 사진 속 동물 이름을 맞혀줘요)"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <div className="flex gap-2">
                  <select value={aiForm.category} onChange={(e) => setAiForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-1/2 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40">
                    <option value="">분류 선택</option>
                    {["챗봇", "그림", "글쓰기", "게임", "교육", "음악", "기타"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={aiForm.tool} onChange={(e) => setAiForm((f) => ({ ...f, tool: e.target.value }))} maxLength={30} placeholder="만든 도구 (예: ChatGPT, 스크래치)"
                    className="w-1/2 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                </div>
                <textarea value={aiForm.body} onChange={(e) => setAiForm((f) => ({ ...f, body: e.target.value }))} maxLength={4000} rows={4} placeholder="자세한 소개 — 어떤 AI인지, 왜 만들었는지, 무엇을 할 수 있는지 마음껏 적어보세요!"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <textarea value={aiForm.howto} onChange={(e) => setAiForm((f) => ({ ...f, howto: e.target.value }))} maxLength={1500} rows={2} placeholder="사용법 (선택) — 이렇게 써보세요!"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <input value={aiForm.tags} onChange={(e) => setAiForm((f) => ({ ...f, tags: e.target.value }))} placeholder="태그 (쉼표로 구분, 예: 동물, 사진, 초등학생)"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <input value={aiForm.url} onChange={(e) => setAiForm((f) => ({ ...f, url: e.target.value }))} maxLength={500} placeholder="체험 링크 (선택) — 직접 써볼 수 있는 주소"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <textarea value={aiForm.images} onChange={(e) => setAiForm((f) => ({ ...f, images: e.target.value }))} rows={2} placeholder="스크린샷 이미지 주소 (선택, 한 줄에 하나씩)"
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[12px] text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <div className="flex justify-end gap-2">
                  {aiEditId && (
                    <button onClick={() => { setAiEditId(null); setAiForm({ ...EMPTY_AI }); setAiFormOpen(false); }} className="px-4 py-2 rounded-full bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-300 text-[13px] font-bold active:opacity-85">
                      취소
                    </button>
                  )}
                  <button onClick={handleSubmitAI} disabled={aiBusy || !aiForm.name.trim()} className="px-5 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85 disabled:opacity-50">
                    {aiBusy ? "올리는 중..." : aiEditId ? "수정 완료" : "AI 페이지 만들기"}
                  </button>
                </div>
              </div>
            )}

            {profile.myAIs.length === 0 ? (
              <p className="text-[14px] text-neutral-500 dark:text-neutral-400">
                {isOwner ? "내가 만든 AI를 자랑해보세요! 🎉" : "아직 자랑한 AI가 없어요"}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.myAIs.map((ai, i) => (
                  <div key={ai.id || ai.slug || i} className="relative rounded-2xl bg-neutral-50 dark:bg-zinc-900 p-4 border border-neutral-100 dark:border-zinc-800">
                    <div className="flex items-start gap-3">
                      <span className="w-10 h-10 rounded-xl bg-[#FFF5EB] dark:bg-[#F9954E]/10 flex items-center justify-center text-[22px] shrink-0">{ai.emoji || "🤖"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-extrabold text-neutral-900 dark:text-white truncate">{ai.name}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {ai.category && <span className="text-[10px] font-bold text-[#F9954E] bg-[#FFF5EB] dark:bg-[#F9954E]/10 rounded-full px-2 py-0.5">{ai.category}</span>}
                          {ai.tool && <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 dark:bg-zinc-800 rounded-full px-2 py-0.5">{ai.tool}</span>}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => startEditAI(ai)} className="text-[11px] text-neutral-400 hover:text-[#F9954E] font-bold">수정</button>
                          <button onClick={() => handleDeleteAI(ai.id)} className="text-[11px] text-neutral-400 hover:text-red-500 font-bold">삭제</button>
                        </div>
                      )}
                    </div>
                    {ai.desc && <p className="mt-2.5 text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap break-keep">{ai.desc}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a href={`/u/${profile.handle || profile.uid}/${encodeURIComponent(ai.slug)}`} className="inline-flex items-center gap-1 text-[12px] font-bold text-white bg-[#F9954E] rounded-full px-3 py-1.5 active:opacity-85">
                        🏠 AI 페이지
                      </a>
                      {ai.url && (
                        <a href={ai.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#F9954E] active:opacity-70">
                          ▶ 써보기
                        </a>
                      )}
                      <button onClick={() => copyAiShare(ai)} className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-neutral-500 dark:text-neutral-400 active:opacity-70">
                        {aiCopied === ai.id ? "✓ 복사됨" : "🔗 공유"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3.5) 다이어리(일기장) */}
        {(isOwner || profile.diary.length > 0) && (
          <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
            <p className="text-[11px] text-[#F9954E] font-bold mb-3">📖 다이어리</p>

            {isOwner && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setDiaryMood((cur) => (cur === m ? "" : m))}
                      className={`w-8 h-8 rounded-lg text-[16px] flex items-center justify-center transition-transform ${
                        diaryMood === m ? "bg-[#F9954E]/15 ring-2 ring-[#F9954E] scale-105" : "bg-neutral-100 dark:bg-zinc-900"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <textarea
                  value={diaryInput}
                  onChange={(e) => setDiaryInput(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="오늘 하루, 한 줄 일기를 남겨보세요"
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleAddDiary}
                    disabled={diaryBusy || !diaryInput.trim()}
                    className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85 disabled:opacity-50"
                  >
                    {diaryBusy ? "남기는 중..." : "일기 남기기"}
                  </button>
                </div>
              </div>
            )}

            {profile.diary.length === 0 ? (
              <p className="text-[14px] text-neutral-500 dark:text-neutral-400">아직 일기가 없어요</p>
            ) : (
              <ul className="space-y-2.5">
                {profile.diary.map((e) => (
                  <li key={e.at} className="rounded-xl bg-neutral-50 dark:bg-zinc-900 p-3.5 border-l-2 border-[#F9954E]/40">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] text-neutral-400">{e.mood && <span className="mr-1 text-[14px]">{e.mood}</span>}{fmtDate(e.at)}</span>
                      {isOwner && (
                        <button onClick={() => handleDeleteDiary(e.at)} className="text-[11px] text-neutral-400 hover:text-red-500 font-bold">삭제</button>
                      )}
                    </div>
                    <p className="text-[14px] text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed break-keep">{e.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 4) 뱃지 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">뱃지</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              🎮 게이머 Lv.{gamerLevel}
            </span>
            {records.length === 0 ? (
              <span className="text-[13px] text-neutral-400 dark:text-neutral-500">
                기록을 쌓으면 뱃지가 생겨요
              </span>
            ) : (
              records.map((r) => (
                <span
                  key={r.game}
                  className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-neutral-100 dark:bg-zinc-900 text-neutral-700 dark:text-neutral-200"
                >
                  🏅 {r.label}
                </span>
              ))
            )}
          </div>
        </div>

        {/* 3) 전적 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">전적</p>
          {records.length === 0 ? (
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">아직 기록 없음</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {records.map((r) => (
                <div
                  key={r.game}
                  className="rounded-xl bg-neutral-100 dark:bg-zinc-900 p-3.5"
                >
                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-1 truncate">{r.label}</p>
                  <p className="text-[18px] font-extrabold text-neutral-900 dark:text-white">
                    {r.score.toLocaleString()}
                    <span className="text-[12px] font-bold text-neutral-400 ml-1">{r.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6) 본인 피드 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">최근 글</p>
          {feed.length === 0 ? (
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">아직 작성한 글이 없어요</p>
          ) : (
            <ul className="space-y-3">
              {feed.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl bg-neutral-100 dark:bg-zinc-900 p-3.5"
                >
                  <p className="text-[14px] text-neutral-800 dark:text-neutral-100 whitespace-pre-wrap leading-relaxed">
                    {p.text}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-neutral-400">
                    {fmtDate(p.at) && <span>{fmtDate(p.at)}</span>}
                    <span>❤️ {p.likeCount.toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 5) 방명록 */}
        <div className="mt-4 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">방명록</p>

          {myUid ? (
            <div className="mb-4">
              <textarea
                value={gbMsg}
                onChange={(e) => setGbMsg(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder={isOwner ? "내 코지홈에 한마디" : "방명록을 남겨보세요"}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-900 text-[14px] text-neutral-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddGuestbook}
                  disabled={gbSending || !gbMsg.trim()}
                  className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85 disabled:opacity-50"
                >
                  {gbSending ? "남기는 중..." : "남기기"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-xl bg-neutral-100 dark:bg-zinc-900 p-3.5 text-[13px] text-neutral-500 dark:text-neutral-400">
              방명록을 남기려면{" "}
              <Link href="/login" className="font-bold text-[#F9954E]">
                로그인
              </Link>
              하세요.
            </div>
          )}

          {guestbook.length === 0 ? (
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">아직 방명록이 없어요</p>
          ) : (
            <ul className="space-y-3">
              {guestbook.map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl bg-neutral-100 dark:bg-zinc-900 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    {g.fromUid ? (
                      <Link href={`/profile?uid=${g.fromUid}`} className="text-[13px] font-bold text-neutral-800 dark:text-neutral-100 truncate hover:text-[#F9954E] hover:underline">
                        {g.fromName}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-bold text-neutral-800 dark:text-neutral-100 truncate">
                        {g.fromName}
                      </span>
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                      {fmtDate(g.at) && (
                        <span className="text-[11px] text-neutral-400">{fmtDate(g.at)}</span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteGuestbook(g.id)}
                          className="text-[11px] text-neutral-400 hover:text-red-500 font-bold"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[14px] text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {g.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      )}
      </div>
    </main>
  );
}
