"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession(); // Removed 'status' to avoid loading states
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignIn = () => {
    signIn();
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const navItems = [
    { name: "프로젝트", href: "/project" },
    { name: "미니게임", href: "/minigame" },
    { name: "AI 도구", href: "/ai-tools" },
    { name: "인사이트", href: "/insight" },
    { name: "커뮤니티", href: "/community" },
    { name: "마켓", href: "/market" },
    { name: "건의사항", href: "/suggestion" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans",
        // Force background color to prevent transparency issues
        "bg-white dark:bg-zinc-950 border-b border-neutral-200 dark:border-zinc-800"
      )}
    >
      {/* 
        Robust Layout:
        - w-full: Full width.
        - justify-center: Center items.
        - gap-6: Fixed spacing between items.
      */}
      <div className="w-full h-16 flex items-center justify-center gap-8 px-4">

        {/* 1. Logo */}
        <Link href="/" aria-label="DORI-AI Home" className="flex-shrink-0 hover:opacity-70 transition-opacity">
          <span className="font-bold text-lg whitespace-nowrap bg-[linear-gradient(to_right,#facc15,#f97316_20%,#f97316_80%,#ef4444)] bg-clip-text text-transparent animate-gradient-x">
            DORI-AI
          </span>
        </Link>

        {/* 2-7. Navigation Items */}
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex-shrink-0 text-sm font-medium text-foreground hover:text-orange-600 dark:hover:text-orange-500 transition-colors whitespace-nowrap"
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

        {/* 
           10. Login Button 
           REMOVED loading check. 
           Always renders a button. Default: Login. 
           This fixes the "only box is visible" issue.
        */}
        <div className="flex-shrink-0 min-w-[70px] flex items-center justify-center ml-2">
          {session?.user ? (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-full bg-secondary text-xs font-bold text-secondary-foreground hover:bg-secondary/80 transition-colors whitespace-nowrap"
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-4 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
            >
              로그인
            </button>
          )}
        </div>

      </div>
    </header>
  );
}