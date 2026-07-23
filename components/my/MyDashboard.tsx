"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import ProfileHero from "@/components/my/ProfileHero";
import { UserProfile, createDefaultProfile, calculateTier, calculateLevel, ACTIVITY_SCORES } from "@/lib/userProfile";
import { claimDailyAttendance } from "@/lib/claimReward";
import CottonCandy from "@/components/icons/CottonCandy";
import { Bell, ChevronRight } from "lucide-react";
import { watchNotifications } from "@/lib/social";
import {
  getCottonCandyBalance,
  getCachedGameProfile,
  ensureExpAtLeast,
  getTodayEarned,
  getMonthEarned,
  getCottonCandyHistory,
  getAttendanceData,
  hydrateGameData,
  isMissionCompletedToday,
  completeMission,
  ACHIEVEMENTS,
  getClaimedAchievements,
  claimAchievement,
  checkNewAchievements,
  type AchievementStats,
  type CottonCandyHistoryEntry,
} from "@/lib/cottonCandy";

const T = {
  ko: {
    loadingUser: "사용자 정보를 불러오는 중입니다",
    loginRequiredTitle: "로그인이 필요해요",
    loginRequiredL1: "마이페이지는 로그인 후",
    loginRequiredL2: "이용하실 수 있습니다.",
    goLogin: "로그인하러 가기",
    loadingProfile: "프로필을 로드하는 중입니다",
    userNotFound: "사용자 정보를 찾을 수 없습니다.",
    reLogin: "다시 로그인하기",
    toastPrefix: "🏆 업적 달성!",
    missionAlreadyDone: "오늘 이미 완료한 미션입니다!",
    attendanceDoneToast: "출석 체크 완료!",
    attendanceFailToast: "출석 처리에 실패했어요. 잠시 후 다시 시도해 주세요.",
    missionDone: (label: string) => `${label} 완료!`,
    eyebrow: "계정 · 활동",
    pageTitle: "내 프로필",
    pageSubtitle: "나의 활동과 프로필 정보를 관리합니다.",
    notifications: "알림",
    notiUnread: (n: number) => `읽지 않은 알림 ${n}개`,
    notiDefault: "친구 요청·좋아요·댓글·방명록·메시지를 한곳에서",
    myCandy: "내 솜사탕",
    unitPiece: "개",
    todayLabel: "오늘 획득: ",
    monthLabel: "이번 달: ",
    streakLabel: "연속 출석: ",
    streakUnit: (n: number) => `${n}일`,
    viewHistory: "획득 내역 보기",
    pointShop: "포인트 상점 →",
    activityHistory: "활동 히스토리",
    tabPosts: "작성한 글",
    tabComments: "댓글 내역",
    tabSparked: "받은 유레카",
    tabBookmarked: "북마크",
    tabRecent: "최근 본 글",
    tabMissions: "미션/업적",
    tabCandyHistory: "포인트 내역",
    dailyMissions: "일일 미션",
    resetDaily: "매일 자정 초기화",
    doneBadge: "✓ 완료",
    claim: "받기",
    achievements: "업적",
    achievementProgress: (claimed: number, total: number) => `${claimed}/${total} 달성`,
    noCandyHistory: "아직 솜사탕 내역이 없네요!",
    noCandyHistoryHint: "미션을 완료하고 솜사탕을 모아보세요.",
    dateLocale: "ko-KR",
    noActivity: "아직 활동 정보가 없네요!",
    firstPost: "첫 게시글 작성하러 가기 →",
    freeTag: "자유",
  },
  en: {
    loadingUser: "Loading your info",
    loginRequiredTitle: "Log in required",
    loginRequiredL1: "Log in to access",
    loginRequiredL2: "your My Page.",
    goLogin: "Go to log in",
    loadingProfile: "Loading your profile",
    userNotFound: "Couldn't find your user info.",
    reLogin: "Log in again",
    toastPrefix: "🏆 Achievement unlocked!",
    missionAlreadyDone: "You've already completed this mission today!",
    attendanceDoneToast: "Check-in complete!",
    attendanceFailToast: "Check-in failed. Please try again in a moment.",
    missionDone: (label: string) => `${label} complete!`,
    eyebrow: "Account · Activity",
    pageTitle: "My profile",
    pageSubtitle: "Manage your activity and profile info.",
    notifications: "Notifications",
    notiUnread: (n: number) => `${n} unread notification${n === 1 ? "" : "s"}`,
    notiDefault: "Friend requests, likes, comments, guestbook, and messages in one place",
    myCandy: "My cotton candy",
    unitPiece: "",
    todayLabel: "Today: ",
    monthLabel: "This month: ",
    streakLabel: "Streak: ",
    streakUnit: (n: number) => `${n} day${n === 1 ? "" : "s"}`,
    viewHistory: "View history",
    pointShop: "Point shop →",
    activityHistory: "Activity history",
    tabPosts: "Posts",
    tabComments: "Comments",
    tabSparked: "Eureka received",
    tabBookmarked: "Bookmarks",
    tabRecent: "Recently viewed",
    tabMissions: "Missions/Achievements",
    tabCandyHistory: "Point history",
    dailyMissions: "Daily missions",
    resetDaily: "Resets daily at midnight",
    doneBadge: "✓ Done",
    claim: "Claim",
    achievements: "Achievements",
    achievementProgress: (claimed: number, total: number) => `${claimed}/${total} unlocked`,
    noCandyHistory: "No cotton candy history yet!",
    noCandyHistoryHint: "Complete missions to start earning cotton candy.",
    dateLocale: "en-US",
    noActivity: "No activity yet!",
    firstPost: "Write your first post →",
    freeTag: "General",
  },
} as const;

// 솜사탕 내역 사유는 한글 그대로 저장된다(기존 회원 데이터와 맞춰야 하므로 값은 불변).
// 영어판에서는 '표시할 때만' 옮긴다. 이미 쌓인 내역도 그대로 영어로 보인다.
const REASON_PREFIX_EN: [RegExp, (rest: string) => string][] = [
  [/^업적 달성: (.+)$/, (n) => `Achievement: ${ACHIEVEMENT_NAME_EN[n] || n}`],
  [/^미션 완료: (.+)$/, (n) => `Mission complete: ${MISSION_NAME_EN[n] || n}`],
  [/^상점 구매: (.+)$/, (n) => `Shop purchase: ${n}`],
  [/^레벨 (\d+) 달성 보상$/, (n) => `Level ${n} reward`],
  [/^출석 체크 \((\d+)일 연속 보너스 포함\)$/, (n) => `Daily check-in (${n}-day streak bonus)`],
  [/^출석 체크$/, () => "Daily check-in"],
];
const ACHIEVEMENT_NAME_EN: Record<string, string> = {
  "첫 방문": "First visit", "첫 글쓰기": "First post", "댓글왕": "Comment king",
  "3일 연속 출석": "3-day streak", "7일 연속 출석": "7-day streak", "한 달 개근": "Perfect month",
  "인기쟁이": "Crowd pleaser", "게임왕": "Game king", "퀴즈마스터": "Quiz master", "레벨 10 달성": "Level 10",
};
const MISSION_NAME_EN: Record<string, string> = {
  "출석 체크": "Daily check-in", "트렌드 기사 읽기": "Read a trend article",
  "커뮤니티 글쓰기": "Write a community post", "댓글 달기": "Leave a comment",
  "미니게임 1판": "Play a minigame", "AI 퀴즈 풀기": "Solve an AI quiz",
};
function reasonLabel(reason: string, isEn: boolean): string {
  if (!isEn) return reason;
  for (const [re, fmt] of REASON_PREFIX_EN) {
    const m = reason.match(re);
    if (m) return fmt(m[1] ?? "");
  }
  return reason; // 매칭 안 되면 원문 유지(새 사유가 생겨도 깨지지 않게)
}

export default function MyDashboard() {
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const t = T[isEn ? "en" : "ko"];
  const { session, status, update } = useAuth();
  const user = session?.user || null;
  const { theme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [sparkedPosts, setSparkedPosts] = useState<any[]>([]);
  const [myComments, setMyComments] = useState<any[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [unreadNoti, setUnreadNoti] = useState(0);

  // 알림 미읽음 개수 실시간 구독 (마이페이지 전용)
  useEffect(() => {
    if (!user) { setUnreadNoti(0); return; }
    const unsub = watchNotifications((items) => setUnreadNoti(items.filter((n) => !n.read).length));
    return () => unsub();
  }, [user]);
  const ADMIN_EMAILS = ["admin@dori.ai", "lhaa0130@gmail.com"];
  const isAdmin = !!(user && user.email && (ADMIN_EMAILS.some(email => email.toLowerCase() === user.email.toLowerCase()) || (user as any)?.isAdmin === true));

  // 솜사탕 시스템 state
  const [candyBalance, setCandyBalance] = useState(0);
  const [todayEarned, setTodayEarned] = useState(0);
  const [monthEarned, setMonthEarned] = useState(0);
  const [candyHistory, setCandyHistory] = useState<CottonCandyHistoryEntry[]>([]);
  const [claimedAchievements, setClaimedAchievements] = useState<string[]>([]);
  const [achievementToast, setAchievementToast] = useState<{ name: string; reward: number } | null>(null);
  const [attendanceStreak, setAttendanceStreak] = useState(0);
  const [attendanceDone, setAttendanceDone] = useState(false);
  const claimingRef = useRef(false); // 출석 동기 중복 클릭 가드
  // Firestore 동기화(다른 기기 로그인 등) 완료 시 화면 갱신용 트리거
  const [syncTick, setSyncTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = () => setSyncTick((t) => t + 1);
    window.addEventListener("dori-gamedata-synced", onSync);
    return () => window.removeEventListener("dori-gamedata-synced", onSync);
  }, []);

  // 일일 미션 정의
  const DAILY_MISSIONS = [
    { id: "attendance", label: "출석 체크", labelEn: "Daily check-in", reward: 50, emoji: "📅" },
    { id: "read_trend", label: "트렌드 기사 읽기", labelEn: "Read a trend article", reward: 30, emoji: "📰" },
    { id: "write_post", label: "커뮤니티 글쓰기", labelEn: "Write a community post", reward: 80, emoji: "📝" },
    { id: "write_comment", label: "댓글 달기", labelEn: "Leave a comment", reward: 30, emoji: "💬" },
    { id: "play_minigame", label: "미니게임 1판", labelEn: "Play a minigame", reward: 40, emoji: "🎮" },
    { id: "quiz_correct", label: "AI 퀴즈 풀기", labelEn: "Solve an AI quiz", reward: 50, emoji: "🧠" },
  ];

  useEffect(() => setMounted(true), []);

  // 솜사탕 데이터 로드
  const loadCandyData = useCallback(() => {
    if (!user?.email) return;
    const email = user.email;
    setCandyBalance(getCottonCandyBalance(email));
    setTodayEarned(getTodayEarned(email));
    setMonthEarned(getMonthEarned(email));
    setCandyHistory(getCottonCandyHistory(email).slice(0, 30));
    setClaimedAchievements(getClaimedAchievements(email));
    const att = getAttendanceData(email);
    setAttendanceStreak(att.streak || 0);
    const today = new Date().toISOString().split("T")[0];
    setAttendanceDone(att.lastChecked === today);
  }, [user?.email]);

  useEffect(() => {
    if (mounted && user?.email) {
      loadCandyData();
    }
  }, [mounted, user?.email, loadCandyData, syncTick]);

  // 업적 자동 체크
  useEffect(() => {
    if (!mounted || !user?.email || !profile) return;
    const email = user.email;
    const stats: AchievementStats = {
      totalPosts: myPosts.length,
      totalComments: myComments.length,
      totalReceivedLikes: myPosts.reduce((a, p) => a + (p.sparks || p.likes || 0), 0),
      streak: attendanceStreak,
      totalAttendanceDays: getAttendanceData(email).totalDays || 0,
      level: profile.level || 1,
      minigamePlays: parseInt(localStorage.getItem(`dori_minigame_plays_${email}`) || "0", 10),
      quizCorrect: parseInt(localStorage.getItem(`dori_quiz_correct_${email}`) || "0", 10),
      cottonCandyTotal: candyBalance,
    };
    const newAchievements = checkNewAchievements(email, stats);
    if (newAchievements.length > 0) {
      newAchievements.forEach((ach) => {
        const reward = claimAchievement(email, ach.id);
        if (reward > 0) {
          setAchievementToast({ name: isEn ? ach.nameEn : ach.name, reward });
          setTimeout(() => setAchievementToast(null), 4000);
        }
      });
      loadCandyData();
    }
  }, [mounted, user?.email, profile, myPosts, myComments, attendanceStreak, candyBalance, loadCandyData]);

  // 미션 완료 처리
  const handleMissionClaim = (missionId: string, reward: number, label: string, displayLabel?: string) => {
    if (!user?.email) return;
    const done = completeMission(user.email, missionId, reward, `미션 완료: ${label}`);
    if (done) {
      loadCandyData(); // 잔액 즉시 갱신
      setAchievementToast({ name: t.missionDone(displayLabel || label), reward });
      setTimeout(() => setAchievementToast(null), 3000);
    } else {
      alert(t.missionAlreadyDone);
    }
  };

  // 출석 체크 = 신뢰 서버 게이트 호출. 클라이언트가 재화를 직접 올리지 않는다.
  const handleAttendance = async () => {
    if (!user?.email || attendanceDone || claimingRef.current) return;
    claimingRef.current = true;
    try {
      const r = await claimDailyAttendance();
      if (r.status === "granted") {
        setAttendanceDone(true);
        await hydrateGameData();     // 서버 원본 → localStorage 표시 캐시
        loadCandyData();             // 스트릭·완료·잔액 표시 갱신
        setAchievementToast({ name: t.attendanceDoneToast, reward: r.cottonCandy });
        setTimeout(() => setAchievementToast(null), 3000);
      } else if (r.status === "already_claimed" || r.status === "legacy_recognized") {
        setAttendanceDone(true);
        await hydrateGameData();
        loadCandyData();
      } else {
        setAchievementToast({ name: t.attendanceFailToast, reward: 0 });
        setTimeout(() => setAchievementToast(null), 3000);
      }
    } finally {
      claimingRef.current = false;
    }
  };

  // 프로필 데이터 로드 및 초기화
  useEffect(() => {
    if (!mounted || status === 'loading') return;
    if (!user || !user.email) return;
    if (typeof window === 'undefined') return;

    try {
      const savedName = localStorage.getItem(`dori_user_name_${user.email}`);
      const savedBio = localStorage.getItem(`dori_user_bio_${user.email}`);
      const savedStatusMessage = localStorage.getItem(`dori_status_${user.email}`);
      const savedImageUrl = localStorage.getItem(`dori_image_${user.email}`);

      const nickname = savedName || user.name || "사용자";
      const bio = savedBio || "";
      const statusMessage = savedStatusMessage || "";
      const profileImageUrl = savedImageUrl || undefined;

      // 티어/레벨/경험치/솜사탕은 Firestore(서버) 값을 사용 — 기기 무관 동일
      const game = getCachedGameProfile(user.email);
      const base = createDefaultProfile(user.email, user.email, nickname);
      setProfile({
        ...base,
        nickname,
        bio,
        statusMessage,
        profileImageUrl,
        tier: (game?.tier as UserProfile["tier"]) || base.tier,
        level: game?.level || base.level,
        doriExp: game?.doriExp || 0,
        cottonCandy: getCottonCandyBalance(user.email),
      });
      if (!savedName) {
        localStorage.setItem(`dori_user_name_${user.email}`, nickname);
      }
    } catch (error) {
      console.error('프로필 로드 중 오류:', error);
    }
  }, [mounted, status, user?.email, user?.name, syncTick]);

  // 활동 데이터 로드 및 점수 계산
  useEffect(() => {
    if (!mounted || status === 'loading') return;
    if (!user || !user.email || !profile) return;
    if (typeof window === 'undefined') return;

    try {
      const currentName = profile.nickname || (user && user.name) || "";

      // 데이터 불러오기
      const savedPostsStr = localStorage.getItem("dori_community_posts") || "[]";
      const mySparksIdsStr = localStorage.getItem("dori_liked_community_posts") || "[]";

      const savedPosts = JSON.parse(savedPostsStr);
      const mySparksIds = JSON.parse(mySparksIdsStr);

      if (!Array.isArray(savedPosts) || !Array.isArray(mySparksIds)) {
        console.error('Invalid data format');
        return;
      }

      // 1. 내가 쓴 글 필터링
      const mine = savedPosts.filter((p: any) =>
        p.author === currentName || p.nickname === currentName ||
        p.author === (user && user.name) || p.nickname === (user && user.name)
      );

      // 2. 내가 유레카(좋아요)한 글 필터링
      const sparked = savedPosts.filter((p: any) => mySparksIds.includes(String(p.id)));

      // 3. 내가 작성한 댓글 수집
      const comments: any[] = [];
      savedPosts.forEach((post: any) => {
        if (post.commentsList && Array.isArray(post.commentsList)) {
          post.commentsList.forEach((comment: any) => {
            if (comment.author === currentName || comment.author === (user && user.name)) {
              comments.push({
                ...comment,
                postId: post.id,
                postTitle: post.title,
                postUrl: `/community/${post.id}`,
              });
            }
          });
        }
      });
      comments.sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // 4. 북마크한 게시글
      const bookmarks = JSON.parse(localStorage.getItem(`dori_bookmarks_${user.email}`) || "[]");
      const bookmarked = savedPosts.filter((p: any) => bookmarks.includes(String(p.id)));

      // 5. 최근 본 게시글
      const recentViewIds = JSON.parse(localStorage.getItem(`dori_recent_views_${user.email}`) || "[]");
      const recent = savedPosts
        .filter((p: any) => recentViewIds.includes(String(p.id)))
        .slice(0, 10)
        .map((p: any) => ({ ...p, viewedAt: recentViewIds.indexOf(String(p.id)) }))
        .sort((a: any, b: any) => b.viewedAt - a.viewedAt);

      setMyPosts(mine);
      setSparkedPosts(sparked);
      setMyComments(comments);
      setBookmarkedPosts(bookmarked);
      setRecentViews(recent);

      // 경험치 계산 및 업데이트
      const totalSparks = mine.reduce((acc, p) => acc + (p.sparks || 0), 0);
      const activityExp =
        mine.length * ACTIVITY_SCORES.post +
        comments.length * ACTIVITY_SCORES.comment +
        totalSparks * ACTIVITY_SCORES.receivedLike;

      // 미션 완료 경험치 추가 (프로필에 이미 반영되어 있을 수 있지만, 혹시 모를 경우를 대비)
      const missionExpKey = `dori_mission_exp_${user.email}`;
      const missionExp = parseInt(localStorage.getItem(missionExpKey) || '0', 10);
      const doriExp = activityExp + missionExp;

      // 전역 게임 프로필(헤더/Firestore 동기화 캐시)의 경험치도 함께 고려
      const gp = getCachedGameProfile(user.email);
      const finalDoriExp = Math.max(profile.doriExp || 0, doriExp, gp?.doriExp || 0);

      // 활동 기반 경험치를 전역(헤더·Firestore)에도 백필 — 마이페이지/헤더 수치 일치
      ensureExpAtLeast(user.email, finalDoriExp);

      // 레벨 및 등급 자동 계산 (경험치 기반, raw exp 일관 사용)
      const newTier = calculateTier(finalDoriExp);
      const newLevel = calculateLevel(finalDoriExp);

      // 레벨업이 발생한 경우 프로필 업데이트
      if (profile.doriExp !== finalDoriExp || profile.tier !== newTier || profile.level !== newLevel) {
        const updatedProfile: UserProfile = {
          ...profile,
          doriExp: finalDoriExp,
          tier: newTier,
          level: newLevel, // 자동 레벨업 반영
          cottonCandy: profile.cottonCandy || 0, // cottonCandy 필드 유지
        };
        setProfile(updatedProfile);
        localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error('활동 데이터 로드 중 오류:', error);
    }
  }, [mounted, status, user?.email, user?.name, profile?.nickname, profile?.doriExp, profile?.tier, profile?.level]);

  const getDisplayList = () => {
    switch (activeTab) {
      case "posts": return myPosts;
      case "comments": return myComments;
      case "sparked": return sparkedPosts;
      case "bookmarked": return bookmarkedPosts;
      case "recent": return recentViews;
      default: return myPosts;
    }
  };
  const displayList = getDisplayList() || [];
  const isDark = mounted && theme === 'dark';
  const totalSparks = Array.isArray(myPosts) ? myPosts.reduce((acc, p) => acc + (p.sparks || p.likes || 0), 0) : 0;

  const handleImageChange = (imageUrl: string) => {
    if (!user || !user.email || !profile) return;
    const updated = { ...profile, profileImageUrl: imageUrl };
    setProfile(updated);
    localStorage.setItem(`dori_image_${user.email}`, imageUrl);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));

    // 프로필 이미지 변경 이벤트 발생 (헤더의 AccountMenu가 업데이트되도록)
    window.dispatchEvent(new CustomEvent('profileImageUpdated', {
      detail: { imageUrl, email: user.email }
    }));
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  };

  const handleNicknameChange = async (nickname: string) => {
    if (!user || !user.email || !profile) return;
    const updated = { ...profile, nickname };
    setProfile(updated);
    localStorage.setItem(`dori_user_name_${user.email}`, nickname);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));

    // NextAuth 세션 업데이트 - 모든 기기에서 동기화되도록
    try {
      await update({
        name: nickname,
      });
    } catch (error) {
      console.error("세션 업데이트 실패:", error);
    }
  };

  const handleBioChange = (bio: string) => {
    if (!user || !user.email || !profile) return;
    const updated = { ...profile, bio };
    setProfile(updated);
    localStorage.setItem(`dori_user_bio_${user.email}`, bio);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
  };

  const handleStatusMessageChange = (statusMessage: string) => {
    if (!user || !user.email || !profile) return;
    const updated = { ...profile, statusMessage };
    setProfile(updated);
    localStorage.setItem(`dori_status_${user.email}`, statusMessage);
    localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify(updated));
  };

  // 세션 로딩 중일 때 처리
  if (status === 'loading' || !mounted) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-5" />
          <p className="text-[14px] text-stone-400 font-semibold">{t.loadingUser}</p>
        </div>
      </main>
    );
  }

  // 로그인이 필요한 경우 (세션이 없고 로딩이 완료된 경우)
  if (status === 'unauthenticated' || !session || !session.user || !user || !user.email) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-6">
        <div className="p-10 rounded-3xl bg-white dark:bg-zinc-950 border border-stone-100 dark:border-zinc-900 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-[#FBEEE7] dark:bg-[#F9954E]/10 flex items-center justify-center text-2xl mb-5">
            🔒
          </div>
          <h2 className="text-[20px] font-extrabold text-stone-900 dark:text-white mb-2">{t.loginRequiredTitle}</h2>
          <p className="text-[14px] text-stone-500 dark:text-stone-400 mb-7 leading-relaxed">
            {t.loginRequiredL1}<br />{t.loginRequiredL2}
          </p>
          <Link
            href="/login"
            className="w-full py-3.5 rounded-full bg-[#F9954E] text-white font-bold text-[14px] active:opacity-85 transition-opacity text-center"
          >
            {t.goLogin}
          </Link>
        </div>
      </main>
    );
  }

  // 프로필 데이터 로딩 중
  if (!isAdmin && !profile) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-stone-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-5" />
          <p className="text-[14px] text-stone-400 font-semibold">{t.loadingProfile}</p>
        </div>
      </main>
    );
  }

  // 안전한 activityStats 계산
  const activityStats = {
    posts: Array.isArray(myPosts) ? myPosts.length : 0,
    comments: Array.isArray(myComments) ? myComments.length : 0,
    receivedLikes: totalSparks,
    guides: 0,
  };

  // 최종 안전성 체크: user와 profile이 반드시 존재해야 함
  if (!user || !user.email) {
    return (
      <main className="w-full min-h-screen pt-20 flex flex-col items-center justify-center bg-white dark:bg-black">
        <div className="text-center p-8 bg-stone-50 dark:bg-zinc-900 rounded-3xl border border-stone-200 dark:border-zinc-800 shadow-sm">
          <p className="text-stone-500 dark:text-zinc-400 font-medium mb-6">{t.userNotFound}</p>
          <Link href="/login" className="px-6 py-3 rounded-full bg-[#F9954E] text-white font-bold hover:bg-[#E8832E] transition-all">
            {t.reLogin}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="w-full">
      {/* 업적 달성 토스트 */}
      {achievementToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#F9954E] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2">
          {t.toastPrefix} {achievementToast.name} +{achievementToast.reward} <CottonCandy className="w-4 h-4 inline-block align-[-0.15em]" />
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-2 pb-6 px-6">
        <p className="text-[12px] font-semibold text-[#F9954E] mb-2">{t.eyebrow}</p>
        <h1 className="text-[32px] font-extrabold tracking-tight text-stone-950 dark:text-white mb-1">
          {t.pageTitle}
        </h1>
        <p className="text-[14px] text-stone-500 dark:text-stone-400">
          {t.pageSubtitle}
        </p>
      </section>

      {/* Main Content Area */}
      <section className="max-w-6xl mx-auto px-6 pb-24">

        {/* Profile Details (Hero Component) */}
        {profile && user && (
          <div className="mb-8">
            <ProfileHero
              profile={profile}
              onImageChange={handleImageChange}
              onNicknameChange={handleNicknameChange}
              onBioChange={handleBioChange}
              onStatusMessageChange={handleStatusMessageChange}
              isAdmin={isAdmin}
              activityStats={activityStats}
            />
          </div>
        )}

        {/* ── 내 코지홈 바로가기 (마이페이지 ↔ 코지홈 연동) ── */}
        {/* ── 알림 ── */}
        <Link
          href={isEn ? "/en/notifications" : "/notifications"}
          className="mb-8 flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-stone-100 dark:border-zinc-900 hover:border-[#F9954E]/40 transition-colors group"
        >
          <span className="relative flex-shrink-0 w-11 h-11 rounded-2xl bg-[#FBEEE7] dark:bg-[#F9954E]/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#F9954E]" />
            {unreadNoti > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black leading-none">
                {unreadNoti > 9 ? "9+" : unreadNoti}
              </span>
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-extrabold text-stone-900 dark:text-white">{t.notifications}</p>
            <p className="text-[12.5px] text-stone-500 dark:text-stone-400">
              {unreadNoti > 0 ? t.notiUnread(unreadNoti) : t.notiDefault}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-stone-300 dark:text-zinc-600 group-hover:text-[#F9954E] transition-colors" />
        </Link>

        {/* ── 솜사탕 현황 카드 ── */}
        <div className="mb-8 bg-[#FBEEE7] dark:bg-[#F9954E]/5 rounded-3xl border border-[#F9954E]/20 dark:border-[#F9954E]/10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CottonCandy className="w-7 h-7" />
                <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">{t.myCandy}</h3>
              </div>
              <p className="text-3xl font-extrabold text-[#F9954E]">
                {candyBalance.toLocaleString()}{t.unitPiece}
              </p>
              <div className="flex gap-4 mt-2 text-xs font-bold text-stone-500 dark:text-zinc-400">
                <span>{t.todayLabel}<span className="text-[#F9954E]">+{todayEarned}</span>{t.unitPiece}</span>
                <span>{t.monthLabel}<span className="text-[#F9954E]">+{monthEarned.toLocaleString()}</span>{t.unitPiece}</span>
                {attendanceStreak > 0 && (
                  <span>{t.streakLabel}<span className="text-[#F9954E]">🔥 {t.streakUnit(attendanceStreak)}</span></span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab("candy_history")}
                className="px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800 text-[#F9954E] text-xs font-extrabold hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
              >
                {t.viewHistory}
              </button>
              <Link
                href={isEn ? "/en/shop" : "/shop"}
                className="px-4 py-2 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white text-xs font-extrabold transition-all shadow-sm shadow-orange-500/20"
              >
                {t.pointShop}
              </Link>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-stone-100 dark:border-zinc-900 p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#F9954E] rounded-full" />
              {t.activityHistory}
            </h3>
          </div>

          {/* Refined Tab UI */}
          <div className="flex gap-4 border-b border-stone-100 dark:border-zinc-800 mb-10 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
            {[
              { id: "posts", label: t.tabPosts, count: myPosts.length },
              { id: "comments", label: t.tabComments, count: myComments.length },
              { id: "sparked", label: t.tabSparked, count: sparkedPosts.length },
              { id: "bookmarked", label: t.tabBookmarked, count: bookmarkedPosts.length },
              { id: "recent", label: t.tabRecent, count: recentViews.length },
              { id: "missions", label: t.tabMissions, count: null },
              { id: "candy_history", label: t.tabCandyHistory, count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-3 text-sm font-bold transition-all ${activeTab === tab.id
                  ? "text-[#F9954E]"
                  : "text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-1.5 text-[10px] opacity-50">{tab.count}</span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-[-4px] left-0 w-full h-0.5 bg-[#F9954E] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* ── 미션/업적 탭 ── */}
          {activeTab === "missions" && (
            <div className="space-y-8">
              {/* 일일 미션 */}
              <div>
                <h4 className="text-base font-extrabold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>📋</span> {t.dailyMissions}
                  <span className="text-xs font-medium text-stone-400 dark:text-zinc-500 ml-1">{t.resetDaily}</span>
                </h4>
                <div className="grid gap-3">
                  {DAILY_MISSIONS.map((mission) => {
                    const done = mission.id === "attendance"
                      ? attendanceDone
                      : (user?.email ? isMissionCompletedToday(user.email, mission.id) : false);
                    return (
                      <div
                        key={mission.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          done
                            ? "bg-stone-50 dark:bg-zinc-900 border-stone-200 dark:border-zinc-800"
                            : "bg-white dark:bg-zinc-900/30 border-stone-100 dark:border-zinc-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{mission.emoji}</span>
                          <div>
                            <p className={`text-sm font-bold ${done ? "text-stone-400 dark:text-zinc-500 line-through" : "text-stone-800 dark:text-white"}`}>
                              {isEn ? mission.labelEn : mission.label}
                            </p>
                            <p className="text-[11px] font-extrabold text-[#F9954E] flex items-center gap-1"><CottonCandy className="w-3.5 h-3.5" /> +{mission.reward}</p>
                          </div>
                        </div>
                        {done ? (
                          <span className="text-[#F9954E] text-xs font-extrabold flex items-center gap-1">{t.doneBadge}</span>
                        ) : (
                          <button
                            onClick={() => {
                              if (mission.id === "attendance") {
                                handleAttendance();
                              } else {
                                handleMissionClaim(mission.id, mission.reward, mission.label, mission.labelEn);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white text-xs font-extrabold transition-all active:scale-95"
                          >
                            {t.claim}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 업적 */}
              <div>
                <h4 className="text-base font-extrabold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>🏆</span> {t.achievements}
                  <span className="text-xs font-medium text-stone-400 dark:text-zinc-500 ml-1">{t.achievementProgress(claimedAchievements.length, ACHIEVEMENTS.length)}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ACHIEVEMENTS.map((ach) => {
                    const claimed = claimedAchievements.includes(ach.id);
                    return (
                      <div
                        key={ach.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          claimed
                            ? "bg-[#FBEEE7] dark:bg-[#F9954E]/5 border-[#F9954E]/20 dark:border-[#F9954E]/10"
                            : "bg-white dark:bg-zinc-900/30 border-stone-100 dark:border-zinc-800/50 opacity-60"
                        }`}
                      >
                        <span className="text-2xl">{ach.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-stone-800 dark:text-white">{isEn ? ach.nameEn : ach.name}</p>
                          <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">{isEn ? ach.descriptionEn : ach.description}</p>
                          <p className="text-[11px] font-extrabold text-[#F9954E] flex items-center gap-1"><CottonCandy className="w-3.5 h-3.5" /> +{ach.reward}</p>
                        </div>
                        {claimed && (
                          <span className="text-[#F9954E] text-xs font-extrabold">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── 포인트 내역 탭 ── */}
          {activeTab === "candy_history" && (
            <div className="space-y-2">
              {candyHistory.length === 0 ? (
                <div className="text-center py-20 bg-stone-50/50 dark:bg-zinc-950/20 rounded-3xl border border-dashed border-stone-200 dark:border-zinc-800">
                  <div className="mb-4 opacity-20 flex justify-center"><CottonCandy className="w-9 h-9" /></div>
                  <p className="text-stone-400 dark:text-zinc-500 font-medium">{t.noCandyHistory}</p>
                  <p className="text-xs text-stone-400 dark:text-zinc-600 mt-2">{t.noCandyHistoryHint}</p>
                </div>
              ) : (
                candyHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-zinc-900/30 border-stone-100 dark:border-zinc-800/50"
                  >
                    <div>
                      <p className="text-sm font-bold text-stone-800 dark:text-white">{reasonLabel(entry.reason, isEn)}</p>
                      <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                        {new Date(entry.date).toLocaleString(t.dateLocale, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <span className={`text-sm font-extrabold flex items-center gap-1 ${entry.amount > 0 ? "text-[#F9954E]" : "text-stone-400"}`}>
                      {entry.amount > 0 ? "+" : ""}{entry.amount} <CottonCandy className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── 기존 활동 탭 콘텐츠 ── */}
          {activeTab !== "missions" && activeTab !== "candy_history" && (
            <div className="space-y-4">
              {displayList.length === 0 ? (
                <div className="text-center py-20 bg-stone-50/50 dark:bg-zinc-950/20 rounded-3xl border border-dashed border-stone-200 dark:border-zinc-800">
                  <div className="text-4xl mb-4 opacity-20">📭</div>
                  <p className="text-stone-400 dark:text-zinc-500 font-medium mb-6">{t.noActivity}</p>
                  <Link href={isEn ? "/en/feed" : "/community"} className="text-[#F9954E] font-bold text-sm hover:underline">
                    {t.firstPost}
                  </Link>
                </div>
              ) : activeTab === "comments" ? (
                <div className="grid gap-4">
                  {displayList.map((comment: any) => (
                    <Link
                      href={comment.postUrl || `/community/${comment.postId}`}
                      key={comment.id}
                      className="block group"
                    >
                      <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900/30 border-stone-100 dark:border-zinc-800/50 transition-all duration-300 group-hover:border-[#F9954E]/30 group-hover:shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">{comment.date || 'RECENT'}</span>
                          <span className="text-[10px] font-bold text-[#F9954E] truncate max-w-[200px]">{comment.postTitle}</span>
                        </div>
                        <p className="text-sm text-stone-600 dark:text-zinc-400 leading-relaxed font-medium line-clamp-1">
                          {comment.text || comment.content}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {displayList.map((post: any) => (
                    <Link
                      href={`/community/${post.id}`}
                      key={post.id}
                      className="block group"
                    >
                      <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900/30 border-stone-100 dark:border-zinc-800/50 transition-all duration-300 group-hover:border-[#F9954E]/30 group-hover:shadow-sm flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[#F9954E] text-[9px] font-extrabold uppercase tracking-tighter">
                              {post.tag || t.freeTag}
                            </span>
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tighter">
                              {post.date || 'RECENT'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-stone-900 dark:text-white group-hover:text-[#F9954E] transition-colors line-clamp-1">
                            {post.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-stone-400">
                          <span className="flex items-center gap-1">👀 {post.views || 0}</span>
                          <span className="flex items-center gap-1">⚡ {post.sparks || 0}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
