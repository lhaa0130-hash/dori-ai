// src/components/ThemeToggle.jsx
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300/50 dark:hover:bg-gray-600/50"
      aria-label="Toggle Dark Mode"
    >
      <span className="text-lg">
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
};

export default ThemeToggle;
