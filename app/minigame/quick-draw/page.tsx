import type { Metadata } from "next";
import EmbeddedGame from "@/components/game/EmbeddedGame";

export const metadata: Metadata = {
  title: "퀵 드로우 | illo 미니게임",
  description: "제시된 도형을 빠르고 정확하게 그려보세요! 5라운드 도전, 정확도 × 속도 보너스 채점.",
  alternates: { canonical: "/minigame/quick-draw" },
};

export default function QuickDrawPage() {
  return <EmbeddedGame gameId="quick-draw" src="/games/quick-draw/index.html" title="퀵 드로우" theme="neon" />;
}
