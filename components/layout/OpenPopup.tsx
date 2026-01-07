"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export default function OpenPopup() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // localStorage에서 "오늘하루 보지않기" 확인
    const hideUntil = localStorage.getItem("dori_open_popup_hide_until");
    if (hideUntil) {
      const hideDate = new Date(hideUntil);
      const now = new Date();
      if (now < hideDate) {
        // 아직 숨김 기간이면 팝업 표시 안 함
        return;
      } else {
        // 기간이 지났으면 localStorage에서 제거
        localStorage.removeItem("dori_open_popup_hide_until");
      }
    }
    
    // 팝업 표시
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleHideToday = () => {
    // 오늘 자정까지 숨김
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    localStorage.setItem("dori_open_popup_hide_until", tomorrow.toISOString());
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleClose}
      >
        <div
          className="relative w-full max-w-md rounded-3xl overflow-hidden animate-[popupSlideUp_0.4s_ease-out]"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(20, 20, 30, 0.98), rgba(30, 30, 45, 0.98), rgba(40, 20, 50, 0.98))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(250, 250, 255, 0.98), rgba(245, 240, 255, 0.98))',
            border: `2px solid transparent`,
            backgroundImage: isDark
              ? 'linear-gradient(135deg, rgba(20, 20, 30, 0.98), rgba(30, 30, 45, 0.98), rgba(40, 20, 50, 0.98)), linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(250, 250, 255, 0.98), rgba(245, 240, 255, 0.98)), linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(59, 130, 246, 0.2), 0 0 80px rgba(139, 92, 246, 0.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 배경 장식 - 그라데이션 추가 및 애니메이션 */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 blur-3xl animate-[float_6s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
              animationDelay: '0s',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-25 blur-3xl animate-[float_8s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b)',
              animationDelay: '1s',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-15 blur-3xl animate-[float_10s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(135deg, #ec4899, #f59e0b, #3b82f6)',
              animationDelay: '2s',
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-20 blur-2xl animate-[float_7s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4, #8b5cf6)',
              animationDelay: '0.5s',
            }}
          />
          <div
            className="absolute top-1/4 left-0 w-32 h-32 rounded-full opacity-20 blur-2xl animate-[float_9s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)',
              animationDelay: '1.5s',
            }}
          />
          <div
            className="absolute top-0 left-1/3 w-36 h-36 rounded-full opacity-15 blur-2xl animate-[float_11s_ease-in-out_infinite]"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #ec4899)',
              animationDelay: '2.5s',
            }}
          />

          {/* 닫기 버튼 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 cursor-pointer"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            }}
            aria-label="닫기"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* 콘텐츠 */}
          <div className="relative z-10 p-8 text-center">
            {/* 이모지/아이콘 */}
            <div className="mb-6">
              <div
                className="inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-4 relative animate-[pulse_3s_ease-in-out_infinite]"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
                  boxShadow: '0 8px 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), 0 0 100px rgba(236, 72, 153, 0.2)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-3xl opacity-60 animate-[rotate_20s_linear_infinite]"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6, #3b82f6)',
                    filter: 'blur(12px)',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-3xl opacity-40 animate-[rotate_15s_linear_infinite_reverse]"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)',
                    filter: 'blur(8px)',
                  }}
                />
                <span className="text-6xl relative z-10 animate-[bounce_2s_ease-in-out_infinite]">🚀</span>
              </div>
            </div>

            {/* 날짜 배지 */}
            <div className="mb-5 flex justify-center">
              <span
                className="inline-block px-6 py-2.5 rounded-full text-sm font-bold relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.3)',
                }}
              >
                🎉 2026.01.01 사이트 오픈! 🎉
              </span>
            </div>

            {/* 메인 타이틀 */}
            <h2
              className="text-2xl font-black mb-4 leading-tight animate-[gradientShift_5s_ease_infinite] whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #06b6d4, #3b82f6)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
              }}
            >
              DORI-AI에 오신 것을 환영합니다!
            </h2>

            {/* 설명 텍스트 */}
            <div className="space-y-2 mb-6">
              <p
                className="text-base leading-relaxed font-medium"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                }}
              >
                <span
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: '700',
                  }}
                >
                  AI 활용 방법을 함께 연구하고 실전으로 적용해보는
                </span>
              </p>
              <p
                className="text-base leading-relaxed font-medium"
                style={{
                  color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                }}
              >
                최신 트렌드와 인사이트를 공유하며 함께 성장하는
              </p>
              <p
                className="text-lg font-bold leading-relaxed"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                커뮤니티 플랫폼입니다
              </p>
            </div>

            {/* 하단 버튼들 */}
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={handleHideToday}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                  color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                }}
              >
                오늘하루 보지않기
              </button>
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
                  color: '#ffffff',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)',
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  닫기
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899, #f59e0b, #3b82f6)',
                  }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                    animation: 'shimmer 2s ease-in-out infinite',
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes popupSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(10px, -10px) scale(1.05);
          }
          50% {
            transform: translate(-5px, 5px) scale(0.95);
          }
          75% {
            transform: translate(-10px, -5px) scale(1.02);
          }
        }
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 40px rgba(59, 130, 246, 0.6), 0 0 60px rgba(139, 92, 246, 0.4), 0 0 100px rgba(236, 72, 153, 0.2);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 12px 50px rgba(59, 130, 246, 0.8), 0 0 80px rgba(139, 92, 246, 0.6), 0 0 120px rgba(236, 72, 153, 0.4);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </>
  );
}

