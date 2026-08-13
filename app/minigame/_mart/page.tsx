import type { Metadata } from "next";
import MartGame from "./MartGame";
import "./mart.css";

export const metadata: Metadata = {
  title: "illo : MART | illo : play",
  description: "뒤섞인 상품을 선반별로 정리해 오늘의 주문을 완성하는 모바일 소트 퍼즐.",
  alternates: { canonical: "/minigame/mart" },
};

export default function MartPage() {
  return <MartGame />;
}

