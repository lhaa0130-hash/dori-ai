import { AI_TOOLS_DATA } from "@/constants/aiToolsData";
import AiToolsDetail from "@/components/ai-tools/AiToolsDetail";
import { notFound } from "next/navigation";

// 정적 경로 생성 (빌드 최적화)
export async function generateStaticParams() {
  return AI_TOOLS_DATA.map((tool) => ({
    id: tool.id,
  }));
}

interface Props {
  params: { id: string };
}

export default function AiToolDetailPage({ params }: Props) {
  const tool = AI_TOOLS_DATA.find((t) => t.id === params.id);

  if (!tool) {
    return notFound();
  }

  return (
    <main className="w-full min-h-screen" style={{ paddingTop: 0 }}>
      <AiToolsDetail tool={tool} />
    </main>
  );
}