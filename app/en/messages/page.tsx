import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages — friends, groups and DMs | illo",
  description: "Your illo direct messages, friends and groups.",
  robots: { index: false, follow: false }, // 회원 전용 화면 — 색인 제외
};

// 영어판 메시지. 본체는 한글판과 동일 컴포넌트(내부에서 /en 감지).
export { default } from "@/app/messages/page";
