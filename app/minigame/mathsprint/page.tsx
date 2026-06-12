"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Calculator, Play, RotateCcw, Check, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

const GAME = "mathsprint";
const ORDER = "desc" as const;
const UNIT = "점";
const DURATION = 60; // 초

type Phase = "idle" | "playing" | "done";

interface Problem {
    text: string;
    answer: number;
    choices: number[];
}

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function makeProblem(): Problem {
    const op = ["+", "-", "×"][randInt(0, 2)];
    let a: number, b: number, answer: number;

    if (op === "+") {
        a = randInt(2, 99);
        b = randInt(2, 99);
        answer = a + b;
    } else if (op === "-") {
        a = randInt(11, 99);
        b = randInt(2, a); // 음수 방지
        answer = a - b;
    } else {
        a = randInt(2, 12);
        b = randInt(2, 12);
        answer = a * b;
    }

    // 보기 4개: 정답 1 + 그럴듯한 오답 3
    const choiceSet = new Set<number>([answer]);
    let guard = 0;
    while (choiceSet.size < 4 && guard < 40) {
        guard++;
        const delta = randInt(1, Math.max(3, Math.round(Math.abs(answer) * 0.15) + 2));
        const sign = Math.random() < 0.5 ? -1 : 1;
        const candidate = answer + sign * delta;
        if (candidate >= 0) choiceSet.add(candidate);
    }
    // 혹시라도 못 채우면 멀리 떨어진 값으로 보충
    let pad = 1;
    while (choiceSet.size < 4) {
        choiceSet.add(answer + pad * 5);
        pad++;
    }

    return {
        text: `${a} ${op} ${b}`,
        answer,
        choices: shuffle([...choiceSet]),
    };
}

export default function MathSprintPage() {
    const { session } = useAuth();

    const [phase, setPhase] = useState<Phase>("idle");
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(DURATION);
    const [problem, setProblem] = useState<Problem | null>(null);
    const [typed, setTyped] = useState("");
    const [best, setBest] = useState(0);
    const [isNewBest, setIsNewBest] = useState(false);
    const [feedback, setFeedback] = useState<null | "ok" | "no">(null);
    const [streak, setStreak] = useState(0);
    const [picked, setPicked] = useState<number | null>(null);
    const [shake, setShake] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lockRef = useRef(false);
    const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 로컬 최고점 로드
    useEffect(() => {
        try {
            const raw = localStorage.getItem(`${GAME}_best`);
            if (raw) setBest(parseInt(raw, 10) || 0);
        } catch { /* 무시 */ }
    }, []);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            clearTimer();
            if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
        };
    }, [clearTimer]);

    const finishGame = useCallback((finalScore: number) => {
        clearTimer();
        setPhase("done");
        setProblem(null);
        lockRef.current = true;

        let newBest = false;
        try {
            const prev = parseInt(localStorage.getItem(`${GAME}_best`) || "0", 10) || 0;
            if (finalScore > prev) {
                localStorage.setItem(`${GAME}_best`, String(finalScore));
                setBest(finalScore);
                newBest = finalScore > 0;
            }
        } catch { /* 무시 */ }
        setIsNewBest(newBest);

        if (finalScore > 0 && newBest) bigBurst();

        if (session?.user?.email && finalScore > 0) {
            submitScore(GAME, session.user.name || "플레이어", finalScore, ORDER);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: GAME }));
            }
        }
    }, [clearTimer, session]);

    const startGame = useCallback(() => {
        clearTimer();
        if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
        lockRef.current = false;
        setScore(0);
        setStreak(0);
        setTimeLeft(DURATION);
        setTyped("");
        setFeedback(null);
        setPicked(null);
        setIsNewBest(false);
        setProblem(makeProblem());
        setPhase("playing");

        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    // 마지막 틱 — 최신 점수로 종료
                    setScore((s) => {
                        finishGame(s);
                        return s;
                    });
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        setTimeout(() => inputRef.current?.focus(), 120);
    }, [clearTimer, finishGame]);

    const nextProblem = useCallback(() => {
        setProblem(makeProblem());
        setTyped("");
        setPicked(null);
    }, []);

    const handleAnswer = useCallback((value: number, source: "tap" | "type") => {
        if (lockRef.current || phase !== "playing" || !problem) return;

        if (value === problem.answer) {
            // 정답
            setScore((s) => s + 1);
            setStreak((k) => k + 1);
            setFeedback("ok");
            setPicked(source === "tap" ? value : null);
            burst({ count: 26, y: 0.55 });
            if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
            feedbackTimer.current = setTimeout(() => setFeedback(null), 280);
            nextProblem();
        } else {
            // 오답 — 감점 없음. 다음 문제 X (같은 문제 유지), 살짝 흔들기
            setStreak(0);
            setFeedback("no");
            setShake((n) => n + 1);
            setTyped("");
            setPicked(source === "tap" ? value : null);
            if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
            feedbackTimer.current = setTimeout(() => {
                setFeedback(null);
                setPicked(null);
            }, 300);
        }
    }, [phase, problem, nextProblem]);

    const submitTyped = useCallback(() => {
        const v = parseInt(typed, 10);
        if (typed.trim() === "" || Number.isNaN(v)) return;
        handleAnswer(v, "type");
    }, [typed, handleAnswer]);

    const onTypeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            submitTyped();
        }
    };

    const reset = () => {
        clearTimer();
        if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
        lockRef.current = false;
        setPhase("idle");
        setScore(0);
        setStreak(0);
        setTimeLeft(DURATION);
        setProblem(null);
        setTyped("");
        setFeedback(null);
        setPicked(null);
        setIsNewBest(false);
    };

    const progress = Math.max(0, Math.min(100, (timeLeft / DURATION) * 100));
    const urgent = timeLeft <= 10;

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            <header className="fixed top-0 left-0 w-full h-16 bg-[#09090e]/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-4 sm:px-6">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    뒤로
                </Link>
                <h1 className="text-[15px] font-extrabold tracking-tight text-white inline-flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-[#F9954E]" />
                    빠른 계산
                </h1>
                <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center min-w-[64px]">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">SCORE</div>
                    <div className="text-sm font-bold text-white tabular-nums">
                        <CountUp value={score} className="tabular-nums" />
                    </div>
                </div>
            </header>

            <div className="pt-20 pb-10 px-4 max-w-xl mx-auto">

                {/* IDLE */}
                {phase === "idle" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="arcade-card arcade-rise rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-7 sm:p-10 text-center"
                    >
                        <Calculator className="arcade-float w-16 h-16 mx-auto mb-4 text-[#F9954E]" />
                        <h2 className="text-2xl font-extrabold tracking-tight mb-3">60초 빠른 계산</h2>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-2">
                            제한 시간 안에 사칙연산 문제를 최대한 많이 맞혀보세요.
                        </p>
                        <p className="text-neutral-500 text-[13px] mb-7">
                            보기를 탭하거나 직접 숫자를 입력하세요. 정답 +1점, 오답은 감점 없음!
                        </p>

                        {best > 0 && (
                            <div className="inline-flex items-center gap-2 mb-7 rounded-full bg-white/[0.05] border border-white/10 px-4 py-1.5 text-[13px]">
                                <span className="text-neutral-500">내 최고 기록</span>
                                <span className="font-bold arcade-grad-text tabular-nums">{best}{UNIT}</span>
                            </div>
                        )}

                        <button
                            onClick={startGame}
                            className="arcade-shine arcade-glow w-full sm:w-auto px-10 py-3.5 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold text-lg shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform"
                        >
                            <Play className="w-5 h-5 inline mr-2 -mt-0.5" />
                            게임 시작
                        </button>
                    </motion.div>
                )}

                {/* PLAYING */}
                {phase === "playing" && problem && (
                    <div className="arcade-card arcade-rise rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-5 sm:p-7">

                        {/* 타이머 바 + 정보 */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-2 text-[13px]">
                                <span className={`font-bold tabular-nums ${urgent ? "text-red-400 arcade-pop" : "text-neutral-300"}`}>
                                    ⏱ {timeLeft}s
                                </span>
                                <span className="text-neutral-500">
                                    연속 <span className="font-bold text-[#F9954E] tabular-nums">{streak}</span>
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${urgent ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-[#F9954E] to-[#E8832E]"}`}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.9, ease: "linear" }}
                                />
                            </div>
                        </div>

                        {/* 문제 */}
                        <motion.div
                            key={problem.text + shake}
                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                            animate={feedback === "no"
                                ? { opacity: 1, y: 0, scale: 1, x: [0, -8, 8, -6, 6, 0] }
                                : { opacity: 1, y: 0, scale: 1, x: 0 }}
                            transition={{ duration: 0.28 }}
                            className="relative mb-6 rounded-2xl bg-white/[0.04] border border-white/10 py-8 text-center"
                        >
                            <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">문제</div>
                            <div className="text-4xl sm:text-5xl font-black tabular-nums arcade-grad-text">
                                {problem.text}
                                <span className="text-neutral-500"> = ?</span>
                            </div>

                            <AnimatePresence>
                                {feedback && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className={`absolute top-3 right-3 rounded-full p-1.5 ${feedback === "ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                                    >
                                        {feedback === "ok" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* 보기 4개 */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            {problem.choices.map((c) => {
                                const isPicked = picked === c;
                                const wrongPick = isPicked && feedback === "no";
                                const rightPick = isPicked && feedback === "ok";
                                return (
                                    <button
                                        key={c}
                                        onClick={() => handleAnswer(c, "tap")}
                                        className={`arcade-shine select-none rounded-xl py-5 text-2xl font-bold tabular-nums border transition-transform active:scale-[0.95]
                                            ${wrongPick
                                                ? "bg-red-500/20 border-red-500/50 text-red-300"
                                                : rightPick
                                                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                                    : "bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.09] hover:border-white/20"}`}
                                    >
                                        {c}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 직접 입력 */}
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="number"
                                inputMode="numeric"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                onKeyDown={onTypeKey}
                                placeholder="직접 입력"
                                className="flex-1 min-w-0 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-lg font-bold tabular-nums text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#F9954E]/60 transition-colors"
                            />
                            <button
                                onClick={submitTyped}
                                className="arcade-shine shrink-0 px-6 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold active:scale-[0.97] transition-transform"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                )}

                {/* DONE */}
                {phase === "done" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="arcade-pop-in arcade-card rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-7 sm:p-10 text-center"
                    >
                        <div className="arcade-float text-6xl mb-4">{isNewBest ? "🏆" : "⏰"}</div>
                        <h2 className="text-2xl font-extrabold tracking-tight mb-1">시간 종료!</h2>
                        {isNewBest && (
                            <div className="inline-block mb-4 mt-1 rounded-full bg-[#F9954E]/15 border border-[#F9954E]/30 px-3 py-1 text-[12px] font-bold text-[#F9954E] arcade-pop">
                                🎉 신기록 달성!
                            </div>
                        )}

                        <div className="my-6">
                            <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">최종 점수</div>
                            <div className="text-6xl font-black arcade-grad-text tabular-nums">
                                <CountUp value={score} className="tabular-nums" />
                            </div>
                            <div className="text-[11px] uppercase tracking-widest text-neutral-500 mt-1">{UNIT}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-7 text-sm">
                            <div className="rounded-xl bg-white/[0.04] border border-white/10 py-3">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">내 최고</div>
                                <div className="font-bold text-white tabular-nums">{best}{UNIT}</div>
                            </div>
                            <div className="rounded-xl bg-white/[0.04] border border-white/10 py-3">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">평가</div>
                                <div className="font-bold text-white">
                                    {score >= 30 ? "🚀 천재" : score >= 20 ? "⚡ 빠름" : score >= 10 ? "👍 좋아요" : "💪 도전!"}
                                </div>
                            </div>
                        </div>

                        {!session?.user?.email && (
                            <p className="text-[12px] text-neutral-500 mb-4">
                                로그인하면 명예의 전당에 기록이 등록돼요.
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={startGame}
                                className="arcade-shine arcade-glow flex-1 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform"
                            >
                                다시 하기
                            </button>
                            <button
                                onClick={reset}
                                className="px-5 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] font-semibold transition-transform active:scale-[0.97]"
                                aria-label="처음으로"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* 명예의 전당 */}
                <div className="mt-4">
                    <GameLeaderboard game={GAME} title="명예의 전당 TOP 5" unit={UNIT} order={ORDER} tone="dark" />
                </div>

                <GameSuggestion />
            </div>
        </main>
    );
}
