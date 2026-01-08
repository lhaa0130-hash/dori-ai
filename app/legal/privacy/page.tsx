import { createMetadata } from "@/lib/seo";
import PrivacyClient from "./page.client";

export const metadata = createMetadata({
  title: "개인정보처리방침",
  description: "DORI-AI의 개인정보 처리방침입니다. 수집하는 개인정보 항목, 이용 목적, 보유 기간, 쿠키 및 광고 관련 개인정보 처리에 대한 내용을 확인하실 수 있습니다.",
  path: "/legal/privacy",
  keywords: ["개인정보처리방침", "Privacy Policy", "DORI-AI", "쿠키 정책", "광고 정책"],
});

export default function PrivacyPage() {
  return <PrivacyClient />;
}
