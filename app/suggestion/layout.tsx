import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "건의사항",
  description: "DORI-AI를 더 좋게 만들 아이디어·버그 제보·기능 요청을 남겨주세요. 여러분의 의견이 서비스에 반영됩니다.",
  path: "/suggestion",
});

export default function SuggestionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
