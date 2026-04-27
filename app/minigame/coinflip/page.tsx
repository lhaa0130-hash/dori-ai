"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, Trophy, RotateCcw, Coins } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays } from "@/lib/cottonCandy";

// ---- Types ----
type GameState = "SETUP" | "FLIPPING" | "FINISHED";
type CoinSide = "앞면" | "뒷면";

export default function CoinFlipPage() {
    const { session } = useAuth();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState>("SETUP");

    // Game State
    const [selectedBet, setSelectedBet] = useState<CoinSide>("앞면");
    const [result, setResult] = useState<CoinSide | null>(null);
    const [isWinner, setIsWinner] = useState(false);
    const [flipCount, setFlipCount] = useState(0);
    const [history, setHistory] = useState<{ bet: CoinSide; result: CoinSide; won: boolean }[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const triggerConfetti = () => {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    const flipCoin = () => {
        setGameState("FLIPPING");
        setResult(null);
        setIsWinner(false);

        // Simulate coin flip (1.5 seconds)
        setTimeout(() => {
            const coinResult: CoinSide = Math.random() > 0.5 ? "앞면" : "뒷면";
            const won = coinResult === selectedBet;

            if (won && session?.user?.email) {
                addCottonCandy(session.user.email, 10, "동전 던지기 승리");
                incrementMinigamePlays(session.user.email);
            }

            setResult(coinResult);
            setIsWinner(won);
            setGameState("FINISHED");
            setFlipCount(prev => prev + 1);
            setHistory(prev => [...prev, { bet: selectedBet, result: coinResult, won }]);

            if (won) {
                triggerConfetti();
            }
        }, 1500);
    };

    const resetGame = () => {
        setGameState("SETUP");
        setResult(null);
        setIsWinner(false);
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">동전 던지기</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
                <div className="animate-fade-in">
                    {/* Game Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[#F9954E]">{flipCount}</div>
                                <div className="text-sm text-neutral-500 dark:text-zinc-400">총 던진 횟수</div>
                            </div>
                            <div className="h-12 w-px bg-neutral-200 dark:bg-zinc-700" />
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-500">
                                    {history.filter(h => h.won).length}
                                </div>
                                <div className="text-sm text-neutral-500 dark:text-zinc-400">승리</div>
                            </div>
                        </div>

                        {/* Bet Selection */}
                        {gameState === "SETUP" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8"
                            >
                                <h3 className="text-center text-lg font-bold mb-4">어느 면에 베팅하시겠습니까?</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSelectedBet("앞면")}
                                        className={`p-6 rounded-2xl border-2 transition-all font-bold text-lg ${selectedBet === "앞면"
                                                ? "border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 scale-105"
                                                : "border-neutral-200 dark:border-zinc-700 hover:border-yellow-400"
                                            }`}
                                    >
                                        ⭐ 앞면
                                    </button>
                                    <button
                                        onClick={() => setSelectedBet("뒷면")}
                                        className={`p-6 rounded-2xl border-2 transition-all font-bold text-lg ${selectedBet === "뒷면"
                                                ? "border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 scale-105"
                                                : "border-neutral-200 dark:border-zinc-700 hover:border-yellow-400"
                                            }`}
                                    >
                                        🌙 뒷면
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Coin Display */}
                        <div className="flex flex-col items-center gap-8 mb-8">
                            <div className="relative w-48 h-48 perspective-1000">
                                <motion.div
                                    className="w-full h-full relative preserve-3d"
                                    animate={
                                        gameState === "FLIPPING"
                                            ? {
                                                rotateY: [0, 1800],
                                            }
                                            : gameState === "FINISHED" && result
                                                ? {
                                                    rotateY: result === "앞면" ? 0 : 180,
                                                }
                                                : {}
                                    }
                                    transition={{
                                        duration: gameState === "FLIPPING" ? 1.5 : 0.5,
                                        ease: "easeOut",
                                    }}
                                >
                                    {/* Front (앞면) */}
                                    <div className="absolute w-full h-full backface-hidden rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 shadow-2xl flex items-center justify-center border-8 border-yellow-600">
                                        <span className="text-6xl">⭐</span>
                                    </div>
                                    {/* Back (뒷면) */}
                                    <div
                                        className="absolute w-full h-full backface-hidden rounded-full bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 shadow-2xl flex items-center justify-center border-8 border-slate-700"
                                        style={{ transform: "rotateY(180deg)" }}
                                    >
                                        <span className="text-6xl">🌙</span>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Result Display */}
                            <AnimatePresence mode="wait">
                                {gameState === "FINISHED" && result && (
                                    <motion.div
                                        key="result"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className={`p-6 rounded-2xl text-center ${isWinner
                                                ? "bg-gradient-to-br from-green-400 to-green-600"
                                                : "bg-gradient-to-br from-red-400 to-red-600"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 justify-center mb-2">
                                            {isWinner ? (
                                                <Trophy className="w-6 h-6 text-white" />
                                            ) : (
                                                <span className="text-2xl">😢</span>
                                            )}
                                            <h3 className="text-2xl font-bold text-white">
                                                {isWinner ? "당첨!" : "아쉽네요!"}
                                            </h3>
                                        </div>
                                        <p className="text-white text-lg">
                                            결과: <span className="font-bold">{result}</span>
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {gameState === "SETUP" && (
                                <button
                                    onClick={flipCoin}
                                    className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-600 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Coins className="w-5 h-5" />
                                    동전 던지기
                                </button>
                            )}
                            {gameState === "FINISHED" && (
                                <button
                                    onClick={resetGame}
                                    className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-600 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    다시 던지기
                                </button>
                            )}
                        </div>

                        {/* History */}
                        {history.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-zinc-700">
                                <h3 className="font-bold mb-4 text-center">최근 기록</h3>
                                <div className="grid gap-2 max-h-40 overflow-y-auto">
                                    {history
                                        .slice()
                                        .reverse()
                                        .slice(0, 5)
                                        .map((h, i) => (
                                            <div
                                                key={flipCount - i}
                                                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-zinc-800 rounded-lg text-sm"
                                            >
                                                <span>
                                                    베팅: <strong>{h.bet}</strong>
                                                </span>
                                                <span>→</span>
                                                <span>
                                                    결과: <strong>{h.result}</strong>
                                                </span>
                                                <span
                                                    className={`font-bold ${h.won ? "text-green-500" : "text-red-500"
                                                        }`}
                                                >
                                                    {h.won ? "승" : "패"}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
            `}</style>
        </main>
    );
}
