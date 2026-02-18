"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, Trophy, ImageIcon, HelpCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

            setTiles(newTiles);
            setMoves(prev => prev + 1);
            checkWin(newTiles);
        }
    };

    const checkWin = (currentTiles: Tile[]) => {
        const isWin = currentTiles.every(t => t.currentPos === t.correctPos);
        if (isWin) {
            setIsSolved(true);
            setIsPlaying(false);
        }
    };

    return (
        <div className="h-screen w-full bg-neutral-900 text-white font-sans selection:bg-orange-500/30 flex flex-col items-center justify-center p-4 overflow-hidden touch-none">

            {/* Header */}
            <header className="w-full max-w-md flex items-center justify-between mb-6">
                <Link href="/minigame" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-neutral-400" />
                </Link>
                <div className="font-bold text-xl text-orange-500 tracking-wider">PUZZLE</div>
                <div className="w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-full border border-neutral-700">
                    <ImageIcon className="w-5 h-5 text-orange-500" />
                </div>
            </header>

            <div className="flex flex-col items-center gap-6">

                {/* Stats */}
                <div className="flex gap-4 mb-2">
                    <div className="bg-neutral-800 px-4 py-2 rounded-full border border-neutral-700 font-mono text-sm">
                        Moves: <span className="text-yellow-500 font-bold ml-1">{moves}</span>
                    </div>
                    <button
                        onClick={() => setShowNumbers(!showNumbers)}
                        className={`bg-neutral-800 px-3 py-2 rounded-full border border-neutral-700 hover:bg-neutral-700 transition-colors ${showNumbers ? "text-orange-400 border-orange-400/50" : "text-neutral-400"}`}
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </div>

                {/* Board */}
                <div
                    className="relative bg-neutral-800 p-2 rounded-2xl border-4 border-neutral-700 shadow-2xl"
                    style={{ width: "340px", height: "340px" }}
                >
                    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
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
                                    onClick={() => handleTileClick(tile)}
                                >
                                    <div className="w-full h-full p-0.5">
                                        <div
                                            className="w-full h-full rounded-md shadow-sm relative overflow-hidden bg-neutral-700 border border-white/10"
                                            style={{
                                                backgroundImage: `url(${DEFAULT_IMAGE})`,
                                                backgroundSize: "400% 400%", // based on 4x4
                                                backgroundPosition: `${bgX}% ${bgY}%`
                                            }}
                                        >
                                            {showNumbers && (
                                                <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
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
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-center"
                            >
                                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 drop-shadow-lg" />
                                <h2 className="text-3xl font-bold text-white mb-2">SOLVED!</h2>
                                <p className="text-neutral-300 mb-6 font-mono">Moves: {moves}</p>

                                <button
                                    onClick={initGame}
                                    className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 mx-auto"
                                >
                                    <RefreshCw className="w-5 h-5" /> Play Again
                                </button>
                            </motion.div>
                        </div>
                    )}
                </div>

                <button
                    onClick={initGame}
                    className="text-neutral-500 text-sm hover:text-white flex items-center gap-2 mt-4"
                >
                    <RefreshCw className="w-4 h-4" /> Restart Puzzle
                </button>

            </div>
        </div>
    );
}
