export type AiCreationType =
  | "human_only"    // 사람만 작성
  | "ai_assisted"   // 사람+AI 협업
  | "ai_generated"; // AI가 대부분/전부 생성

export type AiToolUsed =
  | "ChatGPT"
  | "Gemini"
  | "Claude"
  | "Leonardo"
  | "Pika"
  | "Runway"
  | "Midjourney"
  | "Custom"
  | string;

export type AiMeta = {
  creationType: AiCreationType;
  tools?: AiToolUsed[];
  note?: string;
};