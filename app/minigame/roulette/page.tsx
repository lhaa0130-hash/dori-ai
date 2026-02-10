"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, RefreshCw, Play, Plus, Minus, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import confetti from "canvas-confetti";

// ---- Types ----
type GameState = "SETUP" | "READY" | "SPINNING" | "FINISHED";

interface RouletteItem {
    id: number;
    name: string;
    color: string;
}

// ---- Constants ----
const ITEM_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
    "#f43f5e", // rose
    "#ec4899", // pink
    "#14b8a6", // teal
];

const MIN_ITEMS = 2;
const MAX_ITEMS = 12;

export default function RoulettePage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [gameState, setGameState] = useState<GameState>("SETUP");

    // Setup State
    const [itemCount, setItemCount] = useState(4);
    const [items, setItems] = useState<RouletteItem[]>([
        { id: 0, name: "항목 1", color: ITEM_COLORS[0] },
        { id: 1, name: "항목 2", color: ITEM_COLORS[1] },
        { id: 2, name: "항목 3", color: ITEM_COLORS[2] },
        { id: 3, name: "항목 4", color: ITEM_COLORS[3] },
    ]);

    // Game State
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState<RouletteItem | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);

    // Animation Controls
    const boardControls = useAnimation();
    const animationRef = useRef<number>();

    useEffect(() => {
        setMounted(true);
    }, []);

    const triggerConfetti = () => {
        const count = 200;
        const defaults = { origin: { y: 0.7 } };

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
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
        });
    };

    // ---- Handlers ----
    const handleItemCountChange = (delta: number) => {
        const newCount = Math.max(MIN_ITEMS, Math.min(MAX_ITEMS, itemCount + delta));
        setItemCount(newCount);

        if (newCount > items.length) {
            const newItems = [...items];
            for (let i = items.length; i < newCount; i++) {
                newItems.push({
                    id: i,
                    name: `항목 ${i + 1}`,
                    color: ITEM_COLORS[i % ITEM_COLORS.length]
                });
            }
            setItems(newItems);
        } else if (newCount < items.length) {
            setItems(items.slice(0, newCount));
        }
    };

    const handleUpdateItemName = (idx: number, val: string) => {
        const newItems = [...items];
        newItems[idx].name = val;
        setItems(newItems);
    };

    const startGame = () => {
        setGameState("READY");
        setWinner(null);
    };

    const spinWheel = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setGameState("SPINNING");
        setWinner(null);

        // Random winner selection
        const winnerIndex = Math.floor(Math.random() * items.length);
        const segmentAngle = 360 / items.length;

        // Calculate target rotation
        // We want the pointer (at top) to point to the winner
        // Pointer is at 0 degrees (top), so we need to rotate the wheel
        // so that the center of the winner segment aligns with 0 degrees
        const targetSegmentCenter = winnerIndex * segmentAngle + segmentAngle / 2;

        // Add multiple full rotations for effect (5-7 full spins)
        const fullRotations = (5 + Math.random() * 2) * 360;
        const finalRotation = fullRotations + (360 - targetSegmentCenter);

        // Animation duration
        const duration = 4000;
        const startTime = performance.now();
        const startRotation = rotation;

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic for deceleration
            const eased = 1 - Math.pow(1 - progress, 3);

            const currentRotation = startRotation + finalRotation * eased;
            setRotation(currentRotation);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Finished spinning
                setIsSpinning(false);
                setWinner(items[winnerIndex]);
                setGameState("FINISHED");
                triggerShake();
                triggerConfetti();
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    const resetGame = () => {
        setGameState("SETUP");
        setRotation(0);
        setWinner(null);
        setIsSpinning(false);
    };

    // ---- SVG Wheel Rendering ----
    const renderWheel = () => {
        const segmentAngle = 360 / items.length;
        const radius = 45; // SVG viewBox percentage
        const centerX = 50;
        const centerY = 50;

        return items.map((item, index) => {
            const startAngle = index * segmentAngle - 90; // -90 to start from top
            const endAngle = startAngle + segmentAngle;

            // Convert to radians
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            // Calculate arc points
            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            // Large arc flag
            const largeArc = segmentAngle > 180 ? 1 : 0;

            // Path for the segment
            const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`
            ].join(' ');

            // Text position (middle of segment)
            const textAngle = startAngle + segmentAngle / 2;
            const textRad = (textAngle * Math.PI) / 180;
            const textRadius = radius * 0.7;
            const textX = centerX + textRadius * Math.cos(textRad);
            const textY = centerY + textRadius * Math.sin(textRad);

            return (
                <g key={item.id}>
                    <path
                        d={pathData}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="0.5"
                        opacity={winner && winner.id === item.id ? 1 : 0.9}
                    />
                    <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={items.length > 8 ? "2.5" : "3"}
                        fontWeight="bold"
                        style={{
                            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                            pointerEvents: 'none'
                        }}
                    >
                        {item.name}
                    </text>
                </g>
            );
        });
    };

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">룰렛</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
                {gameState === "SETUP" && (
                    <div className="animate-fade-in space-y-8">
                        {/* Setup Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold mb-2">룰렛 설정</h2>
                                <p className="text-neutral-500 dark:text-zinc-400">항목을 설정하고 행운을 시험해보세요.</p>
                            </div>

                            {/* Item Count Control */}
                            <div className="flex items-center justify-center gap-6 mb-10">
                                <button
                                    onClick={() => handleItemCountChange(-1)}
                                    className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <div className="text-center w-24">
                                    <span className="text-4xl font-bold text-orange-500">{itemCount}</span>
                                    <span className="text-sm text-neutral-400 block mt-1">항목</span>
                                </div>
                                <button
                                    onClick={() => handleItemCountChange(1)}
                                    className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Items Grid */}
                            <div className="grid gap-3 mb-10 max-h-96 overflow-y-auto">
                                {items.map((item, i) => (
                                    <div key={item.id} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <div
                                            className="w-6 h-6 rounded-full flex-shrink-0 shadow-md"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleUpdateItemName(i, e.target.value)}
                                            placeholder={`항목 ${i + 1}`}
                                            className="flex-1 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={startGame}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                시작하기
                            </button>
                        </div>
                    </div>
                )}

                {(gameState === "READY" || gameState === "SPINNING" || gameState === "FINISHED") && (
                    <div className="animate-fade-in">
                        {/* Game Board */}
                        <motion.div
                            animate={boardControls}
                            className="relative bg-white dark:bg-zinc-900 rounded-[2rem] p-8 md:p-12 shadow-xl border border-neutral-100 dark:border-zinc-800"
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

                            {/* Roulette Wheel */}
                            <div className="flex flex-col items-center gap-8">
                                {/* Pointer */}
                                <motion.div
                                    className="relative z-20"
                                    animate={isSpinning ? {
                                        y: [0, -5, 0],
                                        rotate: [0, -5, 5, 0]
                                    } : {}}
                                    transition={{
                                        duration: 0.3,
                                        repeat: isSpinning ? Infinity : 0,
                                        repeatType: "reverse"
                                    }}
                                >
                                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-orange-500 drop-shadow-lg" />
                                </motion.div>

                                {/* Wheel Container */}
                                <div className="relative w-full max-w-md aspect-square">
                                    <svg
                                        viewBox="0 0 100 100"
                                        className="w-full h-full"
                                        style={{
                                            transform: `rotate(${rotation}deg)`,
                                            transition: isSpinning ? 'none' : 'transform 0.5s ease-out'
                                        }}
                                    >
                                        <defs>
                                            <filter id="wheel-glow" x="-50%" y="-50%" width="200%" height="200%">
                                                <feGaussianBlur stdDeviation="2" result="blur" />
                                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                            </filter>
                                        </defs>

                                        {/* Wheel segments */}
                                        <g filter="url(#wheel-glow)">
                                            {renderWheel()}
                                        </g>

                                        {/* Center circle */}
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="8"
                                            fill="white"
                                            stroke={isDark ? "#333" : "#e5e5e5"}
                                            strokeWidth="1"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="4"
                                            fill="#f97316"
                                        />
                                    </svg>
                                </div>

                                {/* Spin Button */}
                                {gameState === "READY" && (
                                    <motion.button
                                        onClick={spinWheel}
                                        disabled={isSpinning}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="px-12 py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-full font-bold text-xl shadow-2xl hover:shadow-orange-500/50 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Sparkles className="w-6 h-6" />
                                        SPIN!
                                        <Sparkles className="w-6 h-6" />
                                    </motion.button>
                                )}

                                {/* Winner Display */}
                                <AnimatePresence>
                                    {winner && gameState === "FINISHED" && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="mt-4 p-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-2xl text-center"
                                        >
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <Trophy className="w-6 h-6 text-white" />
                                                <h3 className="text-2xl font-bold text-white">당첨!</h3>
                                                <Trophy className="w-6 h-6 text-white" />
                                            </div>
                                            <p className="text-3xl font-bold text-white">{winner.name}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Spin Again Button */}
                                {gameState === "FINISHED" && (
                                    <motion.button
                                        onClick={() => {
                                            setGameState("READY");
                                            setWinner(null);
                                        }}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="px-8 py-3 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white rounded-full font-bold transition-all"
                                    >
                                        다시 돌리기
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </main>
    );
}
