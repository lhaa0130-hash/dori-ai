"use client";

// 순서 기억 (Simon) — 4색 패드가 라운드마다 1개씩 늘며 깜빡임 → 같은 순서로 탭.
// 맞으면 레벨+1, 틀리면 종료. finalScore = 도달 레벨(단계).
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Brain, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

const GAME = "simon";
const ORDER = "desc" as const;
const UNIT = "단계";
const BEST_KEY = "simon_best";

type Phase = "idle" | "watch" | "input" | "over";

interface Pad {
  id: number;
  name: string;
  base: string;   // 평상시 색
  lit: string;    // 점등 색
  glow: string;   // 점등 시 그림자 색
}

// 빨강 / 파랑 / 초록 / 노랑
const PADS: Pad[] = [
  { id: 0, name: "빨강", base: "#7f1d1d", lit: "#ef4444", glow: "rgba(239,68,68,0.85)" },
  { id: 1, name: "파랑", base: "#1e3a8a", lit: "#3b82f6", glow: "rgba(59,130,246,0.85)" },
  { id: 2, name: "초록", base: "#14532d", lit: "#22c55e", glow: "rgba(34,197,94,0.85)" },
  { id: 3, name: "노랑", base: "#854d0e", lit: "#f59e0b", glow: "rgba(245,158,11,0.85)" },
];

export default function SimonPage() {
  const { session } = useAuth();

  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [level, setLevel] = useState(0);            // 클리어한 라운드 수 = 도달 레벨
  const [activePad, setActivePad] = useState<number | null>(null); // 점등 중인 패드
  const [wrongPad, setWrongPad] = useState<number | null>(null);   // 오답 흔들림
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // setTimeout 체인 정리를 위한 ref
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);

  // 로컬 최고 기록 로드
  useEffect(() => {
    try {
      const v = Number(window.localStorage.getItem(BEST_KEY) || 0);
      if (Number.isFinite(v) && v > 0) setBest(v);
    } catch { /* 무시 */ }
  }, []);

  // 언마운트 시 타이머 정리
  useEffect(() => () => clearTimers(), [clearTimers]);

  // 단일 패드 점등(작은 깜빡임)
  const flashPad = useCallback((pad: number, onMs: number, offMs: number, after?: () => void) => {
    setActivePad(pad);
    timers.current.push(
      setTimeout(() => {
        setActivePad(null);
        if (after) timers.current.push(setTimeout(after, offMs));
      }, onMs)
    );
  }, []);

  // 시퀀스 재생(점점 빨라지는 연출)
  const playSequence = useCallback((seq: number[]) => {
    setPhase("watch");
    clearTimers();
    setActivePad(null);

    // 레벨이 오를수록 살짝 빠르게(하한선 둠)
    const onMs = Math.max(260, 560 - seq.length * 18);
    const offMs = Math.max(140, 300 - seq.length * 12);
    let i = 0;

    const playNext = () => {
      if (i >= seq.length) {
        // 재생 끝 → 입력 단계
        timers.current.push(
          setTimeout(() => {
            setPhase("input");
            setInputIndex(0);
          }, 200)
        );
        return;
      }
      const pad = seq[i];
      i += 1;
      flashPad(pad, onMs, offMs, playNext);
    };

    // 시작 전 약간의 텀
    timers.current.push(setTimeout(playNext, 520));
  }, [clearTimers, flashPad]);

  // 다음 라운드 시작(시퀀스 1개 추가)
  const nextRound = useCallback((prev: number[]) => {
    const next = [...prev, Math.floor(Math.random() * 4)];
    setSequence(next);
    playSequence(next);
  }, [playSequence]);

  const startGame = useCallback(() => {
    clearTimers();
    setIsNewBest(false);
    setLevel(0);
    setInputIndex(0);
    setWrongPad(null);
    setSequence([]);
    nextRound([]);
  }, [clearTimers, nextRound]);

  const finishGame = useCallback((reachedLevel: number) => {
    clearTimers();
    setActivePad(null);
    setPhase("over");

    // 로컬 최고 기록 갱신
    let newBest = false;
    setBest((b) => {
      if (reachedLevel > b) {
        newBest = true;
        try { window.localStorage.setItem(BEST_KEY, String(reachedLevel)); } catch { /* 무시 */ }
        return reachedLevel;
      }
      return b;
    });

    // 연출
    if (newBest && reachedLevel > 0) {
      setIsNewBest(true);
      bigBurst();
    } else if (reachedLevel >= 5) {
      bigBurst();
    }

    // 전역 랭킹 등록(회원)
    if (reachedLevel > 0 && session?.user?.email) {
      submitScore(GAME, session.user.name || "플레이어", reachedLevel, ORDER);
      window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: GAME }));
    }
  }, [clearTimers, session]);

  // 플레이어 탭
  const handleTap = useCallback((pad: number) => {
    if (phaseRef.current !== "input") return;

    const expected = sequence[inputIndex];

    if (pad !== expected) {
      // 오답 → 종료
      setWrongPad(pad);
      timers.current.push(setTimeout(() => setWrongPad(null), 420));
      finishGame(level);
      return;
    }

    // 정답 입력 → 짧게 점등
    setActivePad(pad);
    timers.current.push(setTimeout(() => setActivePad(null), 180));

    const nextIdx = inputIndex + 1;
    if (nextIdx >= sequence.length) {
      // 라운드 클리어
      const newLevel = level + 1;
      setLevel(newLevel);
      burst();
      timers.current.push(setTimeout(() => nextRound(sequence), 620));
    } else {
      setInputIndex(nextIdx);
    }
  }, [sequence, inputIndex, level, finishGame, nextRound]);

  const reset = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setSequence([]);
    setLevel(0);
    setInputIndex(0);
    setActivePad(null);
    setWrongPad(null);
    setIsNewBest(false);
  }, [clearTimers]);

  const statusText =
    phase === "watch" ? "순서를 잘 보세요..." :
    phase === "input" ? "이제 같은 순서로 탭하세요!" :
    "";

  const trophy = level >= 12 ? "🏆" : level >= 8 ? "🎉" : level >= 4 ? "👏" : "💪";
  const verdict =
    level >= 12 ? "🌟 천재적인 기억력!" :
    level >= 8 ? "🚀 대단해요!" :
    level >= 4 ? "💫 잘했어요!" :
    "📚 다시 도전해 볼까요?";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]"
      />

      {/* 상단바 */}
      <header className="fixed top-0 left-0 w-full h-16 bg-[#09090e]/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-5 sm:px-6">
        <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] text-stone-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          뒤로
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight text-white">
          <Brain className="w-4 h-4 text-[#F9954E]" />
          순서 기억
        </h1>
        <div className="rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
          <div className="text-[9px] uppercase tracking-widest text-stone-500">LEVEL</div>
          <div className="text-sm font-bold text-white tabular-nums">
            <CountUp value={level} className="tabular-nums" />
          </div>
        </div>
      </header>

      <div className="pt-20 pb-10 px-4 max-w-md mx-auto">
        <div className="arcade-card arcade-rise rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-5 sm:p-7">

          {/* 상태/통계 바 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="arcade-card text-center p-3 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="text-[9px] uppercase tracking-widest text-stone-500 mb-1">현재 레벨</div>
              <div className="text-3xl font-black text-[#F9954E] tabular-nums">
                <span key={level} className="arcade-pop inline-block">
                  <CountUp value={level} className="tabular-nums" />
                </span>
              </div>
            </div>
            <div className="arcade-card text-center p-3 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="text-[9px] uppercase tracking-widest text-stone-500 mb-1">최고 기록</div>
              <div className="text-3xl font-black text-white tabular-nums">
                <CountUp value={best} className="tabular-nums" />
              </div>
            </div>
          </div>

          {/* 상태 안내 */}
          <div className="h-7 mb-3 flex items-center justify-center">
            {statusText ? (
              <span
                key={phase}
                className={`arcade-pop text-sm font-semibold ${phase === "watch" ? "text-[#FBAA60]" : "text-emerald-300"}`}
              >
                {statusText}
              </span>
            ) : (
              <span className="text-[11px] text-stone-500">4색 순서를 기억하고 따라 누르세요</span>
            )}
          </div>

          {/* 진행 도트 (입력 단계 진척) */}
          <div className="h-5 mb-4 flex items-center justify-center gap-1.5">
            {phase === "input" && sequence.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i < inputIndex ? "w-5 bg-[#F9954E]" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* 4색 패드 */}
          <div className="relative grid grid-cols-2 gap-3 select-none">
            {PADS.map((p) => {
              const isOn = activePad === p.id;
              const isWrong = wrongPad === p.id;
              const interactive = phase === "input";
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-label={p.name}
                  disabled={!interactive}
                  onClick={() => handleTap(p.id)}
                  className={`relative aspect-square rounded-2xl border transition-[transform,box-shadow,background-color,filter] duration-150 touch-manipulation
                    ${isWrong ? "animate-[shake_0.4s_ease] border-red-400" : "border-white/10"}
                    ${isOn ? "scale-[1.04] brightness-110" : ""}
                    ${interactive ? "active:scale-[0.96] cursor-pointer" : "cursor-default"}
                  `}
                  style={{
                    backgroundColor: isOn ? p.lit : p.base,
                    boxShadow: isOn
                      ? `0 0 38px 6px ${p.glow}, inset 0 0 24px rgba(255,255,255,0.25)`
                      : "inset 0 1px 0 rgba(255,255,255,0.06)",
                    opacity: isOn ? 1 : interactive ? 0.92 : 0.78,
                  }}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[13px] font-bold tracking-wide transition-opacity"
                    style={{ color: "rgba(255,255,255,0.9)", opacity: isOn ? 1 : 0.5 }}
                  >
                    {p.name}
                  </span>
                </button>
              );
            })}

            {/* 시작/종료 오버레이 */}
            {(phase === "idle" || phase === "over") && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#09090e]/80 backdrop-blur-sm arcade-pop-in">
                {phase === "idle" ? (
                  <div className="text-center px-4">
                    <Brain className="arcade-float w-12 h-12 mx-auto mb-3 text-[#F9954E]" />
                    <p className="text-sm text-stone-300 mb-5 leading-relaxed">
                      깜빡이는 <strong className="text-white">색의 순서</strong>를 기억하고<br />
                      같은 순서로 눌러보세요!
                    </p>
                    <button
                      onClick={startGame}
                      className="arcade-shine arcade-glow inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform"
                    >
                      <Play className="w-5 h-5" />
                      시작하기
                    </button>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <div className="arcade-float text-5xl mb-2">{trophy}</div>
                    {isNewBest && (
                      <div className="arcade-pop mb-1 text-[11px] font-extrabold uppercase tracking-widest text-yellow-300">
                        ✨ 신기록 ✨
                      </div>
                    )}
                    <h2 className="text-xl font-extrabold text-white mb-1">게임 종료!</h2>
                    <div className="mb-1 text-[10px] uppercase tracking-widest text-stone-500">도달 레벨</div>
                    <div className="text-5xl font-black arcade-grad-text tabular-nums mb-2">
                      <CountUp value={level} className="tabular-nums" />
                    </div>
                    <p className="text-xs text-stone-300 mb-5">{verdict}</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={startGame}
                        className="arcade-shine arcade-glow px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold active:scale-[0.97] transition-transform"
                      >
                        다시 하기
                      </button>
                      <button
                        onClick={reset}
                        aria-label="처음으로"
                        className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-stone-200 hover:bg-white/[0.1] active:scale-[0.97] transition-transform"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 명예의 전당 */}
        <div className="mt-4">
          <GameLeaderboard game={GAME} title="명예의 전당 TOP 5" unit={UNIT} order={ORDER} tone="dark" />
        </div>

        <GameSuggestion />
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </main>
  );
}
