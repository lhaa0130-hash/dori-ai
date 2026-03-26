"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Sparkles, Brain, Code, Database, Globe, Smartphone, Video, Film, Check, Zap, Cpu, Server, Wifi, Lock, Search, Command, Activity, Layers, Box, Key, Mail, Map, Music, Monitor, Ghost, Bomb, Skull, Heart, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays } from "@/lib/cottonCandy";

// 카드 아이콘 데이터 풀
const ICON_POOL = [
    { id: "brain", icon: <Brain className="w-8 h-8" />, color: "text-pink-500" },
    { id: "code", icon: <Code className="w-8 h-8" />, color: "text-blue-500" },
    { id: "db", icon: <Database className="w-8 h-8" />, color: "text-emerald-500" },
    { id: "globe", icon: <Globe className="w-8 h-8" />, color: "text-sky-500" },
    { id: "phone", icon: <Smartphone className="w-8 h-8" />, color: "text-violet-500" },
    { id: "video", icon: <Video className="w-8 h-8" />, color: "text-red-500" },
    { id: "film", icon: <Film className="w-8 h-8" />, color: "text-[#F9954E]" },
    { id: "sparkles", icon: <Sparkles className="w-8 h-8" />, color: "text-yellow-500" },
    { id: "zap", icon: <Zap className="w-8 h-8" />, color: "text-amber-500" },
    { id: "cpu", icon: <Cpu className="w-8 h-8" />, color: "text-indigo-500" },
    { id: "server", icon: <Server className="w-8 h-8" />, color: "text-slate-500" },
    { id: "wifi", icon: <Wifi className="w-8 h-8" />, color: "text-cyan-500" },
    { id: "lock", icon: <Lock className="w-8 h-8" />, color: "text-rose-500" },
    { id: "search", icon: <Search className="w-8 h-8" />, color: "text-teal-500" },
    { id: "command", icon: <Command className="w-8 h-8" />, color: "text-fuchsia-500" },
    { id: "activity", icon: <Activity className="w-8 h-8" />, color: "text-lime-500" },
    { id: "layers", icon: <Layers className="w-8 h-8" />, color: "text-purple-500" },
    { id: "box", icon: <Box className="w-8 h-8" />, color: "text-stone-500" },
    { id: "key", icon: <Key className="w-8 h-8" />, color: "text-amber-600" },
    { id: "mail", icon: <Mail className="w-8 h-8" />, color: "text-blue-400" },
    { id: "map", icon: <Map className="w-8 h-8" />, color: "text-green-600" },
    { id: "music", icon: <Music className="w-8 h-8" />, color: "text-pink-600" },
    { id: "monitor", icon: <Monitor className="w-8 h-8" />, color: "text-slate-600" },
    { id: "ghost", icon: <Ghost className="w-8 h-8" />, color: "text-purple-400" },
    { id: "bomb", icon: <Bomb className="w-8 h-8" />, color: "text-red-600" },
    { id: "skull", icon: <Skull className="w-8 h-8" />, color: "text-neutral-500" },
];

interface Card {
    id: number;
    iconId: string;
    icon: React.ReactNode;
    color: string;
    isFlipped: boolean;
    isMatched: boolean;
}

// 스테이지 설정
const STAGES = [
    // Easy Stages (1~5) - 색상 힌트 있음
    { level: 1, pairs: 6, cols: 4, label: "Stage 1", isHard: false },
    { level: 2, pairs: 6, cols: 4, label: "Stage 2", isHard: false },
    { level: 3, pairs: 8, cols: 4, label: "Stage 3", isHard: false },
    { level: 4, pairs: 10, cols: 5, label: "Stage 4", isHard: false },
    { level: 5, pairs: 12, cols: 6, label: "Stage 5", isHard: false },

    // Hard Stages (6~9) - 색상 통일 (Monochrome)
    { level: 6, pairs: 12, cols: 6, label: "Stage 6 (Hard)", isHard: true },
    { level: 7, pairs: 15, cols: 6, label: "Stage 7 (Hard)", isHard: true },
    { level: 8, pairs: 15, cols: 6, label: "Stage 8 (Hard)", isHard: true },
    { level: 9, pairs: 18, cols: 6, label: "Stage 9 (Hard)", isHard: true },

    // Hell Stage (10) - 3,2,1 카운트다운 + 5초 프리뷰 + 3개 하트
    {
        level: 10,
        pairs: 18,
        cols: 6,
        label: "Stage 10 (HELL)",
        isHard: true,
        isHell: true,
        previewTime: 5000, // 5초
        maxMistakes: 3     // 하트 3개
    },
];

export default function MemoryGamePage() {
    const { theme } = useTheme();
    const { session } = useAuth();
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matchedCount, setMatchedCount] = useState(0);
    const [moves, setMoves] = useState(0);
    const [currentStage, setCurrentStage] = useState(1);
    const [mistakes, setMistakes] = useState(0);
    const [isPreviewing, setIsPreviewing] = useState(false);

    // countdown state: number (3,2,1,0) or null. 0 represents "START!"
    const [countdown, setCountdown] = useState<number | null>(null);
    const [gameState, setGameState] = useState<"START" | "COUNTDOWN" | "PLAY" | "STAGE_CLEAR" | "GAME_PASS" | "GAME_FAIL">("START");

    const stageConfig = STAGES[currentStage - 1];

    // 카운트다운 효과
    useEffect(() => {
        if (gameState !== "COUNTDOWN" || countdown === null) return;

        let timer: NodeJS.Timeout;

        if (countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => (prev !== null ? prev - 1 : null));
            }, 1000);
        } else if (countdown === 0) {
            // 0일 때 (START!) 1초 보여주고 프리뷰 시작
            timer = setTimeout(() => {
                setCountdown(null);
                startPreview(cards, stageConfig.previewTime || 5000);
            }, 1000);
        }

        return () => clearTimeout(timer);
    }, [gameState, countdown, cards, stageConfig]);

    const initializeGame = (stageLevel: number) => {
        const config = STAGES[stageLevel - 1];

        const selectedIcons = [...ICON_POOL]
            .sort(() => Math.random() - 0.5)
            .slice(0, config.pairs);

        const shuffledCards = [...selectedIcons, ...selectedIcons]
            .sort(() => Math.random() - 0.5)
            .map((item, index) => ({
                id: index,
                iconId: item.id,
                icon: item.icon,
                color: item.color,
                isFlipped: false,
                isMatched: false
            }));

        setCards(shuffledCards);
        setFlippedCards([]);
        setMatchedCount(0);
        setMoves(0);
        setMistakes(0);
        setCurrentStage(stageLevel);

        if (config.isHell) {
            setGameState("COUNTDOWN");
            setCountdown(3); // Start countdown from 3
        } else {
            setGameState("PLAY");
            setIsPreviewing(false);
        }
    };

    const startPreview = (currentCards: Card[], duration: number) => {
        setGameState("PLAY");
        setIsPreviewing(true);

        const previewCards = currentCards.map(c => ({ ...c, isFlipped: true }));
        setCards(previewCards);

        setTimeout(() => {
            const hiddenCards = previewCards.map(c => ({ ...c, isFlipped: false }));
            setCards(hiddenCards);
            setIsPreviewing(false);
        }, duration);
    };

    const handleNextStage = () => {
        if (currentStage < 10) {
            initializeGame(currentStage + 1);
        } else {
            setGameState("GAME_PASS");
        }
    };

    const handleCardClick = (id: number) => {
        if (gameState !== "PLAY" || isPreviewing) return;
        if (flippedCards.length >= 2 || cards[id].isFlipped || cards[id].isMatched) return;

        const newCards = [...cards];
        newCards[id].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, id];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(prev => prev + 1);
            const [firstId, secondId] = newFlipped;
            const isMatch = cards[firstId].iconId === cards[secondId].iconId;

            if (isMatch) {
                setTimeout(() => {
                    const matchedCards = [...cards];
                    matchedCards[firstId].isMatched = true;
                    matchedCards[secondId].isMatched = true;
                    setCards(matchedCards);
                    setFlippedCards([]);

                    setMatchedCount(prev => {
                        const newCount = prev + 1;
                        if (newCount === stageConfig.pairs) {
                            if (currentStage === 10) {
                                setGameState("GAME_PASS");
                                // 전체 클리어 시 솜사탕 지급
                                if (session?.user?.email) {
                                    addCottonCandy(session.user.email, 30, "기억력 게임 완료");
                                    incrementMinigamePlays(session.user.email);
                                }
                            } else {
                                setGameState("STAGE_CLEAR");
                                // 스테이지 클리어 시 솜사탕 지급
                                if (session?.user?.email) {
                                    addCottonCandy(session.user.email, 30, "기억력 게임 완료");
                                    incrementMinigamePlays(session.user.email);
                                }
                            }
                        }
                        return newCount;
                    });
                }, 300);
            } else {
                setTimeout(() => {
                    const resetCards = [...cards];
                    resetCards[firstId].isFlipped = false;
                    resetCards[secondId].isFlipped = false;
                    setCards(resetCards);
                    setFlippedCards([]);

                    if (stageConfig.isHell) {
                        const newMistakes = mistakes + 1;
                        setMistakes(newMistakes);
                        if (newMistakes >= (stageConfig.maxMistakes || 3)) {
                            setGameState("GAME_FAIL");
                        }
                    }
                }, 800);
            }
        }
    };

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-white relative overflow-hidden flex flex-col items-center justify-center p-4">

            {/* 상단 nav */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-6 z-10">
                <Link href="/minigame" className="flex items-center gap-2 text-neutral-500 hover:text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                    <span>나가기</span>
                </Link>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${stageConfig.isHell ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        stageConfig.isHard ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    }`}>
                    {stageConfig.label}
                </div>
            </div>

            {/* 메인 보드 */}
            <div className={`relative z-10 w-full max-w-4xl bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border rounded-[2rem] p-6 md:p-10 shadow-2xl overflow-hidden min-h-[600px] flex flex-col items-center justify-center
                ${stageConfig.isHell ? "border-red-500/30 shadow-red-500/10" : "border-neutral-200 dark:border-zinc-800"}
            `}>

                {/* 카운트다운 오버레이 */}
                {gameState === "COUNTDOWN" && countdown !== null && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="text-7xl font-black text-white animate-bounce-short">
                            {countdown === 0 ? "START!" : countdown}
                        </div>
                    </div>
                )}

                {gameState === "START" && (
                    <div className="text-center animate-fade-in">
                        <Sparkles className="w-20 h-20 mx-auto text-purple-500 mb-6" />
                        <h1 className="text-4xl font-bold mb-4">Memory Master</h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                            1~5단계는 색상 힌트가 있어 쉽지만,<br />
                            6단계부터는 어려워지고<br />
                            <strong>10단계 Hell Mode</strong>는 극한의 난이도를 자랑합니다!
                        </p>
                        <button
                            onClick={() => initializeGame(1)}
                            className="px-8 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-lg"
                        >
                            게임 시작
                        </button>
                    </div>
                )}

                {gameState === "PLAY" && (
                    <div className="w-full flex flex-col h-full animate-fade-in select-none">
                        {/* 상태 표시줄 */}
                        <div className="flex justify-between items-center mb-6 px-2">
                            <div className="min-w-[120px] text-sm font-medium text-neutral-500">
                                남은 카드: <span className="text-foreground">{stageConfig.pairs - matchedCount}</span> 쌍
                            </div>

                            {/* 하트 표시 (Hell Mode) */}
                            {stageConfig.isHell && (
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: (stageConfig.maxMistakes || 3) }).map((_, i) => (
                                        <Heart
                                            key={i}
                                            className={`w-6 h-6 transition-all duration-300 ${i < ((stageConfig.maxMistakes || 3) - mistakes)
                                                    ? "fill-red-500 text-red-500"
                                                    : "fill-neutral-200 text-neutral-200 dark:fill-zinc-800 dark:text-zinc-800"
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                            {isPreviewing && (
                                <div className="text-[#F9954E] font-bold animate-pulse flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    외우세요!
                                </div>
                            )}
                        </div>

                        {/* 카드 그리드 */}
                        <div
                            className="grid gap-2 sm:gap-3 mx-auto w-full max-w-[600px] place-content-center"
                            style={{
                                gridTemplateColumns: `repeat(${stageConfig.cols}, minmax(0, 1fr))`
                            }}
                        >
                            {cards.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    disabled={card.isMatched || isPreviewing}
                                    className={`
                                        relative aspect-square rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer
                                        ${card.isMatched ? "opacity-0 pointer-events-none" : "opacity-100"}
                                    `}
                                    style={{ perspective: "1000px" }}
                                >
                                    <div
                                        className={`
                                            w-full h-full absolute inset-0 rounded-lg md:rounded-xl shadow-sm transition-all duration-500 transform-style-3d
                                            ${card.isFlipped ? "rotate-y-180" : ""}
                                        `}
                                    >
                                        {/* 앞면 (뒤집혔을 때/숨겨진 상태) */}
                                        <div className={`
                                            absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl flex items-center justify-center
                                            bg-neutral-100 dark:bg-zinc-800 border-2 border-transparent
                                            hover:border-purple-500/30
                                        `}>
                                            <div className="w-1/3 h-1/3 rounded-full bg-neutral-200 dark:bg-zinc-700 opacity-50" />
                                        </div>

                                        {/* 뒷면 (공개된 상태) */}
                                        <div className={`
                                            absolute inset-0 w-full h-full backface-hidden rounded-lg md:rounded-xl flex items-center justify-center rotate-y-180
                                            ${stageConfig.isHard ? "bg-neutral-800 border border-neutral-700" : "bg-white border border-neutral-200 dark:bg-neutral-800 dark:border-zinc-700"}
                                            shadow-lg
                                        `}>
                                            <div className={`
                                                ${stageConfig.isHard
                                                    ? "text-white"  // 하드 모드: 흰색 통일
                                                    : card.color    // 이지 모드: 고유 색상
                                                }
                                                transform transition-transform
                                            `}>
                                                {card.icon}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === "STAGE_CLEAR" && (
                    <div className="text-center py-10 animate-fade-in">
                        <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Stage {currentStage} Clear!</h2>
                        <button
                            onClick={handleNextStage}
                            className="mt-8 px-8 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold hover:scale-105 transition-transform"
                        >
                            {currentStage === 9 ? "최종 단계 (Hell Mode) 도전" : "다음 스테이지"}
                        </button>
                    </div>
                )}

                {gameState === "GAME_FAIL" && (
                    <div className="text-center py-10 animate-fade-in">
                        <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                            <Skull className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Game Over...</h2>
                        <p className="text-neutral-500 mb-8">기회를 모두 소진했습니다.</p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => initializeGame(10)}
                                className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 hover:scale-105 transition-transform"
                            >
                                재도전 (Hell)
                            </button>
                            <button
                                onClick={() => initializeGame(1)}
                                className="px-6 py-3 rounded-xl bg-neutral-200 dark:bg-zinc-800 font-bold hover:bg-neutral-300 dark:hover:bg-zinc-700 transition-colors"
                            >
                                처음으로
                            </button>
                        </div>
                    </div>
                )}

                {gameState === "GAME_PASS" && (
                    <div className="text-center py-10 animate-slide-up">
                        <h2 className="text-4xl font-bold mb-4 text-[#F9954E]">🏆 ALL CLEARED!</h2>
                        <p className="text-xl mb-8">당신은 진정한 기억력의 신입니다!</p>
                        <Link href="/minigame">
                            <button className="px-8 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black font-bold hover:scale-105 transition-transform">
                                메뉴로 돌아가기
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .perspective-1000 { perspective: 1000px; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                @keyframes bounce-short {
                    0%, 100% { transform: translateY(-25%) scale(1.1); animation-timing-function: cubic-bezier(0.8,0,1,1); }
                    50% { transform: translateY(0) scale(1); animation-timing-function: cubic-bezier(0,0,0.2,1); }
                }
                .animate-bounce-short { animation: bounce-short 0.5s infinite; }
            `}</style>
        </main>
    );
}
