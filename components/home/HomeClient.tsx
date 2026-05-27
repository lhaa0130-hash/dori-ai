"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getCottonCandyBalance, getAttendanceData, checkAttendance } from "@/lib/cottonCandy";

function getTodayStr(): string {
  // toISOString()은 UTC 기준 → 한국 자정~오전9시 사이에 어제 날짜 반환하는 버그 방지
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function HomeClient() {
  const { session, status } = useAuth();
  const [attendance, setAttendance] = useState<{ streak: number }>({ streak: 0 });
  const [cottonCandy, setCottonCandy] = useState<number>(0);
  const [checkedToday, setCheckedToday] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // 마이페이지와 동일한 솜사탕/출석 시스템(Firestore 연동)을 공유
  const refresh = (email: string) => {
    const att = getAttendanceData(email);
    setAttendance({ streak: att.streak || 0 });
    setCottonCandy(getCottonCandyBalance(email));
    setCheckedToday(att.lastChecked === getTodayStr());
  };

  useEffect(() => {
    if (session?.user?.email) refresh(session.user.email);
  }, [session?.user?.email]);

  // 다른 기기 로그인 등 Firestore 동기화가 끝나면 화면 갱신
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

    const email = session.user.email;
    const result = checkAttendance(email); // 솜사탕 지급 + Firestore 저장까지 처리
    if (result.success) {
      refresh(email);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
    setChecking(false);
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
              href="/login"
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
