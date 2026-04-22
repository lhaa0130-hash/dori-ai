"use client";

/**
 * 도리 크래프트 — Vampire Survivors 스타일
 * ─ WASD 이동 (또는 모바일 조이스틱)
 * ─ 무기가 자동으로 360° 공격
 * ─ 몬스터가 사방에서 끊임없이 몰려옴
 * ─ 킬 → 스탯 성장, 시간 경과 → 난이도 상승
 * ─ 기획서 무기/등급/오행 구슬 시스템 그대로 유지
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { addCottonCandy, getCottonCandyBalance, incrementMinigamePlays } from "@/lib/cottonCandy";

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════
const W = 640;   // canvas logical width
const H = 480;   // canvas logical height
const WORLD = 3000; // world size (enemies spawn within this)

type WeaponType = "검" | "마단도" | "활" | "지팡이";
type Grade = "Z"|"Y"|"X"|"W"|"V"|"U"|"T"|"S"|"R"|"Q"|"P"|"O"|"N"|"M"|"L"|"K"|"J"|"I"|"H"|"G"|"F"|"E"|"D"|"C"|"B"|"A";
const GRADES: Grade[] = ["Z","Y","X","W","V","U","T","S","R","Q","P","O","N","M","L","K","J","I","H","G","F","E","D","C","B","A"];

interface Vec2 { x: number; y: number; }

interface Player {
  x: number; y: number;
  hp: number; maxHp: number;
  mp: number; maxMp: number;
  pAtk: number; mAtk: number;
  critRate: number;   // 0-100
  evasion: number;    // 0-50
  moveSpeed: number;  // px/s (base 160)
  atkSpeed: number;   // ms between attacks (base 800)
  critDmg: number;    // multiplier 1.0-3.0
  level: number;
  exp: number;
  expToNext: number;
  essences: number;
  gold: number;
}

interface Enemy {
  id: number;
  x: number; y: number;
  hp: number; maxHp: number;
  atk: number;
  speed: number;
  emoji: string;
  name: string;
  isBoss: boolean;
  lastAtkTime: number;
  flashTimer: number; // ms remaining for hit flash
}

interface Projectile {
  id: number;
  x: number; y: number;
  vx: number; vy: number;
  dmg: number;
  crit: boolean;
  pierce: number;    // remaining pierce count
  radius: number;
  color: string;
  life: number;      // ms remaining
}

interface FloatText {
  id: number;
  x: number; y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  alpha: number;
}

interface Weapon {
  type: WeaponType;
  grade: Grade;
  enh: number;       // 0-100
  orbs: string[];    // 오행 구슬
}

interface ZoneConfig {
  name: string;
  bgColor: string;
  groundColor: string;
  enemies: { name:string; emoji:string; hpBase:number; atkBase:number; speed:number }[];
  bossName: string;
  bossEmoji: string;
  bossHp: number;
  bossAtk: number;
  bossSpeed: number;
  spawnRate: number; // ms between spawns
  spawnCount: number;
}

const ZONES: ZoneConfig[] = [
  { name:"초원", bgColor:"#0d1f0d", groundColor:"#142814",
    enemies:[{name:"슬라임",emoji:"💧",hpBase:40,atkBase:6,speed:60},{name:"들쥐",emoji:"🐀",hpBase:30,atkBase:5,speed:90}],
    bossName:"슬라임 왕",bossEmoji:"👑",bossHp:800,bossAtk:18,bossSpeed:50,spawnRate:1200,spawnCount:2 },
  { name:"어두운 숲", bgColor:"#0a140a", groundColor:"#111a11",
    enemies:[{name:"고블린",emoji:"👺",hpBase:80,atkBase:12,speed:80},{name:"독거미",emoji:"🕷",hpBase:65,atkBase:15,speed:110}],
    bossName:"고블린 족장",bossEmoji:"🗡️",bossHp:1800,bossAtk:35,bossSpeed:65,spawnRate:900,spawnCount:3 },
  { name:"동굴", bgColor:"#0d0d18", groundColor:"#141420",
    enemies:[{name:"스켈레톤",emoji:"💀",hpBase:130,atkBase:20,speed:70},{name:"박쥐",emoji:"🦇",hpBase:90,atkBase:16,speed:130}],
    bossName:"스켈레톤 로드",bossEmoji:"☠️",bossHp:3200,bossAtk:55,bossSpeed:55,spawnRate:750,spawnCount:4 },
  { name:"화산", bgColor:"#1a0900", groundColor:"#251200",
    enemies:[{name:"불 원소",emoji:"🔥",hpBase:190,atkBase:30,speed:85},{name:"라바 골렘",emoji:"🌋",hpBase:240,atkBase:25,speed:50}],
    bossName:"불의 정령",bossEmoji:"🌟",bossHp:5500,bossAtk:80,bossSpeed:60,spawnRate:650,spawnCount:5 },
  { name:"얼음 산맥", bgColor:"#000d18", groundColor:"#001525",
    enemies:[{name:"얼음 정령",emoji:"❄️",hpBase:270,atkBase:42,speed:75},{name:"빙설 늑대",emoji:"🐺",hpBase:250,atkBase:38,speed:120}],
    bossName:"빙설의 여왕",bossEmoji:"🧊",bossHp:9000,bossAtk:120,bossSpeed:70,spawnRate:500,spawnCount:6 },
];

const WEAPON_INFO: Record<WeaponType, { range:number; dmg:"p"|"m"; emoji:string; projColor:string; pierce:number; projCount:number; projSpeed:number }> = {
  "검":     { range:90,  dmg:"p", emoji:"⚔️", projColor:"#ffffffcc", pierce:0, projCount:3, projSpeed:0   },  // 근거리 360° 슬래시
  "마단도": { range:110, dmg:"m", emoji:"🔱", projColor:"#a78bfacc", pierce:1, projCount:4, projSpeed:0   },  // 마법 근거리 넓은 범위
  "활":     { range:320, dmg:"p", emoji:"🏹", projColor:"#fbbf24cc", pierce:0, projCount:2, projSpeed:420  }, // 원거리 화살
  "지팡이": { range:350, dmg:"m", emoji:"🪄", projColor:"#60a5facc", pierce:2, projCount:1, projSpeed:380  }, // 원거리 관통 마법
};

const ORBS = ["水","金","地","火","木"];
const ORB_DESC: Record<string,string> = {
  "水":"적 감속","金":"치명 +10%","地":"기절 10%","火":"화상 DoT","木":"흡혈 5%",
};
const ORB_COLORS: Record<string,string> = {
  "水":"#38bdf8","金":"#fbbf24","地":"#a3a3a3","火":"#f97316","木":"#4ade80",
};

// Max orb slots per grade index (Z=0 → A=25)
function maxOrbSlots(gradeIdx: number): number {
  if (gradeIdx <= 2)  return 1; // Z,Y,X
  if (gradeIdx <= 4)  return 2; // W,V
  if (gradeIdx <= 6)  return 3; // U,T
  if (gradeIdx <= 9)  return 4; // S,R,Q
  if (gradeIdx <= 13) return 5; // P~L
  if (gradeIdx <= 18) return 7; // K~F
  return 9;                      // E~A
}

// ═══════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════
let _id = 0;
const uid = () => ++_id;

function randEdge(cx:number, cy:number, margin:number): Vec2 {
  const side = Math.floor(Math.random()*4);
  const spread = 600;
  if (side===0) return { x: cx + (Math.random()-0.5)*spread, y: cy - margin };
  if (side===1) return { x: cx + (Math.random()-0.5)*spread, y: cy + margin };
  if (side===2) return { x: cx - margin, y: cy + (Math.random()-0.5)*spread };
               return { x: cx + margin, y: cy + (Math.random()-0.5)*spread };
}

function normalize(dx:number, dy:number): Vec2 {
  const len = Math.sqrt(dx*dx+dy*dy) || 1;
  return { x: dx/len, y: dy/len };
}

// ═══════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════
export default function DoriCraft() {
  const { session, status } = useAuth();
  const isLoggedIn = status === "authenticated" && !!session;

  type Screen = "TITLE"|"WEAPON_SELECT"|"GAME"|"PAUSED"|"DEAD"|"LEVEL_UP"|"INVENTORY";
  const [screen, setScreen] = useState<Screen>("TITLE");
  const [userPoints, setUserPoints]     = useState(0);
  const [showNudge, setShowNudge]       = useState(false);
  const [zone, setZone]                 = useState(0);
  const [weapon, setWeapon]             = useState<Weapon>({ type:"검", grade:"Z", enh:0, orbs:[] });
  const [playerSnap, setPlayerSnap]     = useState<Player | null>(null); // for HUD
  const [levelUpChoices, setLevelUpChoices] = useState<string[]>([]);
  const [killCount, setKillCount]       = useState(0);
  const [elapsed, setElapsed]           = useState(0); // seconds
  const [bossSpawned, setBossSpawned]   = useState(false);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── game state refs (avoid stale closure in RAF)
  const playerRef     = useRef<Player>(makePlayer());
  const enemiesRef    = useRef<Enemy[]>([]);
  const projsRef      = useRef<Projectile[]>([]);
  const floatsRef     = useRef<FloatText[]>([]);
  const keysRef       = useRef<Set<string>>(new Set());
  const zoneRef       = useRef(0);
  const weaponRef     = useRef<Weapon>({ type:"검", grade:"Z", enh:0, orbs:[] });
  const lastPlayerAtkRef = useRef(0);
  const lastSpawnRef  = useRef(0);
  const elapsedRef    = useRef(0);
  const killRef       = useRef(0);
  const bossSpawnedRef = useRef(false);
  const bossDefeatedRef = useRef(false);
  const screenRef     = useRef<Screen>("TITLE");
  const rafRef        = useRef<number>(0);
  const lastFrameRef  = useRef<number>(0);

  // Joystick for mobile
  const joyRef        = useRef<{active:boolean; startX:number; startY:number; dx:number; dy:number}>({ active:false, startX:0, startY:0, dx:0, dy:0 });

  function makePlayer(): Player {
    return { x:WORLD/2, y:WORLD/2, hp:100, maxHp:100, mp:100, maxMp:100,
             pAtk:10, mAtk:10, critRate:5, evasion:0, moveSpeed:160, atkSpeed:800,
             critDmg:1.8, level:1, exp:0, expToNext:100, essences:0, gold:0 };
  }

  // ──────────────────────────────
  // SAVE / LOAD
  // ──────────────────────────────
  const saveKey = () => session?.user?.email ? `dori_craft_v3_${session.user.email}` : null;

  const trySave = useCallback(() => {
    const k = saveKey();
    if (!k) return;
    const data = { player: playerRef.current, weapon: weaponRef.current, zone: zoneRef.current };
    localStorage.setItem(k, JSON.stringify(data));
  }, [session]);

  useEffect(() => {
    if (!session?.user?.email) return;
    setUserPoints(getCottonCandyBalance(session.user.email));
    const raw = localStorage.getItem(`dori_craft_v3_${session.user.email}`);
    if (!raw) return;
    try {
      const { player: p, weapon: w, zone: z } = JSON.parse(raw);
      playerRef.current = p;
      weaponRef.current = w; setWeapon(w);
      zoneRef.current = z;  setZone(z);
    } catch(e) {}
  }, [session]);

  // ──────────────────────────────
  // SPAWN HELPERS
  // ──────────────────────────────
  function spawnEnemy(z:number, boss:boolean) {
    const zc = ZONES[z];
    const p  = playerRef.current;
    const pos = randEdge(p.x, p.y, 400);
    const waveScale = 1 + elapsedRef.current * 0.003; // gets harder over time

    if (boss) {
      enemiesRef.current.push({
        id:uid(), x:pos.x, y:pos.y,
        hp: zc.bossHp * waveScale, maxHp: zc.bossHp * waveScale,
        atk: zc.bossAtk * waveScale, speed: zc.bossSpeed,
        emoji: zc.bossEmoji, name: zc.bossName,
        isBoss:true, lastAtkTime:0, flashTimer:0,
      });
    } else {
      const et = zc.enemies[Math.floor(Math.random()*zc.enemies.length)];
      enemiesRef.current.push({
        id:uid(), x:pos.x, y:pos.y,
        hp: et.hpBase * waveScale, maxHp: et.hpBase * waveScale,
        atk: et.atkBase * waveScale, speed: et.speed * (0.9 + Math.random()*0.2),
        emoji: et.emoji, name: et.name,
        isBoss:false, lastAtkTime:0, flashTimer:0,
      });
    }
  }

  // ──────────────────────────────
  // FIRE WEAPONS
  // ──────────────────────────────
  function fireWeapon() {
    const p    = playerRef.current;
    const w    = weaponRef.current;
    const wi   = WEAPON_INFO[w.type];
    const atk  = wi.dmg==="p" ? p.pAtk : p.mAtk;
    const enh  = w.enh;
    const gradeBonus = 1 + GRADES.indexOf(w.grade) * 0.08 + enh * 0.005;
    const baseDmg = atk * gradeBonus;

    // Orb bonuses
    const goldOrbs = w.orbs.filter(o=>o==="金").length;
    const critBonus = goldOrbs * 10;
    const crit = Math.random()*100 < (p.critRate + critBonus);
    const dmg  = Math.floor(crit ? baseDmg * p.critDmg : baseDmg);

    const enemies = enemiesRef.current;
    if (!enemies.length) return;

    if (wi.projSpeed === 0) {
      // MELEE — AoE sweep: damage all enemies within range
      const swept = new Set<number>();
      enemies.forEach(e => {
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist <= wi.range) {
          hitEnemy(e, dmg, crit);
          swept.add(e.id);
        }
      });
      // visual arc effect via float
      if (swept.size > 0) {
        floatsRef.current.push({ id:uid(), x:p.x, y:p.y-30, vy:-40, text:"⚔", color:"#fff", life:400, alpha:1 });
      }
    } else {
      // RANGED — fire toward nearest enemies (projCount directions)
      const sorted = [...enemies].sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
      const targets = sorted.slice(0, wi.projCount);
      // If fewer targets than projCount, spread remaining evenly
      const angles: number[] = targets.map(t => Math.atan2(t.y-p.y, t.x-p.x));
      if (angles.length < wi.projCount) {
        const step = (Math.PI*2) / wi.projCount;
        for (let i = angles.length; i < wi.projCount; i++) angles.push(i * step);
      }
      angles.forEach(angle => {
        const v = { x: Math.cos(angle)*wi.projSpeed, y: Math.sin(angle)*wi.projSpeed };
        projsRef.current.push({
          id:uid(), x:p.x, y:p.y, vx:v.x, vy:v.y,
          dmg, crit, pierce:wi.pierce, radius:8,
          color: wi.projColor, life: (wi.range / wi.projSpeed) * 1000,
        });
      });
    }
  }

  // ──────────────────────────────
  // HIT ENEMY
  // ──────────────────────────────
  function hitEnemy(e: Enemy, dmg: number, crit: boolean) {
    const p = playerRef.current;
    // Orb effects
    const fireOrbs = weaponRef.current.orbs.filter(o=>o==="火").length;
    const woodOrbs = weaponRef.current.orbs.filter(o=>o==="木").length;
    const waterOrbs= weaponRef.current.orbs.filter(o=>o==="水").length;
    const earthOrbs= weaponRef.current.orbs.filter(o=>o==="地").length;

    let finalDmg = dmg;
    // 火 DoT would be handled elsewhere; just show text
    if (fireOrbs > 0 && Math.random() < 0.3) {
      floatsRef.current.push({id:uid(), x:e.x, y:e.y-20, vy:-35, text:"🔥", color:"#f97316", life:600, alpha:1});
      finalDmg = Math.floor(finalDmg * 1.15);
    }
    // 木 lifesteal
    if (woodOrbs > 0 && Math.random() < 0.08) {
      const heal = Math.max(1, Math.floor(finalDmg * 0.05));
      p.hp = Math.min(p.maxHp, p.hp + heal);
      floatsRef.current.push({id:uid(), x:p.x, y:p.y-20, vy:-50, text:`+${heal}`, color:"#4ade80", life:600, alpha:1});
    }
    // 地 stun
    if (earthOrbs > 0 && Math.random() < 0.1) {
      floatsRef.current.push({id:uid(), x:e.x, y:e.y-25, vy:-20, text:"STUN", color:"#a3a3a3", life:700, alpha:1});
    }
    // 水 slow handled visually only (reduce enemy speed state not tracked per-frame here)

    e.hp -= finalDmg;
    e.flashTimer = 120;

    floatsRef.current.push({
      id:uid(), x:e.x + (Math.random()-0.5)*30, y:e.y-20,
      vy:-60, text: crit ? `${finalDmg}!` : `${finalDmg}`,
      color: crit ? "#ffd700" : "#ffffff",
      life: crit ? 800 : 600, alpha:1,
    });
  }

  // ──────────────────────────────
  // LEVEL UP
  // ──────────────────────────────
  function triggerLevelUp() {
    const options = ["HP +20","P.ATK +2","M.ATK +2","크리티컬 +5%","이동속도 +15","공격속도 +80","회피 +5%"];
    const shuffled = options.sort(()=>Math.random()-0.5).slice(0,3);
    setLevelUpChoices(shuffled);
    screenRef.current = "LEVEL_UP";
    setScreen("LEVEL_UP");
  }

  function applyLevelUp(choice: string) {
    const p = playerRef.current;
    if (choice.includes("HP"))         { p.maxHp += 20; p.hp = Math.min(p.hp+20, p.maxHp); }
    else if (choice.includes("P.ATK")) { p.pAtk += 2; }
    else if (choice.includes("M.ATK")) { p.mAtk += 2; }
    else if (choice.includes("크리티컬")) { p.critRate = Math.min(80, p.critRate+5); }
    else if (choice.includes("이동속도"))  { p.moveSpeed += 15; }
    else if (choice.includes("공격속도"))  { p.atkSpeed = Math.max(200, p.atkSpeed-80); }
    else if (choice.includes("회피"))     { p.evasion = Math.min(50, p.evasion+5); }
    setPlayerSnap({...playerRef.current});
    screenRef.current = "GAME";
    setScreen("GAME");
  }

  // ──────────────────────────────
  // MAIN GAME LOOP
  // ──────────────────────────────
  const startLoop = useCallback(() => {
    lastFrameRef.current = performance.now();

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (screenRef.current !== "GAME") return;

      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.05); // seconds, capped
      lastFrameRef.current = now;
      elapsedRef.current += dt;

      const p       = playerRef.current;
      const z       = zoneRef.current;
      const zc      = ZONES[z];
      const canvas  = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // ── INPUT / MOVE
      let vx = 0, vy = 0;
      if (keysRef.current.has("w") || keysRef.current.has("arrowup"))    vy -= 1;
      if (keysRef.current.has("s") || keysRef.current.has("arrowdown"))  vy += 1;
      if (keysRef.current.has("a") || keysRef.current.has("arrowleft"))  vx -= 1;
      if (keysRef.current.has("d") || keysRef.current.has("arrowright")) vx += 1;
      // Joystick
      if (joyRef.current.active) {
        const jd = Math.sqrt(joyRef.current.dx**2 + joyRef.current.dy**2);
        if (jd > 8) {
          vx += joyRef.current.dx / jd;
          vy += joyRef.current.dy / jd;
        }
      }
      const nv = normalize(vx, vy);
      p.x = Math.max(0, Math.min(WORLD, p.x + nv.x * p.moveSpeed * dt));
      p.y = Math.max(0, Math.min(WORLD, p.y + nv.y * p.moveSpeed * dt));

      // ── SPAWN ENEMIES
      const spawnInterval = zc.spawnRate / (1 + elapsedRef.current * 0.004);
      if (now - lastSpawnRef.current > spawnInterval) {
        for (let i=0; i<zc.spawnCount; i++) spawnEnemy(z, false);
        lastSpawnRef.current = now;
      }
      // Boss spawns at 30s if not already
      if (!bossSpawnedRef.current && elapsedRef.current > 30) {
        spawnEnemy(z, true);
        bossSpawnedRef.current = true;
        setBossSpawned(true);
      }

      // ── AUTO ATTACK
      const wi = WEAPON_INFO[weaponRef.current.type];
      const atkInterval = weaponRef.current.enh > 0
        ? Math.max(180, p.atkSpeed - weaponRef.current.enh * 4)
        : p.atkSpeed;
      if (now - lastPlayerAtkRef.current > atkInterval) {
        fireWeapon();
        lastPlayerAtkRef.current = now;
      }

      // ── UPDATE PROJECTILES
      const aliveProjIds = new Set<number>();
      projsRef.current = projsRef.current.filter(pr => {
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;
        pr.life -= dt * 1000;
        if (pr.life <= 0) return false;

        // Collision with enemies
        let hit = false;
        for (const e of enemiesRef.current) {
          if (e.hp <= 0) continue;
          if (Math.hypot(pr.x - e.x, pr.y - e.y) < pr.radius + 20) {
            hitEnemy(e, pr.dmg, pr.crit);
            if (pr.pierce > 0) { pr.pierce--; } else { hit = true; break; }
          }
        }
        return !hit;
      });

      // ── UPDATE ENEMIES
      let playerHit = false;
      let dmgToPlayer = 0;
      enemiesRef.current = enemiesRef.current.filter(e => {
        if (e.hp <= 0) {
          // on kill
          const gold = Math.floor((8 + z*6) * (e.isBoss ? 15 : 1) * (1 + elapsedRef.current*0.001));
          p.gold += gold;
          p.exp  += e.isBoss ? 80 : 15 + z*5;
          killRef.current++;

          if (e.isBoss) {
            bossDefeatedRef.current = true;
            setBossDefeated(true);
            if (session?.user?.email) {
              addCottonCandy(session.user.email, gold*2, "도리 크래프트 보스 클리어");
              setUserPoints(getCottonCandyBalance(session.user.email));
              incrementMinigamePlays(session.user.email);
            }
          } else {
            if (session?.user?.email) {
              addCottonCandy(session.user.email, 1, "도리 크래프트 킬");
              setUserPoints(getCottonCandyBalance(session.user.email));
            }
          }

          // Stat growth on kill (Zone scaling)
          const grow = ["hp","pAtk","mAtk","mp"][Math.floor(Math.random()*4)];
          const inc  = 0.1 + z * 0.05;
          if (grow === "hp") { p.maxHp = +(p.maxHp + inc).toFixed(2); }
          else if (grow === "pAtk") { p.pAtk = +(p.pAtk + inc).toFixed(2); }
          else if (grow === "mAtk") { p.mAtk = +(p.mAtk + inc).toFixed(2); }
          else { p.maxMp = +(p.maxMp + inc).toFixed(2); }

          setKillCount(killRef.current);

          // Level up check
          while (p.exp >= p.expToNext) {
            p.exp -= p.expToNext;
            p.level++;
            p.expToNext = Math.floor(p.expToNext * 1.3);
            triggerLevelUp();
          }

          return false;
        }

        e.flashTimer = Math.max(0, e.flashTimer - dt*1000);

        // Move toward player
        const dx = p.x - e.x, dy = p.y - e.y;
        const dist = Math.hypot(dx, dy);
        const nv2 = normalize(dx, dy);
        // Water orb slow
        const waterOrbs = weaponRef.current.orbs.filter(o=>o==="水").length;
        const slowFactor = waterOrbs > 0 ? 0.6 : 1;
        e.x += nv2.x * e.speed * slowFactor * dt;
        e.y += nv2.y * e.speed * slowFactor * dt;

        // Attack player if close
        const atkRange = e.isBoss ? 50 : 35;
        if (dist < atkRange && now - e.lastAtkTime > (e.isBoss ? 1000 : 700)) {
          // Evasion check
          if (Math.random()*100 >= p.evasion) {
            dmgToPlayer += e.atk * (0.85 + Math.random()*0.3);
            playerHit = true;
          } else {
            floatsRef.current.push({id:uid(), x:p.x, y:p.y-30, vy:-50, text:"MISS", color:"#94a3b8", life:500, alpha:1});
          }
          e.lastAtkTime = now;
        }

        return true;
      });

      if (playerHit) {
        const dmg = Math.floor(dmgToPlayer);
        p.hp -= dmg;
        floatsRef.current.push({id:uid(), x:p.x+(Math.random()-0.5)*20, y:p.y-20, vy:-45, text:`-${dmg}`, color:"#f87171", life:600, alpha:1});
        if (p.hp <= 0) {
          p.hp = 0;
          screenRef.current = "DEAD";
          setScreen("DEAD");
          trySave();
          if (session?.user?.email) incrementMinigamePlays(session.user.email);
        }
      }

      // Update floats
      floatsRef.current = floatsRef.current.filter(f => {
        f.y  += f.vy * dt;
        f.vy *= 0.94;
        f.life -= dt*1000;
        f.alpha = Math.max(0, f.life / 600);
        return f.life > 0;
      });

      setElapsed(Math.floor(elapsedRef.current));
      setPlayerSnap({...p});

      // ── DRAW
      const camX = p.x - W/2;
      const camY = p.y - H/2;

      // Background (scrolling grid)
      ctx.fillStyle = zc.bgColor;
      ctx.fillRect(0, 0, W, H);

      // Ground grid
      ctx.strokeStyle = zc.groundColor;
      ctx.lineWidth = 1;
      const gridSize = 60;
      const gox = ((-camX) % gridSize + gridSize) % gridSize;
      const goy = ((-camY) % gridSize + gridSize) % gridSize;
      for (let gx = gox; gx < W; gx += gridSize) {
        ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke();
      }
      for (let gy = goy; gy < H; gy += gridSize) {
        ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke();
      }

      // ── DRAW PROJECTILES
      projsRef.current.forEach(pr => {
        const sx = pr.x - camX, sy = pr.y - camY;
        ctx.save();
        ctx.globalAlpha = Math.min(1, pr.life / 200);
        ctx.fillStyle = pr.color;
        ctx.shadowColor = pr.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(sx, sy, pr.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      });

      // ── DRAW ENEMIES
      ctx.font = "22px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      enemiesRef.current.forEach(e => {
        const sx = e.x - camX, sy = e.y - camY;
        if (sx < -50 || sx > W+50 || sy < -50 || sy > H+50) return;

        ctx.save();
        if (e.flashTimer > 0) {
          ctx.filter = "brightness(3) saturate(0)";
        }
        if (e.isBoss) {
          ctx.font = "32px serif";
          ctx.shadowColor = "#ff0000";
          ctx.shadowBlur = 20;
        }
        ctx.fillText(e.emoji, sx, sy);
        ctx.restore();

        // HP bar
        const bw = e.isBoss ? 48 : 32;
        const bh = 4;
        const bx = sx - bw/2;
        const by = sy + (e.isBoss ? 24 : 18);
        ctx.fillStyle = "#300";
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = e.isBoss ? "#f97316" : "#ef4444";
        ctx.fillRect(bx, by, bw * Math.max(0, e.hp/e.maxHp), bh);
      });

      // ── DRAW PLAYER
      const px_s = W/2, py_s = H/2;
      ctx.save();
      ctx.font = "26px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 16;
      ctx.fillText(WEAPON_INFO[weaponRef.current.type].emoji, px_s, py_s);
      ctx.restore();

      // Melee swing visual
      const wi2 = WEAPON_INFO[weaponRef.current.type];
      if (wi2.projSpeed === 0 && now - lastPlayerAtkRef.current < 150) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px_s, py_s, wi2.range, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }

      // ── DRAW FLOAT TEXT
      floatsRef.current.forEach(f => {
        const sx = f.x - camX, sy = f.y - camY;
        ctx.save();
        ctx.globalAlpha = f.alpha;
        ctx.fillStyle = f.color;
        ctx.font = f.text.endsWith("!") ? "bold 16px sans-serif" : "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 6;
        ctx.fillText(f.text, sx, sy);
        ctx.restore();
      });

      // ── EXP BAR (top of canvas)
      if (playerRef.current) {
        const expPct = p.exp / p.expToNext;
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0, 0, W, 6);
        ctx.fillStyle = "#a78bfa";
        ctx.fillRect(0, 0, W * expPct, 6);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [session, trySave]);

  // ──────────────────────────────
  // KEY LISTENERS
  // ──────────────────────────────
  useEffect(() => {
    const down = (e:KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); };
    const up   = (e:KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // ──────────────────────────────
  // START / RESET GAME
  // ──────────────────────────────
  const startGame = useCallback((wt: WeaponType, z: number) => {
    const wi = WEAPON_INFO[wt];
    const w: Weapon = { type:wt, grade:"Z", enh:0, orbs:[] };
    weaponRef.current = w; setWeapon(w);
    zoneRef.current = z;  setZone(z);
    const np = makePlayer();
    // load saved stats if available
    if (session?.user?.email) {
      const raw = localStorage.getItem(`dori_craft_v3_${session.user.email}`);
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          Object.assign(np, saved.player);
          np.hp = np.maxHp;
          weaponRef.current = saved.weapon; setWeapon(saved.weapon);
          zoneRef.current = saved.zone; setZone(saved.zone);
        } catch(e) {}
      }
    }
    playerRef.current = np;
    enemiesRef.current = [];
    projsRef.current   = [];
    floatsRef.current  = [];
    elapsedRef.current = 0;
    killRef.current    = 0;
    bossSpawnedRef.current  = false;
    bossDefeatedRef.current = false;
    lastSpawnRef.current    = 0;
    lastPlayerAtkRef.current = 0;
    setBossSpawned(false);
    setBossDefeated(false);
    setKillCount(0);
    setElapsed(0);
    setPlayerSnap({...np});
    screenRef.current = "GAME";
    setScreen("GAME");
  }, [session]);

  useEffect(() => {
    if (screen === "GAME") {
      const cleanup = startLoop();
      return cleanup;
    }
  }, [screen, startLoop]);

  // ──────────────────────────────
  // CANVAS RESIZE
  // ──────────────────────────────
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const resize = () => {
      if (!wrapRef.current) return;
      const { clientWidth, clientHeight } = wrapRef.current;
      setScale(Math.min(clientWidth / W, clientHeight / H));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ──────────────────────────────
  // TOUCH JOYSTICK
  // ──────────────────────────────
  const joyBase = useRef<{x:number;y:number}>({x:0,y:0});
  const onTouchStart = (e:React.TouchEvent) => {
    const t = e.touches[0];
    joyBase.current = {x:t.clientX, y:t.clientY};
    joyRef.current  = {active:true, startX:t.clientX, startY:t.clientY, dx:0, dy:0};
  };
  const onTouchMove = (e:React.TouchEvent) => {
    const t = e.touches[0];
    joyRef.current.dx = t.clientX - joyBase.current.x;
    joyRef.current.dy = t.clientY - joyBase.current.y;
  };
  const onTouchEnd = () => { joyRef.current.active = false; joyRef.current.dx = 0; joyRef.current.dy = 0; };

  // ══════════════════════════════
  // SCREENS
  // ══════════════════════════════

  // ── TITLE
  if (screen === "TITLE") return (
    <div className="h-screen w-full bg-gradient-to-b from-slate-950 to-black flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-3">⚔️</div>
        <h1 className="text-4xl font-bold text-white mb-1 tracking-wider">도리 크래프트</h1>
        <p className="text-slate-400 text-sm mb-6">살아남아라 — 끝없이 몰려오는 몬스터</p>
        {isLoggedIn ? (
          <div className="space-y-3">
            <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
              <span>💾</span><span><b>{session!.user.name}</b>님의 데이터가 자동 저장됩니다.</span>
            </div>
            <button onClick={()=>setScreen("WEAPON_SELECT")} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-all">시작하기</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-4 text-sm">
              <p className="text-base font-bold text-white mb-1">🔒 로그인하면 저장돼요</p>
              <p className="text-slate-400 text-xs">종료 시 진행이 초기화됩니다.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login?redirect=/minigame/dungeon" className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm text-center active:scale-95 transition-all">로그인</Link>
              <Link href="/signup?redirect=/minigame/dungeon" className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm text-center active:scale-95 transition-all">회원가입</Link>
            </div>
            <button onClick={()=>setScreen("WEAPON_SELECT")} className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors">저장 없이 플레이 →</button>
          </div>
        )}
      </div>
    </div>
  );

  // ── WEAPON SELECT
  if (screen === "WEAPON_SELECT") return (
    <div className="h-screen w-full bg-black flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-1 text-center">무기 선택</h2>
        <p className="text-slate-500 text-xs text-center mb-6">모든 무기는 자동 공격합니다</p>
        <div className="grid grid-cols-2 gap-3">
          {(["검","활","마단도","지팡이"] as WeaponType[]).map(wt => {
            const wi = WEAPON_INFO[wt];
            return (
              <button key={wt} onClick={()=>startGame(wt, zoneRef.current)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500 text-white p-4 rounded-xl text-center active:scale-95 transition-all">
                <div className="text-3xl mb-2">{wi.emoji}</div>
                <div className="font-bold text-sm">{wt}</div>
                <div className="text-slate-500 text-xs mt-1">{wi.range<=120?"근거리":"원거리"} · {wi.dmg==="p"?"물리":"마법"}</div>
                <div className="text-orange-400 text-xs mt-1">{wi.projCount > 1 ? `${wi.projCount}방향` : "1방향"} · {wi.pierce>0?`관통${wi.pierce}`:""}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── LEVEL UP
  if (screen === "LEVEL_UP") return (
    <div className="h-screen w-full bg-black/90 flex items-center justify-center px-5 z-50">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-3">⬆️</div>
        <h2 className="text-2xl font-bold text-white mb-1">레벨 업!</h2>
        <p className="text-slate-400 text-sm mb-6">강화를 선택하세요</p>
        <div className="space-y-3">
          {levelUpChoices.map((c,i) => (
            <button key={i} onClick={()=>applyLevelUp(c)}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-orange-500 text-white font-bold py-4 rounded-xl text-sm active:scale-95 transition-all">
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── INVENTORY (slide-over)
  const gradeIdx = GRADES.indexOf(weapon.grade);
  const slots    = maxOrbSlots(gradeIdx);

  // ── DEAD
  if (screen === "DEAD") return (
    <div className="h-screen w-full bg-black flex items-center justify-center px-5">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">쓰러졌습니다</h2>
        <div className="bg-slate-900 rounded-xl p-4 mb-6 text-sm text-slate-300 space-y-1">
          <p>생존 시간: <b className="text-white">{elapsed}초</b></p>
          <p>처치 수: <b className="text-white">{killCount}</b></p>
          <p>Zone: <b className="text-orange-400">{zone+1} — {ZONES[zone].name}</b></p>
        </div>
        <div className="space-y-2">
          <button onClick={()=>startGame(weapon.type, zone)} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl active:scale-95 transition-all">다시 시작</button>
          <button onClick={()=>setScreen("TITLE")} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl active:scale-95 transition-all">타이틀로</button>
        </div>
      </div>
    </div>
  );

  // ── GAME SCREEN
  const hudPlayer = playerSnap ?? playerRef.current;
  return (
    <div className="h-screen w-full bg-black flex flex-col overflow-hidden">

      {/* HUD TOP */}
      <div className="flex items-center gap-3 px-3 py-2 bg-black/80 border-b border-white/5 flex-shrink-0">
        <Link href="/minigame" className="p-1 hover:bg-white/10 rounded transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Link>

        {/* HP */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-red-400 text-xs font-bold w-5">HP</span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all"
                style={{width:`${(hudPlayer.hp/hudPlayer.maxHp)*100}%`}}/>
            </div>
            <span className="text-red-300 text-xs w-14 text-right">{Math.floor(hudPlayer.hp)}/{Math.floor(hudPlayer.maxHp)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400 text-xs w-5">EXP</span>
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all"
                style={{width:`${(hudPlayer.exp/hudPlayer.expToNext)*100}%`}}/>
            </div>
            <span className="text-purple-300 text-xs w-14 text-right">Lv.{hudPlayer.level}</span>
          </div>
        </div>

        {/* Stats mini */}
        <div className="text-xs text-slate-400 text-right leading-tight">
          <div className="text-yellow-400 font-bold">{elapsed}s</div>
          <div>💀{killCount}</div>
        </div>

        <button onClick={()=>setShowInventory(v=>!v)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <Package className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* 비로그인 배너 */}
      {!isLoggedIn && (
        <div className="flex items-center justify-between px-3 py-1 bg-amber-900/40 border-b border-amber-700/30 cursor-pointer flex-shrink-0"
          onClick={()=>setShowNudge(v=>!v)}>
          <span className="text-amber-300 text-xs">⚠️ 저장 안 됨 — 로그인하면 자동 저장</span>
          <span className="text-amber-400 text-xs">가입 →</span>
        </div>
      )}

      {/* CANVAS AREA */}
      <div ref={wrapRef} className="flex-1 relative overflow-hidden"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div style={{
          position:"absolute", left:"50%", top:"50%",
          transform:`translate(-50%,-50%) scale(${scale})`,
          transformOrigin:"center center",
          width: W, height: H,
        }}>
          <canvas ref={canvasRef} width={W} height={H} style={{display:"block"}} />
        </div>

        {/* Zone / weapon badge */}
        <div className="absolute top-2 left-3 text-xs text-slate-400 pointer-events-none">
          <span className="bg-black/60 px-2 py-1 rounded">
            {WEAPON_INFO[weapon.type].emoji} {weapon.type} {weapon.grade}+{weapon.enh}
          </span>
        </div>
        <div className="absolute top-2 right-3 text-xs text-orange-400 font-bold pointer-events-none">
          <span className="bg-black/60 px-2 py-1 rounded">Zone {zone+1} {ZONES[zone].name}</span>
        </div>
        {bossSpawned && !bossDefeated && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-600 text-red-300 text-xs font-bold px-4 py-1.5 rounded-full animate-pulse pointer-events-none">
            ⚠️ 보스 출현!
          </div>
        )}
        {bossDefeated && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-30">
            <div className="text-5xl">🏆</div>
            <p className="text-yellow-400 font-bold text-2xl">보스 클리어!</p>
            <p className="text-slate-400 text-sm">다음 존으로 이동하거나 계속 파밍하세요</p>
            <div className="flex gap-3">
              {zone < ZONES.length-1 && (
                <button onClick={()=>{ const nz=zone+1; startGame(weapon.type, nz); }}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-all">
                  Zone {zone+2}로 이동
                </button>
              )}
              <button onClick={()=>{ bossDefeatedRef.current=false; setBossDefeated(false); screenRef.current="GAME"; setScreen("GAME"); }}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-all">
                계속 파밍
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INVENTORY SLIDE-UP */}
      <AnimatePresence>
        {showInventory && (
          <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",damping:28,stiffness:300}}
            className="absolute inset-x-0 bottom-0 z-50 bg-slate-950 border-t border-slate-700 rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">⚔️ 무기 / 오행 구슬</h2>
              <button onClick={()=>setShowInventory(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            {/* Weapon info */}
            <div className="bg-slate-800/50 rounded-xl p-3 mb-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{WEAPON_INFO[weapon.type].emoji} {weapon.type}</span>
                <span className="text-orange-400 font-bold text-lg">{weapon.grade}+{weapon.enh}</span>
              </div>
              <div className="mt-2 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all" style={{width:`${weapon.enh}%`}}/>
              </div>
              <p className="text-slate-500 text-xs mt-1">{weapon.enh}/100강 — 100강 달성 시 진화 가능</p>
            </div>

            {/* Enhance */}
            <button disabled={hudPlayer.gold < 100}
              onClick={()=>{
                if(hudPlayer.gold < 100) return;
                const p = playerRef.current; p.gold -= 100;
                setWeapon(w => {
                  const nw = w.enh < 100
                    ? {...w, enh: w.enh+1}
                    : { ...w, enh:0, grade: GRADES[Math.min(GRADES.indexOf(w.grade)+1, GRADES.length-1)] };
                  weaponRef.current = nw; return nw;
                });
                setPlayerSnap({...playerRef.current});
                trySave();
              }}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-all mb-4">
              ⚒️ 강화 (100G) — 현재 골드: {Math.floor(hudPlayer.gold)}
            </button>

            {/* Orb slots */}
            <div className="mb-2">
              <p className="text-slate-400 text-sm mb-2">오행 구슬 슬롯 ({weapon.orbs.length}/{slots})</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {weapon.orbs.map((o,i) => (
                  <button key={i}
                    onClick={()=>setWeapon(w=>{const nw={...w,orbs:w.orbs.filter((_,j)=>j!==i)};weaponRef.current=nw;return nw;})}
                    style={{background:ORB_COLORS[o]+"22",borderColor:ORB_COLORS[o]+"88"}}
                    className="border rounded-lg px-3 py-1.5 text-sm font-bold transition-all hover:opacity-70"
                    title="클릭하여 제거">
                    {o} <span className="text-xs text-slate-400">{ORB_DESC[o]}</span>
                  </button>
                ))}
                {weapon.orbs.length < slots && (
                  <span className="text-slate-600 text-sm px-3 py-1.5 border border-slate-700 rounded-lg">빈 슬롯</span>
                )}
              </div>
              {weapon.orbs.length < slots && (
                <div className="flex flex-wrap gap-2">
                  {ORBS.map(o => (
                    <button key={o}
                      onClick={()=>setWeapon(w=>{if(w.orbs.length>=slots)return w;const nw={...w,orbs:[...w.orbs,o]};weaponRef.current=nw;return nw;})}
                      style={{background:ORB_COLORS[o]+"22",borderColor:ORB_COLORS[o]+"66"}}
                      className="border rounded-lg px-3 py-1.5 text-sm transition-all hover:opacity-80">
                      {o} <span className="text-slate-400 text-xs">{ORB_DESC[o]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              {[
                ["P.ATK", hudPlayer.pAtk.toFixed(1)],
                ["M.ATK", hudPlayer.mAtk.toFixed(1)],
                ["크리티컬", `${hudPlayer.critRate}%`],
                ["회피", `${hudPlayer.evasion}%`],
                ["이동속도", `${Math.floor(hudPlayer.moveSpeed)}`],
                ["공격속도", `${hudPlayer.atkSpeed}ms`],
              ].map(([k,v]) => (
                <div key={k} className="bg-slate-800 rounded-lg px-2 py-1.5">
                  <p className="text-slate-500">{k}</p>
                  <p className="text-white font-bold">{v}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 회원가입 팝업 */}
      <AnimatePresence>
        {showNudge && !isLoggedIn && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            className="absolute top-16 left-4 right-4 z-50 bg-slate-900 border border-amber-600/50 rounded-2xl p-4 shadow-2xl">
            <button onClick={()=>setShowNudge(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white text-sm">✕</button>
            <p className="text-2xl mb-2">💾</p>
            <p className="text-white font-bold text-sm mb-1">진행 상황을 저장하세요</p>
            <p className="text-slate-400 text-xs mb-3">로그인 없이는 종료 시 초기화됩니다.</p>
            <div className="flex gap-2">
              <Link href="/signup?redirect=/minigame/dungeon" className="flex-1 bg-orange-600 text-white font-bold py-2 rounded-xl text-xs text-center">회원가입</Link>
              <Link href="/login?redirect=/minigame/dungeon" className="flex-1 bg-slate-700 text-white font-bold py-2 rounded-xl text-xs text-center">로그인</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
