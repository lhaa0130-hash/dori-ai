"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, RotateCcw, Zap } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays } from "@/lib/cottonCandy";

const SAMPLE_TEXTS = [
    "빠른 갈색 여우가 게으른 개를 뛰어넘습니다",
    "타이핑 연습은 꾸준함이 중요합니다",
    "프로그래밍은 창의적인 문제 해결입니다",
    "매일 조금씩 발전하는 것이 중요합니다",
    "연습이 완벽을 만듭니다",
];

export default function TypingSpeedPage() {
    const { session } = useAuth();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [targetText, setTargetText] = useState("");
    const [userInput, setUserInput] = useState("");
    const [isStarted, setIsStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [startTime, setStartTime] = useState<number>(0);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        setTargetText(SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)]);
    }, []);

    const startTest = () => {
        setIsStarted(true);
        setIsFinished(false);
        setUserInput("");
        setStartTime(Date.now());
        setTargetText(SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)]);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isStarted || isFinished) return;

        const input = e.target.value;
        setUserInput(input);

        if (input === targetText) {
            const endTime = Date.now();
            const timeInMinutes = (endTime - startTime) / 60000;
            const words = targetText.split(" ").length;
            const calculatedWpm = Math.round(words / timeInMinutes);

            setWpm(calculatedWpm);
            setIsFinished(true);
            setIsStarted(false);
            if (session?.user?.email) {
                const candy = Math.max(1, Math.floor(calculatedWpm / 10));
                addCottonCandy(session.user.email, candy, "타이핑 속도 테스트 완료");
                incrementMinigamePlays(session.user.email);
            }
        }

        // Calculate accuracy
        let correct = 0;
        for (let i = 0; i < Math.min(input.length, targetText.length); i++) {
            if (input[i] === targetText[i]) correct++;
        }
        const acc = input.length > 0 ? Math.round((correct / input.length) * 100) : 100;
        setAccuracy(acc);
    };

    const reset = () => {
        setIsStarted(false);
        setIsFinished(false);
        setUserInput("");
        setWpm(0);
        setAccuracy(100);
    };

    const getCharacterColor = (index: number) => {
        if (index >= userInput.length) return "text-neutral-300 dark:text-zinc-600";
        if (userInput[index] === targetText[index]) return "text-green-500";
        return "text-red-500";
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">타이핑 속도 테스트</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
                <div className="animate-fade-in">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {!isStarted && !isFinished && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <Zap className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                                <h2 className="text-2xl font-bold mb-4">타이핑 속도를 측정해보세요!</h2>
                                <p className="text-neutral-600 dark:text-zinc-400 mb-8">
                                    제시된 문장을 정확하고 빠르게 입력하세요
                                </p>
                                <button
                                    onClick={startTest}
                                    className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-lg transition-all"
                                >
                                    <Play className="w-5 h-5 inline mr-2" />
                                    시작하기
                                </button>
                            </motion.div>
                        )}

                        {isStarted && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <div className="text-sm text-neutral-600 dark:text-zinc-400 mb-1">정확도</div>
                                        <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                        <div className="text-sm text-neutral-600 dark:text-zinc-400 mb-1">진행률</div>
                                        <div className="text-3xl font-bold text-purple-600">
                                            {Math.round((userInput.length / targetText.length) * 100)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Target Text */}
                                <div className="mb-6 p-6 bg-neutral-50 dark:bg-black rounded-xl text-2xl font-mono leading-relaxed">
                                    {targetText.split("").map((char, i) => (
                                        <span key={i} className={getCharacterColor(i)}>
                                            {char}
                                        </span>
                                    ))}
                                </div>

                                {/* Input */}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userInput}
                                    onChange={handleInput}
                                    className="w-full p-6 bg-white dark:bg-zinc-800 border-2 border-neutral-200 dark:border-zinc-700 rounded-xl text-2xl font-mono focus:outline-none focus:border-yellow-500 transition-colors"
                                    placeholder="여기에 입력하세요..."
                                    autoComplete="off"
                                />
                            </motion.div>
                        )}

                        {isFinished && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="text-6xl mb-6">🎉</div>
                                <h2 className="text-3xl font-bold mb-8">완료!</h2>

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="p-6 bg-gradient-to-br from-yellow-400 to-[#F9954E] rounded-2xl text-white">
                                        <div className="text-sm mb-2">타이핑 속도</div>
                                        <div className="text-5xl font-bold">{wpm}</div>
                                        <div className="text-sm mt-2">WPM</div>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl text-white">
                                        <div className="text-sm mb-2">정확도</div>
                                        <div className="text-5xl font-bold">{accuracy}</div>
                                        <div className="text-sm mt-2">%</div>
                                    </div>
                                </div>

                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <p className="text-lg font-medium text-blue-900 dark:text-blue-300">
                                        {wpm >= 60 ? "🚀 매우 빠름!" : wpm >= 40 ? "⚡ 빠름!" : wpm >= 25 ? "👍 좋아요!" : "💪 연습이 필요해요!"}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={startTest}
                                        className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-bold transition-colors"
                                    >
                                        다시 하기
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="px-6 py-4 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 rounded-2xl transition-colors"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
