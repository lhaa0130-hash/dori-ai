"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const ADMIN_EMAIL = "lhaa0130@gmail.com";

const TABS = [
  {
    id: "home", label: "홈", href: "/",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? "#F9954E" : "none"} stroke={a ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "insight", label: "인사이트", href: "/insight",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    id: "aitools", label: "AI도구", href: "/ai-tools",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
      </svg>
    ),
  },
  {
    id: "game", label: "게임", href: "/minigame",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="6"/>
        <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
        <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
      </svg>
    ),
  },
  {
    id: "more", label: "더보기", href: "#",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "#F9954E" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {a
          ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
          : <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>}
      </svg>
    ),
  },
];

// 건의사항은 더보기에서 숨김 (푸터에만 노출), 마켓은 노출
const MORE_ITEMS = [
  { name: "AI 모델 비교", href: "/ai-models", emoji: "📊" },
  { name: "AI 소식",   href: "/ai-news",    emoji: "📰" },
  { name: "공지사항",  href: "/notice",     emoji: "📢" },
  { name: "커뮤니티",  href: "/community",  emoji: "💬" },
  { name: "마켓",      href: "/market",     emoji: "🛒" },
  { name: "프로젝트",  href: "/projects",   emoji: "🚀" },
  { name: "FAQ",       href: "/faq",        emoji: "❓" },
];

const PROJECTS = [
  { name: "몽글로 : 동물도감",  emoji: "🐾", image: "",               href: "/animal",   desc: "다양한 동물을 몽글로에서" },
  { name: "AI비서", emoji: "🟧", image: "/illo-logo.png", href: "/illo/app", desc: "AI API, 구독 말고 필요한 만큼" },
  { name: "건축일로",    emoji: "📐", image: "",               href: "/flat-form", desc: "건축설계 보조 프로그램" },
  { name: "집안일로",    emoji: "👨‍👩‍👧‍👦", image: "",              href: "/family",   desc: "가족의 모든 것" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (tab: typeof TABS[0]) => {
    if (tab.id === "more") return open;
    if (tab.href === "/")  return pathname === "/";
    return pathname.startsWith(tab.href);
  };

  return (
    <>
      {/* ── 탭바 ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-neutral-100 dark:border-zinc-900">
        <div className="flex h-[58px]">
          {TABS.map((tab) => {
            const active = isActive(tab);
            return tab.id === "more" ? (
              <button
                key="more"
                onClick={() => setOpen(p => !p)}
                className="relative flex-1 flex flex-col items-center justify-center gap-[3px]"
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-[#F9954E]" />}
                {tab.icon(active)}
                <span className={cn("text-[10px] font-semibold", active ? "text-[#F9954E]" : "text-neutral-400 dark:text-neutral-600")}>
                  {tab.label}
                </span>
              </button>
            ) : (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex-1 flex flex-col items-center justify-center gap-[3px]"
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-[#F9954E]" />}
                {tab.icon(active)}
                <span className={cn("text-[10px] font-semibold", active ? "text-[#F9954E]" : "text-neutral-400 dark:text-neutral-600")}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── 딤 ── */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />}

      {/* ── 드로어 ── */}
      <div className={cn(
        "lg:hidden fixed left-0 right-0 bottom-[58px] z-40 bg-white dark:bg-black rounded-t-3xl border-t border-neutral-100 dark:border-zinc-900 overflow-y-auto transition-all duration-300",
        open ? "max-h-[75dvh] opacity-100 translate-y-0 pointer-events-auto" : "max-h-0 opacity-0 translate-y-3 pointer-events-none"
      )}>
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-neutral-200 dark:bg-zinc-800" />
        </div>

        <div className="px-5 pb-10 flex flex-col">

          {/* 로그인 */}
          <div className="py-4 border-b border-neutral-100 dark:border-zinc-900">
            {session?.user ? (
              <div className="flex flex-col gap-2">
                <Link href="/my" className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[15px] font-black text-neutral-900 dark:text-white">마이페이지</p>
                    <p className="text-[12px] text-neutral-400 mt-0.5">{session.user.email}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="py-3 text-[14px] font-bold text-[#F9954E]">🛡️ 관리자 패널</Link>
                )}
                <button onClick={() => { logout(); router.push("/"); setOpen(false); }} className="py-3 text-[14px] font-bold text-red-400 text-left">
                  로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => { router.push("/login"); setOpen(false); }}
                className="w-full py-4 rounded-2xl bg-[#F9954E] text-[14px] font-black text-white active:opacity-80 transition-opacity"
              >
                로그인 / 회원가입
              </button>
            )}
          </div>

          {/* 메뉴 */}
          <div className="py-2">
            {MORE_ITEMS.map((item) => (
              <Link key={item.name} href={item.href} className="flex items-center justify-between py-4 border-b border-neutral-50 dark:border-zinc-900 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-[14px] font-semibold text-neutral-800 dark:text-white">{item.name}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>

          {/* 화면 모드 */}
          <div className="flex items-center justify-between py-4 border-t border-neutral-100 dark:border-zinc-900">
            <span className="text-[14px] font-semibold text-neutral-800 dark:text-white">화면 모드</span>
            <ThemeToggle />
          </div>

          {/* 프로젝트 */}
          <div className="border-t border-neutral-100 dark:border-zinc-900 pt-4">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Projects</p>
            {PROJECTS.map((p) => (
              <Link key={p.name} href={p.href} className="flex items-center gap-3 py-3 border-b border-neutral-50 dark:border-zinc-900 last:border-0">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                  {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" /> : p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-neutral-900 dark:text-white">{p.name}</p>
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
