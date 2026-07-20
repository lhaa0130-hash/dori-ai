"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MyAnimalsSection from "@/components/animal/MyAnimalsSection";
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
import { TIER_INFO, TIER_THRESHOLDS, type UserTier } from "@/lib/userProfile";
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

// 프로필(코지홈) 페이지 문구 — /en 경로에서는 영어로 표시
const T = {
  ko: {
    defaultUserName: "사용자",
    buyAtShop: "상점에서 구매",
    photoUploadFailed: "사진 업로드에 실패했습니다.",
    friendRequestFailed: "친구 요청에 실패했습니다. 다시 시도해주세요.",
    loginRequired: "로그인이 필요해요.",
    shareTitle: (name: string) => `${name} 님의 코지홈`,
    cozyHomeFallbackName: "코지홈",
    copyLinkPrompt: "이 링크를 복사해 공유하세요",
    followers: "팔로워",
    following: "팔로잉",
    saveFailed: "저장에 실패했습니다. 다시 시도해주세요.",
    guestbookFailed: "방명록 작성에 실패했습니다.",
    diarySaveFailed: "다이어리 저장에 실패했습니다.",
    confirmDeleteAI: "이 AI 페이지를 삭제할까요?",
    handleSaveSuccess: "저장됐어요! 이제 내 AI 주소가 깔끔해져요.",
    saveFailedShort: "저장 실패",
    handleAvailable: "사용 가능한 이름이에요 ✓",
    handleUnavailable: "사용 불가",
    loginPromptTitle: "코지홈을 보려면 로그인하세요",
    loginPromptBody1: "로그인하면 나만의 코지홈을",
    loginPromptBody2: "꾸미고 방명록을 받을 수 있어요.",
    goToLogin: "로그인하러 가기",
    loadingCozyHome: "코지홈을 불러오는 중입니다",
    followListEmpty: "아직 없어요",
    cozyHomeTab: "🏠 코지홈",
    accountTab: "⚙️ 계정·활동",
    shopTab: "🛍 상점",
    changePhotoAria: "프로필 사진 변경",
    changePhotoLine1: "사진",
    changePhotoLine2: "변경",
    tierFallback: (tier: number) => `등급 ${tier}`,
    noStatusMessage: "상태메시지가 없어요",
    greetingLabel: "대문",
    posts: "게시물",
    closeCustomize: "꾸미기 닫기",
    customize: "✏️ 꾸미기",
    linkCopied: "✓ 링크 복사됨",
    share: "🔗 공유",
    followBtn: "+ 팔로우",
    messageBtn: "💬 메시지",
    friendBadge: "✓ 친구",
    requested: "요청됨",
    addFriend: "친구 추가",
    customizeCozyHome: "코지홈 꾸미기",
    getItemsFromShop: "🍬 상점에서 아이템 받기 →",
    shareAddressLabel: "공유 주소 (영문 핸들)",
    shareAddressHint: "내 AI 페이지 주소가 깔끔해져요",
    save: "저장",
    handleHint: "영문 소문자·숫자·밑줄(_) 3~20자 · 미설정 시 임시 주소가 쓰여요",
    greetingFieldLabel: "대문 인사말",
    greetingFieldHint: "방문자에게 보이는 한마디",
    greetingPlaceholder: "예) 놀러와줘서 고마워요! 방명록 남겨주세요 :)",
    statusMsgLabel: "상태메시지",
    statusMsgPlaceholder: "한 줄 상태메시지",
    bioLabel: "소개",
    bioPlaceholder: "자기소개를 적어보세요",
    moodLabel: "오늘의 기분",
    moodHint: "이름 옆에 표시돼요",
    none: "없음",
    titleLabel: "칭호",
    titleHint: "이름 아래 표시돼요",
    titlePlaceholder: "예) 도리 덕후 · AI 탐험가",
    colorLabel: "대표색",
    colorAria: (c: string) => `색상 ${c}`,
    frameLabel: "아바타 테두리",
    bgLabel: "배경",
    nameEffectLabel: "이름 효과",
    nameEffectHint: "이름 글씨에 적용돼요",
    namePreview: "도리",
    bannerEffectLabel: "배너 효과",
    bannerEffectHint: "배너에 움직이는 효과",
    petLabel: "펫 · 캐릭터",
    petHint: "코지홈에 함께 살아요",
    interestsLabel: "관심사",
    interestsHint: "최대 8개",
    interestInputPlaceholder: "직접 추가 (예: 그림)",
    addBtn: "추가",
    stickerLabel: "배너 스티커",
    stickerHint: "최대 6개",
    getStickersFromShop: "상점에서 스티커 더 받기",
    stickerShopHint: "상점에서 동물·우주·디저트 스티커를 더 받을 수 있어요",
    saving: "저장 중...",
    saveButtonFull: "저장하기",
    myAIsHeading: "🤖 내가 만든 AI",
    close: "닫기",
    showOffAI: "+ AI 자랑하기",
    handleTip: (customizeBtn: ReactNode): ReactNode => (
      <>
        💡 아래 {customizeBtn}에서 <b>영문 주소(핸들)</b>를 정하면
        <br />
        <span className="font-mono text-[11px]">illo.im/u/<b>내이름</b>/AI</span> 처럼 깔끔한 주소로 공유돼요.
      </>
    ),
    editingInProgress: "✏️ 수정 중",
    aiNamePlaceholder: "AI 이름 (예: 우리집 강아지 알려주는 AI)",
    aiDescPlaceholder: "한 줄 소개 (예: 사진 속 동물 이름을 맞혀줘요)",
    categorySelectPlaceholder: "분류 선택",
    toolPlaceholder: "만든 도구 (예: ChatGPT, 스크래치)",
    aiBodyPlaceholder: "자세한 소개 — 어떤 AI인지, 왜 만들었는지, 무엇을 할 수 있는지 마음껏 적어보세요!",
    aiHowtoPlaceholder: "사용법 (선택) — 이렇게 써보세요!",
    aiTagsPlaceholder: "태그 (쉼표로 구분, 예: 동물, 사진, 초등학생)",
    aiUrlPlaceholder: "체험 링크 (선택) — 직접 써볼 수 있는 주소",
    aiImagesPlaceholder: "스크린샷 이미지 주소 (선택, 한 줄에 하나씩)",
    cancel: "취소",
    uploading: "올리는 중...",
    editComplete: "수정 완료",
    createAIPage: "AI 페이지 만들기",
    showOffYourAI: "내가 만든 AI를 자랑해보세요! 🎉",
    noAIYet: "아직 자랑한 AI가 없어요",
    edit: "수정",
    delete: "삭제",
    aiPageLink: "🏠 AI 페이지",
    tryIt: "▶ 써보기",
    copied: "✓ 복사됨",
    diaryHeading: "📖 다이어리",
    diaryPlaceholder: "오늘 하루, 한 줄 일기를 남겨보세요",
    posting: "남기는 중...",
    addDiary: "일기 남기기",
    noDiaryYet: "아직 일기가 없어요",
    myTierHeading: "내 등급",
    collapse: "접기",
    viewTierTable: "등급표 보기",
    tierProgress: (nextName: string, remain: number, exp: number) =>
      `${nextName}까지 ${remain.toLocaleString()}점 · 현재 ${exp.toLocaleString()}점`,
    tierMax: (exp: number) => `최고 등급! · ${exp.toLocaleString()}점`,
    points: (n: number) => `${n.toLocaleString()}점`,
    badgeHeading: "뱃지",
    gamerLevelBadge: (n: number) => `🎮 게이머 Lv.${n}`,
    noBadgesYet: "기록을 쌓으면 뱃지가 생겨요",
    psychReportHeading: "🧩 심리 리포트",
    goTakeTest: "테스트 하러 가기 →",
    recordsHeading: "전적",
    noRecordsYet: "아직 기록 없음",
    recentPostsHeading: "최근 글",
    noPostsYet: "아직 작성한 글이 없어요",
    guestbookHeading: "방명록",
    guestbookPlaceholderOwner: "내 코지홈에 한마디",
    guestbookPlaceholderVisitor: "방명록을 남겨보세요",
    postGuestbook: "남기기",
    loginWord: "로그인",
    guestbookLoginPrompt: (loginLink: ReactNode): ReactNode => (
      <>방명록을 남기려면{" "}{loginLink}하세요.</>
    ),
    emptyGuestbook: "아직 방명록이 없어요",
  },
  en: {
    defaultUserName: "User",
    buyAtShop: "Buy in shop",
    photoUploadFailed: "Failed to upload photo.",
    friendRequestFailed: "Failed to send friend request. Please try again.",
    loginRequired: "Please log in.",
    shareTitle: (name: string) => `${name}'s Cozy Home`,
    cozyHomeFallbackName: "Cozy Home",
    copyLinkPrompt: "Copy this link to share",
    followers: "Followers",
    following: "Following",
    saveFailed: "Failed to save. Please try again.",
    guestbookFailed: "Failed to post to the guestbook.",
    diarySaveFailed: "Failed to save your diary entry.",
    confirmDeleteAI: "Delete this AI page?",
    handleSaveSuccess: "Saved! Your AI page address is now cleaner.",
    saveFailedShort: "Save failed",
    handleAvailable: "This name is available ✓",
    handleUnavailable: "Not available",
    loginPromptTitle: "Log in to view Cozy Home",
    loginPromptBody1: "Log in to customize your own Cozy Home",
    loginPromptBody2: "and receive guestbook messages.",
    goToLogin: "Log in",
    loadingCozyHome: "Loading Cozy Home...",
    followListEmpty: "No one yet",
    cozyHomeTab: "🏠 Cozy Home",
    accountTab: "⚙️ Account",
    shopTab: "🛍 Shop",
    changePhotoAria: "Change profile photo",
    changePhotoLine1: "Change",
    changePhotoLine2: "photo",
    tierFallback: (tier: number) => `Tier ${tier}`,
    noStatusMessage: "No status message yet",
    greetingLabel: "Greeting",
    posts: "Posts",
    closeCustomize: "Close customize",
    customize: "✏️ Customize",
    linkCopied: "✓ Link copied",
    share: "🔗 Share",
    followBtn: "+ Follow",
    messageBtn: "💬 Message",
    friendBadge: "✓ Friend",
    requested: "Requested",
    addFriend: "Add friend",
    customizeCozyHome: "Customize Cozy Home",
    getItemsFromShop: "🍬 Get items from the shop →",
    shareAddressLabel: "Share address (handle)",
    shareAddressHint: "Makes your AI page address cleaner",
    save: "Save",
    handleHint: "Lowercase letters, numbers, underscores (_), 3-20 characters · A temporary address is used until set",
    greetingFieldLabel: "Greeting",
    greetingFieldHint: "A short message visitors will see",
    greetingPlaceholder: "e.g. Thanks for stopping by! Leave me a note :)",
    statusMsgLabel: "Status message",
    statusMsgPlaceholder: "A one-line status message",
    bioLabel: "About",
    bioPlaceholder: "Write a short bio about yourself",
    moodLabel: "Today's mood",
    moodHint: "Shown next to your name",
    none: "None",
    titleLabel: "Title",
    titleHint: "Shown below your name",
    titlePlaceholder: "e.g. AI enthusiast · Explorer",
    colorLabel: "Accent color",
    colorAria: (c: string) => `Color ${c}`,
    frameLabel: "Avatar frame",
    bgLabel: "Background",
    nameEffectLabel: "Name effect",
    nameEffectHint: "Applied to your name text",
    namePreview: "Dori",
    bannerEffectLabel: "Banner effect",
    bannerEffectHint: "An animated effect on your banner",
    petLabel: "Pet · Character",
    petHint: "Lives with you in Cozy Home",
    interestsLabel: "Interests",
    interestsHint: "Up to 8",
    interestInputPlaceholder: "Add your own (e.g. Drawing)",
    addBtn: "Add",
    stickerLabel: "Banner stickers",
    stickerHint: "Up to 6",
    getStickersFromShop: "Get more stickers in the shop",
    stickerShopHint: "Get more animal, space, and dessert stickers in the shop",
    saving: "Saving...",
    saveButtonFull: "Save",
    myAIsHeading: "🤖 My AI creations",
    close: "Close",
    showOffAI: "+ Show off an AI",
    handleTip: (customizeBtn: ReactNode): ReactNode => (
      <>
        💡 Set an <b>English handle</b> in {customizeBtn} below,
        <br />
        and share a clean address like <span className="font-mono text-[11px]">illo.im/u/<b>your-name</b>/AI</span>.
      </>
    ),
    editingInProgress: "✏️ Editing",
    aiNamePlaceholder: "AI name (e.g. An AI that IDs my dog's breed)",
    aiDescPlaceholder: "One-line description (e.g. Guesses the animal in your photo)",
    categorySelectPlaceholder: "Select a category",
    toolPlaceholder: "Tool used (e.g. ChatGPT, Scratch)",
    aiBodyPlaceholder: "Full description — what it is, why you made it, what it can do. Write as much as you like!",
    aiHowtoPlaceholder: "How to use (optional) — try it like this!",
    aiTagsPlaceholder: "Tags (comma-separated, e.g. animals, photo, kids)",
    aiUrlPlaceholder: "Try-it link (optional) — a URL people can use directly",
    aiImagesPlaceholder: "Screenshot image URLs (optional, one per line)",
    cancel: "Cancel",
    uploading: "Uploading...",
    editComplete: "Edit complete",
    createAIPage: "Create AI page",
    showOffYourAI: "Show off an AI you made! 🎉",
    noAIYet: "No AI creations shared yet",
    edit: "Edit",
    delete: "Delete",
    aiPageLink: "🏠 AI page",
    tryIt: "▶ Try it",
    copied: "✓ Copied",
    diaryHeading: "📖 Diary",
    diaryPlaceholder: "Write a line about your day",
    posting: "Posting...",
    addDiary: "Add diary entry",
    noDiaryYet: "No diary entries yet",
    myTierHeading: "My tier",
    collapse: "Collapse",
    viewTierTable: "View tier table",
    tierProgress: (nextName: string, remain: number, exp: number) =>
      `${remain.toLocaleString()} pts to ${nextName} · ${exp.toLocaleString()} pts now`,
    tierMax: (exp: number) => `Max tier! · ${exp.toLocaleString()} pts`,
    points: (n: number) => `${n.toLocaleString()} pts`,
    badgeHeading: "Badges",
    gamerLevelBadge: (n: number) => `🎮 Gamer Lv.${n}`,
    noBadgesYet: "Play to earn badges",
    psychReportHeading: "🧩 Psych reports",
    goTakeTest: "Take a test →",
    recordsHeading: "Records",
    noRecordsYet: "No records yet",
    recentPostsHeading: "Recent posts",
    noPostsYet: "No posts yet",
    guestbookHeading: "Guestbook",
    guestbookPlaceholderOwner: "Leave a note on your Cozy Home",
    guestbookPlaceholderVisitor: "Leave a guestbook message",
    postGuestbook: "Post",
    loginWord: "Log in",
    guestbookLoginPrompt: (loginLink: ReactNode): ReactNode => (
      <>{loginLink} to leave a guestbook message.</>
    ),
    emptyGuestbook: "No guestbook messages yet",
  },
} as const;

function fmtDate(at: number, locale: string = "ko-KR"): string {
  if (!at) return "";
  try {
    return new Date(at).toLocaleDateString(locale);
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
  const pathname = usePathname();
  const t = T[(pathname || "").startsWith("/en") ? "en" : "ko"];
  const cls = `relative h-16 rounded-xl border overflow-hidden flex flex-col text-left transition-all ${
    selected ? "border-[#F9954E] ring-1 ring-[#F9954E]/50" : "border-stone-100 dark:border-zinc-900"
  } ${!owned ? "opacity-80 hover:opacity-100" : ""}`;
  const inner = (
    <>
      <div className="relative flex-1 min-h-0">{children}</div>
      <span className="relative z-10 block text-[10px] font-bold text-center py-0.5 bg-white/75 dark:bg-black/45 text-stone-700 dark:text-stone-200 truncate px-1">
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
    <Link href="/shop" className={cls} title={t.buyAtShop}>{inner}</Link>
  );
}

export default function ProfilePage() {
  const { session, status } = useAuth();
  const pathname = usePathname();
  const lang = (pathname || "").startsWith("/en") ? "en" : "ko";
  const t = T[lang];
  const dateLocale = lang === "en" ? "en-US" : "ko-KR";
  const myName = session?.user?.name || t.defaultUserName;

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
  const [tierOpen, setTierOpen] = useState(false);

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
      setPhotoError(res.error || t.photoUploadFailed);
    }
    setPhotoUploading(false);
  };

  const handleAddFriend = async () => {
    if (!targetUid || isOwner) return;
    setFriendState("requested");
    const ok = await sendFriendRequest(targetUid, myName);
    if (!ok) {
      setFriendState("none");
      alert(t.friendRequestFailed);
    }
  };

  const handleToggleFollow = async () => {
    if (!targetUid || isOwner || followBusy) return;
    if (!myUid) { alert(t.loginRequired); return; }
    setFollowBusy(true);
    const wasFollowing = followState === "following";
    // 낙관적 업데이트
    setFollowState(wasFollowing ? "none" : "following");
    setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (wasFollowing ? -1 : 1)) }));
    const ok = wasFollowing ? await unfollowUser(targetUid) : await followUser(targetUid, profile?.name || t.defaultUserName, myName);
    if (!ok) {
      setFollowState(wasFollowing ? "following" : "none");
      setCounts((c) => ({ ...c, followers: Math.max(0, c.followers + (wasFollowing ? 1 : -1)) }));
    }
    setFollowBusy(false);
  };

  const handleShare = async () => {
    if (!targetUid) return;
    const url = `${window.location.origin}/profile?uid=${targetUid}`;
    const title = t.shareTitle(profile?.name || t.cozyHomeFallbackName);
    try {
      if (navigator.share) { await navigator.share({ title, url }); return; }
    } catch { /* 사용자가 공유 취소 → 무시 */ }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      window.prompt(t.copyLinkPrompt, url);
    }
  };

  const openFollowList = async (type: "followers" | "following") => {
    if (!targetUid) return;
    setFollowModal({ title: type === "followers" ? t.followers : t.following, users: [] });
    const users = type === "followers" ? await listFollowers(targetUid) : await listFollowing(targetUid);
    setFollowModal({ title: type === "followers" ? t.followers : t.following, users: users.map((u) => ({ uid: u.uid, name: u.name })) });
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
      alert(t.saveFailed);
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
      alert(t.guestbookFailed);
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
      alert(t.diarySaveFailed);
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
      alert(t.saveFailed);
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
    if (!confirm(t.confirmDeleteAI)) return;
    const ok = await deleteMyAI(id);
    if (ok) setProfile((p) => (p ? { ...p, myAIs: (p.myAIs || []).filter((a) => a.id !== id) } : p));
  };

  const aiShareUrl = (ai: Profile["myAIs"][number]): string => {
    const base = profile?.handle || profile?.uid || "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.illo.im";
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
      setHandleMsg(res.warn ? { ok: false, text: res.warn } : { ok: true, text: t.handleSaveSuccess });
    } else {
      setHandleMsg({ ok: false, text: res.error || t.saveFailedShort });
    }
  };
  // 입력마다 비동기 중복확인 — 마지막 입력의 응답만 반영(out-of-order/스테일 방지)
  const handleReqRef = useRef("");
  const handleCheckHandle = async (v: string) => {
    setHandleInput(v);
    const trimmed = v.trim().toLowerCase();
    handleReqRef.current = trimmed;
    setHandleMsg(null); // 입력 변경 즉시 이전 결과 제거(저장 버튼이 스테일 ok로 켜지는 것 방지)
    if (!trimmed) return;
    const res = await checkHandle(trimmed);
    if (handleReqRef.current !== trimmed) return; // 더 최신 입력이 있으면 무시
    setHandleMsg(res.ok ? { ok: true, text: t.handleAvailable } : { ok: false, text: res.reason || t.handleUnavailable });
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
        <div className="rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#FBEEE7] dark:bg-[#F9954E]/10 flex items-center justify-center text-2xl mb-5">
            🏠
          </div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-stone-900 dark:text-white mb-2">
            {t.loginPromptTitle}
          </h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 mb-7 leading-relaxed">
            {t.loginPromptBody1}
            <br />
            {t.loginPromptBody2}
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 text-center"
          >
            {t.goToLogin}
          </Link>
        </div>
      </main>
    );
  }

  // ── 로딩 ───────────────────────────────────────────────────────
  if (!mounted || loading || !profile) {
    return (
      <main className="w-full min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-5" />
        <p className="text-[14px] text-stone-400 font-semibold">{t.loadingCozyHome}</p>
      </main>
    );
  }

  const avatarLetter = (profile.name || "?").trim().charAt(0) || "?";
  const canMessage = !!myUid && !isOwner;

  return (
    <main className="relative w-full min-h-screen pb-24 bg-white dark:bg-black">
      {/* 페이지 전체 배경은 흰색(다크모드 검정) — 배경 스킨은 상단 배너 카드 안에만 적용 */}
      <div className="relative">
      {/* 팔로워/팔로잉 목록 모달 */}
      {followModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => setFollowModal(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm max-h-[70vh] overflow-hidden shadow-2xl border border-stone-200 dark:border-zinc-800 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 dark:border-zinc-800">
              <p className="text-[14px] font-extrabold text-stone-900 dark:text-white">{followModal.title}</p>
              <button onClick={() => setFollowModal(null)} className="text-stone-400 text-[18px] leading-none">×</button>
            </div>
            <div className="overflow-y-auto p-2">
              {followModal.users.length === 0 ? (
                <p className="text-[13px] text-stone-400 text-center py-8">{t.followListEmpty}</p>
              ) : (
                followModal.users.map((u) => (
                  <Link
                    key={u.uid}
                    href={`/profile?uid=${u.uid}`}
                    onClick={() => setFollowModal(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-zinc-800"
                  >
                    <span className="w-9 h-9 rounded-full bg-[#F9954E]/15 text-[#F9954E] flex items-center justify-center font-extrabold">
                      {(u.name || "?").trim().charAt(0) || "?"}
                    </span>
                    <span className="text-[14px] font-bold text-stone-800 dark:text-stone-100 truncate">{u.name}</span>
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
          <div className="flex gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setHomeTab("home")}
              className={`flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors ${
                homeTab === "home"
                  ? "bg-white dark:bg-zinc-800 text-[#F9954E] shadow-sm"
                  : "text-stone-500 dark:text-stone-400 active:opacity-70"
              }`}
            >
              {t.cozyHomeTab}
            </button>
            <button
              type="button"
              onClick={() => setHomeTab("account")}
              className={`flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors ${
                homeTab === "account"
                  ? "bg-white dark:bg-zinc-800 text-[#F9954E] shadow-sm"
                  : "text-stone-500 dark:text-stone-400 active:opacity-70"
              }`}
            >
              {t.accountTab}
            </button>
            <Link
              href="/shop"
              className="flex-1 text-center py-2 rounded-xl text-[13px] font-extrabold transition-colors text-stone-500 dark:text-stone-400 active:opacity-70"
            >
              {t.shopTab}
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
        <div className="relative rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 overflow-hidden">
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
                    aria-label={t.changePhotoAria}
                  >
                    {photoUploading ? (
                      <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/45">
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity text-center leading-tight px-1">
                        {t.changePhotoLine1}<br />{t.changePhotoLine2}
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
                  <span className={nameClassOf(profile.nameEffect) || "text-stone-900 dark:text-white"}>
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
                    {TIER_INFO[profile.tier as UserTier]?.name || t.tierFallback(profile.tier)}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200 tabular-nums">
                    Lv.{profile.level}
                  </span>
                </div>
                {profile.statusMsg ? (
                  <p className="text-[13px] mt-0.5 font-semibold" style={{ color: accent }}>
                    {profile.statusMsg}
                  </p>
                ) : (
                  <p className="text-[13px] mt-0.5 text-stone-400 dark:text-stone-500">{t.noStatusMessage}</p>
                )}
              </div>

              {/* 방문자 카운터(투데이/투탈) — 싸이월드 감성 */}
              {visit && (
                <div className="shrink-0 self-start text-right">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-2.5 py-1 text-[10px] font-bold tracking-tight ring-1 ring-black/5 dark:ring-white/10">
                    <span className="text-[#F9954E]">TODAY</span>
                    <span className="text-stone-800 dark:text-stone-100 tabular-nums">
                      {visit.today.toLocaleString()}
                    </span>
                    <span className="text-stone-300 dark:text-zinc-700">·</span>
                    <span className="text-stone-400 dark:text-stone-500">TOTAL</span>
                    <span className="text-stone-600 dark:text-stone-300 tabular-nums">
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
                <p className="text-[10px] font-bold text-[#F9954E] mb-1 tracking-wide">{t.greetingLabel}</p>
                <p className="text-[14px] font-semibold text-stone-800 dark:text-stone-100 leading-relaxed break-keep">
                  “{profile.greeting}”
                </p>
              </div>
            )}

            {profile.bio && (
              <p className="mt-4 text-[14px] leading-relaxed text-stone-500 dark:text-stone-400 whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* 관심사 칩 */}
            {profile.interests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.interests.map((it) => (
                  <span
                    key={it}
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold bg-white/70 dark:bg-zinc-900/70 backdrop-blur text-stone-700 dark:text-stone-200 ring-1 ring-black/5 dark:ring-white/10"
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
                <p className="text-[16px] font-extrabold text-stone-900 dark:text-white tabular-nums leading-none">{counts.posts.toLocaleString()}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{t.posts}</p>
              </div>
              <button onClick={() => openFollowList("followers")} className="text-center active:opacity-70">
                <p className="text-[16px] font-extrabold text-stone-900 dark:text-white tabular-nums leading-none">{counts.followers.toLocaleString()}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{t.followers}</p>
              </button>
              <button onClick={() => openFollowList("following")} className="text-center active:opacity-70">
                <p className="text-[16px] font-extrabold text-stone-900 dark:text-white tabular-nums leading-none">{counts.following.toLocaleString()}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{t.following}</p>
              </button>
            </div>

            {/* 액션 버튼 */}
            <div className="mt-5 flex flex-wrap gap-2">
              {isOwner && (
                <button
                  onClick={() => setEditing((v) => !v)}
                  className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85"
                >
                  {editing ? t.closeCustomize : t.customize}
                </button>
              )}
              {isOwner && (
                <button
                  onClick={handleShare}
                  className="px-4 py-2 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200 text-[13px] font-bold active:opacity-85"
                >
                  {shared ? t.linkCopied : t.share}
                </button>
              )}
              {canMessage && (
                <button
                  onClick={handleToggleFollow}
                  disabled={followBusy || followState === "loading"}
                  className={`px-5 py-2 rounded-full text-[13px] font-bold active:opacity-85 disabled:opacity-50 transition-colors ${
                    followState === "following"
                      ? "bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200"
                      : "bg-[#F9954E] text-white"
                  }`}
                >
                  {followState === "following" ? t.following : t.followBtn}
                </button>
              )}
              {canMessage && (
                <Link
                  href={messageHref}
                  className="px-4 py-2 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200 text-[13px] font-bold active:opacity-85"
                >
                  {t.messageBtn}
                </Link>
              )}
              {canMessage && (
                friendState === "friend" ? (
                  <span className="px-4 py-2 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200 text-[13px] font-bold">
                    {t.friendBadge}
                  </span>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={friendState === "requested" || friendState === "loading"}
                    className="px-4 py-2 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200 text-[13px] font-bold active:opacity-85 disabled:opacity-50"
                  >
                    {friendState === "requested" ? t.requested : t.addFriend}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* 2) 꾸미기 패널 */}
        {isOwner && editing && (
          <div className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[#F9954E] font-bold">{t.customizeCozyHome}</p>
              <Link href="/shop" className="text-[11px] font-bold text-[#F9954E] inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FBEEE7] dark:bg-[#F9954E]/10">
                {t.getItemsFromShop}
              </Link>
            </div>

            {/* 공유 주소(핸들) — 내 AI 페이지/코지홈 주소 */}
            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {t.shareAddressLabel} <span className="font-normal text-stone-400">{t.shareAddressHint}</span>
            </label>
            <div className="flex items-stretch gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[12px] text-stone-400 font-mono shrink-0">illo.im/u/</span>
              <input
                value={handleInput}
                onChange={(e) => handleCheckHandle(e.target.value)}
                maxLength={20}
                placeholder="user04"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40 font-mono lowercase"
              />
              <button
                onClick={handleSaveHandle}
                disabled={handleBusy || !handleInput.trim() || !(handleMsg && handleMsg.ok)}
                className="px-4 rounded-xl bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85 disabled:opacity-50 shrink-0"
              >
                {handleBusy ? "..." : t.save}
              </button>
            </div>
            {handleMsg && (
              <p className={`text-[11px] mb-1 ${handleMsg.ok ? "text-emerald-500" : "text-red-500"}`}>{handleMsg.text}</p>
            )}
            <p className="text-[11px] text-stone-400 mb-4">{t.handleHint}</p>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {t.greetingFieldLabel} <span className="font-normal text-stone-400">{t.greetingFieldHint}</span>
            </label>
            <input
              value={editGreeting}
              onChange={(e) => setEditGreeting(e.target.value)}
              maxLength={60}
              placeholder={t.greetingPlaceholder}
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
            />

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {t.statusMsgLabel}
            </label>
            <input
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              maxLength={80}
              placeholder={t.statusMsgPlaceholder}
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
            />

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {t.bioLabel}
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder={t.bioPlaceholder}
              className="w-full mb-4 px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40"
            />

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.moodLabel} <span className="font-normal text-stone-400">{t.moodHint}</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => setEditMood("")}
                className={`w-9 h-9 rounded-xl text-[12px] font-bold flex items-center justify-center transition-colors ${
                  editMood === "" ? "bg-[#F9954E] text-white" : "bg-stone-100 dark:bg-zinc-900 text-stone-400"
                }`}
              >
                {t.none}
              </button>
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setEditMood(m)}
                  className={`w-9 h-9 rounded-xl text-[18px] flex items-center justify-center transition-transform ${
                    editMood === m ? "bg-[#F9954E]/15 ring-2 ring-[#F9954E] scale-105" : "bg-stone-100 dark:bg-zinc-900"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
              {t.titleLabel} <span className="font-normal text-stone-400">{t.titleHint}</span>
            </label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={24}
              placeholder={t.titlePlaceholder}
              className="w-full mb-2 px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
            />
            {itemsBySlot("title").some((t) => isItemOwned(t)) && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {itemsBySlot("title").filter((t) => isItemOwned(t)).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setEditTitle(t.text || "")}
                    className={`px-2.5 py-1 rounded-full text-[12px] font-bold transition-colors ${
                      editTitle === t.text ? "bg-[#F9954E] text-white" : "bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    {t.text}
                  </button>
                ))}
              </div>
            )}
            {!itemsBySlot("title").some((t) => isItemOwned(t)) && <div className="mb-2" />}

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.colorLabel}
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  aria-label={t.colorAria(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    editColor === c ? "ring-2 ring-offset-2 ring-stone-400 dark:ring-offset-zinc-950 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.frameLabel}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {itemsBySlot("frame").map((f) => (
                <PickTile key={f.id} owned={isItemOwned(f)} selected={editFrame === f.id} price={f.price} label={f.name} onSelect={() => setEditFrame(f.id)}>
                  <div className="w-full h-full flex items-center justify-center bg-stone-50 dark:bg-zinc-900/50">
                    <div className={`w-8 h-8 rounded-full bg-stone-200 dark:bg-zinc-700 ring-offset-2 ring-offset-stone-50 dark:ring-offset-zinc-900 ${frameRingOf(f.id)}`} />
                  </div>
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.bgLabel}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {itemsBySlot("bg").map((p) => (
                <PickTile key={p.id} owned={isItemOwned(p)} selected={editBg === p.id} price={p.price} label={p.name} onSelect={() => setEditBg(p.id)}>
                  <span className={`absolute inset-0 ${p.grad || ""}`} aria-hidden />
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.nameEffectLabel} <span className="font-normal text-stone-400">{t.nameEffectHint}</span>
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {itemsBySlot("nameEffect").map((n) => (
                <PickTile key={n.id} owned={isItemOwned(n)} selected={editNameEffect === n.id} price={n.price} label={n.name} onSelect={() => setEditNameEffect(n.id)}>
                  <div className="w-full h-full flex items-center justify-center bg-stone-50 dark:bg-zinc-900/50">
                    <span className={`text-[17px] font-extrabold ${n.nameClass || "text-stone-700 dark:text-white"}`}>{t.namePreview}</span>
                  </div>
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.bannerEffectLabel} <span className="font-normal text-stone-400">{t.bannerEffectHint}</span>
            </label>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {itemsBySlot("bannerEffect").map((b) => (
                <PickTile key={b.id} owned={isItemOwned(b)} selected={editBannerEffect === b.id} price={b.price} label={b.name} onSelect={() => setEditBannerEffect(b.id)}>
                  <span className="absolute inset-0 bg-gradient-to-br from-[#F9954E]/15 to-sky-400/10" aria-hidden />
                  {b.fx && b.fx !== "none" ? (
                    <BannerFx fx={b.fx} count={5} />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-stone-400">{t.none}</span>
                  )}
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.petLabel} <span className="font-normal text-stone-400">{t.petHint}</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setEditPet("")}
                className={`relative h-16 rounded-xl border overflow-hidden flex items-center justify-center text-[11px] font-bold transition-all ${
                  editPet === "" ? "border-[#F9954E] ring-1 ring-[#F9954E]/50 text-[#F9954E]" : "border-stone-100 dark:border-zinc-900 text-stone-400"
                }`}
              >
                {t.none}
              </button>
              {itemsBySlot("pet").map((p) => (
                <PickTile key={p.id} owned={isItemOwned(p)} selected={editPet === p.id} price={p.price} label={p.name} onSelect={() => setEditPet(p.id)}>
                  <div className="w-full h-full flex items-center justify-center text-[28px] bg-stone-50 dark:bg-zinc-900/50">{p.emoji}</div>
                </PickTile>
              ))}
            </div>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.interestsLabel} <span className="font-normal text-stone-400">{t.interestsHint}</span>
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
                placeholder={t.interestInputPlaceholder}
                className="flex-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[13px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40"
              />
              <button
                onClick={() => { toggleInterest(interestInput); setInterestInput(""); }}
                className="px-4 rounded-xl bg-stone-200 dark:bg-zinc-800 text-stone-700 dark:text-stone-200 text-[13px] font-bold active:opacity-85"
              >
                {t.addBtn}
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
                      on ? "bg-[#F9954E] text-white" : "bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>

            <label className="block text-[12px] font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {t.stickerLabel} <span className="font-normal text-stone-400">{t.stickerHint}</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {Array.from(new Set([...STICKER_CHOICES, ...itemsBySlot("sticker").filter((s) => isItemOwned(s)).map((s) => s.emoji!)])).map((s) => {
                const on = editStickers.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSticker(s)}
                    className={`w-9 h-9 rounded-xl text-[18px] flex items-center justify-center transition-transform ${
                      on ? "bg-[#F9954E]/15 ring-2 ring-[#F9954E] scale-105" : "bg-stone-100 dark:bg-zinc-900"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
              <Link
                href="/shop"
                className="w-9 h-9 rounded-xl text-[16px] flex items-center justify-center bg-stone-100 dark:bg-zinc-900 text-stone-400 border border-dashed border-stone-300 dark:border-zinc-700"
                title={t.getStickersFromShop}
              >
                +
              </Link>
            </div>
            <p className="text-[11px] text-stone-400 mb-5">{t.stickerShopHint}</p>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#F9954E] text-white text-[14px] font-bold active:opacity-85 disabled:opacity-50"
            >
              {saving ? t.saving : t.saveButtonFull}
            </button>
          </div>
        )}

        {/* 3.25) 내가 만든 동물(창작) */}
        {targetUid && <MyAnimalsSection uid={targetUid} isOwner={isOwner} />}

        {/* 3.3) 내가 만든 AI 자랑 */}
        {(isOwner || profile.myAIs.length > 0) && (
          <div className="mt-4 rounded-2xl border border-[#F9954E]/30 dark:border-[#F9954E]/20 bg-white dark:bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] font-extrabold text-stone-900 dark:text-white">{t.myAIsHeading} {profile.myAIs.length > 0 && <span className="text-[#F9954E]">{profile.myAIs.length}</span>}</p>
              {isOwner && (
                <button
                  onClick={() => { setAiEditId(null); setAiForm({ ...EMPTY_AI }); setAiFormOpen((v) => !v); }}
                  className="text-[11px] font-bold text-white bg-[#F9954E] rounded-full px-3 py-1 active:opacity-85"
                >
                  {aiFormOpen ? t.close : t.showOffAI}
                </button>
              )}
            </div>

            {/* 공유 주소(핸들) 안내 — 미설정 시 노출 */}
            {isOwner && !profile.handle && (
              <div className="mb-3 rounded-xl bg-[#FBEEE7] dark:bg-[#F9954E]/5 px-3.5 py-3 text-[12px] text-stone-600 dark:text-stone-300 leading-relaxed">
                {t.handleTip(
                  <button onClick={() => setEditing(true)} className="font-bold text-[#F9954E] underline underline-offset-2">{t.customizeCozyHome}</button>
                )}
              </div>
            )}

            {isOwner && aiFormOpen && (
              <div className="mb-4 rounded-2xl bg-[#FBEEE7] dark:bg-[#F9954E]/5 p-4 space-y-2.5">
                {aiEditId && <p className="text-[11px] font-bold text-[#F9954E]">{t.editingInProgress}</p>}
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
                <input value={aiForm.name} onChange={(e) => setAiForm((f) => ({ ...f, name: e.target.value }))} maxLength={40} placeholder={t.aiNamePlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <input value={aiForm.desc} onChange={(e) => setAiForm((f) => ({ ...f, desc: e.target.value }))} maxLength={300} placeholder={t.aiDescPlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <div className="flex gap-2">
                  <select value={aiForm.category} onChange={(e) => setAiForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-1/2 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40">
                    <option value="">{t.categorySelectPlaceholder}</option>
                    {["챗봇", "그림", "글쓰기", "게임", "교육", "음악", "기타"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={aiForm.tool} onChange={(e) => setAiForm((f) => ({ ...f, tool: e.target.value }))} maxLength={30} placeholder={t.toolPlaceholder}
                    className="w-1/2 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                </div>
                <textarea value={aiForm.body} onChange={(e) => setAiForm((f) => ({ ...f, body: e.target.value }))} maxLength={4000} rows={4} placeholder={t.aiBodyPlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <textarea value={aiForm.howto} onChange={(e) => setAiForm((f) => ({ ...f, howto: e.target.value }))} maxLength={1500} rows={2} placeholder={t.aiHowtoPlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-stone-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <input value={aiForm.tags} onChange={(e) => setAiForm((f) => ({ ...f, tags: e.target.value }))} placeholder={t.aiTagsPlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <input value={aiForm.url} onChange={(e) => setAiForm((f) => ({ ...f, url: e.target.value }))} maxLength={500} placeholder={t.aiUrlPlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[13px] text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <textarea value={aiForm.images} onChange={(e) => setAiForm((f) => ({ ...f, images: e.target.value }))} rows={2} placeholder={t.aiImagesPlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-[12px] text-stone-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40" />
                <div className="flex justify-end gap-2">
                  {aiEditId && (
                    <button onClick={() => { setAiEditId(null); setAiForm({ ...EMPTY_AI }); setAiFormOpen(false); }} className="px-4 py-2 rounded-full bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-stone-300 text-[13px] font-bold active:opacity-85">
                      {t.cancel}
                    </button>
                  )}
                  <button onClick={handleSubmitAI} disabled={aiBusy || !aiForm.name.trim()} className="px-5 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85 disabled:opacity-50">
                    {aiBusy ? t.uploading : aiEditId ? t.editComplete : t.createAIPage}
                  </button>
                </div>
              </div>
            )}

            {profile.myAIs.length === 0 ? (
              <p className="text-[14px] text-stone-500 dark:text-stone-400">
                {isOwner ? t.showOffYourAI : t.noAIYet}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.myAIs.map((ai, i) => (
                  <div key={ai.id || ai.slug || i} className="relative rounded-2xl bg-stone-50 dark:bg-zinc-900 p-4 border border-stone-100 dark:border-zinc-800">
                    <div className="flex items-start gap-3">
                      <span className="w-10 h-10 rounded-xl bg-[#FBEEE7] dark:bg-[#F9954E]/10 flex items-center justify-center text-[22px] shrink-0">{ai.emoji || "🤖"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-extrabold text-stone-900 dark:text-white truncate">{ai.name}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {ai.category && <span className="text-[10px] font-bold text-[#F9954E] bg-[#FBEEE7] dark:bg-[#F9954E]/10 rounded-full px-2 py-0.5">{ai.category}</span>}
                          {ai.tool && <span className="text-[10px] font-bold text-stone-500 bg-stone-100 dark:bg-zinc-800 rounded-full px-2 py-0.5">{ai.tool}</span>}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => startEditAI(ai)} className="text-[11px] text-stone-400 hover:text-[#F9954E] font-bold">{t.edit}</button>
                          <button onClick={() => handleDeleteAI(ai.id)} className="text-[11px] text-stone-400 hover:text-red-500 font-bold">{t.delete}</button>
                        </div>
                      )}
                    </div>
                    {ai.desc && <p className="mt-2.5 text-[13px] text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap break-keep">{ai.desc}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a href={`/u/${profile.handle || profile.uid}/${encodeURIComponent(ai.slug)}`} className="inline-flex items-center gap-1 text-[12px] font-bold text-white bg-[#F9954E] rounded-full px-3 py-1.5 active:opacity-85">
                        {t.aiPageLink}
                      </a>
                      {ai.url && (
                        <a href={ai.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#F9954E] active:opacity-70">
                          {t.tryIt}
                        </a>
                      )}
                      <button onClick={() => copyAiShare(ai)} className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-stone-500 dark:text-stone-400 active:opacity-70">
                        {aiCopied === ai.id ? t.copied : t.share}
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
          <div className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
            <p className="text-[11px] text-[#F9954E] font-bold mb-3">{t.diaryHeading}</p>

            {isOwner && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setDiaryMood((cur) => (cur === m ? "" : m))}
                      className={`w-8 h-8 rounded-lg text-[16px] flex items-center justify-center transition-transform ${
                        diaryMood === m ? "bg-[#F9954E]/15 ring-2 ring-[#F9954E] scale-105" : "bg-stone-100 dark:bg-zinc-900"
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
                  placeholder={t.diaryPlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleAddDiary}
                    disabled={diaryBusy || !diaryInput.trim()}
                    className="px-4 py-2 rounded-full bg-[#F9954E] text-white text-[13px] font-bold active:opacity-85 disabled:opacity-50"
                  >
                    {diaryBusy ? t.posting : t.addDiary}
                  </button>
                </div>
              </div>
            )}

            {profile.diary.length === 0 ? (
              <p className="text-[14px] text-stone-500 dark:text-stone-400">{t.noDiaryYet}</p>
            ) : (
              <ul className="space-y-2.5">
                {profile.diary.map((e) => (
                  <li key={e.at} className="rounded-xl bg-stone-50 dark:bg-zinc-900 p-3.5 border-l-2 border-[#F9954E]/40">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] text-stone-400">{e.mood && <span className="mr-1 text-[14px]">{e.mood}</span>}{fmtDate(e.at, dateLocale)}</span>
                      {isOwner && (
                        <button onClick={() => handleDeleteDiary(e.at)} className="text-[11px] text-stone-400 hover:text-red-500 font-bold">{t.delete}</button>
                      )}
                    </div>
                    <p className="text-[14px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed break-keep">{e.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 3.6) 내 등급 + 등급표(접이식) */}
        <div className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          {(() => {
            const ct = (Math.min(10, Math.max(1, Number(profile.tier) || 1)) as UserTier);
            const info = TIER_INFO[ct];
            const exp = Number(profile.exp) || 0;
            const curThr = TIER_THRESHOLDS[ct];
            const nextT = ct < 10 ? ((ct + 1) as UserTier) : null;
            const nextThr = nextT ? TIER_THRESHOLDS[nextT] : null;
            const prog = nextThr ? Math.max(0, Math.min(100, ((exp - curThr) / (nextThr - curThr)) * 100)) : 100;
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] text-[#F9954E] font-bold">내 등급</p>
                  <button onClick={() => setTierOpen((v) => !v)} className="text-[11px] font-bold text-stone-400 hover:text-[#F9954E]">
                    {tierOpen ? "접기" : "등급표 보기"}
                  </button>
                </div>

                {/* 현재 등급 요약 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ color: info.color, backgroundColor: `${info.color}1A` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
                    {info.name}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold">{info.description}</span>
                  <span className="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200 tabular-nums">Lv.{profile.level}</span>
                </div>

                {/* 다음 등급까지 진행바 */}
                <div className="mt-2.5">
                  <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-zinc-900 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, backgroundColor: info.color }} />
                  </div>
                  <p className="mt-1 text-[10px] text-stone-400 tabular-nums">
                    {nextThr
                      ? `${TIER_INFO[nextT as UserTier].name}까지 ${Math.max(0, nextThr - exp).toLocaleString()}점 · 현재 ${exp.toLocaleString()}점`
                      : `최고 등급! · ${exp.toLocaleString()}점`}
                  </p>
                </div>

                {/* 등급표 */}
                {tierOpen && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-zinc-900 space-y-0.5">
                    {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as UserTier[]).map((t) => {
                      const ti = TIER_INFO[t];
                      const isMe = t === ct;
                      return (
                        <div key={t} className={`flex items-center gap-2 px-2 py-1 rounded-lg ${isMe ? "bg-[#FBEEE7] dark:bg-[#F9954E]/10" : ""}`}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ti.color }} />
                          <span className="text-[12px] font-bold text-stone-800 dark:text-stone-100">{ti.name}</span>
                          <span className="text-[11px] text-stone-400 truncate">{ti.description}</span>
                          <span className="ml-auto text-[11px] text-stone-400 tabular-nums shrink-0">{TIER_THRESHOLDS[t].toLocaleString()}점</span>
                          {isMe && <span className="text-[10px] font-extrabold text-[#F9954E] shrink-0">●</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* 4) 뱃지 */}
        <div className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">뱃지</p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              🎮 게이머 Lv.{gamerLevel}
            </span>
            {records.length === 0 ? (
              <span className="text-[13px] text-stone-400 dark:text-stone-500">
                기록을 쌓으면 뱃지가 생겨요
              </span>
            ) : (
              records.map((r) => (
                <span
                  key={r.game}
                  className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-stone-100 dark:bg-zinc-900 text-stone-700 dark:text-stone-200"
                >
                  🏅 {r.label}
                </span>
              ))
            )}
          </div>
        </div>

        {/* 4-1) 심리 리포트(심리테스트 결과 뱃지) */}
        {profile?.psychResults && profile.psychResults.length > 0 && (
          <div className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] text-[#F9954E] font-bold">🧩 심리 리포트</p>
              <a href="/psychtest" className="text-[11px] font-bold text-stone-400 hover:text-[#F9954E]">테스트 하러 가기 →</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {profile.psychResults.map((r) => (
                <div key={r.testId} className="flex items-center gap-3 rounded-xl bg-stone-50 dark:bg-zinc-900 p-3">
                  <span className="text-[26px] leading-none shrink-0">{r.emoji}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] text-stone-400 truncate">{r.title}</span>
                    <span className="block text-[13.5px] font-extrabold text-stone-900 dark:text-white truncate">{r.label}</span>
                  </span>
                  {r.sub && <span className="text-[11px] font-bold text-stone-400 tabular-nums shrink-0">{r.sub}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3) 전적 */}
        <div className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">전적</p>
          {records.length === 0 ? (
            <p className="text-[14px] text-stone-500 dark:text-stone-400">아직 기록 없음</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {records.map((r) => (
                <div
                  key={r.game}
                  className="rounded-xl bg-stone-100 dark:bg-zinc-900 p-3.5"
                >
                  <p className="text-[12px] text-stone-500 dark:text-stone-400 mb-1 truncate">{r.label}</p>
                  <p className="text-[18px] font-extrabold text-stone-900 dark:text-white">
                    {r.score.toLocaleString()}
                    <span className="text-[12px] font-bold text-stone-400 ml-1">{r.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6) 본인 피드 */}
        <div className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">최근 글</p>
          {feed.length === 0 ? (
            <p className="text-[14px] text-stone-500 dark:text-stone-400">아직 작성한 글이 없어요</p>
          ) : (
            <ul className="space-y-3">
              {feed.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl bg-stone-100 dark:bg-zinc-900 p-3.5"
                >
                  <p className="text-[14px] text-stone-800 dark:text-stone-100 whitespace-pre-wrap leading-relaxed">
                    {p.text}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-stone-400">
                    {fmtDate(p.at) && <span>{fmtDate(p.at)}</span>}
                    <span>❤️ {p.likeCount.toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 5) 방명록 */}
        <div className="mt-4 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-5">
          <p className="text-[11px] text-[#F9954E] font-bold mb-3">방명록</p>

          {myUid ? (
            <div className="mb-4">
              <textarea
                value={gbMsg}
                onChange={(e) => setGbMsg(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder={isOwner ? "내 코지홈에 한마디" : "방명록을 남겨보세요"}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-900 text-[14px] text-stone-900 dark:text-white outline-none resize-none focus:ring-2 focus:ring-[#F9954E]/40"
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
            <div className="mb-4 rounded-xl bg-stone-100 dark:bg-zinc-900 p-3.5 text-[13px] text-stone-500 dark:text-stone-400">
              방명록을 남기려면{" "}
              <Link href="/login" className="font-bold text-[#F9954E]">
                로그인
              </Link>
              하세요.
            </div>
          )}

          {guestbook.length === 0 ? (
            <p className="text-[14px] text-stone-500 dark:text-stone-400">아직 방명록이 없어요</p>
          ) : (
            <ul className="space-y-3">
              {guestbook.map((g) => (
                <li
                  key={g.id}
                  className="rounded-xl bg-stone-100 dark:bg-zinc-900 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    {g.fromUid ? (
                      <Link href={`/profile?uid=${g.fromUid}`} className="text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate hover:text-[#F9954E] hover:underline">
                        {g.fromName}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate">
                        {g.fromName}
                      </span>
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                      {fmtDate(g.at) && (
                        <span className="text-[11px] text-stone-400">{fmtDate(g.at)}</span>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteGuestbook(g.id)}
                          className="text-[11px] text-stone-400 hover:text-red-500 font-bold"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[14px] text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
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
