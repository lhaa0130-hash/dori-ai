import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "미니게임",
  description: "설치 없이 즐기는 브라우저 미니게임 모음. 명예의 전당(TOP 5) 랭킹과 솜사탕 보상으로 더 재밌게 즐기세요.",
  path: "/minigame",
});

export default function MinigameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
