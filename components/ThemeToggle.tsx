"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 flex items-center justify-center">
        <Sun className="w-5 h-5 text-neutral-500" />
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      className="w-9 h-9 flex items-center justify-center hover:opacity-70 transition-opacity focus:outline-none text-neutral-900 dark:text-neutral-100"
      onClick={() => {
        const newTheme = isDark ? "light" : "dark";
        setTheme(newTheme);
        console.log("Theme toggled to:", newTheme);
      }}
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}