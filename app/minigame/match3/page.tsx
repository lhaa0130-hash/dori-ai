"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, RefreshCw, Trophy, Flame } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays } from "@/lib/cottonCandy";

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
  const [candyGiven, setCandyGiven] = useState(false);
  const processing = useRef(false);

  useEffect(() => {
    if (isGameOver && !candyGiven && session?.user?.email) {
      const candy = Math.max(1, Math.floor(score / 50));
      addCottonCandy(session.user.email, candy, "매치3 게임 완료");
      incrementMinigamePlays(session.user.email);
      setCandyGiven(true);
    }
  }, [isGameOver, candyGiven, score, session]);

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
    setCandyGiven(false);
    setSelected(null);
    processing.current = false;
  };

  const candyPreview = Math.max(0, Math.floor(score / 50));

  return (
    <div className="h-screen w-full bg-neutral-900 text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden touch-none">
      <header className="w-full max-w-md flex items-center justify-between mb-4">
        <Link href="/minigame" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-neutral-400" />
        </Link>
        <div className="font-bold text-xl text-pink-500 tracking-wider">MATCH 3</div>
        <div className="w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-full border border-neutral-700">
          <Flame className="w-5 h-5 text-pink-500" />
        </div>
      </header>

      <div className="flex w-full max-w-[360px] items-center justify-between bg-neutral-800 p-3 rounded-xl mb-4 border border-neutral-700">
        <div className="text-center">
          <div className="text-xs text-neutral-400 uppercase font-bold">점수</div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-400 uppercase font-bold">남은 이동</div>
          <div className={`text-2xl font-bold font-mono ${moves <= 5 ? "text-red-500 animate-pulse" : "text-white"}`}>{moves}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-neutral-400 uppercase font-bold">예상 🍭</div>
          <div className="text-2xl font-bold text-orange-400">{candyPreview}</div>
        </div>
      </div>

      {!isGameOver ? (
        <div
          style={{ display:"grid", gridTemplateColumns:`repeat(${COLS},1fr)`, width:360, height:360 }}
          className="bg-neutral-800/50 rounded-xl p-1 border-2 border-neutral-700 shadow-2xl"
        >
          {board.map((color, idx) => (
            <div
              key={idx}
              onClick={() => handleClick(idx)}
              className={`flex items-center justify-center cursor-pointer rounded-md m-0.5 transition-all select-none
                ${selected === idx ? "ring-2 ring-white scale-110 bg-white/20" : "hover:bg-white/10"}`}
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
        <div className="w-[360px] h-[360px] flex flex-col items-center justify-center bg-neutral-800 rounded-xl border-2 border-neutral-700 p-6 text-center shadow-2xl">
          <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
          <h2 className="text-3xl font-bold mb-2">게임 종료!</h2>
          <p className="text-neutral-400 mb-2">최종 점수: <span className="text-yellow-400 font-bold">{score}</span></p>
          {candyPreview > 0 && (
            <p className="text-orange-400 font-bold mb-4">🍭 솜사탕 {candyPreview}개 획득!</p>
          )}
          <button
            onClick={reset}
            className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> 다시 하기
          </button>
        </div>
      )}

      <p className="mt-4 text-neutral-500 text-xs text-center">
        과일을 클릭해서 이웃한 과일과 교체 • 50점마다 🍭 1개
      </p>
    </div>
  );
}
