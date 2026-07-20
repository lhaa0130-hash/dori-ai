import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — illo",
  description: "Friend requests, likes, comments, guestbook entries and messages in one place.",
  robots: { index: false, follow: false }, // 회원 전용 화면 — 색인 제외
};

// 영어판 알림함. 본체는 한글판과 동일 컴포넌트(내부에서 /en 감지).
export { default } from "@/app/notifications/page";
