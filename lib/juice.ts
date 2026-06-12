// 미니게임 공용 "주스"(축하 연출) — 브랜드 오렌지 팔레트로 통일된 고급 컨페티
// 사용: import { burst, bigBurst } from "@/lib/juice"; burst(); / bigBurst();
import confetti from "canvas-confetti";

const PALETTE = ["#F9954E", "#E8832E", "#FFD9B0", "#FBAA60", "#ffffff"];

/** 가벼운 축하 — 정답·성공·작은 보상에 */
export function burst(opts?: { x?: number; y?: number; count?: number }) {
  try {
    confetti({
      particleCount: opts?.count ?? 70,
      spread: 78,
      startVelocity: 38,
      gravity: 0.92,
      scalar: 0.95,
      ticks: 160,
      origin: { x: opts?.x ?? 0.5, y: opts?.y ?? 0.62 },
      colors: PALETTE,
      disableForReducedMotion: true,
    });
  } catch { /* 컨페티 실패는 무시 */ }
}

/** 큰 축하 — 신기록·클리어·잭팟에 (양쪽 캐논 + 잔향) */
export function bigBurst() {
  try {
    confetti({
      particleCount: 120, spread: 100, startVelocity: 45, gravity: 0.9, scalar: 1.05,
      ticks: 200, origin: { x: 0.5, y: 0.55 }, colors: PALETTE, disableForReducedMotion: true,
    });
    setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: PALETTE, disableForReducedMotion: true });
      confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: PALETTE, disableForReducedMotion: true });
    }, 180);
  } catch { /* 무시 */ }
}
