import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cute 2048 | DORI-AI 미니게임",
  description: "귀여운 동물 친구들과 숫자를 합쳐 2048을 만드는 퍼즐 게임.",
  alternates: { canonical: "/minigame/cute2048" },
};

// 자체 완결형 2048(public/games/cute-2048)을 전체 화면 iframe으로 임베드.
export default function Cute2048Page() {
  return (
    <>
      <iframe
        src="/games/cute-2048/index.html"
        title="Cute 2048"
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", border: "none", zIndex: 9999 }}
      />
      <Link
        href="/minigame"
        style={{
          position: "fixed",
          left: 12,
          top: 12,
          zIndex: 10000,
          background: "rgba(255,255,255,0.85)",
          color: "#6B4E32",
          fontWeight: 800,
          fontSize: 13,
          padding: "8px 14px",
          borderRadius: 999,
          textDecoration: "none",
          boxShadow: "0 6px 18px -8px rgba(120,80,40,0.5)",
          border: "1px solid #F0D6B0",
        }}
      >
        ← 미니게임
      </Link>
    </>
  );
}
