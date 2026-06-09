"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Zap, Coins, Hammer, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays } from "@/lib/cottonCandy";
import PlaytimeRewardToast from "@/components/game/PlaytimeRewardToast";

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------

const MONSTER_LIST = [
    { name: "훈련용 허수아비", hp: 50, emoji: "🎃" },
    { name: "숲의 슬라임", hp: 150, emoji: "💧" },
    { name: "화난 버섯", hp: 400, emoji: "🍄" },
    { name: "동굴 박쥐", hp: 1000, emoji: "🦇" },
    { name: "고대 골렘", hp: 2500, emoji: "🗿" },
    { name: "화산 도마뱀", hp: 6000, emoji: "🦎" },
    { name: "심해 문어", hp: 15000, emoji: "🐙" },
    { name: "보스 드래곤", hp: 50000, emoji: "🐉" },
    { name: "외계 침략자", hp: 150000, emoji: "👽" },
    { name: "우주신", hp: 999999, emoji: "☄️" },
];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function ClickerGame() {
    const { session } = useAuth();
    const [stage, setStage] = useState(0);
    const [currentHp, setCurrentHp] = useState(MONSTER_LIST[0].hp);
    const [gold, setGold] = useState(0);

    // Stats
    const [clickDamage, setClickDamage] = useState(1);
    const [autoDamage, setAutoDamage] = useState(0);

    // Upgrade Costs
    const [clickUpgradeCost, setClickUpgradeCost] = useState(10);
    const [autoUpgradeCost, setAutoUpgradeCost] = useState(50);

    // Click Effect
    const [clickEffect, setClickEffect] = useState<{ id: number, x: number, y: number, text: string }[]>([]);

    // 1초마다 자동 공격
    useEffect(() => {
        if (autoDamage === 0) return;
        const interval = setInterval(() => {
            handleDamage(autoDamage, false); // false = not manual
        }, 1000);
        return () => clearInterval(interval);
    }, [autoDamage, stage, currentHp]);

    // 데미지 처리
    const handleDamage = (amount: number, isClick: boolean) => {
        setCurrentHp((prev) => {
            const newHp = Math.max(0, prev - amount);
            if (newHp === 0) {
                // 몬스터 처치
                handleKill();
                // 다음 스테이지 몬스터 hp로 리턴되므로 여기서 바로 업데이트 하면 안되고
                // Kill 함수 내에서 처리하거나 useEffect로 감지
                return 0; // 일단 0
            }
            return newHp;
        });

        if (isClick) {
            // 골드 획득 (데미지의 10%만큼?) -> 너무 많을 수 있으니 고정값 + 랜덤 치명타
            const goldGain = Math.ceil(amount * 0.5); // 데미지의 절반 골드 획득
            setGold((prev) => prev + goldGain);
        }
    };

    // 몬스터 처치 처리
    const handleKill = () => {
        const reward = Math.floor(MONSTER_LIST[stage].hp * 0.2); // 최대 체력의 20% 보너스
        setGold((prev) => prev + reward);
        // 솜사탕 지급 및 미니게임 플레이 카운트
        if (session?.user?.email) {
            addCottonCandy(session.user.email, 20, "클릭커 스테이지 클리어");
            incrementMinigamePlays(session.user.email);
        }

        // 이펙트
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
        });

        // 다음 스테이지
        setTimeout(() => {
            const nextStage = (stage + 1) % MONSTER_LIST.length;
            setStage(nextStage);
            setCurrentHp(MONSTER_LIST[nextStage].hp);
        }, 500);
    };

    // 클릭 핸들러
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // 좌표 계산
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 데미지 적용
        handleDamage(clickDamage, true);

        // 이펙트 추가
        const id = Date.now();
        setClickEffect((prev) => [...prev, { id, x, y, text: `-${clickDamage}` }]);

        // 이펙트 제거
        setTimeout(() => {
            setClickEffect((prev) => prev.filter((item) => item.id !== id));
        }, 800);
    };

    // 업그레이드
    const upgradeClick = () => {
        if (gold >= clickUpgradeCost) {
            setGold((prev) => prev - clickUpgradeCost);
            setClickDamage((prev) => prev + Math.ceil(prev * 0.5)); // +50% 증가
            setClickUpgradeCost((prev) => Math.floor(prev * 1.8)); // 비용 1.8배 증가
        }
    };

    const upgradeAuto = () => {
        if (gold >= autoUpgradeCost) {
            setGold((prev) => prev - autoUpgradeCost);
            setAutoDamage((prev) => prev + (prev === 0 ? 5 : Math.ceil(prev * 0.4))); // 첫 구매시 5, 이후 +40%
            setAutoUpgradeCost((prev) => Math.floor(prev * 1.8));
        }
    };

    const monster = MONSTER_LIST[stage];

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-yellow-500/30">
            <PlaytimeRewardToast />
            <div className="max-w-md mx-auto min-h-screen bg-black flex flex-col relative shadow-2xl border-x border-neutral-800">

                {/* Header */}
                <header className="flex items-center justify-between p-4 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-50">
                    <Link href="/minigame" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-neutral-400" />
                    </Link>
                    <div className="font-bold text-lg text-yellow-500 tracking-wider flex items-center gap-1">
                        BOSS CLICKER
                    </div>
                    <div className="flex items-center gap-1 bg-neutral-800 px-3 py-1 rounded-full border border-neutral-700">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        <span className="text-sm font-bold text-white">{gold.toLocaleString()}</span>
                    </div>
                </header>

                {/* Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">

                    {/* Stage Info */}
                    <div className="absolute top-6">
                        <span className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                            Stage {stage + 1}
                        </span>
                        <h2 className="text-2xl font-bold text-white mt-1">{monster.name}</h2>
                    </div>

                    {/* Monster HP Bar */}
                    <div className="absolute top-20 w-48 h-4 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
                        <motion.div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400"
                            initial={false}
                            animate={{ width: `${(currentHp / monster.hp) * 100}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </div>
                    <div className="absolute top-24 mt-1 text-xs text-neutral-400 font-mono">
                        {currentHp.toLocaleString()} / {monster.hp.toLocaleString()}
                    </div>

                    {/* Main Monster Click Area */}
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={handleClick}
                        className="w-64 h-64 flex items-center justify-center cursor-pointer relative z-10 select-none -mt-10"
                    >
                        <div className="text-9xl filter drop-shadow-[0_0_30px_rgba(255,165,0,0.3)] animate-bounce-slow transform transition-transform hover:scale-105 active:scale-95 duration-100">
                            {monster.emoji}
                        </div>

                        {/* Click Effects */}
                        <AnimatePresence>
                            {clickEffect.map((effect) => (
                                <motion.div
                                    key={effect.id}
                                    initial={{ opacity: 1, y: 0, scale: 0.5 }}
                                    animate={{ opacity: 0, y: -100, scale: 1.5 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute text-4xl font-bold text-red-500 pointer-events-none"
                                    style={{ left: effect.x, top: effect.y }}
                                >
                                    {effect.text}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Auto Damage Indicator */}
                    <div className="absolute bottom-6 flex items-center gap-2 text-neutral-400 text-sm">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>DPS: {autoDamage.toLocaleString()}</span>
                    </div>

                </div>

                {/* Upgrade Panel */}
                <div className="bg-neutral-900 border-t border-neutral-800 p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                    <h3 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-wider">Upgrades</h3>

                    <div className="space-y-3">
                        {/* Click Upgrade */}
                        <button
                            onClick={upgradeClick}
                            disabled={gold < clickUpgradeCost}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${gold >= clickUpgradeCost
                                    ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white cursor-pointer active:scale-[0.98]"
                                    : "bg-neutral-900/50 border-neutral-800 text-neutral-600 cursor-not-allowed"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gold >= clickUpgradeCost ? "bg-red-500/20 text-red-500" : "bg-neutral-800 text-neutral-600"}`}>
                                    <Hammer className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">Attack Power</div>
                                    <div className="text-xs text-neutral-400">Current: {clickDamage}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-yellow-500 font-bold text-sm flex items-center justify-end gap-1">
                                    <Coins className="w-3 h-3" />
                                    {clickUpgradeCost.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-green-500 font-bold">+50% DMG</div>
                            </div>
                        </button>

                        {/* Auto Upgrade */}
                        <button
                            onClick={upgradeAuto}
                            disabled={gold < autoUpgradeCost}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${gold >= autoUpgradeCost
                                    ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-white cursor-pointer active:scale-[0.98]"
                                    : "bg-neutral-900/50 border-neutral-800 text-neutral-600 cursor-not-allowed"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gold >= autoUpgradeCost ? "bg-blue-500/20 text-blue-500" : "bg-neutral-800 text-neutral-600"}`}>
                                    <Crown className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">Auto Hunter</div>
                                    <div className="text-xs text-neutral-400">Current: {autoDamage}/sec</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-yellow-500 font-bold text-sm flex items-center justify-end gap-1">
                                    <Coins className="w-3 h-3" />
                                    {autoUpgradeCost.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-green-500 font-bold">+40% DPS</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
