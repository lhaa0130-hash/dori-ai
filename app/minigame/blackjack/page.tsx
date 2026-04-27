"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, RotateCcw, Trophy, Coins, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays } from "@/lib/cottonCandy";

// 카드 관련
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

interface Card {
    suit: string;
    rank: string;
    value: number;
    hidden: boolean;
}

const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (let i = 0; i < RANKS.length; i++) {
            const value = i === 0 ? 11 : i >= 10 ? 10 : i + 1;
            deck.push({ suit, rank: RANKS[i], value, hidden: false });
        }
    }
    // 셔플
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const calculateHand = (cards: Card[]): number => {
    let total = 0;
    let aces = 0;
    for (const card of cards) {
        if (card.hidden) continue;
        total += card.value;
        if (card.rank === "A") aces++;
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
};

const isRed = (suit: string) => suit === "♥" || suit === "♦";

type GameState = "BETTING" | "PLAYING" | "DEALER_TURN" | "FINISHED";

export default function BlackjackPage() {
    const { session } = useAuth();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [coins, setCoins] = useState(1000);
    const [bet, setBet] = useState(50);
    const [deck, setDeck] = useState<Card[]>([]);
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [gameState, setGameState] = useState<GameState>("BETTING");
    const [resultMessage, setResultMessage] = useState("");
    const [totalGames, setTotalGames] = useState(0);
    const [totalWins, setTotalWins] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    const triggerConfetti = () => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#F9954E", "#FBAA60", "#E8832E"] });
    };

    const deal = () => {
        if (coins < bet) return;
        setCoins(prev => prev - bet);
        setTotalGames(prev => prev + 1);

        const newDeck = createDeck();
        const pHand = [newDeck.pop()!, newDeck.pop()!];
        const dHand = [newDeck.pop()!, { ...newDeck.pop()!, hidden: true }];

        setDeck(newDeck);
        setPlayerHand(pHand);
        setDealerHand(dHand);
        setResultMessage("");

        // 블랙잭 체크
        const pTotal = calculateHand(pHand);
        if (pTotal === 21) {
            dHand[1].hidden = false;
            setDealerHand([...dHand]);
            const dTotal = calculateHand(dHand);
            if (dTotal === 21) {
                setResultMessage("둘 다 블랙잭! 무승부 🤝");
                setCoins(prev => prev + bet);
                setGameState("FINISHED");
            } else {
                setResultMessage("🃏 블랙잭!! ×2.5 배당!");
                setCoins(prev => prev + Math.floor(bet * 2.5));
                setTotalWins(prev => prev + 1);
                setGameState("FINISHED");
                triggerConfetti();
                if (session?.user?.email) {
                    addCottonCandy(session.user.email, 20, "블랙잭 승리");
                    incrementMinigamePlays(session.user.email);
                }
            }
        } else {
            setGameState("PLAYING");
        }
    };

    const hit = () => {
        const card = deck.pop()!;
        const newHand = [...playerHand, card];
        setPlayerHand(newHand);
        setDeck([...deck]);

        const total = calculateHand(newHand);
        if (total > 21) {
            // 버스트
            dealerHand[1].hidden = false;
            setDealerHand([...dealerHand]);
            setResultMessage("💥 버스트! 21을 초과했습니다.");
            setGameState("FINISHED");
        } else if (total === 21) {
            stand();
        }
    };

    const stand = () => {
        setGameState("DEALER_TURN");

        // 딜러 카드 공개
        const revealedDealer = dealerHand.map(c => ({ ...c, hidden: false }));
        setDealerHand(revealedDealer);

        // 딜러 드로우
        let currentDeck = [...deck];
        let dHand = [...revealedDealer];
        let dealerTotal = calculateHand(dHand);

        const drawDealer = () => {
            if (dealerTotal < 17 && currentDeck.length > 0) {
                const card = currentDeck.pop()!;
                dHand = [...dHand, card];
                dealerTotal = calculateHand(dHand);
                setDealerHand([...dHand]);
                setDeck([...currentDeck]);
                setTimeout(drawDealer, 600);
            } else {
                // 결과 판정
                const playerTotal = calculateHand(playerHand);
                setTimeout(() => {
                    if (dealerTotal > 21) {
                        setResultMessage("딜러 버스트! 승리! 🎉");
                        setCoins(prev => prev + bet * 2);
                        setTotalWins(prev => prev + 1);
                        triggerConfetti();
                        if (session?.user?.email) {
                            addCottonCandy(session.user.email, 20, "블랙잭 승리");
                            incrementMinigamePlays(session.user.email);
                        }
                    } else if (playerTotal > dealerTotal) {
                        setResultMessage("승리! 🎉");
                        setCoins(prev => prev + bet * 2);
                        setTotalWins(prev => prev + 1);
                        triggerConfetti();
                        if (session?.user?.email) {
                            addCottonCandy(session.user.email, 20, "블랙잭 승리");
                            incrementMinigamePlays(session.user.email);
                        }
                    } else if (playerTotal === dealerTotal) {
                        setResultMessage("무승부! 배팅금 반환 🤝");
                        setCoins(prev => prev + bet);
                    } else {
                        setResultMessage("패배... 딜러 승 😢");
                    }
                    setGameState("FINISHED");
                }, 400);
            }
        };

        setTimeout(drawDealer, 500);
    };

    const adjustBet = (amount: number) => {
        setBet(prev => Math.max(10, Math.min(prev + amount, coins)));
    };

    const isDark = mounted && theme === "dark";

    const CardComponent = ({ card, index, delay = 0 }: { card: Card; index: number; delay?: number }) => (
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay * 0.15, type: "spring", stiffness: 200 }}
            className={`relative w-16 h-24 md:w-20 md:h-28 rounded-xl shadow-lg flex flex-col items-center justify-center font-bold ${card.hidden
                ? "bg-gradient-to-br from-[#F9954E] to-[#c2410c] border-2 border-[#F9954E]"
                : "bg-white dark:bg-zinc-100 border-2 border-neutral-200"
                }`}
        >
            {card.hidden ? (
                <span className="text-2xl text-white opacity-50">🂠</span>
            ) : (
                <>
                    <span className={`text-xs absolute top-1 left-2 ${isRed(card.suit) ? "text-red-500" : "text-neutral-800"}`}>
                        {card.rank}
                    </span>
                    <span className={`text-2xl ${isRed(card.suit) ? "text-red-500" : "text-neutral-800"}`}>
                        {card.suit}
                    </span>
                    <span className={`text-xs absolute bottom-1 right-2 ${isRed(card.suit) ? "text-red-500" : "text-neutral-800"}`}>
                        {card.rank}
                    </span>
                </>
            )}
        </motion.div>
    );

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-white/10 z-50 flex items-center justify-between px-6">
                <Link href="/minigame" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold">🃏 블랙잭</h1>
                <div className="w-9" />
            </header>

            <div className="pt-24 pb-12 px-4 max-w-lg mx-auto">
                <div className="animate-fade-in">

                    {/* 코인 잔액 */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <Coins className="w-5 h-5 text-[#F9954E]" />
                        <span className="text-2xl font-bold text-[#F9954E]">{coins.toLocaleString()}</span>
                        <span className="text-sm text-neutral-500">코인</span>
                    </div>

                    {/* 메인 게임 */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-xl shadow-neutral-200/50 dark:shadow-none border border-neutral-100 dark:border-white/5">

                        {/* 게임 테이블 */}
                        <div className="bg-neutral-800 dark:bg-black rounded-2xl p-6 mb-6 min-h-[320px] flex flex-col justify-between border border-neutral-700 dark:border-neutral-800 relative overflow-hidden">
                            {/* 테이블 오렌지 라인 장식 */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F9954E] to-transparent opacity-50" />

                            {/* 딜러 핸드 */}
                            <div className="mb-6 z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-neutral-400">딜러</span>
                                    {dealerHand.length > 0 && (
                                        <span className="text-xs font-bold text-white bg-neutral-700 px-2 py-0.5 rounded-full">
                                            {calculateHand(dealerHand)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 min-h-[96px] flex-wrap">
                                    {dealerHand.map((card, i) => (
                                        <CardComponent key={i} card={card} index={i} delay={i} />
                                    ))}
                                    {dealerHand.length === 0 && (
                                        <div className="w-16 h-24 md:w-20 md:h-28 rounded-xl border-2 border-dashed border-neutral-600" />
                                    )}
                                </div>
                            </div>

                            {/* 구분선 */}
                            <div className="border-t border-dashed border-neutral-700 my-2" />

                            {/* 플레이어 핸드 */}
                            <div className="mt-4 z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-neutral-400">플레이어</span>
                                    {playerHand.length > 0 && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${calculateHand(playerHand) > 21
                                            ? "bg-red-500" // 위험/버스트는 빨강 유지
                                            : calculateHand(playerHand) === 21
                                                ? "bg-[#F9954E]" // 블랙잭은 오렌지
                                                : "bg-[#000000]/50"
                                            }`}>
                                            {calculateHand(playerHand)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2 min-h-[96px] flex-wrap">
                                    {playerHand.map((card, i) => (
                                        <CardComponent key={i} card={card} index={i} delay={i + 2} />
                                    ))}
                                    {playerHand.length === 0 && (
                                        <div className="w-16 h-24 md:w-20 md:h-28 rounded-xl border-2 border-dashed border-neutral-600" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 결과 메시지 */}
                        <AnimatePresence>
                            {resultMessage && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className={`text-center p-4 rounded-2xl mb-6 font-bold text-lg ${resultMessage.includes("승리") || resultMessage.includes("블랙잭")
                                        ? "bg-[#F9954E]/10 text-[#F9954E]"
                                        : resultMessage.includes("무승부") || resultMessage.includes("반환")
                                            ? "bg-neutral-100 dark:bg-zinc-800 text-neutral-500"
                                            : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500"
                                        }`}
                                >
                                    {resultMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 배팅 (BETTING 상태) */}
                        {gameState === "BETTING" && (
                            <>
                                <div className="flex items-center justify-between mb-4 p-4 bg-neutral-50 dark:bg-zinc-800 rounded-2xl">
                                    <span className="text-sm font-bold text-neutral-500">배팅 금액</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => adjustBet(-10)} disabled={bet <= 10}
                                            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center disabled:opacity-30 transition-colors">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xl font-bold text-[#F9954E] w-16 text-center">{bet}</span>
                                        <button onClick={() => adjustBet(10)} disabled={bet >= coins}
                                            className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-zinc-700 flex items-center justify-center disabled:opacity-30 transition-colors">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-4">
                                    {[10, 50, 100, 200].map(amount => (
                                        <button key={amount} onClick={() => setBet(Math.min(amount, coins))} disabled={coins < amount}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${bet === amount
                                                ? "bg-[#F9954E] text-white"
                                                : "bg-neutral-100 dark:bg-zinc-800 text-neutral-500 disabled:opacity-30"
                                                }`}>
                                            {amount}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={deal} disabled={coins < bet}
                                    className="w-full py-4 rounded-2xl font-bold text-lg bg-[#F9954E] hover:bg-[#E8832E] text-white shadow-lg shadow-[#F9954E]/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                    🃏 딜!
                                </button>
                            </>
                        )}

                        {/* 플레이어 액션 (PLAYING 상태) */}
                        {gameState === "PLAYING" && (
                            <div className="flex gap-3">
                                <button onClick={hit}
                                    className="flex-1 py-4 rounded-2xl font-bold text-lg bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all">
                                    히트 (카드 받기)
                                </button>
                                <button onClick={stand}
                                    className="flex-1 py-4 rounded-2xl font-bold text-lg bg-[#F9954E] hover:bg-[#E8832E] text-white shadow-lg shadow-[#F9954E]/20 active:scale-[0.98] transition-all">
                                    스탠드 (멈추기)
                                </button>
                            </div>
                        )}

                        {/* 딜러 턴 */}
                        {gameState === "DEALER_TURN" && (
                            <div className="text-center py-4 text-neutral-500 animate-pulse font-bold">
                                딜러가 카드를 뽑고 있습니다...
                            </div>
                        )}

                        {/* 게임 종료 */}
                        {gameState === "FINISHED" && (
                            <button onClick={() => { setGameState("BETTING"); setPlayerHand([]); setDealerHand([]); setResultMessage(""); }}
                                className="w-full py-4 rounded-2xl font-bold text-lg bg-[#F9954E] hover:bg-[#E8832E] text-white shadow-lg shadow-[#F9954E]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <RotateCcw className="w-5 h-5" />
                                다음 게임
                            </button>
                        )}

                        {/* 코인 리셋 */}
                        {coins < 10 && gameState !== "PLAYING" && gameState !== "DEALER_TURN" && (
                            <button onClick={() => { setCoins(1000); setTotalGames(0); setTotalWins(0); setBet(50); setResultMessage(""); setGameState("BETTING"); setPlayerHand([]); setDealerHand([]); }}
                                className="w-full mt-3 py-3 rounded-2xl bg-neutral-100 dark:bg-zinc-800 text-sm font-bold text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                1,000 코인으로 다시 시작
                            </button>
                        )}
                    </div>

                    {/* 통계 */}
                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-[#F9954E]">{totalGames}</div>
                            <div className="text-xs text-neutral-500">총 게임</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-[#E8832E]">{totalWins}</div>
                            <div className="text-xs text-neutral-500">승리</div>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 text-center border border-neutral-100 dark:border-white/5">
                            <div className="text-2xl font-bold text-[#FBAA60]">
                                {totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0}%
                            </div>
                            <div className="text-xs text-neutral-500">승률</div>
                        </div>
                    </div>

                    <p className="text-[10px] text-center text-neutral-400 mt-6">
                        ※ 이 게임은 가상 코인을 사용하며, 실제 금전 거래와 무관합니다.
                    </p>
                </div>
            </div>
        </main>
    );
}
