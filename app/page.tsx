import { createMetadata } from "@/lib/seo";
import HomePageClient from "./page.client";

export const metadata = createMetadata({
  title: "홈",
  description: "작은 시작을 함께 만들어갑니다(DORI-AI).",
  path: "/",
});

export default async function Page() {
  return <HomePageClient />;
}