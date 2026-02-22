"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProfileImageSelector from "./ProfileImageSelector";
import { UserProfile, UserTier, TIER_INFO, calculateLevel, getNextLevelExp, getNextTierExp, getCurrentLevelStartExp, calculateLevelProgress } from "@/lib/userProfile";

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
  isAdmin = false,
  activityStats,
}: ProfileHeroProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    email: profile?.email || "",
  };

  const tierInfo = TIER_INFO[safeProfile.tier as UserTier];
  const currentExp = safeProfile.doriExp * 10;
  const currentLevel = safeProfile.level || calculateLevel(currentExp);
  const levelProgress = calculateLevelProgress(currentExp, currentLevel);

  const currentLevelStartExp = getCurrentLevelStartExp(currentLevel);
  const nextLevelExpRequired = getNextLevelExp(currentLevel);
  const nextLevelStartExp = currentLevelStartExp + nextLevelExpRequired;
  const currentLevelExp = Math.max(0, currentExp - currentLevelStartExp);

  if (!mounted) {
    return <div className="min-h-[300px]" />;
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border p-8 md:p-10 transition-all duration-500 ${isDark
          ? "bg-zinc-900 border-zinc-800 shadow-xl"
          : "bg-white border-neutral-100 shadow-sm"
        }`}
    >
      {/* Background Subtle Gradient */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 pointer-events-none ${isDark ? "bg-orange-500/10" : "bg-[#F9954E]/10"
        }`} />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-start">
        {/* Profile Image Section */}
        <div className="flex-shrink-0">
          <ProfileImageSelector
            currentImageUrl={safeProfile.profileImageUrl}
            onImageChange={onImageChange}
          />
        </div>

        {/* Info Section */}
        <div className="flex-1 w-full text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
            <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              {safeProfile.nickname}
            </h1>

            <div className="flex items-center gap-2">
              <Link
                href="/my/edit"
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-200 ${isDark
                    ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                    : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
              >
                편집
              </Link>
              {isAdmin && (
                <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/20">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-8">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/5 text-[#F9954E] text-xs font-bold border border-orange-100 dark:border-orange-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{tierInfo.name}</span>
              <span className="opacity-20 mx-1">|</span>
              <span>Lv.{currentLevel}</span>
            </div>
            <div className="text-[11px] font-medium text-neutral-400 dark:text-zinc-500">
              ID: {safeProfile.email.split('@')[0]}
            </div>
          </div>

          {/* Intro Text */}
          <div className="mb-8 max-w-2xl mx-auto md:mx-0">
            <p className={`text-sm leading-relaxed font-medium ${isDark ? "text-zinc-400" : "text-neutral-500"}`}>
              {safeProfile.bio || "새로운 AI 시대를 함께 열어가는 DORI AI 크리에이터입니다."}
            </p>
            {safeProfile.statusMessage && (
              <p className="mt-2 text-xs font-bold text-[#F9954E]/80">
                💬 {safeProfile.statusMessage}
              </p>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 border-t border-neutral-100 dark:border-zinc-800 pt-8">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-tighter mb-1">DORI EXP</span>
              <span className="text-xl font-black text-[#F9954E]">
                {safeProfile.doriExp.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-tighter mb-1">POINTS</span>
              <span className="text-xl font-black text-neutral-900 dark:text-white">
                {safeProfile.point.toLocaleString()}
              </span>
            </div>

            {activityStats && (
              <>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-tighter mb-1">POSTS</span>
                  <span className={`text-xl font-black ${isDark ? "text-white" : "text-neutral-900"}`}>{activityStats.posts}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-tighter mb-1">COMMENTS</span>
                  <span className={`text-xl font-black ${isDark ? "text-white" : "text-neutral-900"}`}>{activityStats.comments}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Refined Progress Bar Section */}
      <div className="mt-10 pt-8 border-t border-neutral-50 dark:border-zinc-800/50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-tighter">Level Progress</span>
          <span className="text-[10px] font-bold text-[#F9954E]">
            {Math.floor(currentLevelExp).toLocaleString()} / {Math.floor(nextLevelExpRequired).toLocaleString()} XP ({Math.round(levelProgress)}%)
          </span>
        </div>
        <div className={`relative h-1 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-neutral-100"}`}>
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.min(Math.max(levelProgress, 0), 100)}%`,
              backgroundColor: "#F9954E",
            }}
          />
        </div>
      </div>
    </div>
  );
}
