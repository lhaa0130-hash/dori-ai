import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "동물 합치기 | DORI-AI 미니게임",
  description: "같은 동물이 만나면 더 큰 동물로! 12단계 진화 동물 합치기 게임.",
  alternates: { canonical: "/minigame/animal" },
};

// 자체 완결형 게임(public/games/animal-merge, Rapier 물리)을 전체 화면 iframe으로 임베드.
export default function AnimalMergePage() {
  return (
    <>
      <iframe
        src="/games/animal-merge/index.html"
        title="동물 합치기"
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
