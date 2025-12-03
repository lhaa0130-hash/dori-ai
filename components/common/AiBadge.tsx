import { AiMeta } from "@/types/content";

interface AiBadgeProps {
  aiMeta?: AiMeta;
}

export function AiBadge({ aiMeta }: AiBadgeProps) {
  if (!aiMeta) return null;

  const { creationType, tools } = aiMeta;

  // 타입별 스타일 및 텍스트
  let badgeClass = "";
  let label = "";

  switch (creationType) {
    case "human_only":
      badgeClass = "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/10 dark:text-gray-300 dark:border-white/20";
      label = "👤 Human Only";
      break;
    case "ai_assisted":
      badgeClass = "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
      label = "🤖 AI Assisted";
      break;
    case "ai_generated":
      badgeClass = "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800";
      label = "✨ AI Generated";
      break;
  }

  return (
    <div className="flex flex-col items-start gap-1 mt-2">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
        {label}
      </span>
      {tools && tools.length > 0 && (
        <span className="text-[10px] opacity-50 ml-1">
          with {tools.join(", ")}
        </span>
      )}
    </div>
  );
}