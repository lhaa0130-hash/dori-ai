"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, RotateCcw, Trophy, Coins, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import CountUp from "@/components/game/CountUp";
import GameSuggestion from "@/components/game/GameSuggestion";
import { burst, bigBurst } from "@/lib/juice";

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
        // 잭팟급(10배 이상)은 큰 축하, 그 외엔 가벼운 축하
        if (multiplier >= 10) {
            bigBurst();
        } else {
            burst();
        }
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
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-16 bg-[#09090e]/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> 뒤로
                </Link>
                <h1 className="text-[15px] font-extrabold tracking-tight text-white">🎰 슬롯머신</h1>
                <div className="w-9" />
            </header>

            <div className="relative z-10 pt-20 pb-8 sm:pb-12 px-4 max-w-lg mx-auto">
                <div className="animate-fade-in">

                    {/* 코인 잔액 */}
                    <div className="flex items-center justify-center gap-2 mb-6 arcade-rise">
                        <Coins className="w-5 h-5 text-[#F9954E] arcade-float" />
                        <span key={coins} className="arcade-pop inline-block text-2xl font-bold text-[#F9954E]">
                            <CountUp value={coins} className="tabular-nums" />
                        </span>
                        <span className="text-sm text-neutral-500">코인</span>
                    </div>

                    {/* 메인 게임 카드 */}
                    <div className="arcade-card arcade-rise-1 rounded-3xl p-6 md:p-8 bg-white/[0.04] border border-white/10">

                        {/* 슬롯 머신 */}
                        <div className="bg-gradient-to-b from-[#3a1212] to-[#1a0808] rounded-2xl p-6 mb-6 shadow-inner border border-[#F9954E]/20 relative overflow-hidden">
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
                                    <div key={i} className="w-24 h-28 bg-gradient-to-b from-white to-zinc-200 rounded-xl flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.25)] border-2 border-[#F9954E]/60 relative overflow-hidden">
                                        <motion.span
                                            className={`text-5xl drop-shadow-sm ${!spinning && result?.win ? "arcade-float" : ""}`}
                                            animate={spinReels[i] ? { y: [0, -10, 10, 0] } : {}}
                                            transition={{ duration: 0.08, repeat: spinReels[i] ? Infinity : 0 }}
                                        >
                                            {symbol}
                                        </motion.span>
                                        {/* 광택 효과 */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                                    </div>
                                ))}
                            </div>

                            {/* 라인 표시 */}
                            <div className="absolute left-4 right-4 top-1/2 -translate-y-1 pointer-events-none">
                                <div className="h-0.5 bg-[#F9954E]/40 mt-3" />
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
                                    className={`arcade-pop-in text-center p-4 rounded-2xl mb-6 font-bold ${result.win
                                            ? "bg-gradient-to-r from-[#F9954E]/20 to-yellow-400/20 text-[#F9954E]"
                                            : result.payout > 0
                                                ? "bg-white/[0.06] text-neutral-200"
                                                : "bg-white/[0.04] text-neutral-500"
                                        }`}
                                >
                                    <p className="text-lg">{result.message}</p>
                                    {result.payout > 0 && (
                                        result.win ? (
                                            <p className="mt-1">
                                                <span className="arcade-grad-text text-3xl font-extrabold">
                                                    +<CountUp value={result.payout} className="tabular-nums" />
                                                </span>
                                                <span className="text-sm ml-1 opacity-80">코인</span>
                                            </p>
                                        ) : (
                                            <p className="text-sm mt-1 opacity-75">+{result.payout.toLocaleString()} 코인</p>
                                        )
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 배팅 설정 */}
                        <div className="flex items-center justify-between mb-6 p-4 bg-white/[0.04] border border-white/10 rounded-2xl">
                            <span className="text-sm font-bold text-neutral-500">배팅 금액</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => adjustBet(-10)}
                                    disabled={bet <= 10 || spinning}
                                    className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.12] disabled:opacity-30 transition-colors active:scale-[0.97] transition-transform"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span key={bet} className="arcade-pop inline-block text-xl font-bold text-[#F9954E] w-16 text-center tabular-nums">{bet}</span>
                                <button
                                    onClick={() => adjustBet(10)}
                                    disabled={bet >= coins || spinning}
                                    className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.12] disabled:opacity-30 transition-colors active:scale-[0.97] transition-transform"
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
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${bet === amount
                                            ? "bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white shadow-md shadow-[#F9954E]/20"
                                            : "bg-white/[0.06] border border-white/10 text-neutral-300 hover:bg-white/[0.12] disabled:opacity-30"
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
                            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${spinning
                                    ? "bg-white/[0.06] text-neutral-500 cursor-not-allowed"
                                    : coins < bet
                                        ? "bg-white/[0.06] text-neutral-500 cursor-not-allowed"
                                        : "arcade-shine arcade-glow bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white hover:brightness-110 shadow-[#F9954E]/20"
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
                                className="w-full mt-3 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-sm font-bold text-neutral-300 hover:bg-white/[0.12] transition-colors active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                1,000 코인으로 다시 시작
                            </button>
                        )}
                    </div>

                    {/* 통계 */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="arcade-card arcade-rise-1 rounded-2xl p-4 text-center bg-white/[0.04] border border-white/10">
                            <div className="text-2xl font-bold text-[#F9954E]">
                                <CountUp value={totalSpins} className="tabular-nums" />
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">총 스핀</div>
                        </div>
                        <div className="arcade-card arcade-rise-2 rounded-2xl p-4 text-center bg-white/[0.04] border border-white/10">
                            <div className="text-2xl font-bold text-emerald-400">
                                <CountUp value={totalWins} className="tabular-nums" />
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">당첨</div>
                        </div>
                        <div className="arcade-card arcade-rise-3 rounded-2xl p-4 text-center bg-white/[0.04] border border-white/10">
                            <div className="text-2xl font-bold text-white tabular-nums">
                                <CountUp value={totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) : 0} className="tabular-nums" />%
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">당첨률</div>
                        </div>
                    </div>

                    {/* 배당표 */}
                    <button
                        onClick={() => setShowPaytable(!showPaytable)}
                        className="w-full mt-4 py-3 text-sm font-bold text-neutral-500 hover:text-white transition-colors"
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
                                <div className="bg-white/[0.04] rounded-2xl p-5 border border-white/10">
                                    <h3 className="font-bold text-center mb-4 text-sm">🏆 배당표</h3>
                                    <div className="space-y-2">
                                        {Object.entries(PAYOUTS).map(([symbols, multiplier]) => (
                                            <div key={symbols} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.05]">
                                                <span className="text-xl tracking-wider">{symbols.match(/.{2}/g)?.join(" ")}</span>
                                                <span className={`font-bold text-sm ${multiplier >= 30 ? "text-yellow-400" : multiplier >= 10 ? "text-[#F9954E]" : "text-neutral-400"
                                                    }`}>×{multiplier}</span>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.05] opacity-60">
                                            <span className="text-sm">2개 일치</span>
                                            <span className="font-bold text-sm text-neutral-300">배팅금 반환</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center text-neutral-500 mt-4">
                                        ※ 이 게임은 가상 코인을 사용하며, 실제 금전 거래와 무관합니다.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <GameSuggestion />
                </div>
            </div>
        </main>
    );
}
