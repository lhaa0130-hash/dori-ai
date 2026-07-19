import { createMetadata } from "@/lib/seo";
import CopyrightClient from "./page.client";

export const metadata = createMetadata({
  hreflang: { ko: "/legal/copyright", en: "/en/legal/copyright" },
  title: "저작권·라이선스 안내",
  description: "illo 콘텐츠의 저작권 귀속, AI 생성 콘텐츠 투명 고지, 오픈소스·서드파티 라이선스(Pretendard·lucide 등), 저작권 침해 신고 방법을 안내합니다.",
  path: "/legal/copyright",
  keywords: ["저작권", "라이선스", "AI 생성물 고지", "오픈소스 라이선스", "illo"],
});

export default function CopyrightPage() {
  return <CopyrightClient />;
}
