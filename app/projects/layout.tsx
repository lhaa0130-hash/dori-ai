import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

// ⚠️ app/projects/page.tsx 는 "use client" 라서 metadata 를 export 할 수 없다.
//    그대로 두면 루트 layout 의 canonical(= https://illo.im)을 상속받아
//    /projects 가 홈페이지의 중복으로 판정된다("중복 페이지, Google에서 다른 표준을 선택함").
//    → 여기 서버 레이아웃에서 자기 자신을 가리키는 canonical 을 붙인다. (app/explore/layout.tsx 와 같은 패턴)
//    하위 /projects/[slug] 는 자체 generateMetadata 로 canonical 을 덮어쓰므로 영향 없다.
export const metadata: Metadata = createMetadata({
  title: "프로젝트 — illo가 직접 만드는 AI 서비스",
  description:
    "illo가 직접 기획·개발·운영하는 AI 서비스 모음. 1인 사업자를 위한 AI 비서 사무실, 건축 도면 보조, 가족 기록 허브 등 실제로 쓰는 도구들입니다.",
  path: "/projects",
  hreflang: { ko: "/projects", en: "/en/projects" },
  keywords: [
    "AI 프로젝트", "AI 서비스", "AI 비서", "illo 프로젝트",
    "AI 자동화 서비스", "1인 사업자 AI",
  ],
});

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
