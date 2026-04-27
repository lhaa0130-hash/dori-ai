"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, Coins, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays } from "@/lib/cottonCandy";

type BetType = "플레이어" | "뱅커" | "타이";

interface Card { rank: string; suit: string; value: number; }

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (let d = 0; d < 6; d++) { // 6덱
        for (const suit of SUITS) {
            for (let i = 0; i < RANKS.length; i++) {
                const value = i >= 10 ? 0 : i === 0 ? 1 : i + 1;
                deck.push({ suit, rank: RANKS[i], value });
            }
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const handTotal = (cards: Card[]): number => {
    return cards.reduce((sum, c) => sum + c.value, 0) % 10;
};

const isRed = (suit: string) => suit === "♥" || suit === "♦";

const shouldPlayerDraw = (playerTotal: number): boolean => playerTotal <= 5;

const shouldBankerDraw = (bankerTotal: number, playerThird: Card | null): boolean => {
    if (!playerThird) return bankerTotal <= 5;
    const p3 = playerThird.value;
    if (bankerTotal <= 2) return true;
    if (bankerTotal === 3) return p3 !== 8;
    if (bankerTotal === 4) return p3 >= 2 && p3 <= 7;
    if (bankerTotal === 5) return p3 >= 4 && p3 <= 7;
    if (bankerTotal === 6) return p3 === 6 || p3 === 7;
    return false;
};

export default function BaccaratPage() {
    const { session } = useAuth();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [coins, setCoins] = useState(1000);
    const [bet, setBet] = useState(50);
    const [betType, setBetType] = useState<BetType>("플레이어");
    const [playerCards, setPlayerCards] = useState<Card[]>([]);
    const [bankerCards, setBankerCards] = useState<Card[]>([]);
    const [gameState, setGameState] = useState<"BETTING" | "DEALING" | "FINISHED">("BETTING");
    const [result, setResult] = useState("");
    const [totalGames, setTotalGames] = useState(0);
    const [totalWins, setTotalWins] = useState(0);
    const [history, setHistory] = useState<{ winner: string; pTotal: number; bTotal: number }[]>([]);

    useEffect(() => { setMounted(true); }, []);

    const deal = () => {
        if (coins < bet) return;
        setCoins(prev => prev - bet);
        setTotalGames(prev => prev + 1);
        setGameState("DEALING");
        setResult("");

        const deck = createDeck();
        const pCards = [deck.pop()!, deck.pop()!];
        const bCards = [deck.pop()!, deck.pop()!];

        setPlayerCards(pCards);
        setBankerCards(bCards);

        setTimeout(() => {
            let pTotal = handTotal(pCards);
            let bTotal = handTotal(bCards);
            let playerThird: Card | null = null;

            // 내추럴 체크 (8 또는 9)
            if (pTotal >= 8 || bTotal >= 8) {
                // 내추럴 - 추가 드로우 없음
            } else {
                // 플레이어 3번째 카드
                if (shouldPlayerDraw(pTotal)) {
                    playerThird = deck.pop()!;
                    pCards.push(playerThird);
                    pTotal = handTotal(pCards);
                    setPlayerCards([...pCards]);
                }

                // 뱅커 3번째 카드
                setTimeout(() => {
                    if (shouldBankerDraw(bTotal, playerThird)) {
                        bCards.push(deck.pop()!);
                        bTotal = handTotal(bCards);
                        setBankerCards([...bCards]);
                    }

                    finishGame(pTotal, handTotal(bCards));
                }, 600);
                return;
            }

            finishGame(pTotal, bTotal);
        }, 800);
    };

    const finishGame = (pTotal: number, bTotal: number) => {
        setTimeout(() => {
            let winner: string;
            let winAmount = 0;

            if (pTotal > bTotal) {
                winner = "플레이어";
                if (betType === "플레이어") { winAmount = bet * 2; setTotalWins(prev => prev + 1); }
            } else if (bTotal > pTotal) {
                winner = "뱅커";
                if (betType === "뱅커") { winAmount = Math.floor(bet * 1.95); setTotalWins(prev => prev + 1); } // 5% 커미션
            } else {
                winner = "타이";
                if (betType === "타이") { winAmount = bet * 9; setTotalWins(prev => prev + 1); }
                else { winAmount = bet; } // 타이 시 배팅금 반환
            }

            setCoins(prev => prev + winAmount);
            setHistory(prev => [{ winner, pTotal, bTotal }, ...prev].slice(0, 15));

            const isWin = (betType === winner) || (winner === "타이" && betType !== "타이");
            if (betType === winner) {
                setResult(`${winner} 승! ${betType === "타이" ? "×9 " : ""}당첨! 🎉 (+${winAmount - bet})`);
                if (betType === "타이") confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
                else confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
                if (session?.user?.email) {
                    addCottonCandy(session.user.email, 20, "바카라 베팅 승리");
                    incrementMinigamePlays(session.user.email);
                }
            } else if (winner === "타이" && betType !== "타이") {
                setResult(`타이! 배팅금 반환 🤝`);
            } else {
                setResult(`${winner} 승. 아쉽네요... 😢`);
            }

            setGameState("FINISHED");
        }, 400);
    };

    const CardComponent = ({ card, delay = 0 }: { card: Card; delay?: number }) => (
        <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: delay * 0.2, type: "spring", stiffness: 200 }}
            className="w-14 h-20 md:w-16 md:h-24 rounded-xl bg-white dark:bg-zinc-100 border-2 border-neutral-200 shadow-lg flex flex-col items-center justify-center font-bold"
        >
            <span className={`text-[10px] ${isRed(card.suit) ? "text-red-500" : "text-neutral-800"}`}>{card.rank}</span>
            <span className={`text-xl ${isRed(card.suit) ? "text-red-500" : "text-neutral-800"}`}>{card.suit}</span>
        </motion.div>
    );

    const isDark = mounted && theme === "dark";

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">🃏 바카라</h1>
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

                        {/* 게임 테이블 */}
                        <div className="bg-gradient-to-b from-emerald-700 to-emerald-900 rounded-2xl p-5 mb-6 min-h-[240px]">
                            {/* 뱅커 */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-emerald-200">뱅커 (BANKER)</span>
                                    {bankerCards.length > 0 && (
                                        <span className="text-xs font-bold text-white bg-black/30 px-2 py-0.5 rounded-full">{handTotal(bankerCards)}</span>
                                    )}
                                </div>
                                <div className="flex gap-2 min-h-[80px]">
                                    {bankerCards.map((c, i) => <CardComponent key={i} card={c} delay={i + 2} />)}
                                    {bankerCards.length === 0 && <div className="w-14 h-20 rounded-xl border-2 border-dashed border-emerald-500/30" />}
                                </div>
                            </div>

                            <div className="border-t border-dashed border-emerald-500/30 my-3" />

                            {/* 플레이어 */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-emerald-200">플레이어 (PLAYER)</span>
                                    {playerCards.length > 0 && (
                                        <span className="text-xs font-bold text-white bg-black/30 px-2 py-0.5 rounded-full">{handTotal(playerCards)}</span>
                                    )}
                                </div>
                                <div className="flex gap-2 min-h-[80px]">
                                    {playerCards.map((c, i) => <CardComponent key={i} card={c} delay={i} />)}
                                    {playerCards.length === 0 && <div className="w-14 h-20 rounded-xl border-2 border-dashed border-emerald-500/30" />}
                                </div>
                            </div>
                        </div>

                        {/* 결과 */}
                        <AnimatePresence>
                            {result && (
                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                    className={`text-center p-4 rounded-2xl mb-6 font-bold ${result.includes("당첨") ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                                            : result.includes("반환") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                                        }`}>
                                    {result}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 배팅 */}
                        {(gameState === "BETTING" || gameState === "FINISHED") && (
                            <>
                                {gameState === "BETTING" && (
                                    <>
                                        <p className="text-center text-sm font-bold text-neutral-500 mb-3">어디에 배팅하시겠습니까?</p>
                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            {(["플레이어", "뱅커", "타이"] as BetType[]).map(type => (
                                                <button key={type} onClick={() => setBetType(type)}
                                                    className={`p-4 rounded-2xl border-2 transition-all text-center ${betType === type
                                                            ? type === "플레이어" ? "border-blue-500 bg-blue-500/10 text-blue-600" :
                                                                type === "뱅커" ? "border-red-500 bg-red-500/10 text-red-600" :
                                                                    "border-green-500 bg-green-500/10 text-green-600"
                                                            : "border-neutral-200 dark:border-zinc-700"
                                                        }`}>
                                                    <div className="text-lg font-bold">{type === "플레이어" ? "👤" : type === "뱅커" ? "🏦" : "🤝"}</div>
                                                    <div className="text-xs font-bold mt-1">{type}</div>
                                                    <div className="text-[10px] text-neutral-400 mt-0.5">
                                                        {type === "플레이어" ? "×2" : type === "뱅커" ? "×1.95" : "×9"}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between mb-4 p-3 bg-neutral-50 dark:bg-zinc-800 rounded-xl">
                                            <span className="text-xs font-bold text-neutral-500">배팅</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setBet(prev => Math.max(10, prev - 10))} className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center disabled:opacity-30" disabled={bet <= 10}>
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="text-lg font-bold text-yellow-500 w-14 text-center">{bet}</span>
                                                <button onClick={() => setBet(prev => Math.min(prev + 10, coins))} className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center disabled:opacity-30" disabled={bet >= coins}>
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <button onClick={() => { if (gameState === "FINISHED") { setPlayerCards([]); setBankerCards([]); setResult(""); setGameState("BETTING"); } else { deal(); } }}
                                    disabled={gameState === "BETTING" && coins < bet}
                                    className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-30">
                                    {gameState === "FINISHED" ? "🃏 다음 게임" : "🃏 딜!"}
                                </button>
                                {coins < 10 && gameState !== "DEALING" && (
                                    <button onClick={() => { setCoins(1000); setTotalGames(0); setTotalWins(0); setBet(50); setGameState("BETTING"); setPlayerCards([]); setBankerCards([]); setResult(""); setHistory([]); }}
                                        className="w-full mt-3 py-3 rounded-2xl bg-neutral-100 dark:bg-zinc-800 text-sm font-bold flex items-center justify-center gap-2">
                                        <RotateCcw className="w-4 h-4" /> 1,000 코인으로 다시 시작
                                    </button>
                                )}
                            </>
                        )}
                        {gameState === "DEALING" && (
                            <div className="text-center py-4 text-neutral-500 animate-pulse font-bold">카드를 배분하고 있습니다...</div>
                        )}
                    </div>

                    {/* 히스토리 */}
                    {history.length > 0 && (
                        <div className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-neutral-100 dark:border-white/5">
                            <h3 className="font-bold text-sm mb-3">최근 기록</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {history.map((h, i) => (
                                    <span key={i} className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center ${h.winner === "플레이어" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600" :
                                            h.winner === "뱅커" ? "bg-red-100 dark:bg-red-500/20 text-red-600" :
                                                "bg-green-100 dark:bg-green-500/20 text-green-600"
                                        }`}>
                                        {h.winner === "플레이어" ? "P" : h.winner === "뱅커" ? "B" : "T"}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-[#F9954E]">{totalGames}</div>
                            <div className="text-xs text-neutral-500">게임</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-green-500">{totalWins}</div>
                            <div className="text-xs text-neutral-500">승리</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-purple-500">{totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0}%</div>
                            <div className="text-xs text-neutral-500">승률</div>
                        </div>
                    </div>
                    <p className="text-[10px] text-center text-neutral-400 mt-6">※ 가상 코인 게임이며, 실제 금전 거래와 무관합니다.</p>
                </div>
            </div>
        </main>
    );
}
