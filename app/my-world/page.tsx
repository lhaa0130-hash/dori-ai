"use client";

// ─────────────────────────────────────────────────────────────────────────────
// My World — "AI와 함께 살아가는 나만의 세계" 홈 (05-01 MVP, UI 골격).
//  · 데이터는 기존 소스(게임 프로필/솜사탕/레벨)를 '읽기 전용'으로만 사용.
//  · 방·일기·업적·작품·활동은 UI placeholder(기능 미구현). Firestore/API 변경 없음.
//  · 향후 연결 지점은 각 컴포넌트 주석 참조.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCottonCandyBalance,
  getCachedGameProfile,
  hydrateGameData,
} from "@/lib/cottonCandy";
import {
  TIER_INFO,
  calculateLevelProgress,
  getNextLevelExp,
  getCurrentLevelStartExp,
  type UserTier,
} from "@/lib/userProfile";
import CottonCandy from "@/components/icons/CottonCandy";
import BackgroundHero from "@/components/my-world/BackgroundHero";
import CharacterCard from "@/components/my-world/CharacterCard";
import RecentActivityCard from "@/components/my-world/RecentActivityCard";
import AiDiaryCard from "@/components/my-world/AiDiaryCard";
import MyRoomCard from "@/components/my-world/MyRoomCard";
import CreationsCard from "@/components/my-world/CreationsCard";
import AchievementsCard from "@/components/my-world/AchievementsCard";

// 오늘의 한마디 — 저장 없이 날짜 기반 결정적 선택.
const HELLOS = [
  "오늘도 하나 만들어보자.",
  "작은 세계가 조금씩 자라고 있어요.",
  "오늘의 나를 기록해볼까요?",
  "새로운 친구를 만들어봐요.",
  "천천히, 나만의 속도로.",
];
function todaysHello(): string {
  const d = new Date();
  const idx = (d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate()) % HELLOS.length;
  return HELLOS[idx];
}

export default function MyWorldPage() {
  const { session, status } = useAuth();
  const [nickname, setNickname] = useState("나");
  const [level, setLevel] = useState(1);
  const [tier, setTier] = useState(1);
  const [exp, setExp] = useState(0);
  const [candy, setCandy] = useState(0);

  const refresh = (email: string) => {
    const gp = getCachedGameProfile(email);
    setLevel(gp?.level || 1);
    setTier(gp?.tier || 1);
    setExp(gp?.doriExp || 0);
    setCandy(getCottonCandyBalance(email));
  };

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;
    setNickname(session?.user?.name || "나");
    refresh(email);
    // 서버 원본 → localStorage 표시 캐시 동기화(읽기용). 값 지급/변경 없음.
    hydrateGameData().then(() => refresh(email)).catch(() => {});
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = () => { if (session?.user?.email) refresh(session.user.email); };
    window.addEventListener("dori-gamedata-synced", onSync);
    return () => window.removeEventListener("dori-gamedata-synced", onSync);
  }, [session?.user?.email]);

  const tierInfo = TIER_INFO[(tier >= 1 && tier <= 10 ? tier : 1) as UserTier];
  const progress = calculateLevelProgress(exp, level);
  const nextTotal = getCurrentLevelStartExp(level) + getNextLevelExp(level);
  const loggedIn = status === "authenticated";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4 sm:pt-6">
      {/* ── Hero ── */}
      <BackgroundHero>
        <div className="flex flex-col items-center px-5 pb-6 pt-8 text-center">
          <CharacterCard size={104} />
          <div className="mt-3 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-black"
              style={{ color: "#fff", backgroundColor: "rgba(0,0,0,0.28)" }}
            >
              {tierInfo.name}
            </span>
            <span className="text-[15px] font-black text-white drop-shadow-sm">Lv.{level}</span>
          </div>
          <h1 className="mt-1.5 text-[20px] font-extrabold text-white drop-shadow-sm">
            {nickname}
          </h1>
          <p className="mt-0.5 text-[13px] font-medium text-white/90 drop-shadow-sm">
            “{todaysHello()}”
          </p>

          {/* EXP progress */}
          <div className="mt-4 w-full max-w-xs">
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-white/90">
              <span>EXP</span>
              <span>{exp.toLocaleString()} / {nextTotal.toLocaleString()}</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/35">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </div>

          {/* Candy */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 shadow-sm">
            <CottonCandy className="h-4 w-4" />
            <span className="text-[13px] font-black text-stone-800">{candy.toLocaleString()}</span>
          </div>
        </div>
      </BackgroundHero>

      {!loggedIn && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className="text-[13px] font-semibold text-stone-500 dark:text-stone-400">
            로그인하면 나만의 My World가 채워져요
          </span>
          <Link href="/login" className="rounded-xl bg-[#F9954E] px-3.5 py-1.5 text-[12px] font-black text-white">
            로그인
          </Link>
        </div>
      )}

      {/* ── 카드 섹션 ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <RecentActivityCard />
        </div>
        <AiDiaryCard />
        <MyRoomCard />
        <div className="sm:col-span-2">
          <CreationsCard />
        </div>
        <div className="sm:col-span-2">
          <AchievementsCard />
        </div>
      </div>
    </main>
  );
}
