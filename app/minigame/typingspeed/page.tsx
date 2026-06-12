"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, RotateCcw, Zap } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";

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
                submitScore("typingspeed", session.user.name || "플레이어", calculatedWpm, "desc");
                if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "typingspeed" }));
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
        if (index >= userInput.length) return "text-neutral-600";
        if (userInput[index] === targetText[index]) return "text-emerald-400";
        return "text-red-400";
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="relative overflow-hidden min-h-screen bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />
            <header className="fixed top-0 left-0 w-full h-16 bg-[#09090e]/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    미니게임
                </Link>
                <h1 className="text-[15px] font-extrabold tracking-tight text-white">⌨️ 타이핑 속도 테스트</h1>
                <div className="rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">WPM</div>
                    <div className="text-sm font-bold text-white tabular-nums">{wpm}</div>
                </div>
            </header>

            <div className="pt-20 pb-8 sm:pb-12 px-4 max-w-3xl mx-auto">
                <div className="animate-fade-in">
                    <div className="rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-5 sm:p-8 md:p-12">

                        {!isStarted && !isFinished && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <Zap className="w-16 h-16 mx-auto mb-4 text-[#F9954E]" />
                                <h2 className="text-2xl font-extrabold tracking-tight mb-4">타이핑 속도를 측정해보세요!</h2>
                                <p className="text-neutral-400 mb-8">
                                    제시된 문장을 정확하고 빠르게 입력하세요
                                </p>
                                <button
                                    onClick={startTest}
                                    className="px-8 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold text-lg shadow-lg shadow-[#F9954E]/20 active:scale-[0.98] transition-all"
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
                                    <div className="text-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">정확도</div>
                                        <div className="text-3xl font-bold text-[#F9954E] tabular-nums">{accuracy}%</div>
                                    </div>
                                    <div className="text-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">진행률</div>
                                        <div className="text-3xl font-bold text-white tabular-nums">
                                            {Math.round((userInput.length / targetText.length) * 100)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Target Text */}
                                <div className="mb-6 p-4 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-lg sm:text-2xl font-mono leading-relaxed">
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
                                    className="w-full p-4 sm:p-6 rounded-xl bg-white/[0.06] border border-white/10 text-lg sm:text-2xl font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#F9954E]/60 transition-colors"
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
                                <h2 className="text-3xl font-extrabold tracking-tight mb-8">완료!</h2>

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">타이핑 속도</div>
                                        <div className="text-5xl font-black text-[#F9954E] tabular-nums">{wpm}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">WPM</div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">정확도</div>
                                        <div className="text-5xl font-black text-white tabular-nums">{accuracy}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">%</div>
                                    </div>
                                </div>

                                <div className="mb-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                    <p className="text-lg font-medium text-neutral-200">
                                        {wpm >= 60 ? "🚀 매우 빠름!" : wpm >= 40 ? "⚡ 빠름!" : wpm >= 25 ? "👍 좋아요!" : "💪 연습이 필요해요!"}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={startTest}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.98] transition-all"
                                    >
                                        다시 하기
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] font-semibold transition-colors"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-3xl mx-auto mt-4 px-4">
                    <GameLeaderboard game="typingspeed" title="명예의 전당 TOP 5" unit="WPM" order="desc" tone="dark" />
                </div>
            </div>
        </main>
    );
}
