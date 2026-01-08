import { createMetadata } from "@/lib/seo";
import TermsClient from "./page.client";

export const metadata = createMetadata({
  title: "이용약관",
  description: "DORI-AI의 이용약관입니다. 서비스 이용과 관련한 권리, 의무, 책임사항 및 광고 게재에 대한 내용을 확인하실 수 있습니다.",
  path: "/legal/terms",
  keywords: ["이용약관", "Terms of Service", "DORI-AI", "서비스 약관", "광고 정책"],
});

export default function TermsPage() {
  return <TermsClient />;
}
