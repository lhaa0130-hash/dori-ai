"use client";

import { useTheme } from "next-themes";
import { UserProfile, TIER_INFO, getNextTierScore, ACTIVITY_SCORES } from "@/lib/userProfile";

interface GrowthGuideProps {
  profile: UserProfile;
  activityStats: {
    posts: number;
    comments: number;
    receivedLikes: number;
    guides: number;
  };
}

export default function GrowthGuide({ profile, activityStats }: GrowthGuideProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const currentTier = profile.tier;
  const tierInfo = TIER_INFO[currentTier];
  const nextTierScore = getNextTierScore(currentTier, profile.doriScore);

  // 다음 등급 달성을 위한 추천 활동 계산
  const getRecommendations = () => {
    if (currentTier >= 5) {
      return [
        { action: "최고 등급 달성!", completed: true },
      ];
    }

    const recommendations = [];
    const neededScore = nextTierScore;

    // 가이드 작성 추천 (높은 점수)
    if (neededScore >= ACTIVITY_SCORES.guide) {
      const guidesNeeded = Math.ceil(neededScore / ACTIVITY_SCORES.guide);
      recommendations.push({
        action: `가이드 글 ${guidesNeeded}개 작성`,
        score: ACTIVITY_SCORES.guide * guidesNeeded,
        type: "guide",
      });
    }

    // 좋은 답변 추천 (댓글)
    if (neededScore >= ACTIVITY_SCORES.comment) {
      const commentsNeeded = Math.ceil(neededScore / ACTIVITY_SCORES.comment);
      recommendations.push({
        action: `좋은 답변 ${commentsNeeded}개 작성`,
        score: ACTIVITY_SCORES.comment * commentsNeeded,
        type: "comment",
      });
    }

    // 글 작성 추천
    if (neededScore >= ACTIVITY_SCORES.post) {
      const postsNeeded = Math.ceil(neededScore / ACTIVITY_SCORES.post);
      recommendations.push({
        action: `글 ${postsNeeded}개 작성`,
        score: ACTIVITY_SCORES.post * postsNeeded,
        type: "post",
      });
    }

    return recommendations.slice(0, 3); // 최대 3개만 표시
  };

  const recommendations = getRecommendations();

  return (
    <div>

      {currentTier >= 5 ? (
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "1rem",
            background: isDark
              ? "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2))"
              : "linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1))",
            border: `1px solid ${isDark ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.2)"}`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "0.5rem",
            }}
          >
            🏆
          </div>
          <div
            style={{
              fontSize: "1.125rem",
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#1d1d1f",
              marginBottom: "0.25rem",
            }}
          >
            최고 등급 달성!
          </div>
          <div
            style={{
              fontSize: "0.875rem",
              color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
            }}
          >
            Architect 등급을 달성하셨습니다. 축하합니다!
          </div>
        </div>
      ) : (
        <>
          {/* 현재 등급 정보 */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "0.75rem",
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                fontSize: "0.8125rem",
                color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
                marginBottom: "0.5rem",
              }}
            >
              현재 등급: <strong style={{ color: tierInfo.color }}>{tierInfo.name}</strong>
            </div>
            <div
              style={{
                fontSize: "0.8125rem",
                color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
              }}
            >
              다음 등급까지: <strong>{nextTierScore.toLocaleString()}점</strong> 필요
            </div>
          </div>

          {/* 점수 및 포인트 획득 방법 */}
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "1rem",
              background: isDark 
                ? "linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(168, 85, 247, 0.1))"
                : "linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(124, 58, 237, 0.05))",
              border: `1px solid ${isDark ? "rgba(96, 165, 250, 0.2)" : "rgba(37, 99, 235, 0.15)"}`,
            }}
          >
            <h4
              style={{
                fontSize: "0.9375rem",
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#1d1d1f",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>💡</span>
              <span>점수 및 포인트 획득 방법</span>
            </h4>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "0.5rem",
                    background: isDark
                      ? "rgba(37, 99, 235, 0.2)"
                      : "rgba(37, 99, 235, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    flexShrink: 0,
                  }}
                >
                  ✍️
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: isDark ? "#ffffff" : "#1d1d1f",
                      marginBottom: "0.25rem",
                    }}
                  >
                    글 작성
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    <span style={{ color: tierInfo.color, fontWeight: "700" }}>10점</span> 획득
                  </div>
                </div>
              </div>
              
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "0.5rem",
                    background: isDark
                      ? "rgba(34, 211, 238, 0.2)"
                      : "rgba(34, 211, 238, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    flexShrink: 0,
                  }}
                >
                  💬
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: isDark ? "#ffffff" : "#1d1d1f",
                      marginBottom: "0.25rem",
                    }}
                  >
                    댓글 작성
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    <span style={{ color: tierInfo.color, fontWeight: "700" }}>3점</span> 획득
                  </div>
                </div>
              </div>
              
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "0.5rem",
                    background: isDark
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(34, 197, 94, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.25rem",
                    flexShrink: 0,
                  }}
                >
                  ❤️
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: isDark ? "#ffffff" : "#1d1d1f",
                      marginBottom: "0.25rem",
                    }}
                  >
                    좋아요 받기
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
                    }}
                  >
                    <span style={{ color: "#10b981", fontWeight: "700" }}>1포인트</span> 획득
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

