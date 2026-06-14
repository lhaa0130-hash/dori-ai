"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MousePointer2,
  PencilRuler,
  Trash2,
  Save,
  FolderOpen,
  RotateCcw,
  Download,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Info,
  Ruler,
  LayoutGrid,
} from "lucide-react";

// ----------------------------------------------------------------------
// flat-form — 누구나 설계하고, 전문가를 돕는 평면도 설계 보조 프로그램
// ----------------------------------------------------------------------

const COLS = 32;
const ROWS = 24;
const CELL = 22; // 화면상 1칸 픽셀
const CELL_M = 0.5; // 1칸 = 0.5m → 1칸 면적 0.25㎡
const CELL_AREA = CELL_M * CELL_M;
const PYEONG = 3.305785; // 1평(㎡)
const W = COLS * CELL;
const H = ROWS * CELL;
const STORAGE_KEY = "flatform_plan_v1";

type RoomTypeKey =
  | "living"
  | "bedroom"
  | "kitchen"
  | "bath"
  | "entry"
  | "balcony"
  | "dressing"
  | "storage"
  | "etc";

type Room = {
  id: string;
  x: number; // 칸 단위
  y: number;
  w: number;
  h: number;
  type: RoomTypeKey;
  name: string;
};

type RoomMeta = {
  label: string;
  fill: string;
  stroke: string;
  habitable: boolean; // 거실·침실 등 거주실
};

const ROOM_TYPES: Record<RoomTypeKey, RoomMeta> = {
  living:   { label: "거실",    fill: "rgba(249,149,78,0.16)",  stroke: "#F9954E", habitable: true },
  bedroom:  { label: "침실",    fill: "rgba(59,130,246,0.16)",  stroke: "#3B82F6", habitable: true },
  kitchen:  { label: "주방",    fill: "rgba(34,197,94,0.16)",   stroke: "#22C55E", habitable: false },
  bath:     { label: "욕실",    fill: "rgba(6,182,212,0.18)",   stroke: "#06B6D4", habitable: false },
  entry:    { label: "현관",    fill: "rgba(100,116,139,0.18)", stroke: "#64748B", habitable: false },
  balcony:  { label: "발코니",  fill: "rgba(20,184,166,0.14)",  stroke: "#14B8A6", habitable: false },
  dressing: { label: "드레스룸", fill: "rgba(168,85,247,0.16)",  stroke: "#A855F7", habitable: false },
  storage:  { label: "창고",    fill: "rgba(120,113,108,0.16)", stroke: "#78716C", habitable: false },
  etc:      { label: "기타",    fill: "rgba(148,163,184,0.14)", stroke: "#94A3B8", habitable: false },
};

const TYPE_ORDER: RoomTypeKey[] = [
  "living", "bedroom", "kitchen", "bath", "entry", "balcony", "dressing", "storage", "etc",
];

// 빠른 시작 템플릿 (칸 단위) ---------------------------------------------
const TEMPLATES: { id: string; label: string; desc: string; rooms: Omit<Room, "id">[] }[] = [
  {
    id: "oneroom",
    label: "원룸",
    desc: "약 8평 · 1인 가구",
    rooms: [
      { x: 4, y: 4, w: 12, h: 10, type: "living", name: "원룸" },
      { x: 16, y: 4, w: 4, h: 5, type: "kitchen", name: "주방" },
      { x: 16, y: 9, w: 4, h: 5, type: "bath", name: "욕실" },
      { x: 4, y: 14, w: 4, h: 3, type: "entry", name: "현관" },
    ],
  },
  {
    id: "tworoom",
    label: "투룸",
    desc: "약 18평 · 신혼/소가족",
    rooms: [
      { x: 3, y: 3, w: 11, h: 9, type: "living", name: "거실" },
      { x: 14, y: 3, w: 8, h: 6, type: "bedroom", name: "안방" },
      { x: 14, y: 9, w: 8, h: 5, type: "bedroom", name: "침실" },
      { x: 3, y: 12, w: 6, h: 5, type: "kitchen", name: "주방" },
      { x: 9, y: 12, w: 5, h: 5, type: "bath", name: "욕실" },
      { x: 3, y: 17, w: 4, h: 3, type: "entry", name: "현관" },
    ],
  },
  {
    id: "apt84",
    label: "아파트 84㎡",
    desc: "국민평형 · 3룸",
    rooms: [
      { x: 2, y: 4, w: 12, h: 11, type: "living", name: "거실" },
      { x: 14, y: 4, w: 9, h: 7, type: "bedroom", name: "안방" },
      { x: 23, y: 4, w: 7, h: 7, type: "bedroom", name: "침실 1" },
      { x: 23, y: 11, w: 7, h: 6, type: "bedroom", name: "침실 2" },
      { x: 14, y: 11, w: 9, h: 6, type: "kitchen", name: "주방/식당" },
      { x: 2, y: 15, w: 6, h: 5, type: "bath", name: "공용욕실" },
      { x: 8, y: 15, w: 6, h: 5, type: "bath", name: "안방욕실" },
      { x: 14, y: 17, w: 6, h: 3, type: "entry", name: "현관" },
      { x: 2, y: 1, w: 28, h: 3, type: "balcony", name: "발코니" },
    ],
  },
];

// 유틸 ------------------------------------------------------------------
const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fmtArea = (cells: number) => (cells * CELL_AREA).toFixed(1);
const fmtPyeong = (cells: number) => ((cells * CELL_AREA) / PYEONG).toFixed(1);

type Tip = { level: "good" | "warn" | "info"; text: string };

function buildTips(rooms: Room[]): Tip[] {
  if (rooms.length === 0) {
    return [{ level: "info", text: "도구에서 방 종류를 고른 뒤 캔버스를 드래그해 첫 방을 그려보세요." }];
  }

  const tips: Tip[] = [];
  const count = (t: RoomTypeKey) => rooms.filter((r) => r.type === t).length;

  // 필수 구성 점검
  if (count("bath") === 0) tips.push({ level: "warn", text: "욕실이 없어요. 주거 공간에는 욕실/화장실이 반드시 필요합니다." });
  if (count("kitchen") === 0) tips.push({ level: "warn", text: "주방이 없어요. 취사 공간을 추가해 보세요." });
  if (count("entry") === 0) tips.push({ level: "info", text: "현관을 추가하면 외부 동선과 신발 공간을 정리할 수 있어요." });
  if (count("bedroom") === 0 && count("living") === 0)
    tips.push({ level: "info", text: "거실이나 침실 같은 거주 공간을 추가해 보세요." });

  // 치수·면적 점검
  for (const r of rooms) {
    const meta = ROOM_TYPES[r.type];
    const areaCells = r.w * r.h;
    const minDim = Math.min(r.w, r.h) * CELL_M;
    if (meta.habitable && areaCells * CELL_AREA < 4) {
      tips.push({ level: "warn", text: `'${r.name}'이(가) 너무 좁아요 (${fmtArea(areaCells)}㎡). 거주실은 4㎡ 이상을 권장해요.` });
    }
    if (minDim < 1.0) {
      tips.push({ level: "warn", text: `'${r.name}'의 한 변이 ${minDim.toFixed(1)}m로 너무 좁아요. 통행을 위해 1m 이상을 권장해요.` });
    }
  }

  // 겹침 점검
  let overlap = false;
  for (let i = 0; i < rooms.length && !overlap; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i], b = rooms[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        overlap = true;
        break;
      }
    }
  }
  if (overlap) tips.push({ level: "warn", text: "겹치는 방이 있어요. 방끼리 겹치지 않게 배치하면 면적 계산이 정확해져요." });

  // 비율 점검
  const living = rooms.filter((r) => r.type === "living").reduce((s, r) => s + r.w * r.h, 0);
  const bedrooms = rooms.filter((r) => r.type === "bedroom").reduce((s, r) => s + r.w * r.h, 0);
  if (living > 0 && bedrooms > 0 && living < bedrooms * 0.7) {
    tips.push({ level: "info", text: "거실이 침실 합계보다 작아요. 공용 공간을 조금 더 넓히면 개방감이 좋아져요." });
  }

  // 긍정 피드백
  if (!tips.some((t) => t.level === "warn") && count("bath") > 0 && count("kitchen") > 0) {
    tips.push({ level: "good", text: "기본 구성(거주실·주방·욕실)이 잘 갖춰졌어요. 좋은 설계예요! 👏" });
  }

  return tips;
}

export default function FlatFormPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "draw">("select");
  const [drawType, setDrawType] = useState<RoomTypeKey>("bedroom");
  const [isDark, setIsDark] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 드래그/리사이즈 상호작용 상태
  const preview = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const interaction = useRef<
    | { mode: "draw"; start: { x: number; y: number } }
    | { mode: "move"; id: string; offX: number; offY: number }
    | { mode: "resize"; id: string; corner: "nw" | "ne" | "sw" | "se" }
    | null
  >(null);

  // 다크모드 감지
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // 최초 로드: 저장된 설계 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRooms(parsed);
      }
    } catch {/* ignore */}
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const selected = useMemo(() => rooms.find((r) => r.id === selectedId) || null, [rooms, selectedId]);
  const totalCells = useMemo(() => rooms.reduce((s, r) => s + r.w * r.h, 0), [rooms]);
  const tips = useMemo(() => buildTips(rooms), [rooms]);

  // ----- 좌표 헬퍼 -----
  const eventCell = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    return {
      px: ((e.clientX - rect.left) * sx) / CELL,
      py: ((e.clientY - rect.top) * sy) / CELL,
    };
  };

  const cornerAt = (r: Room, px: number, py: number): "nw" | "ne" | "sw" | "se" | null => {
    const tol = 0.6; // 칸
    const corners: Record<string, [number, number]> = {
      nw: [r.x, r.y], ne: [r.x + r.w, r.y], sw: [r.x, r.y + r.h], se: [r.x + r.w, r.y + r.h],
    };
    for (const k of Object.keys(corners) as ("nw" | "ne" | "sw" | "se")[]) {
      const [cx, cy] = corners[k];
      if (Math.abs(px - cx) <= tol && Math.abs(py - cy) <= tol) return k;
    }
    return null;
  };

  const roomAt = (px: number, py: number): Room | null => {
    for (let i = rooms.length - 1; i >= 0; i--) {
      const r = rooms[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return r;
    }
    return null;
  };

  // ----- 포인터 이벤트 -----
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { px, py } = eventCell(e);

    if (tool === "draw") {
      const sx = clamp(Math.round(px), 0, COLS);
      const sy = clamp(Math.round(py), 0, ROWS);
      interaction.current = { mode: "draw", start: { x: sx, y: sy } };
      preview.current = { x: sx, y: sy, w: 0, h: 0 };
      return;
    }

    // select 모드: 선택된 방의 리사이즈 핸들 먼저
    if (selected) {
      const corner = cornerAt(selected, px, py);
      if (corner) {
        interaction.current = { mode: "resize", id: selected.id, corner };
        return;
      }
    }
    const hit = roomAt(px, py);
    if (hit) {
      setSelectedId(hit.id);
      interaction.current = { mode: "move", id: hit.id, offX: px - hit.x, offY: py - hit.y };
    } else {
      setSelectedId(null);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const it = interaction.current;
    if (!it) return;
    const { px, py } = eventCell(e);

    if (it.mode === "draw") {
      const sx = it.start.x, sy = it.start.y;
      const ex = clamp(Math.round(px), 0, COLS);
      const ey = clamp(Math.round(py), 0, ROWS);
      preview.current = { x: Math.min(sx, ex), y: Math.min(sy, ey), w: Math.abs(ex - sx), h: Math.abs(ey - sy) };
      draw();
      return;
    }

    if (it.mode === "move") {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== it.id) return r;
          const nx = clamp(Math.round(px - it.offX), 0, COLS - r.w);
          const ny = clamp(Math.round(py - it.offY), 0, ROWS - r.h);
          return { ...r, x: nx, y: ny };
        })
      );
      return;
    }

    if (it.mode === "resize") {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== it.id) return r;
          let { x, y, w, h } = r;
          const gx = clamp(Math.round(px), 0, COLS);
          const gy = clamp(Math.round(py), 0, ROWS);
          const right = x + w, bottom = y + h;
          if (it.corner === "nw") { x = Math.min(gx, right - 1); y = Math.min(gy, bottom - 1); w = right - x; h = bottom - y; }
          if (it.corner === "ne") { y = Math.min(gy, bottom - 1); w = Math.max(1, gx - x); h = bottom - y; }
          if (it.corner === "sw") { x = Math.min(gx, right - 1); w = right - x; h = Math.max(1, gy - y); }
          if (it.corner === "se") { w = Math.max(1, gx - x); h = Math.max(1, gy - y); }
          return { ...r, x, y, w, h };
        })
      );
      return;
    }
  };

  const onPointerUp = () => {
    const it = interaction.current;
    if (it?.mode === "draw" && preview.current) {
      const p = preview.current;
      if (p.w >= 1 && p.h >= 1) {
        const meta = ROOM_TYPES[drawType];
        const sameType = rooms.filter((r) => r.type === drawType).length;
        const name = sameType === 0 ? meta.label : `${meta.label} ${sameType + 1}`;
        const room: Room = { id: uid(), x: p.x, y: p.y, w: p.w, h: p.h, type: drawType, name };
        setRooms((prev) => [...prev, room]);
        setSelectedId(room.id);
      }
    }
    preview.current = null;
    interaction.current = null;
    draw();
  };

  // ----- 삭제 (키보드) -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        setRooms((prev) => prev.filter((r) => r.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  // ----- 캔버스 렌더링 -----
  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== W * dpr) {
      c.width = W * dpr;
      c.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // 배경
    ctx.fillStyle = isDark ? "#0a0a0a" : "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // 그리드
    ctx.lineWidth = 1;
    ctx.strokeStyle = isDark ? "#1c1c1f" : "#f1f1f3";
    ctx.beginPath();
    for (let i = 0; i <= COLS; i++) { ctx.moveTo(i * CELL + 0.5, 0); ctx.lineTo(i * CELL + 0.5, H); }
    for (let j = 0; j <= ROWS; j++) { ctx.moveTo(0, j * CELL + 0.5); ctx.lineTo(W, j * CELL + 0.5); }
    ctx.stroke();
    // 굵은 격자 (1m = 2칸)
    ctx.strokeStyle = isDark ? "#2a2a2f" : "#e5e5e8";
    ctx.beginPath();
    for (let i = 0; i <= COLS; i += 2) { ctx.moveTo(i * CELL + 0.5, 0); ctx.lineTo(i * CELL + 0.5, H); }
    for (let j = 0; j <= ROWS; j += 2) { ctx.moveTo(0, j * CELL + 0.5); ctx.lineTo(W, j * CELL + 0.5); }
    ctx.stroke();

    // 방
    for (const r of rooms) {
      const meta = ROOM_TYPES[r.type];
      const x = r.x * CELL, y = r.y * CELL, w = r.w * CELL, h = r.h * CELL;
      ctx.fillStyle = meta.fill;
      ctx.fillRect(x, y, w, h);
      ctx.lineWidth = r.id === selectedId ? 3 : 2;
      ctx.strokeStyle = meta.stroke;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

      // 라벨 + 면적
      const cx = x + w / 2, cy = y + h / 2;
      ctx.fillStyle = isDark ? "#fafafa" : "#171717";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (w > 54 && h > 40) {
        ctx.font = "bold 12px ui-sans-serif, system-ui, sans-serif";
        ctx.fillText(r.name, cx, cy - 8);
        ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
        ctx.fillStyle = isDark ? "#a1a1aa" : "#71717a";
        ctx.fillText(`${fmtArea(r.w * r.h)}㎡ · ${fmtPyeong(r.w * r.h)}평`, cx, cy + 8);
      } else if (w > 30 && h > 18) {
        ctx.font = "bold 10px ui-sans-serif, system-ui, sans-serif";
        ctx.fillText(r.name, cx, cy);
      }

      // 치수 (선택된 방)
      if (r.id === selectedId) {
        ctx.fillStyle = meta.stroke;
        ctx.font = "bold 10px ui-sans-serif, system-ui, sans-serif";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${(r.w * CELL_M).toFixed(1)}m`, cx, y - 3);
        ctx.save();
        ctx.translate(x - 4, cy);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = "bottom";
        ctx.fillText(`${(r.h * CELL_M).toFixed(1)}m`, 0, 0);
        ctx.restore();

        // 리사이즈 핸들
        const handles: [number, number][] = [
          [x, y], [x + w, y], [x, y + h], [x + w, y + h],
        ];
        for (const [hx, hy] of handles) {
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = meta.stroke;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(hx - 4, hy - 4, 8, 8);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    // 그리기 미리보기
    if (preview.current && preview.current.w >= 1 && preview.current.h >= 1) {
      const meta = ROOM_TYPES[drawType];
      const p = preview.current;
      ctx.fillStyle = meta.fill;
      ctx.fillRect(p.x * CELL, p.y * CELL, p.w * CELL, p.h * CELL);
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = meta.stroke;
      ctx.strokeRect(p.x * CELL + 1, p.y * CELL + 1, p.w * CELL - 2, p.h * CELL - 2);
      ctx.setLineDash([]);
    }
  }, [rooms, selectedId, drawType, isDark]);

  useEffect(() => { draw(); }, [draw]);

  // ----- 액션 -----
  const updateSelected = (patch: Partial<Room>) => {
    if (!selectedId) return;
    setRooms((prev) => prev.map((r) => (r.id === selectedId ? { ...r, ...patch } : r)));
  };
  const deleteSelected = () => {
    if (!selectedId) return;
    setRooms((prev) => prev.filter((r) => r.id !== selectedId));
    setSelectedId(null);
  };
  const savePlan = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms)); flash("설계를 저장했어요"); }
    catch { flash("저장에 실패했어요"); }
  };
  const loadPlan = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { flash("저장된 설계가 없어요"); return; }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) { setRooms(parsed); setSelectedId(null); flash("저장된 설계를 불러왔어요"); }
    } catch { flash("불러오기에 실패했어요"); }
  };
  const resetPlan = () => {
    if (rooms.length && !confirm("현재 설계를 모두 지울까요?")) return;
    setRooms([]); setSelectedId(null);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ unit: CELL_M, rooms }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "flatform-plan.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const loadTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (rooms.length && !confirm(`'${t.label}' 템플릿을 불러올까요? 현재 설계는 사라져요.`)) return;
    setRooms(t.rooms.map((r) => ({ ...r, id: uid() })));
    setSelectedId(null);
    setTool("select");
  };

  return (
    <main className="min-h-screen pb-20">
      {/* 헤더 */}
      <div className="flex items-center gap-2 pt-6 pb-4">
        <Link
          href="/"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-colors"
          aria-label="홈으로"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-[#F9954E]" />
            <h1 className="text-[20px] font-extrabold text-neutral-950 dark:text-white tracking-tight">flat-form</h1>
          </div>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
            누구나 설계하고, 전문가를 돕는 평면도 설계 도우미
          </p>
        </div>
      </div>

      {/* 템플릿 */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        <span className="flex-shrink-0 self-center text-[11px] font-bold text-neutral-400 pr-1">빠른 시작</span>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => loadTemplate(t.id)}
            className="flex-shrink-0 px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-left hover:border-[#F9954E]/50 transition-colors"
          >
            <span className="block text-[12px] font-bold text-neutral-900 dark:text-white">{t.label}</span>
            <span className="block text-[10px] text-neutral-400">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* 도구 모음 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="inline-flex rounded-xl border border-neutral-200 dark:border-zinc-800 overflow-hidden">
          <button
            onClick={() => setTool("select")}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold transition-colors ${
              tool === "select" ? "bg-[#F9954E] text-white" : "bg-white dark:bg-zinc-950 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            <MousePointer2 className="w-4 h-4" /> 선택·이동
          </button>
          <button
            onClick={() => setTool("draw")}
            className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold transition-colors ${
              tool === "draw" ? "bg-[#F9954E] text-white" : "bg-white dark:bg-zinc-950 text-neutral-600 dark:text-neutral-300"
            }`}
          >
            <PencilRuler className="w-4 h-4" /> 방 그리기
          </button>
        </div>
        <div className="flex-1" />
        <button onClick={savePlan} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[12px] font-semibold text-neutral-600 dark:text-neutral-300 hover:border-[#F9954E]/50 transition-colors">
          <Save className="w-4 h-4" /> 저장
        </button>
        <button onClick={loadPlan} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[12px] font-semibold text-neutral-600 dark:text-neutral-300 hover:border-[#F9954E]/50 transition-colors">
          <FolderOpen className="w-4 h-4" /> 불러오기
        </button>
        <button onClick={exportJson} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[12px] font-semibold text-neutral-600 dark:text-neutral-300 hover:border-[#F9954E]/50 transition-colors">
          <Download className="w-4 h-4" /> 내보내기
        </button>
        <button onClick={resetPlan} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[12px] font-semibold text-red-500 hover:border-red-300 transition-colors">
          <RotateCcw className="w-4 h-4" /> 초기화
        </button>
      </div>

      {/* 방 종류 팔레트 (그리기 모드일 때 강조) */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {TYPE_ORDER.map((k) => {
          const meta = ROOM_TYPES[k];
          const active = drawType === k;
          return (
            <button
              key={k}
              onClick={() => { setDrawType(k); setTool("draw"); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${
                active
                  ? "border-transparent text-white shadow-sm"
                  : "border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-neutral-600 dark:text-neutral-300"
              }`}
              style={active ? { backgroundColor: meta.stroke } : undefined}
            >
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: meta.stroke }} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-4 items-start">
        {/* 캔버스 */}
        <div className="overflow-auto rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <canvas
            ref={canvasRef}
            style={{ width: W, height: H, touchAction: "none", display: "block", cursor: tool === "draw" ? "crosshair" : "default" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>

        {/* 사이드: 통계 + 속성 + 도우미 */}
        <div className="space-y-3 min-w-0">
          {/* 통계 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <Ruler className="w-4 h-4 text-[#F9954E]" />
              <h2 className="text-[13px] font-extrabold text-neutral-900 dark:text-white">설계 요약</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-neutral-50 dark:bg-zinc-900 py-2.5">
                <p className="text-[18px] font-extrabold text-neutral-900 dark:text-white leading-none">{rooms.length}</p>
                <p className="text-[10px] text-neutral-400 mt-1">방 개수</p>
              </div>
              <div className="rounded-xl bg-neutral-50 dark:bg-zinc-900 py-2.5">
                <p className="text-[18px] font-extrabold text-neutral-900 dark:text-white leading-none">{fmtArea(totalCells)}</p>
                <p className="text-[10px] text-neutral-400 mt-1">총 면적(㎡)</p>
              </div>
              <div className="rounded-xl bg-neutral-50 dark:bg-zinc-900 py-2.5">
                <p className="text-[18px] font-extrabold text-[#F9954E] leading-none">{fmtPyeong(totalCells)}</p>
                <p className="text-[10px] text-neutral-400 mt-1">총 평수</p>
              </div>
            </div>
            {rooms.length > 0 && (
              <ul className="mt-3 space-y-1">
                {rooms.map((r) => (
                  <li
                    key={r.id}
                    onClick={() => { setSelectedId(r.id); setTool("select"); }}
                    className={`flex items-center justify-between text-[12px] px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      r.id === selectedId ? "bg-[#F9954E]/10" : "hover:bg-neutral-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: ROOM_TYPES[r.type].stroke }} />
                      <span className="font-semibold text-neutral-700 dark:text-neutral-200 truncate">{r.name}</span>
                    </span>
                    <span className="text-neutral-400 flex-shrink-0 ml-2">{fmtArea(r.w * r.h)}㎡</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 속성 */}
          {selected ? (
            <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm">
              <h2 className="text-[13px] font-extrabold text-neutral-900 dark:text-white mb-3">방 속성</h2>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">이름</label>
              <input
                value={selected.name}
                onChange={(e) => updateSelected({ name: e.target.value })}
                className="w-full px-3 py-2 mb-3 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:border-[#F9954E]"
              />
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1">종류</label>
              <select
                value={selected.type}
                onChange={(e) => updateSelected({ type: e.target.value as RoomTypeKey })}
                className="w-full px-3 py-2 mb-3 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:border-[#F9954E]"
              >
                {TYPE_ORDER.map((k) => (
                  <option key={k} value={k}>{ROOM_TYPES[k].label}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">가로(m)</label>
                  <input
                    type="number" step={CELL_M} min={CELL_M}
                    value={(selected.w * CELL_M).toFixed(1)}
                    onChange={(e) => {
                      const cells = clamp(Math.round(parseFloat(e.target.value || "0") / CELL_M), 1, COLS - selected.x);
                      updateSelected({ w: cells });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:border-[#F9954E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">세로(m)</label>
                  <input
                    type="number" step={CELL_M} min={CELL_M}
                    value={(selected.h * CELL_M).toFixed(1)}
                    onChange={(e) => {
                      const cells = clamp(Math.round(parseFloat(e.target.value || "0") / CELL_M), 1, ROWS - selected.y);
                      updateSelected({ h: cells });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900 text-[13px] text-neutral-900 dark:text-white outline-none focus:border-[#F9954E]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[12px] mb-3 px-1">
                <span className="text-neutral-400">면적</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {fmtArea(selected.w * selected.h)}㎡ · {fmtPyeong(selected.w * selected.h)}평
                </span>
              </div>
              <button
                onClick={deleteSelected}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 text-[12px] font-bold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> 이 방 삭제
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 p-4 text-center">
              <p className="text-[12px] text-neutral-400 leading-relaxed">
                방을 선택하면 이름·종류·치수를 편집할 수 있어요.<br />
                <span className="text-neutral-300 dark:text-neutral-600">모서리를 드래그하면 크기 조절 · Delete로 삭제</span>
              </p>
            </div>
          )}

          {/* 전문가 도우미 */}
          <div className="rounded-2xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <Lightbulb className="w-4 h-4 text-[#F9954E]" />
              <h2 className="text-[13px] font-extrabold text-neutral-900 dark:text-white">설계 도우미</h2>
            </div>
            <ul className="space-y-2">
              {tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed">
                  {t.level === "good" && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                  {t.level === "warn" && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
                  {t.level === "info" && <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
                  <span className="text-neutral-600 dark:text-neutral-300">{t.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 pt-3 border-t border-neutral-100 dark:border-zinc-900 text-[10px] text-neutral-400 leading-relaxed">
              ※ 도우미 제안은 일반적인 설계 가이드입니다. 실제 시공·인허가는 건축사 등 전문가의 검토가 필요해요.
            </p>
          </div>
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[13px] font-semibold shadow-lg">
          {toast}
        </div>
      )}
    </main>
  );
}
