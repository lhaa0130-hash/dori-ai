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
    return Array.isArray(arr) ? (arr as OrgDivision[]) : null;
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
