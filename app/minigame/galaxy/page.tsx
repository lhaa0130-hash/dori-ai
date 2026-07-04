import type { Metadata } from "next";
import EmbeddedGame from "@/components/game/EmbeddedGame";

export const metadata: Metadata = {
  title: "갤럭시 머지 | illo 미니게임",
  description: "은하수 배경 속 네온 동물을 합쳐 진화시키는 머지 퍼즐! (Unity)",
  alternates: { canonical: "/minigame/galaxy" },
};

export default function GalaxyMergePage() {
  return <EmbeddedGame gameId="galaxy" src="/games/galaxy-merge/index.html" title="갤럭시 머지" theme="neon" />;
}
