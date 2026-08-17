// 노드 스튜디오 — 업무 "종류"(카테고리) 9개 + 각 종류에 결합할 수 있는 AI 도구 목록.
//
// 좌측 팔레트에서 종류를 끌어다 캔버스에 놓으면 노드가 생기고,
// 우측에는 그 노드의 종류에 맞는 AI 도구만 뜬다. 도구를 노드에 끌어놓으면 하나로 결합된다.
//   예) 검색 : Tavily
//
// 설명·모델 버전은 nodeModels.MODEL_OPTIONS에서, 키 발급 안내는 apiCatalog.API_CATALOG에서
// 끌어와 재사용한다(단일 소스 — 같은 문구를 두 곳에서 관리하지 않는다).

import { MODEL_OPTIONS, type ModelOption, type ModelSlot } from "@/lib/illo/nodeModels";
import { API_CATALOG, type ApiEntry } from "@/lib/illo/apiCatalog";

export type CatId =
  | "plan" | "dev" | "search" | "image" | "video"
  | "upload" | "deliver" | "music" | "voice";

/** llm = 실제로 AI가 돌아 결과를 만든다 / stub = 아직 미연동, 그 도구에 넣을 프롬프트·사양만 만든다. */
export type ExecMode = "llm" | "stub";

export interface NodeCategory {
  id: CatId;
  icon: string;
  name: string;
  role: string;        // 노드에 표시할 한 줄 역할 (예: "조사 AI")
  desc: string;        // 좌측 팔레트 설명
  exec: ExecMode;
  systemRole: string;  // 실행 프롬프트에 들어가는 "이 노드가 맡은 일"
  caveat?: string;     // 정직한 한계 고지 (예: 실제 웹검색 미연동)
}

export interface NodeTool {
  id: string;
  catId: CatId;
  name: string;
  desc: string;
  models: string[];    // 고를 수 있는 모델 버전
  exec: ExecMode;
  apiName?: string;    // API_CATALOG entries[].name — 키 발급 안내를 끌어오는 열쇠
}

/* ─────────────────────────── 카테고리 9종 ─────────────────────────── */
// 순서 = 좌측 팔레트에 뜨는 순서.
export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: "plan", icon: "🧭", name: "기획", role: "기획 AI", exec: "llm",
    desc: "목표·범위·단계를 잡아 실행 가능한 기획안으로 정리해요.",
    systemRole: "받은 내용을 바탕으로 목표·타깃·범위·핵심 아이디어·실행 단계를 잡아 바로 움직일 수 있는 기획안을 만든다.",
  },
  {
    id: "dev", icon: "💻", name: "개발", role: "개발 AI", exec: "llm",
    desc: "기획을 코드·기술 설계로 옮겨요.",
    systemRole: "받은 내용을 기술 설계와 실제 코드로 옮긴다. 파일 구조·핵심 코드·실행 방법을 구체적으로 제시한다.",
  },
  {
    id: "search", icon: "🔎", name: "검색", role: "조사 AI", exec: "llm",
    desc: "필요한 정보를 조사해 근거와 함께 요점을 정리해요.",
    systemRole: "필요한 정보를 조사해 핵심 사실·수치·트렌드를 근거와 함께 정리한다. 확실하지 않은 것은 추정이라고 분명히 밝힌다.",
    caveat: "실시간 웹 검색은 아직 미연동 — 모델이 아는 범위로 정리하고, 확인이 필요한 항목을 따로 표시해요.",
  },
  {
    id: "image", icon: "🎨", name: "이미지", role: "이미지 AI", exec: "stub",
    desc: "장면·스타일·구도·조명을 담은 이미지 생성 지시를 만들어요.",
    systemRole: "받은 내용에 어울리는 이미지의 주제·스타일·구도·조명·색감과 피해야 할 요소(네거티브)를 담아 이미지 생성 프롬프트를 만든다.",
  },
  {
    id: "video", icon: "🎬", name: "영상", role: "영상 AI", exec: "stub",
    desc: "장면별 콘티와 카메라 무빙을 담은 영상 생성 지시를 만들어요.",
    systemRole: "받은 내용으로 장면별 콘티(길이·카메라 무빙·분위기·자막)를 짜고 영상 생성 프롬프트를 만든다.",
  },
  {
    id: "upload", icon: "📦", name: "업로드", role: "배포", exec: "stub",
    desc: "결과물을 저장소에 올릴 형태로 정리해요. (깃허브 등)",
    systemRole: "받은 내용을 저장소에 올릴 수 있는 형태로 정리한다 — 파일 경로, 파일별 전체 내용, 커밋 메시지를 명확히 나눠 적는다.",
  },
  {
    id: "deliver", icon: "📤", name: "전송", role: "전송", exec: "stub",
    desc: "완성본을 받는 사람에 맞춘 전달 형식으로 정리해요. (이메일 등)",
    systemRole: "받은 내용을 전달용으로 정리한다 — 제목(또는 첫 줄)과 본문을 받는 사람이 바로 읽을 수 있는 형태로 다듬는다.",
  },
  {
    id: "music", icon: "🎵", name: "음악", role: "음악 AI", exec: "stub",
    desc: "분위기·장르·템포·가사를 담은 음악 생성 지시를 만들어요.",
    systemRole: "받은 내용에 어울리는 음악의 장르·분위기·템포·악기 구성과 (필요하면) 가사를 담아 음악 생성 프롬프트를 만든다.",
  },
  {
    id: "voice", icon: "🎙️", name: "목소리", role: "음성 AI", exec: "stub",
    desc: "낭독 대본과 톤·속도·감정을 담은 음성 생성 지시를 만들어요.",
    systemRole: "받은 내용을 소리내어 읽을 대본으로 다듬고, 목소리 톤·속도·감정·쉼표 위치까지 지정한 음성 생성 지시를 만든다.",
  },
];

export const CAT_BY_ID: Record<CatId, NodeCategory> =
  Object.fromEntries(NODE_CATEGORIES.map((c) => [c.id, c])) as Record<CatId, NodeCategory>;

export function catById(id: CatId): NodeCategory | undefined {
  return CAT_BY_ID[id];
}

/* ─────────────────────────── 도구 목록 ─────────────────────────── */
// nodeModels.MODEL_OPTIONS에 이미 있는 도구는 그쪽 설명·모델 버전을 그대로 쓰고,
// 없는 것(기획/개발/업로드 전용)만 여기서 새로 정의한다.

function slotOpt(slot: ModelSlot, id: string): ModelOption | undefined {
  return MODEL_OPTIONS[slot].find((o) => o.id === id);
}

/** 도구 한 개 정의. slot을 주면 MODEL_OPTIONS에서 이름·설명·모델을 끌어오고, 준 값이 있으면 그게 이긴다. */
function tool(
  catId: CatId,
  id: string,
  exec: ExecMode,
  src: { slot?: ModelSlot; name?: string; desc?: string; models?: string[]; apiName?: string } = {},
): NodeTool {
  const base = src.slot ? slotOpt(src.slot, id) : undefined;
  return {
    id, catId, exec,
    name: src.name ?? base?.name ?? id,
    desc: src.desc ?? base?.desc ?? "",
    models: src.models ?? base?.models ?? [],
    apiName: src.apiName,
  };
}

/** 어느 종류에나 붙는 첫 번째 선택지 — 이 종류에 가장 잘 맞는 AI를 알아서 고른다. */
function autoTool(catId: CatId, exec: ExecMode): NodeTool {
  return {
    id: "auto", catId, exec,
    name: "자동(추천)",
    desc: "이 작업에 가장 잘 맞는 AI를 알아서 골라요.",
    models: [],
  };
}

export const TOOLS_BY_CAT: Record<CatId, NodeTool[]> = {
  plan: [
    autoTool("plan", "llm"),
    tool("plan", "claude", "llm", { slot: "text", apiName: "Claude (Anthropic)" }),
    tool("plan", "gpt", "llm", { slot: "text", apiName: "GPT (OpenAI)" }),
    tool("plan", "gemini", "llm", { slot: "text", apiName: "Gemini (Google)" }),
    tool("plan", "openrouter", "llm", { slot: "text" }),
  ],
  dev: [
    autoTool("dev", "llm"),
    tool("dev", "claude", "llm", {
      slot: "text", apiName: "Claude (Anthropic)",
      desc: "긴 코드·리팩터링·설계 설명에 강하고 결과가 안정적이에요.",
    }),
    tool("dev", "gpt", "llm", {
      slot: "text", apiName: "GPT (OpenAI)",
      desc: "범용 코딩·디버깅에 두루 강해요.",
    }),
    tool("dev", "gemini", "llm", {
      slot: "text", apiName: "Gemini (Google)",
      desc: "무료 티어로 시작하기 쉽고 긴 파일을 한 번에 잘 읽어요.",
    }),
    tool("dev", "openrouter", "llm", { slot: "text" }),
  ],
  search: [
    autoTool("search", "llm"),
    tool("search", "tavily", "llm", { slot: "research", apiName: "Tavily" }),
    tool("search", "perplexity", "llm", { slot: "research", apiName: "Perplexity" }),
    tool("search", "exa", "llm", { slot: "research", apiName: "Exa" }),
    tool("search", "brave", "llm", { slot: "research", apiName: "Brave Search" }),
  ],
  image: [
    autoTool("image", "stub"),
    tool("image", "dalle", "stub", { slot: "image", apiName: "DALL·E / GPT-image (OpenAI)" }),
    tool("image", "flux", "stub", { slot: "image", apiName: "Flux (fal.ai)" }),
    tool("image", "ideogram", "stub", { slot: "image", apiName: "Ideogram" }),
  ],
  video: [
    autoTool("video", "stub"),
    tool("video", "kling", "stub", { slot: "video", apiName: "Kling" }),
    tool("video", "higgsfield", "stub", { slot: "video", apiName: "힉스필드 (Higgsfield)" }),
    tool("video", "fal", "stub", { slot: "video" }),
  ],
  upload: [
    autoTool("upload", "stub"),
    tool("upload", "github", "stub", {
      name: "GitHub",
      desc: "저장소에 파일을 올리고 커밋해요. 정적 사이트 배포의 출발점.",
      models: [],
    }),
    tool("upload", "cloudflare", "stub", {
      name: "Cloudflare Pages",
      desc: "저장소에 올라간 결과물을 그대로 웹에 배포해요.",
      models: [],
    }),
  ],
  deliver: [
    autoTool("deliver", "stub"),
    tool("deliver", "email", "stub", { slot: "deliver", apiName: "이메일" }),
    tool("deliver", "kakao", "stub", { slot: "deliver", apiName: "카카오톡" }),
    tool("deliver", "telegram", "stub", { slot: "deliver", apiName: "텔레그램" }),
  ],
  music: [
    autoTool("music", "stub"),
    tool("music", "suno", "stub", { slot: "voice", apiName: "Suno" }),
    tool("music", "fal", "stub", {
      slot: "voice",
      desc: "음악 모델 일부를 키 하나로 통합 제공해요.",
    }),
  ],
  voice: [
    autoTool("voice", "stub"),
    tool("voice", "elevenlabs", "stub", { slot: "voice", apiName: "ElevenLabs" }),
    tool("voice", "whisper", "stub", {
      name: "Whisper (OpenAI)",
      desc: "음성→텍스트(받아쓰기·자막). OpenAI 키를 그대로 써요.",
      models: [],
      apiName: "Whisper (OpenAI)",
    }),
  ],
};

export function toolsFor(catId: CatId): NodeTool[] {
  return TOOLS_BY_CAT[catId] || [];
}

export function toolById(catId: CatId, toolId: string): NodeTool | undefined {
  return toolsFor(catId).find((t) => t.id === toolId);
}

/** 노드에 표시할 도구 라벨 — 결합 전이면 null. 버전을 골랐으면 "Tavily · 심층 검색"처럼. */
export function toolLabel(catId: CatId, toolId?: string, variant?: string): string | null {
  if (!toolId) return null;
  const t = toolById(catId, toolId);
  if (!t) return null;
  return variant ? `${t.name} · ${variant}` : t.name;
}

/* ── 키 발급 안내 — API_CATALOG를 단일 소스로 재사용 ── */
const API_ENTRY_BY_NAME: Record<string, ApiEntry> = (() => {
  const map: Record<string, ApiEntry> = {};
  for (const cat of API_CATALOG) for (const e of cat.entries) map[e.name] = e;
  return map;
})();

/** 이 도구의 키 발급 안내(발급 페이지·단계·무료 티어). 카탈로그에 없으면 undefined. */
export function apiEntryFor(t: NodeTool): ApiEntry | undefined {
  return t.apiName ? API_ENTRY_BY_NAME[t.apiName] : undefined;
}
