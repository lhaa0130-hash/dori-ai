"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { grantPlaytimeReward, hasClaimedPlaytimeToday } from "@/lib/cottonCandy";
import CottonCandy from "@/components/icons/CottonCandy";

/**
 * 1분 이상 플레이 시 솜사탕 +50 (하루 1회) 자동 지급 + 토스트 표시.
 * 동물합치기 / 2048 / 보스 클리커 페이지에 배치합니다.
 * 비로그인이거나 오늘 이미 받았으면 아무것도 하지 않습니다.
 */
export default function PlaytimeRewardToast({ seconds = 60, amount = 50 }: { seconds?: number; amount?: number }) {
  const { session } = useAuth();
  const [show, setShow] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email || firedRef.current) return;
    if (hasClaimedPlaytimeToday(email)) return;

    const t = setTimeout(() => {
      if (firedRef.current) return;
      const r = grantPlaytimeReward(email, amount);
      if (r.granted) {
        firedRef.current = true;
        setShow(true);
        // 동기화 이벤트 → 홈/위젯 솜사탕 갱신
        try { window.dispatchEvent(new Event("dori-gamedata-synced")); } catch {}
        setTimeout(() => setShow(false), 4200);
      }
    }, seconds * 1000);

    return () => clearTimeout(t);
  }, [session?.user?.email, seconds, amount]);

  if (!show) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-20 z-[100] pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#F9954E] text-white shadow-xl shadow-[#F9954E]/30 toss-fade-up">
        <CottonCandy className="w-[18px] h-[18px] toss-float" />
        <span className="text-[13px] font-bold">1분 플레이 보상! 솜사탕 +{amount}</span>
      </div>
    </div>
  );
}
