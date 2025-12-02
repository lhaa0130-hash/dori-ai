import { TEXTS } from "@/constants/texts";

export type SuggestionType = "버그 제보" | "기능 요청" | "UI/디자인" | "기타";
export type SuggestionPriority = "낮음" | "보통" | "높음";

export type SuggestionItem = {
  id: string;
  name: string;
  email?: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  message: string;
  needsReply: boolean;
  createdAt: string;
};

interface AdminRecentSuggestionsProps {
  suggestions: SuggestionItem[];
}

export default function AdminRecentSuggestions({ suggestions }: AdminRecentSuggestionsProps) {
  const t = TEXTS.admin.sections;

  const cardStyle = {
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--card-border)',
    color: 'var(--text-main)',
  };

  const getPriorityBadge = (priority: SuggestionPriority) => {
    switch (priority) {
      case "높음": return "text-red-500 bg-red-50 dark:bg-red-900/20";
      case "보통": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      case "낮음": return "text-green-600 bg-green-50 dark:bg-green-900/20";
    }
  };

  return (
    <div className="p-6 rounded-[1.5rem] border shadow-sm" style={cardStyle}>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        📫 {t.recentSuggestions.ko}
      </h3>

      {suggestions.length === 0 ? (
        <p className="opacity-50 text-center py-10">데이터가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {suggestions.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--card-border)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 opacity-80">
                    {item.type}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getPriorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
                <span className="text-[10px] opacity-40">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm line-clamp-1 mb-2 opacity-90">{item.message}</p>
              <div className="flex justify-between items-center text-xs opacity-60">
                <span>{item.name}</span>
                {item.needsReply && <span className="text-blue-500 font-bold">답변 필요</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}