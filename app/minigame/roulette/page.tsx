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
    "#F9954E", // orange
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
        <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />

            {/* Header */}
            <header className="relative z-10 max-w-4xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
                <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    미니게임
                </Link>
                <h1 className="text-[15px] font-extrabold tracking-tight text-white">🎯 룰렛</h1>
                <div className="rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-neutral-500">ITEMS</div>
                    <div className="text-sm font-bold text-white tabular-nums">{items.length}</div>
                </div>
            </header>

            <div className="relative z-10 pt-2 sm:pt-4 pb-8 sm:pb-12 px-4 max-w-4xl mx-auto">
                {gameState === "SETUP" && (
                    <div className="animate-fade-in space-y-8">
                        {/* Setup Card */}
                        <div className="rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 p-6 sm:p-8">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-extrabold tracking-tight mb-2">룰렛 설정</h2>
                                <p className="text-neutral-400">항목을 정하고 행운을 시험해보세요.</p>
                            </div>

                            {/* Item Count Control */}
                            <div className="flex items-center justify-center gap-6 mb-10">
                                <button
                                    onClick={() => handleItemCountChange(-1)}
                                    className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                                >
                                    <Minus className="w-5 h-5" />
                                </button>
                                <div className="text-center w-24">
                                    <span className="text-4xl font-extrabold tracking-tight text-[#F9954E] tabular-nums">{itemCount}</span>
                                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 block mt-1">항목 수</span>
                                </div>
                                <button
                                    onClick={() => handleItemCountChange(1)}
                                    className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Items Grid */}
                            <div className="grid gap-3 mb-10 max-h-96 overflow-y-auto">
                                {items.map((item, i) => (
                                    <div key={item.id} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <div
                                            className="w-6 h-6 rounded-full flex-shrink-0 ring-1 ring-white/20"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleUpdateItemName(i, e.target.value)}
                                            placeholder={`항목 ${i + 1}`}
                                            className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#F9954E]/60 transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={startGame}
                                className="w-full py-4 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold text-lg shadow-lg shadow-[#F9954E]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
                            className="relative bg-white/[0.04] rounded-[2rem] p-8 md:p-12 shadow-xl border border-white/10"
                        >
                            {/* Controls */}
                            <div className="absolute top-6 right-6 z-10 flex gap-2">
                                <button
                                    onClick={resetGame}
                                    className="p-2 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] transition-colors text-neutral-200"
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
                                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-[#F9954E] drop-shadow-lg" />
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
                                            fill="#F9954E"
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
                                        className="px-12 py-4 bg-[#F9954E] hover:bg-[#E8832E] active:scale-95 text-white rounded-full font-bold text-xl shadow-2xl hover:shadow-[#F9954E]/50 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            className="mt-4 p-6 bg-gradient-to-br from-[#FBAA60] to-[#E8832E] rounded-2xl shadow-2xl text-center"
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
                                        className="px-8 py-3 bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] text-neutral-200 rounded-full font-bold transition-all"
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
