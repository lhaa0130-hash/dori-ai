"use client";

// 노드 스튜디오 — 좌측(업무 종류) → 캔버스(노드) → 우측(그 종류의 AI 도구) 3분할.
// 종류를 끌어다 놓으면 노드가 생기고, 도구를 노드에 끌어놓으면 "검색 : Tavily"처럼 하나로 결합된다.
// 노드끼리 이으면 워크플로우가 되고, 최상단 업무 지시를 넣고 실행하면 순서대로 흘러간다.

import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent } from "react";
import {
  Play, Save, Plus, X, Loader2, Check, Copy, KeyRound, RefreshCw,
  AlertCircle, Trash2, FileText, CornerDownRight,
} from "lucide-react";

import { ILLO_MODELS, ILLO_DEFAULT_MODEL } from "@/lib/illo/claude";
import { NODE_W, NODE_H, SIDES, sideAnchor, linkPath } from "@/lib/illo/canvasGeom";
import {
  NODE_CATEGORIES, CAT_BY_ID, toolsFor, toolById, apiEntryFor,
  type CatId, type NodeTool,
} from "@/lib/illo/nodeKit";
import {
  blankStudioFlow, makeNode, addLink, removeNode,
  listStudioFlows, saveStudioFlow, deleteStudioFlow,
  type StudioFlow, type StudioNode, type Side,
} from "@/lib/illo/nodeStudio";
import {
  runNode, runStudioFlow, emptyRun, descendants, incomingOf,
  type NodeCaller, type NodeRun,
} from "@/lib/illo/nodeRun";
import { saveDoc } from "@/lib/illo/workspace";

const MIME_CAT = "application/x-illo-cat";
const MIME_TOOL = "application/x-illo-tool";
const CANVAS_W = 2000;
const CANVAS_H = 1200;

export default function NodeStudio({ userKey, callModel, hasOwnKey, onShowKey }: {
  userKey: string;
  callModel: (prompt: string, model: string, maxTokens?: number) => Promise<string>;
  hasOwnKey: boolean;
  onShowKey: () => void;
}) {
  const [cur, setCur] = useState<StudioFlow>(() => blankStudioFlow());
  const [saved, setSaved] = useState<StudioFlow[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<{ id: string; side: Side } | null>(null);
  const [model, setModel] = useState<string>(ILLO_DEFAULT_MODEL);

  const [runs, setRuns] = useState<Record<string, NodeRun>>({});
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<{ final: string; order: string[] } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { setSaved(listStudioFlows()); }, []);

  const call: NodeCaller = useMemo(
    () => (prompt, maxTokens) => callModel(prompt, model, maxTokens),
    [callModel, model],
  );

  const sel = cur.nodes.find((n) => n.id === selId) || null;
  const detail = cur.nodes.find((n) => n.id === detailId) || null;

  /* ───────────── 노드 조작 ───────────── */

  function updateNode(id: string, patch: Partial<StudioNode>) {
    setCur((c) => ({ ...c, nodes: c.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  }
  function delNode(id: string) {
    setCur((c) => removeNode(c, id));
    setRuns((r) => { const { [id]: _drop, ...rest } = r; return rest; });
    if (selId === id) setSelId(null);
    if (detailId === id) setDetailId(null);
    if (connectFrom?.id === id) setConnectFrom(null);
  }
  function onHandle(id: string, side: Side) {
    if (!connectFrom) { setConnectFrom({ id, side }); return; }
    if (connectFrom.id === id) { setConnectFrom(null); return; }
    setCur((c) => ({ ...c, links: addLink(c.links, connectFrom.id, id, connectFrom.side, side) }));
    setConnectFrom(null);
  }
  function delLink(from: string, to: string) {
    setCur((c) => ({ ...c, links: c.links.filter((l) => !(l.from === from && l.to === to)) }));
  }

  /* ───────────── 드래그앤드롭 ───────────── */

  // 좌측 종류 → 캔버스
  function onCanvasDragOver(e: ReactDragEvent) {
    if (!e.dataTransfer.types.includes(MIME_CAT)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
  function onCanvasDrop(e: ReactDragEvent) {
    const catId = e.dataTransfer.getData(MIME_CAT) as CatId;
    if (!catId || !CAT_BY_ID[catId]) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const n = makeNode(catId, e.clientX - rect.left - NODE_W / 2, e.clientY - rect.top - NODE_H / 2);
    setCur((c) => ({ ...c, nodes: [...c.nodes, n] }));
    setSelId(n.id);
  }

  // 우측 도구 → 노드
  function onNodeDragOver(e: ReactDragEvent) {
    if (!e.dataTransfer.types.includes(MIME_TOOL)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }
  function onNodeDrop(e: ReactDragEvent, n: StudioNode) {
    const raw = e.dataTransfer.getData(MIME_TOOL);
    if (!raw) return;
    e.preventDefault();
    e.stopPropagation();
    const [catId, toolId] = raw.split(":");
    if (catId !== n.catId) return;   // 종류가 다른 도구는 결합하지 않는다
    const t = toolById(n.catId, toolId);
    updateNode(n.id, { toolId, variant: t?.models[0] });
    setSelId(n.id);
  }

  // 노드 이동 (마우스 델타)
  function onNodeDown(e: ReactMouseEvent, n: StudioNode) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = { id: n.id, dx: e.clientX - rect.left - n.x, dy: e.clientY - rect.top - n.y };
    setSelId(n.id);
  }
  function onCanvasMove(e: ReactMouseEvent) {
    if (!drag.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { id, dx, dy } = drag.current;
    const x = Math.max(0, Math.min(CANVAS_W - NODE_W, e.clientX - rect.left - dx));
    const y = Math.max(0, Math.min(CANVAS_H - NODE_H, e.clientY - rect.top - dy));
    setCur((c) => ({ ...c, nodes: c.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)) }));
  }
  const endDrag = () => { drag.current = null; };

  /* ───────────── 저장 ───────────── */

  function save() {
    const name = cur.name.trim() || "이름 없는 워크플로우";
    const next = { ...cur, name };
    setCur(next);
    saveStudioFlow(next);
    setSaved(listStudioFlows());
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1600);
  }
  function openFlow(f: StudioFlow) {
    setCur(JSON.parse(JSON.stringify(f)));
    setRuns({}); setSelId(null); setDetailId(null); setConnectFrom(null); setErr("");
  }
  function newFlow() {
    setCur(blankStudioFlow());
    setRuns({}); setSelId(null); setDetailId(null); setConnectFrom(null); setErr("");
  }

  /* ───────────── 실행 ───────────── */

  async function runAll() {
    if (running) return;
    if (cur.nodes.length === 0) { setErr("먼저 좌측에서 업무 종류를 캔버스로 끌어다 놓으세요."); return; }
    if (!cur.command.trim()) { setErr("맨 위에 업무 지시를 입력하세요."); return; }
    setErr(""); setResult(null); setRunning(true);
    abort.current = new AbortController();
    try {
      const res = await runStudioFlow({
        call, flow: cur, signal: abort.current.signal,
        onUpdate: (id, r) => setRuns((p) => ({ ...p, [id]: r })),
      });
      setRuns(res.runs);
      if (res.error) { setErr(res.error); return; }
      const final = res.runs[res.finalNodeId]?.output || "";
      setResult({ final, order: res.order });
      archive(final);
    } finally {
      setRunning(false);
      abort.current = null;
    }
  }

  /** 이 노드만 다시 — 앞 노드 결과는 그대로 두고 이 노드의 결과만 갈아끼운다. */
  async function rerunOne(node: StudioNode, revise: string) {
    if (running) return;
    setRunning(true); setErr("");
    try {
      const inputText = incomingOf(cur.links, node.id)
        .map((f) => runs[f]?.output)
        .filter((s): s is string => !!s && s.trim().length > 0)
        .join("\n\n---\n\n");
      setRuns((p) => ({ ...p, [node.id]: { ...(p[node.id] || emptyRun()), status: "running", inputText } }));
      const r = await runNode({
        call, node, inputText, command: cur.command,
        revise, prevOutput: runs[node.id]?.output,
      });
      setRuns((p) => ({ ...p, [node.id]: r }));
      if (r.status === "error") setErr(r.error || "실행에 실패했어요.");
    } finally { setRunning(false); }
  }

  /** 고친 결과를 아래로 전파 — 이 노드 결과는 그대로 두고 하류 노드만 다시 돌린다. */
  async function rerunFrom(node: StudioNode) {
    if (running) return;
    setRunning(true); setErr(""); setResult(null);
    abort.current = new AbortController();
    try {
      const res = await runStudioFlow({
        call, flow: cur, afterNodeId: node.id, prior: runs, signal: abort.current.signal,
        onUpdate: (id, r) => setRuns((p) => ({ ...p, [id]: r })),
      });
      setRuns(res.runs);
      if (res.error) { setErr(res.error); return; }
      const final = res.runs[res.finalNodeId]?.output || "";
      setResult({ final, order: res.order });
      archive(final);
    } finally { setRunning(false); abort.current = null; }
  }

  /** 최종 결과를 📁 자료함에 저장 — 기존 워크플로우 결과 저장과 같은 방식. */
  function archive(final: string) {
    if (!final.trim()) return;
    const isHtml = /<html|<!doctype|<body|<div|<p[ >]|<section/i.test(final);
    const html = isHtml ? final
      : `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;padding:20px;line-height:1.7;color:#222">${
          final.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        }</pre>`;
    try {
      saveDoc(userKey, {
        id: "", dept: "", html,
        name: `${cur.name.trim() || "노드 워크플로우"} 결과 · ${new Date().toLocaleString("ko-KR")}`,
      });
    } catch { /* 자료함 저장 실패는 실행 자체를 막지 않는다 */ }
  }

  /* ───────────── 렌더 ───────────── */

  const tools = sel ? toolsFor(sel.catId) : [];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── 상단: 이름·저장 / 업무 지시 · 실행 ── */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">🧩</span>
          <input
            value={cur.name}
            onChange={(e) => setCur({ ...cur, name: e.target.value })}
            placeholder="워크플로우 이름"
            className="w-52 px-2.5 py-1.5 rounded-lg bg-background border border-border text-[13px] font-bold focus:outline-none focus:border-primary"
          />
          <button onClick={save} title="이 워크플로우 저장"
            className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            {savedTick ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Save className="w-3.5 h-3.5" />}
            {savedTick ? "저장됨" : "저장"}
          </button>
          <button onClick={newFlow}
            className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Plus className="w-3.5 h-3.5" /> 새로
          </button>

          {saved.length > 0 && (
            <select
              value=""
              onChange={(e) => { const f = saved.find((x) => x.id === e.target.value); if (f) openFlow(f); }}
              className="px-2 py-1.5 rounded-lg bg-background border border-border text-[12px] text-muted-foreground focus:outline-none focus:border-primary max-w-[11rem]"
            >
              <option value="">📂 불러오기…</option>
              {saved.map((f) => (
                <option key={f.id} value={f.id}>{f.name || "(이름 없음)"} · 노드 {f.nodes.length}</option>
              ))}
            </select>
          )}

          <div className="ml-auto flex items-center gap-2">
            <select value={model} onChange={(e) => setModel(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-background border border-border text-[12px] text-muted-foreground focus:outline-none focus:border-primary">
              {ILLO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            {!hasOwnKey && (
              <button onClick={onShowKey}
                className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors">
                <KeyRound className="w-3.5 h-3.5" /> 내 키 넣기
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <textarea
            value={cur.command}
            onChange={(e) => setCur({ ...cur, command: e.target.value })}
            placeholder="맨 위에 업무를 지시하세요 — 이 내용이 연결된 노드들로 흘러갑니다. (예: 우리 동네 카페 창업 계획 짜줘)"
            rows={2}
            className="flex-1 resize-none px-3 py-2 rounded-xl bg-background border border-border text-[13px] leading-relaxed focus:outline-none focus:border-primary"
          />
          <button onClick={runAll} disabled={running}
            className="shrink-0 h-[4.1rem] px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex flex-col items-center justify-center gap-1 disabled:opacity-50 transition-colors">
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {running ? "실행 중" : "실행"}
          </button>
        </div>

        {err && (
          <div className="flex items-start gap-2 text-[12px] text-rose-500 bg-rose-500/10 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> <span className="break-keep">{err}</span>
          </div>
        )}
      </div>

      {/* ── 본문 3분할 ── */}
      <div className="flex-1 min-h-0 flex">
        {/* 좌: 업무 종류 */}
        <aside className="w-[10.5rem] shrink-0 border-r border-border bg-card overflow-y-auto">
          <div className="px-3 py-2.5 border-b border-border">
            <div className="text-[11px] font-bold text-foreground">업무 종류</div>
            <div className="text-[10.5px] text-muted-foreground mt-0.5 break-keep leading-snug">캔버스로 끌어다 놓으세요</div>
          </div>
          <div className="p-2 space-y-1">
            {NODE_CATEGORIES.map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(MIME_CAT, c.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                title={c.desc}
                className="group cursor-grab active:cursor-grabbing rounded-xl border border-border bg-background px-2.5 py-2 hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px]">{c.icon}</span>
                  <span className="text-[12.5px] font-bold text-foreground">{c.name}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{c.role}</div>
                {c.exec === "stub" && (
                  <div className="text-[9.5px] text-amber-600 dark:text-amber-500 mt-1 font-semibold">미연동</div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* 중: 캔버스 */}
        <div className="flex-1 min-w-0 overflow-auto bg-background"
          onMouseMove={onCanvasMove} onMouseUp={endDrag} onMouseLeave={endDrag}>
          <div
            ref={canvasRef}
            onDragOver={onCanvasDragOver}
            onDrop={onCanvasDrop}
            onClick={() => { setSelId(null); setConnectFrom(null); }}
            className="relative"
            style={{
              width: CANVAS_W, height: CANVAS_H,
              backgroundImage: "radial-gradient(circle, rgba(127,127,127,0.22) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            {/* 빈 캔버스 안내 */}
            {cur.nodes.length === 0 && (
              <div className="absolute left-10 top-10 max-w-sm rounded-2xl border border-dashed border-border bg-card/70 px-5 py-4">
                <div className="text-[13px] font-bold text-foreground mb-1">여기로 끌어다 놓으세요</div>
                <p className="text-[12px] text-muted-foreground break-keep leading-relaxed">
                  ① 좌측에서 <b>업무 종류</b>를 끌어다 놓고 → ② 노드를 누르면 우측에 그 종류의 <b>AI 도구</b>가 떠요.
                  도구를 노드로 끌어놓으면 <b>검색 : Tavily</b>처럼 하나로 결합됩니다.
                  ③ 노드 가장자리의 <b>점</b>을 눌러 다른 노드의 점을 누르면 연결돼요.
                </p>
              </div>
            )}

            {/* 연결선 */}
            <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H}>
              {cur.links.map((l) => {
                const a = cur.nodes.find((n) => n.id === l.from);
                const b = cur.nodes.find((n) => n.id === l.to);
                if (!a || !b) return null;
                const d = linkPath(a, l.fromSide || "right", b, l.toSide || "left");
                const mid = sideAnchor(b, l.toSide || "left");
                return (
                  <g key={`${l.from}-${l.to}`}>
                    <path d={d} fill="none" stroke="#F9954E" strokeWidth={2} />
                    {/* 클릭 판정용 두꺼운 투명선 — 누르면 연결 해제 */}
                    <path d={d} fill="none" stroke="transparent" strokeWidth={14}
                      className="pointer-events-auto cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); delLink(l.from, l.to); }}>
                      <title>연결 끊기</title>
                    </path>
                    <circle cx={mid.x} cy={mid.y} r={3.5} fill="#F9954E" />
                  </g>
                );
              })}
            </svg>

            {/* 노드 */}
            {cur.nodes.map((n) => {
              const cat = CAT_BY_ID[n.catId];
              const t = n.toolId ? toolById(n.catId, n.toolId) : undefined;
              const r = runs[n.id];
              const isSel = selId === n.id;
              const isConn = connectFrom?.id === n.id;
              return (
                <div
                  key={n.id}
                  onMouseDown={(e) => onNodeDown(e, n)}
                  onClick={(e) => { e.stopPropagation(); setSelId(n.id); }}
                  onDragOver={onNodeDragOver}
                  onDrop={(e) => onNodeDrop(e, n)}
                  style={{ left: n.x, top: n.y, width: NODE_W, height: NODE_H }}
                  className={
                    "absolute rounded-2xl border bg-card select-none cursor-grab active:cursor-grabbing transition-shadow " +
                    (r?.status === "running" ? "border-primary ring-2 ring-primary/50 animate-pulse "
                      : r?.status === "error" ? "border-rose-400 "
                      : isSel || isConn ? "border-primary shadow-md "
                      : "border-border hover:shadow-sm ")
                  }
                >
                  <div className="p-2.5 h-full flex flex-col">
                    {/* 제목 */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[15px] shrink-0">{cat?.icon}</span>
                      <input
                        value={n.title}
                        onMouseDown={(e) => e.stopPropagation()}
                        onChange={(e) => updateNode(n.id, { title: e.target.value })}
                        className="min-w-0 flex-1 bg-transparent text-[12.5px] font-bold text-foreground focus:outline-none"
                      />
                      <span className="shrink-0">
                        {r?.status === "running" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                        {r?.status === "done" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        {r?.status === "error" && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                      </span>
                    </div>

                    {/* 결합된 도구 */}
                    <div className="mt-1.5 min-w-0">
                      {t ? (
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-[11.5px] font-bold text-primary truncate">{t.name}</span>
                          {t.models.length > 0 && (
                            <select
                              value={n.variant || t.models[0]}
                              onMouseDown={(e) => e.stopPropagation()}
                              onChange={(e) => updateNode(n.id, { variant: e.target.value })}
                              className="ml-auto max-w-[6.2rem] bg-transparent text-[10px] text-muted-foreground focus:outline-none cursor-pointer"
                            >
                              {t.models.map((m) => <option key={m} value={m}>{m}</option>)}
                            </select>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10.5px] text-muted-foreground/80 break-keep leading-snug">
                          우측에서 AI 도구를 끌어오세요
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{cat?.role}</span>
                      {(t?.exec ?? cat?.exec) === "stub" && (
                        <span className="text-[9px] px-1 py-px rounded bg-amber-500/15 text-amber-600 dark:text-amber-500 font-semibold">미연동</span>
                      )}
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); setDetailId(n.id); setSelId(n.id); }}
                        className="ml-auto text-[10.5px] font-bold text-muted-foreground hover:text-primary transition-colors"
                      >
                        상세보기
                      </button>
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); delNode(n.id); }}
                        title="노드 삭제"
                        className="text-muted-foreground/50 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 4면 연결점 */}
                  {SIDES.map((s) => {
                    const p = sideAnchor({ x: 0, y: 0 }, s);
                    const active = connectFrom?.id === n.id && connectFrom.side === s;
                    return (
                      <button
                        key={s}
                        title={connectFrom ? "여기로 연결" : "여기서 연결 시작"}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onHandle(n.id, s); }}
                        style={{ left: p.x - 6, top: p.y - 6 }}
                        className={
                          "absolute w-3 h-3 rounded-full border-2 transition-all hover:scale-150 " +
                          (active ? "bg-primary border-primary scale-150" : "bg-card border-primary/60 hover:bg-primary")
                        }
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* 우: AI 도구 */}
        <aside className="w-[15rem] shrink-0 border-l border-border bg-card overflow-y-auto">
          <div className="px-3 py-2.5 border-b border-border">
            <div className="text-[11px] font-bold text-foreground">AI 도구</div>
            <div className="text-[10.5px] text-muted-foreground mt-0.5 break-keep leading-snug">
              {sel ? `${CAT_BY_ID[sel.catId]?.name} 노드에 끌어놓으세요` : "캔버스에서 노드를 먼저 고르세요"}
            </div>
          </div>

          {!sel ? (
            <div className="p-4 text-[11.5px] text-muted-foreground break-keep leading-relaxed">
              노드를 누르면 그 <b>종류에 맞는 AI 도구만</b> 여기에 떠요.
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              {CAT_BY_ID[sel.catId]?.caveat && (
                <div className="rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-500 px-2.5 py-2 text-[10.5px] break-keep leading-snug">
                  ⚠️ {CAT_BY_ID[sel.catId]?.caveat}
                </div>
              )}
              {tools.map((t) => (
                <ToolCard
                  key={t.id} tool={t}
                  active={sel.toolId === t.id}
                  onPick={() => updateNode(sel.id, { toolId: t.id, variant: t.models[0] })}
                />
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* ── 노드 상세보기 드로어 ── */}
      {detail && (
        <NodeDetail
          node={detail}
          run={runs[detail.id]}
          busy={running}
          downstream={descendants(cur.links, detail.id).size - 1}
          onClose={() => setDetailId(null)}
          onInstruction={(v) => updateNode(detail.id, { instruction: v })}
          onRerunOne={(revise) => rerunOne(detail, revise)}
          onRerunFrom={() => rerunFrom(detail)}
        />
      )}

      {/* ── 최종 결과 ── */}
      {result && (
        <ResultModal
          final={result.final}
          steps={result.order
            .map((id) => ({ node: cur.nodes.find((n) => n.id === id), run: runs[id] }))
            .filter((s): s is { node: StudioNode; run: NodeRun } => !!s.node && !!s.run && s.run.status === "done")}
          onClose={() => setResult(null)}
          onOpenNode={(id) => { setResult(null); setDetailId(id); setSelId(id); }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── 우측 도구 카드 ─────────────────────────── */

function ToolCard({ tool, active, onPick }: { tool: NodeTool; active: boolean; onPick: () => void }) {
  const api = apiEntryFor(tool);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(MIME_TOOL, `${tool.catId}:${tool.id}`);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={onPick}
      title="노드로 끌어놓거나, 눌러서 바로 결합"
      className={
        "cursor-grab active:cursor-grabbing rounded-xl border px-2.5 py-2 transition-all hover:shadow-sm " +
        (active ? "border-primary bg-primary/[0.07]" : "border-border bg-background hover:border-primary/60")
      }
    >
      <div className="flex items-center gap-1.5">
        <span className={"text-[12px] font-bold " + (active ? "text-primary" : "text-foreground")}>{tool.name}</span>
        {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
        {tool.exec === "stub" && tool.id !== "auto" && (
          <span className="ml-auto text-[9px] px-1 py-px rounded bg-amber-500/15 text-amber-600 dark:text-amber-500 font-semibold shrink-0">미연동</span>
        )}
      </div>
      {tool.desc && (
        <div className="text-[10.5px] text-muted-foreground mt-1 break-keep leading-snug">{tool.desc}</div>
      )}
      {tool.models.length > 0 && (
        <div className="text-[9.5px] text-muted-foreground/70 mt-1 truncate">{tool.models.join(" · ")}</div>
      )}
      {api?.keyUrl && (
        <a href={api.keyUrl} target="_blank" rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-block text-[9.5px] text-primary hover:underline mt-1">키 발급 →</a>
      )}
    </div>
  );
}

/* ─────────────────────────── 노드 상세보기 ─────────────────────────── */

function NodeDetail({ node, run, busy, downstream, onClose, onInstruction, onRerunOne, onRerunFrom }: {
  node: StudioNode;
  run?: NodeRun;
  busy: boolean;
  downstream: number;
  onClose: () => void;
  onInstruction: (v: string) => void;
  onRerunOne: (revise: string) => void;
  onRerunFrom: () => void;
}) {
  const [revise, setRevise] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const cat = CAT_BY_ID[node.catId];
  const t = node.toolId ? toolById(node.catId, node.toolId) : undefined;

  function copy() {
    try { navigator.clipboard?.writeText(run?.output || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  }

  return (
    // top-12 = 앱 상단바(ProjectTopBar, h-12 · z-[10000]) 아래에서 시작. inset-0으로 두면
    // 드로어 머리(제목·닫기 X)가 상단바에 가려 눌리지 않는다.
    <div className="fixed top-12 left-0 right-0 bottom-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 머리 */}
        <div className="shrink-0 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cat?.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-extrabold text-foreground truncate">{node.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {cat?.name} · {t ? `${t.name}${node.variant ? ` (${node.variant})` : ""}` : "도구 미결합"}
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-rose-500"><X className="w-4 h-4" /></button>
          </div>
          {(t?.exec ?? cat?.exec) === "stub" && (
            <div className="mt-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-500 px-2.5 py-1.5 text-[10.5px] break-keep leading-snug">
              ⚠️ 미연동 도구 — 결과물을 직접 만들지 않고, 이 도구에 넣을 <b>프롬프트·사양</b>만 만들어요.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* 역할 */}
          <Field label="이 노드가 맡은 일">
            <textarea
              value={node.instruction ?? ""}
              onChange={(e) => onInstruction(e.target.value)}
              placeholder={cat?.systemRole}
              rows={3}
              className="w-full resize-none px-2.5 py-2 rounded-lg bg-background border border-border text-[12px] leading-relaxed focus:outline-none focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground mt-1 break-keep">비워두면 기본 역할대로 움직여요.</p>
          </Field>

          {/* 받은 입력 */}
          <Field label="앞 노드에서 받은 내용">
            <Box empty="아직 없어요 — 실행하면 채워집니다.">{run?.inputText}</Box>
          </Field>

          {/* 보낸 프롬프트 */}
          <Field label="AI에게 보낸 프롬프트">
            {run?.prompt ? (
              <>
                <button onClick={() => setShowPrompt((v) => !v)}
                  className="text-[11px] font-bold text-primary hover:underline">
                  {showPrompt ? "접기" : "펼쳐보기"}
                </button>
                {showPrompt && <Box>{run.prompt}</Box>}
              </>
            ) : <Box empty="아직 없어요 — 실행하면 채워집니다." />}
          </Field>

          {/* 만든 결과 */}
          <Field
            label="이 노드가 만든 결과"
            right={run?.output ? (
              <button onClick={copy} className="text-[11px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} {copied ? "복사됨" : "복사"}
              </button>
            ) : null}
          >
            {run?.status === "error"
              ? <div className="rounded-lg bg-rose-500/10 text-rose-500 px-2.5 py-2 text-[12px] break-keep">{run.error}</div>
              : <Box empty="아직 없어요 — 실행하면 채워집니다.">{run?.output}</Box>}
          </Field>
        </div>

        {/* 다시 요청 */}
        <div className="shrink-0 border-t border-border px-4 py-3 space-y-2">
          <div className="text-[11px] font-bold text-foreground">이 노드만 다시 요청</div>
          <textarea
            value={revise}
            onChange={(e) => setRevise(e.target.value)}
            placeholder="어떻게 고칠까요? (예: 더 저렴한 방향으로, 표로 정리해줘)"
            rows={2}
            className="w-full resize-none px-2.5 py-2 rounded-lg bg-background border border-border text-[12px] leading-relaxed focus:outline-none focus:border-primary"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onRerunOne(revise); setRevise(""); }}
              disabled={busy || !revise.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-[12px] disabled:opacity-40 transition-colors"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              이 노드만 다시 실행
            </button>
          </div>
          {downstream > 0 && (
            <button
              onClick={onRerunFrom}
              disabled={busy}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-muted-foreground hover:border-primary hover:text-primary font-bold text-[12px] disabled:opacity-40 transition-colors"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              바뀐 결과를 아래로 전파 (하류 {downstream}개 다시 실행)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] font-bold text-foreground">{label}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Box({ children, empty }: { children?: React.ReactNode; empty?: string }) {
  const has = typeof children === "string" ? children.trim().length > 0 : !!children;
  return (
    <div className="rounded-lg border border-border bg-background px-2.5 py-2 max-h-56 overflow-y-auto">
      <pre className={"whitespace-pre-wrap break-words font-sans text-[11.5px] leading-relaxed " + (has ? "text-muted-foreground" : "text-muted-foreground/50")}>
        {has ? children : empty}
      </pre>
    </div>
  );
}

/* ─────────────────────────── 최종 결과 ─────────────────────────── */

function ResultModal({ final, steps, onClose, onOpenNode }: {
  final: string;
  steps: { node: StudioNode; run: NodeRun }[];
  onClose: () => void;
  onOpenNode: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="fixed top-12 left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border shadow-xl p-5 max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">✅ 실행 결과</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-rose-500"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2">
          {steps.map((s, i) => (
            <details key={s.node.id} className="rounded-lg border border-border">
              <summary className="cursor-pointer px-3 py-2 text-[12.5px] font-bold text-foreground flex items-center gap-1.5">
                <span>{i + 1}. {CAT_BY_ID[s.node.catId]?.icon} {s.node.title}</span>
                {s.run.stub && <span className="text-[9px] px-1 py-px rounded bg-amber-500/15 text-amber-600 dark:text-amber-500">미연동</span>}
                <button
                  onClick={(e) => { e.preventDefault(); onOpenNode(s.node.id); }}
                  className="ml-auto text-[10.5px] font-bold text-muted-foreground hover:text-primary"
                >
                  상세·수정
                </button>
              </summary>
              <div className="px-3 pb-2.5 text-[12px] text-muted-foreground whitespace-pre-wrap break-words leading-relaxed max-h-52 overflow-y-auto">
                {s.run.output}
              </div>
            </details>
          ))}

          <div className="rounded-xl border border-primary bg-primary/5 dark:bg-orange-950/10 p-3 mt-1">
            <div className="text-[11px] font-bold text-primary mb-1">최종 결과</div>
            <div className="text-[13px] text-foreground whitespace-pre-wrap break-words leading-relaxed max-h-[40vh] overflow-y-auto">{final}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[11px] text-muted-foreground mr-auto flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> 📁 자료함에 자동 저장됨
          </span>
          <button
            onClick={() => { try { navigator.clipboard?.writeText(final); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ } }}
            className="text-[12px] font-bold px-3 py-2 rounded-lg border border-border text-muted-foreground hover:border-primary flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "복사됨" : "복사"}
          </button>
        </div>
      </div>
    </div>
  );
}
