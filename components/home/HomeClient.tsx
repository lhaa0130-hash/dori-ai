"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface AttendanceData {
  lastDate: string;
  streak: number;
}

interface ProfileData {
  cottonCandy?: number;
  [key: string]: unknown;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getAttendance(email: string): AttendanceData {
  try {
    const raw = localStorage.getItem(`dori_attendance_${email}`);
    if (!raw) return { lastDate: "", streak: 0 };
    return JSON.parse(raw) as AttendanceData;
  } catch {
    return { lastDate: "", streak: 0 };
  }
}

function saveAttendance(email: string, data: AttendanceData) {
  localStorage.setItem(`dori_attendance_${email}`, JSON.stringify(data));
}

function getProfile(email: string): ProfileData {
  try {
    const raw = localStorage.getItem(`dori_profile_${email}`);
    if (!raw) return {};
    return JSON.parse(raw) as ProfileData;
  } catch {
    return {};
  }
}

function saveProfile(email: string, profile: ProfileData) {
  localStorage.setItem(`dori_profile_${email}`, JSON.stringify(profile));
}

export default function HomeClient() {
  const { session, status } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceData>({ lastDate: "", streak: 0 });
  const [cottonCandy, setCottonCandy] = useState<number>(0);
  const [checkedToday, setCheckedToday] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      const att = getAttendance(session.user.email);
      const profile = getProfile(session.user.email);
      setAttendance(att);
      setCottonCandy(profile.cottonCandy ?? 0);
      setCheckedToday(att.lastDate === getTodayStr());
    }
  }, [session?.user?.email]);

  const handleAttendance = () => {
    if (!session?.user?.email || checkedToday || checking) return;
    setChecking(true);

    const email = session.user.email;
    const today = getTodayStr();
    const att = getAttendance(email);

    // 연속 출석 계산
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const newStreak = att.lastDate === yesterdayStr ? att.streak + 1 : 1;

    const newAtt: AttendanceData = { lastDate: today, streak: newStreak };
    saveAttendance(email, newAtt);

    // 솜사탕 지급
    const profile = getProfile(email);
    const newCandy = (profile.cottonCandy ?? 0) + 50;
    saveProfile(email, { ...profile, cottonCandy: newCandy });

    setAttendance(newAtt);
    setCottonCandy(newCandy);
    setCheckedToday(true);
    setChecking(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  if (status === "loading") return null;

  const CANDY_WAYS = [
    { emoji: "📅", label: "출석 체크", desc: "매일 +50개", color: "text-orange-500" },
    { emoji: "🎮", label: "미니게임", desc: "게임마다 상이", color: "text-blue-500" },
    { emoji: "🧩", label: "퀴즈 정답", desc: "정답마다 +10개", color: "text-green-500" },
    { emoji: "🛒", label: "마켓 사용", desc: "솜사탕으로 구매", color: "text-purple-500" },
  ];

  return (
    <section className="w-full px-6 py-6">
      <div className="max-w-7xl mx-auto">
        {status === "unauthenticated" ? (
          // 비로그인: 로그인 CTA
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-[#F9954E]/10 to-[#FF7B54]/10 border border-[#F9954E]/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍭</span>
              <div>
                <p className="text-sm font-bold text-foreground">오늘 솜사탕 받으셨나요?</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">로그인하고 매일 출석 체크로 솜사탕을 모으세요!</p>
              </div>
            </div>
            <Link
              href="/auth/login"
              className="shrink-0 px-5 py-2 rounded-full bg-[#F9954E] text-white text-sm font-bold hover:bg-[#E8832E] transition-colors"
            >
              로그인하고 솜사탕 받기 →
            </Link>
          </motion.div>
        ) : (
          // 로그인: 출석 위젯
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative bg-gradient-to-r from-[#F9954E]/10 to-[#FF7B54]/10 border border-[#F9954E]/20 rounded-2xl p-5 overflow-hidden"
          >
            {/* 컨페티 효과 */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-4xl animate-bounce">🎉</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* 왼쪽: 솜사탕 잔액 + 연속 출석 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F9954E]/20 flex items-center justify-center text-2xl">
                  🍭
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">솜사탕 잔액</p>
                  <p className="text-xl font-extrabold text-[#F9954E]">
                    {cottonCandy.toLocaleString()}
                    <span className="text-sm font-medium text-neutral-500 ml-1">개</span>
                  </p>
                  {attendance.streak > 0 && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      🔥 연속 <span className="font-bold text-[#F9954E]">{attendance.streak}일</span> 출석 중
                    </p>
                  )}
                </div>
              </div>

              {/* 오른쪽: 출석 버튼 */}
              <div className="sm:ml-auto">
                {checkedToday ? (
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">✅ 오늘 출석 완료!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleAttendance}
                    disabled={checking}
                    className="px-5 py-2.5 rounded-full bg-[#F9954E] text-white text-sm font-bold shadow-md shadow-[#F9954E]/20 hover:bg-[#E8832E] hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
                  >
                    {checking ? "처리 중..." : "오늘 출석 체크 +50 🍭"}
                  </button>
                )}
              </div>
            </div>

            {/* 솜사탕 획득 방법 안내 */}
            <div className="mt-4 pt-4 border-t border-[#F9954E]/10">
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-3">🍭 솜사탕 획득 방법</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CANDY_WAYS.map((way) => (
                  <div key={way.label} className="flex items-center gap-2 bg-white/60 dark:bg-black/30 rounded-xl px-3 py-2">
                    <span className="text-lg">{way.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{way.label}</p>
                      <p className={`text-[10px] font-semibold ${way.color}`}>{way.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
