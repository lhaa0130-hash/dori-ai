"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, Plus, Minus, RotateCcw, Dices } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

// ---- Types ----
type GameState = "SETUP" | "ROLLING" | "FINISHED";

const DICE_FACES = [
    [{ x: 50, y: 50 }], // 1
    [{ x: 30, y: 30 }, { x: 70, y: 70 }], // 2
    [{ x: 30, y: 30 }, { x: 50, y: 50 }, { x: 70, y: 70 }], // 3
    [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 30, y: 70 }, { x: 70, y: 70 }], // 4
    [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 50, y: 50 }, { x: 30, y: 70 }, { x: 70, y: 70 }], // 5
    [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 30, y: 50 }, { x: 70, y: 50 }, { x: 30, y: 70 }, { x: 70, y: 70 }], // 6
];

const DICE_COLORS = ["#ef4444", "#F9954E", "#f59e0b", "#84cc16", "#3b82f6", "#8b5cf6"];

export default function DiceRollPage() {
    const { session } = useAuth();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState>("SETUP");

    // Setup State
    const [diceCount, setDiceCount] = useState(2);

    // Game State
    const [diceResults, setDiceResults] = useState<number[]>([]);
    const [isRolling, setIsRolling] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const rollDice = () => {
        setGameState("ROLLING");
        setIsRolling(true);
        setDiceResults([]);

        // Simulate rolling (1.5 seconds)
        setTimeout(() => {
            const results = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
            setDiceResults(results);
            setIsRolling(false);
            setGameState("FINISHED");

            // Trigger celebration if all dice show the same number (special case)
            if (results.every(r => r === results[0])) {
                bigBurst();
            } else {
                burst();
            }
        }, 1500);
    };

    const resetGame = () => {
        setGameState("SETUP");
        setDiceResults([]);
    };

    const handleDiceCountChange = (delta: number) => {
        const newCount = Math.max(1, Math.min(6, diceCount + delta));
        setDiceCount(newCount);
    };

    const renderDie = (value: number, index: number) => {
        const color = DICE_COLORS[index % DICE_COLORS.length];
        const dots = DICE_FACES[value - 1];

        return (
            <motion.div
                key={index}
                initial={{ scale: 0, rotate: 0 }}
                animate={
                    isRolling
                        ? {
                            rotate: [0, 360, 720, 1080],
                            scale: [1, 1.1, 0.9, 1],
                        }
                        : {
                            scale: 1,
                            rotate: 0,
                        }
                }
                transition={{
                    duration: 1.5,
                    ease: "easeOut",
                    delay: index * 0.1,
                }}
                className="relative w-24 h-24 rounded-2xl shadow-2xl"
                style={{
                    backgroundColor: color,
                    border: "4px solid rgba(255,255,255,0.3)",
                }}
            >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {dots.map((dot, i) => (
                        <circle
                            key={i}
                            cx={dot.x}
                            cy={dot.y}
                            r="8"
                            fill="white"
                            className="drop-shadow-lg"
                        />
                    ))}
                </svg>
            </motion.div>
        );
    };

    const totalSum = diceResults.reduce((sum, val) => sum + val, 0);
    const isDark = mounted && theme === "dark";

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            <div className="relative pt-5 pb-8 sm:pb-12 px-4 max-w-3xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        미니게임
                    </Link>
                    <h1 className="text-[15px] font-extrabold tracking-tight text-white">🎲 주사위 굴리기</h1>
                    <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                        <div className="text-[9px] uppercase tracking-widest text-neutral-500">DICE</div>
                        <div className="text-sm font-bold text-white tabular-nums">
                            <CountUp value={diceCount} className="tabular-nums" />
                        </div>
                    </div>
                </header>

                <div className="animate-fade-in">
                    {/* Game Card */}
                    <div className="arcade-card arcade-rise rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-8 md:p-12">

                        {/* Setup Screen */}
                        {gameState === "SETUP" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="text-center mb-8">
                                    <Dices className="arcade-float w-16 h-16 mx-auto mb-4 text-[#F9954E] drop-shadow-[0_8px_24px_rgba(249,149,78,0.4)]" />
                                    <h2 className="text-2xl font-extrabold tracking-tight mb-2">주사위 개수 선택</h2>
                                    <p className="text-neutral-400">
                                        굴릴 주사위 개수를 정하세요 (1~6개)
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-6 mb-10">
                                    <button
                                        onClick={() => handleDiceCountChange(-1)}
                                        className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 flex items-center justify-center hover:bg-white/[0.1] active:scale-[0.97] transition-all"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <div className="text-center w-24">
                                        <span key={diceCount} className="arcade-pop inline-block text-5xl font-extrabold tracking-tight text-[#F9954E] tabular-nums">{diceCount}</span>
                                        <span className="text-sm text-neutral-500 block mt-1">개</span>
                                    </div>
                                    <button
                                        onClick={() => handleDiceCountChange(1)}
                                        className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 flex items-center justify-center hover:bg-white/[0.1] active:scale-[0.97] transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <button
                                    onClick={rollDice}
                                    className="arcade-shine arcade-glow w-full py-4 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold text-lg shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    주사위 굴리기
                                </button>
                            </motion.div>
                        )}

                        {/* Rolling/Finished Screen */}
                        {(gameState === "ROLLING" || gameState === "FINISHED") && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Dice Display */}
                                <div className="flex flex-wrap justify-center gap-6 mb-8 min-h-[120px]">
                                    {isRolling
                                        ? // Show placeholder dice while rolling
                                        Array.from({ length: diceCount }).map((_, i) => renderDie(1, i))
                                        : // Show actual results
                                        diceResults.map((value, i) => renderDie(value, i))}
                                </div>

                                {/* Results */}
                                <AnimatePresence>
                                    {gameState === "FINISHED" && diceResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="arcade-pop-in text-center mb-8"
                                        >
                                            <div className="arcade-card rounded-2xl bg-white/[0.04] border border-white/10 p-8 mb-6">
                                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">
                                                    합계
                                                </div>
                                                <div key={totalSum} className="arcade-pop arcade-grad-text text-6xl font-black tabular-nums mb-2">
                                                    <CountUp value={totalSum} className="tabular-nums" />
                                                </div>
                                                <div className="text-sm text-neutral-400">
                                                    평균:{" "}
                                                    <span className="font-bold text-neutral-200 tabular-nums">
                                                        {(totalSum / diceCount).toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Special Messages */}
                                            {diceResults.every(r => r === diceResults[0]) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mb-4 p-4 rounded-xl bg-[#F9954E]/10 border border-[#F9954E]/20"
                                                >
                                                    <p className="text-lg font-bold text-[#F9954E]">
                                                        🎉 모든 주사위가 같은 숫자!
                                                    </p>
                                                </motion.div>
                                            )}

                                            {totalSum === diceCount * 6 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mb-4 p-4 rounded-xl bg-white/[0.06] border border-white/10"
                                                >
                                                    <p className="text-lg font-bold text-white">
                                                        🔥 전부 6! 최고의 행운!
                                                    </p>
                                                </motion.div>
                                            )}

                                            {totalSum === diceCount && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mb-4 p-4 bg-blue-500/15 rounded-xl"
                                                >
                                                    <p className="text-lg font-bold text-blue-400">
                                                        😅 전부 1! 재도전!
                                                    </p>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Buttons */}
                                {gameState === "FINISHED" && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={rollDice}
                                            className="arcade-shine flex-1 py-4 bg-gradient-to-b from-[#F9954E] to-[#E8832E] hover:brightness-110 active:scale-[0.97] text-white rounded-2xl font-bold shadow-lg shadow-[#F9954E]/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                            다시 굴리기
                                        </button>
                                        <button
                                            onClick={resetGame}
                                            className="px-6 py-4 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] active:scale-[0.97] text-neutral-200 rounded-2xl font-bold transition-all"
                                        >
                                            설정
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
