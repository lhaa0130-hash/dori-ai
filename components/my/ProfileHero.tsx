"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProfileImageSelector from "./ProfileImageSelector";
import { UserProfile, UserTier, TIER_INFO, calculateLevel, getNextLevelExp, getNextTierExp, getCurrentLevelStartExp, TIER_THRESHOLDS, calculateLevelProgress } from "@/lib/userProfile";

interface ProfileHeroProps {
  profile: UserProfile;
  onImageChange: (imageUrl: string) => void;
  onNicknameChange?: (nickname: string) => void;
  onBioChange?: (bio: string) => void;
  onStatusMessageChange?: (message: string) => void;
  isEditing?: boolean;
  isAdmin?: boolean;
  activityStats?: {
    posts: number;
    comments: number;
    receivedLikes: number;
    guides: number;
  };
}

export default function ProfileHero({
  profile,
  onImageChange,
  onNicknameChange,
  onBioChange,
  onStatusMessageChange,
  isEditing = false,
  isAdmin = false,
  activityStats,
}: ProfileHeroProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 테마 변경 시 강제 리렌더링
  useEffect(() => {
    if (mounted) {
      // 테마 변경 감지 시 강제 업데이트
      setForceUpdate(prev => prev + 1);
    }
  }, [theme, mounted]);

  const isDark = mounted && theme === "dark";

  // 프로필 데이터 안전성 체크
  const safeProfile = {
    tier: profile?.tier || 1,
    doriExp: profile?.doriExp || 0,
    level: profile?.level || 1,
    nickname: profile?.nickname || "사용자",
    bio: profile?.bio || "",
    statusMessage: profile?.statusMessage || "",
    profileImageUrl: profile?.profileImageUrl,
    point: profile?.point || 0,
  };

  const tierInfo = TIER_INFO[safeProfile.tier as UserTier];
  const currentExp = safeProfile.doriExp * 10;
  const currentLevel = safeProfile.level || calculateLevel(currentExp);
  const levelProgress = calculateLevelProgress(currentExp, currentLevel);

  const currentLevelStartExp = getCurrentLevelStartExp(currentLevel);
  const nextLevelExpRequired = getNextLevelExp(currentLevel);
  const nextLevelStartExp = currentLevelStartExp + nextLevelExpRequired;
  const remainingExp = Math.max(0, nextLevelStartExp - currentExp);
  const currentLevelExp = Math.max(0, currentExp - currentLevelStartExp);

  const nextTierExp = getNextTierExp(safeProfile.tier as UserTier, safeProfile.doriExp);

  if (!mounted) {
    return <div className="min-h-[200px]" />;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[2.5rem] border p-8 md:p-12 transition-all duration-500 hover:-translate-y-1 ${isDark
        ? "bg-zinc-900/40 border-zinc-800 shadow-2xl shadow-orange-950/20"
        : "bg-white/80 border-neutral-200 shadow-xl shadow-[#F9954E]/5"
        } backdrop-blur-xl shadow-input`}
    >
      {/* Background Decorative Element */}
      <div className={`absolute -top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none opacity-20 ${isDark ? "bg-orange-500/20" : "bg-[#F9954E]/10"
        }`} />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-12 items-start md:items-center">
        {/* Profile Image Section */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <ProfileImageSelector
            currentImageUrl={safeProfile.profileImageUrl}
            onImageChange={onImageChange}
          />
        </div>

        {/* Info Section */}
        <div className="flex-1 w-full text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {safeProfile.nickname}
            </h1>

            <div className="flex items-center gap-2">
              <Link
                href="/my/edit"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${isDark
                  ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                  : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                  }`}
              >
                <span>✏️</span>
                <span>편집</span>
              </Link>

              {isAdmin && (
                <span className="px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          {/* Badge & Level Row */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
            <div
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 font-bold text-sm shadow-sm"
              style={{
                borderColor: `${tierInfo.color}60`,
                backgroundColor: isDark ? `${tierInfo.color}15` : `${tierInfo.color}10`,
                color: tierInfo.color,
                boxShadow: `0 0 20px ${tierInfo.color}20`
              }}
            >
              <span className="animate-pulse">⭐</span>
              <span>{tierInfo.name}</span>
              <span className="opacity-30">|</span>
              <span className="bg-white/10 px-2.5 py-0.5 rounded-lg text-xs">Lv.{currentLevel}</span>
            </div>

            <div className={`px-5 py-2 rounded-full border text-sm font-bold ${isDark ? "bg-zinc-800/50 border-zinc-700 text-zinc-400" : "bg-neutral-50 border-neutral-100 text-neutral-500"
              }`}>
              ID: {profile.email.split('@')[0]}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 mb-8 group">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-widest mb-1.5">DORI EXP</span>
              <span className="text-3xl font-black bg-gradient-to-r from-[#F9954E] to-[#E8832E] bg-clip-text text-transparent italic">
                {safeProfile.doriExp.toLocaleString()}
              </span>
            </div>

            <div className={`h-10 w-px ${isDark ? "bg-zinc-800" : "bg-neutral-200"} hidden sm:block`} />

            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-widest mb-1.5">POINTS</span>
              <span className="text-3xl font-black bg-gradient-to-r from-[#F9954E] to-[#E8832E] bg-clip-text text-transparent">
                {safeProfile.point.toLocaleString()}
              </span>
            </div>

            {activityStats && (
              <>
                <div className={`h-10 w-px ${isDark ? "bg-zinc-800" : "bg-neutral-200"} hidden lg:block`} />
                <div className="flex gap-8">
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-widest mb-1.5">POSTS</span>
                    <span className={`text-xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{activityStats.posts}</span>
                  </div>
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-zinc-500 tracking-widest mb-1.5">COMMENTS</span>
                    <span className={`text-xl font-bold ${isDark ? "text-white" : "text-neutral-900"}`}>{activityStats.comments}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Intro Text */}
          <div className={`relative p-6 rounded-3xl border ${isDark ? "bg-black/20 border-zinc-800/50" : "bg-neutral-50/50 border-neutral-100"
            }`}>
            <p className={`text-sm md:text-base leading-relaxed font-medium ${isDark ? "text-zinc-400" : "text-neutral-600"}`}>
              {safeProfile.bio || "새로운 AI 시대를 함께 열어가는 DORI AI 크리에이터입니다."}
            </p>
            {safeProfile.statusMessage && (
              <p className="mt-3 text-sm font-bold text-[#E8832E]">
                💬 {safeProfile.statusMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RPG Style EXP Bar Section */}
      <div className="mt-16">
        <div className="flex justify-between items-end mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/10 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <div>
              <span className="block text-[10px] font-bold text-neutral-400 dark:text-zinc-500 tracking-widest uppercase">Growth Progress</span>
              <span className="block text-lg font-black text-neutral-900 dark:text-white">LEVEL {currentLevel}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
              {currentLevel < 100 ? `Next Level: ${currentLevel + 1}` : 'Max Level'}
            </span>
            <span className="block text-base font-black text-[#F9954E]">
              {Math.floor(currentLevelExp).toLocaleString()} / {Math.floor(nextLevelExpRequired).toLocaleString()} XP
            </span>
          </div>
        </div>

        {/* The Animated Bar */}
        <div className={`relative h-8 rounded-full border-2 overflow-hidden shadow-inner ${isDark
          ? "bg-zinc-950 border-zinc-800/50"
          : "bg-neutral-100 border-neutral-200"
          }`}>
          {/* Progress Fill */}
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out animate-pulse-subtle"
            style={{
              width: `${Math.min(Math.max(levelProgress, 0), 100)}%`,
              background: "linear-gradient(90deg, #F9954E, #FBAA60, #F9954E)",
              backgroundSize: "200% 100%",
              boxShadow: "0 0 30px rgba(249, 149, 78, 0.5)"
            }}
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>

          {/* Percentage Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-black tracking-[0.2em] text-white drop-shadow-md">
              {Math.round(levelProgress)}% COMPLETED
            </span>
          </div>
        </div>

        {/* Bottom Legend */}
        {remainingExp > 0 && currentLevel < 100 && (
          <p className="mt-4 text-center text-[11px] font-bold text-neutral-400 dark:text-zinc-500 tracking-widest">
            {Math.ceil(remainingExp).toLocaleString()} MORE XP TO REACH THE NEXT STAGE
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-pulse-subtle {
          animation: pulse 4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

