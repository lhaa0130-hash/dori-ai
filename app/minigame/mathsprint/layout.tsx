import { createMetadata } from "@/lib/seo";
import GameGuide from "@/components/game/GameGuide";

// 게임별 layout — 기존 page.tsx("use client")를 건드리지 않고 두 가지를 더한다.
//   ① 고유 메타데이터   (이전엔 18개 게임이 전부 허브의 "미니게임 | illo" 를 그대로 썼다)
//   ② 정적 안내 본문     (게임 본체는 클라이언트 렌더라 HTML 에 본문이 안 남는다)
export const metadata = createMetadata({
  title: "빠른 계산",
  description: "60초 동안 사칙연산을 최대한 많이 푸는 암산 게임. 키보드 입력을 지원합니다.",
  path: "/minigame/mathsprint",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GameGuide slug="mathsprint" />
    </>
  );
}
