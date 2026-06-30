// 영상 카테고리 — 잘게 쪼개진 소주제 태그(28종+)를 5개 큰 카테고리로 묶는다.
// n8n이 새 영상을 추가해도 태그 키워드로 자동 분류되도록 키워드 매핑 사용.

export interface VideoCategory {
  key: string;
  label: string;
  emoji: string;
  desc: string;
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  { key: "trend", label: "트렌드·전망", emoji: "🔭", desc: "AI 산업·뉴스·미래 전망과 큰 그림" },
  { key: "basic", label: "입문·이해", emoji: "📘", desc: "개념·원리·모델 구조를 쉽게 이해하기" },
  { key: "howto", label: "활용·생산성", emoji: "🚀", desc: "실무 활용·사용법·자동화로 일 잘하기" },
  { key: "dev", label: "개발·코딩", emoji: "💻", desc: "코딩·에이전트·앱 개발 실전" },
  { key: "creation", label: "영상·콘텐츠 제작", emoji: "🎬", desc: "AI로 영상·영화·콘텐츠 만들기" },
];

export const VIDEO_CATEGORY_MAP: Record<string, VideoCategory> = Object.fromEntries(
  VIDEO_CATEGORIES.map((c) => [c.key, c])
);

// 태그 배열 → 카테고리 key. 순서 중요(구체적인 것부터), 못 찾으면 trend로 폴백.
export function mapVideoCategory(tags?: string[]): string {
  const t = (tags || []).join(" ");
  const has = (...ws: string[]) => ws.some((w) => t.includes(w));

  if (has("영상 제작", "영화", "콘텐츠 제작", "촬영", "편집", "이미지 생성")) return "creation";
  if (has("코딩", "개발", "에이전트", "홈페이지", "프로그래밍", "바이브", "앱 ")) return "dev";
  if (has("활용", "사용법", "자동화", "제미나이", "생산성", "프롬프트", "업무", "워크플로")) return "howto";
  if (has("입문", "기초", "개념", "원리", "아키텍처", "LLM", "모델 설명", "모델 비교", "교육", "이해", "GPT")) return "basic";
  if (has("트렌드", "전망", "뉴스", "비즈니스", "산업", "역사", "반도체", "문명", "문제", "투자", "거품")) return "trend";
  return "trend";
}
