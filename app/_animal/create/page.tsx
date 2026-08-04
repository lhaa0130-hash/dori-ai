import { createMetadata } from "@/lib/seo";
import CreateAnimalClient from "./page.client";

export const metadata = {
  ...createMetadata({
    title: "나만의 동물 만들기 — 몽글로 동물도감",
    description: "상상한 동물을 적으면 AI가 서식지·먹이·크기·수명까지 어울리게 만들어줘요. 하루 3마리까지, 피드에 자랑하고 내 프로필에 모아요.",
    path: "/animal/create",
  }),
};

export default function Page() {
  return <CreateAnimalClient />;
}
