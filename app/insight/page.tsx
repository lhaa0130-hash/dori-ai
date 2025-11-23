import { getSortedPostsData } from "@/lib/posts";
import InsightList from "@/components/insight/InsightList";

export default function InsightPage() {
  // 1. 서버(내 컴퓨터)에서 posts 폴더의 파일들을 읽어옴
  const allPosts = getSortedPostsData();

  // 2. 읽어온 데이터를 InsightList 컴포넌트(클라이언트)에게 전달
  return (
    <InsightList posts={allPosts} />
  );
}