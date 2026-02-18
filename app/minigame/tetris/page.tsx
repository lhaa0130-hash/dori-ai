"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RotateCw, ArrowDown, ArrowRight, ArrowLeft as ArrowLeftIcon, Trophy, RefreshCw, Play } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

// ----------------------------------------------------------------------
// Constants & Types
// ----------------------------------------------------------------------

const COLS = 10;
const ROWS = 20;
// const BLOCK_SIZE = 30; // Removed constant
// const BLOCK_SIZE = 30; // Removed constant
const COLORS = [
    null,
    "#FF0D72", // T
    "#0DC2FF", // I
    "#0DFF72", // S
    "#F538FF", // Z
    "#FF8E0D", // L
    "#FFE138", // J
    "#3877FF", // O
];

const SHAPES = [
    [],
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]], // T
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]], // I
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]], // S
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]], // Z
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]], // L
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]], // J
    [[1, 1], [1, 1]], // O
];

type GameState = "READY" | "PLAYING" | "PAUSED" | "GAME_OVER";

export default function TetrisGame() {
    const { session } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>("READY");
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [lines, setLines] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Game Logic State (Refs for performance in loop)
    const grid = useRef<number[][]>([]);
    const piece = useRef<{ matrix: number[][]; x: number; y: number; type: number } | null>(null);
    const dropCounter = useRef(0);
    const dropInterval = useRef(1000);
    const lastTime = useRef(0);
    const requestRef = useRef<number>();
    const blockSizeRef = useRef(30);

    // Responsive Block Size
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            // Increase reserved space to prevent cropping (Header + Controls + Padding)
            const availableHeight = window.innerHeight - (isMobile ? 350 : 150);
            const availableWidth = window.innerWidth - 40; // 20px padding each side

            const sizeBasedOnHeight = availableHeight / ROWS;
            const sizeBasedOnWidth = availableWidth / COLS;

            const size = Math.floor(Math.min(30, Math.max(15, Math.min(sizeBasedOnHeight, sizeBasedOnWidth))));
            setBlockSize(size);
            blockSizeRef.current = size;
        };

        // Prevent Pull-to-Refresh and Scroll
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";

        const preventDefault = (e: TouchEvent) => {
            if (e.touches.length > 1) return; // Allow pinch zoom maybe? No, block all for game
            e.preventDefault();
        };

        document.addEventListener('touchmove', preventDefault, { passive: false });

        handleResize();
        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            document.removeEventListener('touchmove', preventDefault);
            document.body.style.overflow = "auto";
            document.body.style.touchAction = "auto";
        };
    }, []);

    const [blockSize, setBlockSize] = useState(30);

    // ----------------------------------------------------------------------
    // Game Logic
    // ----------------------------------------------------------------------

    // Initialize Grid
    const createGrid = () => Array.from({ length: ROWS }, () => new Array(COLS).fill(0));

    // Create Piece
    const createPiece = (type: number) => {
        return {
            matrix: SHAPES[type],
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
            y: 0,
            type,
        };
    };

    // Reset Game
    const resetGame = () => {
        grid.current = createGrid();
        piece.current = createPiece(Math.floor(Math.random() * 7) + 1);
        setScore(0);
        setLines(0);
        setLevel(1);
        dropInterval.current = 1000;
        dropCounter.current = 0;
        setGameState("PLAYING");
        lastTime.current = 0;

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(update);
    };

    // Collision Detection
    const collide = (arena: number[][], player: { matrix: number[][]; x: number; y: number }) => {
        const [m, o] = [player.matrix, { x: player.x, y: player.y }];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    };

    // Merge Piece to Grid
    const merge = (arena: number[][], player: { matrix: number[][]; x: number; y: number; type: number }) => {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    arena[y + player.y][x + player.x] = player.type;
                }
            });
        });
    };

    // Rotate Matrix
    const rotate = (matrix: number[][], dir: number) => {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) matrix.forEach((row) => row.reverse());
        else matrix.reverse();
    };

    // Player Rotate
    const playerRotate = (dir: number) => {
        if (!piece.current) return;
        const pos = piece.current.x;
        let offset = 1;
        rotate(piece.current.matrix, dir);
        while (collide(grid.current, piece.current)) {
            piece.current.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > piece.current.matrix[0].length) {
                rotate(piece.current.matrix, -dir);
                piece.current.x = pos;
                return;
            }
        }
    };

    // Arena Sweep (Line Clear)
    const arenaSweep = () => {
        let rowCount = 0;
        outer: for (let y = grid.current.length - 1; y > 0; --y) {
            for (let x = 0; x < grid.current[y].length; ++x) {
                if (grid.current[y][x] === 0) {
                    continue outer;
                }
            }
            const row = grid.current.splice(y, 1)[0].fill(0);
            grid.current.unshift(row);
            ++y;
            rowCount++;
        }

        if (rowCount > 0) {
            // Score Calculation
            const lineScores = [0, 40, 100, 300, 1200];
            setScore((prev) => prev + lineScores[rowCount] * level);
            setLines((prev) => {
                const newLines = prev + rowCount;
                // Level Up every 10 lines
                if (Math.floor(newLines / 10) > Math.floor(prev / 10)) {
                    setLevel((l) => l + 1);
                    dropInterval.current = Math.max(100, 1000 - (level * 50));
                }
                return newLines;
            });
        }
    };

    // Player Drop
    const playerDrop = () => {
        if (!piece.current) return;
        piece.current.y++;
        if (collide(grid.current, piece.current)) {
            piece.current.y--;
            merge(grid.current, piece.current);
            createNewPiece();
            arenaSweep();
            dropCounter.current = 0; // Reset drop counter
        }
        dropCounter.current = 0;
    };

    // Create New Piece
    const createNewPiece = () => {
        piece.current = createPiece(Math.floor(Math.random() * 7) + 1);
        if (collide(grid.current, piece.current)) {
            setGameState("GAME_OVER");
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    };

    // Update Loop
    const update = (time = 0) => {
        if (gameState !== "PLAYING") return;

        const deltaTime = time - lastTime.current;
        lastTime.current = time;

        dropCounter.current += deltaTime;
        if (dropCounter.current > dropInterval.current) {
            playerDrop();
        }

        draw();
        requestRef.current = requestAnimationFrame(update);
    };

    // Draw Function
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear Canvas
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Grid
        drawMatrix(grid.current, { x: 0, y: 0 }, ctx, blockSizeRef.current);

        // Draw Piece
        if (piece.current) {
            drawMatrix(piece.current.matrix, { x: piece.current.x, y: piece.current.y }, ctx, blockSizeRef.current);

            // Draw Ghost Piece (Guide)
            // ... (Optional: Ghost piece implementation)
        }
    };

    const drawMatrix = (matrix: number[][], offset: { x: number; y: number }, ctx: CanvasRenderingContext2D, size: number) => {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0 && COLORS[value]) {
                    ctx.fillStyle = COLORS[value]!;
                    ctx.fillRect((x + offset.x) * size, (y + offset.y) * size, size, size);

                    // Bevel effect
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                    ctx.strokeRect((x + offset.x) * size, (y + offset.y) * size, size, size);

                    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
                    ctx.fillRect((x + offset.x) * size + 2, (y + offset.y) * size + 2, size - 4, size - 4);
                }
            });
        });
    };

    // Controls
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (gameState !== "PLAYING" || !piece.current) return;

        if (e.key === "ArrowLeft") {
            piece.current.x--;
            if (collide(grid.current, piece.current)) piece.current.x++;
        } else if (e.key === "ArrowRight") {
            piece.current.x++;
            if (collide(grid.current, piece.current)) piece.current.x--;
        } else if (e.key === "ArrowDown") {
            playerDrop();
        } else if (e.key === "ArrowUp") {
            playerRotate(1);
        }
    }, [gameState]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Start/Restart
    useEffect(() => {
        if (gameState === "PLAYING") {
            requestRef.current = requestAnimationFrame(update);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState]);

    // Initial Highscore Load
    useEffect(() => {
        const saved = localStorage.getItem("tetris_highscore");
        if (saved) setHighScore(parseInt(saved));
    }, []);

    // Update Highscore
    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("tetris_highscore", score.toString());
        }
    }, [score]);

    return (
        <div className="fixed inset-0 w-full h-[100dvh] bg-slate-900 text-white font-sans selection:bg-orange-500/30 flex flex-col items-center justify-center p-4 overflow-hidden touch-none z-50">

            {/* Header */}
            <header className="w-full max-w-md flex items-center justify-between mb-4">
                <Link href="/minigame" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-400" />
                </Link>
                <div className="font-bold text-xl text-yellow-500 tracking-wider">TETRIS</div>
                <div className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Game Board */}
                <div className="relative bg-black rounded-lg border-4 border-slate-700 shadow-2xl overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={COLS * blockSize}
                        height={ROWS * blockSize}
                        className="block"
                    />

                    {/* Overlays */}
                    {gameState === "READY" && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                            <h1 className="text-4xl font-bold text-yellow-500 mb-4 tracking-widest animate-pulse">TETRIS</h1>
                            <button
                                onClick={resetGame}
                                className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 transform transition-transform active:scale-95 shadow-lg shadow-orange-900/50"
                            >
                                <Play className="w-6 h-6 fill-current" />
                                START GAME
                            </button>
                        </div>
                    )}

                    {gameState === "GAME_OVER" && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10">
                            <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
                            <div className="text-xl text-white mb-6">Score: {score}</div>
                            <button
                                onClick={resetGame}
                                className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-slate-200"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats & Controls */}
                <div className="flex flex-col gap-4 w-full max-w-[200px]">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                        <div className="text-slate-400 text-xs uppercase mb-1">Score</div>
                        <div className="text-2xl font-bold text-white mb-3 font-mono">{score.toLocaleString()}</div>

                        <div className="text-slate-400 text-xs uppercase mb-1">Level</div>
                        <div className="text-xl font-bold text-orange-400 mb-3 font-mono">{level}</div>

                        <div className="text-slate-400 text-xs uppercase mb-1">Lines</div>
                        <div className="text-xl font-bold text-blue-400 font-mono">{lines}</div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                        <div className="text-slate-400 text-xs uppercase mb-1 flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-yellow-500" /> High Score
                        </div>
                        <div className="text-xl font-bold text-yellow-500 font-mono">{highScore.toLocaleString()}</div>
                    </div>

                    {/* Mobile Controls */}
                    <div className="grid grid-cols-2 gap-2 mt-4 md:hidden">
                        <button
                            onMouseDown={(e) => { e.preventDefault(); if (piece.current) { piece.current.x--; if (collide(grid.current, piece.current)) piece.current.x++; draw(); } }}
                            onTouchStart={(e) => { e.preventDefault(); if (piece.current) { piece.current.x--; if (collide(grid.current, piece.current)) piece.current.x++; draw(); } }}
                            className="bg-slate-700 p-4 rounded-lg active:bg-slate-600 flex justify-center touch-none"
                        >
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); if (piece.current) { piece.current.x++; if (collide(grid.current, piece.current)) piece.current.x--; draw(); } }}
                            onTouchStart={(e) => { e.preventDefault(); if (piece.current) { piece.current.x++; if (collide(grid.current, piece.current)) piece.current.x--; draw(); } }}
                            className="bg-slate-700 p-4 rounded-lg active:bg-slate-600 flex justify-center touch-none"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); playerRotate(1); }}
                            onTouchStart={(e) => { e.preventDefault(); playerRotate(1); }}
                            className="bg-slate-700 p-4 rounded-lg active:bg-slate-600 flex justify-center col-span-2 touch-none"
                        >
                            <RotateCw className="w-6 h-6" />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); playerDrop(); }}
                            onTouchStart={(e) => { e.preventDefault(); playerDrop(); }}
                            className="bg-slate-700 p-4 rounded-lg active:bg-slate-600 flex justify-center col-span-2 touch-none"
                        >
                            <ArrowDown className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="text-xs text-slate-500 mt-2 hidden md:block">
                        <p>Arrows: Move</p>
                        <p>Up: Rotate</p>
                        <p>Down: Drop</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
