"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RefreshCw, ArrowRight, Brain } from "lucide-react";
import { QUIZ_POOL, QuizQuestion } from "./data";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

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
            bigBurst();
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
            burst();
            setScore(prev => prev + 1);
            setTotalScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentQuestionIndex < currentQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswerChecked(false);
            } else {
                // 라운드 종료: 누적 정답 수를 명예의 전당에 등록
                // totalScore 상태는 이번 정답 반영 전 값이므로 로컬로 최종값 계산
                const finalTotalScore = totalScore + (isCorrect ? 1 : 0);
                // 이번 라운드 정답 수(로컬 최종값)가 만점이면 큰 축하 연출
                if (score + (isCorrect ? 1 : 0) === QUESTIONS_PER_ROUND) bigBurst();
                if (session?.user?.email) {
                    submitScore("quiz", session.user.name || "플레이어", finalTotalScore, "desc");
                    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "quiz" }));
                }
                setGameState("RESULT");
            }
        }, 1500);
    };

    return (
        <main className="min-h-screen bg-[#09090e] text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* 배경 글로우 */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            <div className="relative z-10 w-full max-w-2xl">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span>나가기</span>
                        </Link>
                        <h1 className="text-[15px] font-extrabold tracking-tight text-white">🧠 AI 상식 퀴즈</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                            <div className="text-[9px] uppercase tracking-widest text-stone-500">SCORE</div>
                            <div className="text-sm font-bold text-white tabular-nums">
                                <span key={totalScore} className="arcade-pop inline-block">
                                    <CountUp value={totalScore} className="tabular-nums" />
                                </span>
                            </div>
                        </div>
                        <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                            <div className="text-[9px] uppercase tracking-widest text-stone-500">ROUND</div>
                            <div className="text-sm font-bold text-[#F9954E] tabular-nums">
                                <span key={round} className="arcade-pop inline-block">
                                    <CountUp value={round} className="tabular-nums" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 게임 화면 */}
                <div className="arcade-card arcade-rise rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-8 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-center">

                    {gameState === "START" && (
                        <div className="text-center py-12">
                            <Brain className="arcade-float w-20 h-20 mx-auto text-[#F9954E] mb-6" />
                            <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-white">AI 상식 퀴즈 서바이벌</h2>
                            <p className="text-stone-400 mb-8 max-w-md mx-auto leading-relaxed">
                                5문제를 모두 맞혀야 다음 라운드로 넘어갈 수 있습니다.<br />
                                얼마나 오래 살아남을 수 있을까요?
                            </p>
                            <button
                                onClick={startNewGame}
                                className="arcade-shine arcade-glow px-8 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform"
                            >
                                도전하기
                            </button>
                        </div>
                    )}

                    {gameState === "PLAY" && currentQuestions.length > 0 && (
                        <div className="py-4">
                            {/* 진행바 */}
                            <div className="flex items-center justify-between mb-6 text-[10px] uppercase tracking-widest text-stone-500 font-medium">
                                <span className="tabular-nums">Round {round} · Q{currentQuestionIndex + 1}</span>
                                <span className={score === currentQuestionIndex ? "text-[#F9954E] tabular-nums" : "text-stone-500 tabular-nums"}>
                                    현재 <span key={score} className="arcade-pop inline-block"><CountUp value={score} className="tabular-nums" /></span> / {QUESTIONS_PER_ROUND} 정답
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/[0.06] border border-white/10 rounded-full mb-8 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#F9954E] to-[#E8832E] transition-all duration-500 ease-out"
                                    style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS_PER_ROUND) * 100}%` }}
                                />
                            </div>

                            {/* 카테고리 뱃지 */}
                            <div className="mb-4">
                                <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-medium text-stone-400">
                                    {currentQuestions[currentQuestionIndex].category}
                                </span>
                            </div>

                            {/* 질문 */}
                            <h2 className="text-2xl font-extrabold tracking-tight text-white mb-8 leading-snug break-keep">
                                {currentQuestions[currentQuestionIndex].question}
                            </h2>

                            {/* 보기 */}
                            <div className="space-y-3">
                                {currentQuestions[currentQuestionIndex].options.map((option, idx) => {
                                    const isSelected = selectedOption === idx;
                                    const isCorrect = idx === currentQuestions[currentQuestionIndex].answer;

                                    let buttonStyle = "border-white/10 bg-white/[0.03] text-stone-200 hover:border-[#F9954E]/50 hover:bg-white/[0.06]";
                                    if (isAnswerChecked) {
                                        if (isCorrect) buttonStyle = "border-green-500/60 bg-green-500/10 text-green-400";
                                        else if (isSelected) buttonStyle = "border-red-500/60 bg-red-500/10 text-red-400";
                                        else buttonStyle = "border-white/10 bg-white/[0.02] opacity-40";
                                    } else if (isSelected) {
                                        buttonStyle = "border-[#F9954E] bg-[#F9954E]/10 ring-1 ring-[#F9954E] text-[#FBAA60]";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(idx)}
                                            disabled={isAnswerChecked}
                                            className={`w-full p-4 rounded-xl text-left border transition-all duration-200 font-medium active:scale-[0.97] ${buttonStyle}`}
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
                                className={`w-full mt-8 py-3 rounded-xl font-bold text-white transition-all active:scale-[0.97]
                                    ${selectedOption === null ? 'bg-white/[0.06] border border-white/10 opacity-40 cursor-not-allowed' : 'arcade-shine bg-gradient-to-b from-[#F9954E] to-[#E8832E] shadow-lg shadow-[#F9954E]/20'}
                                    ${isAnswerChecked ? 'opacity-0 pointer-events-none' : ''}
                                `}
                            >
                                정답 확인
                            </button>
                        </div>
                    )}

                    {gameState === "RESULT" && (
                        <div className="text-center py-12 arcade-pop-in">
                            {score === QUESTIONS_PER_ROUND ? (
                                <>
                                    <Trophy className="arcade-float w-24 h-24 mx-auto text-[#F9954E] mb-6 drop-shadow-lg" />
                                    <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">Round {round} Clear!</h2>
                                    <p className="text-lg text-stone-400 mb-8">
                                        완벽합니다! 5문제를 모두 맞히셨어요.
                                    </p>
                                    <button
                                        onClick={handleNextRound}
                                        className="arcade-shine arcade-glow w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <span>다음 라운드 도전</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="arcade-float w-24 h-24 mx-auto rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center mb-6 text-4xl">
                                        😭
                                    </div>
                                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Game Over</h2>
                                    <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">이번 라운드 정답</div>
                                    <div className="text-5xl font-black arcade-grad-text tabular-nums mb-4">
                                        <CountUp value={score} className="tabular-nums" /><span className="text-lg text-stone-500 font-bold"> / {QUESTIONS_PER_ROUND}</span>
                                    </div>
                                    <p className="text-stone-400 mb-8 max-w-sm mx-auto">
                                        아쉽네요. 다음 라운드로 가려면<br />
                                        5문제를 모두 맞혀야 합니다.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <button
                                            onClick={startNewGame}
                                            className="arcade-shine px-6 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-5 h-5" />
                                            처음부터 다시하기
                                        </button>
                                        <Link
                                            href="/minigame"
                                            className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-stone-200 hover:bg-white/[0.1] font-semibold transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
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
                        <div className="text-center py-12 arcade-pop-in">
                            <Trophy className="arcade-float w-32 h-32 mx-auto text-[#F9954E] mb-6 drop-shadow-xl" />
                            <h2 className="text-4xl font-extrabold tracking-tight text-white mb-4">All Clear!</h2>
                            <p className="text-lg text-stone-400 mb-8 max-w-md mx-auto">
                                축하합니다! 준비된 모든 문제를 풀었습니다.<br />
                                당신은 진정한 AI 마스터입니다!
                            </p>
                            <div className="mb-8">
                                <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">최종 점수</div>
                                <div className="text-6xl font-black arcade-grad-text tabular-nums">
                                    <CountUp value={totalScore} className="tabular-nums" /><span className="text-lg text-stone-500 font-bold"> 점</span>
                                </div>
                            </div>
                            <Link
                                href="/minigame"
                                className="arcade-shine arcade-glow inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                메인으로 돌아가기
                            </Link>
                        </div>
                    )}

                </div>

                {/* 명예의 전당 */}
                <div className="w-full max-w-2xl mx-auto mt-4">
                    <GameLeaderboard game="quiz" title="명예의 전당 TOP 5" unit="점" order="desc" tone="dark" />
                </div>

                <GameSuggestion />
            </div>
        </main>
    );
}
