import { createMetadata } from "@/lib/seo";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminClient from "./page.client";

const ADMIN_EMAILS = [
  "admin@dori.ai", 
  "lhaa0130@gmail.com",
];

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description: "DORI-AI 서비스 관리자 대시보드",
  path: "/admin",
  robots: { index: false, follow: false },
});

export default async function Page() {
  // 서버 사이드에서 인증 확인
  const session = await getServerSession({
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
  });
  
  if (!session || !session.user?.email) {
    redirect("/");
  }
  
  const userEmail = session.user.email.toLowerCase();
  const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);
  
  if (!isAdmin) {
    redirect("/");
  }
  
  return <AdminClient />;
}