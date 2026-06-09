"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const ADMIN_EMAIL = "lhaa0130@gmail.com";

// ── 탭 5개 ────────────────────────────────────────────
const TABS = [
  {
    id: "home", label: "홈", href: "/",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#F9954E" : "none"} stroke={active ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "insight", label: "인사이트", href: "/insight",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    id: "aitools", label: "AI도구", href: "/ai-tools",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
      </svg>
    ),
  },
  {
    id: "game", label: "게임", href: "/minigame",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
        <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
        <rect x="2" y="6" width="20" height="12" rx="6"/>
      </svg>
    ),
  },
  {
    id: "more", label: "더보기", href: "#",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {active
          ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
          : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>
        }
      </svg>
    ),
  },
];

const MORE_ITEMS = [
  { name: "공지사항",  href: "/notice",     emoji: "📢" },
  { name: "커뮤니티",  href: "/community",  emoji: "💬" },
  { name: "마켓",      href: "/market",     emoji: "🛒" },
  { name: "건의사항",  href: "/suggestion", emoji: "📩" },
  { name: "FAQ",       href: "/faq",        emoji: "❓" },
];

const PROJECTS = [
  { name: "일로 (Illo)", emoji: "🟧", image: "/illo-logo.png", href: "/illo/app", desc: "혼자서도, 일이 되는 곳" },
  { name: "동물도감",    emoji: "🐾", image: "",               href: "/animal",   desc: "포켓몬처럼, 진짜 동물을" },
  { name: "가족기록",    emoji: "👨‍👩‍👧‍👦", image: "",              href: "/family",   desc: "가족의 모든 것" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { session, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => { setDrawerOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const isActive = (tab: typeof TABS[0]) => {
    if (tab.id === "more")  return drawerOpen;
    if (tab.href === "/")   return pathname === "/";
    return pathname.startsWith(tab.href);
  };

  const handleSignOut = () => { logout(); router.push("/"); setDrawerOpen(false); };

  return (
    <>
      {/* ── 하단 탭바 ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-neutral-100 dark:border-zinc-800">
        <div className="flex h-[58px]">
          {TABS.map((tab) => {
            const active = isActive(tab);
            return tab.id === "more" ? (
              <button
                key="more"
                onClick={() => setDrawerOpen(p => !p)}
                className="relative flex-1 flex flex-col items-center justify-center gap-[3px]"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-[#F9954E]" />
                )}
                {tab.icon(active)}
                <span className={cn("text-[10px] font-semibold", active ? "text-[#F9954E]" : "text-neutral-400 dark:text-neutral-500")}>
                  {tab.label}
                </span>
              </button>
            ) : (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex-1 flex flex-col items-center justify-center gap-[3px]"
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-[#F9954E]" />
                )}
                {tab.icon(active)}
                <span className={cn("text-[10px] font-semibold", active ? "text-[#F9954E]" : "text-neutral-400 dark:text-neutral-500")}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── 배경 딤 ── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── 더보기 드로어 ── */}
      <div
        className={cn(
          "lg:hidden fixed left-0 right-0 bottom-[58px] z-40 rounded-t-3xl",
          "bg-white dark:bg-zinc-900",
          "overflow-y-auto transition-all duration-300 ease-out",
          drawerOpen
            ? "opacity-100 translate-y-0 pointer-events-auto max-h-[75dvh]"
            : "opacity-0 translate-y-6 pointer-events-none max-h-0"
        )}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-zinc-700" />
        </div>

        <div className="px-5 pb-8 flex flex-col gap-0">

          {/* 로그인 / 사용자 섹션 */}
          <div className="py-4 border-b border-neutral-100 dark:border-zinc-800">
            {session?.user ? (
              <div className="flex flex-col gap-2">
                <Link href="/my" className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-zinc-800 active:scale-[0.98] transition-transform">
                  <div className="w-11 h-11 rounded-full bg-[#F9954E]/15 flex items-center justify-center text-xl">👤</div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">마이페이지</p>
                    <p className="text-xs text-neutral-500">{session.user.email}</p>
                  </div>
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-sm font-bold text-orange-600 dark:text-orange-400">
                    <span>🛡️</span><span>관리자 패널</span>
                  </Link>
                )}
                <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-sm font-bold text-red-500 text-left w-full">
                  <span>🚪</span><span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { router.push("/login"); setDrawerOpen(false); }}
                className="w-full py-4 rounded-2xl bg-[#F9954E] text-sm font-black text-white active:scale-[0.98] transition-transform"
              >
                로그인 / 회원가입 →
              </button>
            )}
          </div>

          {/* 메뉴 섹션 */}
          <div className="py-2">
            <p className="px-1 py-2 text-[11px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest">메뉴</p>
            {MORE_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-between px-1 py-3.5 border-b border-neutral-50 dark:border-zinc-800 last:border-0 active:bg-neutral-50 dark:active:bg-zinc-800 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-lg w-7 text-center">{item.emoji}</span>
                  <span className="text-sm font-semibold text-neutral-800 dark:text-white">{item.name}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>

          {/* 다크모드 */}
          <div className="flex items-center justify-between px-1 py-3.5 border-t border-neutral-100 dark:border-zinc-800">
            <div className="flex items-center gap-3.5">
              <span className="text-lg w-7 text-center">🎨</span>
              <span className="text-sm font-semibold text-neutral-800 dark:text-white">화면 모드</span>
            </div>
            <ThemeToggle />
          </div>

          {/* 프로젝트 */}
          <div className="pt-2 border-t border-neutral-100 dark:border-zinc-800">
            <p className="px-1 py-2 text-[11px] font-bold text-neutral-400 dark:text-zinc-500 uppercase tracking-widest">Projects</p>
            {PROJECTS.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="flex items-center gap-3.5 px-1 py-3 border-b border-neutral-50 dark:border-zinc-800 last:border-0 active:bg-neutral-50 dark:active:bg-zinc-800 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{p.desc}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
