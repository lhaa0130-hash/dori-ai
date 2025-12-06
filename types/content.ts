// AI 뱃지용
export type AiCreationType = "human_only" | "ai_assisted" | "ai_generated";
export type AiToolUsed = string;

export type AiMeta = {
  creationType: AiCreationType;
  tools?: AiToolUsed[];
  note?: string;
};

// 댓글 구조
export type AiToolComment = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string; // ISO
};

// 사용자 개별 평점
export type UserRating = {
  userId: string;
  score: number;
};

// 핵심 AI Tool 타입
export type AiTool = {
  id: string;
  name: string;
  category: "llm" | "image" | "video" | "voice" | "code" | "agent" | "search" | "motion";
  summary: string;
  description: string;
  releaseDate: string;
  website: string;
  pricing: string; // 예: "Free / $20 mo"
  tags: string[];
  thumbnail: string; // 로컬 경로 or 외부 URL

  // 동적 데이터 (초기값은 0/빈배열이나 LocalStorage와 병합됨)
  rating: number;
  ratingCount: number;
  userRatings: UserRating[];
  comments: AiToolComment[];
  
  aiMeta?: AiMeta; // 기존 뱃지 호환
};