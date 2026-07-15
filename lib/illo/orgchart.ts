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
  model: string; // MODEL_OPTIONS의 value
};
export type OrgTeam = { id: string; name: string; members: OrgMember[] };
export type OrgDivision = {
  id: string;
  name: string;
  color: OrgColor;
  icon: OrgIcon;
  teams: OrgTeam[];
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

// 팀원에게 붙일 수 있는 AI 모델(도구) 목록.
export const MODEL_OPTIONS: { value: string; label: string }[] = [
  { value: "opus", label: "Claude Opus 4.8" },
  { value: "sonnet", label: "Claude Sonnet 5" },
  { value: "haiku", label: "Claude Haiku 4.5" },
  { value: "gpt4o", label: "GPT-4o" },
  { value: "gemini", label: "Gemini 2.5" },
  { value: "fal", label: "fal · 이미지" },
  { value: "gimg", label: "gpt-image · 이미지" },
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

function orgKey(userKey: string): string {
  return `illo_orgchart_v1__${userKey || "local"}`;
}

export function loadOrg(userKey: string): OrgDivision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(orgKey(userKey));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as OrgDivision[]) : [];
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
