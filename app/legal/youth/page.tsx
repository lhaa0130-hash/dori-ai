import { createMetadata } from "@/lib/seo";
import YouthClient from "./page.client";

export const metadata = createMetadata({
  hreflang: { ko: "/legal/youth", en: "/en/legal/youth" },
  title: "청소년보호정책",
  description: "illo의 청소년보호정책입니다. 청소년유해정보로부터 청소년을 보호하기 위한 조치, 신고 방법, 청소년보호책임자 정보를 안내합니다.",
  path: "/legal/youth",
  keywords: ["청소년보호정책", "청소년 보호", "유해정보 신고", "청소년보호책임자", "illo"],
});

export default function YouthPage() {
  return <YouthClient />;
}
