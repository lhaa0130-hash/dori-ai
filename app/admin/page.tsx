import { createMetadata } from "@/lib/seo";
import AdminClient from "./page.client";

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description: "DORI-AI 서비스 관리자 대시보드",
  path: "/admin",
  robots: { index: false, follow: false },
});

export default async function Page() {
  // 클라이언트 사이드에서 인증 확인 (page.client.tsx에서 처리)
  return <AdminClient />;
}