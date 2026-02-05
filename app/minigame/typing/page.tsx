"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Keyboard, Send, Check, X } from "lucide-react";

// 단어 데이터
const WORDS = [
    { word: "프롬프트", hint: "AI에게 내리는 지시 명령어" },
    { word: "인공지능", hint: "인간의 지능을 모방한 컴퓨터 시스템" },
    { word: "챗봇", hint: "텍스트나 음성으로 대화하는 프로그램" },
    { word: "알고리즘", hint: "문제를 해결하기 위한 절차나 방법" },
    { word: "데이터", hint: "AI 학습의 기초가 되는 정보" },
    { word: "모델", hint: "학습된 AI 시스템의 결과물" },
    { word: "생성형", hint: "무언가를 새롭게 만들어내는 AI의 종류" },
    { word: "토큰", hint: "LLM이 텍스트를 처리하는 기본 단위" },
];

export default function TypingGamePage() {
    const { theme } = useTheme();
    const [gameState, setGameState] = useState<"START" | "PLAY" | "RESULT">("START");
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [input, setInput] = useState("");
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [feedback, setFeedback] = useState<"NONE" | "CORRECT" | "WRONG">("NONE");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === "PLAY" && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === "PLAY") {
            setGameState("RESULT");
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    useEffect(() => {
        if (gameState === "PLAY") {
            inputRef.current?.focus();
        }
    }, [gameState, currentWordIndex]);

    const startGame = () => {
        setGameState("PLAY");
        setCurrentWordIndex(0);
        setScore(0);
        setTimeLeft(60);
        setInput("");
        setFeedback("NONE");
        // Shuffle words? For simple MVP, keep defined order or random sort
        // WORDS.sort(() => Math.random() - 0.5); 
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            submitAnswer();
        }
    };

    const submitAnswer = () => {
        if (!input.trim()) return;

        const currentWord = WORDS[currentWordIndex % WORDS.length];
        if (input.trim() === currentWord.word) {
            setScore(prev => prev + 10);
            setFeedback("CORRECT");
            setTimeout(() => {
                setFeedback("NONE");
                setCurrentWordIndex(prev => prev + 1);
                setInput("");
            }, 500);
        } else {
            setFeedback("WRONG");
            setInput("");
            setTimeout(() => setFeedback("NONE"), 500);
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* 배경 그라데이션 */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-100/40 via-blue-50/20 to-transparent dark:from-blue-900/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

            <div className="relative z-10 w-full max-w-2xl">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/minigame" className="flex items-center gap-2 text-neutral-500 hover:text-blue-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>나가기</span>
                    </Link>
                    <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                        프롬프트 타이핑
                    </div>
                </div>

                {/* 게임 화면 */}
                <div className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-neutral-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col justify-center">

                    {gameState === "START" && (
                        <div className="text-center py-12">
                            <Keyboard className="w-20 h-20 mx-auto text-blue-500 mb-6" />
                            <h1 className="text-3xl font-bold mb-4">단어 맞추기 챌린지</h1>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                                제시되는 설명을 보고 알맞은 단어를 입력하세요.<br />
                                제한시간 60초 동안 최대한 많은 점수를 획득하세요!
                            </p>
                            <button
                                onClick={startGame}
                                className="px-8 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1"
                            >
                                게임 시작하기
                            </button>
                        </div>
                    )}

                    {gameState === "PLAY" && (
                        <div className="w-full max-w-md mx-auto">
                            {/* 정보 패널 */}
                            <div className="flex items-center justify-between mb-12">
                                <div className="text-center">
                                    <div className="text-xs text-neutral-500 mb-1">TIME</div>
                                    <div className={`text-2xl font-bold font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-neutral-900 dark:text-white'}`}>
                                        {timeLeft}s
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-neutral-500 mb-1">SCORE</div>
                                    <div className="text-2xl font-bold text-blue-500">{score}</div>
                                </div>
                            </div>

                            {/* 문제 표시 */}
                            <div className="text-center mb-8 h-32 flex flex-col justify-center">
                                <div className="text-sm font-bold text-blue-500 mb-2">HINT</div>
                                <h2 className="text-2xl font-bold leading-relaxed break-keep animate-fade-in">
                                    "{WORDS[currentWordIndex % WORDS.length].hint}"
                                </h2>
                            </div>

                            {/* 입력 필드 */}
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="정답을 입력하세요"
                                    className={`w-full px-6 py-4 rounded-2xl bg-neutral-100 dark:bg-zinc-800 border-2 text-center text-xl font-bold focus:outline-none transition-all
                                        ${feedback === "CORRECT" ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20" : ""}
                                        ${feedback === "WRONG" ? "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20 animate-shake" : "border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-black"}
                                    `}
                                />
                                <button
                                    onClick={submitAnswer}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>

                            {/* 피드백 아이콘 */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                {feedback === "CORRECT" && <Check className="w-32 h-32 text-green-500 opacity-20 animate-scale-in" />}
                                {feedback === "WRONG" && <X className="w-32 h-32 text-red-500 opacity-20 animate-scale-in" />}
                            </div>
                        </div>
                    )}

                    {gameState === "RESULT" && (
                        <div className="text-center py-12 animate-fade-in">
                            <div className="w-24 h-24 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                                <span className="text-4xl">🎉</span>
                            </div>
                            <h2 className="text-4xl font-bold mb-2">Time Over!</h2>
                            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
                                최종 점수: <span className="text-blue-500 font-bold text-3xl">{score}</span> 점
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={startGame}
                                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/30"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    다시 도전하기
                                </button>
                                <Link
                                    href="/minigame"
                                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-neutral-300 font-bold transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    메뉴로 돌아가기
                                </Link>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
                .animate-scale-in {
                    animation: scaleIn 0.3s ease-out;
                }
                @keyframes scaleIn {
                    from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
                }
            `}</style>
        </main>
    );
}
