"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { X, Sparkles, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-background/40 backdrop-blur-sm"
          />

          {/* Popup Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#FFF5EB]/50 to-transparent dark:from-[#8F4B10]/20 pointer-events-none" />

            <div className="relative p-6 px-8 flex flex-col items-center text-center">

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon / Date Badge */}
              <div className="mb-6 mt-2 relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FEEBD0] to-[#FFF5EB] dark:from-[#8F4B10]/30 dark:to-[#8F4B10]/20 flex items-center justify-center text-[#F9954E] shadow-lg mb-4 mx-auto transform rotate-3">
                  <PartyPopper className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5EB] dark:bg-[#8F4B10]/50 border border-[#FEEBD0] dark:border-[#8F4B10]/50 text-[11px] font-bold text-[#E8832E] dark:text-[#FBAA60] uppercase tracking-wide">
                  <Sparkles className="w-3 h-3" />
                  <span>2026.02.16 Open</span>
                </div>
              </div>

              {/* Text Content */}
              <h2 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                DORI-AI에 오신 것을 환영합니다!
              </h2>

              <div className="text-sm text-muted-foreground leading-relaxed space-y-1 mb-8">
                <p>AI 활용 방법을 함께 연구하고 실전으로 적용해보는</p>
                <p>최신 트렌드와 인사이트를 공유하며 함께 성장하는</p>
                <p className="font-medium text-[#E8832E] dark:text-[#FBAA60]">커뮤니티 플랫폼입니다</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F9954E] to-[#E8832E] text-white font-semibold text-sm shadow-lg shadow-[#F9954E]/20 hover:shadow-[#F9954E]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  닫기
                </button>
                <button
                  onClick={handleHideToday}
                  className="w-full py-3 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground font-medium text-sm transition-colors"
                >
                  오늘 하루 보지 않기
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
