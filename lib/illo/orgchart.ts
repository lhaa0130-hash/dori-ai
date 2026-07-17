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
  tool: AiTool;   // 1단계: 도구(Claude/GPT/Gemini/Grok)
  model: string;  // 2단계: 그 도구의 상세 모델 id
  result?: string;      // 이 직원이 낸 결과물 (결과보기▼)
  resultAt?: string;    // 실행 시각(ISO)
};
export type OrgTeam = {
  id: string;
  name: string;
  emoji?: string;   // 없으면 부서 색 + 기본 아이콘
  members: OrgMember[];
  review?: string;    // 팀원 결과를 모아 상급자(팀장)가 검토한 내용
  reviewAt?: string;
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
export type AiTool = "claude" | "gpt" | "gemini" | "grok";

export const AI_TOOLS: { value: AiTool; label: string; emoji: string; runnable: boolean }[] = [
  { value: "claude", label: "Claude",  emoji: "🟧", runnable: true  },
  { value: "gpt",    label: "GPT",     emoji: "🟩", runnable: false },
  { value: "gemini", label: "Gemini",  emoji: "🔷", runnable: false },
  { value: "grok",   label: "Grok",    emoji: "⬛", runnable: false },
];

export const TOOL_MODELS: Record<AiTool, { value: string; label: string }[]> = {
  claude: [
    { value: "claude-opus-4-8",   label: "Opus 4.8 · 최고급" },
    { value: "claude-sonnet-5",   label: "Sonnet 5 · 균형" },
    { value: "claude-haiku-4-5",  label: "Haiku 4.5 · 빠르고 저렴" },
  ],
  gpt: [
    { value: "gpt-5.5",       label: "GPT-5.5 · 범용" },
    { value: "gpt-5.4-mini",  label: "GPT-5.4 mini · 저렴" },
  ],
  gemini: [
    { value: "gemini-2.5-pro",   label: "Gemini 2.5 Pro · 고급" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash · 초저가" },
  ],
  grok: [
    { value: "grok-4",      label: "Grok 4" },
    { value: "grok-4-mini", label: "Grok 4 mini · 저렴" },
  ],
};

export const DEFAULT_TOOL: AiTool = "claude";
export const DEFAULT_MODEL = "claude-haiku-4-5"; // 기본은 가장 저렴한 모델

export function modelsFor(tool: AiTool) {
  return TOOL_MODELS[tool] || TOOL_MODELS.claude;
}
export function toolLabel(tool: AiTool): string {
  return AI_TOOLS.find((t) => t.value === tool)?.label || tool;
}
export function modelLabelOf(tool: AiTool, model: string): string {
  return modelsFor(tool).find((m) => m.value === model)?.label || model;
}
export function isRunnable(tool: AiTool): boolean {
  return !!AI_TOOLS.find((t) => t.value === tool)?.runnable;
}

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
  label: string;
  emoji: string;
  color: OrgColor;
  icon: OrgIcon;
  team: string;
  members: { name: string; role: string; model?: string }[];
};

export const ORG_PRESETS: OrgPreset[] = [
  {
    id: "blog", label: "블로그 글 생성", emoji: "✍️", color: "blue", icon: "bulb", team: "콘텐츠팀",
    members: [
      { name: "조사원", role: "주제의 핵심 사실·최신 트렌드·검색 키워드를 조사해 정리" },
      { name: "작가",   role: "조사 내용을 검색 잘 되는 블로그 글로 작성(제목·소제목 포함)" },
      { name: "검수자", role: "사실 오류·어색한 문장·과장 표현을 잡아 다듬기" },
    ],
  },
  {
    id: "sns", label: "SNS 게시물", emoji: "📣", color: "pink", icon: "megaphone", team: "SNS팀",
    members: [
      { name: "기획자", role: "타깃과 후킹 포인트를 잡고 게시물 컨셉 정하기" },
      { name: "카피라이터", role: "인스타·페북용 짧고 임팩트 있는 카피 작성(해시태그 포함)" },
    ],
  },
  {
    id: "product", label: "상품 상세페이지", emoji: "📦", color: "teal", icon: "code", team: "상품팀",
    members: [
      { name: "분석가", role: "상품의 강점·경쟁 상품과의 차별점 정리" },
      { name: "작가",   role: "구매 욕구를 자극하는 상세페이지 문구 작성" },
      { name: "검수자", role: "과장·허위 표현을 걸러내고 표현 다듬기" },
    ],
  },
  {
    id: "reply", label: "고객 응대", emoji: "🤝", color: "violet", icon: "message", team: "CS팀",
    members: [
      { name: "분석가", role: "문의·후기의 의도와 감정을 파악해 요점 정리" },
      { name: "상담원", role: "정중하고 신뢰가 가는 답변 작성" },
    ],
  },
];

/** 프리셋 → 실제 부서 객체 */
export function buildPreset(p: OrgPreset): OrgDivision {
  return {
    id: newId("bu"),
    name: p.label,
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
const LEGACY_MODEL: Record<string, { tool: AiTool; model: string }> = {
  opus:   { tool: "claude", model: "claude-opus-4-8" },
  sonnet: { tool: "claude", model: "claude-sonnet-5" },
  haiku:  { tool: "claude", model: "claude-haiku-4-5" },
  gpt4o:  { tool: "gpt",    model: "gpt-5.5" },
  gemini: { tool: "gemini", model: "gemini-2.5-flash" },
  fal:    { tool: "claude", model: DEFAULT_MODEL }, // 이미지 모델은 조직도에서 제외됨
  gimg:   { tool: "claude", model: DEFAULT_MODEL },
};

export function normalizeOrg(arr: unknown): OrgDivision[] {
  if (!Array.isArray(arr)) return [];
  return (arr as OrgDivision[]).map((d) => ({
    ...d,
    teams: (d.teams || []).map((t) => ({
      ...t,
      members: (t.members || []).map((m) => {
        const raw = m as OrgMember & { tool?: AiTool };
        if (raw.tool && modelsFor(raw.tool).some((x) => x.value === raw.model)) return raw;
        const legacy = LEGACY_MODEL[raw.model as string];
        if (legacy) return { ...raw, tool: legacy.tool, model: legacy.model };
        return { ...raw, tool: DEFAULT_TOOL, model: DEFAULT_MODEL };
      }),
    })),
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
