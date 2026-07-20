import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed — what the illo community is sharing | illo",
  description: "See and share posts from the illo community.",
  robots: { index: false, follow: false }, // 회원 전용 화면 — 색인 제외
};

// 영어판 피드. 본체는 한글판과 동일 컴포넌트(내부에서 /en 감지).
export { default } from "@/app/feed/page";
