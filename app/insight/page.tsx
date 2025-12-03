import { createMetadata } from "@/lib/seo";
import InsightClient from "./page.client";

export const metadata = createMetadata({
  title: "Insight",
  description: "AI 트렌드, 개념, 수익화 전략 등 깊이 있는 인사이트.",
  path: "/insight",
});

export default function Page() {
  return <InsightClient />;
}