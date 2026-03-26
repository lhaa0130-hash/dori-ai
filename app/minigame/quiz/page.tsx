"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RefreshCw, ArrowRight, Brain } from "lucide-react";
import { QUIZ_POOL, QuizQuestion } from "./data";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays, incrementQuizCorrect } from "@/lib/cottonCandy";

export default function QuizGamePage() {
    const { theme } = useTheme();
    const { session } = useAuth();
    const [gameState, setGameState] = useState<"START" | "PLAY" | "RESULT" | "CLEAR">("START");
    const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswerChecked, setIsAnswerChecked] = useState(false);

    // 게임 진행 상태
    const [round, setRound] = useState(1);
    const [usedQuestionIds, setUsedQuestionIds] = useState<Set<number>>(new Set());
    const [totalScore, setTotalScore] = useState(0);

    const QUESTIONS_PER_ROUND = 5;

    const startNewGame = () => {
        setRound(1);
        setUsedQuestionIds(new Set());
        setTotalScore(0);
        startRound(1, new Set());
    };

    const startRound = (currentRound: number, usedIds: Set<number>) => {
        // 사용하지 않은 문제들 중에서 랜덤 선택
        const availableQuestions = QUIZ_POOL.filter(q => !usedIds.has(q.id));

        if (availableQuestions.length < QUESTIONS_PER_ROUND) {
            // 문제가 부족하면 (모든 문제 풀이 완료)
            setGameState("CLEAR");
            return;
        }

        const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, QUESTIONS_PER_ROUND);

        // 선택된 문제 ID들을 usedIds에 추가
        const newUsedIds = new Set(usedIds);
        selected.forEach(q => newUsedIds.add(q.id));

        setUsedQuestionIds(newUsedIds);
        setCurrentQuestions(selected);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswerChecked(false);
        setGameState("PLAY");
    };

    const handleNextRound = () => {
        setRound(prev => prev + 1);
        startRound(round + 1, usedQuestionIds);
    };

    const handleOptionClick = (index: number) => {
        if (isAnswerChecked) return;
        setSelectedOption(index);
    };

    const submitAnswer = () => {
        if (selectedOption === null) return;

        setIsAnswerChecked(true);
        const isCorrect = selectedOption === currentQuestions[currentQuestionIndex].answer;
        if (isCorrect) {
            setScore(prev => prev + 1);
            setTotalScore(prev => prev + 1);
            // 솜사탕 지급 및 퀴즈 정답 카운트
            if (session?.user?.email) {
                addCottonCandy(session.user.email, 10, "퀴즈 정답");
                incrementQuizCorrect(session.user.email);
            }
        }

        setTimeout(() => {
            if (currentQuestionIndex < currentQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswerChecked(false);
            } else {
                // 라운드 완료 시 미니게임 플레이 카운트
                if (session?.user?.email) {
                    incrementMinigamePlays(session.user.email);
                }
                setGameState("RESULT");
            }
        }, 1500);
    };

    return (
        <main className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* 배경 그라데이션 */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FEEBD0]/40 via-[#FFF5EB]/20 to-transparent dark:from-[#8F4B10]/10 dark:via-black/0 dark:to-black/0 pointer-events-none z-0" />

            <div className="relative z-10 w-full max-w-2xl">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/minigame" className="flex items-center gap-2 text-neutral-500 hover:text-[#F9954E] transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span>나가기</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs font-bold">
                            Total Score: {totalScore}
                        </div>
                        <div className="px-3 py-1 rounded-full bg-[#FEEBD0] dark:bg-[#8F4B10]/30 text-[#E8832E] dark:text-[#FBAA60] text-xs font-bold">
                            Round {round}
                        </div>
                    </div>
                </div>

                {/* 게임 화면 */}
                <div className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-neutral-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-center">

                    {gameState === "START" && (
                        <div className="text-center py-12">
                            <Brain className="w-20 h-20 mx-auto text-[#F9954E] mb-6" />
                            <h1 className="text-3xl font-bold mb-4">AI 상식 퀴즈 서바이벌</h1>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto leading-relaxed">
                                5문제를 모두 맞춰야 다음 라운드로 넘어갈 수 있습니다.<br />
                                얼마나 오랫동안 살아남을 수 있을까요?
                            </p>
                            <button
                                onClick={startNewGame}
                                className="px-8 py-3 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold transition-all shadow-lg hover:shadow-[#F9954E]/30 hover:-translate-y-1"
                            >
                                도전하기
                            </button>
                        </div>
                    )}

                    {gameState === "PLAY" && currentQuestions.length > 0 && (
                        <div className="py-4">
                            {/* 진행바 */}
                            <div className="flex items-center justify-between mb-6 text-sm font-medium text-neutral-500">
                                <span>Round {round} - Q{currentQuestionIndex + 1}</span>
                                <span className={score === currentQuestionIndex ? "text-[#F9954E]" : "text-neutral-400"}>
                                    현재 {score} / {QUESTIONS_PER_ROUND} 정답
                                </span>
                            </div>
                            <div className="w-full h-2 bg-neutral-100 dark:bg-zinc-800 rounded-full mb-8 overflow-hidden">
                                <div
                                    className="h-full bg-[#F9954E] transition-all duration-500 ease-out"
                                    style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS_PER_ROUND) * 100}%` }}
                                />
                            </div>

                            {/* 카테고리 뱃지 */}
                            <div className="mb-4">
                                <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-zinc-800 text-xs font-medium text-neutral-500">
                                    {currentQuestions[currentQuestionIndex].category}
                                </span>
                            </div>

                            {/* 질문 */}
                            <h2 className="text-2xl font-bold mb-8 leading-snug break-keep">
                                {currentQuestions[currentQuestionIndex].question}
                            </h2>

                            {/* 보기 */}
                            <div className="space-y-3">
                                {currentQuestions[currentQuestionIndex].options.map((option, idx) => {
                                    const isSelected = selectedOption === idx;
                                    const isCorrect = idx === currentQuestions[currentQuestionIndex].answer;

                                    let buttonStyle = "border-neutral-200 dark:border-zinc-700 hover:border-[#F9954E] hover:bg-[#FFF5EB] dark:hover:bg-orange-950/20";
                                    if (isAnswerChecked) {
                                        if (isCorrect) buttonStyle = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400";
                                        else if (isSelected) buttonStyle = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400";
                                        else buttonStyle = "border-neutral-200 dark:border-zinc-800 opacity-50";
                                    } else if (isSelected) {
                                        buttonStyle = "border-[#F9954E] bg-[#FFF5EB] dark:bg-orange-950/20 ring-1 ring-[#F9954E] text-[#D4711A] dark:text-[#FBAA60]";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(idx)}
                                            disabled={isAnswerChecked}
                                            className={`w-full p-4 rounded-xl text-left border-2 transition-all duration-200 font-medium ${buttonStyle}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{option}</span>
                                                {isAnswerChecked && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                                {isAnswerChecked && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* 확인 버튼 */}
                            <button
                                onClick={submitAnswer}
                                disabled={selectedOption === null || isAnswerChecked}
                                className={`w-full mt-8 py-3 rounded-xl font-bold text-white transition-all 
                                    ${selectedOption === null ? 'bg-neutral-300 dark:bg-zinc-700 cursor-not-allowed' : 'bg-[#F9954E] hover:bg-[#E8832E] shadow-lg hover:shadow-[#F9954E]/30'}
                                    ${isAnswerChecked ? 'opacity-0 pointer-events-none' : ''}
                                `}
                            >
                                정답 확인
                            </button>
                        </div>
                    )}

                    {gameState === "RESULT" && (
                        <div className="text-center py-12 animate-fade-in">
                            {score === QUESTIONS_PER_ROUND ? (
                                <>
                                    <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-6 drop-shadow-lg animate-bounce" />
                                    <h2 className="text-4xl font-bold mb-2">Round {round} Clear!</h2>
                                    <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8">
                                        완벽합니다! 5문제를 모두 맞추셨어요.
                                    </p>
                                    <button
                                        onClick={handleNextRound}
                                        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold transition-all shadow-lg hover:shadow-[#F9954E]/30 flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <span>다음 라운드 도전</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 mx-auto bg-neutral-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 text-4xl">
                                        😭
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">Game Over</h2>
                                    <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-sm mx-auto">
                                        아쉽네요. <span className="text-[#F9954E] font-bold">{score}</span>문제만 맞추셨습니다.<br />
                                        다음 라운드로 가려면 5문제를 모두 맞춰야 합니다.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button
                                            onClick={startNewGame}
                                            className="px-6 py-3 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold transition-all shadow-lg hover:shadow-[#F9954E]/30 flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            처음부터 다시하기
                                        </button>
                                        <Link
                                            href="/minigame"
                                            className="px-6 py-3 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-neutral-300 font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                            나가기
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {gameState === "CLEAR" && (
                        <div className="text-center py-12 animate-fade-in">
                            <Trophy className="w-32 h-32 mx-auto text-yellow-500 mb-6 drop-shadow-xl" />
                            <h2 className="text-4xl font-bold mb-4">All Clear!</h2>
                            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                                축하합니다! 준비된 모든 문제를 풀었습니다.<br />
                                당신은 진정한 AI 마스터입니다!
                            </p>
                            <div className="text-2xl font-bold mb-8">
                                최종 점수: <span className="text-[#F9954E]">{totalScore}</span> 점
                            </div>
                            <Link
                                href="/minigame"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#F9954E] hover:bg-[#E8832E] text-white font-bold transition-all shadow-lg hover:shadow-[#F9954E]/30"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                메인으로 돌아가기
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}
