"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeft, RefreshCw, Play, Users, Trophy, ChevronRight, Shuffle, Sparkles, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";

// ---- Types ----
type GameState = "SETUP" | "READY" | "PLAYING" | "FINISHED";

interface Player {
    id: number;
    name: string;
    color: string;
    currentX: number; // percentage (0-100)
    currentY: number; // percentage (0-100)
    path: Point[]; // pre-calculated path
    finished: boolean;
    progress: number; // 0-1 path progress for drawing line
}

interface Point {
    x: number;
    y: number;
}

interface Bridge {
    col: number; // connects col and col+1
    row: number; // vertical position (0-100)
}

// ---- Constants ----
const PLAYER_COLORS = [
    "#ef4444", // red
    "#F9954E", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
    "#f43f5e", // rose
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const LADDER_PADDING = 15; // Bridges only appear within this range (15-85%)

export default function LadderGamePage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState>("SETUP");

    // Setup State
    const [playerCount, setPlayerCount] = useState(4);
    const [playerNames, setPlayerNames] = useState<string[]>(Array(4).fill("").map((_, i) => `참가자 ${i + 1}`));
    const [results, setResults] = useState<string[]>(Array(4).fill("").map((_, i) => i === 0 ? "당첨" : "꽝"));

    // Game State
    const [bridges, setBridges] = useState<Bridge[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [animatingPlayerIndex, setAnimatingPlayerIndex] = useState<number | "ALL" | null>(null);
    const [animationProgress, setAnimationProgress] = useState(0);

    // Results Reveal State
    const [revealedResults, setRevealedResults] = useState<boolean[]>([]);

    // Animation Controls for Board Shake
    const boardControls = useAnimation();

    const animationRef = useRef<number>();

    useEffect(() => {
        setMounted(true);
    }, []);

    const triggerConfetti = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    const triggerShake = async () => {
        await boardControls.start({
            x: [0, -5, 5, -5, 5, 0],
            transition: { duration: 0.4 }
        });
    };

    // ---- Logic: Ladder Generation ----
    const generateLadder = () => {
        const newBridges: Bridge[] = [];
        const rows = 12; // Number of potential bridge slots vertically
        // Bridges area: 15% to 85%
        const bridgeAreaStart = LADDER_PADDING;
        const bridgeAreaEnd = 100 - LADDER_PADDING;
        const rowHeight = (bridgeAreaEnd - bridgeAreaStart) / (rows + 1);

        for (let r = 0; r < rows; r++) {
            // Randomly decide which columns have a bridge
            const rowY = bridgeAreaStart + (rowHeight * (r + 1));

            for (let c = 0; c < playerCount - 1; c++) {
                if (Math.random() > 0.6) {
                    const hasLeftNeighbor = newBridges.some(b => Math.abs(b.row - rowY) < 0.01 && b.col === c - 1);
                    const hasRightNeighbor = newBridges.some(b => Math.abs(b.row - rowY) < 0.01 && b.col === c + 1);

                    if (!hasLeftNeighbor && !hasRightNeighbor) {
                        newBridges.push({ col: c, row: rowY });
                    }
                }
            }
        }
        setBridges(newBridges);

        const newPlayers: Player[] = playerNames.map((name, i) => {
            const startX = getColumnX(i, playerCount);
            return {
                id: i,
                name: name || `참가자 ${i + 1}`,
                color: PLAYER_COLORS[i % PLAYER_COLORS.length],
                currentX: startX,
                currentY: 0,
                path: calculatePath(i, newBridges, playerCount),
                finished: false,
                progress: 0
            };
        });

        setPlayers(newPlayers);
        setRevealedResults(new Array(playerCount).fill(false));
        setGameState("READY");
        setAnimatingPlayerIndex(null);
        setAnimationProgress(0);
    };

    // ---- Logic: Path Calculation ----
    const calculatePath = (startCol: number, ladderBridges: Bridge[], count: number): Point[] => {
        let col = startCol;
        const path: Point[] = [{ x: getColumnX(col, count), y: 0 }];
        path.push({ x: getColumnX(col, count), y: LADDER_PADDING });

        const sortedBridges = [...ladderBridges].sort((a, b) => a.row - b.row);

        sortedBridges.forEach(bridge => {
            if (bridge.col === col || bridge.col === col - 1) {
                path.push({ x: getColumnX(col, count), y: bridge.row });
                if (bridge.col === col) {
                    col++;
                } else {
                    col--;
                }
                path.push({ x: getColumnX(col, count), y: bridge.row });
            }
        });

        path.push({ x: getColumnX(col, count), y: 100 - LADDER_PADDING });
        path.push({ x: getColumnX(col, count), y: 100 });
        return path;
    };

    const getColumnX = (index: number, total: number) => {
        return ((index + 1) / (total + 1)) * 100;
    };

    const getDistance = (p1: Point, p2: Point) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    // ---- Animation Loop ----
    const startAnimation = (playerIndex: number | "ALL") => {
        if (gameState === "PLAYING" && animatingPlayerIndex !== playerIndex) return;

        setGameState("PLAYING");
        setAnimatingPlayerIndex(playerIndex);
        setAnimationProgress(0);

        const startTime = performance.now();
        const baseDuration = 4000;

        const playerPaths = players.map(p => {
            let totalDist = 0;
            const segments = [];
            for (let i = 0; i < p.path.length - 1; i++) {
                const dist = getDistance(p.path[i], p.path[i + 1]);
                totalDist += dist;
                segments.push(dist);
            }
            return { totalDist, segments };
        });

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / baseDuration, 1);
            setAnimationProgress(progress);

            setPlayers(prev => prev.map((p, idx) => {
                if (playerIndex !== "ALL" && idx !== playerIndex) return p;
                if (p.finished) return p;

                if (progress >= 1) return { ...p, currentX: p.path[p.path.length - 1].x, currentY: p.path[p.path.length - 1].y, finished: true, progress: 1 };

                const { totalDist, segments } = playerPaths[idx];
                const targetDist = totalDist * progress;

                let currentDist = 0;
                let segmentIndex = 0;
                let newX = p.currentX;
                let newY = p.currentY;

                while (segmentIndex < segments.length) {
                    const segLen = segments[segmentIndex];
                    if (currentDist + segLen >= targetDist) {
                        const segmentProgress = (targetDist - currentDist) / segLen;
                        const p1 = p.path[segmentIndex];
                        const p2 = p.path[segmentIndex + 1];
                        newX = p1.x + (p2.x - p1.x) * segmentProgress;
                        newY = p1.y + (p2.y - p1.y) * segmentProgress;
                        break;
                    }
                    currentDist += segLen;
                    segmentIndex++;
                }

                return {
                    ...p,
                    currentX: newX,
                    currentY: newY,
                    finished: false,
                    progress: progress
                };
            }));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Animation Finished
                triggerShake();

                if (playerIndex === "ALL") {
                    setGameState("FINISHED");
                    setRevealedResults(new Array(playerCount).fill(true));
                    triggerConfetti();
                } else {
                    setPlayers(prev => prev.map((p, idx) => {
                        if (idx === playerIndex) return { ...p, finished: true, progress: 1 };
                        return p;
                    }));

                    const p = players[playerIndex as number];
                    const endX = p.path[p.path.length - 1].x;
                    const colIndex = Array.from({ length: playerCount }).findIndex((_, i) => Math.abs(getColumnX(i, playerCount) - endX) < 1);

                    if (colIndex !== -1) {
                        setRevealedResults(prev => {
                            const next = [...prev];
                            next[colIndex] = true;
                            return next;
                        });
                        // Trigger confetti only if good result?
                        // For now just always for thrill
                        triggerConfetti();
                    }

                    setGameState("READY");
                }
            }
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    // ---- Handlers ----
    const handlePlayerCountChange = (delta: number) => {
        const newCount = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, playerCount + delta));
        setPlayerCount(newCount);
        if (newCount > playerNames.length) {
            setPlayerNames([...playerNames, `참가자 ${newCount}`]);
            setResults([...results, "꽝"]);
        } else if (newCount < playerNames.length) {
            setPlayerNames(playerNames.slice(0, newCount));
            setResults(results.slice(0, newCount));
        }
    };

    const handleUpdateName = (idx: number, val: string) => {
        const newNames = [...playerNames];
        newNames[idx] = val;
        setPlayerNames(newNames);
    };

    const handleUpdateResult = (idx: number, val: string) => {
        const newResults = [...results];
        newResults[idx] = val;
        setResults(newResults);
    };

    const resetGame = () => {
        setGameState("SETUP");
        setPlayers([]);
        setBridges([]);
        setRevealedResults([]);
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">사다리 타기</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
                {gameState === "SETUP" && (
                    <div className="animate-fade-in space-y-8">
                        {/* Setup Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold mb-2">게임 설정</h2>
                                <p className="text-neutral-500 dark:text-zinc-400">참가 인원과 내기 항목을 설정하세요.</p>
                            </div>

                            <div className="flex items-center justify-center gap-6 mb-10">
                                <button
                                    onClick={() => handlePlayerCountChange(-1)}
                                    className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <span className="text-2xl font-light">-</span>
                                </button>
                                <div className="text-center w-24">
                                    <span className="text-4xl font-bold text-[#F9954E]">{playerCount}</span>
                                    <span className="text-sm text-neutral-400 block mt-1">명</span>
                                </div>
                                <button
                                    onClick={() => handlePlayerCountChange(1)}
                                    className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <span className="text-2xl font-light">+</span>
                                </button>
                            </div>

                            <div className="grid gap-4 mb-10">
                                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-2 px-2 text-sm font-bold text-neutral-400">
                                    <span className="text-center">이름</span>
                                    <span className="w-8"></span>
                                    <span className="text-center">결과 (벌칙/당첨)</span>
                                </div>
                                {Array.from({ length: playerCount }).map((_, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <input
                                            type="text"
                                            value={playerNames[i]}
                                            onChange={(e) => handleUpdateName(i, e.target.value)}
                                            placeholder={`참가자 ${i + 1}`}
                                            className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-[#F9954E] dark:focus:border-[#F9954E] transition-colors"
                                        />
                                        <div className="w-8 flex justify-center text-neutral-300">
                                            <Shuffle className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="text"
                                            value={results[i]}
                                            onChange={(e) => handleUpdateResult(i, e.target.value)}
                                            placeholder={i === 0 ? "당첨" : "꽝"}
                                            className="w-full bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-[#F9954E] dark:focus:border-[#F9954E] transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={generateLadder}
                                className="w-full py-4 bg-[#F9954E] hover:bg-[#E8832E] active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#F9954E]/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                게임 시작
                            </button>
                        </div>
                    </div>
                )}

                {(gameState === "READY" || gameState === "PLAYING" || gameState === "FINISHED") && (
                    <div className="animate-fade-in">
                        {/* Game Board */}
                        <motion.div
                            animate={boardControls}
                            className="relative bg-white dark:bg-zinc-900 rounded-[2rem] p-6 md:p-10 shadow-xl border border-neutral-100 dark:border-zinc-800 min-h-[600px] overflow-hidden"
                        >

                            {/* Controls */}
                            <div className="absolute top-6 right-6 z-10 flex gap-2">
                                <button
                                    onClick={resetGame}
                                    className="p-2 rounded-full bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors text-neutral-600 dark:text-neutral-400"
                                    title="다시 설정"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Start ALL Button */}
                            {gameState === "READY" && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                                    <button
                                        onClick={() => startAnimation("ALL")}
                                        className="pointer-events-auto px-8 py-3 bg-lack dark:bg-white text-white dark:text-black rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-2"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        전체 결과 보기
                                    </button>
                                </div>
                            )}

                            {/* SVG Canvas */}
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                                <defs>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="1" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>

                                {Array.from({ length: playerCount }).map((_, i) => (
                                    <line
                                        key={`v-${i}`}
                                        x1={getColumnX(i, playerCount)}
                                        y1={0}
                                        x2={getColumnX(i, playerCount)}
                                        y2={100}
                                        stroke={isDark ? "#333" : "#e5e5e5"}
                                        strokeWidth="0.5"
                                        strokeLinecap="round"
                                        opacity={0.3}
                                    />
                                ))}

                                {bridges.map((b, i) => (
                                    <line
                                        key={`b-${i}`}
                                        x1={getColumnX(b.col, playerCount)}
                                        y1={b.row}
                                        x2={getColumnX(b.col + 1, playerCount)}
                                        y2={b.row}
                                        stroke={isDark ? "#333" : "#e5e5e5"}
                                        strokeWidth="0.5"
                                        strokeLinecap="round"
                                        opacity={0.3}
                                    />
                                ))}

                                {players.map((p, i) => (
                                    <motion.polyline
                                        key={`path-${i}`}
                                        points={p.path.map(pt => `${pt.x},${pt.y}`).join(" ")}
                                        fill="none"
                                        stroke={p.color}
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: p.progress }}
                                        transition={{ duration: 0, ease: "linear" }}
                                        style={{
                                            filter: "url(#glow)",
                                            opacity: (animatingPlayerIndex === i || animatingPlayerIndex === "ALL" || p.finished) ? 1 : 0
                                        }}
                                    />
                                ))}

                                {players.map((p, i) => (
                                    <g
                                        key={`avatar-${i}`}
                                        transform={`translate(${p.currentX}, ${p.currentY})`}
                                        style={{
                                            transition: 'none',
                                            display: (gameState === "PLAYING" || gameState === "FINISHED" || gameState === "READY") ? 'block' : 'none'
                                        }}
                                    >
                                        <circle r="2" fill={p.color} fillOpacity="0.4" className="animate-pulse" />
                                        <circle r="1" fill={p.color} stroke="white" strokeWidth="0.5" filter="url(#glow)" />

                                        {(animatingPlayerIndex === i || animatingPlayerIndex === "ALL") && !p.finished && (
                                            <g className="animate-spin-slow" style={{ transformOrigin: 'center' }}>
                                                <circle r="0.4" cx="2" cy="0" fill="white" opacity="0.8" />
                                                <circle r="0.3" cx="-2" cy="1" fill="white" opacity="0.6" />
                                            </g>
                                        )}

                                        {(animatingPlayerIndex === i || animatingPlayerIndex === "ALL") && !p.finished && (
                                            <text
                                                y="-3.5"
                                                textAnchor="middle"
                                                fill={p.color}
                                                fontSize="3"
                                                fontWeight="bold"
                                                style={{ textShadow: '0 0.2px 0.5px rgba(0,0,0,0.5)' }}
                                            >
                                                {p.name}
                                            </text>
                                        )}
                                    </g>
                                ))}
                            </svg>

                            <div className="absolute top-0 left-0 w-full h-[10%]">
                                {players.map((p, i) => (
                                    <div
                                        key={i}
                                        className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
                                        style={{ left: `${getColumnX(i, playerCount)}%` }}
                                    >
                                        <button
                                            onClick={() => startAnimation(i)}
                                            disabled={gameState === "PLAYING" || p.finished}
                                            className={`mb-2 px-3 py-1.5 rounded-lg text-sm font-bold border-2 transition-all hover:scale-110 active:scale-95 whitespace-nowrap
                                                ${p.finished
                                                    ? "bg-neutral-100 border-neutral-200 text-neutral-400 grayscale"
                                                    : "bg-white dark:bg-black"}`}
                                            style={{
                                                borderColor: p.color,
                                                color: p.finished ? undefined : p.color,
                                                boxShadow: p.finished ? 'none' : `0 4px 12px ${p.color}30`
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="absolute bottom-0 left-0 w-full h-[12%]">
                                {Array.from({ length: playerCount }).map((_, i) => {
                                    const winner = players.find(p => {
                                        if (!p.finished) return false;
                                        const endX = p.path[p.path.length - 1].x;
                                        const colX = getColumnX(i, playerCount);
                                        return Math.abs(endX - colX) < 1;
                                    });

                                    const isRevealed = revealedResults[i];

                                    return (
                                        <div
                                            key={i}
                                            className="absolute top-0 -translate-x-1/2 flex flex-col items-center justify-center w-16 h-12"
                                            style={{ left: `${getColumnX(i, playerCount)}%` }}
                                        >
                                            <AnimatePresence mode="wait">
                                                {!isRevealed ? (
                                                    <motion.div
                                                        key="hidden"
                                                        initial={{ scale: 1, rotateY: 0 }}
                                                        exit={{ scale: 0, rotateY: 90 }}
                                                        className="w-full h-full bg-neutral-200 dark:bg-zinc-800 rounded-xl flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform"
                                                        onClick={() => {
                                                            if (winner) {
                                                                setRevealedResults(prev => {
                                                                    const next = [...prev];
                                                                    next[i] = true;
                                                                    return next;
                                                                });
                                                                triggerConfetti();
                                                            }
                                                        }}
                                                    >
                                                        <HelpCircle className="w-5 h-5 text-neutral-400" />
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="revealed"
                                                        initial={{ scale: 0, rotateY: -90 }}
                                                        animate={{ scale: 1, rotateY: 0 }}
                                                        className="flex flex-col items-center pointer-events-none"
                                                    >
                                                        <div className="text-sm font-bold text-neutral-900 dark:text-white whitespace-nowrap px-3 py-1.5 rounded-lg bg-[#FEEBD0] dark:bg-[#8F4B10]/30 border border-[#FDD5A5] dark:border-[#F9954E]/30 shadow-sm">
                                                            {results[i]}
                                                        </div>
                                                        {winner && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                className="mt-1 text-xs text-[#F9954E] font-bold whitespace-nowrap"
                                                            >
                                                                {winner.name}
                                                            </motion.div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </main>
    );
}
