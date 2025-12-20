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
    <>
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="theme-toggle-btn"
        style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
        }}
        aria-label="Toggle Dark Mode"
      >
        <span 
          className={`theme-icon ${isDark ? 'moon-icon' : 'sun-icon'}`}
        >
          {isDark ? "🌙" : "☀️"}
        </span>
      </button>
      <style jsx>{`
        .theme-toggle-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          cursor: pointer;
          padding: 0;
        }
        .theme-toggle-btn:hover {
          transform: translateY(-1px);
        }
        :global(.dark) .theme-toggle-btn:hover {
          background-color: rgba(255, 255, 255, 0.12) !important;
        }
        :global(.light) .theme-toggle-btn:hover, :global([data-theme="light"]) .theme-toggle-btn:hover {
          background-color: rgba(0, 0, 0, 0.06) !important;
        }
        .theme-icon {
          font-size: 18px;
          line-height: 1;
          display: block;
        }
        .moon-icon {
          filter: brightness(2) contrast(1.2) drop-shadow(0 0 3px rgba(255, 255, 255, 0.6));
        }
        .sun-icon {
          filter: brightness(1.2) saturate(1.5) drop-shadow(0 0 4px rgba(255, 193, 7, 0.8));
        }
      `}</style>
    </>
  );
}