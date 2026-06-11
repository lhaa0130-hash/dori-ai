"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedGameProfile } from "@/lib/cottonCandy";
import { TIER_INFO, type UserTier } from "@/lib/userProfile";

/**
 * 레벨/등급 상승 시 전역 토스트. 'dori-gamedata-synced' 이벤트마다 캐시 레벨을 비교해
 * 올라갔으면 축하 토스트를 띄운다. (활동 → 경험치 → 레벨업 피드백)
 */
export default function LevelUpToast() {
  const { session } = useAuth();
  const lastLevel = useRef<number | null>(null);
  const lastTier = useRef<number | null>(null);
  const [toast, setToast] = useState<{ level: number; tier: number; tierUp: boolean } | null>(null);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) { lastLevel.current = null; lastTier.current = null; return; }

    const check = () => {
      const gp = getCachedGameProfile(email);
      if (!gp) return;
      const lv = gp.level || 1;
      const tr = gp.tier || 1;
      // 첫 관측은 기준만 세팅(토스트 X)
      if (lastLevel.current === null) { lastLevel.current = lv; lastTier.current = tr; return; }
      if (lv > lastLevel.current) {
        const tierUp = tr > (lastTier.current || 1);
        setToast({ level: lv, tier: tr, tierUp });
        setTimeout(() => setToast(null), 5000);
      }
      lastLevel.current = lv;
      lastTier.current = tr;
    };

    check();
    window.addEventListener("dori-gamedata-synced", check);
    return () => window.removeEventListener("dori-gamedata-synced", check);
  }, [session?.user?.email]);

  if (!toast) return null;
  const info = TIER_INFO[(toast.tier >= 1 && toast.tier <= 10 ? toast.tier : 1) as UserTier];

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[120] pointer-events-none">
      <div className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-[#F9954E]/40 shadow-xl shadow-[#F9954E]/10 toss-fade-up">
        <span className="text-[22px] toss-float">🎉</span>
        <div>
          <p className="text-[13px] font-extrabold text-neutral-900 dark:text-white">레벨 업! Lv.{toast.level} 달성</p>
          {toast.tierUp && (
            <p className="text-[11px] font-bold" style={{ color: info.color }}>
              등급 상승 → {info.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
