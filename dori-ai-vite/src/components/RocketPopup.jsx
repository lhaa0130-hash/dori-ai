// src/components/RocketPopup.jsx
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const RocketPopup = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hideUntil = localStorage.getItem('dori_popup_hide_until');
    if (hideUntil) {
      const hideDate = new Date(hideUntil);
      const now = new Date();
      if (now < hideDate) {
        return;
      } else {
        localStorage.removeItem('dori_popup_hide_until');
      }
    }
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleHideToday = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    localStorage.setItem('dori_popup_hide_until', tomorrow.toISOString());
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 text-center bg-white dark:bg-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200/50 dark:bg-gray-700/50 flex items-center justify-center"
        >
          ✕
        </button>
        <div className="mb-4 text-6xl animate-bounce">🚀</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          DORI-AI에 오신 것을 환영합니다!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          최신 트렌드와 인사이트를 공유하며 함께 성장하는 커뮤니티 플랫폼입니다.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleHideToday}
            className="w-full py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white"
          >
            오늘 하루 보지 않기
          </button>
          <button
            onClick={handleClose}
            className="w-full py-2 px-4 rounded-lg bg-blue-500 text-white"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default RocketPopup;
