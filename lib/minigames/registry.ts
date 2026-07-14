import type { MiniGameRegistration } from "./types";

export const ILLO_PLAY_GAMES: MiniGameRegistration[] = [
  {
    id: "mart",
    name: "illo : MART",
    description: "뒤섞인 상품을 선반별로 정리해 오늘의 주문을 완성해요.",
    path: "/minigame/mart",
    icon: "shopping-basket",
    accent: "#F27A3F",
    status: "live",
    relatedGame: "illo-tower",
  },
  {
    id: "bolts",
    name: "illo : BOLTS",
    description: "순서를 찾아 작은 기계를 수리하는 논리 퍼즐.",
    path: "/minigame/bolts",
    icon: "wrench",
    accent: "#5E78D6",
    status: "coming-soon",
  },
];

export function getMiniGame(id: string): MiniGameRegistration | undefined {
  return ILLO_PLAY_GAMES.find((game) => game.id === id);
}

