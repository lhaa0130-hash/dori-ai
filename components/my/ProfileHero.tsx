"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Link from "next/link";
import ProfileImageSelector from "./ProfileImageSelector";
import { UserProfile, TIER_INFO, calculateLevel, getNextLevelExp, getNextTierExp, getCurrentLevelStartExp, TIER_THRESHOLDS } from "@/lib/userProfile";

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
  const tierInfo = TIER_INFO[profile.tier];
  const currentExp = profile.doriExp * 10; // 경험치 = EXP * 10
  
  // 레벨 계산 (자동 레벨업 처리)
  let currentLevel = calculateLevel(currentExp);
  const currentLevelStartExp = getCurrentLevelStartExp(currentLevel);
  const nextLevelExpRequired = getNextLevelExp(currentLevel); // 다음 레벨까지 필요한 경험치 (레벨당 필요량)
  const nextLevelStartExp = currentLevelStartExp + nextLevelExpRequired; // 다음 레벨 시작 경험치
  
  // 현재 경험치가 다음 레벨 시작 경험치를 초과한 경우, 레벨업 처리
  // (calculateLevel이 이미 올바르게 계산하지만, UI 표시를 위해 재확인)
  if (currentExp >= nextLevelStartExp && currentLevel < 100) {
    currentLevel = calculateLevel(currentExp);
  }
  
  // 레벨업 후 다시 계산
  const finalCurrentLevelStartExp = getCurrentLevelStartExp(currentLevel);
  const finalNextLevelExpRequired = getNextLevelExp(currentLevel);
  const finalNextLevelStartExp = finalCurrentLevelStartExp + finalNextLevelExpRequired;
  
  // 현재 레벨 구간에서의 경험치 (현재 경험치 - 현재 레벨 시작 경험치)
  const currentLevelExp = Math.max(0, currentExp - finalCurrentLevelStartExp);
  
  // 진행률 계산: (현재 레벨 구간 경험치) / (다음 레벨까지 필요한 경험치)
  const levelProgress = currentLevel >= 100 
    ? 100 
    : finalNextLevelExpRequired > 0
      ? Math.max(0, Math.min(100, (currentLevelExp / finalNextLevelExpRequired) * 100))
      : 100;
  
  // 다음 레벨까지 남은 경험치
  const remainingExp = Math.max(0, finalNextLevelStartExp - currentExp);
  
  const nextTierExp = getNextTierExp(profile.tier, profile.doriExp);

  // 테마가 변경되지 않았거나 마운트되지 않았으면 빈 div 반환
  if (!mounted) {
    return <div style={{ minHeight: '200px' }} />;
  }

  return (
    <div
      key={`profile-hero-${theme}-${forceUpdate}`}
      style={{
        background: isDark
          ? "linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(168, 85, 247, 0.1))"
          : "linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(124, 58, 237, 0.05))",
        borderRadius: "1.5rem",
        padding: "3rem 2rem",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "#e5e5e7"}`,
        position: "relative",
        overflow: "hidden",
        boxShadow: isDark ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 4px 20px rgba(0, 0, 0, 0.05)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 8px 30px rgba(0, 0, 0, 0.4)"
          : "0 8px 30px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 4px 20px rgba(0, 0, 0, 0.3)"
          : "0 4px 20px rgba(0, 0, 0, 0.05)";
      }}
    >
      {/* 배경 장식 */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(96, 165, 250, 0.1), transparent)"
            : "radial-gradient(circle, rgba(37, 99, 235, 0.05), transparent)",
          filter: "blur(60px)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* 프로필 이미지 및 기본 정보 */}
        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", marginBottom: "2rem" }}>
          <ProfileImageSelector
            currentImageUrl={profile.profileImageUrl}
            onImageChange={onImageChange}
          />

          <div style={{ flex: 1 }}>
            {/* 닉네임 및 등급 */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: "800",
                  letterSpacing: "-0.03em",
                  color: isDark ? "#ffffff" : "#1d1d1f",
                  margin: 0,
                }}
              >
                {profile.nickname}
              </h1>
              <Link
                href="/my/edit"
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)"}`,
                  color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(0, 0, 0, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)";
                }}
              >
                ✏️ 편집
              </Link>
              <div
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "1rem",
                  background: isDark
                    ? `linear-gradient(135deg, ${tierInfo.color}30, ${tierInfo.color}15)`
                    : `linear-gradient(135deg, ${tierInfo.color}20, ${tierInfo.color}10)`,
                  border: `2px solid ${tierInfo.color}60`,
                  color: tierInfo.color,
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: `0 0 20px ${tierInfo.color}30`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <span style={{ 
                  fontSize: "1rem",
                  filter: "drop-shadow(0 0 4px currentColor)",
                }}>⭐</span>
                <span>{tierInfo.name}</span>
                <span style={{ opacity: 0.7 }}>·</span>
                <span style={{ 
                  background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "0.5rem",
                  fontWeight: "800",
                }}>Lv.{currentLevel}</span>
              </div>
            </div>

            {/* DORI EXP & Point */}
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "baseline", gap: "2rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  background: isDark
                    ? "linear-gradient(135deg, #60a5fa, #a78bfa)"
                    : "linear-gradient(135deg, #2563eb, #7c3aed)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                DORI EXP {profile.doriExp.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  background: isDark
                    ? "linear-gradient(135deg, #34d399, #10b981)"
                    : "linear-gradient(135deg, #059669, #047857)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Point {(profile.point || 0).toLocaleString()}
              </span>
            </div>

            {/* 상태 메시지 */}
            {profile.statusMessage && (
              <div
                style={{
                  padding: "0.5rem 0.875rem",
                  borderRadius: "0.5rem",
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"}`,
                  fontSize: "0.875rem",
                  color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
                  display: "inline-block",
                  marginBottom: "1rem",
                }}
              >
                {profile.statusMessage}
              </div>
            )}

            {/* 한 줄 소개 */}
            <p
              style={{
                fontSize: "1rem",
                color: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
                margin: 0,
                lineHeight: "1.6",
                maxWidth: "600px",
              }}
            >
              {profile.bio || "DORI AI 크리에이터"}
            </p>
          </div>
        </div>

        {/* RPG 스타일 경험치 바 */}
        {currentLevel < 100 && (
          <div style={{ 
            marginTop: "1.5rem", 
            marginBottom: "1.5rem",
            background: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
            border: `2px solid ${isDark ? "rgba(251, 191, 36, 0.3)" : "rgba(251, 191, 36, 0.2)"}`,
            borderRadius: "1rem",
            padding: "1.25rem",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* 배경 패턴 */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isDark 
                ? "radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.1), transparent)"
                : "radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.05), transparent)",
              opacity: 0.5,
            }} />
            
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    fontSize: "1.5rem",
                    filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))",
                    animation: "sparkle 2s ease-in-out infinite",
                  }}>
                    ⚡
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: "0.875rem", 
                      color: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.8)", 
                      fontWeight: "700",
                      letterSpacing: "0.05em",
                    }}>
                      경험치
                    </div>
                    <div style={{ 
                      fontSize: "0.6875rem", 
                      color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
                      marginTop: "0.125rem",
                    }}>
                      Level {currentLevel} → {currentLevel + 1}
                    </div>
                  </div>
                </div>
                <div style={{
                  background: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(251, 191, 36, 0.1)",
                  border: `1px solid ${isDark ? "rgba(251, 191, 36, 0.3)" : "rgba(251, 191, 36, 0.2)"}`,
                  padding: "0.5rem 0.875rem",
                  borderRadius: "0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: isDark ? "#fbbf24" : "#d97706",
                }}>
                  {Math.floor(currentLevelExp)} / {Math.floor(finalNextLevelExpRequired)} EXP
                </div>
              </div>
              
              {/* 경험치 바 컨테이너 */}
              <div
                style={{
                  width: "100%",
                  height: "20px",
                  borderRadius: "10px",
                  background: isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.1)",
                  overflow: "hidden",
                  position: "relative",
                  border: `2px solid ${isDark ? "rgba(251, 191, 36, 0.4)" : "rgba(251, 191, 36, 0.3)"}`,
                  boxShadow: isDark 
                    ? "inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(251, 191, 36, 0.2)"
                    : "inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 10px rgba(251, 191, 36, 0.1)",
                }}
              >
                {/* 경험치 바 */}
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(Math.max(levelProgress, 0), 100)}%`,
                    background: isDark
                      ? "linear-gradient(90deg, #fbbf24, #f59e0b, #f97316, #f59e0b, #fbbf24)"
                      : "linear-gradient(90deg, #fbbf24, #f59e0b, #f97316, #f59e0b, #fbbf24)",
                    backgroundSize: "200% 100%",
                    borderRadius: "8px",
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    boxShadow: `0 0 20px ${isDark ? "rgba(251, 191, 36, 0.6)" : "rgba(251, 191, 36, 0.4)"}, inset 0 0 10px rgba(255, 255, 255, 0.2)`,
                    animation: "expBarFlow 3s linear infinite",
                  }}
                >
                  {/* 상단 하이라이트 */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "40%",
                      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent)",
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                  
                  {/* 반짝이는 효과 */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                      animation: "shimmer 2s infinite",
                    }}
                  />
                  
                  {/* 파티클 효과 */}
                  {levelProgress > 0 && (
                    <>
                      <div style={{
                        position: "absolute",
                        right: "10%",
                        top: "20%",
                        width: "4px",
                        height: "4px",
                        background: "#ffffff",
                        borderRadius: "50%",
                        boxShadow: "0 0 8px #fbbf24",
                        animation: "particleFloat 2s ease-in-out infinite",
                      }} />
                      <div style={{
                        position: "absolute",
                        right: "30%",
                        top: "60%",
                        width: "3px",
                        height: "3px",
                        background: "#ffffff",
                        borderRadius: "50%",
                        boxShadow: "0 0 6px #f59e0b",
                        animation: "particleFloat 2.5s ease-in-out infinite 0.5s",
                      }} />
                      <div style={{
                        position: "absolute",
                        right: "50%",
                        top: "30%",
                        width: "3px",
                        height: "3px",
                        background: "#ffffff",
                        borderRadius: "50%",
                        boxShadow: "0 0 6px #f97316",
                        animation: "particleFloat 2.2s ease-in-out infinite 1s",
                      }} />
                    </>
                  )}
                </div>
                
                {/* 진행률 텍스트 */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "0.6875rem",
                  fontWeight: "800",
                  color: isDark ? "#ffffff" : "#1d1d1f",
                  textShadow: "0 0 8px rgba(251, 191, 36, 0.8), 0 2px 4px rgba(0, 0, 0, 0.5)",
                  pointerEvents: "none",
                  letterSpacing: "0.05em",
                }}>
                  {Math.round(levelProgress)}%
                </div>
              </div>
              
              {/* 다음 레벨까지 남은 경험치 */}
              <div style={{
                marginTop: "0.75rem",
                textAlign: "right",
                fontSize: "0.75rem",
                color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
                fontWeight: "500",
              }}>
                {remainingExp > 0 ? (
                  <>
                    다음 레벨까지 <span style={{ 
                      color: isDark ? "#fbbf24" : "#d97706",
                      fontWeight: "700",
                    }}>{Math.ceil(remainingExp)} EXP</span> 필요
                  </>
                ) : currentLevel < 100 ? (
                  <span style={{ 
                    color: isDark ? "#fbbf24" : "#d97706",
                    fontWeight: "700",
                  }}>레벨업 가능!</span>
                ) : (
                  <span style={{ 
                    color: isDark ? "#fbbf24" : "#d97706",
                    fontWeight: "700",
                  }}>최대 레벨 달성</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 등급 진행 바 */}
        {profile.tier < 10 && nextTierExp > 0 && (
          <div style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
                  fontWeight: "500",
                }}
              >
                다음 등급까지
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
                  fontWeight: "500",
                }}
              >
                {nextTierExp > 0 ? `${nextTierExp.toLocaleString()}EXP` : "최고 등급"}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "4px",
                background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(() => {
                    if (profile.tier >= 10) return 100;
                    const nextTier = (profile.tier + 1) as UserProfile['tier'];
                    const nextTierThreshold = TIER_THRESHOLDS[nextTier];
                    const currentTierThreshold = TIER_THRESHOLDS[profile.tier];
                    const progress = ((profile.doriExp - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100;
                    return Math.min(Math.max(progress, 0), 100);
                  })()}%`,
                  background: isDark
                    ? `linear-gradient(90deg, ${tierInfo.color}, ${TIER_INFO[Math.min(profile.tier + 1, 10) as keyof typeof TIER_INFO].color})`
                    : `linear-gradient(90deg, ${tierInfo.color}, ${TIER_INFO[Math.min(profile.tier + 1, 10) as keyof typeof TIER_INFO].color})`,
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                  boxShadow: `0 0 10px ${tierInfo.color}40`,
                }}
              />
            </div>
          </div>
        )}

        {/* 포인트 상점 - 미구현 */}
        {/* <div style={{ marginTop: "2rem" }}>
          <div style={{
            padding: "1rem",
            background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}`,
            borderRadius: "1rem",
            textAlign: "center",
            color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
            fontSize: "0.875rem",
          }}>
            🎨 포인트 상점 (준비 중)
          </div>
        </div> */}

      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes frameGlow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
        @keyframes sparkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8));
          }
          50% {
            transform: scale(1.1) rotate(180deg);
            filter: drop-shadow(0 0 12px rgba(251, 191, 36, 1));
          }
        }
        @keyframes expBarFlow {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-8px) scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

