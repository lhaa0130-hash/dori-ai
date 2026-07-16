"use client";

// AI 직원 관제탑 — 부서 → 팀 → 팀원을 노드 캔버스로 만들고, 팀원별 AI 모델을 고른다.
// 마스터는 기본. '부서 만들기'로 부서를 하나씩 추가하고 이름을 입력, 그 아래 팀·직원을 붙인다.
// 저장: workspace.ts와 동일하게 회원별 localStorage(브라우저) — 계정마다 분리.
// 디자인: repo 디자인 토큰(--primary 주황 등) + lucide + next-themes 자동 다크모드.

import { useEffect, useRef, useState, type ReactNode, type CSSProperties, type SyntheticEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProjectTopBar from "@/components/layout/ProjectTopBar";
import {
  loadOrg, saveOrg, newId, ORG_PALETTE, MODEL_OPTIONS, STATUS_META,
  type OrgDivision, type OrgTeam, type OrgMember, type OrgStatus, type OrgColor, type OrgIcon,
} from "@/lib/illo/orgchart";
import {
  ShieldCheck, Lightbulb, Code2, Palette, MessageSquare, Megaphone, Network,
  Users, User, Play, Eye, Check, Clock, AlertTriangle, Plus, ChevronRight,
  Trash2, Sparkles, ArrowLeft,
} from "lucide-react";

const LV_W = [178, 200, 200, 268];
const COL_X = [26, 304, 596, 888];
const H = { master: 74, div: 84, team: 78, member: 122, add: 58 };
const GAP = 20;
const PAD = 26;

const DIV_ICON: Record<OrgIcon, typeof Lightbulb> = {
  bulb: Lightbulb, code: Code2, palette: Palette, message: MessageSquare, megaphone: Megaphone, network: Network,
};
const COLOR_BG: Record<OrgColor, string> = {
  blue: "bg-blue-500", teal: "bg-teal-500", violet: "bg-violet-500", pink: "bg-pink-500", cyan: "bg-cyan-500", slate: "bg-slate-500",
};
const COLOR_TEXT: Record<OrgColor, string> = {
  blue: "text-blue-500", teal: "text-teal-500", violet: "text-violet-500", pink: "text-pink-500", cyan: "text-cyan-500", slate: "text-slate-500",
};
const STATUS_CLS: Record<OrgStatus, string> = {
  work: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
  review: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  done: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  wait: "text-muted-foreground bg-muted",
  alert: "text-red-600 dark:text-red-400 bg-red-500/10",
};
const STATUS_ICON: Record<OrgStatus, typeof Play> = {
  work: Play, review: Eye, done: Check, wait: Clock, alert: AlertTriangle,
};

type Pos = { x: number; y: number; w: number; h: number };
type Node =
  | { key: string; kind: "master"; pos: Pos }
  | { key: string; kind: "div"; pos: Pos; div: OrgDivision }
  | { key: string; kind: "team"; pos: Pos; div: OrgDivision; team: OrgTeam }
  | { key: string; kind: "member"; pos: Pos; div: OrgDivision; team: OrgTeam; member: OrgMember; ti: number }
  | { key: string; kind: "add"; pos: Pos; addType: "bu" | "team" | "member"; label: string };

function StatusPill({ status }: { status: OrgStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${STATUS_CLS[status]}`}>
      <Icon className="w-3 h-3" /> {STATUS_META[status].label}
    </span>
  );
}

// embedded=true: AI 비서 앱의 '워크플로우' 자리에 끼워 넣을 때(자체 상단바 생략, 부모 높이에 맞춤)
export default function OrgControlTower({ embedded = false }: { embedded?: boolean }) {
  const { session } = useAuth();
  const userKey = session?.user?.email || "local";

  const [divisions, setDivisions] = useState<OrgDivision[]>([]);
  const [openBu, setOpenBu] = useState<string | null>(null);
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const inputMap = useRef<Map<string, HTMLInputElement>>(new Map());
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    const loaded = loadOrg(userKey);
    setDivisions(loaded);
    setOpenBu(loaded[0]?.id ?? null);
    setOpenTeam(loaded[0]?.teams[0]?.id ?? null);
  }, [userKey]);

  useEffect(() => {
    if (focusId.current) {
      const el = inputMap.current.get(focusId.current);
      if (el) { el.focus(); el.select(); }
      focusId.current = null;
    }
  });

  function commit(next: OrgDivision[]) {
    setDivisions(next);
    saveOrg(userKey, next);
  }

  const bu = divisions.find((d) => d.id === openBu) || null;
  const team = bu?.teams.find((t) => t.id === openTeam) || null;

  // ── 조작 ──
  function addBu() {
    const { color, icon } = ORG_PALETTE[divisions.length % ORG_PALETTE.length];
    const id = newId("bu");
    commit([...divisions, { id, name: "", color, icon, teams: [] }]);
    setOpenBu(id); setOpenTeam(null); focusId.current = `bu-${id}`;
  }
  function addTeam() {
    if (!bu) return;
    const id = newId("tm");
    commit(divisions.map((d) => d.id === bu.id ? { ...d, teams: [...d.teams, { id, name: "", members: [] }] } : d));
    setOpenTeam(id); focusId.current = `tm-${id}`;
  }
  function addMember() {
    if (!bu || !team) return;
    const id = newId("mb");
    commit(divisions.map((d) => d.id === bu.id ? {
      ...d, teams: d.teams.map((t) => t.id === team.id ? { ...t, members: [...t.members, { id, name: "", role: "", status: "wait" as OrgStatus, model: "sonnet" }] } : t),
    } : d));
    focusId.current = `mb-${id}`;
  }
  function setDivName(id: string, name: string) {
    commit(divisions.map((d) => d.id === id ? { ...d, name } : d));
  }
  function setTeamName(buId: string, tId: string, name: string) {
    commit(divisions.map((d) => d.id === buId ? { ...d, teams: d.teams.map((t) => t.id === tId ? { ...t, name } : t) } : d));
  }
  function patchMember(buId: string, tId: string, mId: string, patch: Partial<OrgMember>) {
    commit(divisions.map((d) => d.id === buId ? {
      ...d, teams: d.teams.map((t) => t.id === tId ? { ...t, members: t.members.map((m) => m.id === mId ? { ...m, ...patch } : m) } : t),
    } : d));
  }
  function toggleBu(id: string) {
    const was = id === openBu;
    setOpenBu(was ? null : id);
    const d = divisions.find((x) => x.id === id);
    setOpenTeam(was ? null : (d?.teams[0]?.id ?? null));
  }
  function reset() {
    commit([]); setOpenBu(null); setOpenTeam(null); setZoom(100);
  }

  // ── 레이아웃 계산 ──
  const nodes: Node[] = [];
  const pos: Record<string, Pos> = {};
  const columns: Node[][] = [[], [], [], []];
  columns[0].push({ key: "master", kind: "master", pos: { x: 0, y: 0, w: 0, h: 0 } });
  divisions.forEach((d) => columns[1].push({ key: `bu-${d.id}`, kind: "div", div: d, pos: { x: 0, y: 0, w: 0, h: 0 } }));
  columns[1].push({ key: "add-bu", kind: "add", addType: "bu", label: "부서 만들기", pos: { x: 0, y: 0, w: 0, h: 0 } });
  if (bu) {
    bu.teams.forEach((t) => columns[2].push({ key: `tm-${t.id}`, kind: "team", div: bu, team: t, pos: { x: 0, y: 0, w: 0, h: 0 } }));
    columns[2].push({ key: "add-tm", kind: "add", addType: "team", label: "팀 만들기", pos: { x: 0, y: 0, w: 0, h: 0 } });
  }
  if (bu && team) {
    team.members.forEach((m, ti) => columns[3].push({ key: `mb-${m.id}`, kind: "member", div: bu, team, member: m, ti, pos: { x: 0, y: 0, w: 0, h: 0 } }));
    columns[3].push({ key: "add-mb", kind: "add", addType: "member", label: "직원 추가", pos: { x: 0, y: 0, w: 0, h: 0 } });
  }
  const hOf = (n: Node) => n.kind === "master" ? H.master : n.kind === "div" ? H.div : n.kind === "team" ? H.team : n.kind === "member" ? H.member : H.add;
  columns.forEach((col, lv) => {
    let y = PAD;
    col.forEach((n) => { n.pos = { x: COL_X[lv], y, w: LV_W[lv], h: hOf(n) }; pos[n.key] = n.pos; y += n.pos.h + GAP; });
  });
  // 마스터를 부서 컬럼 높이에 맞춰 세로 중앙 정렬
  if (columns[1].length) {
    const first = columns[1][0].pos, last = columns[1][columns[1].length - 1].pos;
    const cy = (first.y + last.y + last.h) / 2 - H.master / 2;
    columns[0][0].pos.y = Math.max(PAD, cy);
  }
  columns.forEach((col) => col.forEach((n) => nodes.push(n)));

  const edges: { a: string; b: string; dash: boolean }[] = [];
  edges.push({ a: "master", b: "add-bu", dash: true });
  divisions.forEach((d) => edges.push({ a: "master", b: `bu-${d.id}`, dash: false }));
  if (bu) {
    bu.teams.forEach((t) => edges.push({ a: `bu-${bu.id}`, b: `tm-${t.id}`, dash: false }));
    edges.push({ a: `bu-${bu.id}`, b: "add-tm", dash: true });
  }
  if (bu && team) {
    team.members.forEach((m) => edges.push({ a: `tm-${team.id}`, b: `mb-${m.id}`, dash: false }));
    edges.push({ a: `tm-${team.id}`, b: "add-mb", dash: true });
  }
  const canvasW = COL_X[3] + LV_W[3] + 30;
  const canvasH = Math.max(PAD + 200, ...nodes.map((n) => n.pos.y + n.pos.h + PAD));

  let teamsCount = 0, membersCount = 0;
  divisions.forEach((d) => { teamsCount += d.teams.length; d.teams.forEach((t) => (membersCount += t.members.length)); });

  const nameRef = (id: string) => (el: HTMLInputElement | null) => { if (el) inputMap.current.set(id, el); else inputMap.current.delete(id); };
  const stop = (e: SyntheticEvent) => e.stopPropagation();

  const Handle = ({ side }: { side: "l" | "r" }) => (
    <span className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background z-10 ${side === "l" ? "-left-[5px]" : "-right-[5px]"}`} />
  );

  function renderNode(n: Node): ReactNode {
    const style = { left: n.pos.x, top: n.pos.y, width: n.pos.w, height: n.pos.h } as CSSProperties;
    if (n.kind === "add") {
      const fn = n.addType === "bu" ? addBu : n.addType === "team" ? addTeam : addMember;
      return (
        <button key={n.key} type="button" onClick={fn} style={style}
          className="absolute flex items-center justify-center gap-2.5 rounded-xl border-[1.6px] border-dashed border-border text-muted-foreground text-[13.5px] font-semibold transition hover:border-primary hover:text-primary hover:bg-primary/5 group">
          <span className="absolute top-1/2 -translate-y-1/2 -left-[5px] w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
          <span className="w-6 h-6 rounded-md bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition"><Plus className="w-4 h-4" /></span>
          {n.label}
        </button>
      );
    }
    if (n.kind === "master") {
      return (
        <div key={n.key} style={style} className="absolute">
          <div className="relative h-full rounded-xl bg-card border border-primary shadow-sm ring-2 ring-primary/60">
            <div className="px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><ShieldCheck className="w-[18px] h-[18px]" /></span>
                <div>
                  <div className="font-semibold text-[15px] leading-tight">마스터</div>
                  <div className="text-[12.5px] text-muted-foreground">감독 · 검수</div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><Users className="w-3.5 h-3.5" /> {divisions.length}개 부서</div>
            </div>
            <Handle side="r" />
          </div>
        </div>
      );
    }
    if (n.kind === "div") {
      const d = n.div; const Icon = DIV_ICON[d.icon]; const open = d.id === openBu;
      return (
        <div key={n.key} style={style} className="absolute cursor-pointer group" onClick={() => toggleBu(d.id)}>
          <div className={`relative h-full rounded-xl bg-card border shadow-sm transition ${open ? "border-primary ring-2 ring-primary/60" : "border-border group-hover:border-muted-foreground/40"}`}>
            <div className="px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-8 h-8 rounded-lg ${COLOR_BG[d.color]} text-white flex items-center justify-center`}><Icon className="w-[18px] h-[18px]" /></span>
                <input ref={nameRef(`bu-${d.id}`)} value={d.name} placeholder="부서 이름"
                  onChange={(e) => setDivName(d.id, e.target.value)} onClick={stop} onMouseDown={stop}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  className="flex-1 min-w-0 bg-transparent border-b-[1.5px] border-transparent hover:border-border focus:border-primary outline-none font-semibold text-[15px] py-0.5 placeholder:text-muted-foreground placeholder:font-medium" />
                <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><Users className="w-3.5 h-3.5" /> {d.teams.length}개 팀</div>
            </div>
            <Handle side="l" /><Handle side="r" />
          </div>
        </div>
      );
    }
    if (n.kind === "team") {
      const t = n.team; const open = t.id === openTeam;
      return (
        <div key={n.key} style={style} className="absolute cursor-pointer group" onClick={() => setOpenTeam(open ? null : t.id)}>
          <div className={`relative h-full rounded-xl bg-card border shadow-sm transition ${open ? "border-primary ring-2 ring-primary/60" : "border-border group-hover:border-muted-foreground/40"}`}>
            <div className="px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <span className={`w-8 h-8 rounded-full ${COLOR_BG[n.div.color]} text-white flex items-center justify-center`}><Users className="w-4 h-4" /></span>
                <input ref={nameRef(`tm-${t.id}`)} value={t.name} placeholder="팀 이름"
                  onChange={(e) => setTeamName(n.div.id, t.id, e.target.value)} onClick={stop} onMouseDown={stop}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  className="flex-1 min-w-0 bg-transparent border-b-[1.5px] border-transparent hover:border-border focus:border-primary outline-none font-semibold text-[15px] py-0.5 placeholder:text-muted-foreground placeholder:font-medium" />
                <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-muted-foreground"><User className="w-3.5 h-3.5" /> {t.members.length}명</div>
            </div>
            <Handle side="l" /><Handle side="r" />
          </div>
        </div>
      );
    }
    // member
    const m = n.member;
    return (
      <div key={n.key} style={style} className="absolute">
        <div className="relative h-full rounded-xl bg-card border border-border shadow-sm overflow-hidden flex">
          <div className="flex-1 min-w-0 p-3">
            <div className="flex items-center gap-2.5">
              <span className={`w-8 h-8 rounded-full bg-muted border border-border ${COLOR_TEXT[n.div.color]} flex items-center justify-center shrink-0`}><User className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0">
                <input ref={nameRef(`mb-${m.id}`)} value={m.name} placeholder="직원 이름"
                  onChange={(e) => patchMember(n.div.id, n.team.id, m.id, { name: e.target.value })} onClick={stop} onMouseDown={stop}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  className="w-full bg-transparent border-b-[1.5px] border-transparent hover:border-border focus:border-primary outline-none font-semibold text-[15px] py-0.5 placeholder:text-muted-foreground placeholder:font-medium" />
                <input value={m.role} placeholder="역할 (예: 자료조사)"
                  onChange={(e) => patchMember(n.div.id, n.team.id, m.id, { role: e.target.value })} onClick={stop} onMouseDown={stop} onKeyDown={stop}
                  className="w-full bg-transparent border-b-[1.5px] border-transparent hover:border-border focus:border-primary outline-none text-[12.5px] font-medium text-muted-foreground mt-0.5 py-0.5 placeholder:text-muted-foreground/70" />
              </div>
            </div>
            <div className="mt-2"><StatusPill status={m.status} /></div>
          </div>
          <div className="w-[130px] shrink-0 border-l border-border bg-muted/40 p-3 flex flex-col gap-1.5 justify-center">
            <label className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI 모델</label>
            <select value={m.model} onChange={(e) => patchMember(n.div.id, n.team.id, m.id, { model: e.target.value })}
              className="w-full text-[12.5px] rounded-md border border-border bg-card px-2 py-1.5 outline-none focus:border-primary cursor-pointer">
              {MODEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Handle side="l" />
        </div>
      </div>
    );
  }

  return (
    <div className={(embedded ? "h-full flex flex-col" : "min-h-screen") + " bg-background text-foreground"}>
      {!embedded && <ProjectTopBar name="AI 직원 관제탑" emoji="🗂️" />}
      <div className={embedded ? "flex flex-col flex-1 min-h-0" : "pt-12 flex flex-col h-screen"}>
        {/* 상태 범례 — 작업중/검수중/완료/대기/확인 필요 (색+글자 이중 표시) */}
        <div className="shrink-0 flex items-center justify-end gap-1.5 px-4 py-2 border-b border-border flex-wrap bg-card/40">
          {(["work", "review", "done", "wait", "alert"] as OrgStatus[]).map((s) => {
            const dot = s === "work" ? "bg-blue-500" : s === "review" ? "bg-amber-500" : s === "done" ? "bg-emerald-500" : s === "alert" ? "bg-red-500" : "bg-muted-foreground";
            return (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[12px] text-muted-foreground">
                <span className={"w-2 h-2 rounded-full " + dot} /> {STATUS_META[s].label}
              </span>
            );
          })}
        </div>
        {/* 임베드(앱 안)일 때 — 3번째 칸 대신 상단 툴바로 (캔버스 전체 폭 확보) */}
        {embedded && (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/40 flex-wrap">
            <button onClick={addBu} className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-[13px] font-semibold transition hover:opacity-90"><Plus className="w-4 h-4" /> 부서 만들기</button>
            <button onClick={addTeam} disabled={!bu} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground transition enabled:hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="w-3.5 h-3.5" /> 팀 만들기</button>
            <button onClick={addMember} disabled={!team} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground transition enabled:hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"><Plus className="w-3.5 h-3.5" /> 직원 추가</button>
            <span className="text-[12px] text-muted-foreground ml-1 hidden md:inline">부서 {divisions.length} · 팀 {teamsCount} · 직원 {membersCount}</span>
            <div className="ml-auto flex items-center gap-2">
              <input type="range" min={55} max={130} step={5} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-24 sm:w-32 accent-[hsl(var(--primary))]" />
              <span className="text-[12px] text-muted-foreground w-9 text-right tabular-nums">{zoom}%</span>
              <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-[12.5px] text-muted-foreground transition hover:text-foreground hover:bg-muted"><Trash2 className="w-3.5 h-3.5" /> 비우기</button>
            </div>
          </div>
        )}
        {/* 본문: (전체화면) 좌측 레일 + 캔버스 / (임베드) 캔버스만 */}
        <div className="flex flex-1 min-h-0">
        {/* 좌측 컨트롤 레일 — 전체화면(standalone)에서만 */}
        {!embedded && (
        <aside className="w-[250px] shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col gap-6 p-4">
          <div>
            <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground mb-3">이렇게 만들어요</h2>
            <button onClick={addBu} className="w-full flex items-center gap-3 rounded-lg bg-primary text-primary-foreground px-3 py-2.5 mb-2 text-left transition hover:opacity-90">
              <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-[12.5px] font-bold">1</span>
              <span className="text-[14.5px] font-medium">부서 만들기<span className="block text-[11.5px] font-normal text-primary-foreground/80">이름을 직접 입력</span></span>
            </button>
            <StepButton n={2} label="팀 만들기" sub={bu ? `"${bu.name || "새 부서"}" 아래` : "부서를 먼저 선택"} disabled={!bu} onClick={addTeam} />
            <StepButton n={3} label="직원 추가" sub={team ? `"${team.name || "새 팀"}" 아래` : "팀을 먼저 선택"} disabled={!team} onClick={addMember} />
          </div>
          <div>
            <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground mb-3">보기</h2>
            <div className="flex items-center gap-2.5">
              <input type="range" min={55} max={130} step={5} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-[hsl(var(--primary))]" />
              <span className="text-[12.5px] text-muted-foreground w-[38px] text-right tabular-nums">{zoom}%</span>
            </div>
            <button onClick={reset} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-muted-foreground transition hover:text-foreground hover:bg-muted">
              <Trash2 className="w-3.5 h-3.5" /> 전체 비우기
            </button>
          </div>
          <div className="mt-auto">
            <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground mb-3">지금 조직</h2>
            <div className="space-y-1 text-[13.5px] text-muted-foreground">
              <div className="flex items-center gap-2"><Network className="w-4 h-4 text-primary" /> 부서 {divisions.length}개</div>
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-teal-500" /> 팀 {teamsCount}개</div>
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> 직원 {membersCount}명</div>
            </div>
            <Link href="/ai-assistant" className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> AI 비서로 돌아가기
            </Link>
          </div>
        </aside>
        )}

        {/* 캔버스 */}
        <div className="relative flex-1 min-w-0 overflow-auto" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)", backgroundSize: "24px 24px" }}>
          <div className="relative origin-top-left transition-transform" style={{ transform: `scale(${zoom / 100})`, width: canvasW, height: canvasH }}>
            <svg className="absolute top-0 left-0 overflow-visible" width={canvasW} height={canvasH}>
              {edges.map((e, i) => {
                const p = pos[e.a], q = pos[e.b];
                if (!p || !q) return null;
                const x1 = p.x + p.w, y1 = p.y + p.h / 2, x2 = q.x, y2 = q.y + q.h / 2;
                const dx = Math.max(38, (x2 - x1) / 2);
                return <path key={i} d={`M${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`} fill="none"
                  style={{ stroke: "hsl(var(--muted-foreground))", opacity: e.dash ? 0.4 : 0.7 }} strokeWidth={2} strokeDasharray={e.dash ? "5 5" : undefined} />;
              })}
            </svg>
            {nodes.map(renderNode)}
          </div>

          {divisions.length === 0 && (
            <div className="absolute top-6 left-[322px] max-w-[236px] rounded-xl border border-border bg-card shadow-md px-4 py-3 flex gap-2.5 text-[13.5px] text-muted-foreground">
              <Plus className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>마스터는 기본이에요. <b className="text-foreground font-medium">‘부서 만들기’</b>부터 눌러 시작하세요.</div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function StepButton({ n, label, sub, disabled, onClick }: { n: number; label: string; sub: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 mb-2 text-left transition enabled:hover:border-primary enabled:hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed group">
      <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-[12.5px] font-bold transition">{n}</span>
      <span className="text-[14.5px] font-medium">{label}<span className="block text-[11.5px] font-normal text-muted-foreground">{sub}</span></span>
    </button>
  );
}
