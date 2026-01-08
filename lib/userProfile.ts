// 사용자 프로필 관련 타입 및 유틸리티

export type UserTier = 1 | 2 | 3 | 4 | 5;
export type TierName = "Explorer" | "Contributor" | "Curator" | "Guide" | "Architect";

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  profileImageUrl?: string;
  statusMessage?: string;
  bio?: string;
  gender?: "male" | "female";
  ageGroup?: "10s" | "20s" | "30s" | "40s";
  tier: UserTier;
  level: number;
  doriScore: number;
  point: number; // 나중에 사용할 포인트
  createdAt: string;
}

export interface UserActivity {
  userId: string;
  type: "post" | "comment" | "like" | "guide" | "report";
  refId: string;
  scoreDelta: number;
  createdAt: string;
}

// 등급 정보
export const TIER_INFO: Record<UserTier, { name: TierName; color: string; description: string }> = {
  1: { name: "Explorer", color: "#60a5fa", description: "탐험가" },
  2: { name: "Contributor", color: "#34d399", description: "기여자" },
  3: { name: "Curator", color: "#a78bfa", description: "큐레이터" },
  4: { name: "Guide", color: "#f59e0b", description: "가이드" },
  5: { name: "Architect", color: "#ec4899", description: "건축가" },
};

// 등급별 최소 점수 (예시)
export const TIER_THRESHOLDS: Record<UserTier, number> = {
  1: 0,
  2: 100,
  3: 500,
  4: 2000,
  5: 5000,
};

// 다음 등급까지 필요한 점수 계산
export function getNextTierScore(currentTier: UserTier, currentScore: number): number {
  if (currentTier >= 5) return 0; // 최고 등급
  const nextTier = (currentTier + 1) as UserTier;
  return TIER_THRESHOLDS[nextTier] - currentScore;
}

// 현재 등급 계산 (점수 기반)
export function calculateTier(score: number): UserTier {
  if (score >= TIER_THRESHOLDS[5]) return 5;
  if (score >= TIER_THRESHOLDS[4]) return 4;
  if (score >= TIER_THRESHOLDS[3]) return 3;
  if (score >= TIER_THRESHOLDS[2]) return 2;
  return 1;
}

// 레벨 계산 (경험치 기반, 1~100)
export function calculateLevel(exp: number): number {
  // 간단한 레벨링 공식: 레벨 = sqrt(경험치 / 100)
  const level = Math.floor(Math.sqrt(exp / 100)) + 1;
  return Math.min(level, 100);
}

// 다음 레벨까지 필요한 경험치
export function getNextLevelExp(currentLevel: number): number {
  if (currentLevel >= 100) return 0;
  const nextLevel = currentLevel + 1;
  return nextLevel * nextLevel * 100; // 레벨^2 * 100
}

// 활동 점수 계산
export function calculateActivityScore(activities: UserActivity[]): number {
  return activities.reduce((sum, activity) => sum + activity.scoreDelta, 0);
}

// 기본 프로필 데이터 생성
export function createDefaultProfile(userId: string, email: string, nickname: string, gender?: "male" | "female", ageGroup?: "10s" | "20s" | "30s" | "40s"): UserProfile {
  return {
    id: email, // 이메일을 ID로 사용하여 일관성 유지
    email,
    nickname,
    gender,
    ageGroup,
    tier: 1,
    level: 1,
    doriScore: 0,
    point: 0, // 나중에 사용할 포인트
    createdAt: new Date().toISOString(),
  };
}

// 활동 타입별 점수 가중치
export const ACTIVITY_SCORES = {
  post: 10,
  comment: 3,
  like: 0, // 받은 좋아요는 별도 계산
  receivedLike: 3,
  guide: 20,
  report: -10,
};

