import { createMetadata } from "@/lib/seo";
import AcademyClient from "./page.client";

export const metadata = createMetadata({
  title: "Academy",
  description: "AI 활용법과 튜토리얼 강의를 만나보세요.",
  path: "/academy",
});

export default function Page() {
  return <AcademyClient />;
}