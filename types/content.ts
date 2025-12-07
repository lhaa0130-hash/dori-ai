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
  // 👇 [수정] 새로운 카테고리 추가 (coding, design, productivity)
  category: "llm" | "image" | "video" | "voice" | "automation" | "search" | "agent" | "coding" | "design" | "productivity" | "other";
  summary: string;
  description: string;
  releaseDate: string;
  website: string;
  pricing: string; 
  tags: string[];
  thumbnail: string;
  
  // 추가 정보
  priceType?: string; // "무료", "부분 유료" 등 (필터용)

  rating: number;
  ratingCount: number;
  userRatings: UserRating[];
  comments: AiToolComment[];
  
  aiMeta?: AiMeta;
};