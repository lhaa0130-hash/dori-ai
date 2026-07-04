import type { Metadata } from "next";
import EmbeddedGame from "@/components/game/EmbeddedGame";

export const metadata: Metadata = {
  title: "일로 디펜스 | illo 미니게임",
  description: "중앙에서 쏟아지는 몬스터를 동·서·남·북 4방향 타워로 막아라! 모든 타워가 무너지면 게임 오버.",
  alternates: { canonical: "/minigame/tower-def" },
};

export default function TowerDefPage() {
  return <EmbeddedGame gameId="tower-def" src="/games/tower-def/index.html" title="일로 디펜스" theme="neon" />;
}
