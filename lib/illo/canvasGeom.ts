// 노드 캔버스 기하 — 노드 크기, 4면 연결점, 베지어 제어점.
// app/illo/app/page.client.tsx의 FlowBuilder에 있던 것을 그대로 옮겨왔다.

import type { Side } from "@/lib/illo/flows";

export const NODE_W = 208;
export const NODE_H = 132;

export const SIDES: Side[] = ["top", "right", "bottom", "left"];

/** 노드의 한 면(side)에 있는 연결점 좌표. */
export function sideAnchor(n: { x: number; y: number }, side: Side): { x: number; y: number } {
  switch (side) {
    case "top": return { x: n.x + NODE_W / 2, y: n.y };
    case "bottom": return { x: n.x + NODE_W / 2, y: n.y + NODE_H };
    case "left": return { x: n.x, y: n.y + NODE_H / 2 };
    default: return { x: n.x + NODE_W, y: n.y + NODE_H / 2 }; // right
  }
}

/** 면 방향으로 뻗는 베지어 제어점 — 선이 노드에서 자연스럽게 빠져나가게 한다. */
export function ctrlPoint(p: { x: number; y: number }, side: Side, k = 64): { x: number; y: number } {
  switch (side) {
    case "top": return { x: p.x, y: p.y - k };
    case "bottom": return { x: p.x, y: p.y + k };
    case "left": return { x: p.x - k, y: p.y };
    default: return { x: p.x + k, y: p.y }; // right
  }
}

/** 두 노드를 잇는 SVG path의 d 값. */
export function linkPath(
  from: { x: number; y: number }, fromSide: Side,
  to: { x: number; y: number }, toSide: Side,
): string {
  const p1 = sideAnchor(from, fromSide);
  const p2 = sideAnchor(to, toSide);
  const c1 = ctrlPoint(p1, fromSide);
  const c2 = ctrlPoint(p2, toSide);
  return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
}
