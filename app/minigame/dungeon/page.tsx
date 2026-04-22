"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  addCottonCandy,
  getCottonCandyBalance,
  incrementMinigamePlays,
} from "@/lib/cottonCandy";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const MAP_COLS = 25;      // 실제 맵 타일 수
const MAP_ROWS = 25;
const VIEW_COLS = 13;     // 화면에 보이는 타일 수 (홀수 = 플레이어 중앙)
const VIEW_ROWS = 13;
const TILE_PX = 40;       // 타일 1개 픽셀 크기

const TILE = { FLOOR: 0, WALL: 1, BOSS_MARK: 2 };

type WeaponType = "검" | "활" | "마단도" | "지팡이";
type Grade = "Z"|"Y"|"X"|"W"|"V"|"U"|"T"|"S"|"R"|"Q"|"P"|"O"|"N"|"M"|"L"|"K"|"J"|"I"|"H"|"G"|"F"|"E"|"D"|"C"|"B"|"A";
const GRADES: Grade[] = ["Z","Y","X","W","V","U","T","S","R","Q","P","O","N","M","L","K","J","I","H","G","F","E","D","C","B","A"];

interface Weapon { type: WeaponType; grade: Grade; enh: number; range: number; }
interface Stats  { hp:number; maxHp:number; mp:number; maxMp:number; pAtk:number; mAtk:number; critRate:number; atkSpeed:number; }
interface Entity { id:string; x:number; y:number; hp:number; maxHp:number; atk:number; name:string; emoji:string; isBoss:boolean; lastAtkTime:number; }
interface FloatNum { id:string; x:number; y:number; val:number; crit:boolean; born:number; isPlayer:boolean; }
interface SaveData { stats:Stats; weapon:Weapon; zone:number; gold:number; }

// ─────────────────────────────────────────────
// ZONE DATA
// ─────────────────────────────────────────────
const ZONE_DATA = [
  { name:"초원",      bg:"#0f2010", floor:"#1a3a1a", wall:"#0a1a0a", enemies:[{n:"슬라임",e:"💧",hp:40,atk:4},{n:"들쥐",e:"🐀",hp:30,atk:3}],  boss:{n:"슬라임 왕",e:"👑",hp:300,atk:12}, goldMul:1   },
  { name:"어두운 숲", bg:"#0f1a10", floor:"#1a2a1a", wall:"#080f08", enemies:[{n:"고블린",e:"👺",hp:70,atk:8},{n:"독거미",e:"🕷",hp:60,atk:10}],  boss:{n:"고블린 족장",e:"🗡️",hp:600,atk:22}, goldMul:2   },
  { name:"동굴",      bg:"#111118", floor:"#1e1e2a", wall:"#0a0a12", enemies:[{n:"스켈레톤",e:"💀",hp:110,atk:14},{n:"박쥐",e:"🦇",hp:80,atk:11}], boss:{n:"스켈레톤 로드",e:"☠️",hp:900,atk:35}, goldMul:3   },
  { name:"화산",      bg:"#1a0a00", floor:"#2a1500", wall:"#100500", enemies:[{n:"불 원소",e:"🔥",hp:160,atk:20},{n:"라바 골렘",e:"🌋",hp:200,atk:18}],boss:{n:"불의 정령",e:"🌟",hp:1400,atk:50},goldMul:4},
  { name:"얼음 산맥", bg:"#000e1a", floor:"#00162a", wall:"#000a14", enemies:[{n:"얼음 정령",e:"❄️",hp:220,atk:27},{n:"빙설 늑대",e:"🐺",hp:200,atk:25}],boss:{n:"빙설의 여왕",e:"🧊",hp:2000,atk:70},goldMul:6},
];

// ─────────────────────────────────────────────
// MAP GENERATION
// ─────────────────────────────────────────────
function buildMap(zone: number): number[][] {
  const map: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(TILE.WALL)
  );
  // 방 + 통로 생성
  const rooms: { x:number; y:number; w:number; h:number }[] = [];
  for (let i = 0; i < 7; i++) {
    const w = 4 + Math.floor(Math.random() * 5);
    const h = 4 + Math.floor(Math.random() * 5);
    const x = 1 + Math.floor(Math.random() * (MAP_COLS - w - 2));
    const y = 1 + Math.floor(Math.random() * (MAP_ROWS - h - 2));
    for (let ry = y; ry < y + h; ry++)
      for (let rx = x; rx < x + w; rx++)
        map[ry][rx] = TILE.FLOOR;
    rooms.push({ x, y, w, h });
  }
  // 방 연결
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    const ax = a.x + Math.floor(a.w / 2), ay = a.y + Math.floor(a.h / 2);
    const bx = b.x + Math.floor(b.w / 2), by = b.y + Math.floor(b.h / 2);
    let cx = ax, cy = ay;
    while (cx !== bx) { map[cy][cx] = TILE.FLOOR; cx += cx < bx ? 1 : -1; }
    while (cy !== by) { map[cy][cx] = TILE.FLOOR; cy += cy < by ? 1 : -1; }
  }
  // 보스 위치 표시 (마지막 방 중앙)
  const last = rooms[rooms.length - 1];
  map[last.y + Math.floor(last.h / 2)][last.x + Math.floor(last.w / 2)] = TILE.BOSS_MARK;
  return map;
}

function spawnPos(map: number[][]): { x:number; y:number } {
  for (let y = 1; y < MAP_ROWS; y++)
    for (let x = 1; x < MAP_COLS; x++)
      if (map[y][x] === TILE.FLOOR) return { x, y };
  return { x: 2, y: 2 };
}

function spawnEnemies(map: number[][], zone: number, count: number): Entity[] {
  const z = ZONE_DATA[zone];
  const floor: {x:number;y:number}[] = [];
  for (let y = 0; y < MAP_ROWS; y++)
    for (let x = 0; x < MAP_COLS; x++)
      if (map[y][x] === TILE.FLOOR) floor.push({x,y});

  const picks = floor.sort(() => Math.random() - 0.5).slice(0, count);
  return picks.map((p, i) => {
    const e = z.enemies[Math.floor(Math.random() * z.enemies.length)];
    return { id: `e${i}`, x: p.x, y: p.y, hp: e.hp, maxHp: e.hp, atk: e.atk, name: e.n, emoji: e.e, isBoss: false, lastAtkTime: 0 };
  });
}

function spawnBoss(map: number[][], zone: number): Entity {
  const z = ZONE_DATA[zone];
  for (let y = 0; y < MAP_ROWS; y++)
    for (let x = 0; x < MAP_COLS; x++)
      if (map[y][x] === TILE.BOSS_MARK)
        return { id:"boss", x, y, hp: z.boss.hp, maxHp: z.boss.hp, atk: z.boss.atk, name: z.boss.n, emoji: z.boss.e, isBoss: true, lastAtkTime: 0 };
  return { id:"boss", x:12, y:12, hp: z.boss.hp, maxHp: z.boss.hp, atk: z.boss.atk, name: z.boss.n, emoji: z.boss.e, isBoss: true, lastAtkTime: 0 };
}

// ─────────────────────────────────────────────
// WEAPON INFO
// ─────────────────────────────────────────────
const WEAPON_INFO: Record<WeaponType, { range:number; dmg:"p"|"m"; emoji:string }> = {
  "검":    { range:1.5, dmg:"p", emoji:"⚔️" },
  "마단도":{ range:1.5, dmg:"m", emoji:"🔱" },
  "활":    { range:7,   dmg:"p", emoji:"🏹" },
  "지팡이":{ range:7,   dmg:"m", emoji:"🪄" },
};

const WEAPON_CHOICES: WeaponType[] = ["검","활","마단도","지팡이"];

const DEFAULT_STATS: Stats = {
  hp:100, maxHp:100, mp:100, maxMp:100,
  pAtk:5, mAtk:5, critRate:5, atkSpeed:100,
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function DoriCraft() {
  const { session, status } = useAuth();
  const isLoggedIn = status === "authenticated" && !!session;

  // ── screens: TITLE | WEAPON_SELECT | GAME | INVENTORY
  const [screen, setScreen] = useState<"TITLE"|"WEAPON_SELECT"|"GAME"|"INVENTORY">("TITLE");
  const [userPoints, setUserPoints] = useState(0);
  const [showNudge, setShowNudge] = useState(false);

  // ── player
  const [stats, setStats]       = useState<Stats>(DEFAULT_STATS);
  const [weapon, setWeapon]     = useState<Weapon>({ type:"검", grade:"Z", enh:0, range:1.5 });
  const [zone, setZone]         = useState(0);
  const [gold, setGold]         = useState(0);
  const [playerPos, setPlayerPos] = useState<{x:number;y:number}>({x:2,y:2});
  const [playerHp, setPlayerHp]   = useState(100);
  const [dead, setDead]           = useState(false);

  // ── world
  const [map, setMap]         = useState<number[][]>(() => buildMap(0));
  const [enemies, setEnemies] = useState<Entity[]>([]);
  const [bossAlive, setBossAlive] = useState(true);

  // ── float damage numbers
  const [floats, setFloats]   = useState<FloatNum[]>([]);

  // ── logs
  const [logs, setLogs] = useState<string[]>([]);

  // ── refs for game loop
  const keysRef          = useRef<Set<string>>(new Set());
  const playerHpRef      = useRef(100);
  const playerPosRef     = useRef({x:2,y:2});
  const enemiesRef       = useRef<Entity[]>([]);
  const statsRef         = useRef<Stats>(DEFAULT_STATS);
  const weaponRef        = useRef<Weapon>({ type:"검", grade:"Z", enh:0, range:1.5 });
  const zoneRef          = useRef(0);
  const goldRef          = useRef(0);
  const deadRef          = useRef(false);
  const lastPlayerAtkRef = useRef(0);
  const tickRef          = useRef<ReturnType<typeof setInterval>>();
  const enemyTickRef     = useRef<ReturnType<typeof setInterval>>();

  // ── sync refs
  useEffect(() => { playerHpRef.current  = playerHp; }, [playerHp]);
  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { enemiesRef.current   = enemies; },   [enemies]);
  useEffect(() => { statsRef.current     = stats; },     [stats]);
  useEffect(() => { weaponRef.current    = weapon; },    [weapon]);
  useEffect(() => { zoneRef.current      = zone; },      [zone]);
  useEffect(() => { goldRef.current      = gold; },      [gold]);
  useEffect(() => { deadRef.current      = dead; },      [dead]);

  // ── init
  useEffect(() => {
    if (session?.user?.email) {
      setUserPoints(getCottonCandyBalance(session.user.email));
      tryLoad(session.user.email);
    }
  }, [session]);

  const tryLoad = (email:string) => {
    try {
      const raw = localStorage.getItem(`dori_craft_v2_${email}`);
      if (!raw) return;
      const data: SaveData = JSON.parse(raw);
      setStats(data.stats); statsRef.current = data.stats;
      setWeapon(data.weapon); weaponRef.current = data.weapon;
      setZone(data.zone); zoneRef.current = data.zone;
      setGold(data.gold); goldRef.current = data.gold;
      setPlayerHp(data.stats.hp); playerHpRef.current = data.stats.hp;
      addLog(`💾 데이터 로드됨 — Zone ${data.zone+1}`);
    } catch(e) {}
  };

  const trySave = useCallback(() => {
    if (!session?.user?.email) return;
    const data: SaveData = { stats: statsRef.current, weapon: weaponRef.current, zone: zoneRef.current, gold: goldRef.current };
    localStorage.setItem(`dori_craft_v2_${session.user.email}`, JSON.stringify(data));
  }, [session]);

  // ─── ENTER ZONE
  const enterZone = useCallback((z:number) => {
    const m = buildMap(z);
    const sp = spawnPos(m);
    const ens = spawnEnemies(m, z, 6 + z * 2);
    const boss = spawnBoss(m, z);
    setMap(m);
    setPlayerPos(sp); playerPosRef.current = sp;
    setZone(z); zoneRef.current = z;
    setEnemies([...ens, boss]); enemiesRef.current = [...ens, boss];
    setBossAlive(true);
    setDead(false); deadRef.current = false;
    setPlayerHp(statsRef.current.maxHp); playerHpRef.current = statsRef.current.maxHp;
    addLog(`🗺️ Zone ${z+1} — ${ZONE_DATA[z].name} 입장`);
  }, []);

  const addLog = (msg:string) => setLogs(p => [...p, msg].slice(-6));

  const addFloat = (x:number, y:number, val:number, crit:boolean, isPlayer:boolean) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloats(p => [...p, {id,x,y,val,crit,isPlayer,born:Date.now()}]);
    setTimeout(() => setFloats(p => p.filter(f => f.id !== id)), 900);
  };

  // ─────────────────────────────────────────────
  // GAME LOOP — PLAYER
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "GAME") return;

    const onDown = (e:KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); };
    const onUp   = (e:KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown, {passive:false});
    window.addEventListener("keyup", onUp);

    tickRef.current = setInterval(() => {
      if (deadRef.current) return;
      const pos = {...playerPosRef.current};
      const m = map;
      const spd = Math.round(statsRef.current.atkSpeed / 100);

      // Movement (1 tile per tick, throttled by moveSpeed)
      let nx = pos.x, ny = pos.y;
      if (keysRef.current.has("w") || keysRef.current.has("arrowup"))    ny -= 1;
      if (keysRef.current.has("s") || keysRef.current.has("arrowdown"))  ny += 1;
      if (keysRef.current.has("a") || keysRef.current.has("arrowleft"))  nx -= 1;
      if (keysRef.current.has("d") || keysRef.current.has("arrowright")) nx += 1;

      if (nx !== pos.x || ny !== pos.y) {
        if (nx >= 0 && nx < MAP_COLS && ny >= 0 && ny < MAP_ROWS && m[ny]?.[nx] !== TILE.WALL) {
          setPlayerPos({x:nx, y:ny});
          playerPosRef.current = {x:nx, y:ny};
          pos.x = nx; pos.y = ny;
        }
      }

      // Auto-attack nearest enemy in range
      const now = Date.now();
      const atkInterval = Math.max(300, 800 - statsRef.current.atkSpeed * 2);
      if (now - lastPlayerAtkRef.current >= atkInterval) {
        const range = weaponRef.current.range;
        const near = enemiesRef.current
          .filter(e => e.hp > 0)
          .map(e => ({ e, dist: Math.hypot(e.x - pos.x, e.y - pos.y) }))
          .filter(({ dist }) => dist <= range)
          .sort((a,b) => a.dist - b.dist)[0];

        if (near) {
          const st = statsRef.current;
          const atk = weaponRef.current.range <= 2 ? st.pAtk : st.mAtk;
          const base = atk * (0.85 + Math.random() * 0.3);
          const crit = Math.random() * 100 < st.critRate;
          const dmg = Math.floor(crit ? base * 1.8 : base);

          const updated = enemiesRef.current.map(e =>
            e.id === near.e.id ? {...e, hp: Math.max(0, e.hp - dmg)} : e
          );
          enemiesRef.current = updated;
          setEnemies([...updated]);
          addFloat(near.e.x, near.e.y, dmg, crit, false);

          // Enemy killed
          const killed = updated.find(e => e.id === near.e.id && e.hp <= 0);
          if (killed) {
            const goldGain = Math.floor((10 + zoneRef.current * 8) * (killed.isBoss ? 10 : 1));
            const newGold = goldRef.current + goldGain;
            goldRef.current = newGold;
            setGold(newGold);

            // stat growth
            const grow = ["hp","mp","pAtk","mAtk"][Math.floor(Math.random()*4)] as keyof Stats;
            const inc = 0.1 + zoneRef.current * 0.1;
            setStats(prev => {
              const next = {...prev, [grow]: +(prev[grow] + inc).toFixed(2) };
              statsRef.current = next;
              return next;
            });

            if (killed.isBoss) {
              addLog(`🏆 ${killed.name} 처치! 골드 +${goldGain}. 다음 존 해금!`);
              setBossAlive(false);
              if (session?.user?.email) {
                addCottonCandy(session.user.email, goldGain, "도리 크래프트 보스 클리어");
                setUserPoints(getCottonCandyBalance(session.user.email));
                incrementMinigamePlays(session.user.email);
              }
            } else {
              addLog(`${killed.emoji} ${killed.name} 처치! +${goldGain}G`);
            }

            enemiesRef.current = updated.filter(e => e.hp > 0);
            setEnemies(updated.filter(e => e.hp > 0));
            trySave();
          }

          lastPlayerAtkRef.current = now;
        }
      }
    }, 120);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [screen, map, trySave, session]);

  // ─────────────────────────────────────────────
  // ENEMY AI LOOP
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "GAME") return;

    enemyTickRef.current = setInterval(() => {
      if (deadRef.current) return;
      const now = Date.now();
      const pos = playerPosRef.current;

      setEnemies(prev => {
        let playerDmgTotal = 0;
        const next = prev.map(e => {
          if (e.hp <= 0) return e;
          const dist = Math.hypot(e.x - pos.x, e.y - pos.y);

          // Move toward player
          let nx = e.x, ny = e.y;
          if (dist > 1.2) {
            const dx = pos.x - e.x, dy = pos.y - e.y;
            if (Math.abs(dx) >= Math.abs(dy)) nx += dx > 0 ? 1 : -1;
            else ny += dy > 0 ? 1 : -1;
            // Don't move onto walls or other enemies
            if (map[ny]?.[nx] !== TILE.WALL && !prev.some(o => o.id !== e.id && o.x === nx && o.y === ny))
              return {...e, x:nx, y:ny};
          }

          // Attack if adjacent
          if (dist <= 1.5 && now - e.lastAtkTime > (e.isBoss ? 1200 : 900)) {
            const dmg = Math.floor(e.atk * (0.8 + Math.random() * 0.4));
            playerDmgTotal += dmg;
            addFloat(pos.x, pos.y, dmg, false, true);
            return {...e, lastAtkTime: now};
          }
          return e;
        });

        enemiesRef.current = next;

        if (playerDmgTotal > 0) {
          setPlayerHp(ph => {
            const newHp = Math.max(0, ph - playerDmgTotal);
            playerHpRef.current = newHp;
            if (newHp <= 0 && !deadRef.current) {
              deadRef.current = true;
              setDead(true);
              addLog("💀 쓰러졌습니다...");
              trySave();
            }
            return newHp;
          });
        }

        return next;
      });
    }, 400);

    return () => { if (enemyTickRef.current) clearInterval(enemyTickRef.current); };
  }, [screen, map, trySave]);

  // ─────────────────────────────────────────────
  // RENDERING HELPERS
  // ─────────────────────────────────────────────
  const renderMap = () => {
    const px = playerPosRef.current.x;
    const py = playerPosRef.current.y;
    const halfC = Math.floor(VIEW_COLS / 2);
    const halfR = Math.floor(VIEW_ROWS / 2);

    const startX = Math.max(0, Math.min(px - halfC, MAP_COLS - VIEW_COLS));
    const startY = Math.max(0, Math.min(py - halfR, MAP_ROWS - VIEW_ROWS));

    const z = ZONE_DATA[zone];
    const tiles = [];

    for (let row = 0; row < VIEW_ROWS; row++) {
      for (let col = 0; col < VIEW_COLS; col++) {
        const mx = startX + col;
        const my = startY + row;
        const tile = map[my]?.[mx] ?? TILE.WALL;
        const isPlayerTile = mx === px && my === py;
        const enemyHere = enemies.find(e => e.x === mx && e.y === my && e.hp > 0);

        const tileColor =
          tile === TILE.WALL      ? z.wall  :
          tile === TILE.BOSS_MARK ? "#2a1a00" : z.floor;

        tiles.push(
          <div
            key={`${mx}-${my}`}
            style={{
              width: TILE_PX, height: TILE_PX,
              background: tileColor,
              position:"relative",
              borderRight: "1px solid rgba(255,255,255,0.04)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              flexShrink: 0,
            }}
          >
            {/* 보스 마크 */}
            {tile === TILE.BOSS_MARK && !isPlayerTile && !enemyHere && (
              <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:0.4}}>✦</span>
            )}
            {/* 플레이어 */}
            {isPlayerTile && (
              <div style={{
                position:"absolute",inset:0,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:22,zIndex:10,
                filter:"drop-shadow(0 0 6px rgba(255,200,100,0.8))"
              }}>
                {WEAPON_INFO[weapon.type].emoji}
              </div>
            )}
            {/* 적 (플레이어 타일 아니면) */}
            {!isPlayerTile && enemyHere && (
              <div style={{
                position:"absolute",inset:0,display:"flex",flexDirection:"column",
                alignItems:"center",justifyContent:"center",
                fontSize: enemyHere.isBoss ? 24 : 18,
                filter: enemyHere.isBoss ? "drop-shadow(0 0 8px red)" : undefined,
                zIndex:5,
              }}>
                <span>{enemyHere.emoji}</span>
                {/* 적 HP 바 */}
                <div style={{position:"absolute",bottom:2,left:3,right:3,height:3,background:"#300",borderRadius:2}}>
                  <div style={{height:"100%",background:"#f44",borderRadius:2,width:`${(enemyHere.hp/enemyHere.maxHp)*100}%`}}/>
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    // Float damage numbers
    const visibleFloats = floats.filter(f => {
      const sx = f.x - startX, sy = f.y - startY;
      return sx >= 0 && sx < VIEW_COLS && sy >= 0 && sy < VIEW_ROWS;
    });

    return (
      <div style={{position:"relative", display:"flex", flexDirection:"column"}}>
        {Array.from({length:VIEW_ROWS}).map((_,row)=>(
          <div key={row} style={{display:"flex"}}>
            {tiles.slice(row*VIEW_COLS, row*VIEW_COLS+VIEW_COLS)}
          </div>
        ))}
        {/* floating numbers */}
        {visibleFloats.map(f => {
          const age = Date.now() - f.born;
          const opacity = Math.max(0, 1 - age/900);
          const sy = (f.y - startY) * TILE_PX - age * 0.04;
          const sx = (f.x - startX) * TILE_PX + TILE_PX/2;
          return (
            <div key={f.id} style={{
              position:"absolute",
              left: sx, top: sy,
              transform:"translateX(-50%)",
              color: f.isPlayer ? "#ff5555" : (f.crit ? "#ffd700" : "#ffffff"),
              fontWeight:"bold",
              fontSize: f.crit ? 16 : 13,
              opacity,
              pointerEvents:"none",
              textShadow:"0 1px 4px rgba(0,0,0,0.9)",
              zIndex:20,
              whiteSpace:"nowrap",
            }}>
              {f.isPlayer ? `-${f.val}` : (f.crit ? `💥${f.val}` : f.val)}
            </div>
          );
        })}
      </div>
    );
  };

  // Mobile D-pad
  const dpad = (dir:"up"|"down"|"left"|"right") => {
    const key = {up:"w",down:"s",left:"a",right:"d"}[dir];
    keysRef.current.add(key);
    setTimeout(()=>keysRef.current.delete(key), 150);
  };

  // ─────────────────────────────────────────────
  // SCREENS
  // ─────────────────────────────────────────────
  if (screen === "TITLE") return (
    <div className="h-screen w-full bg-gradient-to-b from-slate-950 to-black flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-3">⚔️</div>
        <h1 className="text-4xl font-bold text-white mb-1 tracking-wider">도리 크래프트</h1>
        <p className="text-slate-400 text-sm mb-8">성장형 액션 RPG — 직접 이동하며 싸워라</p>

        {isLoggedIn ? (
          <div className="space-y-3">
            <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
              <span>💾</span><span><b>{session!.user.name}</b>님, 진행 상황이 자동 저장됩니다.</span>
            </div>
            <button onClick={()=>setScreen("WEAPON_SELECT")} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl text-lg active:scale-95 transition-all">
              시작하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-4 text-sm">
              <p className="text-base font-bold text-white mb-1">🔒 로그인하면 저장돼요</p>
              <p className="text-slate-400 text-xs">로그인 없이도 플레이 가능하지만<br/>종료 시 진행이 초기화됩니다.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login?redirect=/minigame/dungeon" className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm text-center active:scale-95 transition-all">로그인하고 시작</Link>
              <Link href="/signup?redirect=/minigame/dungeon" className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm text-center active:scale-95 transition-all">회원가입</Link>
            </div>
            <button onClick={()=>setScreen("WEAPON_SELECT")} className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors">저장 없이 플레이 →</button>
          </div>
        )}
      </div>
    </div>
  );

  if (screen === "WEAPON_SELECT") return (
    <div className="h-screen w-full bg-black flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-1 text-center">무기 선택</h2>
        <p className="text-slate-500 text-xs text-center mb-6">시작 무기를 고르세요</p>
        <div className="grid grid-cols-2 gap-3">
          {WEAPON_CHOICES.map(wt => {
            const wi = WEAPON_INFO[wt];
            return (
              <button key={wt} onClick={()=>{
                const w: Weapon = { type:wt, grade:"Z", enh:0, range:wi.range };
                setWeapon(w); weaponRef.current = w;
                enterZone(0);
                setScreen("GAME");
              }} className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-600 text-white p-4 rounded-xl text-center active:scale-95 transition-all">
                <div className="text-3xl mb-2">{wi.emoji}</div>
                <div className="font-bold text-sm">{wt}</div>
                <div className="text-slate-500 text-xs mt-1">{wi.range<=2?"근거리":"원거리"} · {wi.dmg==="p"?"물리":"마법"}</div>
                <div className="text-orange-400 text-xs mt-1">사거리 {wi.range}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (screen === "INVENTORY") return (
    <div className="h-screen w-full bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">⚔️ 상태창</h2>
          <button onClick={()=>setScreen("GAME")} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
          <p className="text-white font-bold text-lg">{WEAPON_INFO[weapon.type].emoji} {weapon.type} — <span className="text-orange-400">{weapon.grade}+{weapon.enh}</span></p>
          <p className="text-slate-400 text-xs mt-1">사거리 {weapon.range} | {WEAPON_INFO[weapon.type].dmg==="p"?"물리":"마법"} 계열</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {[["❤️ HP",`${Math.floor(playerHp)} / ${stats.maxHp}`],["💙 MP",`${stats.mp}`],["⚔️ P.ATK",`${stats.pAtk.toFixed(1)}`],["🔮 M.ATK",`${stats.mAtk.toFixed(1)}`],["🎯 치명",`${stats.critRate}%`],["⚡ 공속",`${stats.atkSpeed}%`]].map(([k,v])=>(
            <div key={k} className="bg-slate-800 rounded-lg px-3 py-2">
              <p className="text-slate-400 text-xs">{k}</p>
              <p className="text-white font-bold">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-slate-300 mb-4">
          <span>💰 골드: <b className="text-yellow-400">{gold}</b></span>
          <span>🗺️ Zone: <b className="text-orange-400">{zone+1}</b></span>
        </div>
        {gold >= 100 && (
          <button onClick={()=>{
            if(gold<100) return;
            setGold(g=>{goldRef.current=g-100;return g-100;});
            setWeapon(w=>{
              const next={...w,enh:w.enh<100?w.enh+1:0,grade:w.enh>=100?(GRADES[GRADES.indexOf(w.grade)+1]||"A"):w.grade};
              weaponRef.current=next; return next;
            });
            addLog("✨ 무기 강화!");
          }} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all">
            ⚒️ 강화하기 (100G)
          </button>
        )}
      </div>
    </div>
  );

  // ─── GAME SCREEN
  const z = ZONE_DATA[zone];
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{background:z.bg}}>

      {/* TOP BAR */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/60 backdrop-blur border-b border-white/5 flex-shrink-0">
        <Link href="/minigame" className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Link>
        <div className="text-xs font-bold text-orange-400">Zone {zone+1} — {z.name}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-400 font-bold">🍬{userPoints}</span>
          <button onClick={()=>setScreen("INVENTORY")} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Package className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* 비로그인 배너 */}
      {!isLoggedIn && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-900/40 border-b border-amber-700/30 cursor-pointer flex-shrink-0" onClick={()=>setShowNudge(v=>!v)}>
          <span className="text-amber-300 text-xs font-bold">⚠️ 저장 안 됨 — 로그인하면 자동 저장</span>
          <span className="text-amber-400 text-xs">가입하기 →</span>
        </div>
      )}

      {/* HP BAR */}
      <div className="px-3 py-1.5 bg-black/40 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>HP</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all rounded-full" style={{width:`${(playerHp/stats.maxHp)*100}%`}}/>
          </div>
          <span className="text-red-400 font-bold w-16 text-right">{Math.floor(playerHp)}/{stats.maxHp}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-slate-500">{WEAPON_INFO[weapon.type].emoji} {weapon.type} {weapon.grade}+{weapon.enh}</span>
          <span className="ml-auto text-yellow-400 font-bold">💰{gold}</span>
        </div>
      </div>

      {/* MAP VIEWPORT */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative" style={{minHeight:0}}>
        <div style={{
          width: VIEW_COLS * TILE_PX,
          height: VIEW_ROWS * TILE_PX,
          overflow:"hidden",
          position:"relative",
          flexShrink:0,
        }}>
          {renderMap()}
        </div>

        {/* DEAD OVERLAY */}
        {dead && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-30">
            <div className="text-5xl">💀</div>
            <p className="text-red-400 font-bold text-xl">쓰러졌습니다</p>
            <button onClick={()=>enterZone(zone)} className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-all">
              다시 시작
            </button>
          </div>
        )}

        {/* BOSS CLEARED OVERLAY */}
        {!bossAlive && !dead && zone < ZONE_DATA.length - 1 && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-30">
            <div className="text-5xl">🏆</div>
            <p className="text-yellow-400 font-bold text-xl">보스 클리어!</p>
            <button onClick={()=>{ const nz=zone+1; enterZone(nz); trySave(); }} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl active:scale-95 transition-all">
              Zone {zone+2}로 이동
            </button>
          </div>
        )}
      </div>

      {/* LOG */}
      <div className="px-3 py-1.5 bg-black/50 border-t border-white/5 flex-shrink-0 h-14 overflow-hidden">
        {logs.slice(-2).map((l,i)=>(
          <p key={i} className="text-slate-400 text-xs leading-tight truncate">{l}</p>
        ))}
      </div>

      {/* D-PAD (모바일) */}
      <div className="flex-shrink-0 bg-black/70 border-t border-white/5 p-3">
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-1 w-36">
            <div/>
            <button onTouchStart={()=>dpad("up")} onMouseDown={()=>dpad("up")} className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white h-11 rounded-lg text-lg font-bold transition-colors select-none">▲</button>
            <div/>
            <button onTouchStart={()=>dpad("left")} onMouseDown={()=>dpad("left")} className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white h-11 rounded-lg text-lg font-bold transition-colors select-none">◀</button>
            <button onTouchStart={()=>dpad("down")} onMouseDown={()=>dpad("down")} className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white h-11 rounded-lg text-lg font-bold transition-colors select-none">▼</button>
            <button onTouchStart={()=>dpad("right")} onMouseDown={()=>dpad("right")} className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white h-11 rounded-lg text-lg font-bold transition-colors select-none">▶</button>
          </div>
        </div>
      </div>

      {/* 회원가입 팝업 */}
      <AnimatePresence>
        {showNudge && !isLoggedIn && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
            className="absolute top-20 left-4 right-4 z-50 bg-slate-900 border border-amber-600/50 rounded-2xl p-4 shadow-2xl">
            <button onClick={()=>setShowNudge(false)} className="absolute top-3 right-3 text-slate-500 hover:text-white text-sm">✕</button>
            <p className="text-2xl mb-2">💾</p>
            <p className="text-white font-bold text-sm mb-1">지금 진행 상황을 저장하세요</p>
            <p className="text-slate-400 text-xs mb-4">로그인하지 않으면 앱을 닫을 때<br/>모든 진행 상황이 사라집니다.</p>
            <div className="flex gap-2">
              <Link href="/signup?redirect=/minigame/dungeon" className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl text-xs text-center transition-all">회원가입</Link>
              <Link href="/login?redirect=/minigame/dungeon" className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl text-xs text-center transition-all">로그인</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
