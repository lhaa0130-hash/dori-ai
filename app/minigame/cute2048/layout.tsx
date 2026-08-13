import { createMetadata } from "@/lib/seo";
import GameGuide from "@/components/game/GameGuide";

// 게임별 layout — 기존 page.tsx("use client")를 건드리지 않고 두 가지를 더한다.
//   ① 고유 메타데이터   (이전엔 18개 게임이 전부 허브의 "미니게임 | illo" 를 그대로 썼다)
//   ② 정적 안내 본문     (게임 본체는 클라이언트 렌더라 HTML 에 본문이 안 남는다)
export const metadata = createMetadata({
  title: "Cute 2048",
  description: "같은 숫자를 합쳐 2048을 만드는 유니티 퍼즐. 솜사탕 보상이 있습니다.",
  path: "/minigame/cute2048",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GameGuide slug="cute2048" />
    </>
  );
}
