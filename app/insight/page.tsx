import { getSortedPostsData } from "@/lib/posts";
import InsightList from "@/components/insight/InsightList";

// ★ InsightList.tsx가 요구하는 Post 타입을 여기에 명시 (Type Safety 확보)
type Post = {
  id: string;
  title: string;
  date: string;
  category: string;
  thumbnail?: string;
};

export default function InsightPage() {
  // 1. 서버(내 컴퓨터)에서 posts 폴더의 파일들을 읽어옴
  // ★ as Post[]로 타입 보장 (TypeScript 컴파일러 만족)
  const allPosts = getSortedPostsData() as Post[];

  // 2. 읽어온 데이터를 InsightList 컴포넌트(클라이언트)에게 전달
  return (
    <InsightList posts={allPosts} />
  );
}