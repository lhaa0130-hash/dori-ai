"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import DailyMissions from "@/components/mission/DailyMissions";

interface AccountMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  displayName: string;
  points?: number;
  level?: number;
  onNavigate?: (path: string) => void;
}

export default function AccountMenu({ user, displayName, points = 0, level = 1, onNavigate }: AccountMenuProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMissionsExpanded, setIsMissionsExpanded] = useState(false);
  const [userPoints, setUserPoints] = useState(points);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // 포인트 업데이트
  useEffect(() => {
    setUserPoints(points);
  }, [points]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    signOut({ callbackUrl: "/" });
  };

  const handleThemeToggle = () => {
    if (mounted) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };


  if (!mounted) return null;

  const isDark = theme === 'dark';
  const levelProgress = ((level % 10) / 10) * 100;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        }}
        aria-label="Account menu"
        aria-expanded={isOpen}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          }}
        >
          {displayName?.[0]?.toUpperCase() || "U"}
        </div>
        <span
          className="text-sm font-medium hidden sm:block"
          style={{
            color: isDark ? '#ffffff' : '#1d1d1f',
          }}
        >
          {displayName || "사용자"}
        </span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{
            color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-2 w-[340px] rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-150 origin-top-right"
          style={{
            background: isDark
              ? 'rgba(15, 15, 15, 0.95)'
              : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)',
            boxShadow: isDark
              ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            animation: 'fadeInScale 0.15s ease-out',
          }}
          role="menu"
        >
          <div className="p-3.5">
            {/* Profile Header */}
            <div className="mb-4">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {displayName?.[0]?.toUpperCase() || "사"}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-base font-semibold mb-0.5 truncate"
                    style={{
                      color: isDark ? '#ffffff' : '#1d1d1f',
                    }}
                  >
                    {displayName || "사용자"}
                  </div>
                  <div
                    className="text-xs mb-2 truncate"
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {user.email || "user@dori.ai"}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: isDark
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(37, 99, 235, 0.1)',
                        color: isDark ? '#93c5fd' : '#2563eb',
                        border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.2)'}`,
                      }}
                    >
                      크리에이터
                    </span>
                    <div
                      className="text-xs font-medium ml-auto"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      포인트 {userPoints.toLocaleString()}
                    </div>
                  </div>
                  {/* Level Indicator */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        레벨 {level}
                      </span>
                      <span
                        className="text-[10px] font-medium"
                        style={{
                          color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {Math.round(levelProgress)}%
                      </span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${levelProgress}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              <button
                onClick={() => handleNavigate('/my')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                }}
              >
                <span className="text-base">👤</span>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isDark ? '#ffffff' : '#1d1d1f',
                  }}
                >
                  내 페이지
                </span>
              </button>
              <div className="w-full">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMissionsExpanded(!isMissionsExpanded);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                      }}
                    >
                      미션
                    </span>
                  </div>
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    className={`transition-transform duration-200 ${isMissionsExpanded ? 'rotate-180' : ''}`}
                    style={{
                      color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Daily Missions 아코디언 콘텐츠 - 항상 표시 */}
                <div className="mt-2 pl-2">
                  <DailyMissions
                    isDark={isDark}
                    onPointsUpdate={(newPoints) => {
                      setUserPoints(newPoints);
                      // 부모 컴포넌트에 포인트 업데이트 알림 (필요시)
                    }}
                  />
                </div>
              </div>
            </div>


            {/* Menu Groups */}
            <div className="space-y-1">
              {/* Preferences */}
              <div className="mb-2">
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  설정
                </div>
                <button
                  onClick={handleThemeToggle}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{mounted && theme === 'dark' ? '🌙' : '☀️'}</span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                      }}
                    >
                      테마
                    </span>
                  </div>
                  <div
                    className="w-10 h-5 rounded-full relative transition-colors duration-200"
                    style={{
                      background: mounted && theme === 'dark'
                        ? 'rgba(59, 130, 246, 0.5)'
                        : 'rgba(251, 191, 36, 0.5)',
                    }}
                  >
                    <div
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 bg-white shadow-sm"
                      style={{
                        transform: mounted && theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
                      }}
                    />
                  </div>
                </button>
              </div>

              {/* Account */}
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-1"
                  style={{
                    color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                  }}
                >
                  계정
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span className="text-base">🚪</span>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: '#ef4444',
                      }}
                    >
                      로그아웃
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}

