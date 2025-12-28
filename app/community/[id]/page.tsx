import { Metadata } from "next";
import CommunityPostDetail from "./page.client";

export const metadata: Metadata = {
  title: "커뮤니티 글",
  description: "커뮤니티 글 상세보기",
};

export default function CommunityPostPage() {
  return <CommunityPostDetail />;
}
