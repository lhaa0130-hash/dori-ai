"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, Trophy, Play, Bird } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { submitScore } from "@/lib/leaderboard";
import GameLeaderboard from "@/components/game/GameLeaderboard";
import GameSuggestion from "@/components/game/GameSuggestion";
import CountUp from "@/components/game/CountUp";
import { burst, bigBurst } from "@/lib/juice";

// ----------------------------------------------------------------------
// 플래피 도리 — 사이드뷰 캔버스 게임
// 탭/클릭/Space로 플랩, 중력으로 하강. 파이프 통과 시 +1점.
// 파이프/바닥/천장 충돌 시 게임오버. (랭킹: desc, 단위 "점")
// ----------------------------------------------------------------------

const GAME = "flappy";
const ORDER = "desc" as const;
const UNIT = "점";

// 가상 캔버스 좌표계 (CSS로 반응형 스케일)
const W = 360;
const H = 540;

// 물리/난이도 — 느리고 쉽게 (천천히 떨어지고, 간격 넓고, 스크롤 느림)
const GRAVITY = 0.30;
const FLAP = -6.4;
const MAX_FALL = 7.5;
const BIRD_X = 96;
const BIRD_R = 13;

const PIPE_W = 60;
const GAP = 195;          // 상하 파이프 사이 간격 (넓힘)
const PIPE_SPEED = 1.8;   // 스크롤 속도 (느리게)
const PIPE_SPACING = 260; // 파이프 간 수평 간격 (여유 있게)
const GROUND_H = 64;
const TOP_PAD = 8;

type Pipe = { x: number; gapY: number; passed: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; r: number };
type Phase = "READY" | "PLAYING" | "GAME_OVER";

export default function FlappyGame() {
  const { session } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("READY");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  // 루프/상태 refs
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("READY");
  const birdY = useRef(H / 2);
  const vel = useRef(0);
  const rot = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const particles = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const tick = useRef(0);     // 배경/날갯짓 애니메이션 프레임
  const shake = useRef(0);    // 충돌 화면 흔들림
  const spawnX = useRef(0);   // 다음 파이프 생성 위치

  // 로컬 최고점 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${GAME}_best`);
      if (saved) {
        const n = parseInt(saved, 10);
        if (Number.isFinite(n)) { setBest(n); bestRef.current = n; }
      }
    } catch { /* localStorage 접근 실패 무시 */ }
  }, []);

  const randGapY = useCallback(() => {
    const minY = GAP / 2 + 40;
    const maxY = H - GROUND_H - GAP / 2 - 40;
    return Math.round(minY + Math.random() * (maxY - minY));
  }, []);

  const resetWorld = useCallback(() => {
    birdY.current = H / 2;
    vel.current = 0;
    rot.current = 0;
    particles.current = [];
    scoreRef.current = 0;
    shake.current = 0;
    setScore(0);
    // 첫 파이프는 여유를 두고 등장
    spawnX.current = W + 120;
    pipes.current = [
      { x: spawnX.current, gapY: randGapY(), passed: false },
      { x: spawnX.current + PIPE_SPACING, gapY: randGapY(), passed: false },
      { x: spawnX.current + PIPE_SPACING * 2, gapY: randGapY(), passed: false },
    ];
  }, [randGapY]);

  const spawnParticles = useCallback((x: number, y: number, count: number, colors: string[], spread: number) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * spread + 1;
      particles.current.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        life: 0,
        max: 26 + Math.random() * 18,
        c: colors[(Math.random() * colors.length) | 0],
        r: 2 + Math.random() * 2.5,
      });
    }
  }, []);

  const flap = useCallback(() => {
    if (phaseRef.current !== "PLAYING") return;
    vel.current = FLAP;
    // 날갯짓 흔적
    spawnParticles(BIRD_X - 6, birdY.current + 4, 4, ["#FFD9B0", "#ffffff"], 1.6);
  }, [spawnParticles]);

  const endGame = useCallback(() => {
    if (phaseRef.current === "GAME_OVER") return;
    phaseRef.current = "GAME_OVER";
    setPhase("GAME_OVER");
    shake.current = 16;
    spawnParticles(BIRD_X, birdY.current, 22, ["#F9954E", "#E8832E", "#FFD9B0", "#ffffff"], 4.5);

    const final = scoreRef.current; // finalScore = 통과수
    const isRecord = final > 0 && final > bestRef.current;
    if (isRecord) {
      bestRef.current = final;
      setBest(final);
      try { localStorage.setItem(`${GAME}_best`, String(final)); } catch { /* 무시 */ }
      bigBurst();
    }
    // 명예의 전당(글로벌 TOP 5) 점수 제출 — 로그인 회원만
    if (session?.user?.email) {
      submitScore(GAME, session.user.name || "플레이어", final, ORDER);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("dori-lb-refresh", { detail: GAME }));
      }
    }
  }, [session, spawnParticles]);

  // ── 메인 루프 ───────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    tick.current++;
    const playing = phaseRef.current === "PLAYING";

    // 물리 업데이트
    if (playing) {
      vel.current = Math.min(vel.current + GRAVITY, MAX_FALL);
      birdY.current += vel.current;
      rot.current = Math.max(-0.5, Math.min(1.4, vel.current * 0.06));

      // 천장
      if (birdY.current - BIRD_R < TOP_PAD) {
        birdY.current = TOP_PAD + BIRD_R;
        vel.current = 0;
      }
      // 바닥
      if (birdY.current + BIRD_R >= H - GROUND_H) {
        birdY.current = H - GROUND_H - BIRD_R;
        endGame();
      }

      // 파이프 스크롤
      let maxX = 0;
      for (const p of pipes.current) {
        p.x -= PIPE_SPEED;
        if (p.x > maxX) maxX = p.x;
      }
      // 화면 밖으로 나간 파이프 재활용
      for (const p of pipes.current) {
        if (p.x + PIPE_W < -4) {
          p.x = maxX + PIPE_SPACING;
          maxX = p.x;
          p.gapY = randGapY();
          p.passed = false;
        }
      }

      // 득점 + 충돌
      for (const p of pipes.current) {
        // 통과 판정
        if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
          p.passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
          burst({ x: 0.28, y: 0.3, count: 26 });
          spawnParticles(BIRD_X + 8, birdY.current, 8, ["#F9954E", "#FFD9B0"], 2.4);
        }
        // 충돌 판정 (원-사각형 근사)
        const within = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
        if (within) {
          const topB = p.gapY - GAP / 2;
          const botB = p.gapY + GAP / 2;
          if (birdY.current - BIRD_R < topB || birdY.current + BIRD_R > botB) {
            endGame();
          }
        }
      }
    } else if (phaseRef.current === "READY") {
      // 대기 중 부드러운 호버 모션
      birdY.current = H / 2 + Math.sin(tick.current * 0.06) * 10;
      rot.current = Math.sin(tick.current * 0.06) * 0.12;
    }

    // 흔들림 감쇠
    if (shake.current > 0) shake.current *= 0.86;
    const sx = shake.current > 0.4 ? (Math.random() - 0.5) * shake.current : 0;
    const sy = shake.current > 0.4 ? (Math.random() - 0.5) * shake.current : 0;

    // ── 렌더 ──
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.translate(sx, sy);

    // 배경 그라데이션 (#09090e 계열)
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0e0e16");
    bg.addColorStop(0.55, "#0b0b12");
    bg.addColorStop(1, "#09090e");
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, W + 40, H + 40);

    // 상단 오렌지 글로우
    const glow = ctx.createRadialGradient(W / 2, -40, 20, W / 2, -40, 260);
    glow.addColorStop(0, "rgba(249,149,78,0.16)");
    glow.addColorStop(1, "rgba(249,149,78,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-20, -20, W + 40, 320);

    // 별/먼지 (느린 패럴럭스)
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    for (let i = 0; i < 26; i++) {
      const sxp = (i * 53 + 17 - tick.current * 0.35) % (W + 20);
      const syp = (i * 97) % (H - GROUND_H - 20) + 12;
      const px = sxp < 0 ? sxp + W + 20 : sxp;
      ctx.fillRect(px, syp, 1.6, 1.6);
    }

    // 파이프
    for (const p of pipes.current) {
      const topB = p.gapY - GAP / 2;
      const botB = p.gapY + GAP / 2;
      drawPipe(ctx, p.x, 0, topB, true);
      drawPipe(ctx, p.x, botB, H - GROUND_H - botB, false);
    }

    // 바닥
    const groundY = H - GROUND_H;
    const gg = ctx.createLinearGradient(0, groundY, 0, H);
    gg.addColorStop(0, "#1a1a24");
    gg.addColorStop(1, "#0d0d14");
    ctx.fillStyle = gg;
    ctx.fillRect(0, groundY, W, GROUND_H);
    // 바닥 상단 하이라이트 라인 (스크롤)
    ctx.strokeStyle = "rgba(249,149,78,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 1);
    ctx.lineTo(W, groundY + 1);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    const off = (tick.current * (playing ? PIPE_SPEED : 0.6)) % 28;
    for (let x = -off; x < W; x += 28) {
      ctx.fillRect(x, groundY + 10, 14, 4);
    }

    // 파티클
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const pt = particles.current[i];
      pt.life++;
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.18;
      pt.vx *= 0.98;
      const t = pt.life / pt.max;
      if (t >= 1) { particles.current.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = pt.c;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 새(도리)
    drawBird(ctx, BIRD_X, birdY.current, rot.current, tick.current, phaseRef.current);

    ctx.restore();

    rafRef.current = requestAnimationFrame(draw);
  }, [endGame, randGapY, spawnParticles]);

  // 루프 시작/정리
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  // 입력: Space / 위쪽 화살표
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        if (phaseRef.current === "PLAYING") flap();
        else if (phaseRef.current === "READY") start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flap]);

  const start = useCallback(() => {
    resetWorld();
    phaseRef.current = "PLAYING";
    setPhase("PLAYING");
    vel.current = FLAP * 0.7; // 시작 시 살짝 점프
  }, [resetWorld]);

  // 캔버스/배경 입력
  const onPress = useCallback(() => {
    if (phaseRef.current === "PLAYING") flap();
    else if (phaseRef.current === "READY") start();
  }, [flap, start]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090e] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(249,149,78,0.07),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center px-4 pb-10 pt-5">
        {/* 상단바 */}
        <header className="mb-5 flex w-full items-center justify-between">
          <Link
            href="/minigame"
            className="inline-flex items-center gap-1.5 text-[13px] text-stone-500 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight">
              <Bird className="h-4 w-4 text-[#F9954E]" />
              플래피 도리
            </span>
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-1.5 text-center">
              <div className="text-[9px] uppercase tracking-widest text-stone-500">SCORE</div>
              <div key={score} className="arcade-pop text-sm font-bold tabular-nums text-white">
                <CountUp value={score} className="tabular-nums" />
              </div>
            </div>
          </div>
        </header>

        {/* 게임 패널 */}
        <div
          ref={wrapRef}
          onClick={onPress}
          onTouchStart={(e) => { e.preventDefault(); onPress(); }}
          className="arcade-card arcade-rise relative w-full cursor-pointer select-none overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-2xl"
          style={{ touchAction: "manipulation" }}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="block w-full rounded-xl"
            style={{ aspectRatio: `${W} / ${H}`, height: "auto" }}
          />

          {/* READY 오버레이 */}
          {phase === "READY" && (
            <div className="arcade-pop-in absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/55 backdrop-blur-[2px]">
              <div className="arcade-float mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                <Bird className="h-8 w-8 text-[#F9954E]" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">플래피 도리</h1>
              <p className="mb-6 mt-1.5 px-6 text-center text-[12px] leading-relaxed text-stone-400">
                탭 · 클릭 · Space로 날아오르세요.<br />파이프 사이를 통과할 때마다 +1점!
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); start(); }}
                className="arcade-shine arcade-glow flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] px-8 py-3 font-bold text-white shadow-lg shadow-[#F9954E]/20 transition-transform active:scale-[0.97]"
              >
                <Play className="h-5 w-5 fill-current" />
                게임 시작
              </button>
            </div>
          )}

          {/* GAME OVER 오버레이 */}
          {phase === "GAME_OVER" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-black/65 p-4 backdrop-blur-[2px]">
              <div className="arcade-pop-in arcade-card flex flex-col items-center rounded-3xl border border-white/10 bg-[#101016] p-8 text-center">
                <h2 className="mb-4 text-xl font-extrabold tracking-tight">게임 오버</h2>
                {score > 0 && score >= best && (
                  <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-[#F9954E]/30 bg-[#F9954E]/15 px-3 py-1 text-[11px] font-bold text-[#F9954E]">
                    <Trophy className="h-3 w-3" /> 신기록 달성!
                  </div>
                )}
                <div className="mb-1 text-[10px] uppercase tracking-widest text-stone-500">통과한 파이프</div>
                <div className="arcade-grad-text mb-2 text-5xl font-black tabular-nums">
                  <CountUp value={score} />
                </div>
                <div className="mb-6 inline-flex items-center gap-1 text-[11px] text-stone-500">
                  <Trophy className="h-3 w-3 text-[#F9954E]" />
                  최고 {best}{UNIT}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); start(); }}
                  className="arcade-shine arcade-glow flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#F9954E] to-[#E8832E] px-8 py-3 font-bold text-white shadow-lg shadow-[#F9954E]/20 transition-transform active:scale-[0.97]"
                >
                  <RefreshCw className="h-4 w-4" />
                  다시하기
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] text-stone-600">
          화면을 탭하거나 Space를 눌러 새를 띄우세요
        </p>

        {/* 명예의 전당 */}
        <div className="mt-6 w-full">
          <GameLeaderboard game={GAME} title="명예의 전당 TOP 5" unit={UNIT} order={ORDER} tone="dark" />
        </div>

        <GameSuggestion />
      </div>
    </main>
  );
}

// ----------------------------------------------------------------------
// 캔버스 헬퍼
// ----------------------------------------------------------------------

function drawPipe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  isTop: boolean
) {
  if (h <= 0) return;
  // 몸통 그라데이션
  const g = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
  g.addColorStop(0, "#2a2a38");
  g.addColorStop(0.18, "#3a3a4c");
  g.addColorStop(0.5, "#4a4a60");
  g.addColorStop(0.82, "#33333f");
  g.addColorStop(1, "#23232e");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, PIPE_W, h);

  // 테두리 / 오렌지 림
  ctx.strokeStyle = "rgba(249,149,78,0.28)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, PIPE_W - 1.5, h - 1.5);

  // 캡 (입구)
  const capH = 16;
  const capX = x - 4;
  const capW = PIPE_W + 8;
  const capY = isTop ? y + h - capH : y;
  const cg = ctx.createLinearGradient(capX, 0, capX + capW, 0);
  cg.addColorStop(0, "#3a3a4c");
  cg.addColorStop(0.5, "#5a5a72");
  cg.addColorStop(1, "#2c2c38");
  ctx.fillStyle = cg;
  roundRect(ctx, capX, capY, capW, capH, 4);
  ctx.fill();
  ctx.strokeStyle = "rgba(249,149,78,0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rot: number,
  tick: number,
  phase: Phase
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  // 발광 후광
  const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_R + 12);
  halo.addColorStop(0, "rgba(249,149,78,0.35)");
  halo.addColorStop(1, "rgba(249,149,78,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_R + 12, 0, Math.PI * 2);
  ctx.fill();

  // 날개 (위아래로 펄럭)
  const flapPhase = phase === "PLAYING" ? Math.sin(tick * 0.5) : Math.sin(tick * 0.12);
  const wingY = flapPhase * 7;
  ctx.fillStyle = "#E8832E";
  ctx.beginPath();
  ctx.ellipse(-3, wingY, 9, 6, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // 몸통
  const bg = ctx.createLinearGradient(0, -BIRD_R, 0, BIRD_R);
  bg.addColorStop(0, "#FBAA60");
  bg.addColorStop(1, "#F9954E");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
  ctx.fill();

  // 배 하이라이트
  ctx.fillStyle = "rgba(255,217,176,0.55)";
  ctx.beginPath();
  ctx.arc(-3, 4, 6, 0, Math.PI * 2);
  ctx.fill();

  // 부리
  ctx.fillStyle = "#E8832E";
  ctx.beginPath();
  ctx.moveTo(BIRD_R - 2, -2);
  ctx.lineTo(BIRD_R + 8, 1);
  ctx.lineTo(BIRD_R - 2, 4);
  ctx.closePath();
  ctx.fill();

  // 눈 흰자 + 동공
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(5, -4, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b0b12";
  ctx.beginPath();
  ctx.arc(6.4, -4, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
