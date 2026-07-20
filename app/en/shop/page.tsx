import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop — spend cotton candy on cozy home items | illo",
  description: "Spend the cotton candy you've earned on backgrounds, frames, name effects, titles and stickers to decorate your cozy home.",
  robots: { index: false, follow: false }, // 회원 전용 화면 — 색인 제외
};

// 영어판 상점. 본체는 한글판과 동일 컴포넌트(내부에서 /en 감지).
export { default } from "@/app/shop/page";
