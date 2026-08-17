// 노드 스튜디오 실행 엔진 — 위상정렬로 순서를 정하고, 노드 하나씩 AI에 태워 결과를 다음 노드로 넘긴다.
// app/illo/app/page.client.tsx의 runFlow() 로직을 옮기되, "노드 1개 실행"을 함수로 떼어냈다.
// 그래야 상세보기에서 그 노드만 다시 요청할 수 있다.

import type { FlowLink, StudioFlow, StudioNode } from "@/lib/illo/nodeStudio";
import { CAT_BY_ID, toolById } from "@/lib/illo/nodeKit";

/**
 * 실제 AI 호출. 부모(IlloWebClient)의 callModel을 그대로 받아 쓴다 —
 * 본인 키가 있으면 브라우저에서 Claude 직접 호출, 없으면 로그인 토큰으로 무료 프록시,
 * 남은 무료 횟수 갱신까지 이미 그쪽에 들어 있다.
 */
export type NodeCaller = (prompt: string, maxTokens?: number) => Promise<string>;

export type RunStatus = "idle" | "running" | "done" | "error";

export interface NodeRun {
  status: RunStatus;
  output: string;
  prompt: string;      // 실제로 보낸 프롬프트 — 상세보기에 그대로 보여준다
  inputText: string;   // 앞 노드에서 받은 내용
  error?: string;
  stub?: boolean;      // 미연동 도구 — 프롬프트·사양만 만든 결과
  at?: string;
}

export const emptyRun = (): NodeRun => ({ status: "idle", output: "", prompt: "", inputText: "" });

/* ─────────────────────────── 그래프 순서 ─────────────────────────── */

/** 연결 순서대로(Kahn 위상정렬). 사이클로 빠진 노드는 배열 순서로 뒤에 붙인다. */
export function topoOrder(nodes: StudioNode[], links: FlowLink[]): string[] {
  const ids = new Set(nodes.map((n) => n.id));
  const valid = links.filter((l) => ids.has(l.from) && ids.has(l.to));

  const indeg = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const outAdj = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  valid.forEach((l) => {
    indeg.set(l.to, (indeg.get(l.to) || 0) + 1);
    outAdj.get(l.from)?.push(l.to);
  });

  const q = nodes.filter((n) => (indeg.get(n.id) || 0) === 0).map((n) => n.id);
  const order: string[] = [];
  while (q.length) {
    const id = q.shift() as string;
    order.push(id);
    for (const t of outAdj.get(id) || []) {
      indeg.set(t, (indeg.get(t) || 0) - 1);
      if ((indeg.get(t) || 0) === 0) q.push(t);
    }
  }
  const seen = new Set(order);
  nodes.forEach((n) => { if (!seen.has(n.id)) order.push(n.id); }); // 사이클 누락분 보충
  return order;
}

/** 이 노드로 들어오는(앞) 노드 id들. */
export function incomingOf(links: FlowLink[], id: string): string[] {
  return links.filter((l) => l.to === id).map((l) => l.from);
}

/** 이 노드와, 이 노드에서 흘러가는 모든 아래쪽 노드. (노드 하나를 고친 뒤 하류만 다시 돌릴 때 쓴다) */
export function descendants(links: FlowLink[], id: string): Set<string> {
  const out = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop() as string;
    for (const l of links) {
      if (l.from === cur && !out.has(l.to)) { out.add(l.to); stack.push(l.to); }
    }
  }
  return out;
}

/* ─────────────────────────── 프롬프트 조립 ─────────────────────────── */

export function buildPrompt(opts: {
  node: StudioNode;
  inputText: string;
  command: string;
  revise?: string;
  prevOutput?: string;
}): string {
  const { node, inputText, command, revise, prevOutput } = opts;
  const cat = CAT_BY_ID[node.catId];
  const t = node.toolId ? toolById(node.catId, node.toolId) : undefined;
  const isStub = (t?.exec ?? cat?.exec) === "stub";

  const toolLine = t && t.id !== "auto"
    ? `사용 도구: ${t.name}${node.variant ? ` (모델: ${node.variant})` : ""}`
    : "사용 도구: 자동 — 이 작업에 가장 잘 맞는 방식으로";

  const parts: string[] = [
    `당신은 워크플로우의 '${node.title}' 노드입니다.`,
    `종류: ${cat?.name || node.catId} / 역할: ${cat?.role || ""}`,
    toolLine,
    "",
    `[전체 업무 지시]\n${command.trim() || "(없음)"}`,
    "",
    `[이 노드가 할 일]\n${(node.instruction || cat?.systemRole || node.title).trim()}`,
    "",
    `[앞 노드에서 받은 내용]\n${inputText.trim() || "(없음 — 위 업무 지시에서 시작하세요)"}`,
  ];

  if (revise?.trim()) {
    parts.push(
      "",
      `[직전에 당신이 낸 결과]\n${(prevOutput || "").trim() || "(없음)"}`,
      "",
      `[수정 요청]\n${revise.trim()}\n위 수정 요청을 반영해 결과를 다시 작성하세요. 고친 부분만이 아니라 완성된 결과 전체를 내놓으세요.`,
    );
  }

  parts.push(
    "",
    isStub
      ? `이 도구는 아직 실제 연동 전입니다. 결과물을 직접 만들지 말고, ${t && t.id !== "auto" ? t.name : "해당 도구"}에 그대로 붙여넣을 수 있는 프롬프트·사양을 작성하세요. 파일이나 링크를 만들어냈다고 하지 마세요.`
      : "받은 내용을 바탕으로 이 노드의 결과만 깔끔하게 작성하세요. 인사말·군더더기 없이 결과물만.",
  );

  return parts.join("\n");
}

/* ─────────────────────────── 실행 ─────────────────────────── */

/** 노드 1개 실행. 상세보기의 '다시 요청'도 revise를 얹어 이 함수를 부른다. */
export async function runNode(opts: {
  call: NodeCaller;
  node: StudioNode;
  inputText: string;
  command: string;
  revise?: string;
  prevOutput?: string;
}): Promise<NodeRun> {
  const { call, node, inputText, command, revise, prevOutput } = opts;
  const cat = CAT_BY_ID[node.catId];
  const t = node.toolId ? toolById(node.catId, node.toolId) : undefined;
  const stub = (t?.exec ?? cat?.exec) === "stub";

  const prompt = buildPrompt({ node, inputText, command, revise, prevOutput });
  const base: NodeRun = { status: "running", output: "", prompt, inputText, stub };

  try {
    const text = await call(prompt, 2400);
    return { ...base, status: "done", output: (text || "").trim(), at: new Date().toISOString() };
  } catch (e) {
    return { ...base, status: "error", error: friendlyError(e), at: new Date().toISOString() };
  }
}

export function friendlyError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e);
  if (/FREE_QUOTA_EXCEEDED/.test(raw)) return "오늘 무료 한도를 다 썼어요. 내 API 키를 넣으면 무제한이에요.";
  if (/LOGIN_REQUIRED/.test(raw)) return "API 키를 넣거나 로그인해 주세요.";
  return raw.slice(0, 200);
}

export interface RunFlowResult {
  runs: Record<string, NodeRun>;
  order: string[];
  finalNodeId: string;
  error?: string;
}

/**
 * 워크플로우 실행. 위상정렬 순서대로 노드를 하나씩 돌리고, 앞 노드 출력을 다음 노드 입력으로 넘긴다.
 *
 * afterNodeId를 주면 **그 노드는 그대로 두고 아래(하류)만** 다시 돌린다.
 * ⚠️ 그 노드까지 다시 돌리면 안 된다 — 사용자가 상세보기에서 방금 수정 요청해 얻은 결과를
 *    덮어써 버리기 때문. 수정본을 하류로 흘려보내는 것이 이 기능의 목적이다.
 */
export async function runStudioFlow(opts: {
  call: NodeCaller;
  flow: StudioFlow;
  afterNodeId?: string;
  prior?: Record<string, NodeRun>;
  onUpdate?: (nodeId: string, run: NodeRun) => void;
  signal?: AbortSignal;
}): Promise<RunFlowResult> {
  const { call, flow, afterNodeId, prior, onUpdate, signal } = opts;
  const { nodes, links, command } = flow;

  const order = topoOrder(nodes, links);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const runs: Record<string, NodeRun> = { ...(prior || {}) };

  // 다시 돌릴 대상 — 기준 노드 자신은 빼고 하류만.
  let targets: Set<string> | null = null;
  if (afterNodeId) {
    targets = descendants(links, afterNodeId);
    targets.delete(afterNodeId);
  }

  let finalNodeId = order[order.length - 1] || "";
  let error: string | undefined;

  for (const id of order) {
    if (signal?.aborted) { error = "실행을 멈췄어요."; break; }
    const node = byId.get(id);
    if (!node) continue;
    if (targets && !targets.has(id)) continue; // 이번엔 건너뛰고 이전 결과 유지

    const incoming = incomingOf(links, id)
      .map((f) => runs[f]?.output)
      .filter((s): s is string => !!s && s.trim().length > 0);
    const inputText = incoming.length ? incoming.join("\n\n---\n\n") : "";

    const running: NodeRun = { ...(runs[id] || emptyRun()), status: "running", inputText };
    runs[id] = running;
    onUpdate?.(id, running);

    const done = await runNode({ call, node, inputText, command });
    runs[id] = done;
    onUpdate?.(id, done);

    if (done.status === "error") { error = done.error; break; }
    finalNodeId = id;
  }

  return { runs, order, finalNodeId, error };
}

/** 최종 결과 — 마지막으로 성공한 노드의 출력. */
export function finalOutput(res: RunFlowResult): string {
  return res.runs[res.finalNodeId]?.output || "";
}
