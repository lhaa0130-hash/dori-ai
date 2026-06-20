import type { Metadata } from "next";
import EmbeddedGame from "@/components/game/EmbeddedGame";

export const metadata: Metadata = {
  title: "동물 합치기 | DORI-AI 미니게임",
  description: "같은 동물이 만나면 더 큰 동물로! 12단계 진화 동물 합치기 게임.",
  alternates: { canonical: "/minigame/animal" },
};

export default function AnimalMergePage() {
  return <EmbeddedGame gameId="animal" src="/games/animal-merge/index.html" title="동물 합치기" theme="neon" />;
}
