// 노드(작업) 종류별로 고를 수 있는 AI + 그 AI의 실제 구동 모델(버전) 목록 + 설명.
// 예) 글 생성 → GPT(GPT-5.1 / GPT-5 …), Claude(Opus 4.8 / Sonnet 4.6 …) 처럼 버전까지 고른다.
// "이 종류에 실제로 되는" AI만 보여준다.

import type { StepKind } from "@/lib/illo/automations";

export type ModelOption = { id: string; name: string; desc: string; models: string[] };
export type ModelSlot = "research" | "text" | "vision" | "image" | "video" | "voice" | "deliver";

export const SLOT_LABEL: Record<ModelSlot, string> = {
  research: "자료조사", text: "글 생성", vision: "분석", image: "이미지 생성",
  video: "영상 생성", voice: "음성·음악", deliver: "전송",
};

const AUTO: ModelOption = { id: "auto", name: "자동(추천)", desc: "워크일로가 이 작업에 가장 잘 맞는 AI·모델을 알아서 골라요.", models: [] };

export const MODEL_OPTIONS: Record<ModelSlot, ModelOption[]> = {
  research: [
    AUTO,
    { id: "tavily", name: "Tavily", desc: "AI 검색에 최적화 — 결과를 요약해 바로 쓰기 좋게. 무료 크레딧 있음.", models: ["빠른 검색", "심층 검색"] },
    { id: "perplexity", name: "Perplexity", desc: "출처(링크)까지 붙여주는 검색·답변.", models: ["Sonar", "Sonar Pro"] },
    { id: "exa", name: "Exa", desc: "의미 기반 검색 — '비슷한 내용' 찾기에 강함.", models: [] },
    { id: "brave", name: "Brave Search", desc: "독립 검색 인덱스, 비교적 저렴.", models: [] },
  ],
  text: [
    AUTO,
    { id: "gpt", name: "GPT (OpenAI)", desc: "범용 최강자. 글·요약·아이디어 두루 잘함.", models: ["GPT-5.1", "GPT-5", "GPT-4.1", "GPT-4o mini"] },
    { id: "claude", name: "Claude (Anthropic)", desc: "길고 정교한 글·문서에 강하고 문체가 안정적.", models: ["Claude Opus 4.8", "Claude Sonnet 4.6", "Claude Haiku 4.5"] },
    { id: "gemini", name: "Gemini (Google)", desc: "멀티모달 강점. 무료로 시작하기 가장 쉬움.", models: ["Gemini 2.5 Pro", "Gemini 2.5 Flash", "Gemini 2.0 Flash"] },
    { id: "grok", name: "Grok (xAI)", desc: "최신 정보·위트 있는 문체에 강함.", models: ["Grok 4", "Grok 4 mini", "Grok 3"] },
    { id: "openrouter", name: "OpenRouter", desc: "키 하나로 여러 모델을 골라 호출(따로 충전 안 해도 됨).", models: ["자동(최적가)", "GPT-5.1", "Claude Opus 4.8", "Gemini 2.5 Pro"] },
  ],
  vision: [
    AUTO,
    { id: "gpt", name: "GPT (멀티모달)", desc: "이미지·문서를 보고 핵심을 잘 읽어냄.", models: ["GPT-5.1", "GPT-4o"] },
    { id: "gemini", name: "Gemini", desc: "이미지·영상 이해에 강점.", models: ["Gemini 2.5 Pro", "Gemini 2.5 Flash"] },
    { id: "claude", name: "Claude", desc: "문서·이미지 분석이 꼼꼼함.", models: ["Claude Opus 4.8", "Claude Sonnet 4.6"] },
  ],
  image: [
    AUTO,
    { id: "dalle", name: "GPT-image / DALL·E", desc: "OpenAI. 지시 이해도가 좋고 글(GPT) 키와 공용.", models: ["GPT-image-1", "DALL·E 3"] },
    { id: "flux", name: "Flux (fal.ai)", desc: "고품질·빠른 생성. fal.ai 키 하나로 여러 모델.", models: ["FLUX1.1 pro", "FLUX.1 dev", "FLUX schnell"] },
    { id: "ideogram", name: "Ideogram", desc: "이미지 안에 글자(텍스트)를 정확히 넣는 데 강함.", models: ["Ideogram 3.0", "Ideogram 2.0"] },
  ],
  video: [
    AUTO,
    { id: "kling", name: "Kling", desc: "사실적인 움직임·길이로 인기. 이미지→영상도.", models: ["Kling 2.1", "Kling 1.6"] },
    { id: "higgsfield", name: "힉스필드", desc: "역동적인 카메라 무빙·연출에 강함.", models: ["Higgsfield"] },
    { id: "fal", name: "fal.ai (통합)", desc: "여러 영상 모델을 키 하나로 골라 사용.", models: [] },
  ],
  voice: [
    AUTO,
    { id: "elevenlabs", name: "ElevenLabs", desc: "가장 자연스러운 다국어 음성(TTS)·더빙. 무료 티어 있음.", models: ["Multilingual v2", "Turbo v2.5", "Flash v2.5"] },
    { id: "suno", name: "Suno", desc: "가사·분위기만 주면 노래(음악)를 생성.", models: ["v4", "v3.5"] },
    { id: "fal", name: "fal.ai (통합)", desc: "음성·음악 모델 일부를 통합 제공.", models: [] },
  ],
  deliver: [
    AUTO,
    { id: "email", name: "이메일", desc: "결과를 메일로 보내기. (SMTP/메일 API)", models: [] },
    { id: "kakao", name: "카카오톡", desc: "'나에게 보내기'로 카톡 받기.", models: [] },
    { id: "telegram", name: "텔레그램", desc: "봇으로 알림 — 가장 간단하고 무료.", models: [] },
  ],
};

/** 노드의 종류·아이콘으로 어떤 모델 슬롯인지 결정. input 노드는 모델 없음(null). */
export function slotForNode(n: { kind: StepKind; icon?: string }): ModelSlot | null {
  switch (n.kind) {
    case "research": return "research";
    case "generate": case "review": case "finalize": return "text";
    case "vision": return "vision";
    case "deliver": return "deliver";
    case "media": {
      const ic = n.icon || "";
      if (ic.includes("🎬") || ic.includes("📹") || ic.includes("🎞")) return "video";
      if (ic.includes("🎙") || ic.includes("🔊") || ic.includes("🎤") || ic.includes("🎵") || ic.includes("🎶")) return "voice";
      return "image";
    }
    default: return null; // input
  }
}

export function optionsForNode(n: { kind: StepKind; icon?: string }): ModelOption[] {
  const s = slotForNode(n);
  return s ? MODEL_OPTIONS[s] : [];
}

/** 기본 AI id = 자동(추천). */
export function defaultModelFor(n: { kind: StepKind; icon?: string }): string {
  return optionsForNode(n)[0]?.id || "";
}

/** 노드에 표시할 현재 모델 이름 — 버전(variant)이 있으면 버전을, 자동이면 '자동(추천)'을. */
export function modelLabel(n: { kind: StepKind; icon?: string }, modelId?: string, variant?: string): string {
  const opts = optionsForNode(n);
  const id = modelId || defaultModelFor(n);
  const opt = opts.find((o) => o.id === id);
  if (!opt) return "—";
  if (id === "auto") return opt.name; // 자동(추천)
  return variant || opt.models[0] || opt.name;
}
