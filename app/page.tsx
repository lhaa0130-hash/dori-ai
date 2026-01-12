import { createMetadata } from "@/lib/seo";
import HomePageClient from "./page.client";
import { sql } from "@vercel/postgres"; //

export const metadata = createMetadata({
  title: "홈",
  description: "작은 시작을 함께 만들어갑니다(DORI-AI).",
  path: "/",
});

export default async function Page() {
  // 1. 데이터베이스에서 최신 글 10개를 가져옵니다.
  // n8n에서 저장한 'posts' 테이블에서 최신순으로 정렬합니다.
  const { rows: posts } = await sql`
    SELECT * FROM posts 
    ORDER BY created_at DESC 
    LIMIT 10
  `;

  // 2. 가져온 데이터(posts)를 클라이언트 컴포넌트로 넘겨줍니다.
  return <HomePageClient initialPosts={posts} />;
}