import { createMetadata } from "@/lib/seo";
import CreationsClient from "./page.client";

export const metadata = {
  ...createMetadata({
    title: "친구들이 만든 동물 — 몽글로 동물도감",
    description: "회원들이 상상해서 만든 나만의 동물들을 구경해요. 마음에 드는 동물에 좋아요를 눌러보세요.",
    path: "/animal/creations",
  }),
};

export default function Page() {
  return <CreationsClient />;
}
