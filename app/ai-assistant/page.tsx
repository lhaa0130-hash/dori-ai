import { createMetadata } from "@/lib/seo";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ProjectSync from "@/components/auth/ProjectSync";
import IlloWebClient from "@/app/illo/app/page.client";

const AI_ASSISTANT_KEYS = ["illo_results_v1", "illo.web.homeWidgets"];

export const metadata = createMetadata({
  title: "AI 비서 — illo.im 계정으로 바로 쓰는 AI 사무실",
  description:
    "illo.im 계정으로 로그인해 글쓰기·조사·마케팅·고객응대 워크플로우를 실행하는 AI 비서 오픈 베타입니다.",
  path: "/ai-assistant",
});

export default function AiAssistantPage() {
  return (
    <RequireAdmin>
      <ProjectSync project="workillo" keys={AI_ASSISTANT_KEYS} />
      <IlloWebClient />
    </RequireAdmin>
  );
}
