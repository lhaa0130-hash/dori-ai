"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { incrementMinigamePlays } from "@/lib/cottonCandy";
import { submitAnimalMergeScore, getAnimalMergeTop5, type ScoreEntry } from "@/lib/leaderboard";
import PlaytimeRewardToast from "@/components/game/PlaytimeRewardToast";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

// ─── 동물 레벨 (작은 것 → 큰 것) ──────────────────────────────────
const ANIMALS = [
  { emoji: "🐛", name: "애벌레",  r: 20,  pts: 2,   c: "#9ccc65" },
  { emoji: "🐸", name: "개구리",  r: 28,  pts: 4,   c: "#66bb6a" },
  { emoji: "🐇", name: "토끼",    r: 36,  pts: 8,   c: "#e8eaf0" },
  { emoji: "🐼", name: "판다",    r: 45,  pts: 16,  c: "#cfd8dc" },
  { emoji: "🦊", name: "여우",    r: 55,  pts: 30,  c: "#ff8a65" },
  { emoji: "🐺", name: "늑대",    r: 66,  pts: 50,  c: "#90a4ae" },
  { emoji: "🦁", name: "사자",    r: 78,  pts: 80,  c: "#ffca28" },
  { emoji: "🐯", name: "호랑이",  r: 91,  pts: 120, c: "#ffa726" },
  { emoji: "🦏", name: "코뿔소",  r: 106, pts: 200, c: "#b0bec5" },
  { emoji: "🐘", name: "코끼리",  r: 123, pts: 300, c: "#9fa8da" },
  { emoji: "🦕", name: "공룡",    r: 143, pts: 500, c: "#4db6ac" },
];

// 합치기 팝 이펙트
interface Pop { x: number; y: number; r: number; life: number; max: number; c: string; }

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
const MAX_DROP_LV = 2;     // 드롭 가능한 최대 레벨 (0~2: 애벌레·개구리·토끼만)

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

// 작은 동물 위주로 드롭(애벌레 55% · 개구리 30% · 토끼 15%) — 큰 동물이 막 쏟아지지 않도록
const rndLv = () => {
  const r = Math.random();
  return r < 0.55 ? 0 : r < 0.85 ? 1 : 2;
};

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
  const popsRef      = useRef<Pop[]>([]);

  /* ── UI 상태 (React) ── */
  const [score,     setScore]     = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [dropLv,    setDropLv]    = useState(0);
  const [nextLv,    setNextLv]    = useState(0);
  const [gameOver,  setGameOver]  = useState(false);
  const [canDrop,   setCanDrop]   = useState(true);

  /* ── 명예의 전당(전역 랭킹) ── */
  const [top5,      setTop5]      = useState<ScoreEntry[]>([]);
  const [myRank,    setMyRank]    = useState(0);     // 이번 판으로 진입한 순위(0=미진입)
  const [serverBest, setServerBest] = useState(false); // 서버 신기록 갱신 여부

  /* ── 초기화 ── */
  useEffect(() => {
    const best = parseInt(localStorage.getItem("animalmerge_best") || "0", 10);
    setBestScore(best);
    const d = rndLv(), n = rndLv();
    dropLvRef.current = d; nextLvRef.current = n;
    setDropLv(d); setNextLv(n);
  }, []);

  /* ── 명예의 전당 로드(진입 시) ── */
  useEffect(() => {
    getAnimalMergeTop5().then(setTop5);
  }, []);

  /* ── 게임 오버 → 회원이면 전역 랭킹에 점수 등록(개인 최고 갱신 시에만) ── */
  useEffect(() => {
    if (!gameOver || score <= 0) return;
    setMyRank(0); setServerBest(false);
    if (!session?.user?.email) return; // 비로그인은 로컬 최고점만
    submitAnimalMergeScore(session.user.name || "플레이어", score).then((res) => {
      if (res.isNewBest) {
        setServerBest(true);
        setMyRank(res.rank);
        getAnimalMergeTop5().then(setTop5); // 순위표 즉시 갱신
        bigBurst(); // JUICE: 개인 신기록/명예의 전당 진입 축하
      }
    });
  }, [gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

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
            // 합치기 팝 이펙트
            popsRef.current.push({ x: mergeX, y: mergeY, r: newR, life: 16, max: 16, c: ANIMALS[a.lv + 1].c });
            // JUICE: 큰 동물(레벨 6 이상)로 합쳐지면 큰 축하, 그 외엔 가벼운 축하
            if (nb.lv >= 6) bigBurst(); else burst();
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

    // 팝 이펙트 수명 감소
    if (popsRef.current.length > 0) {
      for (const p of popsRef.current) p.life--;
      popsRef.current = popsRef.current.filter(p => p.life > 0);
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
    ctx.fillStyle = "#0c0c13";
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
      // 컬러 그라데이션 원 (동물별 색)
      ctx.save();
      const grad = ctx.createRadialGradient(b.x - a.r * 0.3, b.y - a.r * 0.35, a.r * 0.2, b.x, b.y, a.r);
      grad.addColorStop(0, a.c + "ee");
      grad.addColorStop(1, a.c + "66");
      ctx.beginPath();
      ctx.arc(b.x, b.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = a.c;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      // 이모지
      ctx.save();
      ctx.font = `${Math.round(a.r * 1.5)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(a.emoji, b.x, b.y);
      ctx.restore();
    }

    // 합치기 팝 이펙트 (확장하며 사라지는 링)
    for (const p of popsRef.current) {
      const t = 1 - p.life / p.max;        // 0 → 1
      const rr = p.r * (1 + t * 0.6);
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
      ctx.strokeStyle = p.c;
      ctx.lineWidth = 3;
      ctx.stroke();
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

    if (session?.user?.email) incrementMinigamePlays(session.user.email);

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
    popsRef.current     = [];
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
    <main className="relative overflow-hidden w-full min-h-screen bg-[#09090e] text-white flex flex-col items-center pb-10">
      {/* 상단 오렌지 글로우 */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]" />
      {/* 1분 플레이 보상 토스트 */}
      <PlaytimeRewardToast />
      <div className="relative w-full max-w-sm px-3 pt-4">

        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/minigame"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            게임 목록
          </Link>
          <div className="flex items-center gap-2">
            <div className="arcade-card rounded-xl px-3 py-1.5 text-center">
              <div className="text-[9px] uppercase tracking-widest text-neutral-500">BEST</div>
              <div className="text-sm font-bold text-white tabular-nums">
                <CountUp value={bestScore} className="tabular-nums" />
              </div>
            </div>
            <div className="arcade-card rounded-xl px-3 py-1.5 text-center">
              <div className="text-[9px] uppercase tracking-widest text-neutral-500">SCORE</div>
              <div className="text-sm font-bold text-white tabular-nums">
                <span key={score} className="arcade-pop inline-block">
                  <CountUp value={score} className="tabular-nums" />
                </span>
              </div>
            </div>
            <button
              onClick={restart}
              className="arcade-shine p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-200 hover:bg-white/[0.1] active:scale-[0.97] transition-all"
              aria-label="재시작"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 제목 + 다음 동물 */}
        <div className="flex items-center justify-between mb-2.5 arcade-rise-1">
          <h1 className="text-[15px] font-extrabold tracking-tight text-white">🐾 동물 합치기</h1>
          <div className="flex items-center gap-2 arcade-card rounded-xl px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-widest text-neutral-500">다음</span>
            <span key={nextLv} className="arcade-pop text-xl leading-none">{ANIMALS[nextLv]?.emoji}</span>
            <span className="text-[11px] text-neutral-400">{ANIMALS[nextLv]?.name}</span>
          </div>
        </div>

        {/* 캔버스 */}
        <div
          className="arcade-card arcade-rise relative w-full rounded-2xl overflow-hidden"
          style={{ aspectRatio: `${GW}/${GH}` }}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-4">
              <div className="arcade-pop-in w-full max-w-[280px] rounded-3xl bg-[#101016] border border-white/10 p-8 flex flex-col items-center text-center">
                <div className="arcade-float text-5xl mb-3">😢</div>
                <div className="text-lg font-extrabold tracking-tight mb-3">게임 오버!</div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">SCORE</div>
                <div className="text-5xl font-black arcade-grad-text tabular-nums mb-2">
                  <CountUp value={score} className="tabular-nums" />
                </div>
                {serverBest && myRank >= 1 && myRank <= 5 ? (
                  <div className="text-sm font-bold text-[#F9954E] mb-2">🏆 명예의 전당 {myRank}위 등극!</div>
                ) : serverBest ? (
                  <div className="text-sm font-bold text-[#F9954E] mb-2">🎉 개인 신기록 갱신!</div>
                ) : score > 0 && score >= bestScore ? (
                  <div className="text-sm text-[#F9954E] mb-2">🏆 신기록 달성!</div>
                ) : null}
                {score > 0 && !session?.user?.email && (
                  <Link href="/login" className="text-[11px] text-neutral-400 underline underline-offset-2 mb-3 hover:text-white transition-colors">
                    로그인하면 명예의 전당에 기록을 남길 수 있어요
                  </Link>
                )}
                <button
                  onClick={restart}
                  className="arcade-shine arcade-glow mt-2 px-8 py-3 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] text-white font-bold shadow-lg shadow-[#F9954E]/20 active:scale-[0.97] transition-all"
                >
                  다시 시작
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🏆 명예의 전당 TOP 5 (전역 랭킹) */}
        <div className="arcade-rise-2 mt-3 bg-gradient-to-b from-yellow-500/10 to-neutral-900/80 rounded-xl p-3 border border-yellow-500/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-yellow-300">🏆 명예의 전당 TOP 5</span>
            <span className="text-[10px] text-neutral-500">회원 최고점</span>
          </div>
          {top5.length === 0 ? (
            <div className="py-3 text-center text-[11px] text-neutral-500">
              아직 기록이 없어요. 첫 주인공이 되어보세요!
            </div>
          ) : (
            <div className="space-y-1">
              {top5.map((e, i) => {
                const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}`;
                const isMe = !!session?.user && e.name === (session.user.name || "플레이어");
                return (
                  <div
                    key={e.uid}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                      isMe ? "bg-[#F9954E]/20 ring-1 ring-[#F9954E]/40" : i < 3 ? "bg-neutral-800/70" : "bg-neutral-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-6 text-center text-sm ${i < 3 ? "" : "text-neutral-500 font-bold"}`}>{medal}</span>
                      <span className="text-xs text-neutral-200 truncate">{e.name}</span>
                      {isMe && <span className="text-[9px] text-[#F9954E] font-bold shrink-0">나</span>}
                    </div>
                    <span className="text-xs font-bold text-yellow-400 tabular-nums shrink-0">{e.score.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 합치기 차트 */}
        <div className="arcade-rise-3 mt-3 bg-neutral-900/80 rounded-xl p-3">
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
