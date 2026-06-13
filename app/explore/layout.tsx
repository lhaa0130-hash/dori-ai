import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "탐색 · DORI-AI",
  description: "지금 뜨는 AI 이야기와 사람들을 발견하세요. 인기 글, 최신 글, 추천 팔로우.",
  alternates: { canonical: "/explore" },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
