"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trophy, Play } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

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
    const { session } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const touchStartRef = useRef<{x: number, y: number} | null>(null);
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
            burst(); // 먹이 획득 축하 (JUICE)
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
                bigBurst(); // 신기록 축하 (JUICE)
            }
            // 명예의 전당(글로벌 TOP 5) 점수 제출
            if (session?.user?.email) {
                submitScore("snake", session.user.name || "플레이어", currentScore, "desc");
                if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "snake" }));
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
        ctx.fillStyle = "#0d0d13"; // Dark arcade base (#09090e 계열)
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
        <div className="relative min-h-screen w-full overflow-hidden bg-[#09090e] text-white font-sans selection:bg-[#F9954E]/30 flex flex-col items-center justify-center p-4 touch-none">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            <header className="w-full max-w-md flex items-center justify-between mb-6">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    미니게임
                </Link>
                <div className="text-[15px] font-extrabold tracking-tight text-white">🐍 스네이크</div>
                <div className="flex items-center gap-2">
                    <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                        <div className="text-[9px] uppercase tracking-widest text-stone-500">SCORE</div>
                        <div key={score} className="arcade-pop inline-block text-sm font-bold text-white">
                            <CountUp value={score} className="tabular-nums" />
                        </div>
                    </div>
                    <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-widest text-stone-500"><Trophy className="w-2.5 h-2.5" />BEST</div>
                        <div key={highScore} className="arcade-pop inline-block text-sm font-bold text-[#F9954E]">
                            <CountUp value={highScore} className="tabular-nums" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="arcade-card arcade-rise relative rounded-2xl bg-white/[0.04] border border-white/10 p-2 shadow-2xl overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="block rounded-xl"
                    style={{ width: '100%', maxWidth: `${CANVAS_SIZE}px`, height: 'auto', aspectRatio: '1' }}
                    onTouchStart={(e) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                    onTouchEnd={(e) => {
                        if (!touchStartRef.current) return;
                        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
                        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
                        touchStartRef.current = null;
                        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
                        if (Math.abs(dx) > Math.abs(dy)) {
                            if (direction.current.x === 0) nextDirection.current = { x: dx > 0 ? 1 : -1, y: 0 };
                        } else {
                            if (direction.current.y === 0) nextDirection.current = { x: 0, y: dy > 0 ? 1 : -1 };
                        }
                    }}
                />

                {gameState === "READY" && (
                    <div className="arcade-pop-in absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center">
                        <h1 className="arcade-float text-4xl font-extrabold tracking-tight text-white mb-2">🐍 스네이크</h1>
                        <p className="text-sm text-stone-400 mb-6">스와이프 또는 방향키로 조작하세요</p>
                        <button
                            onClick={initGame}
                            className="arcade-shine arcade-glow rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform px-8 py-3 flex items-center gap-2"
                        >
                            <Play className="w-5 h-5 fill-current" />
                            게임 시작
                        </button>
                    </div>
                )}

                {gameState === "GAME_OVER" && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
                        <div className="arcade-pop-in arcade-card rounded-3xl bg-[#101016] border border-white/10 p-8 flex flex-col items-center text-center">
                            <h2 className="text-xl font-extrabold tracking-tight text-white mb-4">게임 오버</h2>
                            {score > 0 && score >= highScore && (
                                <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-[#F9954E]/15 border border-[#F9954E]/30 px-3 py-1 text-[11px] font-bold text-[#F9954E]">
                                    <Trophy className="w-3 h-3" /> 신기록 달성!
                                </div>
                            )}
                            <div className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">SCORE</div>
                            <div className="arcade-grad-text text-5xl font-black tabular-nums mb-6">
                                <CountUp value={score} />
                            </div>
                            <button
                                onClick={initGame}
                                className="arcade-shine arcade-glow rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-transform px-8 py-3 flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                다시하기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-3 gap-2 mt-6 w-[200px]">
                <div />
                <button
                    className="arcade-card rounded-xl bg-white/[0.06] border border-white/10 p-4 active:bg-white/[0.12] active:scale-[0.92] transition-all flex justify-center"
                    onTouchStart={(e) => { e.preventDefault(); if (direction.current.y === 0) nextDirection.current = { x: 0, y: -1 }; }}
                    onMouseDown={(e) => { e.preventDefault(); if (direction.current.y === 0) nextDirection.current = { x: 0, y: -1 }; }}
                >⬆️</button>
                <div />
                <button
                    className="arcade-card rounded-xl bg-white/[0.06] border border-white/10 p-4 active:bg-white/[0.12] active:scale-[0.92] transition-all flex justify-center"
                    onTouchStart={(e) => { e.preventDefault(); if (direction.current.x === 0) nextDirection.current = { x: -1, y: 0 }; }}
                    onMouseDown={(e) => { e.preventDefault(); if (direction.current.x === 0) nextDirection.current = { x: -1, y: 0 }; }}
                >⬅️</button>
                <button
                    className="arcade-card rounded-xl bg-white/[0.06] border border-white/10 p-4 active:bg-white/[0.12] active:scale-[0.92] transition-all flex justify-center"
                    onTouchStart={(e) => { e.preventDefault(); if (direction.current.y === 0) nextDirection.current = { x: 0, y: 1 }; }}
                    onMouseDown={(e) => { e.preventDefault(); if (direction.current.y === 0) nextDirection.current = { x: 0, y: 1 }; }}
                >⬇️</button>
                <button
                    className="arcade-card rounded-xl bg-white/[0.06] border border-white/10 p-4 active:bg-white/[0.12] active:scale-[0.92] transition-all flex justify-center"
                    onTouchStart={(e) => { e.preventDefault(); if (direction.current.x === 0) nextDirection.current = { x: 1, y: 0 }; }}
                    onMouseDown={(e) => { e.preventDefault(); if (direction.current.x === 0) nextDirection.current = { x: 1, y: 0 }; }}
                >➡️</button>
            </div>

            <div className="w-full max-w-md mx-auto mt-4 px-4">
                <GameLeaderboard game="snake" title="명예의 전당 TOP 5" unit="점" order="desc" tone="dark" />
            </div>

            <GameSuggestion />
        </div>
    );
}
