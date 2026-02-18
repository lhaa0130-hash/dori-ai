"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RotateCcw, Coins, TrendingUp, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function CrashPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [coins, setCoins] = useState(1000);
    const [bet, setBet] = useState(50);
    const [multiplier, setMultiplier] = useState(1.0);
    const [crashPoint, setCrashPoint] = useState(0);
    const [gameState, setGameState] = useState<"BETTING" | "RUNNING" | "CRASHED" | "CASHED_OUT">("BETTING");
    const [cashedOutAt, setCashedOutAt] = useState(0);
    const [history, setHistory] = useState<{ crash: number; cashout: number | null; profit: number }[]>([]);
    const [totalGames, setTotalGames] = useState(0);
    const [totalWins, setTotalWins] = useState(0);
    const animRef = useRef<number>(0);
    const startTimeRef = useRef(0);

    useEffect(() => { setMounted(true); }, []);

    // 크래시 포인트 계산 (하우스 엣지 포함)
    const generateCrashPoint = (): number => {
        const r = Math.random();
        // 1% 확률로 1.0x 즉시 크래시, 나머지는 분포
        if (r < 0.01) return 1.0;
        const crash = 0.99 / (1 - r);
        return Math.min(Math.round(crash * 100) / 100, 100);
    };

    const startGame = useCallback(() => {
        if (coins < bet) return;
        setCoins(prev => prev - bet);
        setTotalGames(prev => prev + 1);

        const cp = generateCrashPoint();
        setCrashPoint(cp);
        setMultiplier(1.0);
        setCashedOutAt(0);
        setGameState("RUNNING");
        startTimeRef.current = Date.now();

        const animate = () => {
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            // 배수 상승 곡선: 천천히 시작해서 빠르게 증가
            const newMultiplier = Math.round((1 + elapsed * 0.15 + Math.pow(elapsed * 0.08, 2)) * 100) / 100;

            if (newMultiplier >= cp) {
                setMultiplier(cp);
                setGameState("CRASHED");
                setHistory(prev => [{ crash: cp, cashout: null, profit: -bet }, ...prev].slice(0, 10));
            } else {
                setMultiplier(newMultiplier);
                animRef.current = requestAnimationFrame(animate);
            }
        };

        animRef.current = requestAnimationFrame(animate);
    }, [bet, coins]);

    const cashOut = useCallback(() => {
        if (gameState !== "RUNNING") return;
        cancelAnimationFrame(animRef.current);

        const winAmount = Math.floor(bet * multiplier);
        setCoins(prev => prev + winAmount);
        setCashedOutAt(multiplier);
        setGameState("CASHED_OUT");
        setTotalWins(prev => prev + 1);
        setHistory(prev => [{ crash: crashPoint, cashout: multiplier, profit: winAmount - bet }, ...prev].slice(0, 10));

        if (multiplier >= 3) {
            confetti({ particleCount: Math.min(multiplier * 30, 200), spread: 70, origin: { y: 0.6 } });
        }
    }, [gameState, bet, multiplier, crashPoint]);

    useEffect(() => {
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    const getMultiplierColor = () => {
        if (gameState === "CRASHED") return "text-red-500";
        if (gameState === "CASHED_OUT") return "text-green-500";
        if (multiplier >= 5) return "text-yellow-400";
        if (multiplier >= 3) return "text-[#F9954E]";
        if (multiplier >= 2) return "text-green-500";
        return "text-white";
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">📈 크래시</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-lg mx-auto">
                <div className="animate-fade-in">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-2xl font-bold text-yellow-500">{coins.toLocaleString()}</span>
                        <span className="text-sm text-neutral-500">코인</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {/* 그래프 영역 */}
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 mb-6 min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden">
                            {/* 배경 그리드 */}
                            <div className="absolute inset-0 opacity-10">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="absolute w-full border-t border-white" style={{ top: `${(i + 1) * 20}%` }} />
                                ))}
                            </div>

                            {/* 배수 표시 */}
                            <motion.div
                                animate={gameState === "RUNNING" ? { scale: [1, 1.05, 1] } : gameState === "CRASHED" ? { scale: [1, 1.3, 0.9, 1] } : {}}
                                transition={{ duration: 0.3 }}
                                className="text-center z-10"
                            >
                                <div className={`text-6xl md:text-7xl font-black ${getMultiplierColor()} transition-colors duration-200`}>
                                    {multiplier.toFixed(2)}×
                                </div>
                                {gameState === "CRASHED" && (
                                    <p className="text-red-400 font-bold mt-2 text-lg animate-pulse">💥 CRASHED!</p>
                                )}
                                {gameState === "CASHED_OUT" && (
                                    <p className="text-green-400 font-bold mt-2 text-lg">
                                        💰 {cashedOutAt.toFixed(2)}×에서 캐시아웃! (+{Math.floor(bet * cashedOutAt - bet)})
                                    </p>
                                )}
                                {gameState === "RUNNING" && (
                                    <p className="text-white/50 font-bold mt-2 text-sm animate-pulse">
                                        <TrendingUp className="w-4 h-4 inline mr-1" />상승 중...
                                    </p>
                                )}
                            </motion.div>

                            {/* 상승 바 */}
                            {gameState === "RUNNING" && (
                                <div className="absolute bottom-0 left-0 right-0">
                                    <motion.div
                                        className="h-1 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400"
                                        animate={{ scaleX: [0, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 캐시아웃 (게임 중) */}
                        {gameState === "RUNNING" && (
                            <button onClick={cashOut}
                                className="w-full py-5 rounded-2xl font-black text-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] transition-all mb-4 animate-pulse">
                                💰 캐시아웃 ({Math.floor(bet * multiplier)} 코인)
                            </button>
                        )}

                        {/* 배팅 (대기 중) */}
                        {(gameState === "BETTING" || gameState === "CRASHED" || gameState === "CASHED_OUT") && (
                            <>
                                <div className="flex items-center justify-between mb-4 p-4 bg-neutral-50 dark:bg-zinc-800 rounded-2xl">
                                    <span className="text-sm font-bold text-neutral-500">배팅</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setBet(prev => Math.max(10, prev - 10))} disabled={bet <= 10}
                                            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center disabled:opacity-30">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xl font-bold text-yellow-500 w-16 text-center">{bet}</span>
                                        <button onClick={() => setBet(prev => Math.min(prev + 10, coins))} disabled={bet >= coins}
                                            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center disabled:opacity-30">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    {[10, 50, 100, 500].map(a => (
                                        <button key={a} onClick={() => setBet(Math.min(a, coins))} disabled={coins < a}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${bet === a ? "bg-yellow-500 text-white" : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 disabled:opacity-30"}`}>
                                            {a}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={startGame} disabled={coins < bet}
                                    className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-[#F9954E] to-red-500 text-white shadow-lg shadow-[#F9954E]/20 hover:from-[#E8832E] hover:to-red-600 active:scale-[0.98] transition-all disabled:opacity-30">
                                    🚀 배팅하기
                                </button>
                                {coins < 10 && (
                                    <button onClick={() => { setCoins(1000); setTotalGames(0); setTotalWins(0); setBet(50); setHistory([]); setGameState("BETTING"); }}
                                        className="w-full mt-3 py-3 rounded-2xl bg-neutral-100 dark:bg-zinc-800 text-sm font-bold flex items-center justify-center gap-2">
                                        <RotateCcw className="w-4 h-4" /> 1,000 코인으로 다시 시작
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* 히스토리 */}
                    {history.length > 0 && (
                        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-neutral-100 dark:border-white/5">
                            <h3 className="font-bold text-sm mb-3">최근 기록</h3>
                            <div className="flex flex-wrap gap-2">
                                {history.map((h, i) => (
                                    <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold ${h.cashout ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                        }`}>
                                        {h.cashout ? `${h.cashout.toFixed(2)}×` : `💥${h.crash.toFixed(2)}×`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-[#F9954E]">{totalGames}</div>
                            <div className="text-xs text-neutral-500">게임</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-green-500">{totalWins}</div>
                            <div className="text-xs text-neutral-500">캐시아웃</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-purple-500">{totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0}%</div>
                            <div className="text-xs text-neutral-500">성공률</div>
                        </div>
                    </div>
                    <p className="text-[10px] text-center text-neutral-400 mt-6">※ 가상 코인 게임이며, 실제 금전 거래와 무관합니다.</p>
                </div>
            </div>
        </main>
    );
}
