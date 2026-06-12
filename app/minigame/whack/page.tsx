"use client";

// 두더지 잡기 — 3x3 구멍 그리드, 30초 안에 등장하는 두더지를 탭해서 점수 획득
// 랭킹: GAME="whack", ORDER="desc", UNIT="점"
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Hammer, Play, RotateCcw, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------

const GAME = "whack";
const ORDER = "desc" as const;
const UNIT = "점";
const BEST_KEY = "whack_best"; // 로컬 최고점
const GRID = 9; // 3x3
const DURATION = 30; // 초

type Phase = "ready" | "playing" | "over";

export default function WhackGame() {
    const { session } = useAuth();

    const [phase, setPhase] = useState<Phase>("ready");
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(DURATION);
    const [activeHole, setActiveHole] = useState<number>(-1); // 두더지가 떠있는 구멍 (-1=없음)
    const [bonkedHole, setBonkedHole] = useState<number>(-1); // 방금 맞은 구멍 (별 연출)
    const [best, setBest] = useState(0);
    const [isNewBest, setIsNewBest] = useState(false);

    // setInterval/타임아웃 핸들 보관 (언마운트/종료 시 정리)
    const spawnRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const bonkRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 최신 점수를 종료 시점에 정확히 읽기 위한 ref
    const scoreRef = useRef(0);

    // 로컬 최고점 로드
    useEffect(() => {
        try {
            const v = Number(localStorage.getItem(BEST_KEY) || "0");
            if (Number.isFinite(v)) setBest(v);
        } catch { /* 무시 */ }
    }, []);

    const clearAll = useCallback(() => {
        if (spawnRef.current) { clearTimeout(spawnRef.current); spawnRef.current = null; }
        if (hideRef.current) { clearTimeout(hideRef.current); hideRef.current = null; }
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
        if (bonkRef.current) { clearTimeout(bonkRef.current); bonkRef.current = null; }
    }, []);

    // 다음 두더지 등장 스케줄링 (0.7~1.1초마다 랜덤 구멍에 잠깐 등장)
    const scheduleSpawn = useCallback(() => {
        const wait = 700 + Math.random() * 400; // 0.7 ~ 1.1초
        spawnRef.current = setTimeout(() => {
            const hole = Math.floor(Math.random() * GRID);
            setActiveHole(hole);
            // 두더지가 머무는 시간 (점점 빨라지지 않고 일정 + 약간 랜덤)
            const stay = 650 + Math.random() * 350; // 0.65 ~ 1.0초
            hideRef.current = setTimeout(() => {
                setActiveHole(-1);
                scheduleSpawn();
            }, stay);
        }, wait);
    }, []);

    // 게임 종료 처리
    const finish = useCallback(() => {
        clearAll();
        setActiveHole(-1);
        setPhase("over");

        const finalScore = scoreRef.current;

        // 로컬 최고점 갱신
        let beatLocal = false;
        try {
            const prev = Number(localStorage.getItem(BEST_KEY) || "0");
            if (finalScore > prev) {
                localStorage.setItem(BEST_KEY, String(finalScore));
                setBest(finalScore);
                beatLocal = true;
            }
        } catch { /* 무시 */ }
        setIsNewBest(beatLocal);

        // 연출: 신기록/유효 점수면 큰 축하, 그 외 가벼운 축하
        if (finalScore > 0 && beatLocal) bigBurst();
        else if (finalScore > 0) burst();

        // 명예의 전당 등록 (로그인 회원만)
        if (session?.user?.email && finalScore > 0) {
            submitScore(GAME, session.user.name || "플레이어", finalScore, ORDER);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: GAME }));
            }
        }
    }, [clearAll, session]);

    // 게임 시작
    const start = useCallback(() => {
        clearAll();
        scoreRef.current = 0;
        setScore(0);
        setTimeLeft(DURATION);
        setActiveHole(-1);
        setBonkedHole(-1);
        setIsNewBest(false);
        setPhase("playing");

        // 카운트다운 타이머
        tickRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    finish();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        // 첫 두더지 등장
        scheduleSpawn();
    }, [clearAll, scheduleSpawn, finish]);

    // 언마운트 정리
    useEffect(() => clearAll, [clearAll]);

    // 두더지 타격
    const whack = useCallback((idx: number) => {
        if (phase !== "playing" || idx !== activeHole) return;

        // 점수 +1
        scoreRef.current += 1;
        setScore(scoreRef.current);

        // 맞은 구멍 별 연출
        setBonkedHole(idx);
        if (bonkRef.current) clearTimeout(bonkRef.current);
        bonkRef.current = setTimeout(() => setBonkedHole(-1), 380);

        // 두더지 즉시 사라지고 다음 등장 예약 (대기 중인 hide 취소)
        setActiveHole(-1);
        if (hideRef.current) { clearTimeout(hideRef.current); hideRef.current = null; }
        scheduleSpawn();

        // 가벼운 손맛 (진동 지원 기기)
        try { if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18); } catch { /* 무시 */ }
    }, [phase, activeHole, scheduleSpawn]);

    const ratio = timeLeft / DURATION;
    const lowTime = phase === "playing" && timeLeft <= 5;

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]"
            />

            <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col border-x border-white/5">
                {/* 상단바 */}
                <header className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b border-white/10 bg-[#09090e]/80 px-4 py-3 backdrop-blur-md">
                    <Link
                        href="/minigame"
                        className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 transition-colors hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        뒤로
                    </Link>
                    <div className="flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight">
                        <Hammer className="h-4 w-4 text-[#F9954E]" />
                        두더지 잡기
                    </div>
                    <div className="arcade-card rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-center">
                        <div className="text-[9px] uppercase tracking-widest text-neutral-500">Score</div>
                        <div className="text-sm font-bold tabular-nums text-white">
                            <CountUp value={score} className="tabular-nums" />
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pb-8">
                    {/* 타이머 + 최고점 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="arcade-card arcade-rise-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-500">
                                    <Timer className="h-3 w-3" /> 남은 시간
                                </span>
                                <span className={`text-sm font-extrabold tabular-nums ${lowTime ? "text-red-400" : "text-white"}`}>
                                    {timeLeft}s
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                <motion.div
                                    className={`h-full rounded-full ${lowTime ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-[#F9954E] to-[#E8832E]"}`}
                                    initial={false}
                                    animate={{ width: `${ratio * 100}%` }}
                                    transition={{ type: "tween", duration: 0.4, ease: "linear" }}
                                />
                            </div>
                        </div>
                        <div className="arcade-card arcade-rise-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                            <div className="mb-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-neutral-500">
                                <Trophy className="h-3 w-3 text-[#F9954E]" /> 내 최고
                            </div>
                            <div className="text-lg font-extrabold tabular-nums text-white">
                                <CountUp value={best} className="tabular-nums" />
                                <span className="ml-0.5 text-xs font-bold text-neutral-500">{UNIT}</span>
                            </div>
                        </div>
                    </div>

                    {/* 게임 보드 */}
                    <div className="arcade-card arcade-rise relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4">
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: GRID }).map((_, i) => {
                                const up = phase === "playing" && activeHole === i;
                                const bonked = bonkedHole === i;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onPointerDown={() => whack(i)}
                                        disabled={phase !== "playing"}
                                        aria-label={`구멍 ${i + 1}`}
                                        className="relative flex aspect-square select-none items-end justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-inner outline-none transition-transform active:scale-[0.96]"
                                    >
                                        {/* 구멍 안쪽 그림자 */}
                                        <div
                                            aria-hidden
                                            className="pointer-events-none absolute inset-x-3 bottom-2 h-3 rounded-[50%] bg-black/60 blur-[2px]"
                                        />
                                        {/* 두더지 */}
                                        <AnimatePresence>
                                            {up && (
                                                <motion.div
                                                    key="mole"
                                                    initial={{ y: "62%", scale: 0.8, opacity: 0.5 }}
                                                    animate={{ y: "8%", scale: 1, opacity: 1 }}
                                                    exit={{ y: "70%", scale: 0.7, opacity: 0 }}
                                                    transition={{ type: "spring", stiffness: 520, damping: 24 }}
                                                    className="pointer-events-none text-[2.6rem] leading-none drop-shadow-[0_4px_10px_rgba(249,149,78,0.3)] sm:text-5xl"
                                                >
                                                    🐹
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        {/* 타격 별 연출 */}
                                        <AnimatePresence>
                                            {bonked && (
                                                <motion.div
                                                    key="bonk"
                                                    initial={{ scale: 0.4, opacity: 1 }}
                                                    animate={{ scale: 1.5, opacity: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.38, ease: "easeOut" }}
                                                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-3xl"
                                                >
                                                    💥
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                );
                            })}
                        </div>

                        {/* 시작/종료 오버레이 */}
                        <AnimatePresence>
                            {phase !== "playing" && (
                                <motion.div
                                    key={phase}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#09090e]/85 p-6 text-center backdrop-blur-sm"
                                >
                                    {phase === "ready" ? (
                                        <>
                                            <div className="arcade-float text-5xl">🐹</div>
                                            <div>
                                                <h2 className="text-xl font-extrabold tracking-tight">두더지를 잡아라!</h2>
                                                <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">
                                                    30초 안에 튀어나오는 두더지를<br />빠르게 탭하세요. 한 마리당 1점!
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={start}
                                                className="arcade-shine arcade-glow inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] px-7 py-3 font-bold text-white shadow-lg shadow-[#F9954E]/20 transition-transform active:scale-[0.97]"
                                            >
                                                <Play className="h-5 w-5" />
                                                시작하기
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="arcade-pop-in text-5xl">{isNewBest ? "🏆" : "⏱️"}</div>
                                            <div>
                                                <h2 className="text-xl font-extrabold tracking-tight">
                                                    {isNewBest ? "신기록 달성!" : "타임 오버!"}
                                                </h2>
                                                <div className="mt-2 text-5xl font-black arcade-grad-text tabular-nums">
                                                    <CountUp value={score} className="tabular-nums" />
                                                    <span className="ml-1 text-2xl font-extrabold text-neutral-400">{UNIT}</span>
                                                </div>
                                                <p className="mt-2 text-[13px] text-neutral-400">
                                                    내 최고 기록 {best.toLocaleString()}{UNIT}
                                                    {!session?.user?.email && (
                                                        <span className="mt-1 block text-[11px] text-neutral-500">
                                                            로그인하면 명예의 전당에 기록돼요
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={start}
                                                className="arcade-shine arcade-glow inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] px-7 py-3 font-bold text-white shadow-lg shadow-[#F9954E]/20 transition-transform active:scale-[0.97]"
                                            >
                                                <RotateCcw className="h-5 w-5" />
                                                다시 하기
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 명예의 전당 */}
                    <GameLeaderboard game={GAME} title="명예의 전당 TOP 5" unit={UNIT} order={ORDER} tone="dark" />

                    {/* 건의/버그 제보 */}
                    <GameSuggestion />
                </div>
            </div>
        </main>
    );
}
