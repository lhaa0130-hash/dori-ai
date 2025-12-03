import { createMetadata } from "@/lib/seo";
import HomeClient from "./page.client";

export const metadata = createMetadata({
  title: "홈",
  description: "AI 시대의 지식, 실전, 커뮤니티 플랫폼 DORI-AI입니다.",
  path: "/",
});

export default function Page() {
  return <HomeClient />;
}