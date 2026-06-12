"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Zap, Coins, Hammer, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, incrementMinigamePlays, addExp } from "@/lib/cottonCandy";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import PlaytimeRewardToast from "@/components/game/PlaytimeRewardToast";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

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
    const [kills, setKills] = useState(0); // 누적 보스 처치 수 (명예의 전당 기록)

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
            addExp(session.user.email, 3, "보스 처치");
        }

        // 누적 처치 수 기록 (명예의 전당) — 과도한 쓰기 방지 위해 1회차/3회마다 등록
        setKills((prev) => {
            const nk = prev + 1;
            if (session?.user?.email && (nk === 1 || nk % 3 === 0)) {
                submitScore("clicker", session.user.name || "플레이어", nk, "desc");
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: "clicker" }));
                }
            }
            return nk;
        });

        // 이펙트 (보스급 처치는 큰 축하)
        if (MONSTER_LIST[stage].hp >= 2500) {
            bigBurst();
        } else {
            burst();
        }

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
        <div className="relative min-h-screen overflow-hidden bg-[#09090e] text-white font-sans selection:bg-[#F9954E]/30">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />
            <PlaytimeRewardToast />
            <div className="max-w-md mx-auto min-h-screen flex flex-col relative z-10 border-x border-white/5">

                {/* Header */}
                <header className="flex items-center justify-between p-4 bg-[#09090e]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
                    <Link href="/minigame" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        뒤로
                    </Link>
                    <div className="text-[15px] font-extrabold tracking-tight text-white">
                        ⚔️ 보스 클리커
                    </div>
                    <div className="arcade-card rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-center">
                        <div className="text-[9px] uppercase tracking-widest text-neutral-500">Gold</div>
                        <div className="text-sm font-bold text-white tabular-nums flex items-center justify-center gap-1">
                            <Coins className="w-3 h-3 text-[#F9954E]" />
                            <CountUp value={gold} className="tabular-nums" />
                        </div>
                    </div>
                </header>

                {/* Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">

                    {/* Stage Info */}
                    <div className="absolute top-6 text-center arcade-rise">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold tabular-nums inline-flex items-center justify-center gap-1">
                            Stage {stage + 1} · 처치 <CountUp value={kills} className="tabular-nums" />
                        </span>
                        <h2 key={stage} className="arcade-pop text-2xl font-extrabold tracking-tight text-white mt-1">{monster.name}</h2>
                    </div>

                    {/* Monster HP Bar */}
                    <div className="absolute top-20 w-48 h-4 bg-white/[0.06] rounded-full overflow-hidden border border-white/10">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#F9954E] to-[#E8832E]"
                            initial={false}
                            animate={{ width: `${(currentHp / monster.hp) * 100}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </div>
                    <div className="absolute top-24 mt-1 text-xs text-neutral-400 font-mono tabular-nums">
                        {currentHp.toLocaleString()} / {monster.hp.toLocaleString()}
                    </div>

                    {/* Main Monster Click Area */}
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={handleClick}
                        className="w-64 h-64 flex items-center justify-center cursor-pointer relative z-10 select-none -mt-10"
                    >
                        <div className="text-9xl filter drop-shadow-[0_0_30px_rgba(249,149,78,0.25)] arcade-float animate-bounce-slow transform transition-transform hover:scale-105 active:scale-95 duration-100">
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
                                    className="absolute text-4xl font-bold text-[#F9954E] tabular-nums pointer-events-none"
                                    style={{ left: effect.x, top: effect.y }}
                                >
                                    {effect.text}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Auto Damage Indicator */}
                    <div className="absolute bottom-6 flex items-center gap-2 text-neutral-400 text-sm tabular-nums">
                        <Zap className="w-4 h-4 text-[#F9954E]" />
                        <span className="inline-flex items-center gap-1">DPS: <CountUp value={autoDamage} className="tabular-nums" /></span>
                    </div>

                </div>

                {/* Upgrade Panel */}
                <div className="arcade-card arcade-rise bg-gradient-to-b from-white/[0.06] to-white/[0.02] border-t border-white/10 p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                    <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-4">Upgrades</h3>

                    <div className="space-y-3">
                        {/* Click Upgrade */}
                        <button
                            onClick={upgradeClick}
                            disabled={gold < clickUpgradeCost}
                            className={`arcade-rise-1 arcade-shine w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.97] ${gold >= clickUpgradeCost
                                    ? "arcade-glow bg-white/[0.06] border-white/10 hover:bg-white/[0.1] text-neutral-200 cursor-pointer"
                                    : "bg-white/[0.02] border-white/5 text-neutral-600 opacity-40 cursor-not-allowed"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gold >= clickUpgradeCost ? "bg-[#F9954E]/15 text-[#F9954E]" : "bg-white/[0.04] text-neutral-600"}`}>
                                    <Hammer className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">Attack Power</div>
                                    <div className="text-xs text-neutral-400 flex items-center gap-1">Current: <CountUp value={clickDamage} className="tabular-nums" /></div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-yellow-500 font-bold text-sm flex items-center justify-end gap-1">
                                    <Coins className="w-3 h-3" />
                                    <CountUp value={clickUpgradeCost} className="tabular-nums" />
                                </div>
                                <div className="text-[10px] text-green-500 font-bold">+50% DMG</div>
                            </div>
                        </button>

                        {/* Auto Upgrade */}
                        <button
                            onClick={upgradeAuto}
                            disabled={gold < autoUpgradeCost}
                            className={`arcade-rise-2 arcade-shine w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.97] ${gold >= autoUpgradeCost
                                    ? "arcade-glow bg-white/[0.06] border-white/10 hover:bg-white/[0.1] text-white cursor-pointer"
                                    : "bg-white/[0.02] border-white/5 text-neutral-600 opacity-40 cursor-not-allowed"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${gold >= autoUpgradeCost ? "bg-blue-500/20 text-blue-400" : "bg-white/[0.04] text-neutral-600"}`}>
                                    <Crown className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">Auto Hunter</div>
                                    <div className="text-xs text-neutral-400 flex items-center gap-1">Current: <CountUp value={autoDamage} className="tabular-nums" />/sec</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-yellow-500 font-bold text-sm flex items-center justify-end gap-1">
                                    <Coins className="w-3 h-3" />
                                    <CountUp value={autoUpgradeCost} className="tabular-nums" />
                                </div>
                                <div className="text-[10px] text-green-500 font-bold">+40% DPS</div>
                            </div>
                        </button>
                    </div>

                    {/* 명예의 전당 — 보스 처치 랭킹 */}
                    <div className="mt-4">
                        <GameLeaderboard game="clicker" title="보스 처치 랭킹 TOP 5" unit="킬" order="desc" tone="dark" />
                    </div>

                    <GameSuggestion />
                </div>
            </div>
        </div>
    );
}
