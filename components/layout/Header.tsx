"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Search, ChevronDown, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function Header() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const navItems = [
    { name: "공지사항", href: "/notice" },
    { name: "미니게임", href: "/minigame" },
    { name: "AI 도구", href: "/ai-tools" },
    { name: "인사이트", href: "/insight" },
    { name: "커뮤니티", href: "/community" },
    { name: "마켓", href: "/market" },
    { name: "건의사항", href: "/suggestion" },
    { name: "FAQ", href: "/faq" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans",
        "bg-white dark:bg-[#000000] border-b border-neutral-200 dark:border-[#27272a]"
      )}
    >
      <div className="w-full h-16 flex items-center justify-center gap-8 px-4">

        {/* 1. Logo */}
        <Link href="/" aria-label="DORI-AI Home" className="flex-shrink-0 hover:opacity-70 transition-opacity">
          <span className="font-bold text-lg whitespace-nowrap bg-[linear-gradient(to_right,#FBAA60,#F9954E_30%,#F9954E_70%,#E8832E)] bg-clip-text text-transparent animate-gradient-x">
            DORI-AI
          </span>
        </Link>

        {/* 2-7. Navigation Items */}
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex-shrink-0 text-sm font-medium text-foreground hover:text-[#E8832E] dark:hover:text-[#F9954E] transition-colors whitespace-nowrap"
          >
            {item.name}
          </Link>
        ))}

        {/* 8. Search Icon */}
        <button
          aria-label="Search"
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity text-foreground"
        >
          <Search className="w-5 h-5" strokeWidth={2.5} />
        </button>

        {/* 9. Theme Toggle */}
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity">
          <ThemeToggle />
        </div>

        {/* 10. User Menu / Login Button */}
        <div className="flex-shrink-0 flex items-center ml-2 relative group">
          {session?.user ? (
            <div className="relative">
              <Link
                href="/my"
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-black text-secondary-foreground transition-all active:scale-95 whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5" />
                <span>마이페이지</span>
                <ChevronDown className="w-3 h-3 opacity-50 group-hover:rotate-180 transition-transform duration-300" />
              </Link>

              {/* Hover Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-32 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl bg-opacity-90 dark:bg-opacity-90">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>로그아웃</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-6 py-2.5 rounded-full bg-[#F9954E] hover:bg-[#E8832E] text-xs font-black text-white transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
            >
              로그인
            </button>
          )}
        </div>

      </div>
    </header>
  );
}