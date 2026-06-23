import { createMetadata } from "@/lib/seo";
import TraderClient from "./page.client";
import RequireAuth from "@/components/auth/RequireAuth";
import ProjectSync from "@/components/auth/ProjectSync";

// 관심종목·탭 설정을 계정에 저장
const TRADER_KEYS = ["trader_favs", "trader_tab"];

export const metadata = createMetadata({
  title: "트레이더일로 (Trader Illo)",
  description: "AI 자동매매 트레이더일로의 성과를 매일 공개합니다. 손실 최소·수익 최대를 추구하지만 투자에 완벽은 없습니다.",
  path: "/trader",
});

export default function Page() {
  return (
    <RequireAuth>
      <ProjectSync project="trader" keys={TRADER_KEYS} />
      <TraderClient />
    </RequireAuth>
  );
}
