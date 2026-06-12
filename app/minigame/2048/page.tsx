"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trophy, Crown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays, addExp } from "@/lib/cottonCandy";
import PlaytimeRewardToast from "@/components/game/PlaytimeRewardToast";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

// ----------------------------------------------------------------------
// Constants & Types
// ----------------------------------------------------------------------

const GRID_SIZE = 4;
const WIN_SCORE = 2048;

type Grid = number[][];

const TILE_COLORS: Record<number, string> = {
    2: "bg-white/[0.08] text-neutral-300",
    4: "bg-white/[0.14] text-neutral-100",
    8: "bg-[#F9954E]/30 text-white",
    16: "bg-[#F9954E]/45 text-white",
    32: "bg-[#F9954E]/60 text-white",
    64: "bg-[#F9954E]/80 text-white",
    128: "bg-[#F9954E] text-white shadow-[0_0_10px_rgba(249,149,78,0.35)]",
    256: "bg-[#F28A3D] text-white shadow-[0_0_15px_rgba(249,149,78,0.45)]",
    512: "bg-[#E8832E] text-white shadow-[0_0_20px_rgba(249,149,78,0.55)]",
    1024: "bg-[#DD7522] text-white shadow-[0_0_25px_rgba(249,149,78,0.65)]",
    2048: "bg-gradient-to-b from-[#F9954E] to-[#D96A1A] text-white shadow-[0_0_30px_rgba(249,149,78,0.75)]",
};

export default function Game2048() {
    const { session } = useAuth();
    const [grid, setGrid] = useState<Grid>(createEmptyGrid());
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const touchStartRef = useRef<{x: number, y: number} | null>(null);

    // Initialize Game
    useEffect(() => {
        initGame();
        const savedBest = localStorage.getItem("2048_best");
        if (savedBest) setBestScore(parseInt(savedBest));
    }, []);

    function createEmptyGrid(): Grid {
        return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    }

    function initGame() {
        let newGrid = createEmptyGrid();
        newGrid = addRandomTile(newGrid);
        newGrid = addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
        setWon(false);
    }

    function addRandomTile(currentGrid: Grid): Grid {
        const emptyCells = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (currentGrid[i][j] === 0) emptyCells.push({ x: i, y: j });
            }
        }

        if (emptyCells.length === 0) return currentGrid;

        const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const newGrid = currentGrid.map(row => [...row]);
        newGrid[x][y] = Math.random() < 0.9 ? 2 : 4;
        return newGrid;
    }

    // Move Logic
    const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (gameOver || (won && score < WIN_SCORE)) return;

        let newGrid = grid.map(row => [...row]);
        let moved = false;
        let scoreGain = 0;

        // Rotate grid to simplify logic (always process LEFT)
        const rotateGrid = (g: Grid) => g[0].map((_, i) => g.map(row => row[i]).reverse());

        if (direction === 'UP') newGrid = rotateGrid(rotateGrid(rotateGrid(newGrid))); // 270 deg
        else if (direction === 'RIGHT') newGrid = rotateGrid(rotateGrid(newGrid)); // 180 deg
        else if (direction === 'DOWN') newGrid = rotateGrid(newGrid); // 90 deg

        // Process Left
        for (let i = 0; i < GRID_SIZE; i++) {
            let row = newGrid[i].filter(val => val !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    scoreGain += row[j];
                    row.splice(j + 1, 1);
                }
            }
            while (row.length < GRID_SIZE) row.push(0);
            if (newGrid[i].join(',') !== row.join(',')) moved = true;
            newGrid[i] = row;
        }

        // Rotate back
        if (direction === 'UP') newGrid = rotateGrid(newGrid);
        else if (direction === 'RIGHT') newGrid = rotateGrid(rotateGrid(newGrid));
        else if (direction === 'DOWN') newGrid = rotateGrid(rotateGrid(rotateGrid(newGrid)));

        if (moved) {
            newGrid = addRandomTile(newGrid);
            setGrid(newGrid);
            // 합치기 성공 시 가벼운 축하 연출(JUICE 추가 — 조건/점수계산 불변)
            if (scoreGain > 0) burst({ count: 46 });
            setScore(prev => {
                const newScore = prev + scoreGain;
                if (newScore > bestScore) {
                    setBestScore(newScore);
                    localStorage.setItem("2048_best", newScore.toString());
                }
                return newScore;
            });

            // Check Win/Loss
            if (newGrid.flat().includes(2048) && !won) {
                setWon(true);
                bigBurst(); // 2048 달성 큰 축하(JUICE 추가)
                // 2048 달성 시 솜사탕 지급
                if (session?.user?.email) {
                    addCottonCandy(session.user.email, 100, "2048 달성!");
                    addExp(session.user.email, 10, "2048 달성");
                }
            }
            if (checkGameOver(newGrid)) {
                setGameOver(true);
                // 게임 종료 시 미니게임 플레이 카운트
                if (session?.user?.email) {
                    incrementMinigamePlays(session.user.email);
                }
                // 명예의 전당 점수 등록 (최종 점수 = score state는 아직 갱신 전이므로 local 합산값 사용)
                const finalScore = score + scoreGain;
                if (session?.user?.email) {
                    submitScore("2048", session.user.name || "플레이어", finalScore, "desc");
                    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "2048" }));
                }
            }
        }
    }, [grid, gameOver, won, bestScore, score, session]);

    function checkGameOver(currentGrid: Grid): boolean {
        // Check for empty cells
        if (currentGrid.flat().includes(0)) return false;

        // Check for adjacent same values
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (i < GRID_SIZE - 1 && currentGrid[i][j] === currentGrid[i + 1][j]) return false;
                if (j < GRID_SIZE - 1 && currentGrid[i][j] === currentGrid[i][j + 1]) return false;
            }
        }
        return true;
    }

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowUp": move('UP'); break;
                case "ArrowDown": move('DOWN'); break;
                case "ArrowLeft": move('LEFT'); break;
                case "ArrowRight": move('RIGHT'); break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [move]);

    return (
        <div className="relative overflow-hidden min-h-screen w-full bg-[#09090e] text-white font-sans selection:bg-[#F9954E]/30 flex flex-col items-center justify-center p-4 touch-none">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            <PlaytimeRewardToast />

            <header className="relative w-full max-w-md flex items-center justify-between mb-6 arcade-rise">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors active:scale-[0.97]">
                    <ArrowLeft className="w-4 h-4" />
                    미니게임
                </Link>
                <div className="text-[15px] font-extrabold tracking-tight text-white">🧩 2048</div>
                <div className="flex gap-2">
                    <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center min-w-[70px]">
                        <div className="text-[9px] uppercase tracking-widest text-neutral-500">Score</div>
                        <span key={score} className="arcade-pop inline-block text-sm font-bold text-white">
                            <CountUp value={score} className="tabular-nums" />
                        </span>
                    </div>
                    <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center min-w-[70px]">
                        <div className="text-[9px] uppercase tracking-widest text-neutral-500">Best</div>
                        <CountUp value={bestScore} className="block text-sm font-bold text-white tabular-nums" />
                    </div>
                </div>
            </header>

            <div className="arcade-card arcade-rise-1 relative rounded-2xl bg-white/[0.04] border border-white/10 p-2 w-full max-w-[360px]" style={{ touchAction: "none" }}
                onTouchStart={(e) => {
                    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }}
                onTouchEnd={(e) => {
                    if (!touchStartRef.current) return;
                    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
                    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
                    touchStartRef.current = null;
                    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
                    if (Math.abs(dx) > Math.abs(dy)) {
                        move(dx > 0 ? 'RIGHT' : 'LEFT');
                    } else {
                        move(dy > 0 ? 'DOWN' : 'UP');
                    }
                }}
            >

                <div className="grid grid-cols-4 gap-2 bg-black/30 p-2 rounded-xl">
                    {grid.map((row, i) =>
                        row.map((val, j) => (
                            <motion.div
                                key={`${i}-${j}`}
                                layoutId={`tile-${i}-${j}`} // Simple layout animation
                                className={`aspect-square rounded-lg font-bold tabular-nums text-xl sm:text-2xl md:text-3xl flex items-center justify-center transition-colors ${val > 0 ? TILE_COLORS[val] : "bg-white/[0.04]"}`}
                            >
                                {val > 0 ? val : ""}
                            </motion.div>
                        ))
                    )}
                </div>

                {(gameOver || won) && (
                    <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-2xl p-4">
                        <div className="arcade-pop-in arcade-card rounded-3xl bg-[#101016] border border-white/10 p-8 flex flex-col items-center text-center">
                            <div className="arcade-float text-4xl mb-2">{won ? "🏆" : "🧩"}</div>
                            <h2 className="text-xl font-extrabold tracking-tight text-white mb-4">
                                {won ? "2048 달성! 🎉" : "게임 오버"}
                            </h2>
                            <div className="text-[10px] uppercase tracking-widest text-neutral-500">Score</div>
                            <CountUp value={score} className="arcade-grad-text block text-5xl font-black tabular-nums mb-6" />
                            <button
                                onClick={initGame}
                                className="arcade-shine arcade-glow rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform px-8 py-3"
                            >
                                <RefreshCw className="w-5 h-5 inline-block mr-2" />
                                다시 하기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Controls */}
            <div className="arcade-rise-2 grid grid-cols-3 gap-2 mt-6 w-[200px] md:hidden">
                <div />
                <button
                    className="arcade-card rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] active:scale-[0.97] transition-transform p-4 flex justify-center text-2xl"
                    onClick={() => move('UP')}
                >⬆️</button>
                <div />
                <button
                    className="arcade-card rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] active:scale-[0.97] transition-transform p-4 flex justify-center text-2xl"
                    onClick={() => move('LEFT')}
                >⬅️</button>
                <button
                    className="arcade-card rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] active:scale-[0.97] transition-transform p-4 flex justify-center text-2xl"
                    onClick={() => move('DOWN')}
                >⬇️</button>
                <button
                    className="arcade-card rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] active:scale-[0.97] transition-transform p-4 flex justify-center text-2xl"
                    onClick={() => move('RIGHT')}
                >➡️</button>
            </div>

            <div className="arcade-rise-2 mt-8 text-neutral-400 text-sm text-center">
                방향키나 버튼으로 숫자를 합쳐 <span className="text-[#F9954E] font-bold">2048 타일</span>을 만들어 보세요!
            </div>

            <div className="arcade-rise-3 w-full max-w-md mx-auto mt-4 px-4">
                <GameLeaderboard game="2048" title="명예의 전당 TOP 5" unit="점" order="desc" tone="dark" />
            </div>
        </div>
    );
}
