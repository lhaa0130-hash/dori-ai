"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Sword, Shield, Heart, Zap, RefreshCw, Skull, Trophy, Coins, Plus } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, getCottonCandyBalance, incrementMinigamePlays, spendCottonCandy } from "@/lib/cottonCandy";

// ----------------------------------------------------------------------
// Types & Constants
// ----------------------------------------------------------------------

type GameState = "READY" | "BATTLE" | "VICTORY" | "DEFEAT" | "LEVEL_UP";

interface Player {
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    exp: number;
    maxExp: number;
    str: number;
    def: number;
    gold: number; // 게임 내 획득 골드 (누적)
    potions: number;
}

interface Monster {
    id: number;
    name: string;
    emoji: string;
    hp: number;
    maxHp: number;
    str: number;
    exp: number;
    gold: number;
}

const INITIAL_PLAYER: Player = {
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    exp: 0,
    maxExp: 100,
    str: 10,
    def: 2,
    gold: 0,
    potions: 3,
};

const MONSTERS: Monster[] = [
    { id: 1, name: "슬라임", emoji: "💧", hp: 30, maxHp: 30, str: 5, exp: 20, gold: 10 },
    { id: 2, name: "고블린", emoji: "👺", hp: 60, maxHp: 60, str: 10, exp: 40, gold: 25 },
    { id: 3, name: "스켈레톤", emoji: "💀", hp: 100, maxHp: 100, str: 15, exp: 70, gold: 50 },
    { id: 4, name: "오크 전사", emoji: "👹", hp: 200, maxHp: 200, str: 25, exp: 120, gold: 100 },
    { id: 5, name: "다크 나이트", emoji: "👿", hp: 400, maxHp: 400, str: 40, exp: 250, gold: 300 },
    { id: 6, name: "레드 드래곤", emoji: "🐲", hp: 1000, maxHp: 1000, str: 80, exp: 1000, gold: 1000 },
];

const POTION_PRICE = 100; // 물약 가격 (포인트)

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function DungeonGame() {
    const { session } = useAuth();
    const [gameState, setGameState] = useState<GameState>("READY");
    const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
    const [monster, setMonster] = useState<Monster | null>(null);
    const [floor, setFloor] = useState(1);
    const [logs, setLogs] = useState<string[]>([]);

    // 실제 사용자 포인트
    const [userPoints, setUserPoints] = useState(0);

    // 스크롤 자동 이동을 위한 Ref
    const logContainerRef = useRef<HTMLDivElement>(null);

    // 1. 사용자 포인트 로드
    useEffect(() => {
        if (session?.user?.email) {
            setUserPoints(getCottonCandyBalance(session.user.email));
        }
    }, [session]);

    // 포인트 업데이트 함수 (delta: 증가분, reason: 사유)
    const updateUserPoints = (delta: number, reason: string) => {
        if (!session?.user?.email || delta <= 0) return;
        const newBalance = addCottonCandy(session.user.email, delta, reason);
        setUserPoints(newBalance);
        window.dispatchEvent(new Event("point-updated"));
    };

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // 게임 로그 추가 (최대 10개로 제한)
    const addLog = (message: string) => {
        setLogs((prev) => [...prev, message].slice(-10));
    };

    // 물약 구매
    const buyPotion = () => {
        if (userPoints < POTION_PRICE) {
            addLog("🚫 포인트가 부족합니다!");
            return;
        }
        if (session?.user?.email) {
            const ok = spendCottonCandy(session.user.email, POTION_PRICE, "던전 물약 구매");
            if (!ok) {
                addLog("🚫 포인트가 부족합니다!");
                return;
            }
            setUserPoints(getCottonCandyBalance(session.user.email));
            window.dispatchEvent(new Event("point-updated"));
        }
        setPlayer(prev => ({ ...prev, potions: prev.potions + 1 }));
        addLog(`🧪 물약을 구매했습니다. (보유: ${player.potions + 1})`);
    };

    // 게임 시작 (층 이동)
    const startGame = () => {
        const monsterIdx = Math.min(Math.floor((floor - 1) / 5), MONSTERS.length - 1);
        let targetMonster = MONSTERS[Math.min(floor - 1, MONSTERS.length - 1)];

        // 몬스터 체력은 층이 올라갈수록 조금씩 증가
        const statMultiplier = 1 + (floor - 1) * 0.1;

        setMonster({
            ...targetMonster,
            maxHp: Math.floor(targetMonster.maxHp * statMultiplier),
            hp: Math.floor(targetMonster.maxHp * statMultiplier),
            str: Math.floor(targetMonster.str * statMultiplier),
            exp: Math.floor(targetMonster.exp * statMultiplier),
            gold: Math.floor(targetMonster.gold * statMultiplier),
        });

        setGameState("BATTLE");
        addLog(`=== ${floor}층에 진입했습니다 ===`);
        addLog(`야생의 ${targetMonster.name}(이)가 나타났다!`);
    };

    // 플레이어 공격
    const handleAttack = () => {
        if (!monster || gameState !== "BATTLE") return;

        // 1. 플레이어 턴
        const damage = Math.floor(player.str * (0.9 + Math.random() * 0.2));
        const isCritical = Math.random() < 0.15;
        const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

        const newMonsterHp = Math.max(0, monster.hp - finalDamage);
        setMonster((prev) => prev ? { ...prev, hp: newMonsterHp } : null);

        addLog(`⚔️ ${isCritical ? "[크리티컬!] " : ""}당신은 ${monster.name}에게 ${finalDamage}의 피해를 입혔습니다.`);

        if (newMonsterHp === 0) {
            handleVictory();
        } else {
            // 2. 몬스터 턴 (약간의 딜레이) - 현재 player를 파라미터로 전달해 stale closure 방지
            const currentPlayer = player;
            setTimeout(() => monsterTurn(newMonsterHp, currentPlayer), 500);
        }
    };

    // 스킬 공격
    const handleSkill = () => {
        if (!monster || gameState !== "BATTLE") return;
        if (player.mp < 10) {
            addLog("🚫 마나가 부족합니다!");
            return;
        }

        setPlayer((prev) => ({ ...prev, mp: prev.mp - 10 }));

        const damage = Math.floor(player.str * 2.5); // 250% 데미지
        const newMonsterHp = Math.max(0, monster.hp - damage);
        setMonster((prev) => prev ? { ...prev, hp: newMonsterHp } : null);

        addLog(`⚡ 스킬 발동! ${monster.name}에게 ${damage}의 엄청난 피해를 입혔습니다!`);

        if (newMonsterHp === 0) {
            handleVictory();
        } else {
            const currentPlayer = player;
            setTimeout(() => monsterTurn(newMonsterHp, currentPlayer), 500);
        }
    };

    // 회복
    const handleHeal = () => {
        if (player.potions <= 0) {
            addLog("🚫 포션이 없습니다!");
            return;
        }

        const healAmount = Math.floor(player.maxHp * 0.4);
        const newHp = Math.min(player.maxHp, player.hp + healAmount);

        setPlayer((prev) => ({ ...prev, hp: newHp, potions: prev.potions - 1 }));
        addLog(`🧪 포션을 사용하여 체력을 ${healAmount} 회복했습니다.`);

        // 회복 후 player 상태를 반영해서 monsterTurn에 전달
        const healedPlayer = { ...player, hp: newHp, potions: player.potions - 1 };
        setTimeout(() => monsterTurn(monster!.hp, healedPlayer), 500);
    };

    // 몬스터 공격 턴
    const monsterTurn = (currentMonsterHp: number, currentPlayer: Player) => {
        if (!monster || currentMonsterHp <= 0) return;

        const damage = Math.max(0, Math.floor(monster.str * (0.8 + Math.random() * 0.4)) - currentPlayer.def);
        const newPlayerHp = Math.max(0, currentPlayer.hp - damage);

        setPlayer((prev) => ({ ...prev, hp: newPlayerHp }));
        addLog(`🛡️ ${monster.name}의 공격! 당신은 ${damage}의 피해를 입었습니다.`);

        if (newPlayerHp === 0) {
            setGameState("DEFEAT");
            addLog("💀 눈앞이 깜깜해졌습니다... 패배했습니다.");

            // 패배 시에도 획득한 골드의 절반은 솜사탕으로 적립 (위로금)
            if (currentPlayer.gold > 0) {
                const savePoint = Math.floor(currentPlayer.gold / 2);
                updateUserPoints(savePoint, "던전RPG 패배 위로금");
                addLog(`💰 획득한 골드의 일부(${savePoint}P)가 솜사탕으로 적립되었습니다.`);
            }
            if (session?.user?.email) {
                incrementMinigamePlays(session.user.email);
            }
        }
    };

    // 승리 처리
    const handleVictory = () => {
        if (!monster) return;

        setGameState("VICTORY");
        const expGain = monster.exp;
        const goldGain = monster.gold;

        // 솜사탕 즉시 적립
        updateUserPoints(goldGain, "던전RPG 클리어");
        if (session?.user?.email) {
            incrementMinigamePlays(session.user.email);
        }

        // 레벨업 체크
        let newLevel = player.level;
        let newExp = player.exp + expGain;
        let newMaxExp = player.maxExp;
        let newStr = player.str;
        let newMaxHp = player.maxHp;
        let newHp = player.hp;

        let levelUpOccurred = false;

        while (newExp >= newMaxExp) {
            newExp -= newMaxExp;
            newLevel += 1;
            newMaxExp = Math.floor(newMaxExp * 1.2);
            newStr += 2;
            newMaxHp += 20;
            newHp = newMaxHp; // 레벨업 시 체력 100% 회복
            levelUpOccurred = true;
        }

        setPlayer((prev) => ({
            ...prev,
            level: newLevel,
            exp: newExp,
            maxExp: newMaxExp,
            str: newStr,
            maxHp: newMaxHp,
            hp: newHp,
            gold: prev.gold + goldGain,
        }));

        addLog(`🎉 승리했습니다! 경험치 +${expGain}, 포인트 +${goldGain} 획득.`);
        if (levelUpOccurred) {
            addLog(`🆙 레벨업! Lv.${newLevel}이 되었습니다.`);
        }

        setTimeout(() => {
            setFloor((prev) => prev + 1);
        }, 1500);
    };

    // 재시작
    const handleRestart = () => {
        setPlayer(INITIAL_PLAYER);
        setFloor(1);
        setLogs([]);
        setGameState("READY");
    };

    return (
        <div className="h-screen w-full bg-slate-900 text-white font-sans selection:bg-orange-500/30 overflow-hidden">
            <div className="max-w-md mx-auto h-full bg-black flex flex-col relative shadow-2xl border-x border-slate-800 overflow-hidden">

                {/* Header */}
                <header className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
                    <Link href="/minigame" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Link>
                    <div className="font-bold text-lg text-orange-500 tracking-wider">DUNGEON</div>

                    {/* 포인트 표시 */}
                    <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                        <Coins className="w-3.5 h-3.5 text-yellow-500" />
                        <span className="text-sm font-bold text-white">{userPoints.toLocaleString()}</span>
                    </div>
                </header>

                {/* Game Area */}
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">

                    {/* 1. Floor Info */}
                    <div className="text-center py-2 relative">
                        <span className="bg-slate-800 text-slate-300 px-4 py-1.5 rounded-full text-sm font-bold border border-slate-700">
                            B{floor} Floor
                        </span>

                        {/* 물약 구매 버튼 (우측 상단) */}
                        <button
                            onClick={buyPotion}
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-green-900/50 hover:bg-green-900 text-green-400 text-xs px-2 py-1 rounded border border-green-800 flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            물약 ({POTION_PRICE}P)
                        </button>
                    </div>

                    {/* 2. Monster Scene */}
                    <div className="relative h-48 bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl border border-slate-700 flex flex-col items-center justify-center p-6 shadow-inner">
                        <AnimatePresence mode="wait">
                            {gameState === "BATTLE" && monster ? (
                                <motion.div
                                    key="monster"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="text-center"
                                >
                                    <div className="text-6xl mb-4 animate-bounce-slow filter drop-shadow-lg">{monster.emoji}</div>
                                    <h3 className="font-bold text-lg text-slate-200 mb-2">{monster.name}</h3>
                                    <div className="w-48 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                                        <motion.div
                                            className="h-full bg-red-500"
                                            initial={{ width: "100%" }}
                                            animate={{ width: `${(monster.hp / monster.maxHp) * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">{monster.hp} / {monster.maxHp}</div>
                                </motion.div>
                            ) : gameState === "READY" ? (
                                <div className="text-center text-slate-500">
                                    <div className="text-5xl mb-3 opacity-50">🏰</div>
                                    <p>던전에 입장할 준비가 되었습니다.</p>
                                </div>
                            ) : gameState === "VICTORY" ? (
                                <div className="text-center text-yellow-500">
                                    <div className="text-5xl mb-3">✨</div>
                                    <p className="font-bold">VICTORY!</p>
                                </div>
                            ) : (
                                <div className="text-center text-red-500">
                                    <div className="text-5xl mb-3">☠️</div>
                                    <p className="font-bold">GAME OVER</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 3. Log Console */}
                    <div
                        ref={logContainerRef}
                        className="flex-1 bg-black/50 rounded-xl border border-slate-800 p-4 overflow-y-auto h-40 text-sm space-y-2 font-mono scrollbar-hide"
                    >
                        {logs.length === 0 ? (
                            <p className="text-slate-600 italic text-center text-xs mt-10">전투 기록이 여기에 표시됩니다.</p>
                        ) : (
                            logs.map((log, idx) => (
                                <p key={idx} className="text-slate-300 border-b border-slate-800/50 pb-1 last:border-0 transform transition-all animate-fade-in-up">
                                    {log}
                                </p>
                            ))
                        )}
                    </div>

                </div>

                {/* Controls */}
                <div className="bg-slate-900 p-6 border-t border-slate-800 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20">

                    {/* Player Stats Compact */}
                    <div className="flex items-center justify-between mb-6 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg border-2 border-orange-400">
                                {player.level}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-400">{player.hp}/{player.maxHp}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{ width: `${(player.mp / player.maxMp) * 100}%` }} />
                                    </div>
                                    <span className="text-[10px] text-slate-500">MP {player.mp}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-yellow-500 font-bold mb-1 flex items-center justify-end gap-1">
                                <span className="text-xs">💰</span> {player.gold}
                            </div>
                            <div className="text-slate-400 text-xs flex items-center gap-1 justify-end">
                                Potions: <span className="text-white font-bold">{player.potions}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        {gameState === "READY" || gameState === "VICTORY" ? (
                            <button
                                onClick={startGame}
                                className="col-span-2 bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {gameState === "READY" ? "던전 입장하기" : "다음 층으로 이동"}
                                <ArrowLeft className="w-5 h-5 rotate-180" />
                            </button>
                        ) : gameState === "DEFEAT" ? (
                            <button
                                onClick={handleRestart}
                                className="col-span-2 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                처음부터 다시하기
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleAttack}
                                    className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold text-base border border-slate-700 shadow-md active:scale-95 transition-all flex flex-col items-center gap-1 group"
                                >
                                    <Sword className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                                    공격
                                </button>
                                <button
                                    onClick={handleSkill}
                                    className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold text-base border border-slate-700 shadow-md active:scale-95 transition-all flex flex-col items-center gap-1 group"
                                >
                                    <Zap className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                    스킬 (MP 10)
                                </button>
                                <button
                                    onClick={handleHeal}
                                    className="bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-bold text-base border border-slate-700 shadow-md active:scale-95 transition-all flex flex-col items-center gap-1 group"
                                >
                                    <Heart className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                                    회복 ({player.potions})
                                </button>
                                <button
                                    onClick={() => addLog("🏃 도망칠 수 없습니다!")}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-400 py-4 rounded-xl font-bold text-base border border-slate-700 shadow-md active:scale-95 transition-all flex flex-col items-center gap-1 group"
                                >
                                    <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    도망
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
