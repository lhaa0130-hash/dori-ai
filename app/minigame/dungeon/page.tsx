"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Sword, Shield, Zap, Heart, MapPin, Package, Settings, Plus } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, getCottonCandyBalance, incrementMinigamePlays, spendCottonCandy } from "@/lib/cottonCandy";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type GameScreen = "TITLE" | "GAME" | "INVENTORY" | "SPECIAL_DUNGEON";
type WeaponType = "검" | "마단도" | "활" | "지팡이";
type Grade = "Z" | "Y" | "X" | "W" | "V" | "U" | "T" | "S" | "R" | "Q" | "P" | "O" | "N" | "M" | "L" | "K" | "J" | "I" | "H" | "G" | "F" | "E" | "D" | "C" | "B" | "A";

const GRADE_ORDER: Grade[] = ["Z", "Y", "X", "W", "V", "U", "T", "S", "R", "Q", "P", "O", "N", "M", "L", "K", "J", "I", "H", "G", "F", "E", "D", "C", "B", "A"];

interface Weapon {
  id: string;
  type: WeaponType;
  grade: Grade;
  enhancement: number; // 0~100
  orbs: string[]; // 오행 구슬 ids
  passives: string[]; // 패시브 이름들
}

interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  pAtk: number;
  mAtk: number;
  critRate: number; // 0~100 %
  evasion: number; // 0~50 %
  moveSpeed: number; // 1~500 %
  atkSpeed: number; // 1~1000 %
  critDmg: number; // 100~300 %
}

interface Player {
  level: number;
  exp: number;
  maxExp: number;
  stats: PlayerStats;
  weapon: Weapon;
  zone: number;
  gold: number;
  essences: number; // 정수
  x: number;
  y: number;
}

interface Enemy {
  id: string;
  type: string;
  zone: number;
  hp: number;
  maxHp: number;
  pAtk: number;
  mAtk: number;
  x: number;
  y: number;
  isBoss: boolean;
}

const ZONES_DATA = [
  { name: "초원", bosses: ["슬라임 킹"], color: "bg-green-900/20", enemyTypes: ["슬라임", "스라임"] },
  { name: "숲", bosses: ["고블린 우두머리"], color: "bg-emerald-900/20", enemyTypes: ["고블린", "고블린 검사"] },
  { name: "동굴", bosses: ["스켈레톤 로드"], color: "bg-slate-900/40", enemyTypes: ["스켈레톤", "해골 마법사"] },
  { name: "화산", bosses: ["불의 정령"], color: "bg-red-900/20", enemyTypes: ["불 원소", "라바 골렘"] },
  { name: "얼음 산맥", bosses: ["빙설의 여왕"], color: "bg-blue-900/20", enemyTypes: ["얼음 정령", "빙결 공룡"] },
  { name: "어두운 숲", bosses: ["밤의 군주"], color: "bg-purple-900/20", enemyTypes: ["어둠 해골", "환상의 사냥꾼"] },
  { name: "비의 늪", bosses: ["늪의 타이탄"], color: "bg-lime-900/20", enemyTypes: ["독 거미", "습지 괴물"] },
  { name: "하늘 성", bosses: ["천사 기사"], color: "bg-cyan-900/20", enemyTypes: ["빛의 영혼", "천상의 수호자"] },
  { name: "지옥 문", bosses: ["악마 군장"], color: "bg-orange-900/20", enemyTypes: ["악마", "불타는 악마"] },
  { name: "신의 영역", bosses: ["신의 화신"], color: "bg-indigo-900/30", enemyTypes: ["신성한 존재", "차원의 틈"] },
];

const WEAPON_INFO: Record<WeaponType, { range: number; dmgType: "p" | "m"; passives: string[] }> = {
  "검": { range: 3, dmgType: "p", passives: ["공격력 증가", "거인 베기", "갑옷 파괴", "휩쓸기", "처형"] },
  "마단도": { range: 3, dmgType: "m", passives: ["마법 공속 증가", "마력 역류", "잔상 베기", "마력 약화", "무아지경"] },
  "활": { range: 8, dmgType: "p", passives: ["공격 속도 증가", "더블 샷", "급소 사격", "발목 저격", "집중력 유지"] },
  "지팡이": { range: 8, dmgType: "m", passives: ["마법 공격력 증가", "마력 폭발", "원소 과부하", "정신 집중", "보호막"] },
};

// ============================================================================
// GAME COMPONENT
// ============================================================================

export default function DoriCraft() {
  const { session } = useAuth();
  const [screen, setScreen] = useState<GameScreen>("TITLE");
  const [userPoints, setUserPoints] = useState(0);
  const [player, setPlayer] = useState<Player>(() => ({
    level: 1,
    exp: 0,
    maxExp: 100,
    stats: {
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100,
      pAtk: 1,
      mAtk: 1,
      critRate: 0,
      evasion: 0,
      moveSpeed: 100,
      atkSpeed: 100,
      critDmg: 100,
    },
    weapon: {
      id: "sword-z-0",
      type: "검",
      grade: "Z",
      enhancement: 0,
      orbs: [],
      passives: WEAPON_INFO["검"].passives,
    },
    zone: 0,
    gold: 0,
    essences: 0,
    x: 7,
    y: 7,
  }));

  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const keysPressed = useRef<Set<string>>(new Set());
  const lastAttackRef = useRef<number>(0);

  // ========== INITIALIZATION & SAVE/LOAD ==========

  useEffect(() => {
    if (session?.user?.email) {
      setUserPoints(getCottonCandyBalance(session.user.email));
      loadProgress(session.user.email);
    }
  }, [session]);

  const saveProgress = (email: string) => {
    const data = JSON.stringify({ player, zone: player.zone });
    localStorage.setItem(`dori_craft_${email}`, data);
  };

  const loadProgress = (email: string) => {
    const data = localStorage.getItem(`dori_craft_${email}`);
    if (data) {
      try {
        const { player: saved } = JSON.parse(data);
        setPlayer(saved);
        setScreen("GAME");
        addLog(`✅ 게임 데이터 로드됨. Zone ${saved.zone + 1}`);
      } catch (e) {
        console.error("Load error:", e);
      }
    }
  };

  // ========== GAME LOOP ==========

  useEffect(() => {
    if (screen !== "GAME") return;

    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.key.toUpperCase());
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toUpperCase());

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    gameLoopRef.current = setInterval(() => {
      setPlayer((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        const moveSpeed = prev.stats.moveSpeed / 100;

        if (keysPressed.current.has("W") && newY > 0) newY -= moveSpeed;
        if (keysPressed.current.has("S") && newY < 14) newY += moveSpeed;
        if (keysPressed.current.has("A") && newX > 0) newX -= moveSpeed;
        if (keysPressed.current.has("D") && newX < 14) newX += moveSpeed;

        return { ...prev, x: newX, y: newY };
      });

      // Auto-attack enemies in range
      const now = Date.now();
      if (now - lastAttackRef.current > 500) {
        setPlayer((prev) => {
          const range = WEAPON_INFO[prev.weapon.type].range;
          const nearby = enemies.filter(
            (e) => Math.hypot(e.x - prev.x, e.y - prev.y) <= range
          );

          if (nearby.length > 0) {
            const target = nearby[0];
            const dmgType = WEAPON_INFO[prev.weapon.type].dmgType;
            const atk = dmgType === "p" ? prev.stats.pAtk : prev.stats.mAtk;
            const baseDmg = atk * (0.8 + Math.random() * 0.4) * (prev.stats.atkSpeed / 100);
            const isCrit = Math.random() * 100 < prev.stats.critRate;
            const finalDmg = isCrit ? baseDmg * (prev.stats.critDmg / 100) : baseDmg;

            setEnemies((prev) =>
              prev
                .map((e) =>
                  e.id === target.id ? { ...e, hp: Math.max(0, e.hp - finalDmg) } : e
                )
                .filter((e) => e.hp > 0 || !e.isBoss)
            );

            addLog(`⚔️ ${isCrit ? "[크리티컬!] " : ""}${target.type}에게 ${Math.floor(finalDmg)} 피해!`);
            lastAttackRef.current = now;
          }

          return prev;
        });
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [screen, enemies]);

  // ========== SPAWN ENEMIES ==========

  useEffect(() => {
    if (screen === "GAME") {
      const zoneData = ZONES_DATA[player.zone];
      const newEnemies: Enemy[] = [];

      for (let i = 0; i < 3 + player.zone; i++) {
        newEnemies.push({
          id: `${player.zone}-${i}`,
          type: zoneData.enemyTypes[Math.floor(Math.random() * zoneData.enemyTypes.length)],
          zone: player.zone,
          hp: 50 + player.zone * 30,
          maxHp: 50 + player.zone * 30,
          pAtk: 5 + player.zone * 2,
          mAtk: 5 + player.zone * 2,
          x: Math.random() * 15,
          y: Math.random() * 15,
          isBoss: false,
        });
      }

      // Add boss
      newEnemies.push({
        id: "boss",
        type: zoneData.bosses[0],
        zone: player.zone,
        hp: 200 + player.zone * 100,
        maxHp: 200 + player.zone * 100,
        pAtk: 20 + player.zone * 10,
        mAtk: 20 + player.zone * 10,
        x: 7,
        y: 7,
        isBoss: true,
      });

      setEnemies(newEnemies);
    }
  }, [screen, player.zone]);

  // ========== HELPERS ==========

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg].slice(-8));
  };

  const nextZone = () => {
    if (player.zone < 9) {
      setPlayer((prev) => ({ ...prev, zone: prev.zone + 1, x: 7, y: 7 }));
      if (session?.user?.email) saveProgress(session.user.email);
      addLog(`➡️ Zone ${player.zone + 2}로 이동!`);
    } else {
      addLog("🏆 모든 존을 클리어했습니다!");
    }
  };

  const enhanceWeapon = () => {
    if (player.gold < 100) {
      addLog("💰 강화석이 부족합니다!");
      return;
    }

    setPlayer((prev) => ({
      ...prev,
      weapon:
        prev.weapon.enhancement < 100
          ? { ...prev.weapon, enhancement: prev.weapon.enhancement + 1 }
          : { ...prev.weapon, grade: GRADE_ORDER[GRADE_ORDER.indexOf(prev.weapon.grade) + 1] || "A", enhancement: 0 },
      gold: prev.gold - 100,
    }));

    addLog("✨ 무기가 강화되었습니다!");
  };

  // ========== UI ==========

  if (screen === "TITLE") {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-slate-950 to-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-7xl mb-4">⚔️</div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-wider">도리 크래프트</h1>
          <p className="text-slate-400 mb-8">성장형 자동 RPG 게임</p>
          <button
            onClick={() => setScreen("GAME")}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all"
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  if (screen === "INVENTORY") {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6 bg-slate-900 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">⚔️ 무기 관리</h2>
            <button onClick={() => setScreen("GAME")} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg mb-4 border border-slate-700">
            <p className="text-slate-300 text-sm mb-2">현재 무기</p>
            <p className="text-xl font-bold text-white mb-1">
              {player.weapon.type} {player.weapon.grade}+{player.weapon.enhancement}
            </p>
            <p className="text-slate-400 text-sm">P.ATK: {player.stats.pAtk} | M.ATK: {player.stats.mAtk}</p>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">강화 수치</span>
              <span className="text-white font-bold">{player.weapon.enhancement}/100</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${player.weapon.enhancement}%` }}
              />
            </div>
          </div>

          <button
            onClick={enhanceWeapon}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg active:scale-95 transition-all mb-4"
          >
            강화하기 (비용: 100)
          </button>

          <div className="text-slate-400 text-sm">
            <p>💰 소유 골드: {player.gold}</p>
            <p>정수: {player.essences}</p>
          </div>
        </div>
      </div>
    );
  }

  const zoneData = ZONES_DATA[player.zone];

  return (
    <div className="h-screen w-full bg-slate-950 text-white font-sans overflow-hidden">
      <div className="max-w-md mx-auto h-full flex flex-col bg-black border-x border-slate-800">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-800">
          <Link href="/minigame" className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <span className="font-bold text-orange-500">Zone {player.zone + 1}</span>
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full">
            <span className="text-xs text-yellow-500 font-bold">{userPoints}</span>
          </div>
        </div>

        {/* GAME WORLD */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-black overflow-hidden">
          <div className={`absolute inset-0 ${zoneData.color} transition-all`} />

          {/* GRID */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full h-px bg-slate-700"
                style={{ top: `${(i / 15) * 100}%` }}
              />
            ))}
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full w-px bg-slate-700"
                style={{ left: `${(i / 15) * 100}%` }}
              />
            ))}
          </div>

          {/* ENEMIES */}
          {enemies.map((enemy) => (
            <div
              key={enemy.id}
              className={`absolute w-8 h-8 flex items-center justify-center rounded transition-all ${
                enemy.isBoss ? "text-2xl animate-pulse" : "text-lg"
              }`}
              style={{
                left: `${(enemy.x / 15) * 100}%`,
                top: `${(enemy.y / 15) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {enemy.isBoss ? "👹" : ["💧", "👺", "💀", "👹"][Math.floor(Math.random() * 4)]}
              <div className="absolute bottom-full mb-1 text-xs text-red-400 font-bold">
                {Math.floor(enemy.hp)}
              </div>
            </div>
          ))}

          {/* PLAYER */}
          <motion.div
            className="absolute w-6 h-6 bg-white rounded flex items-center justify-center text-xs font-bold"
            animate={{ x: `${(player.x / 15) * 100}%`, y: `${(player.y / 15) * 100}%` }}
            transition={{ type: "linear", duration: 0.05 }}
            style={{ transform: "translate(-50%, -50%)" }}
          >
            {player.weapon.type === "검" ? "⚔️" : player.weapon.type === "활" ? "🏹" : "🔱"}
          </motion.div>

          {/* RANGE INDICATOR */}
          <div
            className="absolute border-2 border-white/20 rounded-full pointer-events-none"
            style={{
              width: `${(WEAPON_INFO[player.weapon.type].range / 15) * 100}%`,
              height: `${(WEAPON_INFO[player.weapon.type].range / 15) * 100}%`,
              left: `${(player.x / 15) * 100}%`,
              top: `${(player.y / 15) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        {/* STATS PANEL */}
        <div className="bg-slate-900/50 border-t border-slate-800 p-4 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">HP</span>
            <div className="flex-1 mx-2 h-1.5 bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${(player.stats.hp / player.stats.maxHp) * 100}%` }} />
            </div>
            <span className="text-red-400 font-bold">{Math.floor(player.stats.hp)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">MP</span>
            <div className="flex-1 mx-2 h-1.5 bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${(player.stats.mp / player.stats.maxMp) * 100}%` }} />
            </div>
            <span className="text-blue-400 font-bold">{Math.floor(player.stats.mp)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>Lv. {player.level}</div>
            <div>💰 {player.gold}</div>
            <div>P.ATK {Math.floor(player.stats.pAtk)}</div>
            <div>M.ATK {Math.floor(player.stats.mAtk)}</div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-slate-900/80 border-t border-slate-800 p-4 space-y-3">
          <div className="text-xs text-slate-400 text-center">WASD: 이동 | 자동 공격</div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setScreen("INVENTORY")}
              className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Package className="w-4 h-4" /> 무기
            </button>
            <button
              onClick={nextZone}
              className="bg-orange-600 hover:bg-orange-500 text-white py-2 rounded font-bold text-sm active:scale-95 transition-all"
            >
              다음 존
            </button>
          </div>

          <div className="bg-slate-800/30 rounded p-2 max-h-16 overflow-y-auto text-xs space-y-1">
            {logs.map((log, i) => (
              <p key={i} className="text-slate-300">
                {log}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
