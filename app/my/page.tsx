"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import ProfileHero from "@/components/my/ProfileHero";
import { UserProfile, createDefaultProfile, calculateTier, calculateLevel, ACTIVITY_SCORES } from "@/lib/userProfile";
import {
  getCottonCandyBalance,
  getTodayEarned,
  getMonthEarned,
  getCottonCandyHistory,
  getAttendanceData,
  checkAttendance,
  isMissionCompletedToday,
  completeMission,
  ACHIEVEMENTS,
  getClaimedAchievements,
  claimAchievement,
  checkNewAchievements,
  type AchievementStats,
  type CottonCandyHistoryEntry,
} from "@/lib/cottonCandy";

export default function MyPage() {
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

  // 일일 미션 정의
  const DAILY_MISSIONS = [
    { id: "attendance", label: "출석 체크", reward: 50, emoji: "📅" },
    { id: "read_trend", label: "트렌드 기사 읽기", reward: 30, emoji: "📰" },
    { id: "write_post", label: "커뮤니티 글쓰기", reward: 80, emoji: "📝" },
    { id: "write_comment", label: "댓글 달기", reward: 30, emoji: "💬" },
    { id: "play_minigame", label: "미니게임 1판", reward: 40, emoji: "🎮" },
    { id: "quiz_correct", label: "AI 퀴즈 풀기", reward: 50, emoji: "🧠" },
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
  }, [mounted, user?.email, loadCandyData]);

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
          setAchievementToast({ name: ach.name, reward });
          setTimeout(() => setAchievementToast(null), 4000);
        }
      });
      loadCandyData();
    }
  }, [mounted, user?.email, profile, myPosts, myComments, attendanceStreak, candyBalance, loadCandyData]);

  // 미션 완료 처리
  const handleMissionClaim = (missionId: string, reward: number, label: string) => {
    if (!user?.email) return;
    const done = completeMission(user.email, missionId, reward, `미션 완료: ${label}`);
    if (done) {
      loadCandyData();
    }
  };

  // 출석 체크
  const handleAttendance = () => {
    if (!user?.email || attendanceDone) return;
    const result = checkAttendance(user.email);
    if (result.success) {
      setAttendanceDone(true);
      loadCandyData();
    }
  };

  // 프로필 데이터 로드 및 초기화
  useEffect(() => {
    if (!mounted || status === 'loading') return;
    if (!user || !user.email) return;
    if (typeof window === 'undefined') return;

    try {
      const savedProfile = localStorage.getItem(`dori_profile_${user.email}`);
      const savedName = localStorage.getItem(`dori_user_name_${user.email}`);
      const savedBio = localStorage.getItem(`dori_user_bio_${user.email}`);
      const savedStatusMessage = localStorage.getItem(`dori_status_${user.email}`);
      const savedImageUrl = localStorage.getItem(`dori_image_${user.email}`);

      const nickname = savedName || user.name || "사용자";
      const bio = savedBio || "";
      const statusMessage = savedStatusMessage || "";
      const profileImageUrl = savedImageUrl || undefined;

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setProfile({
            ...parsed,
            nickname,
            bio,
            statusMessage,
            profileImageUrl,
            cottonCandy: parsed.cottonCandy || parsed.point || 0, // 하위 호환성 유지
          });
        } catch {
          // 파싱 실패 시 기본값 사용
          const defaultProfile = createDefaultProfile(user.email, user.email, nickname);
          setProfile({
            ...defaultProfile,
            bio,
            statusMessage,
            profileImageUrl,
          });
        }
      } else {
        const defaultProfile = createDefaultProfile(user.email, user.email, nickname);
        setProfile({
          ...defaultProfile,
          bio,
          statusMessage,
          profileImageUrl,
        });
        // 프로필이 없으면 localStorage에 저장 (구글 로그인 등으로 자동 회원 등록)
        localStorage.setItem(`dori_profile_${user.email}`, JSON.stringify({
          ...defaultProfile,
          bio,
          statusMessage,
          profileImageUrl,
        }));
        if (!savedName) {
          localStorage.setItem(`dori_user_name_${user.email}`, nickname);
        }
      }
    } catch (error) {
      console.error('프로필 로드 중 오류:', error);
    }
  }, [mounted, status, user?.email, user?.name]);

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

      // 프로필의 doriExp가 더 크면 프로필 값을 우선 사용 (이미 미션 경험치가 반영된 경우)
      const finalDoriExp = Math.max(profile.doriExp || 0, doriExp);

      // 레벨 및 등급 자동 계산 (경험치 기반)
      const newTier = calculateTier(finalDoriExp);
      const newLevel = calculateLevel(finalDoriExp * 10); // 경험치 = EXP * 10

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
      <main className="w-full min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <Header />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FEEBD0]/20 via-[#FFF5EB]/10 to-transparent dark:from-[#8F4B10]/5 pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-neutral-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-6" />
          <p className="text-neutral-500 dark:text-zinc-400 font-bold tracking-tight animate-pulse">
            사용자 정보를 불러오는 중입니다
          </p>
        </div>
      </main>
    );
  }

  // 로그인이 필요한 경우 (세션이 없고 로딩이 완료된 경우)
  if (status === 'unauthenticated' || !session || !session.user || !user || !user.email) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <Header />
        {/* Background Decorative Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FEEBD0]/30 via-[#FFF5EB]/10 to-transparent dark:from-[#8F4B10]/5 pointer-events-none z-0" />

        <div className="relative z-10 p-12 rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/30 backdrop-blur-2xl border border-neutral-200 dark:border-zinc-800 shadow-2xl flex flex-col items-center text-center max-w-sm mx-6">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-2xl mb-6 shadow-glow">
            🔒
          </div>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">서비스 이용 제한</h2>
          <p className="text-sm font-medium text-neutral-500 dark:text-zinc-400 mb-8 leading-relaxed">
            마이페이지는 로그인 후<br />이용하실 수 있습니다.
          </p>
          <Link
            href="/login"
            className="w-full py-4 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-black text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95"
          >
            로그인하러 가기
          </Link>
        </div>
      </main>
    );
  }

  // 프로필 데이터 로딩 중
  if (!isAdmin && !profile) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <Header />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FEEBD0]/20 via-[#FFF5EB]/10 to-transparent dark:from-[#8F4B10]/5 pointer-events-none z-0" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-neutral-100 dark:border-zinc-800 border-t-[#F9954E] rounded-full animate-spin mb-6" />
          <p className="text-neutral-500 dark:text-zinc-400 font-bold tracking-tight animate-pulse">
            프로필을 로드하는 중입니다
          </p>
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
        <Header />
        <div className="text-center p-8 bg-neutral-50 dark:bg-zinc-900 rounded-3xl border border-neutral-200 dark:border-zinc-800 shadow-sm">
          <p className="text-neutral-500 dark:text-zinc-400 font-medium mb-6">사용자 정보를 찾을 수 없습니다.</p>
          <Link href="/login" className="px-6 py-3 rounded-full bg-[#F9954E] text-white font-bold hover:bg-[#E8832E] transition-all">
            다시 로그인하기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-white dark:bg-black transition-colors duration-500 relative">
      <Header />

      {/* Background Decorative Gradient */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

      {/* 업적 달성 토스트 */}
      {achievementToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-2 animate-bounce">
          🏆 업적 달성! {achievementToast.name} +{achievementToast.reward} 🍭
        </div>
      )}

      {/* Hero Section - Simplified Header */}
      <section className="relative pt-32 pb-8 px-6 text-center z-10">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl font-black mb-4 tracking-tighter text-neutral-900 dark:text-white">
            마이페이지
          </h1>
          <div className="w-8 h-1 bg-[#F9954E] rounded-full mb-4" />
          <p className="text-sm font-medium text-neutral-500 dark:text-zinc-400">
            나의 활동과 프로필 정보를 정밀하게 관리합니다.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container max-w-6xl mx-auto px-6 pb-24 relative z-10">

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

        {/* ── 솜사탕 현황 카드 ── */}
        <div className="mb-8 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/30 dark:to-pink-950/20 rounded-[2rem] border border-orange-100 dark:border-orange-900/30 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🍭</span>
                <h3 className="text-lg font-black text-neutral-900 dark:text-white">내 솜사탕</h3>
              </div>
              <p className="text-3xl font-black text-[#F9954E]">
                {candyBalance.toLocaleString()}개
              </p>
              <div className="flex gap-4 mt-2 text-xs font-bold text-neutral-500 dark:text-zinc-400">
                <span>오늘 획득: <span className="text-green-500">+{todayEarned}</span>개</span>
                <span>이번 달: <span className="text-[#F9954E]">+{monthEarned.toLocaleString()}</span>개</span>
                {attendanceStreak > 0 && (
                  <span>연속 출석: <span className="text-amber-500">🔥 {attendanceStreak}일</span></span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab("candy_history")}
                className="px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800 text-[#F9954E] text-xs font-black hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
              >
                획득 내역 보기
              </button>
              <Link
                href="/shop"
                className="px-4 py-2 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white text-xs font-black transition-all shadow-sm shadow-orange-500/20"
              >
                포인트 상점 →
              </Link>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="bg-white/50 dark:bg-zinc-900/30 backdrop-blur-xl rounded-[2.5rem] border border-neutral-200 dark:border-zinc-800/50 p-6 md:p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#F9954E] rounded-full" />
              활동 히스토리
            </h3>
          </div>

          {/* Refined Tab UI */}
          <div className="flex gap-4 border-b border-neutral-100 dark:border-zinc-800 mb-10 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">
            {[
              { id: "posts", label: "작성한 글", count: myPosts.length },
              { id: "comments", label: "댓글 내역", count: myComments.length },
              { id: "sparked", label: "받은 유레카", count: sparkedPosts.length },
              { id: "bookmarked", label: "북마크", count: bookmarkedPosts.length },
              { id: "recent", label: "최근 본 글", count: recentViews.length },
              { id: "missions", label: "미션/업적", count: null },
              { id: "candy_history", label: "포인트 내역", count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative pb-3 text-sm font-bold transition-all ${activeTab === tab.id
                  ? "text-[#F9954E]"
                  : "text-neutral-400 hover:text-neutral-600 dark:text-zinc-500 dark:hover:text-zinc-300"
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
                <h4 className="text-base font-black text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>📋</span> 일일 미션
                  <span className="text-xs font-medium text-neutral-400 dark:text-zinc-500 ml-1">매일 자정 초기화</span>
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
                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30"
                            : "bg-white dark:bg-zinc-900/30 border-neutral-100 dark:border-zinc-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{mission.emoji}</span>
                          <div>
                            <p className={`text-sm font-bold ${done ? "text-neutral-400 dark:text-zinc-500 line-through" : "text-neutral-800 dark:text-white"}`}>
                              {mission.label}
                            </p>
                            <p className="text-[11px] font-black text-[#F9954E]">🍭 +{mission.reward}</p>
                          </div>
                        </div>
                        {done ? (
                          <span className="text-green-500 text-xs font-black flex items-center gap-1">✓ 완료</span>
                        ) : (
                          <button
                            onClick={() => {
                              if (mission.id === "attendance") {
                                handleAttendance();
                              } else {
                                handleMissionClaim(mission.id, mission.reward, mission.label);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white text-xs font-black transition-all active:scale-95"
                          >
                            받기
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 업적 */}
              <div>
                <h4 className="text-base font-black text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>🏆</span> 업적
                  <span className="text-xs font-medium text-neutral-400 dark:text-zinc-500 ml-1">{claimedAchievements.length}/{ACHIEVEMENTS.length} 달성</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ACHIEVEMENTS.map((ach) => {
                    const claimed = claimedAchievements.includes(ach.id);
                    return (
                      <div
                        key={ach.id}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                          claimed
                            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30"
                            : "bg-white dark:bg-zinc-900/30 border-neutral-100 dark:border-zinc-800/50 opacity-60"
                        }`}
                      >
                        <span className="text-2xl">{ach.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-800 dark:text-white">{ach.name}</p>
                          <p className="text-[11px] text-neutral-500 dark:text-zinc-400 truncate">{ach.description}</p>
                          <p className="text-[11px] font-black text-[#F9954E]">🍭 +{ach.reward}</p>
                        </div>
                        {claimed && (
                          <span className="text-amber-500 text-xs font-black">✓</span>
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
                <div className="text-center py-20 bg-neutral-50/50 dark:bg-zinc-950/20 rounded-3xl border border-dashed border-neutral-200 dark:border-zinc-800">
                  <div className="text-4xl mb-4 opacity-20">🍭</div>
                  <p className="text-neutral-400 dark:text-zinc-500 font-medium">아직 솜사탕 내역이 없네요!</p>
                  <p className="text-xs text-neutral-400 dark:text-zinc-600 mt-2">미션을 완료하고 솜사탕을 모아보세요.</p>
                </div>
              ) : (
                candyHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-zinc-900/30 border-neutral-100 dark:border-zinc-800/50"
                  >
                    <div>
                      <p className="text-sm font-bold text-neutral-800 dark:text-white">{entry.reason}</p>
                      <p className="text-[11px] text-neutral-400 dark:text-zinc-500">
                        {new Date(entry.date).toLocaleString("ko-KR", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    <span className={`text-sm font-black ${entry.amount > 0 ? "text-green-500" : "text-red-500"}`}>
                      {entry.amount > 0 ? "+" : ""}{entry.amount} 🍭
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
                <div className="text-center py-20 bg-neutral-50/50 dark:bg-zinc-950/20 rounded-3xl border border-dashed border-neutral-200 dark:border-zinc-800">
                  <div className="text-4xl mb-4 opacity-20">📭</div>
                  <p className="text-neutral-400 dark:text-zinc-500 font-medium mb-6">아직 활동 정보가 없네요!</p>
                  <Link href="/community" className="text-[#F9954E] font-bold text-sm hover:underline">
                    첫 게시글 작성하러 가기 →
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
                      <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900/30 border-neutral-100 dark:border-zinc-800/50 transition-all duration-300 group-hover:border-[#F9954E]/30 group-hover:shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{comment.date || 'RECENT'}</span>
                          <span className="text-[10px] font-bold text-[#F9954E] truncate max-w-[200px]">{comment.postTitle}</span>
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-zinc-400 leading-relaxed font-medium line-clamp-1">
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
                      <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900/30 border-neutral-100 dark:border-zinc-800/50 transition-all duration-300 group-hover:border-[#F9954E]/30 group-hover:shadow-sm flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[#F9954E] text-[9px] font-black uppercase tracking-tighter">
                              {post.tag || "자유"}
                            </span>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                              {post.date || 'RECENT'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors line-clamp-1">
                            {post.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-400">
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

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </main>
  );
}
