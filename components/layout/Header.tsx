"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Search, ChevronDown, ChevronRight, User, LogOut, Menu, X, Home, MessageCircle, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

const ADMIN_EMAIL = "lhaa0130@gmail.com";

export default function Header() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // 페이지 이동 시 드로어 닫기
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // 드로어 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSignIn = () => { router.push("/login"); setMobileOpen(false); };
  const handleSignOut = () => { logout(); router.push("/"); setMobileOpen(false); };

  // 건의사항은 메인 네비에서 숨김(푸터에만 노출), 마켓은 노출
  const navItems = [
    { name: "공지사항", href: "/notice", emoji: "📢" },
    { name: "미니게임", href: "/minigame", emoji: "🎮" },
    { name: "AI 도구", href: "/ai-tools", emoji: "🔧" },
    { name: "인사이트", href: "/insight", emoji: "🧠" },
    { name: "커뮤니티", href: "/community", emoji: "💬" },
    { name: "마켓", href: "/market", emoji: "🛒" },
    { name: "FAQ", href: "/faq", emoji: "❓" },
  ];

  const projects = [
    {
      name: "워키 (Worki)", emoji: "🟧", image: "/illo-logo.png",
      desc: "혼자서도, 일이 되는 곳", href: "/illo/app",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      name: "동물도감", emoji: "🐾", image: "",
      desc: "포켓몬처럼, 진짜 동물을 배워요", href: "/animal",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      name: "가족기록", emoji: "👨‍👩‍👧‍👦", image: "",
      desc: "가족의 모든 것을 하나의 앱으로", href: "/family",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <>
      {/* ── 헤더 ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b border-neutral-200 dark:border-zinc-800 font-sans">
        <div className="w-full h-16 flex items-center px-4 lg:justify-center lg:gap-8">

          {/* 로고 */}
          <Link href="/" aria-label="DORI-AI Home" className="flex-shrink-0 hover:opacity-70 transition-opacity">
            <span className="font-bold text-lg whitespace-nowrap bg-[linear-gradient(to_right,#FBAA60,#F9954E_30%,#F9954E_70%,#E8832E)] bg-clip-text text-transparent animate-gradient-x">
              DORI-AI
            </span>
          </Link>

          {/* ── 데스크탑 네비게이션 (lg+) ── */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/notice" className="flex-shrink-0 text-sm font-medium text-foreground hover:text-[#E8832E] dark:hover:text-[#F9954E] transition-colors whitespace-nowrap">
              공지사항
            </Link>

            {/* 프로젝트 — 상위는 활성(호버 드롭다운), 하위 항목만 비활성(준비 중) */}
            <div className="relative group flex-shrink-0">
              <button type="button" aria-haspopup="true" className="flex items-center gap-0.5 text-sm font-medium text-foreground hover:text-[#E8832E] dark:hover:text-[#F9954E] transition-colors whitespace-nowrap cursor-default">
                프로젝트
                <ChevronDown className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-300 ml-0.5" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50 pt-2">
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-400">Projects</span>
                    <span className="text-[10px] font-semibold text-neutral-300 dark:text-neutral-600">준비 중</span>
                  </div>
                  {projects.map((p) => (
                    <div key={p.name} aria-disabled="true" title="준비 중입니다" className="flex items-center gap-3 px-4 py-3 opacity-40 cursor-not-allowed select-none">
                      <div className={`w-9 h-9 rounded-xl ${p.bg} flex items-center justify-center flex-shrink-0 text-lg overflow-hidden`}>
                        {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" /> : p.emoji}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-neutral-900 dark:text-white">{p.name}</div>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-zinc-800">
                    <span className="text-[11px] font-bold text-neutral-300 dark:text-neutral-600 cursor-not-allowed select-none">
                      전체 프로젝트 보기 →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {navItems.filter(i => i.name !== "공지사항").map((item) => (
              <Link key={item.name} href={item.href} className="flex-shrink-0 text-sm font-medium text-foreground hover:text-[#E8832E] dark:hover:text-[#F9954E] transition-colors whitespace-nowrap">
                {item.name}
              </Link>
            ))}
          </nav>

          {/* ── 우측 컨트롤 ── */}
          <div className="ml-auto lg:ml-0 flex items-center gap-1">

            {/* 검색 (데스크탑만) */}
            <button aria-label="Search" className="hidden lg:flex flex-shrink-0 w-10 h-10 items-center justify-center hover:opacity-70 transition-opacity text-foreground">
              <Search className="w-5 h-5" strokeWidth={2.5} />
            </button>

            {/* 다크모드 토글 (항상 표시) */}
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <ThemeToggle />
            </div>

            {/* 모바일 로그인 버튼 / 마이페이지 */}
            <div className="lg:hidden flex items-center ml-1">
              {session?.user ? (
                <Link
                  href="/my"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-black text-secondary-foreground transition-all active:scale-95 whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>MY</span>
                </Link>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="px-5 py-2 rounded-full bg-[#F9954E] hover:bg-[#E8832E] text-xs font-black text-white transition-all shadow-md active:scale-95 whitespace-nowrap"
                >
                  로그인
                </button>
              )}
            </div>

            {/* 햄버거 (모바일만) */}
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="lg:hidden flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors text-foreground"
              aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {mobileOpen
                ? <X className="w-5 h-5" />
                : (
                  <span className="flex flex-col gap-[5px] w-5">
                    <span className="block h-[2px] w-5 rounded-full bg-current" />
                    <span className="block h-[2px] w-4 rounded-full bg-current" />
                    <span className="block h-[2px] w-5 rounded-full bg-current" />
                  </span>
                )
              }
            </button>

            {/* 데스크탑 로그인/마이페이지 */}
            <div className="hidden lg:flex items-center ml-2 relative group">
              {session?.user ? (
                <div className="relative">
                  <Link href="/my" className="flex items-center gap-2 px-5 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-black text-secondary-foreground transition-all active:scale-95 whitespace-nowrap">
                    <User className="w-3.5 h-3.5" />
                    <span>마이페이지</span>
                    <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
                  </Link>
                  <div className="absolute top-full right-0 mt-2 w-40 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
                      <Link href="/profile" className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors">
                        <Home className="w-3.5 h-3.5 text-[#F9954E]" /><span>미니홈피</span>
                      </Link>
                      <Link href="/messages" className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5 text-[#F9954E]" /><span>메시지</span>
                      </Link>
                      <Link href="/feed" className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors">
                        <Newspaper className="w-3.5 h-3.5 text-[#F9954E]" /><span>피드</span>
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors border-t border-neutral-100 dark:border-zinc-800">
                          <span>🛡️</span><span>관리자 패널</span>
                        </Link>
                      )}
                      <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-3.5 h-3.5" /><span>로그아웃</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={handleSignIn} className="px-6 py-2.5 rounded-full bg-[#F9954E] hover:bg-[#E8832E] text-xs font-black text-white transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap">
                  로그인
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── 모바일 오버레이 ── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── 모바일 드로어 (상단에서 슬라이드) ── */}
      <div
        className={cn(
          "fixed top-16 left-0 right-0 z-40 lg:hidden",
          "bg-white dark:bg-black border-b border-neutral-200 dark:border-zinc-800",
          "overflow-y-auto transition-all duration-300 ease-in-out",
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto max-h-[calc(100dvh-4rem)]"
            : "opacity-0 -translate-y-2 pointer-events-none max-h-0"
        )}
      >
        <div className="px-4 py-4 pb-8 flex flex-col gap-1">

          {/* 로그인 / 마이페이지 */}
          <div className="mb-3 pb-3 border-b border-neutral-100 dark:border-zinc-800">
            {session?.user ? (
              <div className="flex flex-col gap-1.5">
                <Link href="/my" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white">
                  <User className="w-4 h-4 text-[#F9954E]" /><span>마이페이지</span>
                </Link>
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white">
                  <Home className="w-4 h-4 text-[#F9954E]" /><span>미니홈피</span>
                </Link>
                <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white">
                  <MessageCircle className="w-4 h-4 text-[#F9954E]" /><span>메시지</span>
                </Link>
                <Link href="/feed" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white">
                  <Newspaper className="w-4 h-4 text-[#F9954E]" /><span>피드</span>
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-sm font-bold text-orange-600 dark:text-orange-400">
                    <span>🛡️</span><span>관리자 패널</span>
                  </Link>
                )}
                <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-sm font-bold text-red-500 text-left w-full">
                  <LogOut className="w-4 h-4" /><span>로그아웃</span>
                </button>
              </div>
            ) : (
              <button onClick={handleSignIn} className="w-full py-3.5 rounded-2xl bg-[#F9954E] hover:bg-[#E8832E] text-sm font-black text-white transition-all active:scale-95">
                로그인 / 회원가입
              </button>
            )}
          </div>

          {/* 메인 메뉴 */}
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{item.emoji}</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-zinc-600" />
            </Link>
          ))}

          {/* 프로젝트 — 비활성화(준비 중): 클릭 불가, 회색 표시만 */}
          <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-zinc-800">
            <p className="px-4 pt-2 pb-1 text-[10px] font-bold tracking-widest uppercase text-neutral-400">
              Projects <span className="ml-1 normal-case font-medium text-neutral-300 dark:text-neutral-600">· 준비 중</span>
            </p>
            {projects.map((p) => (
              <div key={p.name} aria-disabled="true" className="flex items-center gap-3 px-4 py-3 rounded-2xl opacity-40 cursor-not-allowed select-none">
                <div className={`w-9 h-9 rounded-xl ${p.bg} flex items-center justify-center text-lg flex-shrink-0 overflow-hidden`}>
                  {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" /> : p.emoji}
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">{p.name}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
