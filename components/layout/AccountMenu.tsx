"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { CheckCircle2, Circle, Gift } from 'lucide-react';
import { UserProfile, TIER_INFO, calculateLevel, getNextLevelExp, getNextTierExp, getCurrentLevelStartExp, TIER_THRESHOLDS, calculateLevelProgress } from "@/lib/userProfile";

// 아바타 옵션 (ProfileImageSelector와 동일 - 전체 목록)
const AVATAR_OPTIONS = [
  // 미니멀
  { id: "minimal-1", emoji: "👤", category: "미니멀" },
  { id: "minimal-2", emoji: "👥", category: "미니멀" },
  { id: "minimal-3", emoji: "🧑", category: "미니멀" },
  { id: "minimal-4", emoji: "👨", category: "미니멀" },
  { id: "minimal-5", emoji: "👩", category: "미니멀" },
  { id: "minimal-6", emoji: "🧑‍💼", category: "미니멀" },
  { id: "minimal-7", emoji: "🧑‍🎓", category: "미니멀" },
  { id: "minimal-8", emoji: "🧑‍🔬", category: "미니멀" },
  { id: "minimal-9", emoji: "🧑‍🎨", category: "미니멀" },
  { id: "minimal-10", emoji: "🧑‍💻", category: "미니멀" },
  
  // 캐릭터 (동물 포함)
  { id: "char-1", emoji: "🤖", category: "캐릭터" },
  { id: "char-2", emoji: "🎭", category: "캐릭터" },
  { id: "char-3", emoji: "🦄", category: "캐릭터" },
  { id: "char-4", emoji: "🐱", category: "캐릭터" },
  { id: "char-5", emoji: "🐼", category: "캐릭터" },
  { id: "char-6", emoji: "🐻", category: "캐릭터" },
  { id: "char-7", emoji: "🐨", category: "캐릭터" },
  { id: "char-8", emoji: "🦊", category: "캐릭터" },
  { id: "char-9", emoji: "🐰", category: "캐릭터" },
  { id: "char-10", emoji: "🐯", category: "캐릭터" },
  { id: "char-11", emoji: "🦁", category: "캐릭터" },
  { id: "char-12", emoji: "🐸", category: "캐릭터" },
  { id: "char-13", emoji: "🐷", category: "캐릭터" },
  { id: "char-14", emoji: "🐶", category: "캐릭터" },
  { id: "char-15", emoji: "🦉", category: "캐릭터" },
  
  // 추상
  { id: "abstract-1", emoji: "✨", category: "추상" },
  { id: "abstract-2", emoji: "🌟", category: "추상" },
  { id: "abstract-3", emoji: "💫", category: "추상" },
  { id: "abstract-4", emoji: "🔮", category: "추상" },
  { id: "abstract-5", emoji: "🎨", category: "추상" },
  { id: "abstract-6", emoji: "🎭", category: "추상" },
  { id: "abstract-7", emoji: "🎪", category: "추상" },
  { id: "abstract-8", emoji: "🎬", category: "추상" },
  { id: "abstract-9", emoji: "🎯", category: "추상" },
  { id: "abstract-10", emoji: "🎲", category: "추상" },
  
  // 자연
  { id: "nature-1", emoji: "🌺", category: "자연" },
  { id: "nature-2", emoji: "🌻", category: "자연" },
  { id: "nature-3", emoji: "🌷", category: "자연" },
  { id: "nature-4", emoji: "🌹", category: "자연" },
  { id: "nature-5", emoji: "🌵", category: "자연" },
  { id: "nature-6", emoji: "🌴", category: "자연" },
  { id: "nature-7", emoji: "🌲", category: "자연" },
  { id: "nature-8", emoji: "🍀", category: "자연" },
  { id: "nature-9", emoji: "🌿", category: "자연" },
  { id: "nature-10", emoji: "🌾", category: "자연" },
  
  // 음식
  { id: "food-1", emoji: "🍎", category: "음식" },
  { id: "food-2", emoji: "🍊", category: "음식" },
  { id: "food-3", emoji: "🍋", category: "음식" },
  { id: "food-4", emoji: "🍌", category: "음식" },
  { id: "food-5", emoji: "🍉", category: "음식" },
  { id: "food-6", emoji: "🍇", category: "음식" },
  { id: "food-7", emoji: "🍓", category: "음식" },
  { id: "food-8", emoji: "🍑", category: "음식" },
  { id: "food-9", emoji: "🥝", category: "음식" },
  { id: "food-10", emoji: "🍒", category: "음식" },
  
  // 스포츠 & 활동
  { id: "sports-1", emoji: "⚽", category: "스포츠" },
  { id: "sports-2", emoji: "🏀", category: "스포츠" },
  { id: "sports-3", emoji: "🏈", category: "스포츠" },
  { id: "sports-4", emoji: "⚾", category: "스포츠" },
  { id: "sports-5", emoji: "🎾", category: "스포츠" },
  { id: "sports-6", emoji: "🏐", category: "스포츠" },
  { id: "sports-7", emoji: "🏓", category: "스포츠" },
  { id: "sports-8", emoji: "🏸", category: "스포츠" },
  { id: "sports-9", emoji: "🥊", category: "스포츠" },
  { id: "sports-10", emoji: "🎯", category: "스포츠" },
  
  // 음악 & 예술
  { id: "music-1", emoji: "🎵", category: "음악" },
  { id: "music-2", emoji: "🎶", category: "음악" },
  { id: "music-3", emoji: "🎤", category: "음악" },
  { id: "music-4", emoji: "🎧", category: "음악" },
  { id: "music-5", emoji: "🎸", category: "음악" },
  { id: "music-6", emoji: "🎹", category: "음악" },
  { id: "music-7", emoji: "🥁", category: "음악" },
  { id: "music-8", emoji: "🎺", category: "음악" },
  { id: "music-9", emoji: "🎻", category: "음악" },
  { id: "music-10", emoji: "🎼", category: "음악" },
  
  // 기술 & 과학
  { id: "tech-1", emoji: "💻", category: "기술" },
  { id: "tech-2", emoji: "📱", category: "기술" },
  { id: "tech-3", emoji: "⌚", category: "기술" },
  { id: "tech-4", emoji: "📷", category: "기술" },
  { id: "tech-5", emoji: "🎥", category: "기술" },
  { id: "tech-6", emoji: "🔬", category: "기술" },
  { id: "tech-7", emoji: "🔭", category: "기술" },
  { id: "tech-8", emoji: "⚗️", category: "기술" },
  { id: "tech-9", emoji: "🧪", category: "기술" },
  { id: "tech-10", emoji: "🔧", category: "기술" },
  
  // 여행 & 장소
  { id: "travel-1", emoji: "✈️", category: "여행" },
  { id: "travel-2", emoji: "🚀", category: "여행" },
  { id: "travel-3", emoji: "🚢", category: "여행" },
  { id: "travel-4", emoji: "🚗", category: "여행" },
  { id: "travel-5", emoji: "🚲", category: "여행" },
  { id: "travel-6", emoji: "🏖️", category: "여행" },
  { id: "travel-7", emoji: "🏔️", category: "여행" },
  { id: "travel-8", emoji: "🌋", category: "여행" },
  { id: "travel-9", emoji: "🗻", category: "여행" },
  { id: "travel-10", emoji: "🏕️", category: "여행" },
  
  // 감정 & 표현
  { id: "emotion-1", emoji: "😊", category: "감정" },
  { id: "emotion-2", emoji: "😎", category: "감정" },
  { id: "emotion-3", emoji: "🤩", category: "감정" },
  { id: "emotion-4", emoji: "😍", category: "감정" },
  { id: "emotion-5", emoji: "🥳", category: "감정" },
  { id: "emotion-6", emoji: "😇", category: "감정" },
  { id: "emotion-7", emoji: "🤗", category: "감정" },
  { id: "emotion-8", emoji: "😌", category: "감정" },
  { id: "emotion-9", emoji: "🤔", category: "감정" },
  { id: "emotion-10", emoji: "😏", category: "감정" },
];

interface AccountMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  displayName: string;
  points?: number;
  level?: number;
  onNavigate?: (path: string) => void;
}

export default function AccountMenu({ user, displayName, points = 0, level = 1, onNavigate }: AccountMenuProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMissionsExpanded, setIsMissionsExpanded] = useState(true);
  const [userPoints, setUserPoints] = useState(points);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  
  // 미션 데이터
  const [missions, setMissions] = useState([
    { id: 1, title: "로그인 출석체크", point: 10, isCompleted: false, progress: null },
    { id: 2, title: "글 3개 작성", point: 10, isCompleted: false, progress: { current: 0, total: 3 } },
    { id: 3, title: "댓글 5회 작성", point: 2, isCompleted: false, progress: { current: 0, total: 5 } },
    { id: 4, title: "좋아요 10개", point: 1, isCompleted: false, progress: { current: 0, total: 10 } },
    { id: 5, title: "사이트 공유", point: 10, isCompleted: false, progress: null },
  ]);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // 포인트 업데이트
  useEffect(() => {
    setUserPoints(points);
  }, [points]);

  // 프로필 데이터 로드 (티어, 레벨, DORI EXP, 프로필 이미지)
  useEffect(() => {
    if (!mounted || !user?.email || typeof window === 'undefined') return;

    try {
      const profileKey = `dori_profile_${user.email}`;
      const savedProfile = localStorage.getItem(profileKey);
      const savedImageUrl = localStorage.getItem(`dori_image_${user.email}`);
      
      if (savedProfile) {
        const profile: UserProfile = JSON.parse(savedProfile);
        setUserProfile(profile);
        setUserPoints(profile.point || 0);
        setProfileImageUrl(profile.profileImageUrl || savedImageUrl || undefined);
      } else if (savedImageUrl) {
        setProfileImageUrl(savedImageUrl);
      }
    } catch (e) {
      console.error('프로필 로드 오류:', e);
    }

    // 프로필 업데이트 이벤트 리스너
    const handleProfileUpdate = () => {
      try {
        const profileKey = `dori_profile_${user.email}`;
        const savedProfile = localStorage.getItem(profileKey);
        const savedImageUrl = localStorage.getItem(`dori_image_${user.email}`);
        
        if (savedProfile) {
          const profile: UserProfile = JSON.parse(savedProfile);
          setUserProfile(profile);
          setUserPoints(profile.point || 0);
          setProfileImageUrl(profile.profileImageUrl || savedImageUrl || undefined);
        } else if (savedImageUrl) {
          setProfileImageUrl(savedImageUrl);
        }
      } catch (e) {
        console.error('프로필 업데이트 오류:', e);
      }
    };

    // 프로필 이미지 변경 이벤트 리스너
    const handleProfileImageUpdate = (e: CustomEvent) => {
      try {
        const { imageUrl, email } = e.detail || {};
        if (email === user.email && imageUrl !== profileImageUrl) {
          setProfileImageUrl(imageUrl);
        }
      } catch (e) {
        // 무시
      }
    };

    // 프로필 이미지 변경 감지를 위한 주기적 확인
    const checkProfileImage = () => {
      try {
        const savedImageUrl = localStorage.getItem(`dori_image_${user.email}`);
        const profileKey = `dori_profile_${user.email}`;
        const savedProfile = localStorage.getItem(profileKey);
        
        if (savedProfile) {
          const profile: UserProfile = JSON.parse(savedProfile);
          const currentImage = profile.profileImageUrl || savedImageUrl || undefined;
          if (currentImage !== profileImageUrl) {
            setProfileImageUrl(currentImage);
          }
        } else if (savedImageUrl && savedImageUrl !== profileImageUrl) {
          setProfileImageUrl(savedImageUrl);
        }
      } catch (e) {
        // 무시
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    const imageCheckInterval = setInterval(checkProfileImage, 500);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
      clearInterval(imageCheckInterval);
    };
  }, [mounted, user?.email]);

  // 출석체크 미션은 수동으로 처리하도록 변경 (자동 호출 제거)

  // 미션 진행도 로드 및 업데이트
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    // localStorage에서 미션 진행도 로드
    const loadMissionProgress = () => {
      const { getMissionProgress } = require('@/lib/missionProgress');
      
      setMissions(prev => prev.map(mission => {
        if (mission.id === 1) {
          // 출석체크 미션
          const todayKey = new Date().toISOString().split('T')[0].replace(/-/g, '');
          const checkinKey = `mission_checkin_${todayKey}`;
          const isCompleted = localStorage.getItem(checkinKey) === 'true';
          return { ...mission, isCompleted };
        } else if (mission.id === 2) {
          // 글 작성 미션
          const progress = getMissionProgress('post');
          return { 
            ...mission, 
            progress: { current: Math.min(progress, 3), total: 3 },
            isCompleted: progress >= 3
          };
        } else if (mission.id === 3) {
          // 댓글 작성 미션
          const progress = getMissionProgress('comment');
          return { 
            ...mission, 
            progress: { current: Math.min(progress, 5), total: 5 },
            isCompleted: progress >= 5
          };
        } else if (mission.id === 4) {
          // 좋아요 미션
          const progress = getMissionProgress('like');
          return { 
            ...mission, 
            progress: { current: Math.min(progress, 10), total: 10 },
            isCompleted: progress >= 10
          };
        } else if (mission.id === 5) {
          // 사이트 공유 미션
          const todayKey = new Date().toISOString().split('T')[0].replace(/-/g, '');
          const shareKey = `mission_share_${todayKey}`;
          const isCompleted = localStorage.getItem(shareKey) === 'true';
          return { ...mission, isCompleted };
        }
        return mission;
      }));
    };

    loadMissionProgress();

    // 미션 진행도 업데이트 이벤트 리스너
    const handleMissionUpdate = () => {
      loadMissionProgress();
    };

    // 포인트 추가 이벤트 리스너
    const handlePointsAdded = () => {
      loadMissionProgress();
    };

    // 포인트 업데이트 이벤트 리스너
    const handlePointsUpdated = (e: CustomEvent) => {
      if (e.detail?.points !== undefined) {
        setUserPoints(e.detail.points);
      }
      loadMissionProgress();
    };

    window.addEventListener('missionUpdate', handleMissionUpdate);
    window.addEventListener('pointsAdded', handlePointsAdded as EventListener);
    window.addEventListener('pointsUpdated', handlePointsUpdated as EventListener);

    // 주기적으로 미션 진행도 확인 (1초마다)
    const interval = setInterval(loadMissionProgress, 1000);

    return () => {
      window.removeEventListener('missionUpdate', handleMissionUpdate);
      window.removeEventListener('pointsAdded', handlePointsAdded as EventListener);
      window.removeEventListener('pointsUpdated', handlePointsUpdated as EventListener);
      clearInterval(interval);
    };
  }, [mounted]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const handleThemeToggle = () => {
    if (mounted) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };


  if (!mounted) return null;

  const isDark = theme === 'dark';
  
  // 프로필 정보 계산
  const currentTier = userProfile?.tier || 1;
  const currentLevel = userProfile ? calculateLevel(userProfile.doriExp * 10) : level;
  const doriExp = userProfile?.doriExp || 0;
  const tierInfo = TIER_INFO[currentTier as keyof typeof TIER_INFO];
  const nextTierExp = userProfile ? getNextTierExp(currentTier, doriExp) : 0;
  
  // 레벨 진행도 계산 (공통 함수 사용)
  const currentExp = doriExp * 10;
  const levelProgress = calculateLevelProgress(currentExp, currentLevel);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        }}
        aria-label="Account menu"
        aria-expanded={isOpen}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 overflow-hidden"
          style={{
            background: profileImageUrl?.startsWith("avatar:")
              ? (isDark
                  ? "linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(168, 85, 247, 0.2))"
                  : "linear-gradient(135deg, #eef6ff, #f3e8ff)")
              : profileImageUrl
              ? `url(${profileImageUrl}) center/cover`
              : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}
        >
          {profileImageUrl?.startsWith("avatar:") ? (
            <span style={{ fontSize: '1rem' }}>
              {AVATAR_OPTIONS.find(a => a.id === profileImageUrl.replace("avatar:", ""))?.emoji || "👤"}
            </span>
          ) : profileImageUrl ? null : (
            displayName?.[0]?.toUpperCase() || "U"
          )}
        </div>
        <span
          className="text-sm font-medium hidden sm:block"
          style={{
            color: isDark ? '#ffffff' : '#1d1d1f',
          }}
        >
          {displayName || "사용자"}
        </span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-[340px] rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-150 origin-top-right"
          style={{
            background: isDark
              ? 'rgba(15, 15, 15, 0.95)'
              : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
            boxShadow: isDark
              ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            animation: 'fadeInScale 0.15s ease-out',
          }}
          role="menu"
        >
          <div className="p-3.5">
            {/* Profile Header */}
            <div className="mb-4">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0 overflow-hidden"
                  style={{
                    background: profileImageUrl?.startsWith("avatar:")
                      ? (isDark
                          ? "linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(168, 85, 247, 0.2))"
                          : "linear-gradient(135deg, #eef6ff, #f3e8ff)")
                      : profileImageUrl
                      ? `url(${profileImageUrl}) center/cover`
                      : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  }}
                >
                  {profileImageUrl?.startsWith("avatar:") ? (
                    <span style={{ fontSize: '1.5rem' }}>
                      {AVATAR_OPTIONS.find(a => a.id === profileImageUrl.replace("avatar:", ""))?.emoji || "👤"}
                    </span>
                  ) : profileImageUrl ? null : (
                    displayName?.[0]?.toUpperCase() || "사"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-base font-semibold mb-0.5 truncate"
                    style={{
                      color: isDark ? '#ffffff' : '#1d1d1f',
                    }}
                  >
                    {displayName || "사용자"}
                  </div>
                  <div
                    className="text-xs mb-2 truncate"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {user.email || "user@dori.ai"}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: isDark
                          ? `${tierInfo.color}20`
                          : `${tierInfo.color}15`,
                        color: tierInfo.color,
                        border: `1px solid ${tierInfo.color}40`,
                      }}
                    >
                      {tierInfo.name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                      style={{
                        background: isDark
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(37, 99, 235, 0.1)',
                        color: isDark ? '#93c5fd' : '#2563eb',
                        border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.2)'}`,
                      }}
                    >
                      Lv.{currentLevel}
                    </span>
                    <div
                      className="text-xs font-medium ml-auto"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      포인트 {userPoints.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* DORI EXP 표시 */}
                  <div className="mt-2 mb-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        DORI EXP
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{
                          background: isDark
                            ? 'linear-gradient(135deg, #60a5fa, #a78bfa)'
                            : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {doriExp.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 티어 진행 바 */}
                  {currentTier < 10 && nextTierExp > 0 && (
                    <div className="mt-2 mb-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[10px] font-medium"
                          style={{
                            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          다음 티어까지
                        </span>
                        <span
                          className="text-[10px] font-medium"
                          style={{
                            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          }}
                        >
                          {nextTierExp.toLocaleString()}EXP
                        </span>
                      </div>
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{
                          background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${(() => {
                              if (currentTier >= 10) return 100;
                              const nextTier = (currentTier + 1) as keyof typeof TIER_THRESHOLDS;
                              const nextTierThreshold = TIER_THRESHOLDS[nextTier];
                              const currentTierThreshold = TIER_THRESHOLDS[currentTier as keyof typeof TIER_THRESHOLDS];
                              const progress = ((doriExp - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100;
                              return Math.min(Math.max(progress, 0), 100);
                            })()}%`,
                            background: `linear-gradient(90deg, ${tierInfo.color}, ${TIER_INFO[Math.min(currentTier + 1, 5) as keyof typeof TIER_INFO].color})`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Level Indicator */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        레벨 {currentLevel}
                      </span>
                      <span
                        className="text-[10px] font-medium"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {Math.min(Math.max(Math.round(levelProgress), 0), 100)}%
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(Math.max(levelProgress, 0), 100)}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              <button
                onClick={() => handleNavigate('/my')}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                  fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                }}
              >
                <span className="text-base" style={{ fontSize: '16px' }}>👤</span>
                <span
                  style={{
                    color: isDark ? '#ffffff' : '#1d1d1f',
                    fontSize: '14px',
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                    lineHeight: '1.4',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                  }}
                >
                  내 페이지
                </span>
              </button>
              <div className="w-full">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMissionsExpanded(!isMissionsExpanded);
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative"
                  style={{
                    background: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                    fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span style={{ fontSize: '16px' }}>🎯</span>
                    <span
                      style={{
                        color: isDark ? '#ffffff' : '#1d1d1f',
                        fontSize: '14px',
                        fontWeight: 600,
                        letterSpacing: '-0.015em',
                        lineHeight: '1.4',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility',
                      }}
                    >
                      미션
                    </span>
                  </div>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    className={`transition-transform duration-200 absolute right-4 ${isMissionsExpanded ? 'rotate-180' : ''}`}
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Daily Missions 아코디언 콘텐츠 */}
                {isMissionsExpanded && (
                  <div className="mt-2" style={{ 
                    padding: '8px',
                    background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    borderRadius: '0.75rem',
                  }}>
                    {missions.length > 0 ? (
                      <ul className="space-y-1">
                        {missions.map((mission) => (
                          <li 
                            key={mission.id}
                            className="flex items-center justify-between p-2 rounded-lg transition-all"
                            style={{
                              background: mission.isCompleted 
                                ? (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)')
                                : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                              opacity: mission.isCompleted ? 0.6 : 1,
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {mission.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981' }} />
                              ) : (
                                <Circle className="w-4 h-4 flex-shrink-0" style={{ color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }} />
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span 
                                  className="text-xs font-medium truncate"
                                  style={{
                                    textDecoration: mission.isCompleted ? 'line-through' : 'none',
                                    color: mission.isCompleted 
                                      ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')
                                      : (isDark ? '#ffffff' : '#1d1d1f'),
                                  }}
                                >
                                  {mission.title} {mission.progress ? `(${mission.progress.current}/${mission.progress.total})` : ''}
                                </span>
                                <span 
                                  className="text-[10px] flex items-center gap-1"
                                  style={{
                                    color: isDark ? 'rgba(59, 130, 246, 0.8)' : '#2563eb',
                                  }}
                                >
                                  <Gift className="w-3 h-3" /> 
                                  {mission.progress 
                                    ? `하나당 ${mission.point}EXP (총 ${mission.point * mission.progress.total}EXP)`
                                    : `+${mission.point} EXP`
                                  }
                                </span>
                              </div>
                            </div>
                            
                            {!mission.isCompleted && (
                              <button 
                                className="text-[10px] px-2 py-1 rounded-md transition-colors flex-shrink-0 ml-2"
                                style={{
                                  background: isDark 
                                    ? 'rgba(59, 130, 246, 0.2)' 
                                    : 'rgba(37, 99, 235, 0.1)',
                                  color: isDark ? '#93c5fd' : '#2563eb',
                                }}
                                onClick={async () => {
                                  if (mission.id === 1) {
                                    // 출석체크 미션 처리
                                    try {
                                      const { handleCheckinMission } = require('@/lib/missionProgress');
                                      await handleCheckinMission(user?.email || undefined);
                                      alert('출석체크 완료! +10 EXP를 획득했습니다.');
                                      // 미션 상태 업데이트를 위해 이벤트 발생
                                      window.dispatchEvent(new CustomEvent('missionUpdate'));
                                    } catch (err) {
                                      console.error('출석체크 미션 오류:', err);
                                      alert('출석체크 처리 중 오류가 발생했습니다.');
                                    }
                                  } else if (mission.id === 2 || mission.id === 3 || mission.id === 4) {
                                    // 중간 3개 미션 (글 작성, 댓글 작성, 좋아요)은 커뮤니티 페이지로 이동
                                    handleNavigate('/community');
                                  } else if (mission.id === 5) {
                                    // 사이트 공유 미션 처리
                                    try {
                                      const { handleShareMission } = require('@/lib/missionProgress');
                                      if (navigator.share) {
                                        await navigator.share({
                                          title: 'Dori AI',
                                          text: 'Dori AI를 확인해보세요!',
                                          url: window.location.origin,
                                        });
                                        await handleShareMission();
                                        alert('공유 완료! +10 EXP를 획득했습니다.');
                                        window.dispatchEvent(new CustomEvent('missionUpdate'));
                                      } else {
                                        // 공유 API가 없는 경우 클립보드에 복사
                                        navigator.clipboard.writeText(window.location.origin);
                                        await handleShareMission();
                                        alert('링크가 클립보드에 복사되었습니다! +10 EXP를 획득했습니다.');
                                        window.dispatchEvent(new CustomEvent('missionUpdate'));
                                      }
                                    } catch (err) {
                                      if (err.name !== 'AbortError') {
                                        console.error('공유 미션 오류:', err);
                                      }
                                    }
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = isDark 
                                    ? 'rgba(59, 130, 246, 0.3)' 
                                    : 'rgba(37, 99, 235, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = isDark 
                                    ? 'rgba(59, 130, 246, 0.2)' 
                                    : 'rgba(37, 99, 235, 0.1)';
                                }}
                              >
                                수행하기
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                          style={{
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          <span className="text-lg" style={{ color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }}>∅</span>
                        </div>
                        <p 
                          className="text-xs font-medium"
                          style={{
                            color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                          }}
                        >
                          현재 진행 가능한 미션이 없습니다.
                        </p>
                        <p 
                          className="text-[10px] mt-1"
                          style={{
                            color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          새로운 미션을 기다려주세요!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Menu Groups */}
            <div className="space-y-1">
              {/* Preferences */}
              <div className="mb-2">
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  설정
                </div>
                <button
                  onClick={handleThemeToggle}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{mounted && theme === 'dark' ? '🌙' : '☀️'}</span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      테마
                    </span>
                  </div>
                  <div
                    className="w-10 h-5 rounded-full relative transition-colors duration-200"
                    style={{
                      background: mounted && theme === 'dark'
                        ? 'rgba(59, 130, 246, 0.5)'
                        : 'rgba(251, 191, 36, 0.5)',
                    }}
                  >
                    <div
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 bg-white shadow-sm"
                      style={{
                        transform: mounted && theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </div>
                </button>
              </div>

              {/* Account */}
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  계정
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span className="text-base">🚪</span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: '#ef4444',
                      }}
                    >
                      로그아웃
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

