"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, RotateCcw, Palette } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

type GameMode = "rgb" | "name";

const COLOR_NAMES = [
    { name: "빨강", rgb: "#EF4444", kr: "빨강" },
    { name: "주황", rgb: "#F9954E", kr: "주황" },
    { name: "노랑", rgb: "#F59E0B", kr: "노랑" },
    { name: "초록", rgb: "#10B981", kr: "초록" },
    { name: "파랑", rgb: "#3B82F6", kr: "파랑" },
    { name: "보라", rgb: "#8B5CF6", kr: "보라" },
    { name: "분홍", rgb: "#EC4899", kr: "분홍" },
];

export default function ColorMatchPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const [gameMode, setGameMode] = useState<GameMode>("name");
    const [isPlaying, setIsPlaying] = useState(false);
    const [targetColor, setTargetColor] = useState(COLOR_NAMES[0]);
    const [displayText, setDisplayText] = useState("");
    const [textColor, setTextColor] = useState("");
    const [options, setOptions] = useState<typeof COLOR_NAMES>([]);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isGameOver, setIsGameOver] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isPlaying && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            setIsGameOver(true);
            setIsPlaying(false);
        }
    }, [isPlaying, timeLeft]);

    const triggerConfetti = () => {
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
        });
    };

    const generateQuestion = () => {
        const shuffled = [...COLOR_NAMES].sort(() => Math.random() - 0.5);
        const target = shuffled[0];
        const textColorObj = shuffled[1];

        setTargetColor(target);
        setDisplayText(textColorObj.kr);
        setTextColor(textColorObj.rgb);
        setOptions(shuffled.slice(0, 4).sort(() => Math.random() - 0.5));
    };

    const startGame = () => {
        setIsPlaying(true);
        setIsGameOver(false);
        setScore(0);
        setTimeLeft(30);
        generateQuestion();
    };

    const handleAnswer = (selectedColor: typeof COLOR_NAMES[0]) => {
        if (!isPlaying) return;

        const isCorrect = gameMode === "name"
            ? selectedColor.kr === displayText
            : selectedColor.rgb === textColor;

        if (isCorrect) {
            setScore(score + 1);
            triggerConfetti();
            generateQuestion();
        } else {
            setTimeLeft(Math.max(0, timeLeft - 2));
        }
    };

    const reset = () => {
        setIsPlaying(false);
        setIsGameOver(false);
        setScore(0);
        setTimeLeft(30);
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">색깔 맞추기</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
                <div className="animate-fade-in">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {!isPlaying && !isGameOver && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <Palette className="w-16 h-16 mx-auto mb-4 text-pink-500" />
                                <h2 className="text-2xl font-bold mb-4">색깔 맞추기 게임</h2>
                                <p className="text-neutral-600 dark:text-zinc-400 mb-8">
                                    <strong className="text-pink-500" style={{ color: textColor }}>{displayText || "색깔"}</strong>의 <strong>실제 색상</strong>을 선택하세요!<br />
                                    <span className="text-sm">(글자의 색이 아닌 글자가 의미하는 색을 선택)</span>
                                </p>

                                <button
                                    onClick={startGame}
                                    className="px-8 py-4 bg-pink-500 hover:bg-pink-600 active:scale-95 text-white rounded-2xl font-bold text-lg shadow-lg transition-all"
                                >
                                    <Play className="w-5 h-5 inline mr-2" />
                                    시작하기 (30초)
                                </button>
                            </motion.div>
                        )}

                        {isPlaying && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                                        <div className="text-sm text-neutral-600 dark:text-zinc-400 mb-1">점수</div>
                                        <div className="text-4xl font-bold text-pink-600">{score}</div>
                                    </div>
                                    <div className="text-center p-4 bg-[#FFF5EB] dark:bg-[#8F4B10]/20 rounded-xl">
                                        <div className="text-sm text-neutral-600 dark:text-zinc-400 mb-1">남은 시간</div>
                                        <div className="text-4xl font-bold text-[#E8832E]">{timeLeft}초</div>
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="mb-8 p-8 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-zinc-800 dark:to-zinc-700 rounded-2xl text-center">
                                    <div className="text-sm text-neutral-600 dark:text-zinc-400 mb-3">
                                        이 글자의 실제 색상은?
                                    </div>
                                    <div
                                        className="text-6xl font-bold"
                                        style={{ color: textColor }}
                                    >
                                        {displayText}
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-2 gap-4">
                                    {options.map((color) => (
                                        <motion.button
                                            key={color.kr}
                                            onClick={() => handleAnswer(color)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="p-6 rounded-2xl font-bold text-white text-lg shadow-lg transition-all"
                                            style={{ backgroundColor: color.rgb }}
                                        >
                                            {color.kr}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {isGameOver && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <div className="text-6xl mb-6">
                                    {score >= 20 ? "🏆" : score >= 15 ? "🎉" : score >= 10 ? "👏" : "💪"}
                                </div>
                                <h2 className="text-3xl font-bold mb-4">게임 종료!</h2>

                                <div className="mb-8 p-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl text-white">
                                    <div className="text-lg mb-2">최종 점수</div>
                                    <div className="text-6xl font-bold">{score}</div>
                                </div>

                                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <p className="text-lg font-medium text-blue-900 dark:text-blue-300">
                                        {score >= 20 ? "🌟 완벽해요!" : score >= 15 ? "🚀 훌륭해요!" : score >= 10 ? "💫 잘했어요!" : "📚 더 연습해보세요!"}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={startGame}
                                        className="flex-1 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold transition-colors"
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
