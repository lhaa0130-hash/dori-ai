"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // 마운트 전: 빈 자리 확보 (레이아웃 shift 방지)
  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors select-none"
    >
      <span className="text-[18px] leading-none" role="img" aria-hidden="true">
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
