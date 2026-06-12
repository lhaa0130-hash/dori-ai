"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Trophy, HelpCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

// ----------------------------------------------------------------------
// Constants & Types
// ----------------------------------------------------------------------

const GRID_SIZE = 4; // 4x4 Puzzle
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

// Default Image (Cat or AI related)
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=600&auto=format&fit=crop";

type Tile = {
    id: number; // 0 to 14 (15 tiles), 15 is blank
    currentPos: number; // 0 to 15
    correctPos: number; // 0 to 15
};

export default function SlidePuzzleGame() {
    const { session } = useAuth();
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [isSolved, setIsSolved] = useState(false);
    const [moves, setMoves] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showNumbers, setShowNumbers] = useState(false);

    // Initialize Puzzle
    useEffect(() => {
        initGame();
    }, []);

    const initGame = () => {
        // Create solved state
        const initialTiles: Tile[] = Array.from({ length: TILE_COUNT }, (_, index) => ({
            id: index,
            currentPos: index,
            correctPos: index,
        }));

        // Shuffle logic (Must be solvable)
        const shuffled = shuffleTiles(initialTiles);

        setTiles(shuffled);
        setMoves(0);
        setIsSolved(false);
        setIsPlaying(true);
    };

    const shuffleTiles = (tiles: Tile[]) => {
        // Simple shuffle: Perform random valid moves
        const newTiles = [...tiles];
        // Start with solved state
        // To ensure solvability, we simulate random moves from solved state
        let blankPos = TILE_COUNT - 1; // Last tile is blank (id: 15)

        // Perform 100 random moves to shuffle
        for (let i = 0; i < 200; i++) {
            const neighbors = getNeighbors(blankPos);
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

            // Swap blank with random neighbor
            const tileIndex = newTiles.findIndex(t => t.currentPos === randomNeighbor);
            const blankIndex = newTiles.findIndex(t => t.currentPos === blankPos);

            newTiles[tileIndex].currentPos = blankPos;
            newTiles[blankIndex].currentPos = randomNeighbor;

            blankPos = randomNeighbor;
        }

        return newTiles;
    };

    const getNeighbors = (pos: number) => {
        const neighbors = [];
        const row = Math.floor(pos / GRID_SIZE);
        const col = pos % GRID_SIZE;

        if (row > 0) neighbors.push(pos - GRID_SIZE); // Up
        if (row < GRID_SIZE - 1) neighbors.push(pos + GRID_SIZE); // Down
        if (col > 0) neighbors.push(pos - 1); // Left
        if (col < GRID_SIZE - 1) neighbors.push(pos + 1); // Right

        return neighbors;
    };

    const handleTileClick = (tile: Tile) => {
        if (isSolved) return;

        // Find Blank Tile
        const blankTile = tiles.find(t => t.id === TILE_COUNT - 1);
        if (!blankTile) return;

        // Check Adjacency
        const isAdjacent =
            Math.abs(tile.currentPos - blankTile.currentPos) === 1 && Math.floor(tile.currentPos / GRID_SIZE) === Math.floor(blankTile.currentPos / GRID_SIZE) ||
            Math.abs(tile.currentPos - blankTile.currentPos) === GRID_SIZE;

        if (isAdjacent) {
            // Swap positions
            const newTiles = tiles.map(t => {
                if (t.id === tile.id) return { ...t, currentPos: blankTile.currentPos };
                if (t.id === blankTile.id) return { ...t, currentPos: tile.currentPos };
                return t;
            });

            // moves 상태는 비동기로 갱신되므로, 이번 이동을 반영한 최종 무브 수를 직접 계산
            const finalMoves = moves + 1;

            setTiles(newTiles);
            setMoves(finalMoves);
            burst();
            checkWin(newTiles, finalMoves);
        }
    };

    const checkWin = (currentTiles: Tile[], finalMoves: number) => {
        const isWin = currentTiles.every(t => t.currentPos === t.correctPos);
        if (isWin) {
            setIsSolved(true);
            setIsPlaying(false);
            bigBurst();
            if (session?.user?.email) {
                submitScore("puzzle", session.user.name || "플레이어", finalMoves, "asc");
                if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "puzzle" }));
            }
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#09090e] text-white font-sans selection:bg-orange-500/30 flex flex-col items-center p-4">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            {/* Header */}
            <header className="relative w-full max-w-md flex items-center justify-between gap-3 pt-2 mb-6">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    미니게임
                </Link>
                <div className="text-[15px] font-extrabold tracking-tight text-white">🧩 슬라이드 퍼즐</div>
                <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">MOVES</div>
                    <div key={moves} className="arcade-pop inline-block text-sm font-bold text-white">
                        <CountUp value={moves} className="tabular-nums" />
                    </div>
                </div>
            </header>

            <div className="relative flex flex-col items-center gap-6">

                {/* Stats */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowNumbers(!showNumbers)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all active:scale-[0.97] ${showNumbers ? "bg-[#F9954E]/10 border-[#F9954E]/40 text-[#F9954E]" : "bg-white/[0.05] border-white/10 text-neutral-400 hover:bg-white/[0.1] hover:text-neutral-200"}`}
                    >
                        <HelpCircle className="w-4 h-4" /> 번호 힌트
                    </button>
                </div>

                {/* Board */}
                <div
                    className="arcade-card arcade-rise relative rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-2 shadow-2xl touch-none"
                    style={{ width: "340px", height: "340px" }}
                >
                    <div className="relative w-full h-full bg-[#09090e] rounded-xl overflow-hidden">
                        {tiles.map((tile) => {
                            // Skip rendering blank tile if game is playing
                            if (tile.id === TILE_COUNT - 1 && !isSolved) return null;

                            const x = (tile.currentPos % GRID_SIZE) * 100; // Percent for translate
                            const y = Math.floor(tile.currentPos / GRID_SIZE) * 100;

                            // Background Position
                            const bgX = (tile.correctPos % GRID_SIZE) * (100 / (GRID_SIZE - 1));
                            const bgY = Math.floor(tile.correctPos / GRID_SIZE) * (100 / (GRID_SIZE - 1));

                            return (
                                <motion.div
                                    key={tile.id}
                                    className="absolute w-1/4 h-1/4 cursor-pointer"
                                    style={{
                                        left: 0,
                                        top: 0
                                    }}
                                    animate={{ x: `${x}%`, y: `${y}%` }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => handleTileClick(tile)}
                                >
                                    <div className="w-full h-full p-0.5">
                                        <div
                                            className="w-full h-full rounded-md shadow-md relative overflow-hidden bg-white/[0.06] border border-white/10 ring-1 ring-inset ring-white/10"
                                            style={{
                                                backgroundImage: `url(${DEFAULT_IMAGE})`,
                                                backgroundSize: "400% 400%", // based on 4x4
                                                backgroundPosition: `${bgX}% ${bgY}%`
                                            }}
                                        >
                                            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-md bg-gradient-to-b from-white/15 to-transparent" />
                                            {showNumbers && (
                                                <div className="absolute top-1 left-1 bg-black/60 border border-white/10 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold tabular-nums">
                                                    {tile.correctPos + 1}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Victory Overlay */}
                    {isSolved && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="arcade-pop-in arcade-card rounded-3xl bg-[#101016] border border-white/10 p-8 text-center"
                            >
                                <Trophy className="arcade-float w-12 h-12 text-[#F9954E] mx-auto mb-3 drop-shadow-lg" />
                                <h2 className="text-xl font-extrabold tracking-tight text-white mb-4">퍼즐 완성!</h2>
                                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">MOVES</div>
                                <div className="arcade-grad-text text-5xl font-black tabular-nums mb-6">
                                    <CountUp value={moves} />
                                </div>

                                <button
                                    onClick={initGame}
                                    className="arcade-shine arcade-glow rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white px-8 py-3 font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform flex items-center gap-2 mx-auto"
                                >
                                    <RefreshCw className="w-5 h-5" /> 다시 하기
                                </button>
                            </motion.div>
                        </div>
                    )}
                </div>

                <button
                    onClick={initGame}
                    className="arcade-shine inline-flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] font-semibold transition-all active:scale-[0.97] px-5 py-3 text-sm"
                >
                    <RefreshCw className="w-4 h-4" /> 다시 섞기
                </button>

            </div>

            {/* 명예의 전당 (글로벌 TOP 5 리더보드) */}
            <div className="relative w-full max-w-md mx-auto mt-6 px-4 pb-8">
                <GameLeaderboard game="puzzle" title="명예의 전당 TOP 5" unit="무브" order="asc" tone="dark" />
                <GameSuggestion />
            </div>
        </div>
    );
}
