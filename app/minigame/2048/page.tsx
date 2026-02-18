"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trophy, Crown } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ----------------------------------------------------------------------
// Constants & Types
// ----------------------------------------------------------------------

const GRID_SIZE = 4;
const WIN_SCORE = 2048;

type Grid = number[][];

const TILE_COLORS: Record<number, string> = {
    2: "bg-slate-200 text-slate-700",
    4: "bg-slate-300 text-slate-800",
    8: "bg-orange-200 text-white",
    16: "bg-orange-300 text-white",
    32: "bg-orange-400 text-white",
    64: "bg-orange-500 text-white",
    128: "bg-yellow-200 text-white shadow-[0_0_10px_#fde047]",
    256: "bg-yellow-300 text-white shadow-[0_0_15px_#fcd34d]",
    512: "bg-yellow-400 text-white shadow-[0_0_20px_#fbbf24]",
    1024: "bg-yellow-500 text-white shadow-[0_0_25px_#f59e0b]",
    2048: "bg-yellow-600 text-white shadow-[0_0_30px_#d97706]",
};

export default function Game2048() {
    const [grid, setGrid] = useState<Grid>(createEmptyGrid());
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);

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
    const move = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
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
            setScore(prev => {
                const newScore = prev + scoreGain;
                if (newScore > bestScore) {
                    setBestScore(newScore);
                    localStorage.setItem("2048_best", newScore.toString());
                }
                return newScore;
            });

            // Check Win/Loss
            if (newGrid.flat().includes(2048) && !won) setWon(true);
            if (checkGameOver(newGrid)) setGameOver(true);
        }
    };

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
    }, [grid, gameOver, won]);

    return (
        <div className="h-screen w-full bg-slate-900 text-white font-sans selection:bg-yellow-500/30 flex flex-col items-center justify-center p-4 overflow-hidden touch-none">

            <header className="w-full max-w-md flex items-center justify-between mb-6">
                <Link href="/minigame" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-400" />
                </Link>
                <div className="font-bold text-3xl text-slate-200 tracking-wider">2048</div>
                <div className="flex gap-2">
                    <div className="bg-slate-700 px-3 py-1 rounded text-center min-w-[70px]">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Score</div>
                        <div className="font-bold">{score}</div>
                    </div>
                    <div className="bg-slate-700 px-3 py-1 rounded text-center min-w-[70px]">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Best</div>
                        <div className="font-bold">{bestScore}</div>
                    </div>
                </div>
            </header>

            <div className="relative bg-slate-800 p-2 rounded-lg" style={{ touchAction: "none" }}>

                <div className="grid grid-cols-4 gap-2 bg-slate-700 p-2 rounded">
                    {grid.map((row, i) =>
                        row.map((val, j) => (
                            <motion.div
                                key={`${i}-${j}`}
                                layoutId={`tile-${i}-${j}`} // Simple layout animation
                                className={`w-16 h-16 md:w-20 md:h-20 rounded font-bold text-2xl md:text-3xl flex items-center justify-center transition-colors ${val > 0 ? TILE_COLORS[val] : "bg-slate-600/50"}`}
                            >
                                {val > 0 ? val : ""}
                            </motion.div>
                        ))
                    )}
                </div>

                {(gameOver || won) && (
                    <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm">
                        <h2 className="text-4xl font-bold mb-4 text-white">
                            {won ? "YOU WON! 🎉" : "GAME OVER"}
                        </h2>
                        <button
                            onClick={initGame}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded font-bold text-lg shadow-lg active:scale-95 transition-transform"
                        >
                            <RefreshCw className="w-5 h-5 inline-block mr-2" />
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-3 gap-2 mt-6 w-[200px] md:hidden">
                <div />
                <button
                    className="bg-slate-800 p-4 rounded-lg active:bg-slate-700 flex justify-center text-2xl"
                    onClick={() => move('UP')}
                >⬆️</button>
                <div />
                <button
                    className="bg-slate-800 p-4 rounded-lg active:bg-slate-700 flex justify-center text-2xl"
                    onClick={() => move('LEFT')}
                >⬅️</button>
                <button
                    className="bg-slate-800 p-4 rounded-lg active:bg-slate-700 flex justify-center text-2xl"
                    onClick={() => move('DOWN')}
                >⬇️</button>
                <button
                    className="bg-slate-800 p-4 rounded-lg active:bg-slate-700 flex justify-center text-2xl"
                    onClick={() => move('RIGHT')}
                >➡️</button>
            </div>

            <div className="mt-8 text-slate-500 text-sm">
                Use arrow keys or buttons to join the numbers and get to the <span className="text-yellow-500 font-bold">2048 tile!</span>
            </div>
        </div>
    );
}
