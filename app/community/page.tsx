import { createMetadata } from "@/lib/seo";
import CommunityClient from "./page.client";

export const metadata = createMetadata({
  title: "Community",
  description: "자유롭게 질문하고 정보를 공유하는 공간입니다.",
  path: "/community",
});

export default function Page() {
  return <CommunityClient />;
}