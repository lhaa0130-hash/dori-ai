"use client";
// 임시 미리보기 — 배포 전 반드시 삭제
import OrgControlTower from "@/components/illo/OrgControlTower";

export default function TPrev() {
  return <OrgControlTower embedded callModel={async () => "임시"} onAutomate={() => {}} />;
}
