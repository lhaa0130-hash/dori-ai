"use client";

// 🎯 과녁 클릭 — 30초 안에 랜덤 위치의 과녁을 최대한 많이 맞히는 반응속도 게임
// 게임 id="aim" / 랭킹: GAME="aim", ORDER="desc", UNIT="점" / 아이콘 lucide "Target"
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Target, Play, RotateCcw, Timer } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

const GAME = "aim";
const ORDER = "desc" as const;
const UNIT = "점";
const DURATION = 30; // 초
const BEST_KEY = `${GAME}_best`;

interface TargetState {
  id: number;
  x: number;   // % (영역 내 중심 좌표)
  y: number;   // %
  size: number; // px (살짝 랜덤)
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

type Phase = "idle" | "playing" | "over";

function randomTarget(size: number): TargetState {
  // 과녁 중심이 영역 밖으로 나가지 않도록 size 비율만큼 여백 확보(대략 8~14%)
  const margin = 12;
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    x: margin + Math.random() * (100 - margin * 2),
    y: margin + Math.random() * (100 - margin * 2),
    size,
  };
}

function randomSize() {
  // 살짝 랜덤한 크기 (56 ~ 84px)
  return 56 + Math.round(Math.random() * 28);
}

export default function AimGame() {
  const { session } = useAuth();

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const [target, setTarget] = useState<TargetState | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [popKey, setPopKey] = useState(0); // 과녁 등장 애니메이션 리트리거용

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0); // 종료 시점 최신 점수 확보

  // 로컬 최고점 로드
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(BEST_KEY) || 0);
      if (Number.isFinite(saved)) setBest(saved);
    } catch {
      /* 무시 */
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 타이머 cleanup (언마운트 시)
  useEffect(() => () => clearTimer(), [clearTimer]);

  const finish = useCallback(() => {
    clearTimer();
    setTarget(null);
    setPhase("over");

    const finalScore = scoreRef.current; // 명중수
    let beatRecord = false;
    setBest((prevBest) => {
      if (finalScore > prevBest) {
        beatRecord = true;
        try {
          localStorage.setItem(BEST_KEY, String(finalScore));
        } catch {
          /* 무시 */
        }
        return finalScore;
      }
      return prevBest;
    });
    setIsNewBest(beatRecord);

    if (beatRecord && finalScore > 0) bigBurst();
    else if (finalScore >= 20) bigBurst();

    // 랭킹 등록 (로그인 회원만)
    if (session?.user?.email) {
      submitScore(GAME, session.user.name || "플레이어", finalScore, ORDER);
      window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: GAME }));
    }
  }, [clearTimer, session]);

  const spawn = useCallback(() => {
    setTarget(randomTarget(randomSize()));
    setPopKey((k) => k + 1);
  }, []);

  const start = useCallback(() => {
    clearTimer();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(DURATION);
    setIsNewBest(false);
    setRipples([]);
    setPhase("playing");
    spawn();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, spawn, finish]);

  const handleHit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (phase !== "playing") return;
      e.stopPropagation();

      scoreRef.current += 1;
      setScore(scoreRef.current);
      burst({ count: 36 });

      // 명중 위치에 잔향 효과
      if (target) {
        const rid = Date.now() + Math.random();
        setRipples((prev) => [...prev, { id: rid, x: target.x, y: target.y }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== rid));
        }, 480);
      }

      // 다른 랜덤 위치에 재등장
      spawn();
    },
    [phase, target, spawn]
  );

  const reset = useCallback(() => {
    clearTimer();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(DURATION);
    setTarget(null);
    setRipples([]);
    setIsNewBest(false);
    setPhase("idle");
  }, [clearTimer]);

  const ratio = timeLeft / DURATION;
  const timeColor = timeLeft <= 5 ? "text-[#EF4444]" : timeLeft <= 10 ? "text-[#F9954E]" : "text-white";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]"
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col border-x border-white/5">
        {/* 상단바 */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#09090e]/80 p-4 backdrop-blur-md">
          <Link
            href="/minigame"
            className="inline-flex items-center gap-1.5 text-[13px] text-stone-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </Link>
          <div className="inline-flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight text-white">
            <Target className="h-4 w-4 text-[#F9954E]" />
            과녁 클릭
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-center">
            <div className="text-[9px] uppercase tracking-widest text-stone-500">Score</div>
            <div className="text-sm font-bold tabular-nums text-white">
              <CountUp value={score} className="tabular-nums" />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* 상태 칩 (남은시간 / 명중 / 최고) */}
          <div className="grid grid-cols-3 gap-2">
            <div className="arcade-card rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-center">
              <div className="text-[9px] uppercase tracking-widest text-stone-500">남은시간</div>
              <div className={`inline-flex items-center justify-center gap-1 text-sm font-bold tabular-nums ${timeColor}`}>
                <Timer className="h-3 w-3" />
                {timeLeft}초
              </div>
            </div>
            <div className="arcade-card rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-center">
              <div className="text-[9px] uppercase tracking-widest text-stone-500">명중</div>
              <div className="text-sm font-bold tabular-nums text-[#F9954E]">
                <CountUp value={score} className="tabular-nums" />
              </div>
            </div>
            <div className="arcade-card rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-center">
              <div className="text-[9px] uppercase tracking-widest text-stone-500">최고</div>
              <div className="text-sm font-bold tabular-nums text-white">
                <CountUp value={best} className="tabular-nums" />
              </div>
            </div>
          </div>

          {/* 타이머 프로그레스 */}
          <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F9954E] to-[#E8832E] transition-[width] duration-1000 ease-linear"
              style={{ width: `${ratio * 100}%` }}
            />
          </div>

          {/* 플레이 영역 */}
          <div className="arcade-card arcade-rise relative aspect-square w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-2">
            {/* 격자 배경 (정조준 느낌) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            {/* 명중 잔향 */}
            {ripples.map((r) => (
              <span
                key={r.id}
                aria-hidden
                className="arcade-pop-in pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#F9954E]/70"
                style={{
                  left: `${r.x}%`,
                  top: `${r.y}%`,
                  width: 60,
                  height: 60,
                  animation: "ping 0.45s cubic-bezier(0,0,0.2,1)",
                }}
              />
            ))}

            {/* 과녁 */}
            {phase === "playing" && target && (
              <button
                key={popKey}
                onClick={handleHit}
                aria-label="과녁 맞히기"
                className="arcade-pop-in absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full transition-transform duration-75 active:scale-90"
                style={{ left: `${target.x}%`, top: `${target.y}%`, width: target.size, height: target.size }}
              >
                <span className="relative flex h-full w-full items-center justify-center">
                  {/* 외곽 글로우 */}
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[#F9954E]/30 blur-md"
                  />
                  {/* 과녁 링 */}
                  <span className="absolute inset-0 rounded-full bg-gradient-to-b from-[#F9954E] to-[#E8832E] shadow-lg shadow-[#F9954E]/40" />
                  <span className="absolute inset-[18%] rounded-full bg-[#09090e]" />
                  <span className="absolute inset-[32%] rounded-full bg-gradient-to-b from-[#F9954E] to-[#E8832E]" />
                  <span className="absolute inset-[46%] rounded-full bg-[#09090e]" />
                  <span className="absolute inset-[58%] rounded-full bg-white" />
                </span>
              </button>
            )}

            {/* 시작 오버레이 */}
            {phase === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <Target className="arcade-float h-16 w-16 text-[#F9954E]" />
                <div>
                  <h2 className="arcade-grad-text text-2xl font-extrabold tracking-tight">과녁 클릭</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-stone-400">
                    30초 동안 나타나는 과녁을
                    <br />
                    최대한 빠르고 정확하게 맞혀보세요!
                  </p>
                </div>
                <button
                  onClick={start}
                  className="arcade-shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] px-8 py-3 font-bold text-white transition-transform active:scale-[0.97]"
                >
                  <Play className="h-5 w-5" />
                  시작하기
                </button>
              </div>
            )}

            {/* 종료 오버레이 */}
            {phase === "over" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#09090e]/70 px-6 text-center backdrop-blur-sm">
                <div className="arcade-pop-in text-5xl">{isNewBest ? "🏆" : score >= 20 ? "🎯" : "👏"}</div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    {isNewBest ? "신기록 달성!" : "게임 종료"}
                  </h2>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-4">
                    <div className="text-[10px] uppercase tracking-widest text-stone-500">최종 명중</div>
                    <div className="arcade-grad-text text-5xl font-black tabular-nums">
                      <CountUp value={score} className="tabular-nums" />
                    </div>
                    <div className="mt-1 text-[11px] text-stone-400">최고 {best.toLocaleString()}점</div>
                  </div>
                </div>
                <div className="flex w-full max-w-[260px] gap-2">
                  <button
                    onClick={start}
                    className="arcade-shine inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] py-3 font-bold text-white transition-transform active:scale-[0.97]"
                  >
                    <Play className="h-5 w-5" />
                    다시 하기
                  </button>
                  <button
                    onClick={reset}
                    className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold text-stone-200 transition-transform hover:bg-white/[0.1] active:scale-[0.97]"
                    aria-label="처음으로"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
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
