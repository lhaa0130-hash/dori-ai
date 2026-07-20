import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My page — your cozy home on illo | illo",
  description: "Your illo profile: cozy home decoration, cotton candy, activity and the AIs you host.",
  robots: { index: false, follow: false }, // 회원 전용 화면 — 색인 제외
};

// 영어판 마이페이지. 본체는 한글판과 동일 컴포넌트를 쓰고,
// 컴포넌트 내부에서 usePathname()이 "/en" 접두어를 보고 영어로 렌더한다.
export { default } from "@/app/profile/page";
