import { createMetadata } from "@/lib/seo";

// 마이월드는 회원 전용 개인 공간이다. robots.ts 에서 /my-world 를 차단하고 있어 색인되지 않지만,
// 브라우저 탭·공유 링크에 쓰이므로 제목은 제대로 둔다(이전엔 layout 이 없어 기본 제목이 나왔다).
export const metadata = createMetadata({
  title: "마이월드",
  description: "내 캐릭터와 방을 꾸미고, 방명록·기록·프로필을 한곳에서 관리하는 나만의 공간.",
  path: "/my-world",
  noIndex: true,
});

export default function MyWorldLayout({ children }: { children: React.ReactNode }) {
  return children;
}
