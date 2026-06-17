import type { Metadata } from "next";
import EmbeddedGame from "@/components/game/EmbeddedGame";

export const metadata: Metadata = {
  title: "Cute 2048 | DORI-AI 미니게임",
  description: "귀여운 동물 친구들과 숫자를 합쳐 2048을 만드는 퍼즐 게임.",
  alternates: { canonical: "/minigame/cute2048" },
};

export default function Cute2048Page() {
  return <EmbeddedGame gameId="cute2048" src="/games/cute-2048/index.html" title="Cute 2048" />;
}
