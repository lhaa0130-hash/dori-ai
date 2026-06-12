"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import CountUp from "@/components/game/CountUp";
import { bigBurst } from "@/lib/juice";

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
    const { session } = useAuth();
    const [mounted, setMounted] = useState(false);

    const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
    const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [score, setScore] = useState({ win: 0, lose: 0, draw: 0 });
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
                bigBurst();
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
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            <div className="relative pt-4 sm:pt-6 pb-8 sm:pb-12 px-4 max-w-2xl mx-auto">
                <header className="flex items-center justify-between mb-5">
                    <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        미니게임
                    </Link>
                    <h1 className="text-[15px] font-extrabold tracking-tight text-white">✊ 가위바위보</h1>
                    <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                        <div className="text-[9px] uppercase tracking-widest text-neutral-500">WIN</div>
                        <CountUp value={score.win} className="block text-sm font-bold text-white tabular-nums" />
                    </div>
                </header>

                <div className="animate-fade-in">
                    <div className="arcade-card arcade-rise rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-6 sm:p-8 md:p-12">

                        {/* Score Board */}
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            <div className="arcade-card arcade-rise-1 text-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                <span key={score.win} className="arcade-pop inline-block">
                                    <CountUp value={score.win} className="text-3xl font-extrabold tabular-nums text-[#F9954E]" />
                                </span>
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">승리</div>
                            </div>
                            <div className="arcade-card arcade-rise-2 text-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                <span key={score.draw} className="arcade-pop inline-block">
                                    <CountUp value={score.draw} className="text-3xl font-extrabold tabular-nums text-white" />
                                </span>
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">무승부</div>
                            </div>
                            <div className="arcade-card arcade-rise-3 text-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                <span key={score.lose} className="arcade-pop inline-block">
                                    <CountUp value={score.lose} className="text-3xl font-extrabold tabular-nums text-neutral-400" />
                                </span>
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">패배</div>
                            </div>
                        </div>

                        {/* Game Area */}
                        <div className="flex items-center justify-center gap-8 mb-8 min-h-[200px]">
                            {/* Player */}
                            <div className="text-center">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">당신</div>
                                <div className="arcade-card w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                                    <motion.div
                                        className="arcade-float text-6xl sm:text-7xl"
                                        animate={playerChoice ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {playerChoice ? EMOJIS[playerChoice] : "❓"}
                                    </motion.div>
                                </div>
                            </div>

                            <div className="text-lg font-black tracking-widest text-neutral-600">VS</div>

                            {/* Computer */}
                            <div className="text-center">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">컴퓨터</div>
                                <div className={`arcade-card w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center ${isPlaying ? "arcade-glow" : ""}`}>
                                    <motion.div
                                        className="arcade-float text-6xl sm:text-7xl"
                                        animate={isPlaying ? { rotate: [0, 360] } : computerChoice ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: isPlaying ? 1 : 0.3 }}
                                    >
                                        {isPlaying ? "❓" : computerChoice ? EMOJIS[computerChoice] : "❓"}
                                    </motion.div>
                                </div>
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
                                    className={`arcade-pop-in mb-6 p-4 rounded-2xl text-center text-xl font-extrabold tracking-tight border ${result === "win"
                                            ? "bg-[#F9954E]/10 border-[#F9954E]/25 text-[#F9954E]"
                                            : result === "lose"
                                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                                : "bg-white/[0.04] border-white/10 text-neutral-300"
                                        }`}
                                >
                                    {result === "win" ? "🎉 승리!" : result === "lose" ? "😢 패배..." : "🤝 무승부!"}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Choice Buttons */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {CHOICES.map((choice) => (
                                <button
                                    key={choice}
                                    onClick={() => play(choice)}
                                    disabled={isPlaying}
                                    className="arcade-shine p-5 sm:p-6 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.09] hover:border-[#F9954E]/30 active:scale-[0.97] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <div className="text-4xl sm:text-5xl mb-2">{EMOJIS[choice]}</div>
                                    <div className="text-[13px] font-semibold text-neutral-300">{choice === "rock" ? "바위" : choice === "paper" ? "보" : "가위"}</div>
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {result && (
                                <button
                                    onClick={reset}
                                    className="arcade-shine arcade-glow flex-1 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-all"
                                >
                                    다시 하기
                                </button>
                            )}
                            <button
                                onClick={resetAll}
                                className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] font-semibold active:scale-[0.97] transition-all"
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
