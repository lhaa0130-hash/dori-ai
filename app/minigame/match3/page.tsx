"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

const COLS = 8;
const ROWS = 8;
const TOTAL = COLS * ROWS;
const INIT_MOVES = 20;

const COLORS = ["red","orange","yellow","green","blue","purple"] as const;
type Color = typeof COLORS[number];

const EMOJI: Record<Color, string> = {
  red:"🍒", orange:"🍊", yellow:"🍋", green:"🥝", blue:"🫐", purple:"🍇"
};

function makeBoard(): Color[] {
  return Array.from({length: TOTAL}, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
}

function processMatches(b: (Color|"")[]): { board: (Color|"")[], cleared: number } {
  const next = [...b];
  const toRemove = new Set<number>();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const i = r * COLS + c;
      if (next[i] && next[i] === next[i+1] && next[i] === next[i+2]) {
        toRemove.add(i); toRemove.add(i+1); toRemove.add(i+2);
      }
    }
  }
  for (let r = 0; r < ROWS - 2; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      if (next[i] && next[i] === next[i+COLS] && next[i] === next[i+COLS*2]) {
        toRemove.add(i); toRemove.add(i+COLS); toRemove.add(i+COLS*2);
      }
    }
  }

  const cleared = toRemove.size;
  toRemove.forEach(i => { next[i] = ""; });

  if (cleared > 0) {
    for (let c = 0; c < COLS; c++) {
      const col: Color[] = [];
      for (let r = 0; r < ROWS; r++) {
        const v = next[r*COLS+c];
        if (v) col.push(v as Color);
      }
      while (col.length < ROWS) col.unshift(COLORS[Math.floor(Math.random()*COLORS.length)]);
      for (let r = 0; r < ROWS; r++) next[r*COLS+c] = col[r];
    }
  }

  return { board: next, cleared };
}

export default function Match3Game() {
  const { session } = useAuth();
  const [board, setBoard] = useState<(Color|"")[]>(makeBoard);
  const [selected, setSelected] = useState<number|null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(INIT_MOVES);
  const [isGameOver, setIsGameOver] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const processing = useRef(false);

  useEffect(() => {
    if (isGameOver && !scoreSubmitted) {
      setScoreSubmitted(true);
      bigBurst();
      if (session?.user?.email) {
        submitScore("match3", session.user.name || "플레이어", score, "desc");
        if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "match3" }));
      }
    }
  }, [isGameOver, scoreSubmitted, score, session]);

  const handleClick = (idx: number) => {
    if (processing.current || isGameOver) return;
    if (!board[idx]) return;

    if (selected === null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) { setSelected(null); return; }

    const r1 = Math.floor(selected/COLS), c1 = selected%COLS;
    const r2 = Math.floor(idx/COLS), c2 = idx%COLS;
    const isAdj = (Math.abs(r1-r2)+Math.abs(c1-c2)) === 1;

    if (!isAdj) { setSelected(idx); return; }

    processing.current = true;
    setSelected(null);
    const swapped = [...board] as (Color|"")[];
    [swapped[selected], swapped[idx]] = [swapped[idx], swapped[selected]];

    const { board: result, cleared } = processMatches(swapped);

    if (cleared === 0) {
      processing.current = false;
      setSelected(null);
      return;
    }

    const pts = cleared * 10;
    if (cleared >= 6) bigBurst(); else burst();
    setScore(prev => prev + pts);
    setMoves(prev => {
      const next = prev - 1;
      if (next <= 0) setIsGameOver(true);
      return next;
    });
    setBoard(result);
    processing.current = false;
  };

  const reset = () => {
    setBoard(makeBoard());
    setScore(0);
    setMoves(INIT_MOVES);
    setIsGameOver(false);
    setScoreSubmitted(false);
    setSelected(null);
    processing.current = false;
  };

  return (
    <div className="relative min-h-screen w-full bg-[#09090e] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden touch-none">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />
      <header className="w-full max-w-md flex items-center justify-between mb-4">
        <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          미니게임
        </Link>
        <div className="text-[15px] font-extrabold tracking-tight text-white">🍒 매치 3</div>
        <div className="flex items-center gap-2">
          <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
            <div className="text-[9px] uppercase tracking-widest text-neutral-500">SCORE</div>
            <div className="text-sm font-bold text-white tabular-nums">
              <span key={score} className="arcade-pop inline-block">
                <CountUp value={score} className="tabular-nums" />
              </span>
            </div>
          </div>
          <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
            <div className="text-[9px] uppercase tracking-widest text-neutral-500">MOVES</div>
            <div className={`text-sm font-bold tabular-nums ${moves <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
              <CountUp value={moves} className="tabular-nums" />
            </div>
          </div>
        </div>
      </header>

      {!isGameOver ? (
        <div
          style={{ display:"grid", gridTemplateColumns:`repeat(${COLS},1fr)`, width:360, height:360 }}
          className="arcade-card arcade-rise rounded-2xl bg-white/[0.04] border border-white/10 p-1 shadow-2xl"
        >
          {board.map((color, idx) => (
            <div
              key={idx}
              onClick={() => handleClick(idx)}
              className={`flex items-center justify-center cursor-pointer rounded-md m-0.5 transition-all select-none active:scale-[0.92]
                ${selected === idx ? "ring-2 ring-[#F9954E] scale-110 bg-[#F9954E]/15 arcade-glow" : "hover:bg-white/10 hover:scale-105"}`}
            >
              {color && (
                <span className="text-xl leading-none" style={{filter:"drop-shadow(0 1px 2px rgba(0,0,0,0.5))"}}>
                  {EMOJI[color as Color]}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="arcade-card arcade-pop-in w-[360px] h-[360px] flex flex-col items-center justify-center rounded-3xl bg-[#101016] border border-white/10 p-8 text-center shadow-2xl">
          <Trophy className="w-14 h-14 text-[#F9954E] mb-4 arcade-float" />
          <h2 className="text-2xl font-extrabold tracking-tight mb-4">게임 종료!</h2>
          <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">최종 점수</div>
          <div className="text-5xl font-black arcade-grad-text tabular-nums mb-6">
            <CountUp value={score} className="tabular-nums" />
          </div>
          <button
            onClick={reset}
            className="arcade-shine arcade-glow rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform px-8 py-3 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> 다시 하기
          </button>
        </div>
      )}

      <p className="mt-4 text-neutral-400 text-xs text-center">
        과일을 눌러 옆에 있는 과일과 자리를 바꿔보세요
      </p>

      <div className="w-full max-w-md mx-auto mt-4 px-4">
        <GameLeaderboard game="match3" title="명예의 전당 TOP 5" unit="점" order="desc" tone="dark" />
      </div>

      <GameSuggestion />
    </div>
  );
}
