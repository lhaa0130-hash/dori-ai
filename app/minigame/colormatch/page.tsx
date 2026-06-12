"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Play, RotateCcw, Palette } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

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
    const { session } = useAuth();
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
            if (score >= 15) bigBurst();
            if (session?.user?.email) {
                submitScore("colormatch", session.user.name || "플레이어", score, "desc");
                if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "colormatch" }));
            }
        }
    }, [isPlaying, timeLeft]);

    const triggerConfetti = () => {
        burst();
    };

    const generateQuestion = () => {
        const shuffled = [...COLOR_NAMES].sort(() => Math.random() - 0.5);
        const correctColor = shuffled[0]; // 정답 색상 (버튼으로 눌러야 할 것)
        const textColorObj = shuffled[1]; // 글자에 적용할 색상 (혼동용)

        setTargetColor(correctColor);
        setDisplayText(correctColor.kr); // 화면에 보이는 글자 = 정답 색 이름
        setTextColor(textColorObj.rgb);  // 글자 색 = 혼동용 다른 색
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
        <main className="relative overflow-hidden min-h-screen bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />
            <header className="fixed top-0 left-0 w-full h-16 bg-[#09090e]/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    미니게임
                </Link>
                <h1 className="text-[15px] font-extrabold tracking-tight text-white">🎨 색깔 맞추기</h1>
                <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">SCORE</div>
                    <div className="text-sm font-bold text-white tabular-nums">
                        <CountUp value={score} className="tabular-nums" />
                    </div>
                </div>
            </header>

            <div className="pt-20 pb-8 sm:pb-12 px-4 max-w-2xl mx-auto">
                <div className="animate-fade-in">
                    <div className="arcade-card arcade-rise rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-5 sm:p-8 md:p-12">

                        {!isPlaying && !isGameOver && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <Palette className="arcade-float w-16 h-16 mx-auto mb-4 text-[#F9954E]" />
                                <h2 className="text-2xl font-extrabold tracking-tight mb-4 text-white">색깔 맞추기 게임</h2>
                                <p className="text-neutral-400 mb-8">
                                    <strong className="text-[#F9954E]" style={{ color: textColor }}>{displayText || "색깔"}</strong>의 <strong className="text-white">실제 색상</strong>을 선택하세요!<br />
                                    <span className="text-sm">(글자의 색이 아닌, 글자가 뜻하는 색을 고르세요)</span>
                                </p>

                                <button
                                    onClick={startGame}
                                    className="arcade-shine arcade-glow rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold text-lg shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform px-8 py-3"
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
                                    <div className="arcade-card arcade-rise-1 text-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">점수</div>
                                        <div className="text-4xl font-bold text-[#F9954E] tabular-nums">
                                            <span key={score} className="arcade-pop inline-block">
                                                <CountUp value={score} className="tabular-nums" />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="arcade-card arcade-rise-2 text-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">남은 시간</div>
                                        <div className="text-4xl font-bold text-white tabular-nums">
                                            <CountUp value={timeLeft} className="tabular-nums" />초
                                        </div>
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="arcade-card arcade-rise-3 mb-8 p-8 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3">
                                        이 글자의 실제 색상은?
                                    </div>
                                    <div
                                        className="text-6xl font-extrabold tracking-tight"
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
                                            whileTap={{ scale: 0.96 }}
                                            className="arcade-shine p-4 sm:p-6 rounded-2xl border border-white/10 font-bold text-white text-base sm:text-lg shadow-lg shadow-black/30 transition-all min-h-[56px]"
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
                                className="arcade-pop-in text-center"
                            >
                                <div className="arcade-float text-6xl mb-6">
                                    {score >= 20 ? "🏆" : score >= 15 ? "🎉" : score >= 10 ? "👏" : "💪"}
                                </div>
                                <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-white">게임 종료!</h2>

                                <div className="arcade-card mb-8 p-8 rounded-3xl bg-[#101016] border border-white/10">
                                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">최종 점수</div>
                                    <div className="text-6xl font-black arcade-grad-text tabular-nums">
                                        <CountUp value={score} className="tabular-nums" />
                                    </div>
                                </div>

                                <div className="mb-8 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                                    <p className="text-lg font-medium text-neutral-200">
                                        {score >= 20 ? "🌟 완벽해요!" : score >= 15 ? "🚀 훌륭해요!" : score >= 10 ? "💫 잘했어요!" : "📚 조금만 더 연습해 볼까요?"}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={startGame}
                                        className="arcade-shine arcade-glow flex-1 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform"
                                    >
                                        다시 하기
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] font-semibold active:scale-[0.97] transition-transform"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-2xl mx-auto mt-4 px-4">
                    <GameLeaderboard game="colormatch" title="명예의 전당 TOP 5" unit="점" order="desc" tone="dark" />
                </div>

                <GameSuggestion />
            </div>
        </main>
    );
}
