"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, Trophy, RotateCcw, Target, Zap, Flame, Snowflake } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

// ---- Types ----
type GameState = "SETUP" | "PLAYING" | "WON";
type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface Attempt {
    guess: number;
    hint: string;
}

const DIFFICULTY_CONFIG = {
    EASY: { max: 50, name: "쉬움" },
    MEDIUM: { max: 100, name: "보통" },
    HARD: { max: 200, name: "어려움" },
};

export default function GuessNumberPage() {
    const { session } = useAuth();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState>("SETUP");

    // Setup State
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");

    // Game State
    const [secretNumber, setSecretNumber] = useState(0);
    const [currentGuess, setCurrentGuess] = useState("");
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [message, setMessage] = useState("");

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

    const startGame = () => {
        const max = DIFFICULTY_CONFIG[difficulty].max;
        const secret = Math.floor(Math.random() * max) + 1;
        setSecretNumber(secret);
        setGameState("PLAYING");
        setAttempts([]);
        setCurrentGuess("");
        setMessage(`1부터 ${max}까지의 숫자를 맞춰보세요!`);
    };

    const submitGuess = () => {
        const guess = parseInt(currentGuess);
        const max = DIFFICULTY_CONFIG[difficulty].max;

        if (isNaN(guess) || guess < 1 || guess > max) {
            setMessage(`1부터 ${max} 사이의 숫자를 입력하세요!`);
            return;
        }

        if (attempts.some((a) => a.guess === guess)) {
            setMessage("이미 시도한 숫자입니다!");
            return;
        }

        let hint = "";
        let newMessage = "";

        if (guess === secretNumber) {
            hint = "🎉 정답!";
            newMessage = `축하합니다! ${attempts.length + 1}번 만에 맞추셨습니다!`;
            setGameState("WON");
            triggerConfetti();
            bigBurst();
            // 최종 시도 횟수 (이번 정답 시도 포함). attempts 상태는 아직 업데이트 전이므로 +1
            const finalAttempts = attempts.length + 1;
            if (session?.user?.email) {
                submitScore("guess", session.user.name || "플레이어", finalAttempts, "asc");
                if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "guess" }));
            }
        } else {
            const diff = Math.abs(guess - secretNumber);
            const percentage = (diff / max) * 100;

            if (percentage <= 5) {
                hint = "🔥 아주 가까워요!";
                burst();
            } else if (percentage <= 15) {
                hint = "🌡️ 가까워요";
            } else if (percentage <= 30) {
                hint = "❄️ 멀어요";
            } else {
                hint = "🧊 아주 멀어요";
            }

            hint += guess < secretNumber ? " ↑ 더 큰 수" : " ↓ 더 작은 수";
            newMessage = hint;
        }

        setAttempts([...attempts, { guess, hint }]);
        setMessage(newMessage);
        setCurrentGuess("");
    };

    const resetGame = () => {
        setGameState("SETUP");
        setAttempts([]);
        setCurrentGuess("");
        setMessage("");
    };

    const getScoreRating = () => {
        const attemptCount = attempts.length;
        if (attemptCount <= 3) return { text: "천재!", color: "text-purple-500" };
        if (attemptCount <= 5) return { text: "대단해요!", color: "text-blue-500" };
        if (attemptCount <= 8) return { text: "훌륭해요!", color: "text-green-500" };
        if (attemptCount <= 12) return { text: "좋아요!", color: "text-yellow-500" };
        return { text: "다시 도전!", color: "text-[#F9954E]" };
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />
            {/* Header */}
            <header className="relative max-w-2xl mx-auto flex items-center justify-between px-4 pt-6 pb-2">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    미니게임
                </Link>
                <h1 className="text-[15px] font-extrabold tracking-tight text-white">🎯 숫자 맞추기</h1>
                <div className="arcade-card rounded-xl px-3 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">TRY</div>
                    <div className="text-sm font-bold text-white">
                        <CountUp value={attempts.length} className="tabular-nums" />
                    </div>
                </div>
            </header>

            <div className="relative pt-2 sm:pt-4 pb-8 sm:pb-12 px-4 max-w-2xl mx-auto">
                <div className="animate-fade-in">
                    {/* Game Card */}
                    <div className="arcade-card arcade-rise rounded-3xl p-8 md:p-12 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10">

                        {/* Setup Screen */}
                        {gameState === "SETUP" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="text-center mb-8">
                                    <Target className="arcade-float w-16 h-16 mx-auto mb-4 text-[#F9954E]" />
                                    <h2 className="text-2xl font-extrabold tracking-tight mb-2">난이도 선택</h2>
                                    <p className="text-neutral-400">
                                        숫자를 맞출 범위를 선택하세요
                                    </p>
                                </div>

                                <div className="grid gap-4 mb-8">
                                    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`p-6 rounded-2xl border transition-all active:scale-[0.97] ${difficulty === d
                                                    ? "border-[#F9954E]/60 bg-[#F9954E]/10 shadow-lg shadow-[#F9954E]/10 arcade-glow"
                                                    : "border-white/10 bg-white/[0.04] hover:border-white/25"
                                                }`}
                                        >
                                            <div className="font-bold text-lg mb-1 text-white">
                                                {DIFFICULTY_CONFIG[d].name}
                                            </div>
                                            <div className="text-sm text-neutral-400 tabular-nums">
                                                1 ~ {DIFFICULTY_CONFIG[d].max}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={startGame}
                                    className="arcade-shine arcade-glow w-full py-4 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold text-lg shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                                >
                                    <Play className="w-5 h-5 fill-current" />
                                    게임 시작
                                </button>
                            </motion.div>
                        )}

                        {/* Playing Screen */}
                        {gameState === "PLAYING" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Stats */}
                                <div className="flex items-center justify-center gap-8 mb-8">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-purple-500">
                                            <span key={attempts.length} className="arcade-pop inline-block">
                                                <CountUp value={attempts.length} className="tabular-nums" />
                                            </span>
                                        </div>
                                        <div className="text-sm text-neutral-500 dark:text-zinc-400">
                                            시도 횟수
                                        </div>
                                    </div>
                                    <div className="h-12 w-px bg-white/10" />
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-[#F9954E]">
                                            <CountUp value={DIFFICULTY_CONFIG[difficulty].max} className="tabular-nums" />
                                        </div>
                                        <div className="text-sm text-neutral-500 dark:text-zinc-400">
                                            최대 숫자
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="mb-6 p-4 bg-purple-500/15 rounded-xl text-center">
                                    <p className="text-lg font-medium text-purple-300">
                                        {message}
                                    </p>
                                </div>

                                {/* Input */}
                                <div className="flex gap-3 mb-6">
                                    <input
                                        type="number"
                                        value={currentGuess}
                                        onChange={(e) => setCurrentGuess(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && submitGuess()}
                                        placeholder="숫자 입력"
                                        className="flex-1 bg-white/[0.04] border-2 border-white/10 rounded-xl px-6 py-4 text-center text-2xl font-bold text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#F9954E] transition-colors"
                                    />
                                    <button
                                        onClick={submitGuess}
                                        className="arcade-shine px-8 py-4 bg-purple-500 hover:bg-purple-600 active:scale-[0.97] text-white rounded-xl font-bold transition-all"
                                    >
                                        <Zap className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Attempts History */}
                                {attempts.length > 0 && (
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                        {attempts
                                            .slice()
                                            .reverse()
                                            .map((attempt, i) => (
                                                <motion.div
                                                    key={attempts.length - i - 1}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center justify-between p-4 bg-white/[0.04] border border-white/10 rounded-xl"
                                                >
                                                    <span className="text-2xl font-bold text-purple-500">
                                                        {attempt.guess}
                                                    </span>
                                                    <span className="text-sm">{attempt.hint}</span>
                                                </motion.div>
                                            ))}
                                    </div>
                                )}

                                {/* Give Up Button */}
                                <button
                                    onClick={resetGame}
                                    className="w-full mt-6 py-3 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] text-neutral-200 rounded-xl font-medium transition-all text-sm active:scale-[0.97]"
                                >
                                    포기하기
                                </button>
                            </motion.div>
                        )}

                        {/* Won Screen */}
                        {gameState === "WON" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="arcade-pop-in text-center"
                            >
                                <Trophy className="arcade-float w-20 h-20 mx-auto mb-6 text-yellow-500" />
                                <h2 className="text-3xl font-bold mb-2">축하합니다!</h2>
                                <p className="text-xl mb-6 text-neutral-600 dark:text-zinc-400">
                                    정답은 <span className="font-bold text-purple-500 tabular-nums">{secretNumber}</span>
                                </p>

                                <div className="arcade-card bg-purple-500/15 rounded-2xl p-8 mb-8">
                                    <div className="text-6xl font-extrabold arcade-grad-text mb-2 tabular-nums">
                                        <CountUp value={attempts.length} />회
                                    </div>
                                    <div className={`text-2xl font-bold ${getScoreRating().color}`}>
                                        {getScoreRating().text}
                                    </div>
                                </div>

                                <button
                                    onClick={resetGame}
                                    className="arcade-shine arcade-glow w-full py-4 bg-purple-500 hover:bg-purple-600 active:scale-[0.97] text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    다시 하기
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* 명예의 전당 (글로벌 TOP 5) */}
                    <div className="w-full max-w-md mx-auto mt-4 px-4">
                        <GameLeaderboard game="guess" title="명예의 전당 TOP 5" unit="번" order="asc" />
                    </div>
                </div>
            </div>
        </main>
    );
}
