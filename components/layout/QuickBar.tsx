"use client";

// 토스증권 우측 레일 풍의 "내 바로가기" 퀵바.
// - 우측 끝 세로 레일(lg+). 접기/펴기. 모바일은 BottomNav가 담당하므로 숨김.
// - 기본은 비어 있고 + 버튼만. 사용자가 카테고리를 골라 채운다.
// - 드래그로 순서 변경(HTML5 DnD, 데스크탑 전용이라 충분).
// - 비로그인: localStorage. 로그인: users/{uid}.quickBar 자동 저장(기기 간 동기화).

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PawPrint, TrendingUp, Sparkles, PencilRuler, FolderKanban,
  Gamepad2, Wrench, BarChart3, Newspaper, Rss, MessagesSquare,
  ShoppingBag, Store, User, Bell,
  Plus, X, ChevronsRight, ChevronsLeft, Pin, GripVertical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loadQuickBarRemote, saveQuickBarRemote } from "@/lib/quickBar";

type Cat = { key: string; label: string; short: string; href: string; Icon: React.ComponentType<{ className?: string }> };
type Group = { label: string; items: Cat[] };

// 추가 가능한 전체 카탈로그(그룹별)
const CATALOG: Group[] = [
  {
    label: "프로젝트",
    items: [
      { key: "animal",   label: "애니멀일로",   short: "애니멀",   href: "/animal",    Icon: PawPrint },
      { key: "trader",   label: "트레이더일로", short: "트레이더", href: "/trader",    Icon: TrendingUp },
      { key: "workillo", label: "워크일로",     short: "워크",     href: "/illo/app",  Icon: Sparkles },
      { key: "arcillo",  label: "아크일로",     short: "아크",     href: "/flat-form", Icon: PencilRuler },
      { key: "projects", label: "프로젝트 전체", short: "프로젝트", href: "/projects",  Icon: FolderKanban },
    ],
  },
  {
    label: "둘러보기",
    items: [
      { key: "minigame",  label: "미니게임",   short: "게임",     href: "/minigame",  Icon: Gamepad2 },
      { key: "aitools",   label: "AI 도구",    short: "AI도구",   href: "/ai-tools",  Icon: Wrench },
      { key: "aimodels",  label: "AI 모델",    short: "AI모델",   href: "/ai-models", Icon: BarChart3 },
      { key: "insight",   label: "인사이트",   short: "인사이트", href: "/insight",   Icon: Newspaper },
      { key: "feed",      label: "피드",       short: "피드",     href: "/feed",      Icon: Rss },
      { key: "community", label: "커뮤니티",   short: "커뮤니티", href: "/community", Icon: MessagesSquare },
      { key: "market",    label: "마켓",       short: "마켓",     href: "/market",    Icon: ShoppingBag },
      { key: "shop",      label: "상점",       short: "상점",     href: "/shop",      Icon: Store },
    ],
  },
  {
    label: "내 정보",
    items: [
      { key: "profile",       label: "마이페이지", short: "마이",   href: "/profile",       Icon: User },
      { key: "notifications", label: "알림",       short: "알림",   href: "/notifications", Icon: Bell },
    ],
  },
];

const BY_KEY: Record<string, Cat> = Object.fromEntries(
  CATALOG.flatMap((g) => g.items).map((c) => [c.key, c])
);

const LS_ITEMS = "dori_quickbar";
const LS_COLLAPSED = "dori_quickbar_collapsed";

export default function QuickBar() {
  const pathname = usePathname();
  const { status } = useAuth();

  const [items, setItems] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null); // 시각효과(투명도)용
  const [overKey, setOverKey] = useState<string | null>(null);
  const dragKeyRef = useRef<string | null>(null);              // 로직용(동기 보장)
  const reconciledRef = useRef(false);

  // 1) 마운트: localStorage 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_ITEMS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter((k) => typeof k === "string" && BY_KEY[k]));
      }
      setCollapsed(localStorage.getItem(LS_COLLAPSED) === "1");
    } catch { /* noop */ }
    setMounted(true);
  }, []);

  // 2) 로그인되면 원격과 1회 reconcile (원격 우선, 없으면 로컬 업로드)
  useEffect(() => {
    if (status === "unauthenticated") { reconciledRef.current = false; return; }
    if (status !== "authenticated" || reconciledRef.current) return;
    reconciledRef.current = true;
    (async () => {
      const remote = await loadQuickBarRemote();
      if (remote !== null) {
        const cleaned = remote.filter((k) => BY_KEY[k]);
        setItems(cleaned);
        try { localStorage.setItem(LS_ITEMS, JSON.stringify(cleaned)); } catch { /* noop */ }
      } else {
        let local: string[] = [];
        try { local = JSON.parse(localStorage.getItem(LS_ITEMS) || "[]"); } catch { /* noop */ }
        local = Array.isArray(local) ? local.filter((k) => BY_KEY[k]) : [];
        if (local.length) await saveQuickBarRemote(local);
      }
    })();
  }, [status]);

  // 변경 확정 → 상태 + 로컬 + (로그인 시) 원격 저장
  const commit = useCallback((next: string[]) => {
    setItems(next);
    try { localStorage.setItem(LS_ITEMS, JSON.stringify(next)); } catch { /* noop */ }
    if (status === "authenticated") void saveQuickBarRemote(next);
  }, [status]);

  const add = useCallback((key: string) => {
    if (!items.includes(key)) commit([...items, key]);
  }, [items, commit]);

  const remove = useCallback((key: string) => {
    commit(items.filter((k) => k !== key));
  }, [items, commit]);

  // 드래그한 from 을 to 자리(앞)로 이동
  const reorder = useCallback((from: string, to: string) => {
    if (from === to) return;
    const next = items.filter((k) => k !== from);
    const ti = next.indexOf(to);
    if (ti < 0) return;
    next.splice(ti, 0, from);
    commit(next);
  }, [items, commit]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      const nv = !v;
      try { localStorage.setItem(LS_COLLAPSED, nv ? "1" : "0"); } catch { /* noop */ }
      if (nv) setPickerOpen(false);
      return nv;
    });
  }, []);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  // 하이드레이션 불일치 방지 — 마운트 전엔 렌더 안 함(고정 크롬이라 SEO 영향 없음)
  if (!mounted) return null;

  const railItems = items.map((k) => BY_KEY[k]).filter(Boolean);

  // 접힘 상태: 우측 끝 얇은 손잡이만
  if (collapsed) {
    return (
      <button
        onClick={toggleCollapsed}
        aria-label="바로가기 열기"
        className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-[45] items-center justify-center
                   w-6 h-14 rounded-l-xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur
                   border border-r-0 border-neutral-200 dark:border-zinc-800 shadow-md
                   text-neutral-500 dark:text-neutral-400 hover:text-[#F9954E] transition-colors"
      >
        <ChevronsLeft className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <>
      {/* 레일 */}
      <aside
        className="hidden lg:flex fixed right-0 top-16 bottom-0 z-[45] w-[56px] flex-col
                   bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-l border-neutral-200 dark:border-zinc-800"
      >
        {/* 상단: 접기 */}
        <div className="flex flex-col items-center pt-1.5 pb-1 border-b border-neutral-100 dark:border-zinc-900">
          <button
            onClick={toggleCollapsed}
            aria-label="바로가기 접기"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400
                       hover:text-[#F9954E] hover:bg-neutral-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* 아이템 목록 (스크롤·드래그 정렬) */}
        <div className="flex-1 overflow-y-auto py-2 px-1 flex flex-col gap-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {railItems.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-1 mt-5 px-0.5">
              <Pin className="w-4 h-4 text-neutral-300 dark:text-zinc-700" />
              <span className="text-[9px] leading-tight text-neutral-400 dark:text-neutral-600">
                +로<br />추가
              </span>
            </div>
          ) : (
            railItems.map((c) => {
              const active = isActive(c.href);
              const isDragging = dragKey === c.key;
              const isOver = overKey === c.key && dragKey !== c.key;
              return (
                <div
                  key={c.key}
                  draggable
                  onDragStart={(e) => { dragKeyRef.current = c.key; setDragKey(c.key); e.dataTransfer.effectAllowed = "move"; }}
                  onDragEnter={(e) => { e.preventDefault(); setOverKey(c.key); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (dragKeyRef.current) reorder(dragKeyRef.current, c.key); dragKeyRef.current = null; setDragKey(null); setOverKey(null); }}
                  onDragEnd={() => { dragKeyRef.current = null; setDragKey(null); setOverKey(null); }}
                  className={`relative group rounded-xl transition-all
                    ${isDragging ? "opacity-40" : ""}
                    ${isOver ? "ring-2 ring-[#F9954E] ring-offset-1 ring-offset-white dark:ring-offset-zinc-950" : ""}`}
                >
                  <Link
                    href={c.href}
                    draggable={false}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors
                      ${active
                        ? "bg-[#FFF1E3] dark:bg-[#F9954E]/15 text-[#E8832E] dark:text-[#F9954E]"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-zinc-900 hover:text-neutral-900 dark:hover:text-white"}`}
                  >
                    <c.Icon className="w-[17px] h-[17px]" />
                    <span className="text-[8.5px] font-semibold leading-none max-w-[48px] truncate">{c.short}</span>
                  </Link>

                  {/* 드래그 핸들 표시(호버) */}
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-neutral-300 dark:text-zinc-700
                                   opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <GripVertical className="w-2.5 h-2.5" />
                  </span>

                  {/* 제거(×) — 호버 시 */}
                  <button
                    onClick={(e) => { e.preventDefault(); remove(c.key); }}
                    aria-label={`${c.label} 제거`}
                    className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full bg-neutral-300 dark:bg-zinc-700
                               text-white flex items-center justify-center opacity-0 group-hover:opacity-100
                               hover:bg-red-500 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* 하단: + 추가 */}
        <div className="p-1.5 border-t border-neutral-100 dark:border-zinc-900">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="바로가기 추가"
            className={`w-full h-9 rounded-xl flex items-center justify-center transition-colors
              ${pickerOpen
                ? "bg-[#F9954E] text-white"
                : "bg-neutral-100 dark:bg-zinc-900 text-neutral-500 dark:text-neutral-400 hover:bg-[#FFF1E3] dark:hover:bg-[#F9954E]/15 hover:text-[#F9954E]"}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* 카테고리 선택 팝오버 */}
      {pickerOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setPickerOpen(false)} />
          <div
            className="hidden lg:flex fixed right-[68px] top-20 z-[61] w-[256px] max-h-[72vh] flex-col
                       bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800
                       rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-zinc-800">
              <span className="text-[13px] font-extrabold text-neutral-900 dark:text-white">바로가기 추가</span>
              <button onClick={() => setPickerOpen(false)} aria-label="닫기" className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {CATALOG.map((group) => (
                <div key={group.label} className="mb-2 last:mb-0">
                  <p className="px-2 py-1.5 text-[10px] font-bold tracking-widest uppercase text-neutral-400">{group.label}</p>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((c) => {
                      const added = items.includes(c.key);
                      return (
                        <button
                          key={c.key}
                          data-cat={c.key}
                          aria-label={`${added ? "제거" : "추가"} ${c.label}`}
                          onClick={() => (added ? remove(c.key) : add(c.key))}
                          className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-left
                                     hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                            <c.Icon className="w-4 h-4" />
                          </span>
                          <span className="flex-1 text-[13.5px] font-semibold text-neutral-800 dark:text-neutral-100">{c.label}</span>
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                              ${added ? "bg-[#F9954E] text-white" : "bg-neutral-100 dark:bg-zinc-800 text-neutral-400"}`}
                          >
                            {added ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950">
              {status === "authenticated" ? (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  드래그해서 순서를 바꿀 수 있어요. 변경은 계정에 자동 저장됩니다.
                </p>
              ) : (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  <Link href="/login" className="font-bold text-[#E8832E] dark:text-[#F9954E] hover:underline">로그인</Link>
                  하면 바로가기가 계정에 자동 저장돼 다른 기기에서도 그대로 보여요.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
