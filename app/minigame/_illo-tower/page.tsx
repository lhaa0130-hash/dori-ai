import type { Metadata } from "next";
import EmbeddedGame from "@/components/game/EmbeddedGame";

export const metadata: Metadata = {
  title: "illo tower | illo 미니게임",
  description: "순백 화면 위, 본진(주황 원)이 스스로 싸운다. 도형 몬스터가 하나씩 몰려오고 라운드를 깰수록 새 기능이 태어난다.",
  alternates: { canonical: "/minigame/illo-tower" },
};

export default function IlloTowerPage() {
  return <EmbeddedGame gameId="illo-tower" src="/games/illo-tower/index.html" title="illo tower" theme="light" />;
}
