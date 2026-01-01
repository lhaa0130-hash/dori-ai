import { createMetadata } from "@/lib/seo";
import SuggestionsClient from "./page.client";

export const metadata = createMetadata({
  title: "건의사항",
  description: "서비스 개선을 위한 의견을 자유롭게 남겨주세요.",
  path: "/suggestions",
});

export default function SuggestionsPage() {
  return <SuggestionsClient />;
}









