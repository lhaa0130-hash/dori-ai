import type { Metadata } from "next";
import EmbeddedGame from "@/components/game/EmbeddedGame";

export const metadata: Metadata = {
  title: "보스 클릭커 | illo 미니게임",
  description: "보스를 탭해 쓰러뜨리고 업그레이드로 강해지는 클리커 게임. 분노 보스를 버텨보세요!",
  alternates: { canonical: "/minigame/boss" },
};

export default function BossClickerPage() {
  return <EmbeddedGame gameId="boss" src="/games/boss-clicker/index.html" title="보스 클릭커" theme="neon" />;
}
