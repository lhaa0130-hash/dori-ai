"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />; 
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      // 🚨 [핵심 수정] Header의 투명화 스타일을 이기기 위해 직접 style 속성으로 색상을 지정합니다.
      // 라이트모드(!isDark) -> 배경: 검정 (#000) / 글씨: 흰색 (#fff)
      // 다크모드(isDark)   -> 배경: 흰색 (#fff) / 글씨: 검정 (#000)
      style={{
        backgroundColor: isDark ? "#ffffff" : "#000000",
        color: isDark ? "#000000" : "#ffffff",
        borderColor: isDark ? "#ffffff" : "#000000",
      }}
      className="p-2 rounded-full transition-all border flex items-center justify-center w-9 h-9 shadow-md hover:opacity-80"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? "🌞" : "🌙"}
    </button>
  );
}