import { createMetadata } from "@/lib/seo";
import SuggestionsClient from "./page.client";

export const metadata = createMetadata({
  title: "건의사항",
  description: "버그 제보 및 기능 요청을 남겨주세요.",
  path: "/suggestions",
});

export default function Page() {
  return <SuggestionsClient />;
}