// AI 직원 관제탑 — 조직도(부서 → 팀 → 팀원) 데이터.
// workspace.ts와 같은 규칙: 회원별 키로 localStorage에 저장 → 계정마다 분리.
// ⚠️ 현재는 브라우저 저장. 기기 간 동기화가 필요하면 이후 클라우드(Firestore)로 확장.
// (workspace.ts의 Dept는 '문서 폴더'용 flat 구조라 별개 — 여기는 팀·팀원·모델까지 담는 계층.)

export type OrgStatus = "work" | "review" | "done" | "wait" | "alert";

export type OrgMember = {
  id: string;
  name: string;
  role: string;
  status: OrgStatus;
  kind: MemberKind; // 1단계: 역할(글·판단 / 이미지 / 영상 / 자료전송 / 타이머 …)
  tool: string;     // 2단계: 그 역할의 도구(Claude / fal / 텔레그램 …)
  model: string;    // 3단계: 그 도구의 상세 모델·대상
  result?: string;      // 이 직원이 낸 결과물 (결과보기▼)
  resultAt?: string;    // 실행 시각(ISO)
  x?: number; y?: number;   // 자유 이동으로 지정한 캔버스 좌표(없으면 자동 배치)
};
/** 직원 → 직원 업무 흐름: from 직원의 결과가 to 직원에게 넘어간다(드래그로 연결). */
export type MemberLink = { from: string; to: string };
export type OrgTeam = {
  id: string;
  name: string;
  emoji?: string;   // 없으면 부서 색 + 기본 아이콘
  members: OrgMember[];
  links?: MemberLink[];   // 직원 간 흐름(누가 누구에게 결과를 넘기는지) — 없으면 그냥 배열 순서
  task?: string;      // 이 팀에 이번에 시킬 일 — 부서·팀마다 다르므로 팀별로 저장
  review?: string;    // 팀원 결과를 모아 상급자(팀장)가 검토한 내용
  reviewAt?: string;
  x?: number; y?: number;   // 자유 이동 좌표
};
export type OrgDivision = {
  id: string;
  name: string;
  color: OrgColor;
  icon: OrgIcon;    // 구버전 호환(이모지가 없을 때 사용)
  emoji?: string;   // 좌측 뱃지 — 클릭해서 바로 변경
  teams: OrgTeam[];
  review?: string;    // 팀 검토들을 모아 부서장이 검토한 내용
  reviewAt?: string;
  x?: number; y?: number;   // 자유 이동 좌표
};

export type OrgColor = "blue" | "teal" | "violet" | "pink" | "cyan" | "slate";
export type OrgIcon = "bulb" | "code" | "palette" | "message" | "megaphone" | "network";

// 부서 추가 시 순서대로 배정되는 색·아이콘 팔레트.
export const ORG_PALETTE: { color: OrgColor; icon: OrgIcon }[] = [
  { color: "blue", icon: "bulb" },
  { color: "teal", icon: "code" },
  { color: "violet", icon: "palette" },
  { color: "pink", icon: "message" },
  { color: "cyan", icon: "megaphone" },
  { color: "slate", icon: "network" },
];

/* ─────────────── AI 모델 선택 — 2단계(도구 → 상세모델) ───────────────
 * 1단계에서 도구(브랜드)를 고르면 2단계에 그 도구의 모델만 나온다.
 *
 * ⚠️ 실행 현실: 본인 키 직접 호출 경로는 Claude만 가능하다(lib/illo/claude.ts).
 *    Claude가 아닌 도구를 고르면 실행 시 동급 Claude(Haiku)로 폴백되고 화면에 안내가 뜬다.
 *    Claude 모델 id는 공식 문서 기준으로 확인된 값이고, 그 외 도구의 모델명은
 *    lib/illo/modelMatrix.ts(운영자 큐레이션 목록)에서 가져온 값이다.
 */
/* ─────────────── 직원 세팅 = 3단계 ───────────────
 *   1) 역할  — 이 직원이 무슨 일을 하나 (LLM / 이미지 / 영상 / 음성 / 자료조사 / 자료전송 / 타이머)
 *   2) 도구  — 그 역할에 쓰는 브랜드 (Claude / fal / ElevenLabs / 텔레그램 …)
 *   3) 모델  — 그 도구의 상세 모델 (Fable 5 / Opus 4.8 …)
 *
 * ⚠️ ready=false 는 "고를 수는 있지만 아직 실제로 실행되지 않는다"는 뜻이다.
 *    지금 실제 실행 경로는 (a) Claude 직접 호출, (b) 이메일 mailto — 이 둘뿐.
 *    나머지는 화면에 '연결 필요'로 표시하고 되는 척하지 않는다.
 */
export type MemberKind = "llm" | "search" | "image" | "video" | "voice" | "deliver" | "timer";

export const MEMBER_KINDS: { value: MemberKind; label: string; emoji: string }[] = [
  { value: "llm",     label: "글·판단", emoji: "🧠" },
  { value: "search",  label: "자료조사", emoji: "🔍" },
  { value: "image",   label: "이미지",  emoji: "🎨" },
  { value: "video",   label: "영상",    emoji: "🎬" },
  { value: "voice",   label: "음성·음악", emoji: "🎧" },
  { value: "deliver", label: "자료전송", emoji: "📤" },
  { value: "timer",   label: "타이머",  emoji: "⏱️" },
];

export type ToolDef = {
  value: string;
  label: string;
  ready: boolean;          // 실제로 실행되는가
  note?: string;           // 안 되면 무엇이 필요한가
  models: { value: string; label: string }[];
};

// Claude 모델 id는 공식 문서 기준 확인값. 그 외 도구·모델명은 modelMatrix.ts(운영자 큐레이션) 기준이며 미검증.
export const KIND_TOOLS: Record<MemberKind, ToolDef[]> = {
  llm: [
    { value: "claude", label: "Claude", ready: true, models: [
      { value: "claude-fable-5",   label: "Fable 5 · 최고 성능" },
      { value: "claude-opus-4-8",  label: "Opus 4.8 · 고급" },
      { value: "claude-sonnet-5",  label: "Sonnet 5 · 균형" },
      { value: "claude-haiku-4-5", label: "Haiku 4.5 · 저렴" },
    ]},
    { value: "gpt", label: "GPT", ready: false, note: "라우팅 미연동 — Claude(Haiku)로 대체 실행됩니다", models: [
      { value: "gpt-5.5", label: "GPT-5.5 · 범용" },
      { value: "gpt-5.4-mini", label: "GPT-5.4 mini · 저렴" },
    ]},
    { value: "gemini", label: "Gemini", ready: false, note: "라우팅 미연동 — Claude(Haiku)로 대체 실행됩니다", models: [
      { value: "gemini-2.5-pro", label: "2.5 Pro · 고급" },
      { value: "gemini-2.5-flash", label: "2.5 Flash · 초저가" },
    ]},
    { value: "grok", label: "Grok", ready: false, note: "라우팅 미연동 — Claude(Haiku)로 대체 실행됩니다", models: [
      { value: "grok-4", label: "Grok 4" },
      { value: "grok-4-mini", label: "Grok 4 mini · 저렴" },
    ]},
    { value: "deepseek", label: "DeepSeek", ready: false, note: "라우팅 미연동 — Claude(Haiku)로 대체 실행됩니다", models: [
      { value: "deepseek-chat", label: "Chat · 가성비" },
      { value: "deepseek-reasoner", label: "Reasoner · 추론" },
    ]},
    { value: "mistral", label: "Mistral", ready: false, note: "라우팅 미연동 — Claude(Haiku)로 대체 실행됩니다", models: [
      { value: "mistral-large", label: "Large · 고급" },
      { value: "mistral-small", label: "Small · 저렴" },
    ]},
    // 로컬 AI — 내 PC에서 도는 무료 모델. 원가 0원이지만 제약이 크다(아래 note).
    { value: "local", label: "로컬(무료)", ready: false,
      note: "내 PC에 Ollama 설치 + CORS 허용 필요. HTTPS 사이트에서 http://localhost 호출은 브라우저가 막을 수 있음 — 가이드 참고", models: [
      { value: "llama3.3", label: "Llama 3.3 · 범용" },
      { value: "qwen2.5", label: "Qwen 2.5 · 다국어" },
      { value: "exaone3.5:7.8b", label: "EXAONE 3.5 · 한국어" },
      { value: "gemma2", label: "Gemma 2 · 가벼움" },
      { value: "deepseek-r1", label: "DeepSeek-R1 · 추론" },
    ]},
  ],
  search: [
    { value: "tavily", label: "Tavily", ready: false, note: "검색 API 연결이 필요합니다", models: [{ value: "search", label: "웹 검색" }] },
    { value: "perplexity", label: "Perplexity", ready: false, note: "Sonar API 연결이 필요합니다", models: [{ value: "sonar", label: "Sonar · 출처 포함" }] },
    { value: "exa", label: "Exa", ready: false, note: "검색 API 연결이 필요합니다", models: [{ value: "neural", label: "의미 기반 검색" }] },
  ],
  image: [
    { value: "fal", label: "fal.ai", ready: false, note: "이미지 라우팅 연결이 필요합니다", models: [
      { value: "fal-ai/flux-pro/v1.1", label: "FLUX Pro · 고품질" },
      { value: "fal-ai/imagen4/preview", label: "Imagen 4 · 범용" },
      { value: "fal-ai/ideogram/v2", label: "Ideogram · 글자 강함" },
      { value: "fal-ai/recraft-v3", label: "Recraft · 디자인·로고" },
    ]},
    { value: "openai-img", label: "gpt-image", ready: false, note: "이미지 라우팅 연결이 필요합니다", models: [{ value: "gpt-image", label: "gpt-image · 편집" }] },
  ],
  video: [
    { value: "fal-video", label: "fal.ai", ready: false, note: "영상 라우팅 연결이 필요합니다", models: [
      { value: "fal-ai/kling-video", label: "Kling · 고품질" },
      { value: "fal-ai/google/veo", label: "Veo · 고품질" },
      { value: "fal-ai/bytedance/seedance/v1", label: "Seedance · 범용" },
      { value: "fal-ai/ltx-video", label: "LTX · 빠름·저렴" },
    ]},
  ],
  voice: [
    { value: "elevenlabs", label: "ElevenLabs", ready: false, note: "TTS 연결이 필요합니다", models: [{ value: "tts", label: "음성 합성" }] },
    { value: "openai-tts", label: "OpenAI", ready: false, note: "TTS/STT 연결이 필요합니다", models: [
      { value: "tts", label: "TTS · 저렴" },
      { value: "whisper", label: "Whisper · 받아쓰기" },
    ]},
    { value: "suno", label: "Suno", ready: false, note: "음악 생성 연결이 필요합니다", models: [{ value: "music", label: "음악 생성" }] },
  ],
  deliver: [
    { value: "email",    label: "이메일",   ready: true,  models: [{ value: "compose", label: "메일 작성 열기" }] },
    { value: "github",   label: "깃허브",   ready: false, note: "저장소·토큰 연결이 필요합니다", models: [{ value: "commit", label: "저장소에 커밋" }, { value: "pr", label: "PR 만들기" }] },
    { value: "sns",      label: "SNS",      ready: false, note: "계정 연동·앱 심사가 필요합니다", models: [
      { value: "instagram", label: "인스타그램" }, { value: "x", label: "X (트위터)" }, { value: "facebook", label: "페이스북" }, { value: "threads", label: "스레드" },
    ]},
    { value: "telegram", label: "텔레그램", ready: false, note: "봇 토큰 연결이 필요합니다", models: [{ value: "bot", label: "봇으로 보내기" }] },
    { value: "kakao",    label: "카톡",     ready: false, note: "카카오 연동이 필요합니다", models: [{ value: "me", label: "나에게 보내기" }] },
  ],
  timer: [
    { value: "schedule", label: "예약", ready: false, note: "컴퓨터를 꺼도 도는 자동화 서버가 필요합니다(보류 중)", models: [
      { value: "daily", label: "매일" }, { value: "weekly", label: "매주" }, { value: "hourly", label: "매시간" },
    ]},
  ],
};

export function toolsFor(kind: MemberKind): ToolDef[] { return KIND_TOOLS[kind] || KIND_TOOLS.llm; }
export function toolDef(kind: MemberKind, tool: string): ToolDef {
  return toolsFor(kind).find((t) => t.value === tool) || toolsFor(kind)[0];
}
export function kindLabel(kind: MemberKind): string {
  return MEMBER_KINDS.find((k) => k.value === kind)?.label || kind;
}
export function kindEmoji(kind: MemberKind): string {
  return MEMBER_KINDS.find((k) => k.value === kind)?.emoji || "🧠";
}

export const DEFAULT_KIND: MemberKind = "llm";
export const DEFAULT_TOOL = "claude";
export const DEFAULT_MODEL = "claude-haiku-4-5"; // 기본은 가장 저렴한 모델

/** 3단계 표시용 헬퍼 */
export function toolLabelOf(kind: MemberKind, tool: string): string { return toolDef(kind, tool).label; }
export function modelsOf(kind: MemberKind, tool: string) { return toolDef(kind, tool).models; }
export function modelLabelOf(kind: MemberKind, tool: string, model: string): string {
  return modelsOf(kind, tool).find((m) => m.value === model)?.label || model;
}
/** 실제로 실행되는가 — 지금은 Claude(LLM) 직접 호출과 이메일(mailto)뿐 */
export function isRunnable(kind: MemberKind, tool: string): boolean { return toolDef(kind, tool).ready; }
export function toolNote(kind: MemberKind, tool: string): string { return toolDef(kind, tool).note || ""; }
export function isDeliverKind(kind: MemberKind): boolean { return kind === "deliver"; }

// 부서·팀 뱃지에서 고를 수 있는 이모지 (클릭 → 그리드에서 바로 교체)
export const EMOJI_CHOICES = [
  "🗂️", "💡", "✍️", "📣", "🎨", "💻", "📊", "🔍",
  "🤝", "💰", "📦", "🚀", "🧪", "📸", "🎬", "🎧",
  "🧠", "⚙️", "📝", "🌐", "❤️", "⭐", "🔥", "🌱",
];

export const STATUS_META: Record<OrgStatus, { label: string }> = {
  work: { label: "작업중" },
  review: { label: "검수중" },
  done: { label: "완료" },
  wait: { label: "대기" },
  alert: { label: "확인 필요" },
};

export function newId(p: string): string {
  return `${p}_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/* ─────────────── 세팅된 자료(프리셋) ───────────────
 * 버튼 한 번에 "부서 → 팀 → 직원(역할·모델까지)"이 통째로 만들어진다.
 * 직원 순서 = 일하는 순서(아래에서 위로 올라가며 상급자가 검토).
 * 기본 모델은 전부 저렴한 Haiku — 원가가 새지 않게.
 */
export type OrgPreset = {
  id: string;
  label: string;   // 버튼에 보이는 작업 이름 ("블로그 글 생성")
  dept: string;    // 실제로 만들어질 부서 이름 ("블로그 생성부") — 라벨과 다르다
  emoji: string;
  color: OrgColor;
  icon: OrgIcon;
  team: string;
  members: { name: string; role: string; model?: string }[];
};

export const ORG_PRESETS: OrgPreset[] = [
  {
    // 기획서 §5 'AI Blog Expert' 라인업 그대로 — 3명으로는 이 품질이 안 나온다.
    id: "blog", label: "블로그 글 생성", dept: "블로그 생성부", emoji: "✍️", color: "blue", icon: "bulb", team: "콘텐츠팀",
    members: [
      { name: "기획자",   role: "독자·목차·제목 후보·검색 키워드를 잡아 기획안 작성" },
      { name: "조사원",   role: "글에 들어갈 사실·수치·사례를 정리(확인 필요한 건 표시)" },
      { name: "검색원",   role: "확인 필요 항목을 실제 웹에서 검색해 출처와 함께 보강" },
      { name: "작가",     role: "기획안 목차대로 조사 자료를 녹여 본문 작성" },
      { name: "팩트체커", role: "사실 오류·근거 없는 단정만 골라 '문장→문제→수정안'으로 지적" },
      { name: "SEO담당",  role: "제목·소제목 키워드, 메타 설명문 등 검색 최적화 지적" },
      { name: "교정자",   role: "지적을 반영하고 AI 티 나는 표현을 걷어내 최종 원고 완성" },
      { name: "편집장",   role: "100점 만점 심사. 80점 미만이면 작가에게 되돌려 다시 쓰게 함" },
      { name: "발행담당", role: "제목·메타·본문 형식으로 발행 가능한 형태로 정리" },
      { name: "전송담당", role: "완성본을 이메일·깃허브 등 채널로 내보내기" },
    ],
  },
  {
    id: "sns", label: "SNS 게시물", dept: "SNS 홍보부", emoji: "📣", color: "pink", icon: "megaphone", team: "SNS팀",
    members: [
      { name: "기획자", role: "타깃과 후킹 포인트를 잡고 게시물 컨셉 정하기" },
      { name: "카피라이터", role: "인스타·페북용 짧고 임팩트 있는 카피 작성(해시태그 포함)" },
    ],
  },
  {
    id: "product", label: "상품 상세페이지", dept: "상품 기획부", emoji: "📦", color: "teal", icon: "code", team: "상품팀",
    members: [
      { name: "분석가", role: "상품의 강점·경쟁 상품과의 차별점 정리" },
      { name: "작가",   role: "구매 욕구를 자극하는 상세페이지 문구 작성" },
      { name: "검수자", role: "과장·허위 표현을 걸러내고 표현 다듬기" },
    ],
  },
  {
    id: "reply", label: "고객 응대", dept: "고객 응대부", emoji: "🤝", color: "violet", icon: "message", team: "CS팀",
    members: [
      { name: "분석가", role: "문의·후기의 의도와 감정을 파악해 요점 정리" },
      { name: "상담원", role: "정중하고 신뢰가 가는 답변 작성" },
    ],
  },
];

/** 프리셋 → 실제 부서 객체 (부서·팀·직원이 역할까지 세팅된 채로) */
export function buildPreset(p: OrgPreset): OrgDivision {
  return {
    id: newId("bu"),
    name: p.dept,
    color: p.color,
    icon: p.icon,
    emoji: p.emoji,
    teams: [{
      id: newId("tm"),
      name: p.team,
      members: p.members.map((m) => ({
        id: newId("mb"),
        name: m.name,
        role: m.role,
        status: "wait" as OrgStatus,
        kind: DEFAULT_KIND,
        tool: DEFAULT_TOOL,
        model: m.model || DEFAULT_MODEL,
      })),
    }],
  };
}

function orgKey(userKey: string): string {
  return `illo_orgchart_v1__${userKey || "local"}`;
}

// 구버전 → 신버전 정규화.
// 예전 직원은 tool이 없고 model이 평면 값("sonnet","gpt4o",…)이었다. 그대로 두면
// 2단계 선택(도구→모델)에서 매칭이 안 돼 조직도가 깨진다. 읽는 시점에 한 번 변환한다.
const LEGACY_MODEL: Record<string, { kind: MemberKind; tool: string; model: string }> = {
  opus:   { kind: "llm", tool: "claude", model: "claude-opus-4-8" },
  sonnet: { kind: "llm", tool: "claude", model: "claude-sonnet-5" },
  haiku:  { kind: "llm", tool: "claude", model: "claude-haiku-4-5" },
  gpt4o:  { kind: "llm", tool: "gpt",    model: "gpt-5.5" },
  gemini: { kind: "llm", tool: "gemini", model: "gemini-2.5-flash" },
  fal:    { kind: "image", tool: "fal",  model: "fal-ai/flux-pro/v1.1" },
  gimg:   { kind: "image", tool: "openai-img", model: "gpt-image" },
};
// 2단계 시절의 tool 값 → 3단계 kind
const LEGACY_TOOL_KIND: Record<string, MemberKind> = {
  claude: "llm", gpt: "llm", gemini: "llm", grok: "llm",
  email: "deliver", github: "deliver", sns: "deliver", telegram: "deliver", kakao: "deliver",
};

export function normalizeOrg(arr: unknown): OrgDivision[] {
  if (!Array.isArray(arr)) return [];
  return (arr as OrgDivision[]).map((d) => ({
    ...d,
    teams: (d.teams || []).map((t) => {
      const members = (t.members || []).map((m) => {
        const raw = m as OrgMember & { kind?: MemberKind; tool?: string };
        // 이미 3단계로 저장돼 있고 값이 유효하면 그대로
        if (raw.kind && raw.tool && modelsOf(raw.kind, raw.tool).some((x) => x.value === raw.model)) return raw;
        // 2단계 시절(tool만 있음) → kind 유추
        if (raw.tool && LEGACY_TOOL_KIND[raw.tool]) {
          const kind = LEGACY_TOOL_KIND[raw.tool];
          const ok = modelsOf(kind, raw.tool).some((x) => x.value === raw.model);
          return { ...raw, kind, tool: raw.tool, model: ok ? raw.model : modelsOf(kind, raw.tool)[0].value };
        }
        // 1단계 시절(평면 model 값)
        const legacy = LEGACY_MODEL[raw.model as string];
        if (legacy) return { ...raw, kind: legacy.kind, tool: legacy.tool, model: legacy.model };
        return { ...raw, kind: DEFAULT_KIND, tool: DEFAULT_TOOL, model: DEFAULT_MODEL };
      });
      // 흐름 링크 정리: 없는 직원 참조·자기연결·중복 제거
      const ids = new Set(members.map((m) => m.id));
      const seen = new Set<string>();
      const links = (t.links || []).filter((l) => {
        if (!l || l.from === l.to || !ids.has(l.from) || !ids.has(l.to)) return false;
        const k = `${l.from}>${l.to}`;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
      return { ...t, members, links };
    }),
  }));
}

export function loadOrg(userKey: string): OrgDivision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(orgKey(userKey));
    return normalizeOrg(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export function saveOrg(userKey: string, divisions: OrgDivision[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(orgKey(userKey), JSON.stringify(divisions));
  } catch {
    /* 용량 초과 등 무시 */
  }
}

/* ─────────────────── 클라우드 동기화 (계정별) ───────────────────
 * projectSaves/illoOrg/users/{uid}  { data: <divisions JSON>, updatedAt }
 *
 * 왜 projectSaves를 재사용하나:
 *  - 규칙 `match /projectSaves/{project}/users/{uid}` (본인만)이 **이미 배포**돼 있어
 *    새 컬렉션처럼 firestore.rules를 따로 배포할 필요가 없다(안 하면 쓰기가 조용히 거부됨).
 *  - uid 기준 단일 문서라 자동화 서버(cron)가 문서 하나만 읽으면 조직도를 알 수 있다.
 *    → 컴퓨터를 꺼도 서버가 조직도를 읽어 일을 시킬 수 있는 전제(B)가 여기서 깔린다.
 */
const ORG_PROJECT = "illoOrg";

/** 클라우드 조직도. 문서 자체가 없으면 null, 비운 상태면 [] (이 둘을 구분해야 삭제가 되살아나지 않음). */
export async function loadOrgCloud(): Promise<OrgDivision[] | null> {
  try {
    const { loadProject } = await import("@/lib/projectSave");
    const raw = await loadProject(ORG_PROJECT);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? normalizeOrg(arr) : null;
  } catch {
    return null;
  }
}

export async function saveOrgCloud(divisions: OrgDivision[]): Promise<boolean> {
  try {
    const { saveProject } = await import("@/lib/projectSave");
    return await saveProject(ORG_PROJECT, JSON.stringify(divisions));
  } catch {
    return false;
  }
}

// 이름을 한 글자 칠 때마다 commit()이 돌기 때문에, 클라우드 쓰기는 디바운스한다.
let cloudTimer: ReturnType<typeof setTimeout> | null = null;
export function saveOrgCloudDebounced(divisions: OrgDivision[], ms = 1500): void {
  if (cloudTimer) clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => { cloudTimer = null; void saveOrgCloud(divisions); }, ms);
}

/**
 * 진입 시 동기화. 클라우드가 source of truth(다른 기기·자동화 서버가 같은 걸 본다).
 *  - 클라우드 문서가 있으면(비어 있더라도) 그게 진실 → 로컬에도 미러
 *  - 클라우드 문서가 아예 없고 로컬에만 있으면 → 첫 이전(로컬을 올림)
 * ⚠️ 오프라인에서 고친 내용은 다음 접속 때 클라우드에 밀릴 수 있음(단일 사용자 기준 허용).
 */
export async function syncOrg(userKey: string): Promise<OrgDivision[]> {
  const local = loadOrg(userKey);
  const cloud = await loadOrgCloud();
  if (cloud !== null) { saveOrg(userKey, cloud); return cloud; }
  if (local.length) { await saveOrgCloud(local); return local; }
  return local;
}
