"use client";

import { useTheme } from "next-themes";
import Link from "next/link";
import ProfileImageSelector from "./ProfileImageSelector";
import { UserProfile, TIER_INFO, calculateLevel, getNextLevelExp, getNextTierScore, TIER_THRESHOLDS } from "@/lib/userProfile";

interface ProfileHeroProps {
  profile: UserProfile;
  onImageChange: (imageUrl: string) => void;
  onNicknameChange?: (nickname: string) => void;
  onBioChange?: (bio: string) => void;
  onStatusMessageChange?: (message: string) => void;
  isEditing?: boolean;
  isAdmin?: boolean;
}

export default function ProfileHero({
  profile,
  onImageChange,
  onNicknameChange,
  onBioChange,
  onStatusMessageChange,
  isEditing = false,
  isAdmin = false,
}: ProfileHeroProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tierInfo = TIER_INFO[profile.tier];
  const currentLevel = calculateLevel(profile.doriScore * 10); // 경험치 = 점수 * 10
  const nextLevelExp = getNextLevelExp(currentLevel);
  const nextTierScore = getNextTierScore(profile.tier, profile.doriScore);

  return (
    <div
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
                  padding: "0.375rem 0.875rem",
                  borderRadius: "1rem",
                  background: isDark
                    ? `rgba(${tierInfo.color}, 0.2)`
                    : `${tierInfo.color}15`,
                  border: `1px solid ${tierInfo.color}40`,
                  color: tierInfo.color,
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <span>{tierInfo.name}</span>
                <span style={{ opacity: 0.7 }}>·</span>
                <span>Lv.{currentLevel}</span>
              </div>
            </div>

            {/* DORI Score & Point */}
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
                DORI Score {profile.doriScore.toLocaleString()}
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

        {/* 등급 진행 바 */}
        {profile.tier < 5 && nextTierScore > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
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
                {nextTierScore > 0 ? `${nextTierScore.toLocaleString()}점` : "최고 등급"}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                borderRadius: "4px",
                background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(() => {
                    if (profile.tier >= 5) return 100;
                    const nextTier = (profile.tier + 1) as UserProfile['tier'];
                    const nextTierThreshold = TIER_THRESHOLDS[nextTier];
                    const currentTierThreshold = TIER_THRESHOLDS[profile.tier];
                    const progress = ((profile.doriScore - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)) * 100;
                    return Math.min(Math.max(progress, 0), 100);
                  })()}%`,
                  background: isDark
                    ? "linear-gradient(90deg, #60a5fa, #a78bfa)"
                    : "linear-gradient(90deg, #2563eb, #7c3aed)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

