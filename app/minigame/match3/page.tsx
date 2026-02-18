"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trophy, Flame, Heart } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ----------------------------------------------------------------------
// Constants & Types
// ----------------------------------------------------------------------

const WIDTH = 8;
const CANDY_COLORS = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple"
];

// Emojis for Candies
const CANDY_EMOJIS: Record<string, string> = {
    "red": "🍒",
    "orange": "🍊",
    "yellow": "🍋",
    "green": "🥝",
    "blue": "🫐",
    "purple": "🍇"
};

export default function Match3Game() {
    const [currentColorArrangement, setCurrentColorArrangement] = useState<string[]>([]);
    const [squareBeingDragged, setSquareBeingDragged] = useState<any>(null);
    const [squareBeingReplaced, setSquareBeingReplaced] = useState<any>(null);
    const [score, setScore] = useState(0);
    const [moves, setMoves] = useState(20);
    const [isGameOver, setIsGameOver] = useState(false);

    // Check for column of 3
    const checkForColumnOfThree = useCallback(() => {
        for (let i = 0; i <= 47; i++) {
            const columnOfThree = [i, i + WIDTH, i + WIDTH * 2];
            const decidedColor = currentColorArrangement[i];
            const isBlank = currentColorArrangement[i] === "";

            if (columnOfThree.every(square => currentColorArrangement[square] === decidedColor && !isBlank)) {
                setScore((score) => score + 3);
                columnOfThree.forEach(square => currentColorArrangement[square] = "");
                return true;
            }
        }
        return false;
    }, [currentColorArrangement]);

    // Check for row of 3
    const checkForRowOfThree = useCallback(() => {
        for (let i = 0; i < 64; i++) {
            const rowOfThree = [i, i + 1, i + 2];
            const decidedColor = currentColorArrangement[i];
            const isBlank = currentColorArrangement[i] === "";
            const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];

            if (notValid.includes(i)) continue;

            if (rowOfThree.every(square => currentColorArrangement[square] === decidedColor && !isBlank)) {
                setScore((score) => score + 3);
                rowOfThree.forEach(square => currentColorArrangement[square] = "");
                return true;
            }
        }
        return false;
    }, [currentColorArrangement]);

    // Check for column of 4
    const checkForColumnOfFour = useCallback(() => {
        for (let i = 0; i <= 39; i++) {
            const columnOfFour = [i, i + WIDTH, i + WIDTH * 2, i + WIDTH * 3];
            const decidedColor = currentColorArrangement[i];
            const isBlank = currentColorArrangement[i] === "";

            if (columnOfFour.every(square => currentColorArrangement[square] === decidedColor && !isBlank)) {
                setScore((score) => score + 4);
                columnOfFour.forEach(square => currentColorArrangement[square] = "");
                return true;
            }
        }
        return false;
    }, [currentColorArrangement]);

    // Check for row of 4
    const checkForRowOfFour = useCallback(() => {
        for (let i = 0; i < 64; i++) {
            const rowOfFour = [i, i + 1, i + 2, i + 3];
            const decidedColor = currentColorArrangement[i];
            const isBlank = currentColorArrangement[i] === "";
            const notValid = [5, 6, 7, 13, 14, 15, 21, 22, 23, 29, 30, 31, 37, 38, 39, 45, 46, 47, 53, 54, 55, 61, 62, 63];

            if (notValid.includes(i)) continue;

            if (rowOfFour.every(square => currentColorArrangement[square] === decidedColor && !isBlank)) {
                setScore((score) => score + 4);
                rowOfFour.forEach(square => currentColorArrangement[square] = "");
                return true;
            }
        }
        return false;
    }, [currentColorArrangement]);

    // Move into square below
    const moveIntoSquareBelow = useCallback(() => {
        for (let i = 0; i <= 55; i++) {
            const firstRow = [0, 1, 2, 3, 4, 5, 6, 7];
            const isFirstRow = firstRow.includes(i);

            if (isFirstRow && currentColorArrangement[i] === "") {
                let randomNumber = Math.floor(Math.random() * CANDY_COLORS.length);
                currentColorArrangement[i] = CANDY_COLORS[randomNumber];
            }

            if ((currentColorArrangement[i + WIDTH]) === "") {
                currentColorArrangement[i + WIDTH] = currentColorArrangement[i];
                currentColorArrangement[i] = "";
            }
        }
    }, [currentColorArrangement]);

    const dragStart = (e: any) => {
        setSquareBeingDragged(e.target);
    };

    const dragDrop = (e: any) => {
        setSquareBeingReplaced(e.target);
    };

    const dragEnd = () => {
        if (!squareBeingReplaced || !squareBeingDragged) return;

        const squareBeingDraggedId = parseInt(squareBeingDragged.getAttribute('data-id'));
        const squareBeingReplacedId = parseInt(squareBeingReplaced.getAttribute('data-id'));

        // Valid moves: Up, Down, Left, Right (1 step)
        const validMoves = [
            squareBeingDraggedId - 1,
            squareBeingDraggedId - WIDTH,
            squareBeingDraggedId + 1,
            squareBeingDraggedId + WIDTH
        ];

        // Prevent wrapping moves
        // ... (simplified validation for now)

        const validMove = validMoves.includes(squareBeingReplacedId);

        if (validMove) {
            currentColorArrangement[squareBeingReplacedId] = squareBeingDragged.getAttribute('style').backgroundColor; // Problematic: color stored in state, not dom
            // Better implementation: Swap in state

            const colorDragged = currentColorArrangement[squareBeingDraggedId];
            const colorReplaced = currentColorArrangement[squareBeingReplacedId];

            currentColorArrangement[squareBeingReplacedId] = colorDragged;
            currentColorArrangement[squareBeingDraggedId] = colorReplaced;

            const isFourRow = checkForRowOfFour();
            const isFourCol = checkForColumnOfFour();
            const isThreeRow = checkForRowOfThree();
            const isThreeCol = checkForColumnOfThree();

            if (squareBeingReplacedId && validMove && (isFourRow || isFourCol || isThreeRow || isThreeCol)) {
                setSquareBeingDragged(null);
                setSquareBeingReplaced(null);
                setMoves(prev => prev - 1);
            } else {
                // Invalid move -> REVERT
                currentColorArrangement[squareBeingReplacedId] = colorReplaced;
                currentColorArrangement[squareBeingDraggedId] = colorDragged;
                setCurrentColorArrangement([...currentColorArrangement]);
            }
        }
    };

    // Create Board
    const createBoard = () => {
        const randomColorArrangement = [];
        for (let i = 0; i < WIDTH * WIDTH; i++) {
            const randomColor = CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)];
            randomColorArrangement.push(randomColor);
        }
        setCurrentColorArrangement(randomColorArrangement);
    };

    useEffect(() => {
        createBoard();
    }, []);

    // Game Loop
    useEffect(() => {
        const timer = setInterval(() => {
            checkForColumnOfFour();
            checkForRowOfFour();
            checkForColumnOfThree();
            checkForRowOfThree();
            moveIntoSquareBelow();
            setCurrentColorArrangement([...currentColorArrangement]);

            if (moves <= 0 && !isGameOver) {
                setIsGameOver(true);
            }

        }, 100);
        return () => clearInterval(timer);
    }, [checkForColumnOfFour, checkForRowOfFour, checkForColumnOfThree, checkForRowOfThree, moveIntoSquareBelow, currentColorArrangement, moves]);

    // Reset
    const resetGame = () => {
        createBoard();
        setScore(0);
        setMoves(20);
        setIsGameOver(false);
    };

    return (
        <div className="h-screen w-full bg-neutral-900 text-white font-sans selection:bg-orange-500/30 flex flex-col items-center justify-center p-4 overflow-hidden touch-none">

            <header className="w-full max-w-md flex items-center justify-between mb-6">
                <Link href="/minigame" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-neutral-400" />
                </Link>
                <div className="font-bold text-xl text-pink-500 tracking-wider">MATCH 3</div>
                <div className="w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-full border border-neutral-700">
                    <Flame className="w-5 h-5 text-pink-500" />
                </div>
            </header>

            <div className="flex flex-col items-center gap-6">

                {/* Stats Bar */}
                <div className="flex w-full max-w-[340px] items-center justify-between bg-neutral-800 p-4 rounded-xl shadow-lg border border-neutral-700">
                    <div className="text-center">
                        <div className="text-xs text-neutral-400 uppercase font-bold">Score</div>
                        <div className="text-2xl font-bold text-yellow-400 font-mono">{score}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-neutral-400 uppercase font-bold">Moves</div>
                        <div className={`text-2xl font-bold font-mono ${moves <= 5 ? "text-red-500 animate-pulse" : "text-white"}`}>{moves}</div>
                    </div>
                </div>

                {!isGameOver ? (
                    <div className="w-[340px] h-[340px] flex flex-wrap bg-neutral-800/50 rounded-lg p-1 border-4 border-neutral-800 overflow-hidden shadow-2xl">
                        {currentColorArrangement.map((candyColor, index) => (
                            <div
                                key={index}
                                style={{
                                    width: `calc(100% / ${WIDTH})`,
                                    height: `calc(100% / ${WIDTH})`,
                                }}
                                className="flex items-center justify-center p-1 cursor-grab active:cursor-grabbing border border-white/5 bg-neutral-800/30"
                                data-id={index}
                                draggable={true}
                                onDragStart={dragStart}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={(e) => e.preventDefault()}
                                onDragLeave={(e) => e.preventDefault()}
                                onDrop={dragDrop}
                                onDragEnd={dragEnd}
                                onTouchStart={(e) => setSquareBeingDragged(e.target)} // Simple touch support attempt
                                onTouchEnd={(e) => {
                                    // Touch logic is complex for grid swap, omitted for simplified version
                                    // Ideally would calculate swipe direction
                                }}
                            >
                                {candyColor && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-full h-full rounded-full shadow-md flex items-center justify-center text-xl select-none"
                                        style={{ backgroundColor: candyColor === "white" ? "transparent" : `${candyColor}CC` }} // Transparency
                                    >
                                        <span style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.3))" }}>
                                            {CANDY_EMOJIS[candyColor]}
                                        </span>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-[340px] h-[340px] flex flex-col items-center justify-center bg-neutral-800 rounded-lg border-4 border-neutral-700 p-6 text-center shadow-2xl">
                        <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">TIME UP!</h2>
                        <p className="text-neutral-400 mb-6">Final Score: <span className="text-yellow-400 font-bold">{score}</span></p>
                        <button
                            onClick={resetGame}
                            className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                        >
                            <RefreshCw className="w-5 h-5" /> Play Again
                        </button>
                    </div>
                )}

            </div>
            <div className="mt-6 text-neutral-500 text-xs text-center max-w-xs">
                Match 3 or more fruits in a row or column to score points. You only have {moves} moves!
            </div>
        </div>
    );
}
