"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, Trophy, RotateCcw, Target, Zap, Flame, Snowflake } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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
        } else {
            const diff = Math.abs(guess - secretNumber);
            const percentage = (diff / max) * 100;

            if (percentage <= 5) {
                hint = "🔥 아주 가까워요!";
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
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">숫자 맞추기</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
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
                                    <Target className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                                    <h2 className="text-2xl font-bold mb-2">난이도 선택</h2>
                                    <p className="text-neutral-500 dark:text-zinc-400">
                                        숫자를 맞출 범위를 선택하세요
                                    </p>
                                </div>

                                <div className="grid gap-4 mb-8">
                                    {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`p-6 rounded-2xl border-2 transition-all ${difficulty === d
                                                    ? "border-purple-500 bg-purple-500/10 scale-105"
                                                    : "border-neutral-200 dark:border-zinc-700 hover:border-purple-400"
                                                }`}
                                        >
                                            <div className="font-bold text-lg mb-1">
                                                {DIFFICULTY_CONFIG[d].name}
                                            </div>
                                            <div className="text-sm text-neutral-500 dark:text-zinc-400">
                                                1 ~ {DIFFICULTY_CONFIG[d].max}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={startGame}
                                    className="w-full py-4 bg-purple-500 hover:bg-purple-600 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
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
                                            {attempts.length}
                                        </div>
                                        <div className="text-sm text-neutral-500 dark:text-zinc-400">
                                            시도 횟수
                                        </div>
                                    </div>
                                    <div className="h-12 w-px bg-neutral-200 dark:bg-zinc-700" />
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-[#F9954E]">
                                            {DIFFICULTY_CONFIG[difficulty].max}
                                        </div>
                                        <div className="text-sm text-neutral-500 dark:text-zinc-400">
                                            최대 숫자
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                                    <p className="text-lg font-medium text-purple-900 dark:text-purple-300">
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
                                        className="flex-1 bg-neutral-50 dark:bg-black border-2 border-neutral-200 dark:border-zinc-800 rounded-xl px-6 py-4 text-center text-2xl font-bold focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
                                    />
                                    <button
                                        onClick={submitGuess}
                                        className="px-8 py-4 bg-purple-500 hover:bg-purple-600 active:scale-95 text-white rounded-xl font-bold transition-all"
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
                                                    className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-zinc-800 rounded-xl"
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
                                    className="w-full mt-6 py-3 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors text-sm"
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
                                className="text-center"
                            >
                                <Trophy className="w-20 h-20 mx-auto mb-6 text-yellow-500" />
                                <h2 className="text-3xl font-bold mb-2">축하합니다!</h2>
                                <p className="text-xl mb-6 text-neutral-600 dark:text-zinc-400">
                                    정답은 <span className="font-bold text-purple-500">{secretNumber}</span>
                                </p>

                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 mb-8">
                                    <div className="text-6xl font-bold text-purple-500 mb-2">
                                        {attempts.length}회
                                    </div>
                                    <div className={`text-2xl font-bold ${getScoreRating().color}`}>
                                        {getScoreRating().text}
                                    </div>
                                </div>

                                <button
                                    onClick={resetGame}
                                    className="w-full py-4 bg-purple-500 hover:bg-purple-600 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    다시 하기
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
