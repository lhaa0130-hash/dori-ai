import { createMetadata } from "@/lib/seo";
import RequireAdmin from "@/components/auth/RequireAdmin";
import OrgControlTower from "@/components/illo/OrgControlTower";

export const metadata = createMetadata({
  title: "AI 직원 관제탑 — illo.im AI 비서",
  description:
    "부서·팀·팀원을 노드로 만들고 팀원마다 AI 모델을 지정하는 AI 직원 조직도. illo.im 계정으로 로그인해 사용합니다.",
  path: "/ai-assistant/control-tower",
});

export default function ControlTowerPage() {
  return (
    <RequireAdmin>
      <OrgControlTower />
    </RequireAdmin>
  );
}
