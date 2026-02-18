"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, Plus, Minus, RotateCcw, Dices } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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

    const triggerConfetti = () => {
        const count = 150;
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
    };

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

            // Trigger confetti if all dice show the same number (special case)
            if (results.every(r => r === results[0])) {
                triggerConfetti();
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
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">주사위 굴리기</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
                <div className="animate-fade-in">
                    {/* Game Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {/* Setup Screen */}
                        {gameState === "SETUP" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="text-center mb-8">
                                    <Dices className="w-16 h-16 mx-auto mb-4 text-red-500" />
                                    <h2 className="text-2xl font-bold mb-2">주사위 개수 선택</h2>
                                    <p className="text-neutral-500 dark:text-zinc-400">
                                        굴릴 주사위 개수를 정하세요 (1-6개)
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-6 mb-10">
                                    <button
                                        onClick={() => handleDiceCountChange(-1)}
                                        className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <div className="text-center w-24">
                                        <span className="text-5xl font-bold text-red-500">{diceCount}</span>
                                        <span className="text-sm text-neutral-400 block mt-1">개</span>
                                    </div>
                                    <button
                                        onClick={() => handleDiceCountChange(1)}
                                        className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <button
                                    onClick={rollDice}
                                    className="w-full py-4 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
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
                                            className="text-center mb-8"
                                        >
                                            <div className="bg-gradient-to-br from-red-50 to-[#FFF5EB] dark:from-red-900/20 dark:to-[#8F4B10]/20 rounded-2xl p-8 mb-6">
                                                <div className="text-sm text-neutral-600 dark:text-zinc-400 mb-2">
                                                    합계
                                                </div>
                                                <div className="text-6xl font-bold text-red-500 mb-2">
                                                    {totalSum}
                                                </div>
                                                <div className="text-sm text-neutral-500 dark:text-zinc-400">
                                                    평균:{" "}
                                                    <span className="font-bold">
                                                        {(totalSum / diceCount).toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Special Messages */}
                                            {diceResults.every(r => r === diceResults[0]) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl"
                                                >
                                                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                                                        🎉 모든 주사위가 같은 숫자!
                                                    </p>
                                                </motion.div>
                                            )}

                                            {totalSum === diceCount * 6 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mb-4 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl"
                                                >
                                                    <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                                                        🔥 전부 6! 최고점!
                                                    </p>
                                                </motion.div>
                                            )}

                                            {totalSum === diceCount && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl"
                                                >
                                                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
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
                                            className="flex-1 py-4 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                            다시 굴리기
                                        </button>
                                        <button
                                            onClick={resetGame}
                                            className="px-6 py-4 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 rounded-2xl font-bold transition-colors"
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
