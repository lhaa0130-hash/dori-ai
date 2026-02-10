"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type Choice = "rock" | "paper" | "scissors";
type Result = "win" | "lose" | "draw";

const CHOICES: Choice[] = ["rock", "paper", "scissors"];
const EMOJIS = {
    rock: "✊",
    paper: "✋",
    scissors: "✌️",
};

export default function RockPaperScissorsPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
    const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [score, setScore] = useState({ win: 0, lose: 0, draw: 0 });
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    const determineWinner = (player: Choice, computer: Choice): Result => {
        if (player === computer) return "draw";
        if (
            (player === "rock" && computer === "scissors") ||
            (player === "paper" && computer === "rock") ||
            (player === "scissors" && computer === "paper")
        ) {
            return "win";
        }
        return "lose";
    };

    const play = (choice: Choice) => {
        setIsPlaying(true);
        setPlayerChoice(choice);
        setComputerChoice(null);
        setResult(null);

        setTimeout(() => {
            const computerPick = CHOICES[Math.floor(Math.random() * 3)];
            setComputerChoice(computerPick);

            const gameResult = determineWinner(choice, computerPick);
            setResult(gameResult);

            setScore(prev => ({
                ...prev,
                [gameResult]: prev[gameResult] + 1
            }));

            if (gameResult === "win") {
                triggerConfetti();
            }

            setIsPlaying(false);
        }, 1000);
    };

    const reset = () => {
        setPlayerChoice(null);
        setComputerChoice(null);
        setResult(null);
    };

    const resetAll = () => {
        reset();
        setScore({ win: 0, lose: 0, draw: 0 });
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">가위바위보</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
                <div className="animate-fade-in">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {/* Score Board */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <div className="text-3xl font-bold text-green-600">{score.win}</div>
                                <div className="text-sm text-neutral-600 dark:text-zinc-400">승리</div>
                            </div>
                            <div className="text-center p-4 bg-neutral-50 dark:bg-zinc-800 rounded-xl">
                                <div className="text-3xl font-bold text-neutral-600 dark:text-zinc-300">{score.draw}</div>
                                <div className="text-sm text-neutral-600 dark:text-zinc-400">무승부</div>
                            </div>
                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <div className="text-3xl font-bold text-red-600">{score.lose}</div>
                                <div className="text-sm text-neutral-600 dark:text-zinc-400">패배</div>
                            </div>
                        </div>

                        {/* Game Area */}
                        <div className="flex items-center justify-center gap-8 mb-8 min-h-[200px]">
                            {/* Player */}
                            <div className="text-center">
                                <div className="text-sm text-neutral-500 dark:text-zinc-400 mb-2">당신</div>
                                <motion.div
                                    className="text-8xl"
                                    animate={playerChoice ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                >
                                    {playerChoice ? EMOJIS[playerChoice] : "❓"}
                                </motion.div>
                            </div>

                            <div className="text-4xl">VS</div>

                            {/* Computer */}
                            <div className="text-center">
                                <div className="text-sm text-neutral-500 dark:text-zinc-400 mb-2">컴퓨터</div>
                                <motion.div
                                    className="text-8xl"
                                    animate={isPlaying ? { rotate: [0, 360] } : computerChoice ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: isPlaying ? 1 : 0.3 }}
                                >
                                    {isPlaying ? "❓" : computerChoice ? EMOJIS[computerChoice] : "❓"}
                                </motion.div>
                            </div>
                        </div>

                        {/* Result Message */}
                        <AnimatePresence mode="wait">
                            {result && (
                                <motion.div
                                    key={result}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className={`mb-6 p-4 rounded-xl text-center text-xl font-bold ${result === "win"
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : result === "lose"
                                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                                : "bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300"
                                        }`}
                                >
                                    {result === "win" ? "🎉 승리!" : result === "lose" ? "😢 패배..." : "🤝 무승부!"}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Choice Buttons */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {CHOICES.map((choice) => (
                                <button
                                    key={choice}
                                    onClick={() => play(choice)}
                                    disabled={isPlaying}
                                    className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 active:scale-95 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="text-5xl mb-2">{EMOJIS[choice]}</div>
                                    <div className="text-sm capitalize">{choice === "rock" ? "바위" : choice === "paper" ? "보" : "가위"}</div>
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {result && (
                                <button
                                    onClick={reset}
                                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
                                >
                                    다시 하기
                                </button>
                            )}
                            <button
                                onClick={resetAll}
                                className="px-6 py-3 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 rounded-xl font-bold transition-colors"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
