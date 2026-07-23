"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCottonCandyBalance,
  getAttendanceData,
  hydrateGameData,
  getCachedGameProfile,
} from "@/lib/cottonCandy";
import { claimDailyAttendance } from "@/lib/claimReward";
import { TIER_INFO, calculateLevelProgress, type UserTier } from "@/lib/userProfile";
import CottonCandy from "@/components/icons/CottonCandy";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HomeClient({ locale = "ko" }: { locale?: "ko" | "en" }) {
  const en = locale === "en";
  const { session, status } = useAuth();
  const [cottonCandy, setCottonCandy] = useState(0);
  const [checkedToday, setCheckedToday] = useState(false);
  const [checking, setChecking] = useState(false);
  const [level, setLevel] = useState(1);
  const [tier, setTier] = useState(1);
  const [exp, setExp] = useState(0);
  const [attError, setAttError] = useState(false);
  const claimingRef = useRef(false); // 동기 중복 클릭 가드(state 가드는 같은 렌더 연타를 못 막음)

  const refresh = (email: string) => {
    const att = getAttendanceData(email);
    setCottonCandy(getCottonCandyBalance(email));
    setCheckedToday(att.lastChecked === getTodayStr());
    const gp = getCachedGameProfile(email);
    setLevel(gp?.level || 1);
    setTier(gp?.tier || 1);
    setExp(gp?.doriExp || 0);
  };

  useEffect(() => {
    if (session?.user?.email) refresh(session.user.email);
  }, [session?.user?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = () => {
      if (session?.user?.email) refresh(session.user.email);
    };
    window.addEventListener("dori-gamedata-synced", onSync);
    return () => window.removeEventListener("dori-gamedata-synced", onSync);
  }, [session?.user?.email]);

  // 출석 = 신뢰 서버 게이트 호출. 클라이언트가 재화를 직접 올리지 않는다.
  //  상태: idle → claiming → granted/already_claimed/legacy_recognized(=출석완료) / error(재시도).
  const handleAttendance = async () => {
    const email = session?.user?.email;
    if (!email || checkedToday || checking || claimingRef.current) return;
    claimingRef.current = true;
    setChecking(true);
    setAttError(false);
    try {
      const r = await claimDailyAttendance();
      if (r.status === "granted" || r.status === "already_claimed" || r.status === "legacy_recognized") {
        setCheckedToday(true);
        await hydrateGameData(); // 서버 원본 → localStorage 표시 캐시 동기화
        refresh(email);
      } else {
        setAttError(true); // 네트워크 실패 시 거짓 성공 금지 — 재시도 가능
      }
    } finally {
      claimingRef.current = false;
      setChecking(false);
    }
  };

  /* ── 로딩 중: 스켈레톤 ── */
  if (status === "loading") {
    return (
      <div className="mt-5 mb-5 py-4 px-5 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-stone-50/60 dark:bg-zinc-900/30 animate-pulse">
        <div className="h-3 w-40 rounded-full bg-stone-200 dark:bg-zinc-800 mb-3" />
        <div className="h-7 w-full rounded-xl bg-stone-200 dark:bg-zinc-800" />
      </div>
    );
  }

  /* ── 비로그인 ── */
  if (status === "unauthenticated") {
    return (
      <div className="mt-5 mb-5 flex items-center justify-between py-3.5 px-5 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-stone-50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2.5">
          <CottonCandy className="w-5 h-5" />
          <span className="text-[13px] font-semibold text-stone-500 dark:text-stone-400">
            {en ? "Sign in to earn levels & cotton candy" : "로그인하고 등급·솜사탕을 모으세요"}
          </span>
        </div>
        <Link href="/login" className="px-4 py-2 rounded-xl bg-[#F9954E] text-white text-[12px] font-black">
          {en ? "Sign in" : "로그인"}
        </Link>
      </div>
    );
  }

  /* ── 로그인 ── */
  const tierInfo = TIER_INFO[(tier >= 1 && tier <= 10 ? tier : 1) as UserTier];
  const progress = calculateLevelProgress(exp, level);

  return (
    <Link
      href="/my"
      className="mt-5 mb-5 block py-4 px-5 rounded-2xl border border-stone-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 active:opacity-80 transition-opacity"
    >
      {/* 상단: 등급/레벨 + 출석 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ color: tierInfo.color, backgroundColor: tierInfo.color + "1a" }}
          >
            {tierInfo.name}
          </span>
          <span className="text-[14px] font-extrabold text-stone-900 dark:text-white">Lv.{level}</span>
          <span className="text-[11px] text-stone-400">· {exp.toLocaleString()} EXP</span>
        </div>

        {checkedToday ? (
          <span className="text-[12px] font-bold text-[#F9954E] flex-shrink-0">{en ? "✅ Checked in" : "✅ 출석완료"}</span>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); handleAttendance(); }}
            disabled={checking}
            aria-label={en ? "Check in for daily reward" : "출석하고 보상 받기"}
            title={attError ? (en ? "Failed. Tap to retry." : "실패했어요. 다시 눌러 주세요.") : undefined}
            className={`px-3.5 py-1.5 rounded-xl text-white text-[12px] font-black active:opacity-80 transition-opacity disabled:opacity-50 flex-shrink-0 ${attError ? "bg-red-500" : "bg-[#F9954E]"}`}
          >
            {checking
              ? "..."
              : attError
                ? (en ? "Retry" : "다시")
                : <>{en ? "Check in" : "출석"} +50 <CottonCandy className="w-3.5 h-3.5 inline-block align-[-0.15em]" /></>}
          </button>
        )}
      </div>

      {/* 레벨 진행 바 */}
      <div className="relative h-1.5 rounded-full overflow-hidden bg-stone-100 dark:bg-zinc-800 mb-2.5">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%`, backgroundColor: tierInfo.color }}
        />
      </div>

      {/* 하단: 솜사탕 */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-stone-400">{en ? `${Math.round(100 - progress)}% to next level` : `다음 레벨까지 ${Math.round(100 - progress)}%`}</span>
        <span className="flex items-center gap-1 text-[13px] font-bold text-stone-700 dark:text-stone-300">
          <CottonCandy className="w-4 h-4" /> {cottonCandy.toLocaleString()}
        </span>
      </div>
    </Link>
  );
}
