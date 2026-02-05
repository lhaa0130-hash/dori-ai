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

// 인사이트 아이템 타입
// 인사이트 아이템 타입
export type InsightItem = {
  id: number | string;
  title: string;
  summary: string;
  category: string; // Relaxed for compatibility
  tags: string[];
  likes: number;
  date: string; // ISO 날짜 문자열
  aiMeta?: AiMeta;
  content?: string; // HTML 콘텐츠
  image?: string; // 썸네일 이미지 경로
  thumbnail_url?: string; // Added for compatibility
  author?: string; // Added for compatibility
  slug?: string; // 가이드 글의 경우 slug (예: "guide-01")
  authorId?: string; // 작성자 식별자 (선택적, 기존 데이터 호환성)
};

// 핵심 AI Tool 타입
export type AiTool = {
  id: string;
  name: string;
  // 👇 [수정] 세분화된 카테고리
  category: "llm" | "image-generation" | "image-editing" | "video-generation" | "video-editing" | "coding" | "voice-tts" | "3d" | "automation" | "music" | "presentation" | "meeting-notes" | "marketing" | "writing" | "education" | "chatbot" | "avatar" | "web-builder" | "game" | "etc";
  summary: string;
  description: string;
  releaseDate?: string;
  website: string;
  pricing?: string;
  tags?: string[];
  thumbnail: string;
  company?: string; // 개발사 이름
  strength?: string; // AI의 주요 강점 (한 줄)

  // 추가 정보
  priceType?: string; // "무료", "부분 유료" 등 (필터용)

  rating: number;
  ratingCount: number;
  userRatings: UserRating[];
  comments: AiToolComment[];

  aiMeta?: AiMeta;
};