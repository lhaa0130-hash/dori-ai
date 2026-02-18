"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, ArrowUp, ArrowDown, Coins, Trophy, Equal } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];

interface Card { rank: string; suit: string; value: number; }

const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (let i = 0; i < RANKS.length; i++) {
            deck.push({ suit, rank: RANKS[i], value: i + 1 });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const isRed = (suit: string) => suit === "♥" || suit === "♦";

export default function HighLowPage() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [coins, setCoins] = useState(1000);
    const [bet, setBet] = useState(50);
    const [deck, setDeck] = useState<Card[]>([]);
    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [nextCard, setNextCard] = useState<Card | null>(null);
    const [showNext, setShowNext] = useState(false);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [message, setMessage] = useState("");
    const [gameActive, setGameActive] = useState(false);
    const [totalGames, setTotalGames] = useState(0);
    const [totalWins, setTotalWins] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    const startGame = () => {
        if (coins < bet) return;
        setCoins(prev => prev - bet);
        const newDeck = createDeck();
        const card = newDeck.pop()!;
        setDeck(newDeck);
        setCurrentCard(card);
        setNextCard(null);
        setShowNext(false);
        setStreak(0);
        setMessage("");
        setGameActive(true);
        setTotalGames(prev => prev + 1);
    };

    const guess = (direction: "high" | "low" | "same") => {
        if (!gameActive || !currentCard || deck.length === 0) return;
        const next = deck.pop()!;
        setNextCard(next);
        setShowNext(true);
        setDeck([...deck]);

        let correct = false;
        if (direction === "high") correct = next.value > currentCard.value;
        else if (direction === "low") correct = next.value < currentCard.value;
        else correct = next.value === currentCard.value;

        setTimeout(() => {
            if (correct) {
                const multiplier = direction === "same" ? 5 : 1;
                const newStreak = streak + 1;
                setStreak(newStreak);
                if (newStreak > bestStreak) setBestStreak(newStreak);
                setTotalWins(prev => prev + 1);

                // 연속 정답 보너스
                const bonus = Math.floor(bet * (0.5 + newStreak * 0.5) * multiplier);
                setCoins(prev => prev + bonus);
                setMessage(`정답! +${bonus} 코인 🎉 (${newStreak}연속)`);

                if (newStreak >= 3) confetti({ particleCount: 50 + newStreak * 20, spread: 60, origin: { y: 0.6 } });

                // 다음 카드로
                setCurrentCard(next);
                setNextCard(null);
                setShowNext(false);

                if (deck.length === 0) {
                    setMessage("덱 소진! 대단해요! 🏆");
                    setGameActive(false);
                }
            } else {
                setMessage(`틀렸습니다! 연속 ${streak}회에서 종료 😢`);
                setGameActive(false);
                setStreak(0);
            }
        }, 800);
    };

    const isDark = mounted && theme === "dark";

    const CardDisplay = ({ card, hidden }: { card: Card | null; hidden?: boolean }) => (
        <div className={`w-28 h-40 md:w-36 md:h-48 rounded-2xl shadow-2xl flex flex-col items-center justify-center font-bold transition-all duration-300 ${hidden || !card
                ? "bg-gradient-to-br from-indigo-600 to-purple-800 border-2 border-indigo-400"
                : "bg-white dark:bg-zinc-100 border-2 border-neutral-200"
            }`}>
            {hidden || !card ? (
                <span className="text-4xl">?</span>
            ) : (
                <>
                    <span className={`text-sm ${isRed(card.suit) ? "text-red-500" : "text-neutral-800"}`}>{card.rank}</span>
                    <span className={`text-5xl my-1 ${isRed(card.suit) ? "text-red-500" : "text-neutral-800"}`}>{card.suit}</span>
                    <span className={`text-sm ${isRed(card.suit) ? "text-red-500" : "text-neutral-800"}`}>{card.rank}</span>
                </>
            )}
        </div>
    );

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">🔮 하이로우</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-lg mx-auto">
                <div className="animate-fade-in">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-2xl font-bold text-yellow-500">{coins.toLocaleString()}</span>
                        <span className="text-sm text-neutral-500">코인</span>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {/* 연속 정답 */}
                        {gameActive && (
                            <div className="text-center mb-4">
                                <span className="text-sm font-bold text-[#F9954E]">{streak}연속 정답 🔥</span>
                            </div>
                        )}

                        {/* 카드 영역 */}
                        <div className="flex items-center justify-center gap-6 mb-6 py-8">
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 mb-2 font-bold">현재 카드</p>
                                <CardDisplay card={currentCard} />
                            </div>
                            <div className="text-3xl text-neutral-300">→</div>
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 mb-2 font-bold">다음 카드</p>
                                <AnimatePresence mode="wait">
                                    {showNext && nextCard ? (
                                        <motion.div key="show" initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
                                            <CardDisplay card={nextCard} />
                                        </motion.div>
                                    ) : (
                                        <CardDisplay card={null} hidden />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* 결과 */}
                        <AnimatePresence>
                            {message && (
                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                    className={`text-center p-4 rounded-2xl mb-6 font-bold ${message.includes("정답") ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                    {message}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 버튼 */}
                        {!gameActive ? (
                            <>
                                <div className="flex gap-2 mb-4">
                                    {[10, 50, 100, 200].map(a => (
                                        <button key={a} onClick={() => setBet(Math.min(a, coins))} disabled={coins < a}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${bet === a ? "bg-yellow-500 text-white" : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 disabled:opacity-30"}`}>
                                            {a}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={startGame} disabled={coins < bet}
                                    className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20 hover:from-purple-600 hover:to-indigo-700 active:scale-[0.98] transition-all disabled:opacity-30">
                                    🔮 게임 시작 (배팅: {bet})
                                </button>
                                {coins < 10 && (
                                    <button onClick={() => { setCoins(1000); setTotalGames(0); setTotalWins(0); }}
                                        className="w-full mt-3 py-3 rounded-2xl bg-neutral-100 dark:bg-zinc-800 text-sm font-bold flex items-center justify-center gap-2">
                                        <RotateCcw className="w-4 h-4" /> 1,000 코인으로 다시 시작
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-center text-sm font-bold text-neutral-500 mb-2">다음 카드는?</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <button onClick={() => guess("high")}
                                        className="py-4 rounded-2xl font-bold bg-gradient-to-b from-red-500 to-red-600 text-white shadow-lg shadow-red-500/20 hover:from-red-600 hover:to-red-700 active:scale-[0.98] transition-all flex flex-col items-center gap-1">
                                        <ArrowUp className="w-5 h-5" /> 높다
                                    </button>
                                    <button onClick={() => guess("same")}
                                        className="py-4 rounded-2xl font-bold bg-gradient-to-b from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/20 hover:from-yellow-600 hover:to-yellow-700 active:scale-[0.98] transition-all flex flex-col items-center gap-1">
                                        <Equal className="w-5 h-5" /> 같다 (×5)
                                    </button>
                                    <button onClick={() => guess("low")}
                                        className="py-4 rounded-2xl font-bold bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] transition-all flex flex-col items-center gap-1">
                                        <ArrowDown className="w-5 h-5" /> 낮다
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-[#F9954E]">{totalGames}</div>
                            <div className="text-xs text-neutral-500">게임</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-green-500">{totalWins}</div>
                            <div className="text-xs text-neutral-500">정답</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-purple-500">{bestStreak}</div>
                            <div className="text-xs text-neutral-500">최고 연속</div>
                        </div>
                    </div>
                    <p className="text-[10px] text-center text-neutral-400 mt-6">※ 가상 코인 게임이며, 실제 금전 거래와 무관합니다.</p>
                </div>
            </div>
        </main>
    );
}
