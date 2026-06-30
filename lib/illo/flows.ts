// 일로(Illo) 사용자 워크플로우 — localStorage 기반 노드 그래프 저장
// page.client.tsx: listUserFlows, saveUserFlow, deleteUserFlow, blankFlow, newId, UserFlow, FlowNode

import type { StepKind } from "@/lib/illo/automations";

// 캔버스 노드 = 단계(아이콘/제목/역할/설명/종류) + 위치 + 이 노드에 줄 명령(instruction)
export type FlowNode = {
  id: string;
  kind: StepKind;
  icon: string;
  title: string;
  role: string;
  detail: string;
  instruction?: string;   // 이 노드(AI)가 받은 내용 + 이 명령대로 처리 → 다음 노드로
  x: number;
  y: number;
};

// 노드 4면 — 어느 면에서든 받고/내보낼 수 있고, 한 면에서 여러 갈래로 연결 가능.
export type Side = "top" | "right" | "bottom" | "left";

export type FlowLink = {
  from: string;
  to: string;
  fromSide?: Side;   // 출발 면 (없으면 기본 오른쪽)
  toSide?: Side;     // 도착 면 (없으면 기본 왼쪽)
};

export type UserFlow = {
  id: string;
  name: string;
  nodes: FlowNode[];
  links: FlowLink[];
  updatedAt?: string;
};

const KEY = "illo_user_flows_v1";

export function newId(): string {
  return `n_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function read(): UserFlow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as UserFlow[]) : [];
  } catch {
    return [];
  }
}

function write(items: UserFlow[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* 무시 */
  }
}

export function blankFlow(): UserFlow {
  return { id: newId(), name: "", nodes: [], links: [] };
}

export function listUserFlows(): UserFlow[] {
  return read().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export function saveUserFlow(flow: UserFlow): void {
  const stamped: UserFlow = { ...flow, updatedAt: new Date().toISOString() };
  const list = read();
  const i = list.findIndex((f) => f.id === flow.id);
  if (i >= 0) list[i] = stamped;
  else list.unshift(stamped);
  write(list);
}

export function deleteUserFlow(id: string): void {
  write(read().filter((f) => f.id !== id));
}

// ── 결합 보관 — 완성한 노드들을 통째로 "재사용 틀"로 저장 ──
const TKEY = "illo_user_templates_v1";
export type SavedTemplate = { id: string; name: string; nodes: FlowNode[]; links: FlowLink[]; updatedAt?: string };

function readT(): SavedTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TKEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as SavedTemplate[]) : [];
  } catch { return []; }
}
function writeT(items: SavedTemplate[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TKEY, JSON.stringify(items)); } catch { /* 무시 */ }
}

export function listUserTemplates(): SavedTemplate[] {
  return readT().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

/** 현재 워크플로우(노드+연결)를 재사용 틀로 보관. 같은 이름이면 덮어씀. */
export function saveUserTemplate(flow: UserFlow): SavedTemplate {
  const t: SavedTemplate = {
    id: newId(),
    name: flow.name.trim() || "이름 없는 틀",
    nodes: JSON.parse(JSON.stringify(flow.nodes)),
    links: JSON.parse(JSON.stringify(flow.links)),
    updatedAt: new Date().toISOString(),
  };
  const list = readT().filter((x) => x.name !== t.name); // 동명 틀 교체
  list.unshift(t);
  writeT(list);
  return t;
}

export function deleteUserTemplate(id: string): void {
  writeT(readT().filter((t) => t.id !== id));
}

/** 보관한 틀 → 새 편집본(노드/연결 id 재발급, 위치·명령·연결 보존). */
export function instantiateTemplate(t: SavedTemplate): UserFlow {
  const map = new Map<string, string>();
  const nodes = t.nodes.map((n) => { const nid = newId(); map.set(n.id, nid); return { ...n, id: nid }; });
  const links = t.links.map((l) => ({ ...l, from: map.get(l.from) || l.from, to: map.get(l.to) || l.to }));
  return { id: newId(), name: t.name, nodes, links };
}
