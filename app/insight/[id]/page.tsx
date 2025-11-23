import { getPostData } from "@/lib/posts";
import InsightDetail from "@/components/insight/InsightDetail";

// Next.js 15+ 버전용 params 타입
export default async function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // URL에서 id 가져오기
  const { id } = await params;
  
  // lib/posts.ts의 함수를 사용해 해당 md 파일 읽어오기
  const postData = await getPostData(id);

  // 클라이언트 컴포넌트에 데이터 전달
  return <InsightDetail postData={postData} />;
}