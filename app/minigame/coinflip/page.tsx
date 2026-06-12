"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, Trophy, RotateCcw, Coins } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import CountUp from "@/components/game/CountUp";
import GameSuggestion from "@/components/game/GameSuggestion";
import { burst, bigBurst } from "@/lib/juice";

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

    const flipCoin = () => {
        setGameState("FLIPPING");
        setResult(null);
        setIsWinner(false);

        // Simulate coin flip (1.5 seconds)
        setTimeout(() => {
            const coinResult: CoinSide = Math.random() > 0.5 ? "앞면" : "뒷면";
            const won = coinResult === selectedBet;

            setResult(coinResult);
            setIsWinner(won);
            setGameState("FINISHED");
            setFlipCount(prev => prev + 1);
            setHistory(prev => [...prev, { bet: selectedBet, result: coinResult, won }]);

            if (won) {
                bigBurst();
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
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            {/* Header */}
            <header className="relative z-10 max-w-2xl mx-auto flex items-center justify-between px-4 pt-5 pb-4">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    미니게임
                </Link>
                <h1 className="text-[15px] font-extrabold tracking-tight text-white">🪙 동전 던지기</h1>
                <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">WINS</div>
                    <div className="text-sm font-bold text-white tabular-nums"><CountUp value={history.filter(h => h.won).length} className="tabular-nums" /></div>
                </div>
            </header>

            <div className="relative z-10 pt-1 sm:pt-2 pb-8 sm:pb-12 px-4 max-w-2xl mx-auto">
                <div className="animate-fade-in">
                    {/* Game Card */}
                    <div className="arcade-card arcade-rise rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-8 md:p-12">

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-8 mb-8">
                            <div className="text-center">
                                <div key={flipCount} className="arcade-pop inline-block text-3xl font-extrabold text-[#F9954E] tabular-nums"><CountUp value={flipCount} className="tabular-nums" /></div>
                                <div className="mt-1 text-[10px] uppercase tracking-widest text-neutral-500">총 던진 횟수</div>
                            </div>
                            <div className="h-12 w-px bg-white/10" />
                            <div className="text-center">
                                <div key={history.filter(h => h.won).length} className="arcade-pop inline-block text-3xl font-extrabold text-white tabular-nums">
                                    <CountUp value={history.filter(h => h.won).length} className="tabular-nums" />
                                </div>
                                <div className="mt-1 text-[10px] uppercase tracking-widest text-neutral-500">승리</div>
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
                                        className={`arcade-shine p-6 rounded-2xl border-2 transition-all active:scale-[0.97] font-bold text-lg ${selectedBet === "앞면"
                                                ? "border-yellow-500 bg-yellow-500/10 text-yellow-400 scale-105"
                                                : "border-white/10 hover:border-yellow-400"
                                            }`}
                                    >
                                        ⭐ 앞면
                                    </button>
                                    <button
                                        onClick={() => setSelectedBet("뒷면")}
                                        className={`arcade-shine p-6 rounded-2xl border-2 transition-all active:scale-[0.97] font-bold text-lg ${selectedBet === "뒷면"
                                                ? "border-yellow-500 bg-yellow-500/10 text-yellow-400 scale-105"
                                                : "border-white/10 hover:border-yellow-400"
                                            }`}
                                    >
                                        🌙 뒷면
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Coin Display */}
                        <div className="flex flex-col items-center gap-8 mb-8">
                            <div className={`relative w-48 h-48 perspective-1000 ${gameState === "SETUP" ? "arcade-float" : ""}`}>
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
                                        className={`arcade-pop-in p-6 rounded-2xl text-center ${isWinner
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
                                    className="arcade-shine arcade-glow flex-1 py-4 bg-yellow-500 hover:bg-yellow-600 active:scale-[0.97] text-white rounded-2xl font-bold text-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Coins className="w-5 h-5" />
                                    동전 던지기
                                </button>
                            )}
                            {gameState === "FINISHED" && (
                                <button
                                    onClick={resetGame}
                                    className="arcade-shine flex-1 py-4 bg-yellow-500 hover:bg-yellow-600 active:scale-[0.97] text-white rounded-2xl font-bold text-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    다시 던지기
                                </button>
                            )}
                        </div>

                        {/* History */}
                        {history.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h3 className="font-bold mb-4 text-center">최근 기록</h3>
                                <div className="grid gap-2 max-h-40 overflow-y-auto">
                                    {history
                                        .slice()
                                        .reverse()
                                        .slice(0, 5)
                                        .map((h, i) => (
                                            <div
                                                key={flipCount - i}
                                                className="flex items-center justify-between p-3 bg-white/[0.04] border border-white/10 rounded-lg text-sm"
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

                <GameSuggestion />
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
