"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCottonCandyBalance,
  getAttendanceData,
  checkAttendance,
} from "@/lib/cottonCandy";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HomeClient() {
  const { session, status } = useAuth();
  const [cottonCandy, setCottonCandy] = useState(0);
  const [checkedToday, setCheckedToday] = useState(false);
  const [checking, setChecking] = useState(false);

  const refresh = (email: string) => {
    const att = getAttendanceData(email);
    setCottonCandy(getCottonCandyBalance(email));
    setCheckedToday(att.lastChecked === getTodayStr());
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

  if (status === "loading") return null;

  /* ── 비로그인 ── */
  if (status === "unauthenticated") {
    return (
      <div className="mt-5 mb-8 flex items-center justify-between py-4 px-5 rounded-2xl border border-neutral-100 dark:border-zinc-900 bg-neutral-50 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2.5">
          <span className="text-[20px]">🍭</span>
          <span className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">
            로그인하고 솜사탕을 모으세요
          </span>
        </div>
        <Link
          href="/login"
          className="px-4 py-2 rounded-xl bg-[#F9954E] text-white text-[12px] font-black"
        >
          로그인
        </Link>
      </div>
    );
  }

  /* ── 로그인 ── */
  return (
    <div className="mt-5 mb-8 flex items-center justify-between py-4 px-5 rounded-2xl border border-neutral-100 dark:border-zinc-900">
      <div className="flex items-center gap-2.5">
        <span className="text-[20px]">🍭</span>
        <div>
          <span className="text-[15px] font-black text-neutral-950 dark:text-white">
            {cottonCandy.toLocaleString()}
          </span>
          <span className="text-[12px] text-neutral-400 ml-1">개</span>
        </div>
      </div>

      {checkedToday ? (
        <span className="text-[12px] font-bold text-[#F9954E]">✅ 출석 완료</span>
      ) : (
        <button
          onClick={handleAttendance}
          disabled={checking}
          className="px-4 py-2 rounded-xl bg-[#F9954E] text-white text-[12px] font-black active:opacity-80 transition-opacity disabled:opacity-50"
        >
          {checking ? "..." : "출석 +50 🍭"}
        </button>
      )}
    </div>
  );
}
