"use client";

// 반응속도 테스트 미니게임 — 다크 아케이드 통일 디자인
// 빨강(대기) → 1.5~4초 랜덤 후 초록(탭!) → 반응시간(ms) 측정.
// 5회 측정 후 최고기록(가장 낮은 ms)을 finalScore로 랭킹 등록(order asc).

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Zap, RotateCcw } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

const GAME = "reaction";
const ORDER = "asc" as const;
const UNIT = "ms";
const ROUNDS = 5;
const BEST_KEY = "reaction_best";

type Phase = "idle" | "waiting" | "ready" | "result" | "early" | "done";

export default function ReactionPage() {
    const { session } = useAuth();

    const [phase, setPhase] = useState<Phase>("idle");
    const [round, setRound] = useState(0); // 0-based, 측정 완료한 회차 수
    const [times, setTimes] = useState<number[]>([]);
    const [lastTime, setLastTime] = useState(0);
    const [best, setBest] = useState<number | null>(null); // 로컬 최고기록(ms)
    const [finalBest, setFinalBest] = useState(0); // 이번 판 최고기록
    const [finalAvg, setFinalAvg] = useState(0);
    const [isNewLocalBest, setIsNewLocalBest] = useState(false);

    const goAtRef = useRef(0); // 초록 전환 시각(performance.now)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 로컬 최고기록 로드
    useEffect(() => {
        try {
            const raw = localStorage.getItem(BEST_KEY);
            if (raw) {
                const v = Number(raw);
                if (Number.isFinite(v) && v > 0) setBest(v);
            }
        } catch { /* localStorage 무시 */ }
    }, []);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => () => clearTimer(), [clearTimer]);

    // 다음 라운드 대기 시작(빨강 → 랜덤 후 초록)
    const armRound = useCallback(() => {
        setPhase("waiting");
        clearTimer();
        const delay = 1500 + Math.random() * 2500; // 1.5 ~ 4.0초
        timerRef.current = setTimeout(() => {
            goAtRef.current = performance.now();
            setPhase("ready");
        }, delay);
    }, [clearTimer]);

    // 게임 전체 시작/리셋
    const startGame = useCallback(() => {
        clearTimer();
        setRound(0);
        setTimes([]);
        setLastTime(0);
        setFinalBest(0);
        setFinalAvg(0);
        setIsNewLocalBest(false);
        armRound();
    }, [armRound, clearTimer]);

    // 한 판 종료 처리
    const finishGame = useCallback(
        (allTimes: number[]) => {
            const bestMs = Math.min(...allTimes);
            const avgMs = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length);
            setFinalBest(bestMs);
            setFinalAvg(avgMs);
            setPhase("done");

            // 로컬 최고기록 갱신
            let newLocal = false;
            if (best === null || bestMs < best) {
                newLocal = true;
                setBest(bestMs);
                try { localStorage.setItem(BEST_KEY, String(bestMs)); } catch { /* 무시 */ }
            }
            setIsNewLocalBest(newLocal);

            if (newLocal) bigBurst(); else burst();

            // 전역 랭킹 등록(로그인 회원만, 최저 ms)
            if (session?.user?.email) {
                submitScore(GAME, session.user.name || "플레이어", bestMs, ORDER);
                window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: GAME }));
            }
        },
        [best, session]
    );

    // 패드 탭 처리
    const handleTap = useCallback(() => {
        if (phase === "idle" || phase === "done") {
            startGame();
            return;
        }
        if (phase === "waiting") {
            // 초록 전에 탭 → 실패, 같은 라운드 재시도
            clearTimer();
            setPhase("early");
            return;
        }
        if (phase === "early") {
            armRound();
            return;
        }
        if (phase === "ready") {
            const ms = Math.max(1, Math.round(performance.now() - goAtRef.current));
            setLastTime(ms);
            const nextTimes = [...times, ms];
            setTimes(nextTimes);
            const nextRound = round + 1;
            setRound(nextRound);

            if (nextRound >= ROUNDS) {
                finishGame(nextTimes);
            } else {
                setPhase("result");
            }
            return;
        }
        if (phase === "result") {
            armRound();
            return;
        }
    }, [phase, times, round, startGame, armRound, clearTimer, finishGame]);

    // 스페이스바 지원(데스크톱 손맛)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === "Space" || e.key === " ") {
                e.preventDefault();
                handleTap();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [handleTap]);

    // 등급 평가
    const grade = (ms: number) => {
        if (ms < 180) return { label: "🚀 인간을 초월했어요!", color: "text-emerald-400" };
        if (ms < 230) return { label: "⚡ 번개 같은 반사신경!", color: "text-emerald-400" };
        if (ms < 300) return { label: "👍 아주 빨라요!", color: "text-[#F9954E]" };
        if (ms < 400) return { label: "🙂 평균 수준이에요", color: "text-neutral-200" };
        return { label: "💪 조금 더 집중!", color: "text-neutral-300" };
    };

    // 패드 색/문구
    const pad = (() => {
        switch (phase) {
            case "ready":
                return {
                    bg: "bg-gradient-to-b from-emerald-400 to-emerald-600",
                    ring: "ring-emerald-300/50",
                    title: "지금 탭!",
                    sub: "최대한 빨리!",
                    titleCls: "text-white",
                };
            case "early":
                return {
                    bg: "bg-gradient-to-b from-rose-500 to-rose-700",
                    ring: "ring-rose-300/40",
                    title: "너무 빨라요!",
                    sub: "초록색이 될 때까지 기다리세요 · 탭하여 재시도",
                    titleCls: "text-white",
                };
            case "waiting":
                return {
                    bg: "bg-gradient-to-b from-[#3a1d1d] to-[#2a1414]",
                    ring: "ring-rose-500/20",
                    title: "기다리세요…",
                    sub: "초록색이 되면 탭!",
                    titleCls: "text-rose-300",
                };
            case "result":
                return {
                    bg: "bg-gradient-to-b from-white/[0.07] to-white/[0.02]",
                    ring: "ring-white/10",
                    title: `${lastTime} ms`,
                    sub: `다음 라운드 · 탭하여 계속 (${round}/${ROUNDS})`,
                    titleCls: "arcade-grad-text",
                };
            default:
                return {
                    bg: "bg-gradient-to-b from-white/[0.07] to-white/[0.02]",
                    ring: "ring-white/10",
                    title: phase === "done" ? "다시 도전" : "탭하여 시작",
                    sub: "초록색이 되는 순간 가장 빠르게 탭하세요",
                    titleCls: "text-white",
                };
        }
    })();

    const showScore = phase === "done" ? finalBest : best ?? 0;

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]"
            />

            <header className="fixed top-0 left-0 w-full h-16 bg-[#09090e]/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-4 sm:px-6">
                <Link
                    href="/minigame"
                    className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    뒤로
                </Link>
                <h1 className="inline-flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight text-white">
                    <Zap className="w-4 h-4 text-[#F9954E]" />
                    반응속도 테스트
                </h1>
                <div className="rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">Best {UNIT}</div>
                    <div className="text-sm font-bold text-white tabular-nums">
                        {showScore > 0 ? <CountUp value={showScore} className="tabular-nums" /> : "—"}
                    </div>
                </div>
            </header>

            <div className="pt-20 pb-10 px-4 max-w-xl mx-auto">
                {/* 라운드 진행 도트 */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    {Array.from({ length: ROUNDS }).map((_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i < round
                                    ? "w-8 bg-[#F9954E]"
                                    : i === round && phase !== "idle" && phase !== "done"
                                    ? "w-8 bg-white/30"
                                    : "w-4 bg-white/10"
                            }`}
                        />
                    ))}
                </div>

                {/* 메인 패드 */}
                <button
                    onClick={handleTap}
                    aria-label="반응 패드"
                    className={`arcade-card arcade-rise relative w-full select-none rounded-3xl border border-white/10 ring-1 ${pad.ring} ${pad.bg} flex flex-col items-center justify-center text-center px-6 transition-colors duration-150 active:scale-[0.99]`}
                    style={{ minHeight: "min(60vh, 420px)" }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phase + (phase === "result" ? lastTime : "")}
                            initial={{ opacity: 0, scale: 0.92, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            className="flex flex-col items-center"
                        >
                            {phase === "ready" && <Zap className="w-12 h-12 mb-3 text-white drop-shadow" />}
                            {(phase === "idle" || phase === "done") && (
                                <Zap className="arcade-float w-14 h-14 mb-4 text-[#F9954E]" />
                            )}
                            {phase === "waiting" && (
                                <div className="arcade-float text-4xl mb-3" aria-hidden>
                                    ✋
                                </div>
                            )}
                            <div className={`text-4xl sm:text-5xl font-black tracking-tight tabular-nums ${pad.titleCls}`}>
                                {pad.title}
                            </div>
                            <div className="mt-3 text-sm text-white/70 max-w-xs">{pad.sub}</div>
                        </motion.div>
                    </AnimatePresence>

                    {phase === "done" && (
                        <span className="absolute bottom-4 text-[11px] text-white/40">
                            평균 {finalAvg} ms · 최고 {finalBest} ms
                        </span>
                    )}
                </button>

                {/* 측정 기록 칩 */}
                {times.length > 0 && phase !== "idle" && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {times.map((t, i) => {
                            const isMin = t === Math.min(...times);
                            return (
                                <span
                                    key={i}
                                    className={`arcade-pop rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums ${
                                        isMin
                                            ? "border-[#F9954E]/50 bg-[#F9954E]/15 text-[#F9954E]"
                                            : "border-white/10 bg-white/[0.04] text-neutral-300"
                                    }`}
                                >
                                    {t}
                                    <span className="ml-0.5 text-[9px] opacity-60">ms</span>
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* 결과 카드 */}
                {phase === "done" && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="arcade-pop-in mt-5"
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <div className="arcade-card arcade-rise-1 p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 text-center">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">최고 기록</div>
                                <div className="text-4xl font-black arcade-grad-text tabular-nums">
                                    <CountUp value={finalBest} className="tabular-nums" />
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">{UNIT}</div>
                            </div>
                            <div className="arcade-card arcade-rise-2 p-5 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 text-center">
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">평균</div>
                                <div className="text-4xl font-black text-white tabular-nums">
                                    <CountUp value={finalAvg} className="tabular-nums" />
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-2">{UNIT}</div>
                            </div>
                        </div>

                        <div className="arcade-card arcade-rise-3 mt-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                            <p className={`text-lg font-bold ${grade(finalBest).color}`}>{grade(finalBest).label}</p>
                            {isNewLocalBest && (
                                <p className="mt-1 text-xs font-bold text-[#F9954E]">🎉 개인 최고기록 갱신!</p>
                            )}
                        </div>

                        <button
                            onClick={startGame}
                            className="arcade-shine arcade-glow mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform"
                        >
                            <RotateCcw className="w-5 h-5" />
                            다시 도전
                        </button>
                    </motion.div>
                )}

                {/* 명예의 전당 */}
                <div className="mt-5">
                    <GameLeaderboard game={GAME} title="명예의 전당 TOP 5" unit={UNIT} order={ORDER} tone="dark" />
                </div>
            </div>
        </main>
    );
}
