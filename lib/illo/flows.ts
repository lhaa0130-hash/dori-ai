// 일로(Illo) 사용자 워크플로우 — localStorage 기반 노드 그래프 저장
// page.client.tsx: listUserFlows, saveUserFlow, deleteUserFlow, blankFlow, newId, UserFlow, FlowNode

import type { StepKind } from "@/lib/illo/automations";

// 캔버스 노드 = 단계(아이콘/제목/역할/설명/종류) + 위치
export type FlowNode = {
  id: string;
  kind: StepKind;
  icon: string;
  title: string;
  role: string;
  detail: string;
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
