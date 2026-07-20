import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suggestions — illo",
  description: "Share ideas, report bugs and request features for illo.",
  robots: { index: false, follow: false }, // 입력 폼 — 색인 제외
};

// 영어판 건의사항. 본체는 한글판과 동일 컴포넌트(내부에서 /en 감지).
export { default } from "@/app/suggestion/page";
