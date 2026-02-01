"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // FORCE VISIBLE ICON even during hydration/loading
  // If not mounted, show a generic Sun icon (or transparent placeholder with border if preferred, but icon is safer)
  if (!mounted) {
    return (
      <div className="w-9 h-9 flex items-center justify-center text-neutral-500">
        <Sun className="w-5 h-5 opacity-50" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      className="w-9 h-9 flex items-center justify-center hover:opacity-70 transition-opacity focus:outline-none text-neutral-900 dark:text-neutral-100"
      onClick={() => setTheme(isDark ? "light" : "dark")}
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