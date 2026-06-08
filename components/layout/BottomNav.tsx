"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Lightbulb, Wrench, Gamepad2, MoreHorizontal, X, ChevronRight, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

const ADMIN_EMAIL = "lhaa0130@gmail.com";

// ── 하단 탭 5개 ────────────────────────────────────────────────
const TABS = [
  { id: "home",    label: "홈",      icon: Home,       href: "/" },
  { id: "insight", label: "인사이트", icon: Lightbulb,  href: "/insight" },
  { id: "aitools", label: "AI도구",  icon: Wrench,     href: "/ai-tools" },
  { id: "game",    label: "게임",    icon: Gamepad2,   href: "/minigame" },
  { id: "more",    label: "더보기",  icon: MoreHorizontal, href: "#" },
];

// ── 더보기 드로어에 들어갈 전체 메뉴 ──────────────────────────
const MORE_ITEMS = [
  { name: "공지사항",   href: "/notice",      emoji: "📢" },
  { name: "커뮤니티",   href: "/community",   emoji: "💬" },
  { name: "마켓",       href: "/market",      emoji: "🛒" },
  { name: "건의사항",   href: "/suggestion",  emoji: "📩" },
  { name: "FAQ",        href: "/faq",         emoji: "❓" },
];

const PROJECTS = [
  { name: "일로 (Illo)",  emoji: "🟧", image: "/illo-logo.png", href: "/illo/app",  desc: "혼자서도, 일이 되는 곳" },
  { name: "동물도감",      emoji: "🐾", image: "",               href: "/animal",    desc: "포켓몬처럼, 진짜 동물을" },
  { name: "가족기록",      emoji: "👨‍👩‍👧‍👦", image: "",              href: "/family",    desc: "가족의 모든 것" },
];

export default function BottomNav() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { session, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // 페이지 이동 시 드로어 닫기
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // 드로어 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // 현재 활성 탭 결정
  const getActive = (tab: typeof TABS[0]) => {
    if (tab.id === "more")    return drawerOpen;
    if (tab.href === "/")     return pathname === "/";
    return pathname.startsWith(tab.href);
  };

  const handleMore = () => setDrawerOpen(p => !p);

  const handleSignOut = () => {
    logout();
    router.push("/");
    setDrawerOpen(false);
  };

  return (
    <>
      {/* ── 하단 탭바 ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-neutral-200 dark:border-zinc-800 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-[58px] px-1">
          {TABS.map((tab) => {
            const active = getActive(tab);
            const Icon   = tab.icon;
            return tab.id === "more" ? (
              <button
                key="more"
                onClick={handleMore}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-colors",
                  active
                    ? "text-[#F9954E]"
                    : "text-neutral-400 dark:text-neutral-500"
                )}
              >
                {active
                  ? <X className="w-5 h-5" />
                  : <Icon className="w-5 h-5" />
                }
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            ) : (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-colors",
                  active
                    ? "text-[#F9954E]"
                    : "text-neutral-400 dark:text-neutral-500"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "scale-110 transition-transform")} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── 더보기 드로어 배경 ── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── 더보기 드로어 (슬라이드 업) ── */}
      <div
        className={cn(
          "lg:hidden fixed left-0 right-0 bottom-[58px] z-40",
          "bg-white dark:bg-black border-t border-neutral-200 dark:border-zinc-800",
          "overflow-y-auto transition-all duration-300 ease-in-out",
          drawerOpen
            ? "opacity-100 translate-y-0 pointer-events-auto max-h-[70dvh]"
            : "opacity-0 translate-y-4 pointer-events-none max-h-0"
        )}
      >
        <div className="px-4 py-4 pb-6 flex flex-col gap-1">

          {/* 로그인 / 마이페이지 */}
          <div className="mb-3 pb-3 border-b border-neutral-100 dark:border-zinc-800">
            {session?.user ? (
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/my"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white"
                >
                  <User className="w-4 h-4 text-[#F9954E]" />
                  <span>마이페이지</span>
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-sm font-bold text-orange-600 dark:text-orange-400"
                  >
                    <span>🛡️</span>
                    <span>관리자 패널</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-sm font-bold text-red-500 text-left w-full"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { router.push("/login"); setDrawerOpen(false); }}
                className="w-full py-3.5 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-sm font-black text-white transition-all active:scale-95"
              >
                로그인 / 회원가입
              </button>
            )}
          </div>

          {/* 서브 메뉴 */}
          {MORE_ITEMS.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{item.emoji}</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">
                  {item.name}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-zinc-600" />
            </Link>
          ))}

          {/* 테마 토글 */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl">
            <span className="text-sm font-semibold text-neutral-900 dark:text-white">다크 모드</span>
            <ThemeToggle />
          </div>

          {/* 프로젝트 */}
          <div className="mt-1 pt-3 border-t border-neutral-100 dark:border-zinc-800">
            <p className="px-4 pb-2 text-[10px] font-bold tracking-widest uppercase text-neutral-400">
              Projects
            </p>
            {PROJECTS.map((p) => (
              <Link
                key={p.name}
                href={p.href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : p.emoji}
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">{p.name}</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{p.desc}</div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
