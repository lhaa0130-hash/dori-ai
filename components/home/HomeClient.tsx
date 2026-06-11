"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCottonCandyBalance,
  getAttendanceData,
  checkAttendance,
  getCachedGameProfile,
} from "@/lib/cottonCandy";
import { TIER_INFO, calculateLevelProgress, type UserTier } from "@/lib/userProfile";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HomeClient() {
  const { session, status } = useAuth();
  const [cottonCandy, setCottonCandy] = useState(0);
  const [checkedToday, setCheckedToday] = useState(false);
  const [checking, setChecking] = useState(false);
  const [level, setLevel] = useState(1);
  const [tier, setTier] = useState(1);
  const [exp, setExp] = useState(0);

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

  const handleAttendance = () => {
    if (!session?.user?.email || checkedToday || checking) return;
    setChecking(true);
    const result = checkAttendance(session.user.email);
    if (result.success) refresh(session.user.email);
    setChecking(false);
  };

  /* ── 로딩 중: 스켈레톤 ── */
  if (status === "loading") {
    return (
      <div className="mt-5 mb-5 py-4 px-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50/60 dark:bg-zinc-900/30 animate-pulse">
        <div className="h-3 w-40 rounded-full bg-neutral-200 dark:bg-zinc-800 mb-3" />
        <div className="h-7 w-full rounded-xl bg-neutral-200 dark:bg-zinc-800" />
      </div>
    );
  }

  /* ── 비로그인 ── */
  if (status === "unauthenticated") {
    return (
      <div className="mt-5 mb-5 flex items-center justify-between py-3.5 px-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2.5">
          <span className="text-[20px]">🍭</span>
          <span className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
            로그인하고 등급·솜사탕을 모으세요
          </span>
        </div>
        <Link href="/login" className="px-4 py-2 rounded-xl bg-[#F9954E] text-white text-[12px] font-black">
          로그인
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
      className="mt-5 mb-5 block py-4 px-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 active:opacity-80 transition-opacity"
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
          <span className="text-[14px] font-extrabold text-neutral-900 dark:text-white">Lv.{level}</span>
          <span className="text-[11px] text-neutral-400">· {exp.toLocaleString()} EXP</span>
        </div>

        {checkedToday ? (
          <span className="text-[12px] font-bold text-[#F9954E] flex-shrink-0">✅ 출석완료</span>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); handleAttendance(); }}
            disabled={checking}
            className="px-3.5 py-1.5 rounded-xl bg-[#F9954E] text-white text-[12px] font-black active:opacity-80 transition-opacity disabled:opacity-50 flex-shrink-0"
          >
            {checking ? "..." : "출석 +50 🍭"}
          </button>
        )}
      </div>

      {/* 레벨 진행 바 */}
      <div className="relative h-1.5 rounded-full overflow-hidden bg-neutral-100 dark:bg-zinc-800 mb-2.5">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%`, backgroundColor: tierInfo.color }}
        />
      </div>

      {/* 하단: 솜사탕 */}
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-neutral-400">다음 레벨까지 {Math.round(100 - progress)}%</span>
        <span className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300">
          🍭 {cottonCandy.toLocaleString()}
        </span>
      </div>
    </Link>
  );
}
