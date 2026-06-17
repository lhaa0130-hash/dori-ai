import type { Metadata } from "next";
import EmbeddedGame from "@/components/game/EmbeddedGame";

export const metadata: Metadata = {
  title: "젬 매치 사가 | DORI-AI 미니게임",
  description: "보석을 3개 이상 맞춰 터뜨리는 매치3 퍼즐. 콤보와 라운드에 도전!",
  alternates: { canonical: "/minigame/gem" },
};

export default function GemMatchPage() {
  return <EmbeddedGame gameId="gem" src="/games/gem-match/index.html" title="젬 매치 사가" />;
}
