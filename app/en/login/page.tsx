import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — illo",
  description: "Sign in or create an illo account to save your work, decorate your cozy home and join the community.",
  robots: { index: false, follow: false }, // 인증 화면 — 색인 제외(한글판과 동일 방침)
};

// 영어판 로그인. 본체는 한글판과 동일 컴포넌트를 쓰고,
// 컴포넌트 내부에서 pathname 이 "/en/" 으로 시작하면 영어로 렌더한다.
export { default } from "@/app/login/page";
