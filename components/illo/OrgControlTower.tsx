"use client";

// AI 비서 — 조직도(부서 → 팀 → 직원)가 곧 홈 화면.
// 일은 "역순"으로 올라간다: 직원이 각자 역할대로 일함 → 팀장이 팀원 결과를 검토 →
// 부서장이 팀 검토를 검토 → 마스터가 최종 검토. 결과는 노드 안이 아니라 '하단 패널'에 펼친다
// (노드 높이를 고정해 조직도를 미니멀하게 유지하기 위함).
// 저장: 계정별(projectSaves/illoOrg/users/{uid}) + 로컬 미러 — lib/illo/orgchart.ts

import { useEffect, useRef, useState, type ReactNode, type CSSProperties, type SyntheticEvent, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProjectTopBar from "@/components/layout/ProjectTopBar";
import {
  loadOrg, saveOrg, syncOrg, saveOrgCloudDebounced, newId, ORG_PALETTE, STATUS_META,
  MEMBER_KINDS, toolsFor, toolDef, modelsOf, kindEmoji, modelLabelOf, toolLabelOf, isRunnable, isDeliverKind, toolNote,
  DEFAULT_KIND, DEFAULT_TOOL, DEFAULT_MODEL, EMOJI_CHOICES, ORG_PRESETS, buildPreset,
  type OrgDivision, type OrgTeam, type OrgMember, type OrgStatus, type OrgColor, type OrgIcon,
  type MemberKind,
} from "@/lib/illo/orgchart";
import {
  ShieldCheck, Lightbulb, Code2, Palette, MessageSquare, Megaphone, Network,
  Users, User, Play, Eye, Check, Clock, AlertTriangle, Plus, ChevronLeft, ChevronRight, ChevronDown,
  Trash2, ArrowLeft, Loader2, X, Wand2, Send, RotateCw, FlaskConical, GripVertical,
} from "lucide-react";

// 상하(위→아래) 조직도: 레벨은 아래로 내려가고(ROW_Y), 형제 노드는 가로로 나열된다.
const W = [188, 196, 216, 284];   // 레벨별 노드 폭(마스터/부서/팀/직원) — 팀은 버튼이 많아 조금 넓게
const ADD_W = 146;
const H = { master: 88, div: 88, team: 88, member: 160, add: 52 };
const ROW_GAP = 54;
const GAP = 20;
const PAD = 28;

const DIV_ICON: Record<OrgIcon, typeof Lightbulb> = {
  bulb: Lightbulb, code: Code2, palette: Palette, message: MessageSquare, megaphone: Megaphone, network: Network,
};
const COLOR_BG: Record<OrgColor, string> = {
  blue: "bg-blue-500", teal: "bg-teal-500", violet: "bg-violet-500", pink: "bg-pink-500", cyan: "bg-cyan-500", slate: "bg-slate-500",
};
const STATUS_DOT: Record<OrgStatus, string> = {
  work: "bg-blue-500", review: "bg-amber-500", done: "bg-emerald-500", wait: "bg-muted-foreground/40", alert: "bg-red-500",
};
const STATUS_ICON: Record<OrgStatus, typeof Play> = {
  work: Play, review: Eye, done: Check, wait: Clock, alert: AlertTriangle,
};

// 마스터 최종 검토는 서로 다른 3개 LLM이 각자 본다(현재 실제 실행되는 건 Claude 계열 3티어).
const MASTER_REVIEWERS = [
  { model: "claude-opus-4-8", label: "Claude Opus 4.8" },
  { model: "claude-sonnet-5", label: "Claude Sonnet 5" },
  { model: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
];

type Pos = { x: number; y: number; w: number; h: number };
type Node =
  | { key: string; kind: "master"; pos: Pos }
  | { key: string; kind: "div"; pos: Pos; div: OrgDivision }
  | { key: string; kind: "team"; pos: Pos; div: OrgDivision; team: OrgTeam }
  | { key: string; kind: "member"; pos: Pos; div: OrgDivision; team: OrgTeam; member: OrgMember }
  | { key: string; kind: "add"; pos: Pos; addType: "bu" | "team" | "member"; label: string };

// 하단 패널에 띄울 대상
type Panel =
  | { kind: "member"; divId: string; teamId: string; memberId: string }
  | { kind: "team"; divId: string; teamId: string }
  | { kind: "div"; divId: string }
  | { kind: "master" };

export default function OrgControlTower({
  embedded = false, callModel, onAutomate,
}: {
  embedded?: boolean;
  /** 없으면 실행 버튼이 비활성 — 전체화면 단독 페이지 등 */
  callModel?: (prompt: string, model: string, maxTokens?: number) => Promise<string>;
  /** 세팅 끝난 팀을 자동화 화면으로 넘긴다 (그 팀이 선택된 채로 열림) */
  onAutomate?: (divId: string, teamId: string) => void;
}) {
  const { session } = useAuth();
  const userKey = session?.user?.email || "local";

  const [divisions, setDivisions] = useState<OrgDivision[]>([]);
  const [openBu, setOpenBu] = useState<string | null>(null);
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);   // 실행/검토 중인 노드 id
  const [err, setErr] = useState("");
  const [emojiFor, setEmojiFor] = useState<string | null>(null); // 이모지 고르는 중인 노드 key
  // 드래그로 잇는 직원 간 흐름 연결 (출력 포트에서 끌기 시작 → 다른 직원 입력 포트에 놓기)
  const [linkDrag, setLinkDrag] = useState<{ teamId: string; from: string; x: number; y: number } | null>(null);
  // 노드 자유 이동 — 드래그 중인 노드의 실시간 좌표(놓을 때 데이터에 저장). 이동은 그립(⠿)에서만 시작.
  const [drag, setDrag] = useState<{ key: string; x: number; y: number } | null>(null);

  const inputMap = useRef<Map<string, HTMLInputElement>>(new Map());
  const focusId = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);   // 확대(scale) 적용된 캔버스 — 좌표 변환용
  const divisionsRef = useRef<OrgDivision[]>([]);   // 드래그 종료 시 최신 상태 참조
  divisionsRef.current = divisions;

  useEffect(() => {
    const loaded = loadOrg(userKey);
    setDivisions(loaded);
    setOpenBu(loaded[0]?.id ?? null);
    setOpenTeam(loaded[0]?.teams[0]?.id ?? null);
    let cancelled = false;
    void syncOrg(userKey).then((d) => {
      if (cancelled) return;
      setDivisions(d);
      setOpenBu(d[0]?.id ?? null);
      setOpenTeam(d[0]?.teams[0]?.id ?? null);
    });
    return () => { cancelled = true; };
  }, [userKey]);

  useEffect(() => {
    if (focusId.current) {
      const el = inputMap.current.get(focusId.current);
      if (el) { el.focus(); el.select(); }
      focusId.current = null;
    }
  });

  // 드래그 중: 마우스를 따라 고무줄 선을 그리고, 놓은 지점이 다른 직원의 입력 포트면 연결한다
  useEffect(() => {
    if (!linkDrag) return;
    const scale = zoom / 100;
    const onMove = (e: MouseEvent) => {
      const inner = canvasRef.current; if (!inner) return;
      const r = inner.getBoundingClientRect();
      setLinkDrag((prev) => prev ? { ...prev, x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale } : prev);
    };
    const onUp = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const port = el?.closest("[data-port-in]") as HTMLElement | null;
      if (port) {
        const to = port.getAttribute("data-member") || "";
        const tid = port.getAttribute("data-team") || "";
        if (to && tid === linkDrag.teamId && to !== linkDrag.from) addLink(tid, linkDrag.from, to);
      }
      setLinkDrag(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [linkDrag, zoom]);

  function commit(next: OrgDivision[]) {
    setDivisions(next);
    saveOrg(userKey, next);
    saveOrgCloudDebounced(next);
  }

  const bu = divisions.find((d) => d.id === openBu) || null;
  const team = bu?.teams.find((t) => t.id === openTeam) || null;

  /* ── 조작 ── */
  function addBu() {
    const { color, icon } = ORG_PALETTE[divisions.length % ORG_PALETTE.length];
    const id = newId("bu");
    commit([...divisions, { id, name: "", color, icon, teams: [] }]);
    setOpenBu(id); setOpenTeam(null); focusId.current = `bu-${id}`;
  }
  function addPreset(presetId: string) {
    const p = ORG_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    const d = buildPreset(p);
    commit([...divisions, d]);
    setOpenBu(d.id); setOpenTeam(d.teams[0]?.id ?? null);
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
      ...d, teams: d.teams.map((t) => t.id === team.id ? {
        ...t, members: [...t.members, { id, name: "", role: "", status: "wait" as OrgStatus, kind: DEFAULT_KIND, tool: DEFAULT_TOOL, model: DEFAULT_MODEL }],
      } : t),
    } : d));
    focusId.current = `mb-${id}`;
  }
  function patchDiv(id: string, patch: Partial<OrgDivision>) {
    commit(divisions.map((d) => d.id === id ? { ...d, ...patch } : d));
  }
  function patchTeam(buId: string, tId: string, patch: Partial<OrgTeam>) {
    commit(divisions.map((d) => d.id === buId ? { ...d, teams: d.teams.map((t) => t.id === tId ? { ...t, ...patch } : t) } : d));
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
  function reset() { commit([]); setOpenBu(null); setOpenTeam(null); setZoom(100); setPanel(null); }

  /* ── 삭제 ── */
  function delBu(id: string) {
    commit(divisions.filter((d) => d.id !== id));
    if (openBu === id) { setOpenBu(null); setOpenTeam(null); }
    setPanel(null);
  }
  function delTeam(buId: string, tId: string) {
    commit(divisions.map((d) => d.id === buId ? { ...d, teams: d.teams.filter((t) => t.id !== tId) } : d));
    if (openTeam === tId) setOpenTeam(null);
    setPanel(null);
  }
  function delMember(buId: string, tId: string, mId: string) {
    commit(divisions.map((d) => d.id === buId ? {
      ...d, teams: d.teams.map((t) => t.id === tId ? {
        ...t,
        members: t.members.filter((m) => m.id !== mId),
        links: (t.links || []).filter((l) => l.from !== mId && l.to !== mId),   // 삭제된 직원의 흐름선 정리
      } : t),
    } : d));
    setPanel(null);
  }

  /* ── 직원 간 흐름 연결 (드래그) ── */
  function addLink(tId: string, from: string, to: string) {
    if (from === to) return;
    commit(divisionsRef.current.map((d) => ({
      ...d,
      teams: d.teams.map((t) => {
        if (t.id !== tId) return t;
        const links = t.links || [];
        if (links.some((l) => l.from === from && l.to === to)) return t;          // 이미 있는 연결
        const cleaned = links.filter((l) => !(l.from === to && l.to === from));   // 반대 방향은 제거(흐름은 한 방향)
        return { ...t, links: [...cleaned, { from, to }] };
      }),
    })));
  }
  function delLink(tId: string, from: string, to: string) {
    commit(divisionsRef.current.map((d) => ({
      ...d,
      teams: d.teams.map((t) => t.id !== tId ? t : { ...t, links: (t.links || []).filter((l) => !(l.from === from && l.to === to)) }),
    })));
  }
  /* ── 노드 자유 이동 ── */
  function nodeIds(n: Node): { kind: string; buId?: string; tId?: string; mId?: string } {
    if (n.kind === "div") return { kind: "div", buId: n.div.id };
    if (n.kind === "team") return { kind: "team", buId: n.div.id, tId: n.team.id };
    if (n.kind === "member") return { kind: "member", buId: n.div.id, tId: n.team.id, mId: n.member.id };
    return { kind: n.kind };
  }
  /** 그립(⠿)에서 드래그 시작 — 캔버스 좌표(확대 보정)로 옮기고 놓을 때 데이터에 저장 */
  function startNodeDrag(e: ReactMouseEvent, n: Node) {
    e.stopPropagation(); e.preventDefault();
    const inner = canvasRef.current;
    const nodeEl = (e.target as HTMLElement).closest("[data-node]") as HTMLElement | null;
    if (!inner || !nodeEl) return;
    const scale = zoom / 100;
    const cr = inner.getBoundingClientRect();
    const nr = nodeEl.getBoundingClientRect();
    const baseX = (nr.left - cr.left) / scale, baseY = (nr.top - cr.top) / scale;
    const grabDX = (e.clientX - cr.left) / scale - baseX;
    const grabDY = (e.clientY - cr.top) / scale - baseY;
    const ids = nodeIds(n);
    let moved = false;
    const onMove = (ev: MouseEvent) => {
      const nx = Math.max(0, (ev.clientX - cr.left) / scale - grabDX);
      const ny = Math.max(0, (ev.clientY - cr.top) / scale - grabDY);
      if (!moved && Math.abs(nx - baseX) + Math.abs(ny - baseY) > 3) moved = true;
      if (moved) setDrag({ key: n.key, x: nx, y: ny });
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (moved) {
        const nx = Math.max(0, (ev.clientX - cr.left) / scale - grabDX);
        const ny = Math.max(0, (ev.clientY - cr.top) / scale - grabDY);
        if (ids.kind === "div") patchDiv(ids.buId!, { x: nx, y: ny });
        else if (ids.kind === "team") patchTeam(ids.buId!, ids.tId!, { x: nx, y: ny });
        else if (ids.kind === "member") patchMember(ids.buId!, ids.tId!, ids.mId!, { x: nx, y: ny });
      }
      setDrag(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  /** 출력 포트에서 드래그 시작 — 캔버스 좌표계(확대 보정)로 변환해 둔다 */
  function startLink(e: ReactMouseEvent, teamId: string, from: string) {
    e.stopPropagation(); e.preventDefault();
    const inner = canvasRef.current; if (!inner) return;
    const r = inner.getBoundingClientRect(); const scale = zoom / 100;
    setLinkDrag({ teamId, from, x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale });
  }
  /** 직원 순서 = 일하는 순서 — 좌우로 옮긴다 */
  function moveMember(buId: string, tId: string, mId: string, dir: -1 | 1) {
    commit(divisions.map((d) => d.id !== buId ? d : {
      ...d, teams: d.teams.map((t) => {
        if (t.id !== tId) return t;
        const i = t.members.findIndex((m) => m.id === mId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= t.members.length) return t;
        const ms = [...t.members];
        [ms[i], ms[j]] = [ms[j], ms[i]];
        return { ...t, members: ms };
      }),
    }));
  }

  /* ── 미완성 판정 (빨간 테두리) ── */
  const memberIncomplete = (m: OrgMember) => !m.role.trim() || !m.name.trim();
  const teamIncomplete = (t: OrgTeam) => t.members.length === 0 || !t.name.trim();
  const divIncomplete = (d: OrgDivision) => d.teams.length === 0 || !d.name.trim();

  /* ── 실행: 역순으로 올라간다 ──
   * 직원 = 자기 역할대로 일함 → 팀장 = 팀원 결과 검토 → 부서장 = 팀 검토 검토 → 마스터 = 최종 검토
   */
  const canRun = !!callModel;
  const runModel = (m: OrgMember) => (isRunnable(m.kind, m.tool) ? m.model : DEFAULT_MODEL);
  /** 실행 실패 메시지를 사람이 읽을 수 있게 — 원인을 몰라 "아무 일도 안 일어난다"고 느끼는 걸 막는다 */
  function humanErr(e: unknown): string {
    const msg = (e as Error)?.message || "";
    if (/LOGIN_REQUIRED/i.test(msg)) return "실행하려면 로그인하거나 본인 API 키를 저장해야 해요 — 우측 상단 설정에서 Anthropic 키를 넣어주세요.";
    if (/\b401\b|unauthor|invalid.*key|api key/i.test(msg)) return "API 키가 없거나 잘못됐어요 — 본인 Anthropic 키를 저장해 주세요(공용 키는 막혀 있어요).";
    if (/quota|\b429\b|rate.?limit/i.test(msg)) return "잠깐 한도에 걸렸어요. 잠시 후 다시 시도해 주세요.";
    return msg || "실행에 실패했어요.";
  }

  /** 배포 직원의 실행 — 팀 결과(팀장 검토 우선, 없으면 팀원 결과 모음)를 채널로 내보낸다 */
  function runDeliver(d: OrgDivision, t: OrgTeam, m: OrgMember) {
    const payload = t.review || t.members.filter((x) => x.result).map((x) => `[${x.name || "담당자"}]\n${x.result}`).join("\n\n");
    if (!payload) { setErr("보낼 내용이 없어요. 먼저 팀원이 일을 하거나 팀장이 검토해야 합니다."); return; }
    const info = toolDef(m.kind, m.tool);
    if (!info.ready) {
      setErr(`${info.label}은(는) 아직 연결 전이에요 — ${info.note}. 지금은 이메일만 실제로 보내집니다.`);
      patchMember(d.id, t.id, m.id, { status: "alert" });
      return;
    }
    // 이메일: 메일 앱을 열고 제목·본문을 채워준다(실제 동작하는 유일한 채널)
    const subject = `${d.name || "부서"} · ${t.name || "팀"} 결과`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(payload)}`;
    patchMember(d.id, t.id, m.id, { status: "done", result: `📧 메일 작성 창을 열었습니다.\n\n제목: ${subject}\n\n--- 보낸 내용 ---\n${payload}`, resultAt: new Date().toISOString() });
    setPanel({ kind: "member", divId: d.id, teamId: t.id, memberId: m.id });
  }

  async function runMember(d: OrgDivision, t: OrgTeam, m: OrgMember) {
    if (busyId) return;
    if (isDeliverKind(m.kind)) { setErr(""); runDeliver(d, t, m); return; }
    if (!callModel) return;
    const job = (t.task || "").trim();
    if (!job) { setErr(`'${t.name || "이 팀"}'에 시킬 일이 비어 있어요 — 위 '시킬 일' 칸에 무엇을 할지 먼저 적어주세요.`); return; }
    setBusyId(m.id); setErr("");
    patchMember(d.id, t.id, m.id, { status: "work" });
    try {
      const prompt = [
        `당신은 '${d.name || "부서"}' 부서 '${t.name || "팀"}' 팀의 직원 '${m.name || "담당자"}'입니다.`,
        `맡은 역할: ${m.role || "(역할 미지정 — 팀 이름과 부서 이름에 맞게 판단해서 처리)"}`,
        "",
        "--- 이번에 시킬 일 ---",
        job,
        "",
        "위 업무를 당신의 역할에 맞게 실제로 수행해서 결과물만 내주세요.",
        "이 결과는 상급자(팀장)에게 그대로 올라갑니다. 인사말·설명 없이 결과 자체만 작성하세요.",
      ].join("\n");
      const text = await callModel(prompt, runModel(m), 2000);
      patchMember(d.id, t.id, m.id, { status: "done", result: text, resultAt: new Date().toISOString() });
      setPanel({ kind: "member", divId: d.id, teamId: t.id, memberId: m.id });
    } catch (e) {
      patchMember(d.id, t.id, m.id, { status: "alert" });
      setErr(humanErr(e));
    } finally { setBusyId(null); }
  }

  /** 전원 실행 — 상급자가 하급자 전원에게 '같은 일'을 시킨다.
   *  같은 업무를 Claude·GPT·Gemini 등 서로 다른 모델에게 동시에 시켜 결과를 비교할 때 쓴다.
   *  (순차 파이프라인 = 앞 결과가 다음 직원 입력으로 넘어가는 방식은 '자동화' 화면) */
  async function runAllMembers(d: OrgDivision, t: OrgTeam) {
    if (!callModel || busyId) return;
    if (!(t.task || "").trim()) { setErr(`'${t.name || "이 팀"}'에 시킬 일을 먼저 적어주세요.`); return; }
    const targets = t.members.filter((m) => !isDeliverKind(m.kind));
    if (!targets.length) { setErr("실행할 직원이 없어요."); return; }
    for (const m of targets) {
      await runMember(d, t, m);   // 순서대로 돌리되 모두 '같은 업무'를 받는다
    }
  }

  async function reviewTeam(d: OrgDivision, t: OrgTeam) {
    if (!callModel || busyId) return;
    const done = t.members.filter((m) => m.result);
    if (!done.length) { setErr("먼저 팀원이 일을 해야 검토할 수 있어요. 팀의 '실행'(또는 직원 카드의 '테스트')을 먼저 눌러주세요."); return; }
    setBusyId(t.id); setErr("");
    try {
      const prompt = [
        `당신은 '${d.name || "부서"}' 부서 '${t.name || "팀"}' 팀의 팀장입니다.`,
        "아래는 팀원들이 각자 역할대로 해온 결과입니다. 팀장으로서 검토해 주세요.",
        "빠진 것·틀린 것·서로 안 맞는 부분을 짚고, 팀의 최종 결과물로 정리해 주세요.",
        "",
        ...done.map((m) => `--- ${m.name || "담당자"}${m.role ? ` (${m.role})` : ""} ---\n${m.result}`),
      ].join("\n");
      const text = await callModel(prompt, DEFAULT_MODEL, 2000);
      patchTeam(d.id, t.id, { review: text, reviewAt: new Date().toISOString() });
      setPanel({ kind: "team", divId: d.id, teamId: t.id });
    } catch (e) {
      setErr(humanErr(e));
    } finally { setBusyId(null); }
  }

  async function reviewDiv(d: OrgDivision) {
    if (!callModel || busyId) return;
    const done = d.teams.filter((t) => t.review);
    if (!done.length) { setErr("먼저 팀장이 검토를 마쳐야 부서장이 검토할 수 있어요."); return; }
    setBusyId(d.id); setErr("");
    try {
      const prompt = [
        `당신은 '${d.name || "부서"}' 부서의 부서장입니다.`,
        "아래는 각 팀장이 정리해 올린 검토 결과입니다. 부서장으로서 최종 검토해 주세요.",
        "",
        ...done.map((t) => `--- ${t.name || "팀"} ---\n${t.review}`),
      ].join("\n");
      const text = await callModel(prompt, DEFAULT_MODEL, 2000);
      patchDiv(d.id, { review: text, reviewAt: new Date().toISOString() });
      setPanel({ kind: "div", divId: d.id });
    } catch (e) {
      setErr(humanErr(e));
    } finally { setBusyId(null); }
  }

  const [masterReview, setMasterReview] = useState<string>("");
  async function reviewMaster() {
    if (!callModel || busyId) return;
    const cm = callModel;
    const done = divisions.filter((d) => d.review);
    if (!done.length) { setErr("먼저 부서장이 검토를 마쳐야 마스터가 최종 검토할 수 있어요."); return; }
    setBusyId("master"); setErr("");
    const prompt = [
      "당신은 이 조직의 마스터(최종 감독)입니다.",
      "아래는 각 부서장이 올린 검토 결과입니다. 최종 감독으로서 빠진 것·틀린 것·리스크를 짚고 종합 검수해 주세요.",
      "",
      ...done.map((d) => `--- ${d.name || "부서"} ---\n${d.review}`),
    ].join("\n");
    try {
      // 서로 다른 3개 LLM이 각자 최종 검토 → 한 화면에 세 관점을 나란히 (하나 실패해도 나머지는 진행)
      const results = await Promise.all(MASTER_REVIEWERS.map(async (mm) => {
        try { return `### 🧠 ${mm.label}\n${await cm(prompt, mm.model, 2000)}`; }
        catch (e) { return `### 🧠 ${mm.label}\n⚠️ ${humanErr(e)}`; }
      }));
      setMasterReview(results.join("\n\n————————\n\n"));
      setPanel({ kind: "master" });
    } catch (e) {
      setErr(humanErr(e));
    } finally { setBusyId(null); }
  }

  /* ── 레이아웃 (상하) ── */
  const nodes: Node[] = [];
  const pos: Record<string, Pos> = {};
  const rows: Node[][] = [[], [], [], []];
  rows[0].push({ key: "master", kind: "master", pos: { x: 0, y: 0, w: 0, h: 0 } });
  divisions.forEach((d) => rows[1].push({ key: `bu-${d.id}`, kind: "div", div: d, pos: { x: 0, y: 0, w: 0, h: 0 } }));
  rows[1].push({ key: "add-bu", kind: "add", addType: "bu", label: "부서 만들기", pos: { x: 0, y: 0, w: 0, h: 0 } });
  if (bu) {
    bu.teams.forEach((t) => rows[2].push({ key: `tm-${t.id}`, kind: "team", div: bu, team: t, pos: { x: 0, y: 0, w: 0, h: 0 } }));
    rows[2].push({ key: "add-tm", kind: "add", addType: "team", label: "팀 만들기", pos: { x: 0, y: 0, w: 0, h: 0 } });
  }
  if (bu && team) {
    team.members.forEach((m) => rows[3].push({ key: `mb-${m.id}`, kind: "member", div: bu, team, member: m, pos: { x: 0, y: 0, w: 0, h: 0 } }));
    rows[3].push({ key: "add-mb", kind: "add", addType: "member", label: "직원 추가", pos: { x: 0, y: 0, w: 0, h: 0 } });
  }
  const hOf = (n: Node) => n.kind === "master" ? H.master : n.kind === "div" ? H.div : n.kind === "team" ? H.team : n.kind === "member" ? H.member : H.add;
  const wOf = (n: Node, lv: number) => n.kind === "add" ? ADD_W : W[lv];
  const ROW_Y = [
    PAD,
    PAD + H.master + ROW_GAP,
    PAD + H.master + H.div + 2 * ROW_GAP,
    PAD + H.master + H.div + H.team + 3 * ROW_GAP,
  ];
  const rowWidth = (col: Node[], lv: number) => col.reduce((s, n) => s + wOf(n, lv), 0) + Math.max(0, col.length - 1) * GAP;
  const layRow = (col: Node[], lv: number, startX: number) => {
    let x = startX;
    col.forEach((n) => { n.pos = { x, y: ROW_Y[lv], w: wOf(n, lv), h: hOf(n) }; pos[n.key] = n.pos; x += n.pos.w + GAP; });
  };
  const rowCenter = (col: Node[]) => { const f = col[0].pos, l = col[col.length - 1].pos; return (f.x + l.x + l.w) / 2; };
  // 자유 이동: 드래그 중이면 실시간 좌표, 아니면 저장된 좌표로 자동 배치를 덮어쓴다.
  // 부모(부서/팀)를 먼저 덮어써야 그 아래 자식 행이 부모의 '옮긴 위치'를 기준으로 배치된다.
  const applyStored = (n: Node) => {
    const p = pos[n.key];
    if (!p) return;
    if (drag && drag.key === n.key) { p.x = drag.x; p.y = drag.y; return; }
    const s = n.kind === "div" ? n.div : n.kind === "team" ? n.team : n.kind === "member" ? n.member : null;
    if (s && s.x != null && s.y != null) { p.x = s.x; p.y = s.y; }
  };
  layRow(rows[1], 1, PAD);
  rows[1].forEach(applyStored);
  const divCenter = rows[1].length ? rowCenter(rows[1]) : PAD + W[0] / 2;
  rows[0][0].pos = { x: Math.max(PAD, divCenter - W[0] / 2), y: ROW_Y[0], w: W[0], h: H.master };
  pos["master"] = rows[0][0].pos;
  if (rows[2].length) {
    const p = bu ? pos[`bu-${bu.id}`] : null;
    const cx = p ? p.x + p.w / 2 : divCenter;
    const cy = p ? p.y + p.h + ROW_GAP : ROW_Y[2];
    layRow(rows[2], 2, Math.max(PAD, cx - rowWidth(rows[2], 2) / 2));
    rows[2].forEach((n) => { const q = pos[n.key]; if (q) q.y = cy; });   // 옮긴 부서 바로 아래로
    rows[2].forEach(applyStored);
  }
  if (rows[3].length) {
    const p = team ? pos[`tm-${team.id}`] : null;
    const cx = p ? p.x + p.w / 2 : (rows[2].length ? rowCenter(rows[2]) : divCenter);
    const cy = p ? p.y + p.h + ROW_GAP : ROW_Y[3];
    layRow(rows[3], 3, Math.max(PAD, cx - rowWidth(rows[3], 3) / 2));
    rows[3].forEach((n) => { const q = pos[n.key]; if (q) q.y = cy; });
    rows[3].forEach(applyStored);
  }
  rows.forEach((col) => col.forEach((n) => nodes.push(n)));

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
  const rightMost = Math.max(300, ...nodes.map((n) => n.pos.x + n.pos.w));
  const bottomMost = Math.max(200, ...nodes.map((n) => n.pos.y + n.pos.h));
  const canvasW = rightMost + (divisions.length === 0 ? 300 : PAD);
  const canvasH = bottomMost + PAD;

  // 직원 간 흐름선(열린 팀만 좌표가 있으므로 그 팀 링크만 그린다) — 출력(오른쪽)→입력(왼쪽)
  const flowLinks: { tid: string; from: string; to: string; d: string }[] = [];
  if (team) {
    (team.links || []).forEach((l) => {
      const p = pos[`mb-${l.from}`], q = pos[`mb-${l.to}`];
      if (!p || !q) return;
      const x1 = p.x + p.w, y1 = p.y + p.h / 2, x2 = q.x, y2 = q.y + q.h / 2;
      const dx = Math.max(24, Math.abs(x2 - x1) / 2);
      flowLinks.push({ tid: team.id, from: l.from, to: l.to, d: `M${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}` });
    });
  }
  let rubber: string | null = null;   // 드래그 중 고무줄 선
  if (linkDrag) {
    const p = pos[`mb-${linkDrag.from}`];
    if (p) {
      const x1 = p.x + p.w, y1 = p.y + p.h / 2, x2 = linkDrag.x, y2 = linkDrag.y;
      const dx = Math.max(24, Math.abs(x2 - x1) / 2);
      rubber = `M${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    }
  }

  let teamsCount = 0, membersCount = 0;
  divisions.forEach((d) => { teamsCount += d.teams.length; d.teams.forEach((t) => (membersCount += t.members.length)); });

  const nameRef = (id: string) => (el: HTMLInputElement | null) => { if (el) inputMap.current.set(id, el); else inputMap.current.delete(id); };
  const stop = (e: SyntheticEvent) => e.stopPropagation();
  const Handle = ({ side }: { side: "t" | "b" }) => (
    <span className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/70 border-2 border-background ${side === "t" ? "-top-1" : "-bottom-1"}`} />
  );
  // 드래그 손잡이(⠿) — 여기서만 노드 이동이 시작된다(본문 클릭·입력과 충돌 없음)
  const Grip = ({ n }: { n: Node }) => (
    <button onMouseDown={(e) => startNodeDrag(e, n)} onClick={stop} title="드래그해서 자유롭게 이동"
      className="absolute -top-1.5 left-1.5 z-20 w-5 h-5 rounded-full bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-primary hover:text-primary grid place-items-center cursor-grab active:cursor-grabbing transition">
      <GripVertical className="w-3 h-3" />
    </button>
  );

  /* ── 이모지 고르기 ── */
  function EmojiPicker({ nodeKey, current, onPick }: { nodeKey: string; current: string; onPick: (e: string) => void }) {
    const open = emojiFor === nodeKey;
    return (
      <span className="relative shrink-0">
        <button onClick={(e) => { stop(e); setEmojiFor(open ? null : nodeKey); }} onMouseDown={stop}
          title="이모지 바꾸기"
          className="w-7 h-7 rounded-lg bg-muted grid place-items-center text-[15px] leading-none transition hover:bg-primary/10">
          {current}
        </button>
        {open && (
          <span onClick={stop} onMouseDown={stop}
            className="absolute z-30 top-8 left-0 w-[184px] rounded-xl border border-border bg-card shadow-lg p-1.5 grid grid-cols-8 gap-0.5">
            {EMOJI_CHOICES.map((em) => (
              <button key={em} onClick={(e) => { stop(e); onPick(em); setEmojiFor(null); }}
                className="w-[21px] h-[21px] rounded grid place-items-center text-[13px] leading-none hover:bg-primary/10">{em}</button>
            ))}
          </span>
        )}
      </span>
    );
  }

  /* ── 노드 ── */
  function renderNode(n: Node): ReactNode {
    const style = { left: n.pos.x, top: n.pos.y, width: n.pos.w, height: n.pos.h } as CSSProperties;

    if (n.kind === "add") {
      const fn = n.addType === "bu" ? addBu : n.addType === "team" ? addTeam : addMember;
      return (
        <button key={n.key} type="button" onClick={fn} style={style}
          className="absolute flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground text-[12.5px] font-medium transition hover:border-primary hover:text-primary">
          <Handle side="t" />
          <Plus className="w-3.5 h-3.5" /> {n.label}
        </button>
      );
    }

    if (n.kind === "master") {
      const busy = busyId === "master";
      return (
        <div key={n.key} style={style} className="absolute">
          <div className="relative h-full rounded-xl bg-card border border-primary/60 px-3 py-2.5 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0"><ShieldCheck className="w-3.5 h-3.5" /></span>
              <span className="font-semibold text-[13.5px]">마스터</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{divisions.length}개 부서</span>
            </div>
            <div className="mt-auto flex items-center gap-1">
              <button onClick={reviewMaster} disabled={!canRun || !!busyId}
                title="서로 다른 3개 LLM(Opus·Sonnet·Haiku)이 각자 최종 검토합니다"
                className="flex-1 h-6 rounded-md bg-primary/10 text-primary text-[11.5px] font-semibold transition enabled:hover:bg-primary/20 disabled:opacity-40 inline-flex items-center justify-center gap-1">
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} 최종 검토 <span className="text-[9px] opacity-70">3 LLM</span>
              </button>
              {masterReview && (
                <button onClick={() => setPanel({ kind: "master" })}
                  className="h-6 px-1.5 rounded-md border border-border text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5">
                  결과<ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>
            <Handle side="b" />
          </div>
        </div>
      );
    }

    if (n.kind === "div") {
      const d = n.div; const Icon = DIV_ICON[d.icon]; const open = d.id === openBu; const busy = busyId === d.id;
      const bad = divIncomplete(d);   // 이름이 없거나 팀이 0개 = 미완성
      return (
        <div key={n.key} data-node style={style} className="absolute cursor-pointer group" onClick={() => toggleBu(d.id)}>
          <Grip n={n} />
          <button onClick={(e) => { stop(e); delBu(d.id); }} title="부서 삭제"
            className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-rose-400 hover:text-rose-500 grid place-items-center transition">
            <X className="w-3 h-3" />
          </button>
          <div className={`relative h-full rounded-xl bg-card border px-3 py-2.5 flex flex-col transition ${bad ? "border-rose-400" : open ? "border-primary" : "border-border group-hover:border-muted-foreground/30"}`}
            title={bad ? "미완성 — 부서 이름을 짓고 팀을 1개 이상 만들어 주세요" : undefined}>
            <div className="flex items-center gap-2">
              {d.emoji
                ? <EmojiPicker nodeKey={n.key} current={d.emoji} onPick={(em) => patchDiv(d.id, { emoji: em })} />
                : <button onClick={(e) => { stop(e); setEmojiFor(emojiFor === n.key ? null : n.key); }} onMouseDown={stop} title="이모지 바꾸기"
                    className={`w-7 h-7 rounded-lg ${COLOR_BG[d.color]} text-white grid place-items-center shrink-0 transition hover:opacity-80`}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>}
              {!d.emoji && emojiFor === n.key && (
                <span onClick={stop} onMouseDown={stop} className="absolute z-30 top-11 left-3 w-[184px] rounded-xl border border-border bg-card shadow-lg p-1.5 grid grid-cols-8 gap-0.5">
                  {EMOJI_CHOICES.map((em) => (
                    <button key={em} onClick={(e) => { stop(e); patchDiv(d.id, { emoji: em }); setEmojiFor(null); }}
                      className="w-[21px] h-[21px] rounded grid place-items-center text-[13px] leading-none hover:bg-primary/10">{em}</button>
                  ))}
                </span>
              )}
              <input ref={nameRef(`bu-${d.id}`)} value={d.name} placeholder="부서 이름"
                onChange={(e) => patchDiv(d.id, { name: e.target.value })} onClick={stop} onMouseDown={stop}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                title="클릭해서 이름 바꾸기"
                className="flex-1 min-w-0 bg-transparent border-b border-dashed border-muted-foreground/25 hover:border-solid hover:border-primary/60 focus:border-solid focus:border-primary outline-none font-semibold text-[13.5px] py-0.5 cursor-text placeholder:text-muted-foreground/60 placeholder:font-normal" />
              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/50 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
            </div>
            <div className="mt-auto flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground mr-auto">{d.teams.length}개 팀</span>
              <button onClick={(e) => { stop(e); void reviewDiv(d); }} disabled={!canRun || !!busyId}
                className="h-6 px-2 rounded-md bg-primary/10 text-primary text-[11px] font-semibold transition enabled:hover:bg-primary/20 disabled:opacity-40 inline-flex items-center gap-1">
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} 검토
              </button>
              {d.review && (
                <button onClick={(e) => { stop(e); setPanel({ kind: "div", divId: d.id }); }}
                  className="h-6 px-1.5 rounded-md border border-border text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5">
                  결과<ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>
            <Handle side="t" /><Handle side="b" />
          </div>
        </div>
      );
    }

    if (n.kind === "team") {
      const t = n.team; const open = t.id === openTeam; const busy = busyId === t.id;
      const doneCount = t.members.filter((m) => m.result).length;
      const bad = teamIncomplete(t);   // 이름이 없거나 직원이 0명 = 미완성
      return (
        <div key={n.key} data-node style={style} className="absolute cursor-pointer group" onClick={() => setOpenTeam(open ? null : t.id)}>
          <Grip n={n} />
          <button onClick={(e) => { stop(e); delTeam(n.div.id, t.id); }} title="팀 삭제"
            className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-rose-400 hover:text-rose-500 grid place-items-center transition">
            <X className="w-3 h-3" />
          </button>
          <div className={`relative h-full rounded-xl bg-card border px-3 py-2.5 flex flex-col transition ${bad ? "border-rose-400" : open ? "border-primary" : "border-border group-hover:border-muted-foreground/30"}`}
            title={bad ? "미완성 — 팀 이름을 짓고 직원을 1명 이상 추가해 주세요" : undefined}>
            <div className="flex items-center gap-2">
              {t.emoji
                ? <EmojiPicker nodeKey={n.key} current={t.emoji} onPick={(em) => patchTeam(n.div.id, t.id, { emoji: em })} />
                : <button onClick={(e) => { stop(e); setEmojiFor(emojiFor === n.key ? null : n.key); }} onMouseDown={stop} title="이모지 바꾸기"
                    className={`w-7 h-7 rounded-full ${COLOR_BG[n.div.color]} text-white grid place-items-center shrink-0 transition hover:opacity-80`}>
                    <Users className="w-3.5 h-3.5" />
                  </button>}
              {!t.emoji && emojiFor === n.key && (
                <span onClick={stop} onMouseDown={stop} className="absolute z-30 top-11 left-3 w-[184px] rounded-xl border border-border bg-card shadow-lg p-1.5 grid grid-cols-8 gap-0.5">
                  {EMOJI_CHOICES.map((em) => (
                    <button key={em} onClick={(e) => { stop(e); patchTeam(n.div.id, t.id, { emoji: em }); setEmojiFor(null); }}
                      className="w-[21px] h-[21px] rounded grid place-items-center text-[13px] leading-none hover:bg-primary/10">{em}</button>
                  ))}
                </span>
              )}
              <input ref={nameRef(`tm-${t.id}`)} value={t.name} placeholder="팀 이름"
                onChange={(e) => patchTeam(n.div.id, t.id, { name: e.target.value })} onClick={stop} onMouseDown={stop}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                title="클릭해서 이름 바꾸기"
                className="flex-1 min-w-0 bg-transparent border-b border-dashed border-muted-foreground/25 hover:border-solid hover:border-primary/60 focus:border-solid focus:border-primary outline-none font-semibold text-[13.5px] py-0.5 cursor-text placeholder:text-muted-foreground/60 placeholder:font-normal" />
              <span className="text-[10.5px] text-muted-foreground shrink-0 whitespace-nowrap">
                {t.members.length}명{doneCount > 0 && <span className="text-emerald-600 dark:text-emerald-400">·{doneCount}완료</span>}
              </span>
              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/50 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
            </div>
            <div className="mt-auto flex items-center gap-1 justify-end">
              {t.members.length > 0 && (
                <button onClick={(e) => { stop(e); void runAllMembers(n.div, t); }} disabled={!canRun || !!busyId}
                  title="팀장이 팀원 전체에게 '이번에 시킬 일'을 지시합니다 — 각 팀원이 자기 역할대로 처리해요(같은 업무를 여러 모델에 시켜 비교도 가능). 직원 카드의 '테스트'는 혼자 돌려보는 용도예요."
                  className="h-6 px-2 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold transition enabled:hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Play className="w-3 h-3" /> 실행
                </button>
              )}
              <button onClick={(e) => { stop(e); void reviewTeam(n.div, t); }} disabled={!canRun || !!busyId}
                title="팀장이 팀원들의 결과를 모아 검토합니다"
                className="h-6 px-2 rounded-md bg-primary/10 text-primary text-[11px] font-semibold transition enabled:hover:bg-primary/20 disabled:opacity-40 inline-flex items-center gap-1 whitespace-nowrap shrink-0">
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} 검토
              </button>
              {onAutomate && t.members.length > 0 && (
                <button onClick={(e) => { stop(e); onAutomate(n.div.id, t.id); }}
                  title="자동화로 보내기 — 앞 직원 결과가 다음 직원 입력으로 넘어가는 순차 처리 + 루프 반복"
                  className="h-6 w-6 rounded-md border border-border text-muted-foreground transition hover:border-primary hover:text-primary grid place-items-center shrink-0">
                  <RotateCw className="w-3 h-3" />
                </button>
              )}
              {t.review && (
                <button onClick={(e) => { stop(e); setPanel({ kind: "team", divId: n.div.id, teamId: t.id }); }}
                  title="팀장 검토 결과 보기"
                  className="h-6 w-6 rounded-md border border-border text-muted-foreground hover:text-foreground grid place-items-center shrink-0">
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>
            <Handle side="t" /><Handle side="b" />
          </div>
        </div>
      );
    }

    // ── 직원 ──
    const m = n.member;
    const busy = busyId === m.id;
    const models = modelsOf(m.kind, m.tool);
    const deliver = isDeliverKind(m.kind);   // 배포 담당 직원 — AI가 아니라 결과를 밖으로 내보낸다
    const bad = memberIncomplete(m);          // 이름·역할이 비면 실행해도 의미가 없다
    const idx = n.team.members.findIndex((x) => x.id === m.id);
    return (
      <div key={n.key} data-node style={style} className="absolute group">
        <button onClick={(e) => { stop(e); delMember(n.div.id, n.team.id, m.id); }} title="직원 삭제"
          className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-rose-400 hover:text-rose-500 grid place-items-center transition">
          <X className="w-3 h-3" />
        </button>
        {/* 이동 손잡이 + 순서(일하는 순서) */}
        <div className="absolute -top-1.5 left-1.5 z-20 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
          <button onMouseDown={(e) => startNodeDrag(e, n)} onClick={stop} title="드래그해서 자유롭게 이동"
            className="w-5 h-5 rounded bg-card border border-border text-muted-foreground grid place-items-center hover:border-primary hover:text-primary cursor-grab active:cursor-grabbing transition">
            <GripVertical className="w-3 h-3" />
          </button>
          <button onClick={(e) => { stop(e); moveMember(n.div.id, n.team.id, m.id, -1); }} disabled={idx === 0} title="앞으로 (먼저 일함)"
            className="w-5 h-5 rounded bg-card border border-border text-muted-foreground grid place-items-center hover:border-primary hover:text-primary disabled:opacity-30 transition">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button onClick={(e) => { stop(e); moveMember(n.div.id, n.team.id, m.id, 1); }} disabled={idx === n.team.members.length - 1} title="뒤로 (나중에 일함)"
            className="w-5 h-5 rounded bg-card border border-border text-muted-foreground grid place-items-center hover:border-primary hover:text-primary disabled:opacity-30 transition">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className={"relative h-full rounded-xl bg-card border px-3 py-2.5 flex flex-col gap-1.5 " + (bad ? "border-rose-400" : deliver ? "border-teal-500/40" : "border-border")}
          title={bad ? "미완성 — 이름과 역할을 채워야 실행됩니다" : undefined}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[m.status]}`} title={STATUS_META[m.status].label} />
            <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums" title="일하는 순서">{idx + 1}</span>
            <span className="text-[11px] leading-none shrink-0">{kindEmoji(m.kind)}</span>
            <input ref={nameRef(`mb-${m.id}`)} value={m.name} placeholder="직원 이름"
              onChange={(e) => patchMember(n.div.id, n.team.id, m.id, { name: e.target.value })} onClick={stop} onMouseDown={stop}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              title="클릭해서 이름 바꾸기"
              className="flex-1 min-w-0 bg-transparent border-b border-dashed border-muted-foreground/25 hover:border-solid hover:border-primary/60 focus:border-solid focus:border-primary outline-none font-semibold text-[13.5px] py-0.5 cursor-text placeholder:text-muted-foreground/60 placeholder:font-normal" />
          </div>
          <input value={m.role} placeholder="역할 (예: 자료조사)" title="클릭해서 역할 바꾸기"
            onChange={(e) => patchMember(n.div.id, n.team.id, m.id, { role: e.target.value })} onClick={stop} onMouseDown={stop} onKeyDown={stop}
            className="w-full bg-transparent border-b border-dashed border-muted-foreground/20 hover:border-solid hover:border-primary/50 focus:border-solid focus:border-primary outline-none text-[11.5px] text-muted-foreground py-0.5 cursor-text placeholder:text-muted-foreground/50" />

          {/* 3단계 선택 — 역할 → 도구 → 모델. 한 줄에 3개는 답답해서 역할을 위, 도구·모델을 아래로. */}
          <select value={m.kind} onClick={stop} onMouseDown={stop}
            onChange={(e) => {
              const kind = e.target.value as MemberKind;
              const t = toolsFor(kind)[0];
              patchMember(n.div.id, n.team.id, m.id, { kind, tool: t.value, model: t.models[0].value });
            }}
            className="w-full text-[11px] rounded-md border border-border bg-background px-1.5 py-1 outline-none focus:border-primary cursor-pointer">
            {MEMBER_KINDS.map((k) => <option key={k.value} value={k.value}>{k.emoji} {k.label}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <select value={m.tool} onClick={stop} onMouseDown={stop}
              onChange={(e) => {
                const tool = e.target.value;
                patchMember(n.div.id, n.team.id, m.id, { tool, model: modelsOf(m.kind, tool)[0].value });
              }}
              className="w-[92px] shrink-0 text-[11px] rounded-md border border-border bg-background px-1.5 py-1 outline-none focus:border-primary cursor-pointer">
              {toolsFor(m.kind).map((t) => <option key={t.value} value={t.value}>{t.ready ? t.label : `${t.label} ⚠`}</option>)}
            </select>
            <select value={m.model} onClick={stop} onMouseDown={stop}
              onChange={(e) => patchMember(n.div.id, n.team.id, m.id, { model: e.target.value })}
              className="flex-1 min-w-0 text-[11px] rounded-md border border-border bg-background px-1.5 py-1 outline-none focus:border-primary cursor-pointer">
              {models.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="mt-auto flex items-center gap-1">
            <button onClick={() => void runMember(n.div, n.team, m)} disabled={(!canRun && !deliver) || !!busyId}
              title={deliver
                ? (isRunnable(m.kind, m.tool) ? "결과물을 실제로 내보냅니다" : toolNote(m.kind, m.tool))
                : "이 직원 혼자 테스트로 돌려봅니다 — 실제 업무 지시는 팀 노드의 '실행'(팀장)으로 하세요"}
              className={"flex-1 h-6 rounded-md text-[11.5px] font-semibold transition enabled:hover:opacity-90 disabled:opacity-40 inline-flex items-center justify-center gap-1 whitespace-nowrap "
                + (deliver ? (isRunnable(m.kind, m.tool) ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground border border-dashed border-border") : "bg-muted text-foreground border border-border")}>
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : deliver ? <Send className="w-3 h-3" /> : <FlaskConical className="w-3 h-3" />}
              {deliver ? (isRunnable(m.kind, m.tool) ? "보내기" : "연결 필요") : "테스트"}
            </button>
            {m.result && (
              <button onClick={() => setPanel({ kind: "member", divId: n.div.id, teamId: n.team.id, memberId: m.id })}
                className="h-6 px-1.5 rounded-md border border-border text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 whitespace-nowrap shrink-0">
                결과보기<ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* 입력 포트(왼쪽) — 다른 직원의 결과가 들어오는 드롭 지점 */}
          <span data-port-in data-member={m.id} data-team={n.team.id}
            title="다른 직원의 결과가 여기로 들어옵니다"
            className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 rounded-full bg-background border-2 border-primary/60 z-10" />
          {/* 출력 포트(오른쪽) — 여기서 드래그해 다음 직원의 왼쪽 점에 놓으면 결과가 넘어간다 */}
          <span onMouseDown={(e) => startLink(e, n.team.id, m.id)}
            title="여기서 드래그해 다음 직원의 왼쪽 점에 놓으세요 — 이 직원 결과가 그 직원에게 넘어갑니다"
            className={"absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 rounded-full border-2 border-background z-10 cursor-crosshair hover:scale-125 transition "
              + (linkDrag?.from === m.id ? "bg-primary scale-125 ring-2 ring-primary/40" : "bg-primary/80")} />
        </div>
      </div>
    );
  }

  /* ── 하단 패널 내용 ── */
  function panelData(): { title: string; sub: string; body: string } | null {
    if (!panel) return null;
    if (panel.kind === "master") return { title: "마스터 · 최종 검토", sub: "서로 다른 3개 LLM이 각자 검토", body: masterReview };
    const d = divisions.find((x) => x.id === (panel as { divId: string }).divId);
    if (!d) return null;
    if (panel.kind === "div") return { title: `${d.emoji || ""} ${d.name || "부서"} · 부서장 검토`, sub: "팀장 검토를 종합", body: d.review || "" };
    const t = d.teams.find((x) => x.id === (panel as { teamId: string }).teamId);
    if (!t) return null;
    if (panel.kind === "team") return { title: `${t.name || "팀"} · 팀장 검토`, sub: "팀원 결과를 종합", body: t.review || "" };
    const m = t.members.find((x) => x.id === panel.memberId);
    if (!m) return null;
    return {
      title: `${m.name || "담당자"}${m.role ? ` · ${m.role}` : ""}`,
      sub: `${kindEmoji(m.kind)} ${toolLabelOf(m.kind, m.tool)} · ${modelLabelOf(m.kind, m.tool, m.model)}${isRunnable(m.kind, m.tool) ? "" : " — 연결 필요"}`,
      body: m.result || "",
    };
  }
  const pd = panelData();

  return (
    <div className={(embedded ? "h-full flex flex-col" : "min-h-screen") + " bg-background text-foreground"}>
      {!embedded && <ProjectTopBar name="대리인 : AI비서" emoji="🟧" />}
      <div className={embedded ? "flex flex-col flex-1 min-h-0" : "pt-12 flex flex-col h-screen"}>

        {/* 상단 툴바 */}
        <div className="shrink-0 border-b border-border bg-card/40">
          {/* 이번에 시킬 일 — 부서·팀마다 다르므로 '지금 열린 팀'에 저장된다 */}
          <div className="flex items-center gap-2 px-4 pt-2.5 pb-1.5">
            <span className="text-[11px] font-bold text-muted-foreground shrink-0">
              시킬 일{team && <span className="text-primary"> · {team.name || "팀"}</span>}
            </span>
            {team ? (
              <>
                <input value={team.task || ""} onChange={(e) => patchTeam(bu!.id, team.id, { task: e.target.value })}
                  placeholder={`'${team.name || "이 팀"}'에 시킬 일 — 예) 신제품 출시 소식 콘텐츠를 만들어줘`}
                  className={"flex-1 min-w-0 text-[12.5px] rounded-md border bg-background px-2.5 py-1.5 outline-none transition placeholder:text-muted-foreground/50 "
                    + ((team.task || "").trim() ? "border-border focus:border-primary" : "border-rose-400/70 focus:border-rose-500")} />
                {!(team.task || "").trim() && <span className="text-[11px] text-rose-500 shrink-0 hidden sm:inline">← 없으면 실행 불가</span>}
              </>
            ) : (
              <span className="text-[12px] text-muted-foreground">부서·팀을 먼저 열면, 그 팀에 시킬 일을 여기서 적을 수 있어요.</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-4 pb-2 flex-wrap">
            {/* +부서/+팀/+직원은 캔버스의 '만들기' 노드로 하므로 툴바에선 뺀다(중복) */}
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mr-0.5"><Wand2 className="w-3 h-3" /> 바로 만들기</span>
            {ORG_PRESETS.map((p) => (
              <button key={p.id} onClick={() => addPreset(p.id)}
                title={`'${p.dept}' 부서를 만듭니다 — ${p.team} · ${p.members.map((m) => m.name).join(" → ")}`}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-border bg-card px-2 py-1.5 text-[12px] text-muted-foreground transition hover:border-primary hover:text-primary">
                <span>{p.emoji}</span> {p.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground hidden md:inline">부서 {divisions.length} · 팀 {teamsCount} · 직원 {membersCount}</span>
              <input type="range" min={55} max={130} step={5} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-20 accent-[hsl(var(--primary))]" />
              <span className="text-[11px] text-muted-foreground w-8 text-right tabular-nums">{zoom}%</span>
              <button onClick={reset} title="전체 비우기" className="p-1.5 rounded-md border border-border text-muted-foreground transition hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>

        <div className="relative flex flex-1 min-h-0">
          {/* 실행 에러 — 캔버스 어디를 보고 있든 항상 보이도록 하단 중앙에 띄운다 */}
          {err && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[90%] flex items-start gap-2 rounded-xl border border-rose-400/60 bg-card px-4 py-2.5 shadow-lg text-[12.5px] text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{err}</span>
              <button onClick={() => setErr("")} className="shrink-0 -mr-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          )}
          {!embedded && (
            <aside className="w-[230px] shrink-0 border-r border-border bg-card overflow-y-auto p-4 flex flex-col gap-5">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">일하는 순서</h2>
                <ol className="space-y-1.5 text-[12.5px] text-muted-foreground">
                  <li><b className="text-foreground">1.</b> 직원에게 역할을 준다</li>
                  <li><b className="text-foreground">2.</b> 직원이 <b className="text-foreground">실행</b> → 일함</li>
                  <li><b className="text-foreground">3.</b> 팀장이 <b className="text-foreground">검토</b></li>
                  <li><b className="text-foreground">4.</b> 부서장 → 마스터로 올라감</li>
                </ol>
              </div>
              <div className="mt-auto">
                <div className="space-y-1 text-[12.5px] text-muted-foreground">
                  <div className="flex items-center gap-2"><Network className="w-3.5 h-3.5 text-primary" /> 부서 {divisions.length}개</div>
                  <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-teal-500" /> 팀 {teamsCount}개</div>
                  <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-blue-500" /> 직원 {membersCount}명</div>
                </div>
                <Link href="/ai-assistant" className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-3.5 h-3.5" /> 대리인으로 돌아가기
                </Link>
              </div>
            </aside>
          )}

          {/* 캔버스 */}
          <div className="relative flex-1 min-w-0 overflow-auto" onClick={() => setEmojiFor(null)}
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0)", backgroundSize: "24px 24px" }}>
            <div ref={canvasRef} className="relative origin-top-left transition-transform" style={{ transform: `scale(${zoom / 100})`, width: canvasW, height: canvasH }}>
              {/* 뒤쪽: 상하관계 자동 연결선 */}
              <svg className="absolute top-0 left-0 overflow-visible" width={canvasW} height={canvasH}>
                {edges.map((e, i) => {
                  const p = pos[e.a], q = pos[e.b];
                  if (!p || !q) return null;
                  const x1 = p.x + p.w / 2, y1 = p.y + p.h, x2 = q.x + q.w / 2, y2 = q.y;
                  const dy = Math.max(24, (y2 - y1) / 2);
                  return <path key={i} d={`M${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`} fill="none"
                    style={{ stroke: "hsl(var(--border))", opacity: e.dash ? 0.8 : 1 }} strokeWidth={1.5} strokeDasharray={e.dash ? "4 4" : undefined} />;
                })}
              </svg>
              {nodes.map(renderNode)}

              {/* 앞쪽: 직원 간 흐름선(드래그로 그린 것) — 클릭하면 삭제. svg 자체는 클릭 통과, 선만 잡는다 */}
              <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" width={canvasW} height={canvasH}>
                <defs>
                  <marker id="flowhead" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse">
                    <path d="M0,0 L7,3 L0,6 Z" fill="hsl(var(--primary))" />
                  </marker>
                </defs>
                {flowLinks.map((fl) => (
                  <g key={`${fl.from}>${fl.to}`} className="pointer-events-auto cursor-pointer" onClick={() => delLink(fl.tid, fl.from, fl.to)}>
                    <path d={fl.d} fill="none" stroke="transparent" strokeWidth={14} />
                    <path d={fl.d} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} markerEnd="url(#flowhead)">
                      <title>클릭하면 이 연결을 삭제합니다</title>
                    </path>
                  </g>
                ))}
                {rubber && <path d={rubber} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 4" opacity={0.7} markerEnd="url(#flowhead)" />}
              </svg>

              {divisions.length === 0 && (
                <div className="absolute rounded-xl border border-border bg-card shadow-sm px-3.5 py-2.5 flex gap-2 text-[12.5px] text-muted-foreground"
                  style={{ left: (pos["add-bu"]?.x ?? PAD) + (pos["add-bu"]?.w ?? ADD_W) + 40, top: ROW_Y[1] - 10, width: 236 }}>
                  <Wand2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div>위 <b className="text-foreground font-medium">‘바로 만들기’</b>를 누르면 부서·팀·직원이 세팅된 채로 한 번에 만들어져요.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 결과 패널 — 직원이 한 일 / 상급자 검토 */}
        {pd && (
          <div className="shrink-0 border-t border-border bg-card max-h-[38%] flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
              <span className="font-semibold text-[13px] truncate">{pd.title}</span>
              <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">{pd.sub}</span>
              <button onClick={() => setPanel(null)} className="ml-auto shrink-0 p-1 rounded text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto px-4 py-3">
              {pd.body
                ? <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed">{pd.body}</pre>
                : <p className="text-[12.5px] text-muted-foreground">아직 결과가 없어요.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
