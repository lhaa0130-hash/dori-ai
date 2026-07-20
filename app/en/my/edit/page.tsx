import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit profile — illo",
  description: "Update your illo nickname, bio, status message and profile photo.",
  robots: { index: false, follow: false }, // 회원 전용 화면 — 색인 제외
};

// 영어판 프로필 수정. 본체는 한글판과 동일 컴포넌트(내부에서 /en 감지).
export { default } from "@/app/my/edit/page";
