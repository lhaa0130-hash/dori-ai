"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { incrementMinigamePlays } from "@/lib/cottonCandy";

// ─── 동물 레벨 (작은 것 → 큰 것) ──────────────────────────────────
const ANIMALS = [
  { emoji: "🐛", name: "애벌레",  r: 20,  pts: 2   },
  { emoji: "🐸", name: "개구리",  r: 28,  pts: 4   },
  { emoji: "🐇", name: "토끼",    r: 36,  pts: 8   },
  { emoji: "🐼", name: "판다",    r: 45,  pts: 16  },
  { emoji: "🦊", name: "여우",    r: 55,  pts: 30  },
  { emoji: "🐺", name: "늑대",    r: 66,  pts: 50  },
  { emoji: "🦁", name: "사자",    r: 78,  pts: 80  },
  { emoji: "🐯", name: "호랑이",  r: 91,  pts: 120 },
  { emoji: "🦏", name: "코뿔소",  r: 106, pts: 200 },
  { emoji: "🐘", name: "코끼리",  r: 123, pts: 300 },
  { emoji: "🦕", name: "공룡",    r: 143, pts: 500 },
];

// ─── 게임 상수 ─────────────────────────────────────────────────
const GW          = 340;   // 캔버스 너비
const GH          = 520;   // 캔버스 높이
const WALL        = 5;
const FLOOR_Y     = GH - WALL;
const DANGER_Y    = 80;    // 이 선 위로 올라오면 게임 오버
const GRAVITY     = 0.42;
const FRICTION    = 0.985;
const BOUNCE      = 0.18;
const ITER        = 8;     // 충돌 해결 반복 횟수
const MERGE_COOL  = 30;    // 생성 후 합치기 가능한 최소 프레임
const DROP_DELAY  = 650;   // 다음 공 준비 대기(ms)
const MAX_DROP_LV = 4;     // 드롭 가능한 최대 레벨 (0~4)

let gUID = 0;

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lv: number;
  birthFrame: number;
}

const rndLv = () => Math.floor(Math.random() * (MAX_DROP_LV + 1));

// ─── 컴포넌트 ──────────────────────────────────────────────────
export default function AnimalMergePage() {
  const { session } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── 게임 내부 상태 (ref) ── */
  const ballsRef     = useRef<Ball[]>([]);
  const frameRef     = useRef(0);
  const scoreRef     = useRef(0);
  const dropXRef     = useRef(GW / 2);
  const dropLvRef    = useRef(0);
  const nextLvRef    = useRef(0);
  const canDropRef   = useRef(true);
  const gameOverRef  = useRef(false);
  const rafRef       = useRef(0);

  /* ── UI 상태 (React) ── */
  const [score,     setScore]     = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [dropLv,    setDropLv]    = useState(0);
  const [nextLv,    setNextLv]    = useState(0);
  const [gameOver,  setGameOver]  = useState(false);
  const [canDrop,   setCanDrop]   = useState(true);

  /* ── 초기화 ── */
  useEffect(() => {
    const best = parseInt(localStorage.getItem("animalmerge_best") || "0", 10);
    setBestScore(best);
    const d = rndLv(), n = rndLv();
    dropLvRef.current = d; nextLvRef.current = n;
    setDropLv(d); setNextLv(n);
  }, []);

  /* ── 물리 업데이트 ── */
  const tick = useCallback(() => {
    if (gameOverRef.current) return;
    frameRef.current++;
    const f = frameRef.current;
    const cur = ballsRef.current;

    // 중력 + 이동
    for (const b of cur) {
      b.vy += GRAVITY;
      b.x  += b.vx;
      b.y  += b.vy;
      b.vx *= FRICTION;
      b.vy *= FRICTION;

      const ar = ANIMALS[b.lv].r;
      // 좌·우 벽
      if (b.x - ar < WALL)       { b.x = WALL + ar;       b.vx =  Math.abs(b.vx) * BOUNCE; }
      if (b.x + ar > GW - WALL)  { b.x = GW - WALL - ar;  b.vx = -Math.abs(b.vx) * BOUNCE; }
      // 바닥
      if (b.y + ar > FLOOR_Y)    { b.y = FLOOR_Y - ar;    b.vy = -Math.abs(b.vy) * BOUNCE; b.vx *= 0.82; }
      // 천장 (공이 화면 밖으로 나가지 않도록)
      if (b.y - ar < 0)          { b.y = ar;               b.vy =  Math.abs(b.vy) * BOUNCE; }
    }

    const toRemove = new Set<number>();
    const toAdd: Ball[] = [];

    // 충돌 해결 (반복)
    for (let iter = 0; iter < ITER; iter++) {
      for (let i = 0; i < cur.length; i++) {
        for (let j = i + 1; j < cur.length; j++) {
          const a = cur[i], b = cur[j];
          if (toRemove.has(a.id) || toRemove.has(b.id)) continue;

          const ra = ANIMALS[a.lv].r, rb = ANIMALS[b.lv].r;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          const minD = ra + rb;
          if (d2 >= minD * minD || d2 < 0.001) continue;

          const d  = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;

          // 마지막 반복에서 합치기 검사
          if (
            iter === ITER - 1 &&
            a.lv === b.lv &&
            a.lv < ANIMALS.length - 1 &&
            f - a.birthFrame > MERGE_COOL &&
            f - b.birthFrame > MERGE_COOL
          ) {
            toRemove.add(a.id);
            toRemove.add(b.id);
            const newR = ANIMALS[a.lv + 1].r;
            // 합치기 위치: 두 공의 중앙, 단 바닥/천장 범위 안에 클램핑
            const mergeX = (a.x + b.x) / 2;
            const mergeY = Math.max(newR, Math.min(FLOOR_Y - newR, (a.y + b.y) / 2));
            const nb: Ball = {
              id: gUID++,
              x: mergeX,
              y: mergeY,
              vx: (a.vx + b.vx) * 0.3,
              vy: Math.min((a.vy + b.vy) * 0.3 - 2.5, -1), // 항상 약간 위로
              lv: a.lv + 1,
              birthFrame: f,
            };
            toAdd.push(nb);
            scoreRef.current += ANIMALS[nb.lv].pts;
            setScore(scoreRef.current);
            continue;
          }

          // 겹침 분리
          const overlap = (minD - d) * 0.5;
          a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;

          // 충격량
          const dv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (dv < 0) {
            const imp = dv * 0.18;
            a.vx += imp * nx; a.vy += imp * ny;
            b.vx -= imp * nx; b.vy -= imp * ny;
          }
        }
      }
    }

    // 합치기 결과 반영
    if (toRemove.size > 0 || toAdd.length > 0) {
      ballsRef.current = cur.filter(b => !toRemove.has(b.id)).concat(toAdd);
    }

    // 게임 오버 검사: 충분히 정착한 공이 위험선 위에 있으면 종료
    // birthFrame 후 120프레임 (~2초) 유예 + 공이 거의 정지했을 때만 판정
    for (const b of ballsRef.current) {
      const age = f - b.birthFrame;
      const ar  = ANIMALS[b.lv].r;
      const isSettled = Math.abs(b.vy) < 1.5 && Math.abs(b.vx) < 1.5;
      if (age > 120 && isSettled && b.y - ar < DANGER_Y) {
        gameOverRef.current = true;
        setGameOver(true);
        const best = parseInt(localStorage.getItem("animalmerge_best") || "0", 10);
        if (scoreRef.current > best) {
          localStorage.setItem("animalmerge_best", String(scoreRef.current));
          setBestScore(scoreRef.current);
        }
        return;
      }
    }
  }, []);

  /* ── 렌더링 ── */
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // 배경
    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, GW, GH);

    // 벽 + 바닥
    ctx.fillStyle = "#1e2235";
    ctx.fillRect(0, 0, WALL, GH);
    ctx.fillRect(GW - WALL, 0, WALL, GH);
    ctx.fillRect(0, FLOOR_Y, GW, WALL);

    // 위험선 (빨간 점선)
    ctx.save();
    ctx.strokeStyle = "rgba(239,68,68,0.45)";
    ctx.setLineDash([7, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(WALL, DANGER_Y);
    ctx.lineTo(GW - WALL, DANGER_Y);
    ctx.stroke();
    ctx.restore();

    // 드롭 가이드 선
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dropXRef.current, DANGER_Y + 5);
    ctx.lineTo(dropXRef.current, DANGER_Y + 50);
    ctx.stroke();
    ctx.restore();

    // 드롭 예정 동물 미리보기
    const da = ANIMALS[dropLvRef.current];
    ctx.save();
    ctx.globalAlpha = canDropRef.current ? 0.9 : 0.35;
    ctx.font = `${Math.round(da.r * 1.7)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(da.emoji, dropXRef.current, DANGER_Y - da.r - 5);
    ctx.restore();

    // 공 그리기
    for (const b of ballsRef.current) {
      const a = ANIMALS[b.lv];
      // 반투명 원
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
      // 이모지
      ctx.save();
      ctx.font = `${Math.round(a.r * 1.65)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(a.emoji, b.x, b.y);
      ctx.restore();
    }
  }, []);

  /* ── 게임 루프 ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = () => {
      tick();
      draw(ctx);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick, draw]);

  /* ── 드롭 ── */
  const dropBall = useCallback(() => {
    if (!canDropRef.current || gameOverRef.current) return;
    canDropRef.current = false;
    setCanDrop(false);

    const lv = dropLvRef.current;
    const ar = ANIMALS[lv].r;
    const x  = Math.max(WALL + ar + 2, Math.min(GW - WALL - ar - 2, dropXRef.current));

    ballsRef.current.push({
      id: gUID++,
      x,
      y: DANGER_Y - ar - 3,
      vx: 0,
      vy: 1.5,
      lv,
      birthFrame: frameRef.current,
    });

    if (session) incrementMinigamePlays(session.user.id).catch(() => {});

    setTimeout(() => {
      const n  = nextLvRef.current;
      const nn = rndLv();
      dropLvRef.current = n;
      nextLvRef.current = nn;
      setDropLv(n);
      setNextLv(nn);
      canDropRef.current = true;
      setCanDrop(true);
    }, DROP_DELAY);
  }, [session]);

  /* ── 포인터/터치 위치 업데이트 ── */
  const updateX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const scale = GW / rect.width;
    const x = (clientX - rect.left) * scale;
    dropXRef.current = Math.max(WALL + 25, Math.min(GW - WALL - 25, x));
  }, []);

  /* ── 재시작 ── */
  const restart = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    ballsRef.current    = [];
    frameRef.current    = 0;
    scoreRef.current    = 0;
    gameOverRef.current = false;
    canDropRef.current  = true;
    dropXRef.current    = GW / 2;
    const d = rndLv(), n = rndLv();
    dropLvRef.current = d; nextLvRef.current = n;
    setScore(0);
    setGameOver(false);
    setDropLv(d);
    setNextLv(n);
    setCanDrop(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const loop = () => { tick(); draw(ctx); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
  }, [tick, draw]);

  /* ── JSX ── */
  return (
    <main className="w-full min-h-screen bg-[#0f1117] text-white flex flex-col items-center pb-10">
      <div className="w-full max-w-sm px-3 pt-4">

        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/minigame"
            className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            게임 목록
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-[10px] text-yellow-500/70">최고점</div>
              <div className="text-sm font-bold text-yellow-400">{bestScore.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-neutral-500">점수</div>
              <div className="text-sm font-bold text-white">{score.toLocaleString()}</div>
            </div>
            <button
              onClick={restart}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
              aria-label="재시작"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 제목 + 다음 동물 */}
        <div className="flex items-center justify-between mb-2.5">
          <h1 className="text-sm font-bold text-white">🐾 동물 합치기</h1>
          <div className="flex items-center gap-2 bg-neutral-800/80 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-neutral-400">다음</span>
            <span className="text-xl leading-none">{ANIMALS[nextLv]?.emoji}</span>
            <span className="text-[11px] text-neutral-300">{ANIMALS[nextLv]?.name}</span>
          </div>
        </div>

        {/* 캔버스 */}
        <div
          className="relative w-full rounded-2xl overflow-hidden"
          style={{ aspectRatio: `${GW}/${GH}`, border: "1.5px solid rgba(255,255,255,0.08)" }}
        >
          <canvas
            ref={canvasRef}
            width={GW}
            height={GH}
            className="w-full h-full block touch-none"
            style={{ cursor: "crosshair" }}
            onMouseMove={e => updateX(e.clientX)}
            onClick={dropBall}
            onTouchMove={e => { e.preventDefault(); if (e.touches[0]) updateX(e.touches[0].clientX); }}
            onTouchEnd={e => { e.preventDefault(); dropBall(); }}
          />

          {/* 게임 오버 오버레이 */}
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-[2px]">
              <div className="text-5xl mb-3">😢</div>
              <div className="text-xl font-bold mb-1">게임 오버!</div>
              <div className="text-3xl font-black text-yellow-400 mb-1">{score.toLocaleString()}점</div>
              {score > 0 && score >= bestScore && (
                <div className="text-sm text-yellow-300 mb-4">🏆 신기록 달성!</div>
              )}
              <button
                onClick={restart}
                className="mt-3 px-10 py-3 bg-[#F9954E] hover:bg-[#E8832E] text-white rounded-2xl font-bold text-base transition-colors shadow-lg"
              >
                다시 시작
              </button>
            </div>
          )}
        </div>

        {/* 합치기 차트 */}
        <div className="mt-3 bg-neutral-900/80 rounded-xl p-3">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">합치기 진화표</div>
          <div className="flex items-center flex-wrap gap-1">
            {ANIMALS.map((a, i) => (
              <span key={i} className="flex items-center gap-0.5">
                <span className="text-base leading-none" title={a.name}>{a.emoji}</span>
                {i < ANIMALS.length - 1 && (
                  <span className="text-neutral-700 text-xs">→</span>
                )}
              </span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-x-2 gap-y-1">
            {ANIMALS.map((a, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-sm leading-none">{a.emoji}</span>
                <span className="text-[10px] text-neutral-400">{a.pts}점</span>
              </div>
            ))}
          </div>
        </div>

        {/* 조작 안내 */}
        <div className="mt-2 text-center text-[11px] text-neutral-600">
          화면을 탭/클릭해서 동물을 떨어뜨리세요 · 같은 동물 2마리가 만나면 합쳐집니다
        </div>
      </div>
    </main>
  );
}
