import { createMetadata } from "@/lib/seo";
import IlloPageClient from "./page.client";

export const metadata = {
  ...createMetadata({
    title: "워키 (Worki) — 혼자서도, 일이 되는 곳",
    description: "AI 직원을 불러와 지시하고 내 사업·콘텐츠·사이트를 굴리는 1인용 AI 사무실.",
    path: "/illo",
  }),
  robots: { index: false, follow: false },
};

export default async function IlloPage() {
  return <IlloPageClient />;
}
