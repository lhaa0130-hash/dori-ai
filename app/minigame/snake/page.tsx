"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trophy, Play } from "lucide-react";
import Link from "next/link";

// ----------------------------------------------------------------------
// Constants & Types
// ----------------------------------------------------------------------

const CANVAS_SIZE = 400;
const TILE_SIZE = 20;
const COLS = CANVAS_SIZE / TILE_SIZE;
const ROWS = CANVAS_SIZE / TILE_SIZE;

const SPEED = 100; // ms

type Point = { x: number; y: number };

export default function SnakeGame() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<"READY" | "PLAYING" | "GAME_OVER">("READY");
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Game State Refs (for interval loop)
    const snake = useRef<Point[]>([]);
    const food = useRef<Point>({ x: 15, y: 15 });
    const direction = useRef<Point>({ x: 0, y: 0 }); // 0, -1 (up)
    const nextDirection = useRef<Point>({ x: 0, y: 0 });
    const gameInterval = useRef<NodeJS.Timeout | null>(null);

    // Load Highscore
    useEffect(() => {
        const saved = localStorage.getItem("snake_highscore");
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const initGame = () => {
        snake.current = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]; // Tail down
        direction.current = { x: 0, y: -1 }; // Move Up
        nextDirection.current = { x: 0, y: -1 };
        placeFood();
        setScore(0);
        setGameState("PLAYING");

        if (gameInterval.current) clearInterval(gameInterval.current);
        gameInterval.current = setInterval(gameLoop, SPEED);
    };

    const placeFood = () => {
        let newFood: Point = { x: 0, y: 0 };
        let isOnSnake = true;
        while (isOnSnake) {
            newFood = {
                x: Math.floor(Math.random() * COLS),
                y: Math.floor(Math.random() * ROWS),
            };
            // eslint-disable-next-line no-loop-func
            isOnSnake = snake.current.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
        }
        food.current = newFood;
    };

    const gameLoop = () => {
        // Update Direciton
        direction.current = nextDirection.current;

        const head = { ...snake.current[0] };
        head.x += direction.current.x;
        head.y += direction.current.y;

        // Check Wall Collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
            gameOver();
            return;
        }

        // Check Self Collision
        if (snake.current.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver();
            return;
        }

        snake.current.unshift(head);

        // Check Food
        if (head.x === food.current.x && head.y === food.current.y) {
            setScore(prev => prev + 10);
            placeFood();
            // Don't pop tail (grow)
        } else {
            snake.current.pop(); // Remove tail
        }

        draw();
    };

    const gameOver = () => {
        if (gameInterval.current) clearInterval(gameInterval.current);
        setGameState("GAME_OVER");
        setScore(currentScore => {
            if (currentScore > highScore) {
                setHighScore(currentScore);
                localStorage.setItem("snake_highscore", currentScore.toString());
            }
            return currentScore;
        });
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.fillStyle = "#171717"; // Neutral-900
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Draw Food
        ctx.fillStyle = "#ef4444"; // Red
        ctx.beginPath();
        ctx.arc(
            food.current.x * TILE_SIZE + TILE_SIZE / 2,
            food.current.y * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE / 2 - 2,
            0, Math.PI * 2
        );
        ctx.fill();

        // Draw Snake
        ctx.fillStyle = "#22c55e"; // Green
        snake.current.forEach((segment, index) => {
            // Head is darker
            if (index === 0) ctx.fillStyle = "#16a34a";
            else ctx.fillStyle = "#22c55e"; // Rest

            ctx.fillRect(
                segment.x * TILE_SIZE + 1,
                segment.y * TILE_SIZE + 1,
                TILE_SIZE - 2,
                TILE_SIZE - 2
            );
        });
    };

    // Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== "PLAYING") return;

            switch (e.key) {
                case "ArrowUp":
                    if (direction.current.y === 0) nextDirection.current = { x: 0, y: -1 };
                    break;
                case "ArrowDown":
                    if (direction.current.y === 0) nextDirection.current = { x: 0, y: 1 };
                    break;
                case "ArrowLeft":
                    if (direction.current.x === 0) nextDirection.current = { x: -1, y: 0 };
                    break;
                case "ArrowRight":
                    if (direction.current.x === 0) nextDirection.current = { x: 1, y: 0 };
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gameState]);

    // Initial Draw
    useEffect(() => {
        // Small delay to ensure canvas is ready
        setTimeout(() => {
            snake.current = [{ x: 10, y: 10 }];
            draw();
        }, 100);
        return () => { if (gameInterval.current) clearInterval(gameInterval.current); }
    }, []);

    return (
        <div className="h-screen w-full bg-slate-900 text-white font-sans selection:bg-green-500/30 flex flex-col items-center justify-center p-4 overflow-hidden touch-none">

            <header className="w-full max-w-md flex items-center justify-between mb-6">
                <Link href="/minigame" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-400" />
                </Link>
                <div className="font-bold text-xl text-green-500 tracking-wider">SNAKE</div>
                <div className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700">
                    <Trophy className="w-5 h-5 text-green-500" />
                </div>
            </header>

            <div className="relative border-4 border-slate-700 rounded-lg shadow-2xl overflow-hidden bg-black">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="block max-w-full max-h-[60vh] aspect-square shadow-2xl rounded-lg border-4 border-slate-700"
                />

                {gameState === "READY" && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                        <h1 className="text-4xl font-bold text-green-500 mb-6 font-mono animate-pulse">SNAKE</h1>
                        <button
                            onClick={initGame}
                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold text-lg flex items-center gap-2 transform transition-transform active:scale-95 shadow-lg shadow-green-900/50"
                        >
                            <Play className="w-6 h-6 fill-current" />
                            START
                        </button>
                    </div>
                )}

                {gameState === "GAME_OVER" && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                        <h2 className="text-3xl font-bold text-red-500 mb-2">GAME OVER</h2>
                        <div className="text-xl text-white mb-6">Score: {score}</div>
                        <button
                            onClick={initGame}
                            className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-slate-200"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-3 gap-2 mt-6 w-[200px]">
                <div />
                <button
                    className="bg-slate-800 p-4 rounded-lg active:bg-slate-700 flex justify-center"
                    onTouchStart={(e) => { e.preventDefault(); if (direction.current.y === 0) nextDirection.current = { x: 0, y: -1 }; }}
                    onMouseDown={(e) => { e.preventDefault(); if (direction.current.y === 0) nextDirection.current = { x: 0, y: -1 }; }}
                >⬆️</button>
                <div />
                <button
                    className="bg-slate-800 p-4 rounded-lg active:bg-slate-700 flex justify-center"
                    onTouchStart={(e) => { e.preventDefault(); if (direction.current.x === 0) nextDirection.current = { x: -1, y: 0 }; }}
                    onMouseDown={(e) => { e.preventDefault(); if (direction.current.x === 0) nextDirection.current = { x: -1, y: 0 }; }}
                >⬅️</button>
                <button
                    className="bg-slate-800 p-4 rounded-lg active:bg-slate-700 flex justify-center"
                    onTouchStart={(e) => { e.preventDefault(); if (direction.current.y === 0) nextDirection.current = { x: 0, y: 1 }; }}
                    onMouseDown={(e) => { e.preventDefault(); if (direction.current.y === 0) nextDirection.current = { x: 0, y: 1 }; }}
                >⬇️</button>
                <button
                    className="bg-slate-800 p-4 rounded-lg active:bg-slate-700 flex justify-center"
                    onTouchStart={(e) => { e.preventDefault(); if (direction.current.x === 0) nextDirection.current = { x: 1, y: 0 }; }}
                    onMouseDown={(e) => { e.preventDefault(); if (direction.current.x === 0) nextDirection.current = { x: 1, y: 0 }; }}
                >➡️</button>
            </div>
        </div>
    );
}
