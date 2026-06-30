"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Search, ChevronDown, ChevronRight, User, LogOut, Menu, X, MessageCircle, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import SearchOverlay from "@/components/layout/SearchOverlay";

const ADMIN_EMAIL = "lhaa0130@gmail.com";

export default function Header() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  // 공지사항·건의사항은 메인 네비에서 숨김(푸터에 노출됨), 마켓은 노출
  // 일부 항목은 children 드롭다운(AI 정보 / 놀이터)
  type NavChild = { name: string; href: string; emoji: string };
  type NavItem = { name: string; emoji: string; href?: string; children?: NavChild[] };
  const navItems: NavItem[] = [
    { name: "프로젝트", href: "/projects", emoji: "🚀" },
    { name: "인사이트", href: "/insight", emoji: "🧠" },
    {
      name: "AI 정보", emoji: "🤖", children: [
        { name: "AI 도구", href: "/ai-tools", emoji: "🔧" },
        { name: "AI 소식", href: "/ai-news", emoji: "📰" },
      ],
    },
    { name: "피드", href: "/feed", emoji: "💬" },
    { name: "마켓", href: "/market", emoji: "🛒" },
    {
      name: "놀이터", emoji: "🎡", children: [
        { name: "미니게임", href: "/minigame", emoji: "🎮" },
        { name: "심리테스트", href: "/psychtest", emoji: "🧩" },
      ],
    },
  ];

  return (
    <>
      {/* ── 헤더 ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b border-neutral-200 dark:border-zinc-800 font-sans">
        {/* 본문(main: xl:px-[260px])과 좌·우 동일 정렬 — 우측 컨트롤이 본문/미리보기 끝선에 맞음 */}
        <div className="w-full h-16 flex items-center gap-4 px-6 xl:px-[260px]">

          {/* 로고 */}
          <Link href="/" aria-label="DORI-AI Home" className="flex-shrink-0 hover:opacity-70 transition-opacity">
            <span className="font-bold text-lg whitespace-nowrap bg-[linear-gradient(to_right,#FBAA60,#F9954E_30%,#F9954E_70%,#E8832E)] bg-clip-text text-transparent animate-gradient-x">
              DORI-AI
            </span>
          </Link>

          {/* ── 데스크탑 네비게이션 (lg+, 좌측 정렬) ── */}
          <nav className="hidden lg:flex items-center gap-5">
            {/* 공지사항은 헤더에서 제외(푸터에만 노출) */}

            {navItems.map((item) =>
              item.children ? (
                <div key={item.name} className="relative group/nav">
                  <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-[#E8832E] dark:hover:text-[#F9954E] transition-colors whitespace-nowrap">
                    {item.name}
                    <ChevronDown className="w-3 h-3 opacity-50 group-hover/nav:rotate-180 transition-transform duration-300" />
                  </button>
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-300 translate-y-1 group-hover/nav:translate-y-0 z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden py-1 min-w-[160px]">
                      {item.children.map((c) => (
                        <Link key={c.name} href={c.href} className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800 hover:text-[#F9954E] transition-colors whitespace-nowrap">
                          <span className="w-4 text-center">{c.emoji}</span><span>{c.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={item.name} href={item.href || "#"} className="flex-shrink-0 text-sm font-medium text-foreground hover:text-[#E8832E] dark:hover:text-[#F9954E] transition-colors whitespace-nowrap">
                  {item.name}
                </Link>
              )
            )}
          </nav>

          {/* ── 우측 컨트롤 (돋보기·테마·마이페이지) ── */}
          <div className="ml-auto flex items-center gap-1">

            {/* 검색 (데스크탑) */}
            <button onClick={() => setSearchOpen(true)} aria-label="검색" className="hidden lg:flex flex-shrink-0 w-10 h-10 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors text-foreground">
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
                  href="/profile"
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
                  <Link href="/profile" className="flex items-center gap-2 px-5 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-black text-secondary-foreground transition-all active:scale-95 whitespace-nowrap">
                    <User className="w-3.5 h-3.5" />
                    <span>마이페이지</span>
                    <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
                  </Link>
                  <div className="absolute top-full right-0 mt-2 w-52 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden py-1">
                      <Link href="/profile" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors">
                        <User className="w-4 h-4 text-[#F9954E]" /><span>마이페이지</span>
                      </Link>
                      <Link href="/feed" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors">
                        <Newspaper className="w-4 h-4 text-[#F9954E]" /><span>피드</span>
                      </Link>
                      <Link href="/messages" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors">
                        <MessageCircle className="w-4 h-4 text-[#F9954E]" /><span>메시지</span>
                      </Link>
                      <Link href="/shop" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800 transition-colors">
                        <span className="w-4 text-center text-[#F9954E]">🍬</span><span>상점</span>
                      </Link>

                      {isAdmin && (
                        <>
                          <div className="my-1 border-t border-neutral-100 dark:border-zinc-800" />
                          <Link href="/admin" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                            <span className="w-4 text-center">🛡️</span><span>관리자 패널</span>
                          </Link>
                        </>
                      )}

                      <div className="my-1 border-t border-neutral-100 dark:border-zinc-800" />
                      <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" /><span>로그아웃</span>
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

      {/* 검색 오버레이 */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

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
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white">
                  <User className="w-4 h-4 text-[#F9954E]" /><span>마이페이지</span>
                </Link>
                <Link href="/feed" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white">
                  <Newspaper className="w-4 h-4 text-[#F9954E]" /><span>피드</span>
                </Link>
                <Link href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white">
                  <MessageCircle className="w-4 h-4 text-[#F9954E]" /><span>메시지</span>
                </Link>
                <Link href="/shop" className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900 text-sm font-bold text-neutral-900 dark:text-white">
                  <span className="w-4 text-center text-[#F9954E]">🍬</span><span>상점</span>
                </Link>

                {/* 관리 / 로그아웃 */}
                {isAdmin && (
                  <Link href="/admin" className="mt-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-sm font-bold text-orange-600 dark:text-orange-400">
                    <span className="w-4 text-center">🛡️</span><span>관리자 패널</span>
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
          {navItems.map((item) =>
            item.children ? (
              <div key={item.name} className="py-1">
                <div className="flex items-center gap-3 px-4 pt-2 pb-1">
                  <span className="text-base w-6 text-center">{item.emoji}</span>
                  <span className="text-xs font-bold text-neutral-400 dark:text-zinc-500 tracking-wide">{item.name}</span>
                </div>
                {item.children.map((c) => (
                  <Link
                    key={c.name}
                    href={c.href}
                    className="flex items-center justify-between pl-12 pr-4 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base w-6 text-center">{c.emoji}</span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">{c.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-zinc-600" />
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href || "#"}
                className="flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{item.emoji}</span>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-[#F9954E] transition-colors">{item.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-zinc-600" />
              </Link>
            )
          )}

        </div>
      </div>
    </>
  );
}
