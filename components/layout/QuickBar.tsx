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
  PawPrint, Sparkles, PencilRuler,
  Gamepad2, Wrench, BarChart3, Newspaper, Rss, MessagesSquare,
  ShoppingBag, Store, User, Bell,
  Plus, X, ChevronsRight, ChevronsLeft, GripVertical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { loadQuickBarRemote, saveQuickBarRemote } from "@/lib/quickBar";

// enOk=true 인 항목만 영어 레일에 노출한다(영어판 없는 페이지로 새지 않게 — 헤더 네비와 같은 원칙).
type Cat = {
  key: string; label: string; short: string; href: string;
  labelEn: string; shortEn: string; enOk: boolean;
  Icon: React.ComponentType<{ className?: string }>;
};
type Group = { label: string; labelEn: string; items: Cat[] };

// 추가 가능한 전체 카탈로그(그룹별)
const CATALOG: Group[] = [
  {
    label: "프로젝트", labelEn: "Projects",
    items: [
      { key: "animal",   label: "몽글로 : 동물도감",   short: "몽글로",   labelEn: "Monglo",     shortEn: "Monglo",  enOk: true,  href: "/animal",    Icon: PawPrint },
    ],
  },
  {
    label: "둘러보기", labelEn: "Explore",
    items: [
      { key: "minigame",  label: "미니게임",   short: "게임",     labelEn: "Mini games", shortEn: "Games",   enOk: true,  href: "/minigame",  Icon: Gamepad2 },
      { key: "aitools",   label: "AI 도구",    short: "AI도구",   labelEn: "AI tools",   shortEn: "Tools",   enOk: true,  href: "/ai-tools",  Icon: Wrench },
      { key: "aimodels",  label: "AI 모델",    short: "AI모델",   labelEn: "AI models",  shortEn: "Models",  enOk: true,  href: "/ai-models", Icon: BarChart3 },
      { key: "insight",   label: "인사이트",   short: "인사이트", labelEn: "Insight",    shortEn: "Insight", enOk: true,  href: "/insight",   Icon: Newspaper },
      { key: "feed",      label: "피드",       short: "피드",     labelEn: "Feed",       shortEn: "Feed",    enOk: true,  href: "/feed",      Icon: Rss },
      { key: "community", label: "커뮤니티",   short: "커뮤니티", labelEn: "Community",  shortEn: "Forum",   enOk: false, href: "/community", Icon: MessagesSquare },
      { key: "market",    label: "마켓",       short: "마켓",     labelEn: "Market",     shortEn: "Market",  enOk: false, href: "/market",    Icon: ShoppingBag },
      { key: "shop",      label: "상점",       short: "상점",     labelEn: "Shop",       shortEn: "Shop",    enOk: true,  href: "/shop",      Icon: Store },
    ],
  },
  {
    label: "내 정보", labelEn: "My info",
    items: [
      { key: "profile",       label: "마이페이지", short: "마이",   labelEn: "My page",       shortEn: "Me",     enOk: true,  href: "/profile",       Icon: User },
      { key: "notifications", label: "알림",       short: "알림",   labelEn: "Notifications", shortEn: "Alerts", enOk: false, href: "/notifications", Icon: Bell },
    ],
  },
];

const BY_KEY: Record<string, Cat> = Object.fromEntries(
  CATALOG.flatMap((g) => g.items).map((c) => [c.key, c])
);

// 레일·팝오버의 고정 문구
const QT = {
  ko: {
    open: "바로가기 열기", collapse: "바로가기 접기", add: "바로가기 추가",
    remove: (n: string) => `${n} 제거`, close: "닫기",
    addRemove: (added: boolean, n: string) => `${added ? "제거" : "추가"} ${n}`,
    dragHint: "드래그해서 순서를 바꿀 수 있어요. 변경은 계정에 자동 저장됩니다.",
    login: "로그인",
    loginHintTail: "하면 바로가기가 계정에 자동 저장돼 다른 기기에서도 그대로 보여요.",
  },
  en: {
    open: "Open shortcuts", collapse: "Collapse shortcuts", add: "Add a shortcut",
    remove: (n: string) => `Remove ${n}`, close: "Close",
    addRemove: (added: boolean, n: string) => `${added ? "Remove" : "Add"} ${n}`,
    dragHint: "Drag to reorder. Changes save to your account automatically.",
    login: "Log in",
    loginHintTail: " to save your shortcuts to your account and see them on any device.",
  },
} as const;

const LS_ITEMS = "dori_quickbar";
const LS_COLLAPSED = "dori_quickbar_collapsed";

export default function QuickBar() {
  const pathname = usePathname();
  const isEn = (pathname || "").startsWith("/en");
  const qt = QT[isEn ? "en" : "ko"];
  // 영어 레일은 영어판이 있는 항목만 노출하고, 링크에 /en 접두어를 붙인다.
  const labelOf = (c: Cat) => (isEn ? c.labelEn : c.label);
  const shortOf = (c: Cat) => (isEn ? c.shortEn : c.short);
  const hrefOf = (c: Cat) => (isEn ? `/en${c.href}` : c.href);
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

  // 영어 레일: 영어판 없는 항목은 감춘다(저장된 설정은 건드리지 않고 표시만 제외).
  const railItems = items.map((k) => BY_KEY[k]).filter(Boolean).filter((c) => !isEn || c.enOk);

  // 접힘 상태: 우측 끝 얇은 손잡이만
  if (collapsed) {
    return (
      <button
        onClick={toggleCollapsed}
        aria-label={qt.open}
        className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-[45] items-center justify-center
                   w-6 h-14 rounded-l-xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur
                   border border-r-0 border-stone-200 dark:border-zinc-800 shadow-md
                   text-stone-500 dark:text-stone-400 hover:text-[#F9954E] transition-colors"
      >
        <ChevronsLeft className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <>
      {/* 레일 */}
      <aside
        className="hidden lg:flex fixed right-0 top-16 bottom-0 z-[45] w-[48px] flex-col
                   bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-l border-stone-200 dark:border-zinc-800"
      >
        {/* 상단: 접기 */}
        <div className="flex flex-col items-center pt-1.5 pb-1 border-b border-stone-100 dark:border-zinc-900">
          <button
            onClick={toggleCollapsed}
            aria-label={qt.collapse}
            className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400
                       hover:text-[#F9954E] hover:bg-stone-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 아이템 목록(드래그 정렬) + 추가 버튼은 항목들 '바로 아래' */}
        <div className="flex-1 overflow-y-auto py-2 px-0.5 flex flex-col gap-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {railItems.map((c) => {
            const active = isActive(hrefOf(c));
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
                  href={hrefOf(c)}
                  draggable={false}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors
                    ${active
                      ? "bg-[#FFF1E3] dark:bg-[#F9954E]/15 text-[#E8832E] dark:text-[#F9954E]"
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-900 hover:text-stone-900 dark:hover:text-white"}`}
                >
                  <c.Icon className="w-4 h-4" />
                  <span className="text-[8px] font-semibold leading-none max-w-[42px] truncate">{shortOf(c)}</span>
                </Link>

                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical className="w-2.5 h-2.5" />
                </span>

                <button
                  onClick={(e) => { e.preventDefault(); remove(c.key); }}
                  aria-label={qt.remove(labelOf(c))}
                  className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full bg-stone-300 dark:bg-zinc-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-opacity"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}

          {/* + 추가 — 추가된 항목 바로 아래 (아이콘만) */}
          <button
            onClick={() => setPickerOpen((v) => !v)}
            aria-label={qt.add}
            className={`flex items-center justify-center py-2.5 rounded-xl transition-colors
              ${pickerOpen
                ? "bg-[#FFF1E3] dark:bg-[#F9954E]/15 text-[#F9954E]"
                : "text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-900 hover:text-[#F9954E]"}`}
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
            className="hidden lg:flex fixed right-[60px] top-20 z-[61] w-[256px] max-h-[72vh] flex-col
                       bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800
                       rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-zinc-800">
              <span className="text-[13px] font-extrabold text-stone-900 dark:text-white">{qt.add}</span>
              <button onClick={() => setPickerOpen(false)} aria-label={qt.close} className="text-stone-400 hover:text-stone-700 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {CATALOG.map((group) => (
                <div key={group.label} className="mb-2 last:mb-0">
                  <p className="px-2 py-1.5 text-[10px] font-bold tracking-widest uppercase text-stone-400">{isEn ? group.labelEn : group.label}</p>
                  <div className="flex flex-col gap-0.5">
                    {group.items.filter((c) => !isEn || c.enOk).map((c) => {
                      const added = items.includes(c.key);
                      return (
                        <button
                          key={c.key}
                          data-cat={c.key}
                          aria-label={qt.addRemove(added, labelOf(c))}
                          onClick={() => (added ? remove(c.key) : add(c.key))}
                          className="flex items-center gap-3 px-2.5 py-2 rounded-xl text-left
                                     hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <span className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-stone-300 flex-shrink-0">
                            <c.Icon className="w-4 h-4" />
                          </span>
                          <span className="flex-1 text-[13.5px] font-semibold text-stone-800 dark:text-stone-100">{labelOf(c)}</span>
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                              ${added ? "bg-[#F9954E] text-white" : "bg-stone-100 dark:bg-zinc-800 text-stone-400"}`}
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

            <div className="px-4 py-2.5 border-t border-stone-100 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950">
              {status === "authenticated" ? (
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                  {qt.dragHint}
                </p>
              ) : (
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                  <Link href="/login" className="font-bold text-[#E8832E] dark:text-[#F9954E] hover:underline">{qt.login}</Link>
                  {qt.loginHintTail}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
