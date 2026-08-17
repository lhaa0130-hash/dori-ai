// 노드 스튜디오 — 그래프 모델 + localStorage 저장.
//
// 기존 flows.ts(FlowNode 기반)와 별도 저장소를 쓴다. FlowNode는 kind: StepKind(input/vision/...)라
// 기획·개발·업로드 같은 새 종류를 표현하지 못하기 때문. 연결선·id 발급은 flows.ts 것을 그대로 재사용한다.

import { newId, type FlowLink, type Side } from "@/lib/illo/flows";
import type { CatId } from "@/lib/illo/nodeKit";
import { CAT_BY_ID } from "@/lib/illo/nodeKit";

export type { FlowLink, Side };
export { newId };

/** 캔버스 노드 = 업무 종류 + 결합한 AI 도구 + 이 노드에 준 지시 + 위치. */
export interface StudioNode {
  id: string;
  catId: CatId;
  toolId?: string;      // 우측에서 결합한 AI 도구 (없으면 아직 미결합)
  variant?: string;     // 그 도구의 모델 버전
  title: string;        // 기본은 종류 이름, 사용자가 바꿀 수 있다
  instruction?: string; // 이 노드에만 주는 개별 지시
  x: number;
  y: number;
}

export interface StudioFlow {
  id: string;
  name: string;
  command: string;      // 최상단 업무 지시 — 워크플로우 전체에 흐르는 명령
  nodes: StudioNode[];
  links: FlowLink[];
  updatedAt?: string;
}

const KEY = "illo_node_studio_v1";

/* ─────────────────────────── 저장 ─────────────────────────── */

function read(): StudioFlow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as StudioFlow[]) : [];
  } catch {
    return [];
  }
}

function write(items: StudioFlow[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* 무시 */ }
}

export function listStudioFlows(): StudioFlow[] {
  return read().sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export function saveStudioFlow(flow: StudioFlow): void {
  const stamped: StudioFlow = { ...flow, updatedAt: new Date().toISOString() };
  const list = read();
  const i = list.findIndex((f) => f.id === flow.id);
  if (i >= 0) list[i] = stamped;
  else list.unshift(stamped);
  write(list);
}

export function deleteStudioFlow(id: string): void {
  write(read().filter((f) => f.id !== id));
}

/* ─────────────────────────── 생성 ─────────────────────────── */

export function blankStudioFlow(name = ""): StudioFlow {
  return { id: newId(), name, command: "", nodes: [], links: [] };
}

/** 좌측 팔레트에서 끌어다 놓은 종류로 새 노드 만들기. x/y는 드롭 지점. */
export function makeNode(catId: CatId, x: number, y: number): StudioNode {
  return {
    id: newId(),
    catId,
    title: CAT_BY_ID[catId]?.name || catId,
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
  };
}

/* ─────────────────────────── 그래프 조작 ─────────────────────────── */

/** 같은 두 노드 사이 중복 연결·자기 자신 연결을 막고 링크를 더한다. */
export function addLink(links: FlowLink[], from: string, to: string, fromSide?: Side, toSide?: Side): FlowLink[] {
  if (from === to) return links;
  if (links.some((l) => l.from === from && l.to === to)) return links;
  return [...links, { from, to, fromSide, toSide }];
}

/** 노드와 그 노드에 걸린 링크를 함께 제거. */
export function removeNode(flow: StudioFlow, id: string): StudioFlow {
  return {
    ...flow,
    nodes: flow.nodes.filter((n) => n.id !== id),
    links: flow.links.filter((l) => l.from !== id && l.to !== id),
  };
}
