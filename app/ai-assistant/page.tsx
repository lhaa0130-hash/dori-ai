import { createMetadata } from "@/lib/seo";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ProjectSync from "@/components/auth/ProjectSync";
import IlloWebClient from "@/app/illo/app/page.client";

const AI_ASSISTANT_KEYS = ["illo_results_v1", "illo.web.homeWidgets"];

export const metadata = createMetadata({
  title: "대리인 : AI비서 — illo.im 계정으로 바로 쓰는 AI 사무실",
  description:
    "대리인은 illo.im 계정으로 로그인해 AI 부서·직원을 꾸리고 글쓰기·조사·마케팅·고객응대를 실행하는 AI 비서 사무실입니다.",
  path: "/ai-assistant",
  noIndex: true, // 로그인 필요 앱 셸 — 크롤러엔 "확인 중…"만 보임
});

export default function AiAssistantPage() {
  return (
    <RequireAdmin>
      <ProjectSync project="workillo" keys={AI_ASSISTANT_KEYS} />
      <IlloWebClient />
    </RequireAdmin>
  );
}
