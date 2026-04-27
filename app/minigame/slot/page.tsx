"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, RotateCcw, Trophy, Coins, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays } from "@/lib/cottonCandy";

// 슬롯 심볼
const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
const REEL_COUNT = 3;

// 배당표
const PAYOUTS: Record<string, number> = {
    "7️⃣7️⃣7️⃣": 50,
    "💎💎💎": 30,
    "⭐⭐⭐": 20,
    "🍇🍇🍇": 10,
    "🍊🍊🍊": 7,
    "🍋🍋🍋": 5,
    "🍒🍒🍒": 3,
};

export default function SlotMachinePage() {
    const { session } = useAuth();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [coins, setCoins] = useState(1000);
    const [bet, setBet] = useState(10);
    const [reels, setReels] = useState(["🍒", "⭐", "🍇"]);
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<{ win: boolean; payout: number; message: string } | null>(null);
    const [spinReels, setSpinReels] = useState([false, false, false]);
    const [totalWins, setTotalWins] = useState(0);
    const [totalSpins, setTotalSpins] = useState(0);
    const [showPaytable, setShowPaytable] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const triggerConfetti = (multiplier: number) => {
        const intensity = Math.min(multiplier / 10, 1);
        confetti({
            particleCount: Math.floor(100 * intensity + 50),
            spread: 70 + multiplier * 5,
            origin: { y: 0.6 },
            colors: ["#f59e0b", "#ef4444", "#8b5cf6", "#10b981"],
        });
    };

    const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    const spin = () => {
        if (spinning || coins < bet) return;

        setSpinning(true);
        setResult(null);
        setCoins(prev => prev - bet);
        setTotalSpins(prev => prev + 1);
        setSpinReels([true, true, true]);

        // 릴 스톱 타이밍
        const finalReels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];

        // 릴 1 정지
        setTimeout(() => {
            setReels(prev => [finalReels[0], prev[1], prev[2]]);
            setSpinReels(prev => [false, prev[1], prev[2]]);
        }, 800);

        // 릴 2 정지
        setTimeout(() => {
            setReels(prev => [prev[0], finalReels[1], prev[2]]);
            setSpinReels(prev => [prev[0], false, prev[2]]);
        }, 1300);

        // 릴 3 정지 + 결과
        setTimeout(() => {
            setReels(finalReels);
            setSpinReels([false, false, false]);
            setSpinning(false);

            const key = finalReels.join("");
            const payoutMultiplier = PAYOUTS[key];

            if (payoutMultiplier) {
                const winAmount = bet * payoutMultiplier;
                setCoins(prev => prev + winAmount);
                setTotalWins(prev => prev + 1);
                setResult({ win: true, payout: winAmount, message: `${payoutMultiplier}배 당첨! 🎉` });
                triggerConfetti(payoutMultiplier);
                if (session?.user?.email) {
                    const candy = Math.max(1, Math.floor(winAmount / 10));
                    addCottonCandy(session.user.email, candy, "슬롯머신 당첨");
                    incrementMinigamePlays(session.user.email);
                }
            } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2]) {
                // 2개 일치 - 배팅금 반환
                setCoins(prev => prev + bet);
                setResult({ win: false, payout: bet, message: "2개 일치! 배팅금 반환 🔄" });
            } else {
                setResult({ win: false, payout: 0, message: "아쉽네요... 다시 도전! 😢" });
            }
        }, 1800);
    };

    const adjustBet = (amount: number) => {
        setBet(prev => Math.max(10, Math.min(prev + amount, coins)));
    };

    const isDark = mounted && theme === "dark";

    // 스피닝 중 랜덤 심볼 애니메이션
    useEffect(() => {
        if (!spinning) return;
        const interval = setInterval(() => {
            setReels(prev =>
                prev.map((s, i) => (spinReels[i] ? getRandomSymbol() : s))
            );
        }, 80);
        return () => clearInterval(interval);
    }, [spinning, spinReels]);

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">🎰 슬롯머신</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-lg mx-auto">
                <div className="animate-fade-in">

                    {/* 코인 잔액 */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-2xl font-bold text-yellow-500">{coins.toLocaleString()}</span>
                        <span className="text-sm text-neutral-500">코인</span>
                    </div>

                    {/* 메인 게임 카드 */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {/* 슬롯 머신 */}
                        <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-2xl p-6 mb-6 shadow-inner relative overflow-hidden">
                            {/* 장식 조명 */}
                            <div className="absolute top-2 left-0 right-0 flex justify-center gap-3">
                                {[...Array(7)].map((_, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${spinning ? "animate-pulse" : ""}`}
                                        style={{ backgroundColor: ["#fbbf24", "#ef4444", "#22c55e", "#3b82f6", "#fbbf24", "#ef4444", "#22c55e"][i], animationDelay: `${i * 0.15}s` }}
                                    />
                                ))}
                            </div>

                            {/* 릴 디스플레이 */}
                            <div className="flex items-center justify-center gap-3 mt-4">
                                {reels.map((symbol, i) => (
                                    <div key={i} className="w-24 h-28 bg-white dark:bg-zinc-100 rounded-xl flex items-center justify-center shadow-inner border-2 border-yellow-400 relative overflow-hidden">
                                        <motion.span
                                            className="text-5xl"
                                            animate={spinReels[i] ? { y: [0, -10, 10, 0] } : {}}
                                            transition={{ duration: 0.08, repeat: spinReels[i] ? Infinity : 0 }}
                                        >
                                            {symbol}
                                        </motion.span>
                                        {/* 광택 효과 */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                                    </div>
                                ))}
                            </div>

                            {/* 라인 표시 */}
                            <div className="absolute left-4 right-4 top-1/2 -translate-y-1 pointer-events-none">
                                <div className="h-0.5 bg-yellow-400/40 mt-3" />
                            </div>
                        </div>

                        {/* 결과 표시 */}
                        <AnimatePresence mode="wait">
                            {result && (
                                <motion.div
                                    key="result"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className={`text-center p-4 rounded-2xl mb-6 font-bold ${result.win
                                            ? "bg-gradient-to-r from-yellow-400/20 to-[#FBAA60]/20 text-yellow-600 dark:text-yellow-400"
                                            : result.payout > 0
                                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500"
                                        }`}
                                >
                                    <p className="text-lg">{result.message}</p>
                                    {result.payout > 0 && (
                                        <p className="text-sm mt-1 opacity-75">+{result.payout.toLocaleString()} 코인</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 배팅 설정 */}
                        <div className="flex items-center justify-between mb-6 p-4 bg-neutral-50 dark:bg-zinc-800 rounded-2xl">
                            <span className="text-sm font-bold text-neutral-500">배팅 금액</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => adjustBet(-10)}
                                    disabled={bet <= 10 || spinning}
                                    className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-zinc-600 disabled:opacity-30 transition-colors"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xl font-bold text-yellow-500 w-16 text-center">{bet}</span>
                                <button
                                    onClick={() => adjustBet(10)}
                                    disabled={bet >= coins || spinning}
                                    className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center hover:bg-neutral-300 dark:hover:bg-zinc-600 disabled:opacity-30 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        {/* 퀵 배팅 */}
                        <div className="flex gap-2 mb-6">
                            {[10, 50, 100, 500].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setBet(Math.min(amount, coins))}
                                    disabled={spinning || coins < amount}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${bet === amount
                                            ? "bg-yellow-500 text-white"
                                            : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                                        }`}
                                >
                                    {amount}
                                </button>
                            ))}
                        </div>

                        {/* 스핀 버튼 */}
                        <button
                            onClick={spin}
                            disabled={spinning || coins < bet}
                            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${spinning
                                    ? "bg-neutral-300 dark:bg-zinc-700 text-neutral-500 cursor-not-allowed"
                                    : coins < bet
                                        ? "bg-neutral-300 dark:bg-zinc-700 text-neutral-500 cursor-not-allowed"
                                        : "bg-gradient-to-r from-yellow-500 to-[#F9954E] text-white hover:from-yellow-600 hover:to-[#E8832E] active:scale-[0.98] shadow-yellow-500/20"
                                }`}
                        >
                            {spinning ? (
                                <span className="animate-pulse">🎰 회전 중...</span>
                            ) : coins < bet ? (
                                "코인 부족!"
                            ) : (
                                <>
                                    <span className="text-xl">🎰</span>
                                    SPIN!
                                </>
                            )}
                        </button>

                        {/* 코인 부족 시 리셋 */}
                        {coins < 10 && !spinning && (
                            <button
                                onClick={() => { setCoins(1000); setTotalSpins(0); setTotalWins(0); setBet(10); setResult(null); }}
                                className="w-full mt-3 py-3 rounded-2xl bg-neutral-100 dark:bg-zinc-800 text-sm font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                1,000 코인으로 다시 시작
                            </button>
                        )}
                    </div>

                    {/* 통계 */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-[#F9954E]">{totalSpins}</div>
                            <div className="text-xs text-neutral-500">총 스핀</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-green-500">{totalWins}</div>
                            <div className="text-xs text-neutral-500">당첨</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-purple-500">
                                {totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) : 0}%
                            </div>
                            <div className="text-xs text-neutral-500">당첨률</div>
                        </div>
                    </div>

                    {/* 배당표 */}
                    <button
                        onClick={() => setShowPaytable(!showPaytable)}
                        className="w-full mt-4 py-3 text-sm font-bold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                        {showPaytable ? "배당표 닫기 ▲" : "배당표 보기 ▼"}
                    </button>

                    <AnimatePresence>
                        {showPaytable && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-neutral-100 dark:border-white/5">
                                    <h3 className="font-bold text-center mb-4 text-sm">🏆 배당표</h3>
                                    <div className="space-y-2">
                                        {Object.entries(PAYOUTS).map(([symbols, multiplier]) => (
                                            <div key={symbols} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-zinc-800">
                                                <span className="text-xl tracking-wider">{symbols.match(/.{2}/g)?.join(" ")}</span>
                                                <span className={`font-bold text-sm ${multiplier >= 30 ? "text-yellow-500" : multiplier >= 10 ? "text-[#F9954E]" : "text-neutral-600 dark:text-neutral-400"
                                                    }`}>×{multiplier}</span>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-zinc-800 opacity-60">
                                            <span className="text-sm">2개 일치</span>
                                            <span className="font-bold text-sm text-blue-500">배팅금 반환</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center text-neutral-400 mt-4">
                                        ※ 이 게임은 가상 코인을 사용하며, 실제 금전 거래와 무관합니다.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
